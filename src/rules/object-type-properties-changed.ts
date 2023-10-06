import ts from "typescript";
import {
  isClass,
  isInterface,
  isTypeLiteral,
} from "../engines/typescript/symbol-kind";
import { Rule, RuleResult } from "../types";
import { getResolvedType } from "../engines/typescript/resolve-type-structure";
import { isPropertyPrivate } from "../engines/typescript/is-property-private";

const rule: Rule = {
  name: "symbol-kind-changed",
  description:
    "Symbol kind changed between value (let, const, class, function) and type (interace, type alias, etc.)",
  async check(context) {
    const {
      typescript: { base, target },
    } = context;

    const results: RuleResult = {
      minChangeType: "none",
      messages: [],
    };

    const baseSymbolMap = new Map(base.exports.map((e) => [e.escapedName, e]));
    const targetSymbolMap = new Map(
      target.exports.map((e) => [e.escapedName, e])
    );

    for (const [name, baseExport] of baseSymbolMap) {
      if (isObjectType(baseExport)) {
        const targetExport = targetSymbolMap.get(name);
        if (!targetExport) {
          continue;
        }

        const baseExportType = getTypeOfExport(baseExport, base.checker);
        const targetExportType = getTypeOfExport(targetExport, target.checker);

        if (!baseExportType || !targetExportType) {
          throw new Error(`unable to determine type of the export: ${name}`);
        }

        const baseProps = collectProperties(baseExportType, base.checker);
        const targetProps = collectProperties(targetExportType, target.checker);

        for (const [name, baseProp] of Object.entries(baseProps)) {
          const targetProp = targetProps[name];
          if (!targetProp) {
            results.minChangeType = "major";
            results.messages.push(`Property ${name} has been removed`);
            continue;
          }

          const result = comparePropertyTypes(
            name,
            {
              type: baseProp,
              checker: base.checker,
              program: base.program,
            },
            {
              type: targetProp,
              checker: target.checker,
              program: target.program,
            }
          );

          if (result) {
            results.minChangeType = "major";
            results.messages.push(result.message);
          }
        }
      }
    }

    return results;
  },
};

function isObjectType(symbol: ts.Symbol) {
  return isClass(symbol) || isInterface(symbol) || isTypeLiteral(symbol);
}

function getTypeOfExport(exportSymbol: ts.Symbol, checker: ts.TypeChecker) {
  // Find the declaration from baseExport that is a type
  let typeDeclaration: ts.Declaration;
  for (const declaration of exportSymbol.declarations) {
    if (
      ts.isTypeAliasDeclaration(declaration) ||
      ts.isInterfaceDeclaration(declaration) ||
      ts.isClassDeclaration(declaration) ||
      ts.isTypeLiteralNode(declaration)
    ) {
      typeDeclaration = declaration;
    }
  }

  if (typeDeclaration) {
    return checker.getTypeAtLocation(typeDeclaration);
  }
}

// Recursively collect all properties of a type
function collectProperties(type: ts.Type, checker: ts.TypeChecker) {
  const properties: Record<string, ts.Type> = {};
  type
    .getProperties()
    .sort((a, b) => (a.escapedName > b.escapedName ? 1 : -1))
    .forEach((property) => {
      if (isPropertyPrivate(property)) {
        return;
      }

      const propertyType = checker.getTypeOfSymbol(property);
      properties[property.name] = propertyType;
    });

  return properties;
}

export default rule;

function comparePropertyTypes(
  name: string,
  base: { type: ts.Type; checker: ts.TypeChecker; program: ts.Program },
  target: { type: ts.Type; checker: ts.TypeChecker; program: ts.Program }
) {
  const baseTypeString = getResolvedType(base.type, base.checker, base.program);
  const targetTypeString = getResolvedType(
    target.type,
    target.checker,
    target.program
  );

  if (baseTypeString !== targetTypeString) {
    return {
      minChangeType: "major",
      message: `Property ${name} has changed type from ${baseTypeString} to ${targetTypeString}`,
    };
  }
}

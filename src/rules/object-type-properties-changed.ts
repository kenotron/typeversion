import ts from "typescript";
import {
  isClass,
  isInterface,
  isTypeLiteral,
} from "../engines/typescript/symbol-kind";
import { Rule, RuleResult } from "../types";
import jsonDiff from "json-diff";
import { getResolvedType } from "../engines/typescript/resolve-type-structure";
import { isPropertyPrivate } from "../engines/typescript/is-property-private";

/** Tree structure that represents the public & protected members for exports that are ObjectTypes  */
type PropertyNode = {
  name: string;
  type: string;
  children: PropertyNode[];
};

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

        const baseExportDeclaration = getTypeDeclarationOfExport(baseExport);
        const baseExportType = base.checker.getTypeAtLocation(
          baseExportDeclaration
        );

        const basePropertyNode: PropertyNode = {
          name: baseExport.name,
          type: base.checker.typeToString(baseExportType),
          children: [],
        };

        collectProperties(basePropertyNode, baseExportType, base.checker, base.program);

        const targetExportDeclaration =
          getTypeDeclarationOfExport(targetExport);
        const targetExportType = target.checker.getTypeAtLocation(
          targetExportDeclaration
        );

        const targetPropertyNode: PropertyNode = {
          name: targetExport.name,
          type: target.checker.typeToString(targetExportType),
          children: [],
        };

        collectProperties(targetPropertyNode, targetExportType, target.checker, target.program);

        const diff = jsonDiff.diff(basePropertyNode, targetPropertyNode, {
          full: true,
        });

        // console.log(JSON.stringify(diff, null, 2));
      }
    }

    return results;
  },
};

function isObjectType(symbol: ts.Symbol) {
  return isClass(symbol) || isInterface(symbol) || isTypeLiteral(symbol);
}

function getTypeDeclarationOfExport(exportSymbol: ts.Symbol) {
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
  return typeDeclaration;
}

// Recursively collect all properties of a type
function collectProperties(
  propertyNode: PropertyNode,
  type: ts.Type,
  checker: ts.TypeChecker,
  program: ts.Program
) {
  type
    .getProperties()
    .sort((a, b) => (a.escapedName > b.escapedName ? 1 : -1))
    .forEach((property) => {
      if (isPropertyPrivate(property)) {
        return;
      }

      const propertyType = checker.getTypeOfSymbol(property);

      console.log(property.name, getResolvedType(propertyType, checker, program));

      // const child: PropertyNode = {
      //   name: property.name,
      //   type: checker.typeToString(propertyType),
      //   children: [],
      // };

      // propertyNode.children.push(child);

      // if (!!(propertyType.getFlags() & ts.TypeFlags.Object)) {
      //   child.type = "Object";
      //   collectProperties(child, propertyType, checker, program);
      // }
    });
}

export default rule;

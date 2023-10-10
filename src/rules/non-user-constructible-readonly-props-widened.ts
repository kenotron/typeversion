import ts from "typescript";
import { TypeInformer } from "../engines/typescript/type-informer";
import { Rule, RuleResult } from "../types";
import { collectProperties } from "../engines/typescript/collect-properties-of-object-type";

const rule: Rule = {
  name: "user-constructible-required-properties-added",
  description:
    "User constructible types (interface, type alias) that have new required properties added",
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

    const baseInformer = new TypeInformer(base.checker);
    const targetInformer = new TypeInformer(target.checker);

    for (const [name, baseExport] of baseSymbolMap) {
      const baseExportType = baseInformer.getTypeOfExport(baseExport);
      if (!baseInformer.isUserConstructible(baseExportType)) {
        const targetExport = targetSymbolMap.get(name);
        if (!targetExport) {
          continue;
        }

        const targetExportType = targetInformer.getTypeOfExport(targetExport);

        if (!baseExportType || !targetExportType) {
          throw new Error(`unable to determine type of the export: ${name}`);
        }

        const baseProps = collectProperties(baseExportType, base.checker);
        const targetProps = collectProperties(targetExportType, target.checker);

        // Check for readonly + widened properties
        for (const [propName, targetProp] of Object.entries(targetProps)) {
          const baseProp = baseProps[propName];
          // check if the property is readonly
          if (
            ts.isPropertyDeclaration(baseProp.symbol.valueDeclaration) &&
            ts.getModifiers(baseProp.symbol.valueDeclaration)
          ) {
            // check if the property is widened
            if (baseProp.type && targetProp.type) {
              if (isWidened(baseProp.type, targetProp.type)) {
                results.minChangeType = "major";
                results.messages.push(
                  `The readonly property \`${propName}\` of \`${name}\` has been widened from \`${base.checker.typeToString(
                    baseProp.type
                  )}\` to \`${target.checker.typeToString(targetProp.type)}\`.`
                );
              }
            }
          }
        }
      }
    }

    return results;
  },
};

function isWidened(base: ts.Type, target: ts.Type) {
  // cannot widen from any
  if (base.flags & ts.TypeFlags.Any) {
    return false;
  }

  // if target is now an any or unknown but the base is not
  if (
    target.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown) &&
    !(base.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown))
  ) {
    return true;
  }

  // if a type went from a non-union to a union
  if (target.flags & ts.TypeFlags.Union && !(base.flags & ts.TypeFlags.Union)) {
    return true;
  }

  // if the base is a union type, check if the target is a superset of the base
  if (base.flags & ts.TypeFlags.Union) {
    const unionBase = base as ts.UnionType;

    // check if target has more types than base
    return unionBase.types.every((t) => isWidened(t, target));
  }
}

export default rule;

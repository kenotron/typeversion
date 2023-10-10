import ts from "typescript";
import { Rule, RuleResult } from "../types";
import { getResolvedType } from "../engines/typescript/resolve-type-structure";
import { collectProperties } from "../engines/typescript/collect-properties-of-object-type";
import { TypeInformer } from "../engines/typescript/type-informer";

const rule: Rule = {
  name: "symbol-kind-changed",
  description:
    "Object type properties that have changed in the types or have been removed",
  async check(context) {
    const {
      typescript: { base, target },
    } = context;

    const results: RuleResult = {
      minChangeType: "none",
      messages: [],
    };

    const baseInformer = new TypeInformer(base.checker);
    const targetInformer = new TypeInformer(target.checker);

    const baseSymbolMap = new Map(base.exports.map((e) => [e.escapedName, e]));
    const targetSymbolMap = new Map(
      target.exports.map((e) => [e.escapedName, e])
    );

    for (const [name, baseExport] of baseSymbolMap) {
      const baseExportType = baseInformer.getTypeOfExport(baseExport);
      if (baseInformer.isObjectType(baseExportType)) {
        const targetExport = targetSymbolMap.get(name);
        if (!targetExport) {
          continue;
        }

        const baseExportType = baseInformer.getTypeOfExport(baseExport);
        const targetExportType = targetInformer.getTypeOfExport(targetExport);

        if (!baseExportType || !targetExportType) {
          throw new Error(`unable to determine type of the export: ${name}`);
        }

        const baseProps = collectProperties(baseExportType, base.checker);
        const targetProps = collectProperties(targetExportType, target.checker);

        // Check for changes in property types
        for (const [propName, baseProp] of Object.entries(baseProps)) {
          const targetProp = targetProps[propName];
          if (!targetProp) {
            results.minChangeType = "major";
            results.messages.push(
              `Property "${propName}" has been removed from "${name}`
            );
            continue;
          }

          const result = comparePropertyTypes(
            propName,
            {
              type: baseProp.type,
              checker: base.checker,
              program: base.program,
            },
            {
              type: targetProp.type,
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
      message: `Property "${name}" has changed type from "${baseTypeString}" to "${targetTypeString}"`,
    };
  }
}

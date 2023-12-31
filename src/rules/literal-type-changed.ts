import ts from "typescript";
import { Rule, RuleResult } from "../types";
import { getResolvedType } from "../engines/typescript/resolve-type-structure";
import { collectProperties } from "../engines/typescript/collect-properties-of-object-type";
import { TypeInformer } from "../engines/typescript/type-informer";

const rule: Rule = {
  name: "literal-type-changed",
  description: "Object type properties that have changed in the types or have been removed",
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
    const targetSymbolMap = new Map(target.exports.map((e) => [e.escapedName, e]));

    for (const [name, baseExport] of baseSymbolMap) {
      const baseExportType = baseInformer.getTypeOfExport(baseExport);
      if (!baseInformer.isObjectType(baseExportType)) {
        const targetExport = targetSymbolMap.get(name);
        if (!targetExport) {
          continue;
        }

        const targetExportType = targetInformer.getTypeOfExport(targetExport);

        const baseTypeString = getResolvedType(baseExportType, base.checker, base.program);
        const targetTypeString = getResolvedType(targetExportType, target.checker, target.program);

        if (baseTypeString !== targetTypeString) {
          results.minChangeType = "major";
          results.messages.push(`Export "${name}" symbol changed from ${baseTypeString} to ${targetTypeString}`);
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
  const targetTypeString = getResolvedType(target.type, target.checker, target.program);

  if (baseTypeString !== targetTypeString) {
    return {
      minChangeType: "major",
      message: `Property "${name}" has changed type from "${baseTypeString}" to "${targetTypeString}"`,
    };
  }
}

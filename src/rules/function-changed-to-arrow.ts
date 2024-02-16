import ts from "typescript";
import { TypeInformer } from "../engines/typescript/type-informer";
import { Rule, RuleResult } from "../types";

const rule: Rule = {
  name: "function-changed-to-arrow",
  description: "Function params and return type that have changed in the types or have been removed",
  async check(context) {
    const {
      typescript: { base, target, checker },
    } = context;

    const results: RuleResult = {
      minChangeType: "none",
      messages: [],
    };

    const baseInformer = new TypeInformer(checker);
    const targetInformer = new TypeInformer(checker);

    const baseSymbolMap = new Map(base.exports.map((e) => [e.escapedName, e]));
    const targetSymbolMap = new Map(target.exports.map((e) => [e.escapedName, e]));

    for (const [name, baseExport] of baseSymbolMap) {
      const baseExportType = baseInformer.getTypeOfExport(baseExport);
      const targetExport = targetSymbolMap.get(name);
      if (!targetExport) {
        continue;
      }

      const targetExportType = targetInformer.getTypeOfExport(targetExport);

      if (baseInformer.isFunction(baseExportType)) {
        if (isArrowFunction(baseExportType.symbol.declarations) !== isArrowFunction(targetExportType.symbol.declarations)) {
          results.minChangeType = "major";
          results.messages.push(
            `Function "${name}": changed from ${isArrowFunction(baseExport.declarations) ? "arrow function" : "regular function"} to ${
              isArrowFunction(targetExport.declarations) ? "arrow function" : "regular function"
            }`
          );
        }
      }
    }

    return results;
  },
};

function isArrowFunction(declarations: ts.Declaration[]) {
  for (const declaration of declarations) {
    if (ts.isArrowFunction(declaration)) {
      return true;
    }
  }
  return false;
}

export default rule;

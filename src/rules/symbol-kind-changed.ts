import { TypeInformer } from "../engines/typescript/type-informer";
import { Rule, RuleResult } from "../types";

const rule: Rule = {
  name: "symbol-kind-changed",
  description: "Symbol kind changed between value (let, const, class, function) and type (interace, type alias, etc.)",
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
      const targetExport = targetSymbolMap.get(name);
      if (!targetExport) {
        continue;
      }

      const baseExportType = baseInformer.getTypeOfExport(baseExport);
      const targetExportType = targetInformer.getTypeOfExport(targetExport);

      if (baseInformer.isTypeSymbol(baseExport) !== targetInformer.isTypeSymbol(targetExport)) {
        results.minChangeType = "major";
        results.messages.push(
          `Export "${name}" symbol kind changed from a ${baseInformer.isTypeSymbol(baseExport) ? "" : "non-"}type symbol to a ${
            baseInformer.isTypeSymbol(baseExport) ? "non-" : ""
          }type symbol`
        );
      }

      if (baseInformer.isValueSymbol(baseExport) !== targetInformer.isValueSymbol(targetExport)) {
        results.minChangeType = "major";
        results.messages.push(
          `Export "${name}" symbol kind changed from a ${baseInformer.isValueSymbol(baseExport) ? "" : "non-"}value symbol to a ${
            baseInformer.isValueSymbol(baseExport) ? "non-" : ""
          }value symbol`
        );
      }

      if (baseInformer.isInterface(baseExportType) && targetInformer.isTypeAlias(targetExportType)) {
        results.minChangeType = "major";
        results.messages.push(`Export "${name}" symbol from an interface to a type alias`);
      }

      if (
        baseInformer.isNamespace(baseExportType) !== targetInformer.isNamespace(targetExportType) ||
        baseInformer.isClass(baseExportType) !== targetInformer.isClass(targetExportType) ||
        baseInformer.isInterface(baseExportType) !== targetInformer.isInterface(targetExportType) ||
        baseInformer.isFunction(baseExportType) !== targetInformer.isFunction(targetExportType)
      ) {
        results.minChangeType = "major";
        results.messages.push(`Export "${name}" symbol has changed (namespace, class, interface, or function).`);
      }
    }

    return results;
  },
};

export default rule;

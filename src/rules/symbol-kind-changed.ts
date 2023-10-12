import { TypeInformer } from "../engines/typescript/type-informer";
import { Rule, RuleResult } from "../types";

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

    const baseInformer = new TypeInformer(base.checker);
    const targetInformer = new TypeInformer(target.checker);

    const baseSymbolMap = new Map(base.exports.map((e) => [e.escapedName, e]));
    const targetSymbolMap = new Map(
      target.exports.map((e) => [e.escapedName, e])
    );

    for (const [name, baseExport] of baseSymbolMap) {
      const targetExport = targetSymbolMap.get(name);
      if (!targetExport) {
        continue;
      }

      const baseExportType = baseInformer.getTypeOfExport(baseExport);
      const targetExportType = targetInformer.getTypeOfExport(targetExport);

      // value-only -> includes value
      if (!baseInformer.isCheckedType(baseExportType)) {
        if (targetInformer.isCheckedType(targetExportType)) {
          results.minChangeType = "major";
          results.messages.push(
            `Export "${name}" symbol from a value-only also be a type checked symbol`
          );
          continue;
        }
      }

      // type-only -> includes type
      if (!baseInformer.isValueType(baseExportType)) {
        if (targetInformer.isValueType(targetExportType)) {
          results.minChangeType = "major";
          results.messages.push(
            `Export "${name}" symbol from a type-only also be a value symbol`
          );
          continue;
        }
      }

      if (
        baseInformer.isValueType(baseExportType) &&
        baseInformer.isCheckedType(baseExportType)
      ) {
        if (
          !targetInformer.isValueType(targetExportType) ||
          !targetInformer.isCheckedType(targetExportType)
        ) {
          results.minChangeType = "major";
          results.messages.push(
            `Export "${name}" symbol from a value & type kind to a non-value or non-type kind`
          );
          continue;
        }
      }

      if (
        baseInformer.isInterface(baseExportType) &&
        targetInformer.isTypeAlias(targetExportType)
      ) {
        results.minChangeType = "major";
        results.messages.push(
          `Export "${name}" symbol from an interface to a type alias`
        );
        continue;
      }

      if (
        baseInformer.isNamespace(baseExportType) &&
        !targetInformer.isNamespace(targetExportType)
      ) {
        results.minChangeType = "major";
        results.messages.push(
          `Export "${name}" symbol from a namespace to a non-namespace`
        );
        continue;
      }

      if (
        (baseInformer.isClass(baseExportType) && !targetInformer.isClass(targetExportType)) ||
        (baseInformer.isInterface(baseExportType) && !targetInformer.isInterface(targetExportType)) ||
        (baseInformer.isFunction(baseExportType) && !targetInformer.isFunction(targetExportType))
      ) {
        results.minChangeType = "major";
        results.messages.push(
          `Export "${name}" symbol has changed from a class to a non-class, interface to a non-interface, or function to a non-function`
        );
        continue;
      }
    }

    return results;
  },
};

export default rule;

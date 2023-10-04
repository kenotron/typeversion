import {
  isCheckedType,
  isClass,
  isInterface,
  isNamespace,
  isTypeAlias,
  isValueType,
} from "../engines/typescript/symbol-kind";
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

    const baseSymbolMap = new Map(base.exports.map((e) => [e.escapedName, e]));
    const targetSymbolMap = new Map(
      target.exports.map((e) => [e.escapedName, e])
    );

    for (const [name, baseExport] of baseSymbolMap) {
      const targetExport = targetSymbolMap.get(name);

      if (!targetExport) {
        continue;
      }

      // value-only -> includes value
      if (!isCheckedType(baseExport)) {
        if (isCheckedType(targetExport)) {
          results.minChangeType = "major";
          results.messages.push(
            `Export "${name}" symbol from a value-only also be a type checked symbol`
          );
          continue;
        }
      }

      // type-only -> includes type
      if (!isValueType(baseExport)) {
        if (isValueType(targetExport)) {
          results.minChangeType = "major";
          results.messages.push(
            `Export "${name}" symbol from a type-only also be a value symbol`
          );
          continue;
        }
      }

      if (isValueType(baseExport) && isCheckedType(baseExport)) {
        if (!isValueType(targetExport) || !isCheckedType(targetExport)) {
          results.minChangeType = "major";
          results.messages.push(
            `Export "${name}" symbol from a value & type kind to a non-value or non-type kind`
          );
          continue;
        }
      }

      if (isInterface(baseExport) && isTypeAlias(targetExport)) {
        results.minChangeType = "major";
        results.messages.push(
          `Export "${name}" symbol from an interface to a type alias`
        );
        continue;
      }

      if (isNamespace(baseExport) && !isNamespace(targetExport)) {
        results.minChangeType = "major";
        results.messages.push(
          `Export "${name}" symbol from a namespace to a non-namespace`
        );
        continue;
      }

      if (
        isClass(baseExport) &&
        !isValueType(targetExport) &&
        isCheckedType(targetExport)
      ) {
        results.minChangeType = "major";
        results.messages.push(
          `Export "${name}" symbol from a class to type-only`
        );
        continue;
      }
    }

    return results;
  },
};

export default rule;

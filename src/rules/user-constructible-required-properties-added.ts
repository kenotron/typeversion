import ts from "typescript";
import {
  isClass,
  isInterface,
  isTypeLiteral,
  isUserConstructible,
} from "../engines/typescript/symbol-kind";
import { Rule, RuleResult } from "../types";
import { getResolvedType } from "../engines/typescript/resolve-type-structure";
import { isPropertyPrivate } from "../engines/typescript/is-property-private";
import { getTypeOfExport } from "../engines/typescript/get-type-of-export";
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

    for (const [name, baseExport] of baseSymbolMap) {
      const baseExportType = getTypeOfExport(baseExport, base.checker);
      if (isUserConstructible(baseExportType)) {
        const targetExport = targetSymbolMap.get(name);
        if (!targetExport) {
          continue;
        }

        
        const targetExportType = getTypeOfExport(targetExport, target.checker);

        if (!baseExportType || !targetExportType) {
          throw new Error(`unable to determine type of the export: ${name}`);
        }

        const baseProps = collectProperties(baseExportType, base.checker);
        const targetProps = collectProperties(targetExportType, target.checker);

        // Check for new required properties
        for (const [propName, targetProp] of Object.entries(targetProps)) {
          const baseProp = baseProps[propName];

          if (
            !baseProp &&
            !(targetProp.symbol.getFlags() & ts.SymbolFlags.Optional)
          ) {
            results.minChangeType = "major";
            results.messages.push(
              `New required property "${propName}" has been added to "${name}"`
            );
            continue;
          }
        }
      }
    }

    return results;
  },
};

export default rule;

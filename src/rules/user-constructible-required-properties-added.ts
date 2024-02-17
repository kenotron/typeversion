import ts from "typescript";
import { TypeInformer } from "../engines/typescript/type-informer";
import { Rule, RuleResult } from "../types";
import { collectProperties } from "../engines/typescript/collect-properties-of-object-type";

const rule: Rule = {
  name: "user-constructible-required-properties-added",
  description: "User constructible types (interface, type alias) that have new required properties added",
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
      if (baseInformer.isUserConstructible(baseExportType)) {
        const targetExport = targetSymbolMap.get(name);
        if (!targetExport) {
          continue;
        }

        const targetExportType = targetInformer.getTypeOfExport(targetExport);

        if (!baseExportType || !targetExportType) {
          throw new Error(`unable to determine type of the export: ${name}`);
        }

        const baseProps = collectProperties(baseExportType, checker);
        const targetProps = collectProperties(targetExportType, checker);

        // Check for new required properties
        for (const [propName, targetProp] of Object.entries(targetProps)) {
          const baseProp = baseProps[propName];

          if (!baseProp && !(targetProp.symbol.getFlags() & ts.SymbolFlags.Optional)) {
            results.minChangeType = "major";
            results.messages.push(`New required property "${propName}" has been added to "${name}"`);
            continue;
          }
        }
      }
    }

    return results;
  },
};

export default rule;

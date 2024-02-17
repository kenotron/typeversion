import ts from "typescript";
import { TypeInformer } from "../engines/typescript/type-informer";
import { Rule, RuleResult } from "../types";
import { collectProperties } from "../engines/typescript/collect-properties-of-object-type";
import { isWidened } from "../engines/typescript/is-widened";

const rule: Rule = {
  name: "non-user-contructible-readonly-props-widened",
  description: "Non-user constructible types (interface, type alias) that have widened readonly properties",
  async check(context) {
    const {
      typescript: { base, target, checker },
    } = context;

    const results: RuleResult = {
      minChangeType: "none",
      messages: [],
    };

    const baseSymbolMap = new Map(base.exports.map((e) => [e.escapedName, e]));
    const targetSymbolMap = new Map(target.exports.map((e) => [e.escapedName, e]));

    const baseInformer = new TypeInformer(checker);
    const targetInformer = new TypeInformer(checker);

    for (const [name, baseExport] of baseSymbolMap) {
      const baseExportType = baseInformer.getTypeOfExport(baseExport);
      if (!baseInformer.isUserConstructible(baseExportType) && baseInformer.isObjectType(baseExportType)) {
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

        // Check for readonly + widened properties
        for (const [propName, targetProp] of Object.entries(targetProps)) {
          const baseProp = baseProps[propName];
          // check if the property is readonly
          if (ts.getCombinedModifierFlags(baseProp.symbol.valueDeclaration) & ts.ModifierFlags.Readonly) {
            // check if the property is widened
            if (baseProp.type && targetProp.type) {
              if (isWidened(baseProp.type, baseInformer, targetProp.type, targetInformer)) {
                results.minChangeType = "major";
                results.messages.push(
                  `The readonly property "${propName}" of non-user-constructible type "${name}" has been widened from "${checker.typeToString(
                    baseProp.type
                  )}" to "${checker.typeToString(targetProp.type)}".`
                );
              }
            }

            // check if the property has changed from required to optional
            if (!(baseProp.symbol.getFlags() & ts.SymbolFlags.Optional) && targetProp.symbol.getFlags() & ts.SymbolFlags.Optional) {
              results.minChangeType = "major";
              results.messages.push(`readonly "${propName}" has been made optional in "${name}"`);
              continue;
            }
          }
        }
      }
    }

    return results;
  },
};

export default rule;

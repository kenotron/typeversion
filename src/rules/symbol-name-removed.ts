import { Rule, RuleResult } from "../types";

const rule: Rule = {
  name: "no-symbol-name-removed",
  description: "Prevent removing exported symbols",
  async check(context) {
    const {
      typescript: { base, target },
    } = context;

    const results: RuleResult = {
      minChangeType: "none",
      messages: [],
    };

    const baseExportedNames = new Set(base.exports.map((e) => e.escapedName));
    const targetExportedNames = new Set(target.exports.map((e) => e.escapedName));

    for (const baseExport of baseExportedNames) {
      const targetExport = targetExportedNames.has(baseExport);
      if (!targetExport) {
        results.minChangeType = "major";
        results.messages.push(
          `Export "${baseExport}" was removed from the target`
        );
      }
    }

    return results;
  },
};

export default rule;

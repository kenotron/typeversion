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

    const srcExportedNames = new Set(base.exports.map((e) => e.escapedName));
    const dstExportedNames = new Set(target.exports.map((e) => e.escapedName));

    for (const srcExport of srcExportedNames) {
      const dstExport = dstExportedNames.has(srcExport);
      if (!dstExport) {
        results.minChangeType = "major";
        results.messages.push(
          `Export ${srcExport} was removed from ${base.source} but not from ${target.source}`
        );
      }
    }

    return results;
  },
};

export default rule;

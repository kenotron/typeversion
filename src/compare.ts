import * as rules from "./rules";
import type { RuleResult } from "./types";
import { initializeContext } from "./engines/typescript/init";

export interface CompareOptions {
  base: {
    fileName: string;
    source: string;
  };
  target: {
    fileName: string;
    source: string;
  };
}

const changeTypeSizes = {
  none: 0,
  patch: 1,
  minor: 2,
  major: 3,
};

export async function compare(options: CompareOptions) {
  const { base, target } = options;

  const context = initializeContext({ base, target });

  const results = new Map<string, RuleResult>();
  const ruleNames = new Set<string>();

  for (const rule of Object.values(rules)) {
    // This is to keep the rule names unique: it seems that the author of this tool keeps forgetting about changing the NAME of the rule :)
    if (ruleNames.has(rule.name)) {
      throw new Error(`Duplicate rule name: ${rule.name}`);
    }

    ruleNames.add(rule.name);
    const result = await rule.check(context);
    results.set(rule.name, result);
  }

  return mergeResults(results);
}

function mergeResults(results: Map<string, RuleResult>) {
  const merged: RuleResult = {
    messages: [],
    minChangeType: "none",
  };

  for (const [name, result] of results) {
    if (changeTypeSizes[result.minChangeType] > changeTypeSizes[merged.minChangeType]) {
      merged.minChangeType = result.minChangeType;
    }

    for (const messages of result.messages) {
      merged.messages.push(`[${name}] ${messages}`);
    }
  }

  return merged;
}

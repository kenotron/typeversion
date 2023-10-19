import type { Rule, RuleResult } from "./types";

import { initializeContext } from "./engines/typescript/init";

import fs from "fs";
import path from "path";

const changeTypeSizes = {
  none: 0,
  patch: 1,
  minor: 2,
  major: 3,
};

export async function compare(options: {
  base: {
    fileName: string;
    source: string;
  };
  target: {
    fileName: string;
    source: string;
  };
}) {
  const { base, target } = options;

  const context = initializeContext({ base, target });

  const results = new Map<string, RuleResult>();
  const rules = await getRules();
  const ruleNames = new Set<string>();

  for (const rule of rules) {
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

async function getRules() {
  const files = fs.readdirSync(path.join(__dirname, "rules"));
  const rules: Rule[] = [];
  for (const file of files) {
    const rule = (await import(path.join(__dirname, "rules", file))).default as Rule;

    rules.push(rule);
  }
  return rules;
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

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

  for (const rule of rules) {
    results.set(rule.name, await rule.check(context));
  }

  return mergeResults(results);
}

async function getRules() {
  const files = fs.readdirSync(path.join(__dirname, "rules"));
  const rules: Rule[] = [];
  for (const file of files) {
    const rule = (await import(path.join(__dirname, "rules", file)))
      .default as Rule;

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
    if (
      changeTypeSizes[result.minChangeType] >
      changeTypeSizes[merged.minChangeType]
    ) {
      merged.minChangeType = result.minChangeType;
    }

    for (const messages of result.messages) {
      merged.messages.push(`[${name}] ${messages}`);
    }
  }
  
  return merged;
}

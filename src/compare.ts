import type { Rule, RuleResult } from "./types";

import { initializeContext } from "./engines/typescript/init";

import fs from "fs";
import path from "path";

export async function compare(options: {
  root: string;
  base: string;
  target: string;
}) {
  const { base, target, root } = options;

  // TODO: 2.0 should include a way to add engines (e.g. GraphQL)
  const context = initializeContext({ root, base, target });

  const results: RuleResult[] = [];
  const rules = await getRules();

  for (const rule of rules) {
    results.push(await rule.check(context));
  }

  return results;
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

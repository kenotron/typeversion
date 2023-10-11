import type { Rule, RuleResult } from "./types";

import { initializeContext } from "./engines/typescript/init";

import fs from "fs";
import path from "path";

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

  // TODO: 2.0 should include a way to add engines (e.g. GraphQL)
  const context = initializeContext({ base, target });

  const results: RuleResult[] = [];
  const rules = await getRules();

  for (const rule of rules) {
    results.push(await rule.check(context));
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

function mergeResults(results: RuleResult[]) {
  return results.reduce(
    (acc, curr) => {
      if (curr.minChangeType === "major") {
        acc.minChangeType = "major";
      } else if (
        curr.minChangeType === "minor" &&
        acc.minChangeType !== "major"
      ) {
        acc.minChangeType = "minor";
      } else if (
        curr.minChangeType === "patch" &&
        acc.minChangeType === "none"
      ) {
        acc.minChangeType = "patch";
      }

      acc.messages = [...acc.messages, ...curr.messages];

      return acc;
    },
    { minChangeType: "none", messages: [] } as RuleResult
  );
}

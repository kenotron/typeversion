import fs from "fs";
import path from "path";
import { test, expect } from "@jest/globals";
import { compare } from "../compare";

export async function comapreHarness(group: string, testCase: string) {
  const testCasePath = getCasePath(group, testCase);

  const base = fs.readFileSync(path.join(testCasePath, "base.ts"), "utf-8");
  const target = fs.readFileSync(path.join(testCasePath, "target.ts"), "utf-8");

  const results = await compare({
    base: {
      fileName: "base.ts",
      source: base,
    },
    target: {
      fileName: "target.ts",
      source: target,
    },
  });

  expect(results).toMatchSnapshot();
}

export function getCasesByGroup(group: string) {
  const casePath = path.join(__dirname, "cases", group);
  return fs.readdirSync(casePath);
}

export function getCasePath(group: string, testCase: string) {
  return path.join(__dirname, "cases", group, testCase);
}

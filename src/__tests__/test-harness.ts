import { compare } from "../compare";
import path from "path";
import fs from "fs";
import { test, expect } from "@jest/globals";

export function testHarness(testCase: string) {
  test(`Test case "${testCase}"`, async () => {
    const testCasePath = path.join(__dirname, "cases", testCase);
    const base = fs.readFileSync(
      path.join(__dirname, "cases", testCase, "base.ts"),
      "utf-8"
    );
    const target = fs.readFileSync(
      path.join(testCasePath, "target.ts"),
      "utf-8"
    );

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

    const expected = (await import(path.join(testCasePath, "expected.ts")))
      .default;

    expect(results).toMatchObject(expected);
  });
}

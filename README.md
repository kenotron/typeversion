# Semver checker for TypeScript

This is a node library that helps you find incompatibilities in your TypeScript library. The way it achieve this is to draw inspiration from https://semver-ts.org. We heavily leverage TypeScript itself with an internal function that helps us retrieve compatibility information.

A library author would have a workflow similar to the following:

1. bundle and check in a single d.ts representing your public API
  a. you may find it helpful to use `api-extractor` or `dts-bundle-generator` to create that single d.ts file
2. on a CI / PR job, create a d.ts that represent the updated version of the public API
3. create a tool that uses `typeversion` to compare before and after d.ts to inform whether the change is a breaking change or not

## Node API

```ts
import { compare } from "typeversion";
import fs from "fs";

async function main() {
  const results = await compare({
    base: { fileName: "base.ts", source: fs.readFileSync("base.ts", "utf-8") },
    target: {
      fileName: "target.ts",
      source: fs.readFileSync("target.ts", "utf-8"),
    },
  });

  // results now contain the recommended change type and optionally a list of messages that indicate why `typeversion` recommends
  // a certain kind of change
}

main();
```
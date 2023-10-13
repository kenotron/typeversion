# Semver checker for TypeScript

There is a prior art at https://semver-ts.org that describes a spec about when the output types have breaking changes. We can leverage this information to build up a set of rules with the help of the typechecker on a "before" and "after" basis.

## Run the tool example like this:

`npx typeversion examples/source.ts examples/target.ts`

Now go and change it around and see how it behaves!

## Experimental node.js API

```ts
import { compare } from 'type-compare';

/**
 * @returns { minChangeType: `none` | `patch` | `minor` | `major`; messages: string[]; }
 */
const results = compare({
  base: {
    fileName: 'base.d.ts',
    source: 'the source code for base'
  },
  target: {
    fileName: 'target.d.ts',
    source: 'the source code for target'
  }
});
```
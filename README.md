# Semver checker for TypeScript

There is a prior art at https://semver-ts.org that describes a spec about when the output types have breaking changes. We can leverage this information to build up a set of rules with the help of the typechecker on a "before" and "after" basis.

## Run the tool example like this:

`npx typeversion examples/source.ts examples/target.ts`

### Example of adding a new required property in an interface

```ts
// filename: base.ts
export interface F {
	a: string;
}
```

```ts
// filename: target.ts
export interface F {
	a: string;
  b: string;
}
```

Now running the tool should give you a hint about what caused the breaking change

```
$ npx typeversion base.ts target.ts
Recommended change type: major
Reasons:
  [user-constructible-required-properties-added] New required property "b" has been added to "F"
```

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
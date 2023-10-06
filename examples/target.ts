export class Face {
  a:
    | string
    | {
        foo: Foo;
      };
}

interface Foo {
  foo: string;
}


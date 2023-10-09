class Person {
  // 1.  The private brand means this cannot be constructed other than the
  //     class's own constructor, because other approaches cannot add the
  //     private field. Even if you write a class yourself with a matching
  //     private field, TS will treat them as distinct.
  // 2.  Using `declare` means this marker has no runtime over head: it will
  //     not be emitted by TypeScript or Babel.
  // 3.  Because the class itself is declared but not exported, the only way
  //     to construct it is using the function exported lower in the module.
  declare private __brand: void;

  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
}

// This exports only the *type* side of `Person`, not the *value* side, so
// users can neither call `new Person(...)` nor subclass it. Per the note
// above, they also cannot *implement* their own version of `Person`, since
// they do not have the ability to add the private field.
export type { Person };

// This is the controlled way of building a person: users can only get a
// `Person` by calling this function, even though they can *name* the type
// by doing `import type { Person} from '...';`.
export function buildPerson(name: string, age: number): Person {
  return new Person(name, age);
}
These are the rules as proposed in https://semver-ts.org

# Breaking Changes

## TypeScript Compiler Version

- version of TS as declared in package.json?
 
## Symbols

- changing the name of an exported symbol (type or value), since users' existing imports will need to be updated. This is breaking for value exports (let, const, class, function) independent of types, but renaming exported interface, type alias, or namespace declarations is breaking as well.

- removing an exported symbol, since users' existing imports will stop working. This is a breaking change for value exports (let, const, class, function) independent of types, but removing exported interface, type alias, or namespace declarations is breaking as well.

- changing the kind (value vs. type) of an exported symbol in any way
    - Given a value-only exported symbol, including namespace declarations, adding a type export with the same name as the value may break users' code
    - Given a type-only exported symbol, including type, interface, or export type for a type or value, adding a value export with the same name may break users' code
    - Given a namespace export, changing it to a value-only export (that is, to an exported object) will break all nested type access

- changing an interface to a type alias will break any user code which used interface merging

- changing a namespace export to any other type will break any code which used namespace merging

- changing a class export to a type-only export

## Interfaces, Type Aliases, Class

- A change to any object type (user constructible or not) is breaking when:
    - a non-readonly object property's type changes in any way
    - a property is removed from the type entirely

- A change to a user-constructible type is breaking when:
    - a required property is added to the type

- A change to a non-user-constructible object type is breaking when
    - a readonly object property type becomes a less specific ("wider") type

## Functions

- an argument or return type changes entirely

- a function (including a class constructor or methods) argument requires a more specific ("narrower") type

- a function (including a class constructor or method) returns a less specific ("wider") type

- a function (including a class constructor or method) adds any new required arguments

- a function (including a class constructor or method) removes an existing argument entirely

- changing a function from a function declaration to an arrow function declaration

# Non-Breaking Changes

## Symbols

* a symbol is exported which was not previously exported and which does not share a name with another symbol which was previously exported

## Interfaces, Type Aliases, and Classes

* a new optional property is added to the type
* a readonly object property on the type becomes a more specific ("narrower") type
* a new required property is added to the object

## Function

* a function (including a class method or constructor) accepts a less specific ("wider") type
* a function (including a class method) which returns a more specific ("narrower") type
* a function (including a class constructor or method) makes a previously-required argument optional
* changing a function from an arrow function declaration to function declaration
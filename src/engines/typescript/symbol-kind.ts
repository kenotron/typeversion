import ts from "typescript";
import { isPropertyPrivate } from "./is-property-private";

export function isValueType(symbol: ts.Symbol) {
  return !!(symbol.getFlags() & ts.SymbolFlags.Value);
}

export function isCheckedType(symbol: ts.Symbol) {
  return !!(symbol.getFlags() & ts.SymbolFlags.Value);
}

export function isClass(symbol: ts.Symbol) {
  return !!(symbol.getFlags() & ts.SymbolFlags.Class);
}

export function isInterface(symbol: ts.Symbol) {
  return !!(symbol.getFlags() & ts.SymbolFlags.Interface);
}

export function isNamespace(symbol: ts.Symbol) {
  return !!(symbol.getFlags() & ts.SymbolFlags.Namespace);
}

export function isEnum(symbol: ts.Symbol) {
  return (
    !!(symbol.getFlags() & ts.SymbolFlags.Enum) ||
    !!(symbol.getFlags() & ts.SymbolFlags.ConstEnum)
  );
}

export function isFunction(symbol: ts.Symbol) {
  return !!(symbol.getFlags() & ts.SymbolFlags.Function);
}

export function isTypeAlias(symbol: ts.Symbol) {
  return !!(symbol.getFlags() & ts.SymbolFlags.TypeAlias);
}

export function isTypeLiteral(symbol: ts.Symbol) {
  return !!(symbol.getFlags() & ts.SymbolFlags.TypeLiteral);
}

export function isObjectType(symbol: ts.Symbol) {
  return isClass(symbol) || isInterface(symbol) || isTypeLiteral(symbol);
}

/**
 * A type is user-constructible if the consumer of a package is allowed to create their own objects which match a given type structurally, that is, without using a function or class exported from the package which provides the type.
 * See: https://www.semver-ts.org/
 * @param symbol
 * @returns
 */
export function isUserConstructible(type: ts.Type) {
  const symbol = type.symbol;

  if (!isObjectType(symbol)) {
    return false;
  }

  let hasConstructorSignature = false;
  let hasPrivateProperty = false;

  for (const [name, member] of symbol.members) {
    if (
      member.getFlags() & ts.SymbolFlags.Signature &&
      name === ts.InternalSymbolName.New
    ) {
      hasConstructorSignature = true;
      break;
    }

    if (type.isClass() && isPropertyPrivate(member)) {
      hasPrivateProperty = true;
      break;
    }
  }

  return !hasConstructorSignature && !hasPrivateProperty;
}

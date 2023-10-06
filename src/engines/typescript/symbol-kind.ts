import ts from "typescript";

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
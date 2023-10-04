import ts from "typescript";

export function isValueType(type: ts.Type) {
  return (
    type.isLiteral() ||
    type.isClass() ||
    !!(type.getSymbol()?.getFlags() & ts.SymbolFlags.Namespace) ||
    !!(type.getSymbol()?.getFlags() & ts.SymbolFlags.Function)
  );
}

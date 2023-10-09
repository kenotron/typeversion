import ts from "typescript";

export function getTypeOfExport(
  exportSymbol: ts.Symbol,
  checker: ts.TypeChecker
) {
  // Handle aliases
  if (exportSymbol.getFlags() & ts.SymbolFlags.Alias) {
    return getTypeOfExport(checker.getAliasedSymbol(exportSymbol), checker);
  }

  // Find the declaration from baseExport that is a type
  let typeDeclaration: ts.Declaration;
  for (const declaration of exportSymbol.declarations) {
    if (
      ts.isTypeAliasDeclaration(declaration) ||
      ts.isInterfaceDeclaration(declaration) ||
      ts.isClassDeclaration(declaration) ||
      ts.isTypeLiteralNode(declaration)
    ) {
      typeDeclaration = declaration;
    }

    typeDeclaration = declaration;
  }

  if (typeDeclaration) {
    return checker.getTypeAtLocation(typeDeclaration);
  }
}

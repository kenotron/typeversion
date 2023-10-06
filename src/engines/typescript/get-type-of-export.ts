import ts from "typescript";

export function getTypeOfExport(
  exportSymbol: ts.Symbol,
  checker: ts.TypeChecker
) {
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
  }

  if (typeDeclaration) {
    return checker.getTypeAtLocation(typeDeclaration);
  }
}

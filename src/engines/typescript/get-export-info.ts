import ts from "typescript";

export function getExportInfo(sourceFile: ts.SourceFile, checker: ts.TypeChecker) {
  const sourceFileSymbol = checker.getSymbolAtLocation(sourceFile);
  const srcExports = checker.getExportsOfModule(sourceFileSymbol);
  return srcExports;
}

import path from "path";
import fs from "fs";
import ts from "typescript";

export function getExportInfo(root: string, src: string) {
  const jsonOptions = ts.parseConfigFileTextToJson(
    ts.sys.resolvePath(path.join(root, "tsconfig.json")),
    fs.readFileSync(path.join(root, "tsconfig.json"), "utf8")
  );

  // force the use of "root" as the current directory
  ts.sys.getCurrentDirectory = () => root;

  const cmdLine = ts.parseJsonConfigFileContent(
    jsonOptions.config,
    ts.sys,
    root
  );
  const program = ts.createProgram([path.join(root, src)], cmdLine.options);
  const checker = program.getTypeChecker();

  let sourceFile = program.getSourceFile(src);

  if (!sourceFile) {
    throw new Error("No source file found for " + src);
  }

  let sourceFileSymbol = checker.getSymbolAtLocation(sourceFile);
  let srcExports = checker.getExportsOfModule(sourceFileSymbol);

  return { exports: srcExports, checker, program };
}

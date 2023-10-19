import path from "path";
import ts from "typescript";

export function getExportInfo(source: { fileName: string; source: string }) {
  const fullFileName = path.resolve(source.fileName).replace(/\\/g, "/");

  const options = ts.getDefaultCompilerOptions();
  options.target = ts.ScriptTarget.ESNext;
  options.module = ts.ModuleKind.CommonJS;
  options.moduleResolution = ts.ModuleResolutionKind.NodeJs;
  options.esModuleInterop = true;
  options.allowSyntheticDefaultImports = true;
  options.isolatedModules = true;
  options.strictNullChecks = true;

  const sourceFile = ts.createSourceFile(
    fullFileName,
    source.source,
    ts.ScriptTarget.ESNext
  );

  const host = ts.createCompilerHost(options);
  const _getSourceFile = host.getSourceFile;
  host.getSourceFile = function (fileName, languageVersion, onError) {
    if (fileName === fullFileName) {
      return sourceFile;
    }
    return _getSourceFile(fileName, languageVersion, onError);
  }.bind(host);
  host.getCurrentDirectory = () => path.dirname(fullFileName);

  const program = ts.createProgram({
    options,
    rootNames: [fullFileName],
    host,
  });

  // const program = ts.createProgram([path.join(root, src)], cmdLine.options);
  const checker = program.getTypeChecker();

  const sourceFileSymbol = checker.getSymbolAtLocation(sourceFile);
  const srcExports = checker.getExportsOfModule(sourceFileSymbol);
  return { exports: srcExports, checker, program };
}

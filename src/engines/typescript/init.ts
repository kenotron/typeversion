import ts from "typescript";
import { RuleContext } from "../../types";
import { getExportInfo } from "./get-export-info";
import path from "path";

function createCompilerOptions() {
  const compilerOptions = ts.getDefaultCompilerOptions();
  compilerOptions.target = ts.ScriptTarget.ESNext;
  compilerOptions.module = ts.ModuleKind.CommonJS;
  compilerOptions.moduleResolution = ts.ModuleResolutionKind.NodeJs;
  compilerOptions.esModuleInterop = true;
  compilerOptions.allowSyntheticDefaultImports = true;
  compilerOptions.isolatedModules = true;
  compilerOptions.strict = true;

  return compilerOptions;
}

function createCompilerHostForTypeVersioning(options: {
  compilerOptions: ts.CompilerOptions;
  base: {
    fileName: string;
    sourceFile: ts.SourceFile;
  };
  target: {
    fileName: string;
    sourceFile: ts.SourceFile;
  };
}) {
  const { compilerOptions, base, target } = options;
  const host = ts.createCompilerHost(compilerOptions);
  const _getSourceFile = host.getSourceFile;
  host.getSourceFile = function (fileName, languageVersion, onError) {
    if (fileName === base.fileName) {
      return base.sourceFile;
    }

    if (fileName === target.fileName) {
      return target.sourceFile;
    }

    return _getSourceFile(fileName, languageVersion, onError);
  }.bind(host);

  host.getCurrentDirectory = () => path.dirname(base.fileName);
  return host;
}

export function initializeContext(options: {
  base: {
    fileName: string;
    source: string;
  };
  target: {
    fileName: string;
    source: string;
  };
}): RuleContext {
  const { base, target } = options;

  const baseFileName = path.resolve(base.fileName).replace(/\\/g, "/");
  const targetFileName = path.resolve(target.fileName).replace(/\\/g, "/");

  const compilerOptions = createCompilerOptions();

  const baseSourceFile = ts.createSourceFile(baseFileName, base.source, ts.ScriptTarget.ESNext);
  const targetSourceFile = ts.createSourceFile(targetFileName, target.source, ts.ScriptTarget.ESNext);

  const host = createCompilerHostForTypeVersioning({
    compilerOptions,
    base: {
      fileName: baseFileName,
      sourceFile: baseSourceFile,
    },
    target: {
      fileName: targetFileName,
      sourceFile: targetSourceFile,
    },
  });

  const program = ts.createProgram({
    options: compilerOptions,
    rootNames: [targetFileName, baseFileName],
    host,
  });

  const checker = program.getTypeChecker();

  const baseExports = getExportInfo(baseSourceFile, checker);
  const targetExports = getExportInfo(targetSourceFile, checker);

  return {
    typescript: {
      checker,
      program,
      base: {
        source: base.source,
        exports: baseExports,
        sourceFile: baseSourceFile
      },
      target: {
        source: target.source,
        exports: targetExports,
        sourceFile: targetSourceFile
      },
    },
  };
}

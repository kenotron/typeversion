import type { Rule, RuleResult } from "./types";
import ts from "typescript";

import fs from "fs";
import path from "path";

export interface CompareOptions {
  base: {
    fileName: string;
    source: string;
  };
  target: {
    fileName: string;
    source: string;
  };
}

const changeTypeSizes = {
  none: 0,
  patch: 1,
  minor: 2,
  major: 3,
};

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

export async function compare(options: CompareOptions) {
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

  const baseFileSymbol = checker.getSymbolAtLocation(baseSourceFile);
  const baseExports = checker.getExportsOfModule(baseFileSymbol);
  const baseExportMap = new Map(baseExports.map((e) => [e.escapedName, e]));

  const targetFileSymbol = checker.getSymbolAtLocation(targetSourceFile);
  const targetExports = checker.getExportsOfModule(targetFileSymbol);
  const targetExportMap = new Map(targetExports.map((e) => [e.escapedName, e]));

  const messages: string[] = [];
  let minChangeType: "none" | "patch" | "minor" | "major" = "none";
  for (const [baseName, baseSymbol] of baseExportMap.entries()) {
    // removed symbol is a breaking change
    const targetSymbol = targetExportMap.get(baseName);
    if (!targetSymbol) {
      messages.push(`"${baseName}" is removed.`);
      minChangeType = "major";
      continue;
    }

    const baseType = checker.getTypeAtLocation(baseSymbol.getDeclarations()[0]);
    const targetType = checker.getTypeAtLocation(targetSymbol.getDeclarations()[0]);

    const errorOutputObject = {
      errors: [],
    };

    const isAssignable = checker.checkTypeAssignableTo(
      targetType,
      baseType,
      baseSymbol.getDeclarations()[0],
      undefined,
      undefined,
      errorOutputObject
    );

    if (!isAssignable) {
      const errors = errorOutputObject.errors.map((e) => ts.flattenDiagnosticMessageText(errorOutputObject.errors[0].messageText, "\n")).join("\n");
      messages.push(errors);
      minChangeType = "major";
    }
  }

  for (const targetName of targetExportMap.keys()) {
    // added symbol is not a breaking change
    const baseSymbol = baseExportMap.get(targetName);
    if (!baseSymbol) {
      minChangeType = "minor";
    }
  }

  return {
    messages,
    minChangeType,
  };

  // const context = initializeContext({ base, target });

  // const results = new Map<string, RuleResult>();
  // const rules = await getRules();
  // const ruleNames = new Set<string>();

  // for (const rule of rules) {
  //   // This is to keep the rule names unique: it seems that the author of this tool keeps forgetting about changing the NAME of the rule :)
  //   if (ruleNames.has(rule.name)) {
  //     throw new Error(`Duplicate rule name: ${rule.name}`);
  //   }

  //   ruleNames.add(rule.name);

  //   const result = await rule.check(context);
  //   results.set(rule.name, result);
  // }

  // return mergeResults(results);
}

async function getRules() {
  const files = fs.readdirSync(path.join(__dirname, "rules"));
  const rules: Rule[] = [];
  for (const file of files) {
    const rule = (await import(path.join(__dirname, "rules", file))).default as Rule;

    rules.push(rule);
  }
  return rules;
}

function mergeResults(results: Map<string, RuleResult>) {
  const merged: RuleResult = {
    messages: [],
    minChangeType: "none",
  };

  for (const [name, result] of results) {
    if (changeTypeSizes[result.minChangeType] > changeTypeSizes[merged.minChangeType]) {
      merged.minChangeType = result.minChangeType;
    }

    for (const messages of result.messages) {
      merged.messages.push(`[${name}] ${messages}`);
    }
  }

  return merged;
}

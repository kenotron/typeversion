import ts from "typescript";

export interface Rule {
  name: string;
  description: string;
  check: RuleChecker;
}

export interface RuleChecker {
  (options: RuleContext): Promise<RuleResult>;
}

export interface RuleSourceFileContext {
  source: string;
  exports: ts.Symbol[];
  sourceFile: ts.SourceFile;
}

export interface RuleContext {
  typescript: {
    checker: ts.TypeChecker;
    program: ts.Program;
    base: RuleSourceFileContext;
    target: RuleSourceFileContext;
  };
}

export interface RuleResult {
  minChangeType: `none` | `patch` | `minor` | `major`;
  messages: string[];
}

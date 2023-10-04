import ts from "typescript";

export interface Rule {
  name: string;
  description: string;
  check: RuleChecker;
}

export interface RuleChecker {
  (options: RuleContext): Promise<RuleResult>;
}

export interface RuleContext {
  root: string;

  typescript: {
    base: {
      source: string;
      exports: ts.Symbol[];
      checker: ts.TypeChecker;
    };

    target: {
      source: string;
      exports: ts.Symbol[];
      checker: ts.TypeChecker;
    };
  };
}

export interface RuleResult {
  minChangeType: `none` | `patch` | `minor` | `major`;
  messages: string[];
}

import ts from "typescript";
import { Rule, RuleResult } from "../types";
import { getResolvedType } from "../engines/typescript/resolve-type-structure";
import { TypeInformer } from "../engines/typescript/type-informer";

const rule: Rule = {
  name: "is-type-assignable",
  description: "Uses TypeScript's internal isTypeAssignableTo() to check compatibility",
  async check(context) {
    const {
      typescript: { base, target, checker, program },
    } = context;

    const results: RuleResult = {
      minChangeType: "none",
      messages: [],
    };

    const baseFileSymbol = checker.getSymbolAtLocation(base.sourceFile);
    const baseExports = checker.getExportsOfModule(baseFileSymbol);
    const baseExportMap = new Map(baseExports.map((e) => [e.escapedName, e]));

    const targetFileSymbol = checker.getSymbolAtLocation(target.sourceFile);
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
        const errors = errorOutputObject.errors
          .map((e) => ts.flattenDiagnosticMessageText(errorOutputObject.errors[0].messageText, "\n"))
          .join("\n");
        messages.push(errors);
        minChangeType = "major";
      }
    }

    return results;
  },
};

export default rule;

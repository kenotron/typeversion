import ts from "typescript";
import { TypeInformer } from "../engines/typescript/type-informer";
import { Rule, RuleResult } from "../types";
import { collectProperties } from "../engines/typescript/collect-properties-of-object-type";
import { isNarrowed } from "../engines/typescript/is-narrowed";
import { isWidened } from "../engines/typescript/is-widened";

const rule: Rule = {
  name: "function-params-and-return-type-changed",
  description: "Function params and return type that have changed in the types or have been removed",
  async check(context) {
    const {
      typescript: { base, target },
    } = context;

    const results: RuleResult = {
      minChangeType: "none",
      messages: [],
    };

    const baseInformer = new TypeInformer(base.checker);
    const targetInformer = new TypeInformer(target.checker);

    const baseSymbolMap = new Map(base.exports.map((e) => [e.escapedName, e]));
    const targetSymbolMap = new Map(target.exports.map((e) => [e.escapedName, e]));

    for (const [name, baseExport] of baseSymbolMap) {
      const baseExportType = baseInformer.getTypeOfExport(baseExport);
      const targetExport = targetSymbolMap.get(name);
      if (!targetExport) {
        continue;
      }

      const targetExportType = targetInformer.getTypeOfExport(targetExport);

      const messages = checkBreakingFunctionType(baseInformer, targetInformer, baseExportType, targetExportType);

      if (messages.length > 0) {
        results.minChangeType = "major";
        results.messages.push(...messages.map((m) => `Function "${name}": ${m}`));
      }
    }

    return results;
  },
};

function checkBreakingFunctionType(baseInformer: TypeInformer, targetInformer: TypeInformer, base: ts.Type, target: ts.Type): string[] {
  const messages: string[] = [];

  if (baseInformer.isFunction(base)) {
    const baseSignatures = base.getCallSignatures();
    const targetSignatures = target.getCallSignatures();

    // Compare the last signature of each signature list (the most specific)
    const lastBaseSignature = baseSignatures[baseSignatures.length - 1];
    const lastTargetSignature = targetSignatures[targetSignatures.length - 1];

    const baseParams = lastBaseSignature.getParameters();
    const targetParams = lastTargetSignature.getParameters();

    const baseReturnType = lastBaseSignature.getReturnType();
    const targetReturnType = lastTargetSignature.getReturnType();

    // Check on the parameters: if the types are narrowed, completely changed, or newly added required params
    for (let i = 0; i < baseParams.length; i++) {
      const baseParam = baseParams[i];
      const baseParamType = baseInformer.getTypeOfExport(baseParam);

      if (targetParams.length > i) {
        const targetParam = targetParams[i];
        const targetParamType = targetInformer.getTypeOfExport(targetParam);

        if (isNarrowed(baseParamType, baseInformer, targetParamType, targetInformer)) {
          messages.push(
            `parameter "${baseParam.escapedName}" of type "${baseInformer.checker.typeToString(
              baseInformer.getTypeOfExport(baseParam)
            )}" has been changed to "${targetInformer.checker.typeToString(baseInformer.getTypeOfExport(targetParam))}"`
          );
        } else if (!checkTypeFlags(baseParamType.flags, targetParamType.flags)) {
          messages.push(
            `parameter "${baseParam.escapedName}" of type "${baseInformer.checker.typeToString(
              baseInformer.getTypeOfExport(baseParam)
            )}" has been changed to "${targetInformer.checker.typeToString(baseInformer.getTypeOfExport(targetParam))}"`
          );
        }
      } else {
        messages.push(`parameter count went down from ${baseParams.length} to ${targetParams.length}`);
      }
    }

    // checks to see if there are newly added required targetParams
    if (targetParams.length > baseParams.length) {
      const newParams = targetParams.slice(baseParams.length);
      for (const param of newParams) {
        if (ts.isParameter(param.valueDeclaration) && !targetInformer.checker.isOptionalParameter(param.valueDeclaration)) {
          messages.push(`parameter "${param.escapedName}" has been added as required`);
        }
      }
    }

    // checks for widened return types
    if (isWidened(baseReturnType, baseInformer, targetReturnType, targetInformer)) {
      messages.push(
        `return type "${baseInformer.checker.typeToString(baseReturnType)}" has been widened to "${targetInformer.checker.typeToString(
          targetReturnType
        )}"`
      );
    } else if (!checkTypeFlags(baseReturnType.flags, targetReturnType.flags)) {
      messages.push(
        `return type "${baseInformer.checker.typeToString(baseReturnType)}" has been changed to "${targetInformer.checker.typeToString(
          targetReturnType
        )}"`
      );
    }
  }

  return messages;
}

function checkTypeFlags(baseFlags: ts.TypeFlags, targetFlags: ts.TypeFlags) {
  const flags = [
    ts.TypeFlags.Any,
    ts.TypeFlags.Unknown,
    ts.TypeFlags.StringLike,
    ts.TypeFlags.BigIntLike,
    ts.TypeFlags.NumberLike,
    ts.TypeFlags.BooleanLike,
    ts.TypeFlags.EnumLike,
    ts.TypeFlags.BigIntLike,
    ts.TypeFlags.StringLiteral,
    ts.TypeFlags.NumberLiteral,
    ts.TypeFlags.BooleanLiteral,
    ts.TypeFlags.EnumLiteral,
    ts.TypeFlags.BigIntLiteral,
    ts.TypeFlags.ESSymbol,
    ts.TypeFlags.UniqueESSymbol,
    ts.TypeFlags.Void,
    ts.TypeFlags.Undefined,
    ts.TypeFlags.Null,
    ts.TypeFlags.Never,
  ];

  const baseFlagsResult = baseFlags & flags.reduce((acc, flag) => acc | flag, 0);
  const targetFlagsResult = targetFlags & flags.reduce((acc, flag) => acc | flag, 0);

  return Boolean(baseFlagsResult) === Boolean(targetFlagsResult);
}

export default rule;

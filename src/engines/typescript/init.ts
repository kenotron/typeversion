import { RuleContext } from "../../types";
import { getExportInfo } from "./get-export-info";

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
  const baseInfo = getExportInfo(base);
  const targetInfo = getExportInfo(target);

  return {
    typescript: {
      checker: baseInfo.checker,
      program: baseInfo.program,
      base: {
        source: base.source,
        ...baseInfo,
      },
      target: {
        source: target.source,
        ...targetInfo,
      },
    },
  };
}

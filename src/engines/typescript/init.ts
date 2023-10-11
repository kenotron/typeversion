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
}) {
  const { base, target } = options;
  const baseInfo = getExportInfo(base);
  const targetInfo = getExportInfo(target);

  return {
    typescript: {
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

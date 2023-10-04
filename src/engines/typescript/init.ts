import { getExportInfo } from "./get-export-info";

export function initializeContext(options: {
  root: string;
  base: string;
  target: string;
}) {
  const { root, base, target } = options;
  const baseInfo = getExportInfo(root, base);
  const targetInfo = getExportInfo(root, target);

  return {
    root: options.root,
    typescript: {
      base: {
        source: base,
        ...baseInfo,
      },
      target: {
        source: target,
        ...targetInfo,
      },
    },
  };
}

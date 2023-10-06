import { dirname } from "path";
import { fileURLToPath } from "url";

export const __filename = (url: string) => fileURLToPath(url);
export const __dirname = (url: string) => dirname(__filename(url));

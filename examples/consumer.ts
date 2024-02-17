import { myFunction as b } from "./base";
import { myFunction as t } from "./target";

let base: typeof b = t;


t('hi', 2);
import { program } from "commander";
import { compare } from "./compare";

program
  .command("compare <base> <target>")
  .option("-r, --root <root>", "root directory")
  .description("compare two typescript files")
  .action(async (base, target, options, _command) => {
    const results = await compare({ root: options.root ?? process.cwd(), base, target });
    console.log(results);
  });

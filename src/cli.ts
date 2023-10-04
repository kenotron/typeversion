import { program } from "commander";
import { compare } from "./compare";
import path from "path";

const cliProgram = program
  .command("compare <base> <target>", { isDefault: true })
  .option("-r, --root <root>", "root directory")
  .description("compare two typescript files")
  .action(async (base, target, options, _command) => {
    console.log(
      `Comparing ${base} to ${target}, root: ${
        path.resolve(options.root) ?? process.cwd()
      }`
    );

    const results = await compare({
      root: path.resolve(options.root) ?? process.cwd(),
      base,
      target,
    });
    console.log(results);
  });

cliProgram.parse(process.argv);

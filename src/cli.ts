import { program } from "commander";
import { compare } from "./compare";
import path from "path";
import fs from "fs";

const cliProgram = program
  .command("compare <base> <target>", { isDefault: true })
  .description("compare two typescript files")
  .action(async (base, target, options, _command) => {
    console.log(
      `Comparing ${base} to ${target}`
    );

    const results = await compare({
      base: {
        fileName: base,
        source: fs.readFileSync(base, 'utf-8')
      },
      target:
      {
        fileName: target,
        source: fs.readFileSync(target, 'utf-8')
      },
    });

    console.log(results);
  });

cliProgram.parse(process.argv);

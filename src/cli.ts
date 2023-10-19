import { program } from "commander";
import { compare } from "./compare";
import path from "path";
import fs from "fs";

const cliProgram = program
  .command("compare <base> <target>", { isDefault: true })
  .option("--json", "output results as json", false)
  .description("compare two typescript files")
  .action(async (base, target, options, _command) => {
    const results = await compare({
      base: {
        fileName: base,
        source: fs.readFileSync(base, "utf-8"),
      },
      target: {
        fileName: target,
        source: fs.readFileSync(target, "utf-8"),
      },
    });

    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
      return;
    }

    const summary = `
Recommended change type: ${results.minChangeType}
Reasons:
  ${results.messages.join("\n  ")}
`.trim();

    console.log(summary);
  });

cliProgram.parse(process.argv);

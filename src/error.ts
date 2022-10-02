// Importing colors
import { bold, cyan, red } from "./deps.ts";

const version="0.1.0"

function _printFooter() {
  console.log()
  console.log('Specify global configs in .env file:')
  console.log('\t\t~/.config/windmill/config.env')
  console.log()
  console.log(`wmc@${version}`)
}

export function displayJobsHelpAndQuit(error?: string) {
  if (error) {
    console.log(red(error));
  }
  console.log(bold("Usage:"));
  console.log("  wm jobs [options]");
  console.log("Options");
  console.log("    -n    Limit the number of jobs to display");
  _printFooter();
}

// Shows help text, error message(if present) and exits the program
export const displayHelpAndQuit = (error?: string): void => {
  if (error) {
    console.log(bold(red(`Error: ${error}\n`)));
    if (error === "INVALID_KEY") {
      console.log(
        bold(red(`Error: Invalid API key. Use --config flag to set key`)),
      );
    }
  }
  console.log(
    `Usage: wmc [command] [options]\n`,
  );
  console.log(`Commands:`);

  console.log(
    `  ${bold("push <path>")}\tPushes Scripts and Flows to Windmill`,
  );
  console.log(`\t\t${bold("path")} can only point to a single Script or Flow`);
  console.log(
    `  ${bold("pull <path>")}\tPulls Scripts and Flows from Windmill`,
  );
  console.log(`\t\t${bold("path")} can point to a File, or a directory`);

  console.log(`  ${bold("hub")}\t\tInteracts with the WindmillHub.`);


  console.log(`\nOptions:`);
  console.log(`  ${bold("-h, --help")}\t\tShows this help message and exits`);
  console.log(
    `${bold("  --token <token>")}\t${
      bold("REQUIRED:")
    } Set API key. Can be generated in ${
      cyan(`User Settings -> API Keys`)
    }. Defaults to ${bold("${WM_TOKEN}")} environment variable`,
  );
  console.log(
    `${bold("  --base-url <token>")}\t${
      bold("REQUIRED:")
    } Set Windmill instance URL. Defaults to ${
      bold("${WM_BASE_URL}")
    } environment variable`,
  );
  console.log(
    `${bold("  --workspace <name>")}\tSet the workspace. Defaults to ${
      bold("${WM_WORKSPACE}")
    } environment variable, or ${bold("starter")} if not set`,
  );

  _printFooter();

  Deno.exit();
};

// Importing colors
import { bold, cyan, red } from "./deps.ts";

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
    `Usage: wmc --token supersecret --base-url http://windmill.example.com [flag]\n`,
  );
  console.log(`Flags:`);

  console.log(`  ${bold("-h, --help")}\t\tShows this help message and exits`);

  console.log(
    `  ${bold("--push <path>")}\t\tPushes Scripts and Flows to Windmill \
    \n\t\t\t  ${bold("path")} can only point to a single Script or Flow`,
  );

  console.log(
    `  ${bold("--pull <path>")}\t\tPulls Scripts and Flows from Windmill \
                  \n\t\t\t  ${
      bold("path")
    } can point to a File, or a directory`,
  );

  console.log(
    `${
      bold("  --sync-rts")
    }\t\tImports all missing Resource Type definitions from Windmill Hub`,
  );

  console.log(
    `${bold("  --token <token>")}\t${
      bold("REQUIRED:")
    } Set API key. Can be generated in ${
      cyan(`User Settings -> API Keys`)
    }. Defaults to ${bold("${WM_TOKEN}")} environment variable,`,
  );

  console.log(
    `${bold("  --base-url <token>")}\t${
      bold("REQUIRED:")
    } Set Windmill instance URL. Defaults to ${
      bold("${WM_BASE_URL}")
    } environment variable,`,
  );
  // Exits the program
  Deno.exit();
};

import { dotEnv, parse } from "./deps.ts";
import { displayHelpAndQuit } from "./error.ts";

const CONFIG_PATH = `${Deno.env.get("HOME")}/.config/windmill/config.env`;

/**
 * Parses configs in the following order: runtime args, envars, config file
 * @returns {Args} parsedArgs
 */
export async function parseConfigs() {
  const parsedArgs = parse(Deno.args);
  const config = await dotEnv({ export: true });
  const configFile = await dotEnv({ path: CONFIG_PATH });

  console.log(`configFile is ${JSON.stringify(configFile, null, 2)}`);

  if (Deno.args.length == 0 || parsedArgs.h || parsedArgs.help) {
    displayHelpAndQuit();
  }

  if (!parsedArgs.token) {
    if (config.WM_TOKEN == undefined) {
      if (configFile.WM_TOKEN == undefined) {
        displayHelpAndQuit("No API token provided");
      } else {
        parsedArgs.token = configFile.WM_TOKEN;
      }
      displayHelpAndQuit("No API token provided");
    }
    parsedArgs.token = config.WM_TOKEN;
  }

  if (!parsedArgs.workspace) {
    if (config.WM_WORKSPACE == undefined) {
      if (configFile.WM_WORKSPACE == undefined) {
        displayHelpAndQuit("Workspace not defined");
      } else {
        parsedArgs.workspace = configFile.WM_WORKSPACE;
      }
      displayHelpAndQuit("Workspace not defined");
    }
    parsedArgs.workspace = config.WM_WORKSPACE;
  }

  if (!parsedArgs["base-url"]) {
    if (config.WM_BASE_URL == undefined) {
      if (configFile.WM_BASE_URL == undefined) {
        displayHelpAndQuit("No base URL provided");
      } else {
        parsedArgs["base-url"] = configFile.WM_BASE_URL;
      }
      displayHelpAndQuit("No base URL provided");
    }
    parsedArgs["base-url"] = config.WM_BASE_URL;
  }

  return parsedArgs;
}

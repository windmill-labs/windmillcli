import { dotEnv, parse } from "./deps.ts";
import { displayHelpAndQuit } from "./error.ts";

const CONFIG_PATH = "~/.config/windmill/config.env";

export async function parseConfigs() {
  const parsedArgs = parse(Deno.args);
  const config = await dotEnv({ export: true });
  // TODO: Config file reading doesn't work
  const configFile = await dotEnv({ path: CONFIG_PATH });

  console.log(`configFile is ${JSON.stringify(configFile, null, 2)}`);

  if (Deno.args.length == 0 || parsedArgs.h || parsedArgs.help) {
    displayHelpAndQuit();
  }

  if (!parsedArgs.token) {
    if (config.WM_TOKEN == undefined) {
      displayHelpAndQuit("No API token provided");
    }
    parsedArgs.token = config.WM_TOKEN;
  }

  if (!parsedArgs.workspace) {
    if (config.WM_WORKSPACE == undefined) {
      displayHelpAndQuit("Workspace not defined");
    }
    parsedArgs.workspace = config.WM_WORKSPACE;
  }

  if (!parsedArgs["base-url"]) {
    if (config.WM_BASE_URL == undefined) {
      displayHelpAndQuit("No base URL provided");
    }
    parsedArgs["base-url"] = config.WM_BASE_URL;
  }

  return parsedArgs;
}

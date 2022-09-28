import {
  bold,
  dotEnv,
  downloadWorkspace,
  ensureFile,
  handleResourceTypeUpload,
  handleResourceUpload,
  handleScriptUpload,
  importResourceTypesFromHub,
  jobsHandler,
  parse,
  walk,
  wmill
} from "./deps.ts";
import { displayHelpAndQuit } from "./error.ts";

// FIXME: Decide how to deal with the workspace
const workspace = "starter";
const flowsPrefix = `${workspace}/flows/`;
const scriptsPrefix = `${workspace}/scripts/`;
const resourcesPrefix = `${workspace}/resources/`;
const resourceTypesPrefix = `${workspace}/resource_types/`;

const CONFIG_PATH = "~/.config/windmill/config.env";

async function parseConfigs() {
  const parsedArgs = parse(Deno.args);
  const config = await dotEnv({ export: true });
  ensureFile(CONFIG_PATH);
  if (Deno.args.length == 0 || parsedArgs.h || parsedArgs.help) {
    displayHelpAndQuit();
  }

  if (!parsedArgs.token) {
    if (config.WM_TOKEN == undefined) {
      displayHelpAndQuit("No API token provided");
    }
    parsedArgs.token = config.WM_TOKEN;
  }

  if (!parsedArgs["base-url"]) {
    if (config.WM_BASE_URL == undefined) {
      displayHelpAndQuit("No base URL provided");
    }
    parsedArgs["base-url"] = config.WM_BASE_URL;
  }

  console.log("Parsed args:", parsedArgs);
  return parsedArgs;
}

if (import.meta.main) {
  const parsedArgs = await parseConfigs();
  const wmConf = wmill.createConf();
  // TODO: Ask Ruben about extracting the config to params
  wmConf.baseServer.url = `${parsedArgs["base-url"]}`;
  wmConf.authMethods.bearerAuth.tokenProvider.token = parsedArgs.token;
  // ---
  if (parsedArgs["sync-rts"]) {
    if (parsedArgs.pull || parsedArgs.push) {
      displayHelpAndQuit(
        "Cannot use --sync-rts with --pull or --push simultaneously",
      );
    }
    console.log(bold("Pulling Resource Type definitions from Windmill Hub"));
    const createdResources: string[] = await importResourceTypesFromHub(
      parsedArgs.token,
      parsedArgs["base-url"],
    );
    console.log(bold(`Resource Types imported: ${createdResources}`));
  } else if (parsedArgs.runs || parsedArgs._.includes("runs")) {
    await jobsHandler(wmConf, parsedArgs);
  } else if (parsedArgs.pull) {
    if (parsedArgs.push || parsedArgs["sync-rts"]) {
      displayHelpAndQuit(
        "Cannot use --pull with --sync-rts or --push simultaneously",
      );
    }
    await downloadWorkspace(wmConf);
  } else if (parsedArgs.push) {
    if (parsedArgs.pull || parsedArgs["sync-rts"]) {
      displayHelpAndQuit(
        "Cannot use --push with --sync-rts or --pull simultaneously",
      );
    }
    for await (const entry of walk(".")) {
      if (entry.isDirectory) {
        continue;
      }
      const fileName = entry.path;
      if (
        fileName.startsWith(scriptsPrefix) &&
        (fileName.endsWith(".ts") || fileName.endsWith(".py"))
      ) {
        console.log(bold(`Pushing Script ${entry.name}`));
        await handleScriptUpload(
          workspace,
          fileName,
          wmConf,
        );
      } else if (fileName.startsWith(resourceTypesPrefix)) {
        console.log(bold(`Pushing Resource Type ${entry.name}`));
        await handleResourceTypeUpload(workspace, fileName, wmConf);
      } else if (fileName.startsWith(resourcesPrefix)) {
        console.log(bold(`Pushing Resource ${entry.name}`));
        await handleResourceUpload(workspace, fileName, wmConf);
      } else if (fileName.startsWith(flowsPrefix)) {
        console.log(bold(`Pushing Flow ${entry.name}`));
        // await handleFlowUpload()
      } else {
        continue;
      }
    }
  } else displayHelpAndQuit("Invalid argument");
}

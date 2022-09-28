import {
  bold,
  downloadWorkspace,
  handleWorkspaceUpload,
  importResourceTypesFromHub,
  jobsHandler,
  wmill
} from "./deps.ts";
import { displayHelpAndQuit } from "./error.ts";
import { parseConfigs } from "./lib.ts";

if (import.meta.main) {
  const parsedArgs = await parseConfigs();
  const wmClientConfig = wmill.createConf();
  // TODO: Ask Ruben about extracting the config to params
  wmClientConfig.baseServer.url = `${parsedArgs["base-url"]}`;
  wmClientConfig.authMethods.bearerAuth.tokenProvider.token = parsedArgs.token;
  wmClientConfig.workspace_id = parsedArgs.workspace;
  console.log(`Config is ${JSON.stringify(wmClientConfig, null, 2)}`)
  switch (Deno.args[0]) {
    case "jobs": {
      await jobsHandler(wmClientConfig, parsedArgs);
      break;
    }
    case "push": {
      console.log("Push");
      await handleWorkspaceUpload(wmClientConfig);
      break;
    }
    case "pull": {
      console.log("Pull");
      await downloadWorkspace(wmClientConfig, parsedArgs);
      break;
    }
    case "hub": {
      if (parsedArgs.sync) {
        console.log(
          bold("Pulling Resource Type definitions from Windmill Hub"),
        );
        const createdResources: string[] = await importResourceTypesFromHub(
          parsedArgs.token,
          parsedArgs["base-url"],
        );
        console.log(bold(`Resource Types imported: ${createdResources}`));
      } else {
        displayHelpAndQuit("Sync flag is required");
      }
      break;
    }
    default:
      displayHelpAndQuit();
  }
}

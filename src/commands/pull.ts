import {
  Flow,
  Resource,
  ResourceType,
  Script,
} from "https://deno.land/x/windmill@v1.34.0/windmill-api/index.ts";
import { bold, ensureFile, green, wmill } from "../deps.ts";

async function writeItem<T>(item: T) {
  const workspace = item.workspaceId;
  const flowsPrefix = `${workspace}/flows/`;
  const scriptsPrefix = `${workspace}/scripts/`;
  const resourcesPrefix = `${workspace}/resources/`;
  const resourceTypesPrefix = `${workspace}/resource_types/`;
  let filePath = "";

  if (item instanceof Script) {
    filePath = scriptsPrefix + item.path;
    const metadataPath: string = filePath + ".json";
    await ensureFile(metadataPath);
    await Deno.writeTextFile(
      metadataPath,
      JSON.stringify(item, null, 2),
    );
    if (item.language == "deno") {
      filePath += ".ts";
    } else {
      filePath += ".py";
    }
  } else if (item instanceof Resource) {
    filePath = resourcesPrefix + item.path +
      ".json";
  } else if (item instanceof ResourceType) {
    filePath = resourceTypesPrefix +
      item.name + ".json";
  } else if (item instanceof Flow) {
    filePath = flowsPrefix + item.path + ".json";
  } else {
    console.error(
      `Unknown item type: ${typeof item}: ${JSON.stringify(item, null, 2)}`,
    );
    return;
  }

  await ensureFile(filePath);
  await Deno.writeTextFile(
    filePath,
    JSON.stringify(item, null, 2),
  );
  console.log(`${green("Saved")} ${filePath}`);
}

export async function downloadWorkspace(wmClientConfiguration) {
  const workspace = wmClientConfiguration.workspace_id;
  
  console.log(bold("Pulling scripts from remote"));
  const scriptApi = new wmill.ScriptApi(wmClientConfiguration);
  for (const script of await scriptApi.listScripts(workspace)) {
    await writeItem(
      await scriptApi.getScriptByHash(
        workspace,
        script.hash,
      ),
    );
  }

  console.log(bold("Pulling Resources from remote"));
  const resourceApi = new wmill.ResourceApi(wmClientConfiguration);
  for (const resource of await resourceApi.listResource(workspace)) {
    await writeItem(
      await resourceApi.getResource(
        workspace,
        resource.path,
      ),
    );
  }

  console.log(bold("Pulling Resource Types from remote"));
  for (const resourceType of await resourceApi.listResourceType(workspace)) {
    await writeItem(
      await resourceApi.getResourceType(
        workspace,
        resourceType.name,
      ),
    );
  }

  console.log(bold("Pulling Flows from remote"));
  const flowApi = new wmill.FlowApi(wmClientConfiguration);
  for (const flow of await flowApi.listFlows(workspace)) {
    await writeItem(await flowApi.getFlowByPath(workspace, flow.path));
  }
}

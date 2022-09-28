import { bold, ensureFile, wmill } from "../deps.ts";

export async function downloadWorkspace(wmClientConfiguration) {
  console.log(bold("Pulling scripts from remote"));
  const workspace = wmClientConfiguration.workspace_id;
  const flowsPrefix = `${workspace}/flows/`;
  const scriptsPrefix = `${workspace}/scripts/`;
  const resourcesPrefix = `${workspace}/resources/`;
  const resourceTypesPrefix = `${workspace}/resource_types/`;

  const scriptApi = new wmill.ScriptApi(wmClientConfiguration);
  for (const script of await scriptApi.listScripts(workspace)) {
    const scriptResponse = await scriptApi.getScriptByHash(
      workspace,
      script.hash,
    );
    let filePath: string = scriptsPrefix + script.path;
    const metadataPath: string = filePath + ".json";
    await ensureFile(metadataPath);
    await Deno.writeTextFile(
      metadataPath,
      JSON.stringify(scriptResponse, null, 2),
    );
    if (scriptResponse.language == "deno") {
      filePath += ".ts";
    } else {
      filePath += ".py";
    }
    await ensureFile(filePath);
    await Deno.writeTextFile(filePath, scriptResponse.content);
    console.log(`Script ${script.path} saved to ${filePath}`);
  }

  console.log(bold("Pulling Resources from remote"));
  const resourceApi = new wmill.ResourceApi(wmClientConfiguration);
  for (const resource of await resourceApi.listResource(workspace)) {
    const resourceResponse = await resourceApi.getResource(
      workspace,
      resource.path,
    );
    const filePath = resourcesPrefix + resource.path +
      ".json";
    await ensureFile(filePath);
    await Deno.writeTextFile(
      filePath,
      JSON.stringify(resourceResponse, null, 2),
    );

    console.log(`Resource ${resource.path} saved to ${filePath}`);
  }

  console.log(bold("Pulling Resource Types from remote"));
  for (const resourceType of await resourceApi.listResourceType(workspace)) {
    const resourceTypeResponse = await resourceApi.getResourceType(
      workspace,
      resourceType.name,
    );
    const filePath = resourceTypesPrefix +
      resourceType.name + ".json";
    await ensureFile(filePath);
    await Deno.writeTextFile(
      filePath,
      JSON.stringify(resourceTypeResponse, null, 2),
    );
    console.log(`Resource Type ${resourceType.name} saved to ${filePath}`);
  }

  console.log("Pulling flows from remote");
  const flowApi = new wmill.FlowApi(wmClientConfiguration);
  for (const flow of await flowApi.listFlows(workspace)) {
    const flowResponse = await flowApi.getFlowByPath(workspace, flow.path);
    const filePath = flowsPrefix + flow.path + ".json";
    await ensureFile(filePath);
    await Deno.writeTextFile(
      filePath,
      JSON.stringify(flowResponse, null, 2),
    );
    console.log(`Flow ${flow.path} saved to ${filePath}`);
  }
}

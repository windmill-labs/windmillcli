import { bold, CreateResource, ensureFile, wmill } from "./deps.ts";

const workspace = "starter";
const flowsPrefix = `${workspace}/flows/`;
const scriptsPrefix = `${workspace}/scripts/`;
const resourcesPrefix = `${workspace}/resources/`;
const resourceTypesPrefix = `${workspace}/resource_types/`;

export async function downloadWorkspace(wmConf) {
  console.log(bold("Pulling scripts from remote"));
  const scriptApi = new wmill.ScriptApi(wmConf);
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
  const resourceApi = new wmill.ResourceApi(wmConf);
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
  const flowApi = new wmill.FlowApi(wmConf);
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

export async function handleScriptUpload(
  workspace: string,
  fileName: string,
  wmClientConfig,
) {
  const scriptApi = new wmill.ScriptApi(wmClientConfig);
  const scriptContent = await Deno.readTextFile(fileName);
  const scriptPath = fileName.slice(scriptsPrefix.length, -3);
  const language = fileName.endsWith(".ts") ? "deno" : "python3";
  let summary = "";
  let description = "";
  let isTemplate = null;
  let schema = null;

  const lock = null;

  const json_tar_path = `${fileName.slice(0, -3)}.json`;
  let newScriptMetadata = null;
  try {
    newScriptMetadata = JSON.parse(
      await Deno.readTextFile(json_tar_path),
    );
    summary = newScriptMetadata.summary;
    description = newScriptMetadata.description;
    isTemplate = newScriptMetadata.is_template;
    schema = newScriptMetadata.schema;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      console.log("No metadata found");
    } else {
      console.log(`Something went wrong trying to read file: ${err}`);
      return undefined;
    }
  }

  try {
    if (await scriptApi.existsScriptByPath(workspace, scriptPath)) {
      const oldScript = await scriptApi.getScriptByPath(
        workspace,
        scriptPath,
      );
      if (oldScript.content == scriptContent) {
        if (newScriptMetadata == null) {
          console.log(
            `Same content and no metadata, no need to update`,
          );
          return undefined;
        }

        if (
          oldScript.summary == summary &&
          oldScript.description == description &&
          oldScript.isTemplate == isTemplate &&
          JSON.stringify(oldScript.schema) ==
            JSON.stringify(newScriptMetadata.schema) &&
          JSON.stringify(oldScript.lock?.split("\n")) ==
            JSON.stringify(newScriptMetadata.lock)
        ) {
          console.log("Same content and metadata, no need to update");
          return undefined;
        }

        console.log(
          `Same content, different metadata. Updating script ${fileName}`,
        );
        const newMetadata = {
          "path": scriptPath,
          "parentHash": oldScript.hash,
          "summary": summary,
          "description": description,
          "content": scriptContent,
          "schema": schema,
          "isTemplate": isTemplate,
          "lock": newScriptMetadata.lock,
          "language": language,
          "isTrigger": newScriptMetadata.isTrigger ||
            newScriptMetadata.is_trigger,
        };
        try {
          const createScriptResponse = await scriptApi.createScript(
            workspace,
            newMetadata,
          );
          console.log(
            `Script updated. New version hash: ${createScriptResponse}`,
          );
          return createScriptResponse;
        } catch (err) {
          console.log(`Something went terribly wrong:${err}`);
          return undefined;
        }
      } else {
        console.log(
          `  Script content changed, updating script ${fileName}`,
        );
        if (language == "deno") {
          schema = await scriptApi.denoToJsonschema(scriptContent);
        } else schema = await scriptApi.pythonToJsonschema(scriptContent);
        const newMetadata = oldScript;
        newMetadata.content = scriptContent;
        newMetadata.schema = schema;
        if (language == "python3") {
          newMetadata["lock"] = newScriptMetadata.lock;
        }
        const createScriptResponse = await scriptApi.createScript(
          workspace,
          newMetadata,
        );
        return createScriptResponse;
      }
    }
  } catch (err) {
    if (err?.code == 404) {
      console.log(
        `  Script ${scriptPath} does not exist. Uploading as new.`,
      );
    } else {
      console.log(`Something went terribly wrong:${err}`);
      return undefined;
    }

    const newMetadata = {
      "path": scriptPath,
      "summary": summary,
      "description": description,
      "content": scriptContent,
      "schema": schema,
      "language": language,
      "isTrigger": true,
    };
    if (language == "python3") newMetadata["lock"] = lock ?? [];
    try {
      const response = await scriptApi.createScript(
        workspace,
        newMetadata,
      );
      return response;
    } catch (err) {
      console.error(`${err.body}\nSkipping script.`);
      return undefined;
    }
  }
}

// TODO: Implement flow upload
export async function handleFlowUpload(
  workspace: string,
  fileName: string,
  wmClientConfig,
) {
  const flowApi = new wmill.FlowApi(wmClientConfig);
  // const flowContent = await Deno.readTextFile(fileName);
  const flowPath = fileName.slice(flowsPrefix.length, -5);
  await flowApi.createFlow(workspace, flowPath);
}

export async function handleResourceUpload(
  workspace: string,
  fileName: string,
  wmClientConfig,
) {
  const resourceApi = new wmill.ResourceApi(wmClientConfig);
  const resourcePath: string = fileName.slice(resourcesPrefix.length, -5);
  const newResource = JSON.parse(
    await Deno.readTextFile(fileName),
  );
  console.log(`\nProcessing resource: ${resourcePath} at ${fileName}`);
  try {
    const oldResource = await resourceApi.getResource(
      workspace,
      resourcePath,
    );
    if (
      JSON.stringify(oldResource.value) == JSON.stringify(newResource.value)
    ) {
      console.log(`No changes for ${resourcePath}`);
      return;
    }
    console.log(`Updating resource ${resourcePath}`);
    const updateResourceResponse = await resourceApi.updateResource(
      workspace,
      resourcePath,
      {
        "path": resourcePath,
        "description": newResource.description,
        "value": newResource.value,
      },
    );
    console.log(`${updateResourceResponse}`);
    return updateResourceResponse;
  } catch (err) {
    console.log(`Creating resource ${resourcePath}: ${err}`);
    const newMetadata: CreateResource = {
      "path": resourcePath,
      "description": newResource.description,
      "value": newResource.value,
      "resourceType": newResource.resource_type,
    };
    console.log(`newMetadata: ${JSON.stringify(newMetadata, null, 2)}`);

    const createResourceResponse = await resourceApi.createResource(
      workspace,
      newMetadata,
    );
    console.log(`${createResourceResponse}`);
    return createResourceResponse;
  }
}

export async function handleResourceTypeUpload(
  workspace: string,
  fileName: string,
  wmClientConfig,
) {
  const resourceApi = new wmill.ResourceApi(wmClientConfig);

  const resourcePath: string = fileName.slice(
    resourceTypesPrefix.length,
    -5,
  );
  const newResource = JSON.parse(
    await Deno.readTextFile(fileName),
  );
  console.log(`\nProcessing ResourceType: ${resourcePath} at ${fileName}`);
  try {
    const oldResource = await resourceApi.getResourceType(
      workspace,
      resourcePath,
    );
    if (oldResource.schema == newResource.schema) {
      console.log(`No changes for ResourceType: ${resourcePath}`);
      return;
    }
    console.log(`Updating ResourceType: ${resourcePath}`);
    try {
      const updateResourceResponse = await resourceApi.updateResourceType(
        newResource.workspace_id,
        resourcePath,
        {
          "description": newResource.description,
          "schema": newResource.schema,
        },
      );
      console.log(`${updateResourceResponse}`);
      return;
    } catch (err) {
      console.log(`Error updating ResourceType: ${err}`);
      return;
    }
  } catch (err) {
    console.log(`Creating ResourceType: ${resourcePath}: ${err}`);
    try {
      const createResourceResponse = await resourceApi.createResourceType(
        workspace,
        {
          "workspaceId": workspace,
          "name": resourcePath,
          "schema": newResource.schema,
          "description": newResource.description,
        },
      );
      console.log(`ResourceType created: ${createResourceResponse}`);
      return;
    } catch (err) {
      console.log(`Error creating ResourceType: ${err}`);
    }
  }
}

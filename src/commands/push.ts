import { bold, CreateResource, walk, wmill } from "../deps.ts";

// TODO: Implement flow upload
export async function handleFlowUpload(
  fileName: string,
  wmClientConfig,
) {
  const workspace = wmClientConfig.workspace_id;
  const flowApi = new wmill.FlowApi(wmClientConfig);
  const flowPath = fileName.slice(`${workspace}/flows/`.length, -5);
  await flowApi.createFlow(wmClientConfig.workspace_id, flowPath);
}

export async function handleWorkspaceUpload(wmClientConfig) {
  for await (const entry of walk(".")) {
    if (entry.isDirectory) {
      continue;
    }
    const fileName = entry.path;
    if (
      fileName.startsWith(`${wmClientConfig.workspace_id}/scripts`) &&
      (fileName.endsWith(".ts") || fileName.endsWith(".py"))
    ) {
      console.log(bold(`Pushing Script ${entry.name}`));
      await handleScriptUpload(
        wmClientConfig.workspace_id,
        fileName,
        wmClientConfig,
      );
    } else if (
      fileName.startsWith(`${wmClientConfig.workspace_id}/resource_types`)
    ) {
      console.log(bold(`Pushing Resource Type ${entry.name}`));
      await handleResourceTypeUpload(
        wmClientConfig.workspace_id,
        fileName,
        wmClientConfig,
      );
    } else if (
      fileName.startsWith(`${wmClientConfig.workspace_id}/resources`)
    ) {
      console.log(bold(`Pushing Resource ${entry.name}`));
      await handleResourceUpload(
        wmClientConfig.workspace_id,
        fileName,
        wmClientConfig,
      );
    } else if (fileName.startsWith(`${wmClientConfig.workspace_id}/flows`)) {
      console.log(bold(`Pushing Flow ${entry.name}`));
      // await handleFlowUpload()
    } else {
      continue;
    }
  }
}

export async function handleScriptUpload(
  fileName: string,
  wmClientConfig,
) {
  const scriptApi = new wmill.ScriptApi(wmClientConfig);
  const scriptContent = await Deno.readTextFile(fileName);
  const scriptPath = fileName.slice(`${workspace}/scripts/`.length, -3);
  const language = fileName.endsWith(".ts") ? "deno" : "python3";
  const workspace = wmClientConfig.workspace_id;
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

export async function handleResourceUpload(
  fileName: string,
  wmClientConfig,
) {
  const resourceApi = new wmill.ResourceApi(wmClientConfig);
  const resourcePath: string = fileName.slice(
    `${workspace}/resources/`.length,
    -5,
  );
  const newResource = JSON.parse(
    await Deno.readTextFile(fileName),
  );
  const workspace = wmClientConfig.workspace_id;
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
  fileName: string,
  wmClientConfig,
) {
  const resourceApi = new wmill.ResourceApi(wmClientConfig);
  const workspace = wmClientConfig.workspace_id;
  const resourcePath: string = fileName.slice(
    `${workspace}/resource_types/`.length,
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

import * as wmill from "https://deno.land/x/windmill@v1.29.0/mod.ts";

export async function main(name: string = "Don Quichotte") {
  console.log(`Hello ${name}!`);
  const remote_variable = await wmill.getVariable("g/all/pretty_secret");
  console.log(
    `The env variable at \`g/all/pretty_secret\`: ${remote_variable}`,
  );
  return { "len": name.length, "splitted": name.split(" ") };
}

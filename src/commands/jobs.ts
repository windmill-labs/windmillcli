import { bold, green, red, wmill } from "../deps.ts";
import { displayJobsHelpAndQuit } from "../error.ts";

export async function jobsHandler(wmClientConfiguration, args?) {
  if (args.length == 0 || !args.n) {
    displayJobsHelpAndQuit("n flag is required");
  }
  const jobApi = new wmill.JobApi(wmClientConfiguration);
  let seen = 0;
  const jobs = await (await jobApi.listJobs(wmClientConfiguration.workspace_id)).reverse();
  for (const job of jobs) {
    if (args?.n && seen < args.n) {
      console.log(
        (job.success ? `${green("Success")}` : `${red("Failure")}`) +
          ` ${bold(job.id)} ${job.scriptPath}`,
      );
      seen++;
    } else {
      return jobs.slice(0, seen - 1);
    }
  }
}

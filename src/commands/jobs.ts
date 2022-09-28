import { bold, green, red, wmill } from "../deps.ts";
import { displayJobsHelpAndQuit } from "../error.ts";

export async function jobsHandler(wmClientConfiguration, args?) {
  if (args.h || args.help) {
    displayJobsHelpAndQuit();
  }

  const jobApi = new wmill.JobApi(wmClientConfiguration);
  let seen = 0;
  const jobs = (await jobApi.listJobs(wmClientConfiguration.workspace_id))
    .reverse(); // Jobs are sorted oldest first by default
  for (const job of jobs) {
    if (args?.n && seen >= args.n) break;

    console.log(
      (job.success ? `${green("Success")}` : `${red("Failure")}`) +
        ` at ${job.createdAt.toUTCString()}` +
        ` ${bold(job.id)} ${job.scriptPath}`,
    );
    seen++;
  }
  console.log(`${bold(`${seen} jobs`)}`);
  return jobs.slice(0, seen - 1);
}

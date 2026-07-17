import { spawn } from "bun";

const getWorkspaceFilter = (serviceName: string | undefined): string | null => {
  if (!serviceName) {
    return null;
  }
  if (serviceName.includes("server")) {
    return "server";
  }
  if (serviceName.includes("operator") || serviceName === "web") {
    return "web";
  }
  if (serviceName.includes("citizen")) {
    return "citizen";
  }
  throw new Error(`Unsupported Railway service: ${serviceName}`);
};

const workspaceFilter = getWorkspaceFilter(process.env.RAILWAY_SERVICE_NAME);
const command = ["bun", "x", "turbo", "run", "build"];
if (workspaceFilter) {
  command.push(`--filter=${workspaceFilter}`);
}

const buildProcess = spawn(command, {
  stderr: "inherit",
  stdin: "inherit",
  stdout: "inherit",
});
const exitCode = await buildProcess.exited;
if (exitCode !== 0) {
  throw new Error(`Railway build failed with exit code ${exitCode}`);
}

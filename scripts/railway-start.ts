import { spawn } from "bun";

const runCommand = async (command: string[]): Promise<void> => {
  const childProcess = spawn(command, {
    stderr: "inherit",
    stdin: "inherit",
    stdout: "inherit",
  });
  const exitCode = await childProcess.exited;
  if (exitCode !== 0) {
    throw new Error(
      `Command ${command.join(" ")} failed with exit code ${exitCode}`
    );
  }
};

const serviceName = process.env.RAILWAY_SERVICE_NAME;
if (!serviceName) {
  throw new Error("RAILWAY_SERVICE_NAME is required to start a service");
}

if (serviceName.includes("server")) {
  await runCommand(["bun", "run", "--cwd", "packages/db", "db:deploy"]);
  await runCommand(["bun", "run", "--cwd", "apps/server", "start"]);
} else if (serviceName.includes("operator") || serviceName === "web") {
  await runCommand(["bun", "run", "--cwd", "apps/web", "start"]);
} else if (serviceName.includes("citizen")) {
  await runCommand(["bun", "run", "--cwd", "apps/citizen", "start"]);
} else {
  throw new Error(`Unsupported Railway service: ${serviceName}`);
}

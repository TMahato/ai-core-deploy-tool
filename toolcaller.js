import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

/**
 * Resolve a Python command that works on your machine.
 * On Windows with the Store Python, "python" is fine. Some setups need "py".
 */
function resolvePythonCmd() {
  const isWin = process.platform === "win32";
  return isWin ? "python" : "python3";
}

/**
 * Run the Python updater.
 * @param {string} imageTag - e.g. "demo_serve:02"
 * @param {object} opts
 * @param {string} [opts.scriptPath] - path to update_image.py
 * @param {string} [opts.filePath] - YAML path (defaults inside Python)
 * @param {object} [opts.env] - extra env vars
 * @returns {Promise<{ code:number, stdout:string, stderr:string }>}
 */
function runPython(imageTag, { scriptPath, filePath, env } = {}) {
  if (!imageTag) {
    throw new Error("imageTag is required");
  }

  const python = resolvePythonCmd();
  const script = scriptPath ?? path.resolve("./openmcp.py");

  const args = [script, "--image-tag", imageTag];
  if (filePath) args.push("--file-path", filePath);

  const child = spawn(python, args, {
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      ...env,
    },
    cwd: process.cwd(),
    shell: false,
  });

  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (d) => (stdout += d.toString()));
  child.stderr.on("data", (d) => (stderr += d.toString()));

  return new Promise((resolve) => {
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

async function main() {
  const imageTag = process.argv[2] ?? "demo_serve:02";

  const { code, stdout, stderr } = await runPython(imageTag, {
    env: {
      DEPLOYMENT_ID: process.env.DEPLOYMENT_ID ?? "d0ed15d3637c8205",
    },
  });

  if (stdout) console.log(stdout.trim());
  if (stderr) console.error(stderr.trim());

  if (code !== 0) {
    process.exitCode = code;
    console.error(`Python exited with code ${code}`);
  } else {
    console.log("✅ Image update completed.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

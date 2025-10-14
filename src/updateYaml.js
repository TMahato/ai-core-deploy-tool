import inquirer from "inquirer";
import { spawn } from "child_process";
import path from "path";
import process from "process";
import { listAllDockerHubImages } from "./dockerhub-list.js"; 

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

async function callPythonScript(imageTag) {
  const { code, stdout, stderr } = await runPython(imageTag, {
    env: {
      DEPLOYMENT_ID: process.env.DEPLOYMENT_ID,
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



export async function updateYaml() {
  let dockerImageNames = [];
  try {
    dockerImageNames = await listAllDockerHubImages();
  } catch (e) {
    console.error("Failed to fetch images from Docker Hub:", e);
    // Fallback (optional): keep a tiny default list so the tool still runs
    dockerImageNames = ['aicore_deploy-tool:02', 'aicore-docker-deploy:04'];
  }

  if (dockerImageNames.length === 0) {
    console.error("No images found for the given namespace.");
    return;
  }

  const { selectedApi } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedApi",
      message: "Choose an endpoint:",
      choices: [...dockerImageNames],
    },
  ]);

  console.log(`\n🔄 Updating YAML with image: ${selectedApi}...\n`);
  
  await callPythonScript(selectedApi);
}

export { callPythonScript };
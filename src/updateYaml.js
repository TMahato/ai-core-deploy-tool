import inquirer from "inquirer";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function updateYaml() {
  let dockerImageNames = ['aicore_deploy-tool', 'aicore-docker-deploy']; // called from db

  const { selectedApi } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedApi",
      message: "Choose an endpoint:",
      choices: [...dockerImageNames],
    },
  ]);

  console.log(`\n🔄 Updating YAML with image: ${selectedApi}...\n`);
  
  // Call Python script with the selected image name
  await callPythonScript(selectedApi);
}

function callPythonScript(imageName) {
  return new Promise((resolve, reject) => {
    // Path to your Python script
    const scriptPath = path.join(__dirname, "..", "openmcp.py");
    
    // Spawn Python process
    const pythonProcess = spawn("python", [scriptPath], {
      cwd: path.join(__dirname, ".."), // Set working directory to project root
      env: { ...process.env } // Pass environment variables
    });

    // Send the image name to Python's stdin
    pythonProcess.stdin.write(`${imageName}\n`);
    pythonProcess.stdin.end();

    // Capture stdout
    pythonProcess.stdout.on("data", (data) => {
      console.log(data.toString());
    });

    // Capture stderr
    pythonProcess.stderr.on("data", (data) => {
      console.error(`Error: ${data.toString()}`);
    });

    // Handle process completion
    pythonProcess.on("close", (code) => {
      if (code === 0) {
        console.log("\n YAML file updated successfully!");
        resolve();
      } else {
        console.error(`\n Python script exited with code ${code}`);
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    // Handle process errors
    pythonProcess.on("error", (error) => {
      console.error(`\n Failed to start Python process: ${error.message}`);
      reject(error);
    });
  });
}

// Optional: Export the helper function if needed elsewhere
export { callPythonScript };
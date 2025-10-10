import { spawn } from "child_process";
import readline from "readline";
import inquirer from "inquirer";

export async function openNewTerminalAndRunCommand() {
  console.log("🚀 Opening new terminal and running Docker commands...\n");
  
  const { imageNameChoice } = await inquirer.prompt([
    {
      type: "list",
      name: "imageNameChoice",
      message: "Choose Docker image name:",
      choices: [
        { name: "Use default: aicore_deploy-tool", value: "aicore_deploy-tool" },
        { name: "Enter custom name", value: "custom" }
      ],
    },
  ]);

  let imageName = imageNameChoice;

  if (imageNameChoice === "custom") {
    const { customImageName } = await inquirer.prompt([
      {
        type: "input",
        name: "customImageName",
        message: "Enter your custom Docker image name:",
        validate: (input) => {
          if (input.trim() === "") {
            return "Please enter a valid image name";
          }
          return true;
        }
      },
    ]);
    imageName = customImageName.trim();
  }

  const fullImageName = `docker.io/tanmay471/${imageName}:01`;
  console.log(`Using Docker image: ${fullImageName}\n`);
  
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    
    let terminalCommand = 'cmd.exe';
    let commandArgs;
    
    const dockerCommands = [
      `docker build -t ${fullImageName} .`,
      `docker push ${fullImageName}`
    ];
    
    const combinedCommand = dockerCommands.join(' && ');

    console.log("Building and pushing Docker image is started...");

    async function runCommandsSequentially() {
      for(let i = 0; i < dockerCommands.length; i++) {
        const command = dockerCommands[i];
        console.log(`🔄 Running command ${i + 1}: ${command}`);
        
        // Wait for this command to complete before moving to next
        await new Promise((commandResolve, commandReject) => {
          if(isWindows) {
            commandArgs = ['/c', 'start', 'cmd.exe', '/c', command];
          }
          
          const dockerProcess = spawn(terminalCommand, commandArgs, {
            detached: false,
            stdio: ['ignore', 'pipe', 'pipe'],
            cwd: process.cwd(),
            windowsHide: true
          });

          dockerProcess.on('close', (code) => {
            console.log(`✅ Command ${i + 1} completed with exit code: ${code}`);
            if (code === 0) {
              commandResolve();
            } else {
              console.error(`❌ Command ${i + 1} failed with exit code: ${code}`);
              commandReject(new Error(`Command failed with exit code ${code}`));
            }
          });

          dockerProcess.on('error', (error) => {
            console.error('Error running command:', error.message);
            commandReject(error);
          });
        });
        
        console.log(`✅ Command ${i + 1} finished, moving to next command...`);
      }
      
      console.log("🎉 All Docker commands completed successfully!");
      
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question("Press Enter to continue...", () => {
        rl.close();
        console.log("Docker process completed!\n");
        resolve();
      });
    }

    // Start the sequential execution
    runCommandsSequentially().catch((error) => {
      console.error('Error in command execution:', error.message);
      
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question("Press Enter to continue...", () => {
        rl.close();
        console.log("Docker process completed with errors!\n");
        resolve();
      });
    });

  });
}

#!/usr/bin/env node

import inquirer from "inquirer";
import axios from "axios";
import { openNewTerminalAndRunCommand } from "./src/terminalService.js";
import { updateYaml } from "./src/updateYaml.js"

// Define your API endpoints
const queries = [
    "build-docker",
    "update-yaml",
    "create configuration & trigger executions",
    "show execution details and logs"
];



async function main() {
    console.log("\nSelect an API to call:\n");

    const { selectedApi } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedApi",
        message: "Choose an endpoint:",
        choices: [...queries, "exit"],
      },
    ]);


    console.log(`\n🔄 Calling ${selectedApi}...\n`);

    if(selectedApi === "build-docker") {
      await openNewTerminalAndRunCommand();
    }
    if(selectedApi === "update-yaml") {
      await updateYaml();
    }

    process.exit(0);
}

main();

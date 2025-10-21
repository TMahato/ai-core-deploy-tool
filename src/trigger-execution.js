import 'dotenv/config'; // npm i dotenv (optional)
import { Buffer } from 'node:buffer';
import inquirer from "inquirer";
import readline from "readline/promises";


var {
  AICORE_CLIENT_ID,
  AICORE_CLIENT_SECRET,
  AICORE_AUTH_URL,
  AICORE_BASE_URL,
  AI_RESOURCE_GROUP
} = process.env;


const rl = 	readline.createInterface({
		input:process.stdin,
		output: process.stdout
	});

async function getAccessToken() {
  const body = new URLSearchParams({
    grant_type: 'client_credentials'
  });

  const basic = Buffer.from(`${AICORE_CLIENT_ID}:${AICORE_CLIENT_SECRET}`).toString('base64');
  AICORE_AUTH_URL = AICORE_AUTH_URL.replace(/\/+$/, '') + '/oauth/token';
  
  const res = await fetch(AICORE_AUTH_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Token request failed (${res.status}): ${txt}`);
  }
  
  const json = await res.json();
  return json.access_token;
}

async function getRepos() {
    const token = await getAccessToken();
    

    const headers = { Authorization: `Bearer ${token}` };

    const res = await fetch(`${AICORE_BASE_URL}/v2/admin/repositories`, {
        method: 'GET',
        headers
    });
    const data = await res.json();

    const repos = data.resources.map(x => x.name);

    console.log(`\nPresent Repositories are:`);
    console.log(data);
        

    var { repoName } = await inquirer.prompt([
        {
            type: "list",
            name: "repoName",
            message: "Choose an repository:",
            choices: ["Already Present", "create new repository"],
        },
    ]);
  
    return repoName;
}


async function getApplication() {
    const token = await getAccessToken();

    const headers = { Authorization: `Bearer ${token}` };

    var res = await fetch(`${AICORE_BASE_URL}/v2/admin/applications`, {
        method: 'GET',
        headers
    });
    var data = await res.json();
    console.log(data);
    

    const allApps = data.resources.map(x => x.applicationName);
    

    var { appName } = await inquirer.prompt([
        {
            type: "list",
            name: "appName",
            message: "Choose an application:",
            choices: [ "create a new application", ...allApps],
        },
    ]);

    if(appName === "create a new application"){
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });


        const repositoryUrl = await rl.question('Enter repository URL: ');
        const path = await rl.question('Enter path (e.g. pipelines): ');
        const applicationName = await rl.question('Enter application name: ');
        const revision = await rl.question('Enter revision (default HEAD): ') || 'HEAD';

        var payload = {
            "repositoryUrl": repositoryUrl,
            "revision": revision,
            "path": path,
            "applicationName": applicationName
        }
        payload = JSON.stringify(payload);
        console.log("payload", payload);

        

        res = await fetch(`${AICORE_BASE_URL}/v2/admin/applications`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: payload
        });
        data = await res.json();
        console.log(data);
        if(res.status === 200){
            appName = data.id
        }
        else{
            myApp = "error";
        }
    }
    if(appName === "error"){
        return "error";
    }


    res = await fetch(`${AICORE_BASE_URL}/v2/admin/applications/${appName}`, {
        method: 'GET',
        headers
    });
    data = await res.json();
    console.log(data);


    const { isSync } = await inquirer.prompt([
        {
            type: "list",
            name: "isSync",
            message: "Choose an option:",
            choices: ["Sync the application", "Skip sync"],
        },
    ]);

    if(isSync === "Sync the application")
    {

        res = await fetch(`${AICORE_BASE_URL}/v2/admin/applications/${appName}/refresh`, {
            method: 'POST',
            headers
        });
        data = await res.json();
        console.log(data.message);

        res = await fetch(`${AICORE_BASE_URL}/v2/admin/applications/${appName}/status`, {
            method: 'GET',
            headers
        });
        data = await res.json();
        console.log(data);
        
    }
    
  
    return appName;
}



async function viewDockerRegistrySecret() {
    const token = await getAccessToken();
    

    const headers = { Authorization: `Bearer ${token}` };

    var res = await fetch(`${AICORE_BASE_URL}/v2/admin/dockerRegistrySecrets`, {
        method: 'GET',
        headers
    });
    var data = await res.json();

    const creds = data.resources.map(x => x.name);
        

    var { dockerCred } = await inquirer.prompt([
        {
            type: "list",
            name: "dockerCred",
            message: "Choose an repository:",
            choices: ["create new docker registry", ...creds],
        },
    ]);

    res = await fetch(`${AICORE_BASE_URL}/v2/admin/dockerRegistrySecrets/${dockerCred}`, {
        method: 'GET',
        headers
    });
    data = await res.json();
    console.log(data);
    return dockerCred;
}


async function getResourceGroup() {
    const token = await getAccessToken();
    

    const headers = { Authorization: `Bearer ${token}` };

    var res = await fetch(`${AICORE_BASE_URL}/v2/admin/resourceGroups`, {
        method: 'GET',
        headers
    });
    var data = await res.json();
	//console.log("Resource Group Data: ", data);
    const creds = data.resources.map(x => x.resourceGroupId);        

    var { resourceGroupId } = await inquirer.prompt([
        {
            type: "list",
            name: "resourceGroupId",
            message: "Choose an Resource Group:",
            choices: ["create new resouce group", ...creds],
        },
    ]);

    if(resourceGroupId === "create new resouce group")
    {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });


        const resourceId = await rl.question('Enter Resouce Group Name : ');
        var payload = {
            resourceGroupId: resourceId,
            labels: [
            {
                key: "ext.ai.sap.com/my-label",
                value: "string"
            }
            ]
        }
        payload = JSON.stringify(payload);
        console.log(payload);
        
        var res = await fetch(`${AICORE_BASE_URL}/v2/admin/resourceGroups`, {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: payload
        });
        
        var data = await res.json();
        resourceGroupId = data.resourceGroupId;
    }
    else{
       // res = await fetch(`${AICORE_BASE_URL}/v2/admin/dockerRegistrySecrets/${resourceGroupId}`, {
          //  method: 'GET',
          //  headers
       // });
      //  data = await res.json();
        //console.log("check resource group - ", data);
    }
    
    return resourceGroupId;
}


async function getSenario(resourseGroup) {
    const token = await getAccessToken();
    

    const headers = { Authorization: `Bearer ${token}` };

    const res = await fetch(`${AICORE_BASE_URL}/v2/lm/scenarios`, {
        method: 'GET',
        headers: {
            ...headers,
            "AI-Resource-Group": resourseGroup
        }
    });
    const data = await res.json();

    const senarios = data.resources.map(x => ({
        name: x.name,
        value: x.id
    }));

    console.log(`\nSelect your senario:`);
        

    var { senario } = await inquirer.prompt([
        {
            type: "list",
            name: "senario",
            message: "Choose an senario:",
            choices: [...senarios],
        },
    ]);
  
    return senario;
}

async function setObjectStoreCreds(resourceGroupId, headers)
{
	console.log("Checking stats....")
	const stat = await fetch(`${AICORE_BASE_URL}/v2/admin/objectStoreSecrets`, {
		method: 'GET',
		headers: {
			...headers,
			'AI-Resouce-Group': resourceGroupId
		},
	});
	const checkStats = await stat.json();
	if(checkStats.count !== 0){
		return "Object Store Already Exists";
	}
	console.log(checkStats);

	
	const s3bucketName = await rl.question('Enter your s3 bucket name: ');
	const s3endPoint = await rl.question('Enter your s3 endpoint: ');
	const pathPrefix = await rl.question('Enter your pathPrefix: ');
	const s3region = await rl.question('Enter your s3 region: ');
	const AWS_ACCESS_KEY_ID = await rl.question('Enter your AWS_ACCESS_KEY_ID: ');
	const AWS_SECRET_ACCESS_KEY = await rl.question('Enter your AWS_SECRET_ACCESS_KEY: ');
	var payload = {
		name: "default",
		type: "S3",
		bucket: s3bucketName,
		endpoint: s3endPoint,
		pathPrefix: pathPrefix,
		region: s3region,
		data: {
			AWS_ACCESS_KEY_ID: AWS_ACCESS_KEY_ID,
			AWS_SECRET_ACCESS_KEY: AWS_SECRET_ACCESS_KEY
		}

	}
	payload = JSON.stringify(payload);
	console.log(payload);

	const res = await fetch(`${AICORE_BASE_URL}/v2/admin/objectStoreSecrets`, {
		method: 'POST',
		headers: {
			...headers,
			'AI-Resouce-Group': resourceGroupId,
			'Content-Type': 'application/json'
		},
		body: payload
	});
	const data = await res.json();
	console.log("Object Store update", data);

	return "Object store secret added!"

}

async function createDeploymentConfiguration(resourceGroupId, headers){
	
	const configName = await rl.question('Enter A Configuration Name: ');
	
	var payload = {
		name: configName,
		executableId: "demo-aicore-anomaly-serving",
		senarioId: "demo-aicore-toolkit",
		inputArtifactBindings: [],
		parameterBindings: []

	};

	payload = JSON.stringify(payload);
	console.log(payload)
	var res = await fetch(`${AICORE_BASE_URL}/v2/lm/configurations`, {
		method: 'POST',
		headers: {
			...headers,
			'AI-Resouce-Group': resourceGroupId,
			'Content-Type': 'application/json'
		},
		payload: payload
	});
	var data = res.json();

	console.log(data);
}

async function main() {
    // console.log("Getting the repository list...");
    const token = await getAccessToken();
	const headers = { Authorization: `Bearer ${token}` };
    // const repoName = await getRepos();

    // if(repoName === "Already Present")
    // {
        // console.log("\nSync your application\n");
        // console.log("Fetching the applications\n");

        // const applicationName = await getApplication();
        
        // console.log("Syncing the applications is done\n");

        // console.log("Viewing docker registery creds...\n");

        // const dockerSecretName = await viewDockerRegistrySecret();
        // console.log("dockerCred", dockerSecretName);

        // console.log("Listing all the resource group present");
        //const resourseGroup = await getResourceGroup();
		//console.log(resourseGroup);
		//console.log("Listing all the Senarios");
        //const senario = await getSenario(resourseGroup);
        //console.log(senario);
	    //senario = "demo-aicore-tooolkit";
	
		//const objStore = await setObjectStoreCreds(resourseGroup, headers);
		//console.log(objStore)
		
		//create Configuration
		const resourceGroupId = 'tanmay-aicoretool';
		const confidId = await createDeploymentConfiguration(resourceGroupId, headers);

        
    // }
    process.exit(0);
    
}

main()

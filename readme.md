# SAP AI Core Deployment Extension - Complete Workflow

## Project Overview
A VS Code extension that automates the complete SAP AI Core deployment pipeline in one click.

---

## Phase 1: Project Setup & Architecture

### 1.1 Initialize Extension Project
```bash
npm install -g yo generator-code
yo code
# Select: New Extension (TypeScript)
```

### 1.2 Project Structure
```
sap-aicore-deployer/
├── src/
│   ├── extension.ts           # Main extension entry
│   ├── commands/
│   │   ├── deployCommand.ts   # Main deployment orchestrator
│   │   ├── configManager.ts   # Configuration management
│   │   └── statusMonitor.ts   # Execution monitoring
│   ├── services/
│   │   ├── dockerService.ts   # Docker build & push
│   │   ├── yamlService.ts     # YAML generation/update
│   │   ├── aicoreService.ts   # AI Core SDK operations
│   │   └── validationService.ts # Pre-deployment validation
│   ├── ui/
│   │   ├── webviewProvider.ts # Dashboard UI
│   │   ├── quickPick.ts       # User input collection
│   │   └── statusBar.ts       # Status indicators
│   ├── utils/
│   │   ├── logger.ts          # Logging utility
│   │   ├── errorHandler.ts    # Error management
│   │   └── config.ts          # Config loader
│   └── types/
│       └── index.d.ts         # TypeScript definitions
├── media/                     # Icons, CSS for webviews
├── templates/                 # YAML templates
├── package.json
├── tsconfig.json
└── README.md
```

### 1.3 Key Dependencies
```json
{
  "dependencies": {
    "@sap-ai-sdk/ai-api": "latest",
    "@sap-ai-sdk/orchestration": "latest",
    "dockerode": "^4.0.0",
    "js-yaml": "^4.1.0",
    "axios": "^1.6.0",
    "tar-fs": "^3.0.4"
  },
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "@types/node": "20.x",
    "typescript": "^5.3.0",
    "@vscode/test-electron": "^2.3.8",
    "eslint": "^8.56.0",
    "prettier": "^3.1.0"
  }
}
```

---

## Phase 2: Core Implementation

### 2.1 Extension Activation
**File: `src/extension.ts`**
- Register commands
- Initialize status bar
- Load user configuration
- Set up event listeners

### 2.2 Configuration Management
**File: `src/commands/configManager.ts`**

**Features:**
- Store AI Core credentials securely (VS Code secrets API)
- Docker Hub credentials
- Default namespaces, resource groups
- Template preferences
- Deployment history

**Configuration Schema:**
```typescript
interface AICoreConfig {
  aiCore: {
    authUrl: string;
    clientId: string;
    clientSecret: string; // Store in secrets
    apiUrl: string;
    resourceGroup: string;
  };
  docker: {
    registry: string;
    username: string;
    token: string; // Store in secrets
    imageName: string;
  };
  deployment: {
    defaultExecutableId?: string;
    defaultScenarioId?: string;
    autoSync: boolean;
    watchMode: boolean;
  };
}
```

### 2.3 Docker Service Implementation
**File: `src/services/dockerService.ts`**

**Responsibilities:**
1. **Build Docker Image**
   - Detect Dockerfile in workspace
   - Build with progress tracking
   - Tag with version/timestamp

2. **Push to Registry**
   - Authenticate with Docker Hub
   - Push with progress updates
   - Return image digest

3. **Validation**
   - Check if Docker daemon is running
   - Validate Dockerfile syntax
   - Check for .dockerignore

**Key Functions:**
```typescript
class DockerService {
  async buildImage(context: string, tag: string): Promise<string>
  async pushImage(tag: string): Promise<string>
  async validateDockerfile(): Promise<ValidationResult>
  async listLocalImages(): Promise<ImageInfo[]>
}
```

### 2.4 YAML Service Implementation
**File: `src/services/yamlService.ts`**

**Responsibilities:**
1. **Template Management**
   - Provide training/serving YAML templates
   - Support custom templates

2. **YAML Operations**
   - Create new YAML from templates
   - Update existing YAML with new image
   - Validate YAML schema
   - Support multi-document YAML files

3. **Smart Updates**
   - Parse existing YAML
   - Find image references
   - Update with new image tag
   - Preserve comments and formatting

**Key Functions:**
```typescript
class YAMLService {
  async createFromTemplate(type: 'training' | 'serving'): Promise<string>
  async updateImageReference(filePath: string, newImage: string): Promise<void>
  async validateYAML(content: string): Promise<ValidationResult>
  async findYAMLFiles(workspace: string): Promise<string[]>
}
```

### 2.5 AI Core Service Implementation
**File: `src/services/aicoreService.ts`**

**Responsibilities:**
1. **Authentication**
   - OAuth token management
   - Token refresh logic

2. **Sync Operations**
   - Sync applications using AI Core SDK
   - Monitor sync status

3. **Configuration Management**
   - Create configurations
   - List existing configurations
   - Update parameters

4. **Execution/Deployment**
   - Trigger training executions
   - Create serving deployments
   - Monitor status
   - Fetch logs

**Key Functions:**
```typescript
class AICoreService {
  async authenticate(): Promise<void>
  async syncApplication(repoUrl: string): Promise<SyncResult>
  async createConfiguration(params: ConfigParams): Promise<Configuration>
  async triggerExecution(configId: string): Promise<Execution>
  async createDeployment(configId: string): Promise<Deployment>
  async getExecutionStatus(execId: string): Promise<ExecutionStatus>
  async getExecutionLogs(execId: string): Promise<string[]>
}
```

---

## Phase 3: User Interface

### 3.1 Command Palette Commands
```typescript
// package.json contributions
"contributes": {
  "commands": [
    {
      "command": "aicore.deployOneClick",
      "title": "AI Core: Deploy Application (One Click)",
      "icon": "$(rocket)"
    },
    {
      "command": "aicore.configure",
      "title": "AI Core: Configure Settings"
    },
    {
      "command": "aicore.buildDocker",
      "title": "AI Core: Build Docker Image Only"
    },
    {
      "command": "aicore.updateYAML",
      "title": "AI Core: Update YAML Files"
    },
    {
      "command": "aicore.syncApp",
      "title": "AI Core: Sync Application"
    },
    {
      "command": "aicore.monitorExecution",
      "title": "AI Core: Monitor Executions"
    },
    {
      "command": "aicore.viewDashboard",
      "title": "AI Core: Open Dashboard"
    }
  ]
}
```

### 3.2 Webview Dashboard
**File: `src/ui/webviewProvider.ts`**

**Dashboard Features:**
- Deployment history timeline
- Current execution/deployment status
- Quick access to logs
- Configuration management UI
- Resource usage metrics
- One-click deployment button

**Technology Stack:**
- HTML/CSS/JavaScript (vanilla or React)
- VS Code Webview API
- Message passing for communication

### 3.3 Status Bar Integration
**File: `src/ui/statusBar.ts`**

**Display:**
- Current deployment status
- Last deployment time
- Quick action button
- Error indicators

### 3.4 Interactive Wizards
**File: `src/ui/quickPick.ts`**

**Wizards for:**
1. **Initial Setup**
   - AI Core credentials
   - Docker registry setup
   - Default configurations

2. **Deployment Flow**
   - Select deployment type (training/serving)
   - Choose YAML files
   - Review changes
   - Confirm deployment

---

## Phase 4: Main Deployment Orchestrator

### 4.1 One-Click Deployment Flow
**File: `src/commands/deployCommand.ts`**

```typescript
class DeploymentOrchestrator {
  async executeOneClickDeployment(type: 'training' | 'serving') {
    // 1. Pre-deployment validation
    await this.validateEnvironment()
    
    // 2. Build Docker image
    const imageTag = await this.dockerService.buildImage()
    
    // 3. Push to registry
    await this.dockerService.pushImage(imageTag)
    
    // 4. Update YAML files
    await this.yamlService.updateAllYAMLs(imageTag)
    
    // 5. Sync with AI Core
    await this.aicoreService.syncApplication()
    
    // 6. Create configuration
    const config = await this.aicoreService.createConfiguration()
    
    // 7. Trigger execution/deployment
    if (type === 'training') {
      await this.aicoreService.triggerExecution(config.id)
    } else {
      await this.aicoreService.createDeployment(config.id)
    }
    
    // 8. Monitor and report
    await this.monitorProgress()
  }
}
```

### 4.2 Step-by-Step Execution with Rollback
- Each step should be atomic
- Maintain state for rollback
- Provide clear error messages
- Allow resume from failure point

---

## Phase 5: Advanced Features

### 5.1 Validation Service
**File: `src/services/validationService.ts`**

**Pre-deployment Checks:**
- Docker daemon running
- Valid Dockerfile exists
- YAML files exist and are valid
- AI Core credentials valid
- Network connectivity
- Required files present
- Python dependencies installable

### 5.2 Logging & Monitoring
**File: `src/utils/logger.ts`**

**Features:**
- Structured logging
- Log levels (DEBUG, INFO, WARN, ERROR)
- Output channel in VS Code
- Log file creation
- Performance metrics

### 5.3 Error Handling
**File: `src/utils/errorHandler.ts`**

**Strategy:**
- Centralized error handling
- User-friendly error messages
- Actionable suggestions
- Error recovery options
- Detailed logs for debugging

### 5.4 CI/CD Integration
- Support for environment variables
- Configuration file exports
- Command-line interface (optional)
- GitHub Actions integration examples

---

## Phase 6: Testing Strategy

### 6.1 Unit Tests
- Test each service independently
- Mock external dependencies
- Use Jest or Mocha

### 6.2 Integration Tests
- Test service interactions
- Mock AI Core API responses
- Test Docker operations with test images

### 6.3 E2E Tests
- Use VS Code Extension Test Runner
- Test complete deployment flow
- Use test AI Core environment

### 6.4 Test Structure
```
test/
├── suite/
│   ├── extension.test.ts
│   ├── dockerService.test.ts
│   ├── yamlService.test.ts
│   └── aicoreService.test.ts
├── fixtures/
│   ├── sample-dockerfile
│   ├── sample-training.yaml
│   └── sample-serving.yaml
└── runTest.ts
```

---

## Phase 7: Documentation & Publishing

### 7.1 Documentation
- **README.md**: Overview, installation, quick start
- **CHANGELOG.md**: Version history
- **CONTRIBUTING.md**: Contribution guidelines
- **docs/**:
  - Configuration guide
  - API reference
  - Troubleshooting
  - Architecture diagram

### 7.2 VS Code Marketplace
1. Create publisher account
2. Package extension: `vsce package`
3. Publish: `vsce publish`
4. Add screenshots and demo GIF
5. Create demo video

### 7.3 Repository Setup
- GitHub repository with CI/CD
- GitHub Actions for:
  - Automated testing
  - Version bumping
  - Marketplace publishing
- Issue templates
- Pull request templates

---

## Phase 8: Production Readiness Checklist

### 8.1 Security
- [ ] Store credentials in VS Code secrets API
- [ ] Never log sensitive information
- [ ] Validate all user inputs
- [ ] Use HTTPS for all API calls
- [ ] Implement rate limiting
- [ ] Add timeout mechanisms

### 8.2 Performance
- [ ] Implement caching where appropriate
- [ ] Async operations with progress indicators
- [ ] Lazy loading for heavy operations
- [ ] Resource cleanup (Docker connections, etc.)
- [ ] Memory leak prevention

### 8.3 User Experience
- [ ] Clear progress indicators
- [ ] Informative error messages
- [ ] Confirmation dialogs for destructive actions
- [ ] Keyboard shortcuts
- [ ] Context menu integration
- [ ] Quick fixes for common issues

### 8.4 Reliability
- [ ] Retry logic for network operations
- [ ] Graceful degradation
- [ ] State persistence across restarts
- [ ] Proper cleanup on extension deactivation
- [ ] Handle VS Code API changes

### 8.5 Monitoring & Analytics
- [ ] Telemetry (opt-in)
- [ ] Error reporting (Sentry/similar)
- [ ] Usage metrics
- [ ] Performance monitoring

---

## Phase 9: Deployment Timeline

### Week 1-2: Foundation
- Project setup
- Basic extension structure
- Configuration management
- Docker service (build & push)

### Week 3-4: Core Services
- YAML service implementation
- AI Core service integration
- Basic deployment orchestrator
- Initial UI (commands only)

### Week 5-6: Advanced Features
- Webview dashboard
- Status monitoring
- Log viewing
- Error handling refinement

### Week 7-8: Testing & Polish
- Unit and integration tests
- E2E testing
- Documentation
- Bug fixes

### Week 9-10: Production Ready
- Security audit
- Performance optimization
- Beta testing
- Marketplace submission

---

## Sample Configuration File

**`.vscode/aicore-deploy.json`**
```json
{
  "version": "1.0.0",
  "aiCore": {
    "authUrl": "https://your-tenant.authentication.sap.hana.ondemand.com",
    "apiUrl": "https://api.ai.prod.eu-central-1.aws.ml.hana.ondemand.com",
    "resourceGroup": "default"
  },
  "docker": {
    "registry": "docker.io",
    "imageName": "your-username/your-app",
    "buildContext": "./",
    "dockerfile": "Dockerfile"
  },
  "deployment": {
    "trainingYAML": "./workflows/training.yaml",
    "servingYAML": "./workflows/serving.yaml",
    "autoTag": true,
    "tagFormat": "{{version}}-{{timestamp}}"
  }
}
```

---

## Key Success Factors

1. **Start Simple**: Begin with manual steps, automate incrementally
2. **User Feedback**: Beta test with real users early
3. **Error Handling**: Invest heavily in helpful error messages
4. **Documentation**: Write docs as you build
5. **Modularity**: Keep services decoupled for easier testing
6. **Progress Visibility**: Always show what's happening
7. **Rollback Capability**: Allow users to undo actions
8. **Offline Support**: Cache what you can, fail gracefully

---

## Next Steps

1. Set up development environment
2. Create initial extension scaffold
3. Implement Docker service first (easiest to test)
4. Build iteratively, testing each component
5. Get early user feedback
6. Iterate based on real-world usage
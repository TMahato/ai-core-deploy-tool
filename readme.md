# AI Core Deploy Tool

A Node.js CLI tool that automates Docker image building and pushing for SAP AI Core deployment pipeline.

## 🚀 Features

- **Interactive CLI Interface**: User-friendly menu-driven interface using Inquirer.js
- **Docker Automation**: Automated Docker image building and pushing
- **Configurable Image Names**: Users can choose default or custom Docker image names
- **Sequential Command Execution**: Commands run one by one ensuring proper completion
- **Real-time Feedback**: Shows command progress and completion status
- **Error Handling**: Comprehensive error handling and user feedback

## 📁 Project Structure

```
ai-core-deploy-tool/
├── src/
│   └── terminalService.js      # Terminal command execution service
├── app.js                      # Main application entry point
├── package.json                # Project dependencies and scripts
├── Dockerfile                  # Docker container configuration
├── .gitignore                  # Git ignore rules
├── readme.md                   # Project documentation
└── notes.txt                   # Development notes
```

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/TMahato/ai-core-deploy-tool.git
   cd ai-core-deploy-tool
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the application**:
   ```bash
   npm start
   # or
   node app.js
   ```

## 🎯 Usage

### Main Menu Options

When you run the application, you'll see a menu with the following options:

1. **build-docker** - Build and push Docker image
2. **update-yamls** - Update YAML configuration files
3. **create configuration & trigger executions** - Create and trigger AI Core executions
4. **show execution details and logs** - View execution details and logs
5. **exit** - Exit the application

### Docker Image Building

When you select "build-docker", the application will:

1. **Ask for image name**:
   - Use default: `aicore_deploy-tool`
   - Enter custom name

2. **Execute commands sequentially**:
   - `docker build -t docker.io/tanmay471/[IMAGE_NAME]:01 .`
   - `docker push docker.io/tanmay471/[IMAGE_NAME]:01`

3. **Provide real-time feedback**:
   - Shows which command is running
   - Displays completion status with exit codes
   - Confirms successful completion

## 🐳 Docker Configuration

The project includes a `Dockerfile` configured for Node.js applications:

- **Base Image**: `node:18-alpine` (lightweight and secure)
- **Working Directory**: `/app`
- **Dependencies**: Production dependencies only
- **Security**: Runs as non-root user (`nodejs`)
- **Entry Point**: `node app.js`

### Building the Docker Image

```bash
# Build locally
docker build -t aicore-deploy-local .

# Run the container
docker run -it aicore-deploy-local
```

## 📦 Dependencies

- **inquirer**: Interactive command line user interface
- **axios**: HTTP client for API requests
- **child_process**: Node.js built-in for spawning processes

## 🔧 Development

### Project Setup

1. **Node.js Version**: 18 or higher
2. **Package Manager**: npm
3. **Module Type**: ES Modules (`"type": "module"`)

### Key Features Implementation

- **Sequential Command Execution**: Uses async/await with Promises to ensure commands run one by one
- **User Input Validation**: Validates Docker image names and user inputs
- **Cross-platform Support**: Works on Windows, macOS, and Linux
- **Error Handling**: Comprehensive error handling with user-friendly messages

## 🚀 Future Enhancements

- [ ] Add support for different Docker registries
- [ ] Implement YAML configuration file updates
- [ ] Add AI Core SDK integration
- [ ] Create configuration management system
- [ ] Add execution monitoring and logging
- [ ] Implement deployment status dashboard

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [package.json](package.json) file for details.

## 🤝 Support

If you have any questions or need help, please:

1. Check the [Issues](https://github.com/TMahato/ai-core-deploy-tool/issues) page
2. Create a new issue if your question isn't answered
3. Contact the maintainers

## 🔗 Links

- **GitHub Repository**: [https://github.com/TMahato/ai-core-deploy-tool](https://github.com/TMahato/ai-core-deploy-tool)
- **Docker Hub**: [https://hub.docker.com/r/tanmay471/aicore_deploy-tool](https://hub.docker.com/r/tanmay471/aicore_deploy-tool)

---

**Made with ❤️ for SAP AI Core deployment automation**
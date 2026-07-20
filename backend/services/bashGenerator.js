class BashGenerator {
  generate(config) {
    const {
      scriptName = 'script',
      description = '',
      shebang = '#!/bin/bash',
      strictMode = true,
      logging = true,
      errorHandling = true,
      functions = [],
      mainLogic = [],
      dependencies = []
    } = config;

    // Handle dependencies that might come as string from textarea
    const processedDependencies = Array.isArray(dependencies) 
      ? dependencies 
      : (typeof dependencies === 'string' ? dependencies.split('\n').filter(dep => dep.trim()) : []);

    // Handle mainLogic that might come as string from textarea
    const processedMainLogic = Array.isArray(mainLogic) 
      ? mainLogic 
      : (typeof mainLogic === 'string' ? mainLogic.split('\n').filter(cmd => cmd.trim()) : []);

    // Handle functions that might come as string from textarea
    let processedFunctions = functions;
    if (typeof functions === 'string') {
      try {
        processedFunctions = JSON.parse(functions);
      } catch (e) {
        processedFunctions = [];
      }
    }

    let script = '';

    // Shebang
    script += shebang + '\n\n';

    // Description
    if (description) {
      script += `# ${description}\n`;
    }

    // Strict mode
    if (strictMode) {
      script += '# Enable strict mode\n';
      script += 'set -euo pipefail\n\n';
    }

    // Error handling
    if (errorHandling) {
      script += '# Error handling\n';
      script += 'trap \'echo "Error occurred at line $LINENO. Exit code: $?" >&2; exit 1\' ERR\n\n';
    }

    // Logging function
    if (logging) {
      script += '# Logging function\n';
      script += 'log() {\n';
      script += '    echo "[$(date +\'%Y-%m-%d %H:%M:%S\')] $1"\n';
      script += '}\n\n';
    }

    // Dependencies check
    if (processedDependencies.length > 0) {
      script += '# Check dependencies\n';
      processedDependencies.forEach(dep => {
        script += `command -v ${dep} >/dev/null 2>&1 || { echo "Error: ${dep} is not installed" >&2; exit 1; }\n`;
      });
      script += '\n';
    }

    // Functions
    if (processedFunctions.length > 0) {
      script += '# Functions\n';
      processedFunctions.forEach(func => {
        script += `${func.name}() {\n`;
        if (func.description) {
          script += `    # ${func.description}\n`;
        }
        func.body.split('\n').forEach(line => {
          if (line.trim()) {
            script += `    ${line}\n`;
          }
        });
        script += '}\n\n';
      });
    }

    // Main logic
    script += '# Main execution\n';
    if (logging) {
      script += 'log "Starting script execution"\n';
    }

    processedMainLogic.forEach(command => {
      if (logging && command.trim()) {
        script += `log "Executing: ${command.replace(/"/g, '\\"')}"\n`;
      }
      script += `${command}\n`;
    });

    if (logging) {
      script += 'log "Script completed successfully"\n';
    }

    return script;
  }

  getTemplate() {
    return {
      name: 'Bash Script Generator',
      description: 'Generate Bash scripts with best practices including error handling, logging, and dependency checking',
      fields: [
        {
          name: 'scriptName',
          label: 'Script Name',
          type: 'text',
          required: true,
          placeholder: 'my-script',
          description: 'Name of the script file'
        },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          placeholder: 'This script automates the deployment process',
          description: 'Brief description of what the script does'
        },
        {
          name: 'shebang',
          label: 'Shebang',
          type: 'text',
          defaultValue: '#!/bin/bash',
          placeholder: '#!/bin/bash',
          description: 'Interpreter directive (shebang line)'
        },
        {
          name: 'strictMode',
          label: 'Enable Strict Mode',
          type: 'checkbox',
          defaultValue: true,
          description: 'Enable bash strict mode (set -euo pipefail)'
        },
        {
          name: 'logging',
          label: 'Enable Logging',
          type: 'checkbox',
          defaultValue: true,
          description: 'Add logging functionality to the script'
        },
        {
          name: 'errorHandling',
          label: 'Enable Error Handling',
          type: 'checkbox',
          defaultValue: true,
          description: 'Add error handling with trap'
        },
        {
          name: 'dependencies',
          label: 'Dependencies',
          type: 'textarea',
          placeholder: 'curl\ngit\ndocker',
          description: 'Commands/programs that must be available (one per line)'
        },
        {
          name: 'functions',
          label: 'Functions',
          type: 'json',
          placeholder: '[{"name": "backup", "description": "Create backup", "body": "cp -r /source /backup"}]',
          description: 'JSON array of functions with name, description, and body'
        },
        {
          name: 'mainLogic',
          label: 'Main Logic',
          type: 'textarea',
          placeholder: 'echo "Starting process"\nmkdir -p /tmp/workdir\ncd /tmp/workdir',
          description: 'Main script commands (one per line)'
        }
      ]
    };
  }
}

module.exports = new BashGenerator();

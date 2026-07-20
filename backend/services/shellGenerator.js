class ShellGenerator {
  generate(config) {
    const {
      scriptName = 'script',
      description = '',
      shellType = 'posix',
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

    // Shebang based on shell type
    const shebangMap = {
      'posix': '#!/bin/sh',
      'bash': '#!/bin/bash',
      'zsh': '#!/bin/zsh',
      'ksh': '#!/bin/ksh'
    };

    script += shebangMap[shellType] || '#!/bin/sh' + '\n\n';

    // Description
    if (description) {
      script += `# ${description}\n`;
    }

    // Error handling (POSIX compatible)
    if (errorHandling) {
      script += '# Error handling\n';
      if (shellType === 'posix') {
        script += 'set -e\n\n';
      } else {
        script += 'set -euo pipefail\n\n';
      }
    }

    // Logging function (POSIX compatible)
    if (logging) {
      script += '# Logging function\n';
      script += 'log() {\n';
      script += '    timestamp=$(date \'+%Y-%m-%d %H:%M:%S\')\n';
      script += '    echo "[$timestamp] $1"\n';
      script += '}\n\n';
    }

    // Dependencies check
    if (processedDependencies.length > 0) {
      script += '# Check dependencies\n';
      processedDependencies.forEach(dep => {
        script += `if ! command -v ${dep} >/dev/null 2>&1; then\n`;
        script += `    echo "Error: ${dep} is not installed" >&2\n`;
        script += '    exit 1\n';
        script += 'fi\n';
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
        script += `log "Executing: ${command}"\n`;
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
      name: 'Shell Script Generator',
      description: 'Generate portable shell scripts compatible with different shell environments',
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
          placeholder: 'This script automates system maintenance tasks',
          description: 'Brief description of what the script does'
        },
        {
          name: 'shellType',
          label: 'Shell Type',
          type: 'select',
          defaultValue: 'posix',
          options: [
            { value: 'posix', label: 'POSIX Shell (/bin/sh) - Most portable' },
            { value: 'bash', label: 'Bash (/bin/bash) - Feature rich' },
            { value: 'zsh', label: 'Zsh (/bin/zsh) - Modern features' },
            { value: 'ksh', label: 'Ksh (/bin/ksh) - Advanced scripting' }
          ],
          description: 'Target shell environment for the script'
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
          description: 'Add error handling to exit on errors'
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
          placeholder: '[{"name": "cleanup", "description": "Clean up temporary files", "body": "rm -rf /tmp/*"}]',
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

module.exports = new ShellGenerator();

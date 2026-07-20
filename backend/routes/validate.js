const express = require('express');
const router = express.Router();
const yaml = require('js-yaml');
const axios = require('axios');

// Pipeline validation endpoint
router.post('/pipeline', async (req, res) => {
  try {
    const { code, type } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Code is required for validation'
      });
    }

    const result = {
      isValid: true,
      errors: [],
      suggestions: [],
      correctedCode: null
    };

    // Validate based on type
    if (type === 'jenkins') {
      validateJenkinsPipeline(code, result);
    } else if (type === 'github-actions') {
      validateGitHubActions(code, result);
    } else if (type === 'gitlab-ci') {
      validateGitLabCI(code, result);
    } else if (type === 'dockerfile') {
      await validateDockerfile(code, result);
    } else if (type === 'terraform') {
      await validateTerraform(code, result);
    } else if (type === 'kubernetes') {
      await validateKubernetes(code, result);
    } else if (type === 'ansible') {
      validateAnsible(code, result);
    } else {
      // Generic YAML validation
      validateYAML(code, result);
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation failed'
    });
  }
});

function validateJenkinsPipeline(code, result) {
  const lines = code.split('\n');
  let hasPipelineBlock = false;
  let hasAgent = false;
  let hasStages = false;
  let braceCount = 0;
  let indentLevel = 0;
  const errors = [];
  const suggestions = [];
  
  // Check for basic Jenkinsfile structure
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Track indentation
    if (line.match(/^\s*$/)) continue; // Skip empty lines
    const currentIndent = line.length - line.trimStart().length;
    
    // Check for pipeline block
    if (trimmedLine.startsWith('pipeline {')) {
      hasPipelineBlock = true;
      braceCount++;
      indentLevel = currentIndent;
    } else if (trimmedLine.includes('agent any') || trimmedLine.includes('agent {')) {
      hasAgent = true;
    } else if (trimmedLine.includes('stages {')) {
      hasStages = true;
    } else if (trimmedLine.includes('{')) {
      braceCount++;
    } else if (trimmedLine.includes('}')) {
      braceCount--;
    }
    
    // Check for common syntax issues
    if (trimmedLine && !trimmedLine.endsWith('{') && !trimmedLine.endsWith('}') && 
        !trimmedLine.includes('//') && !trimmedLine.startsWith('/*') && 
        i < lines.length - 1 && lines[i + 1].trim().startsWith('}')) {
      errors.push(`Line ${i + 1}: Missing semicolon or incomplete statement before closing brace`);
    }
    
    // Check for proper stage syntax
    if (trimmedLine.match(/^stage\s+\(\s*['"]?[^'"]*['"]?\s*\)\s*{$/)) {
      // Valid stage syntax
    } else if (trimmedLine.match(/^stage\s+/) && !trimmedLine.includes('{')) {
      errors.push(`Line ${i + 1}: Stage block missing opening brace`);
    }
    
    // Check for steps block
    if (trimmedLine.includes('steps') && !trimmedLine.includes('{')) {
      errors.push(`Line ${i + 1}: Steps block missing opening brace`);
    }
  }
  
  // Add structural errors
  if (!hasPipelineBlock) {
    errors.push('Missing pipeline block - Jenkinsfile must start with "pipeline {"');
    result.isValid = false;
  }
  
  if (!hasAgent) {
    errors.push('Missing agent specification - Add "agent any" or specific agent configuration');
    result.isValid = false;
  }
  
  if (!hasStages) {
    errors.push('Missing stages block - Pipeline must have at least one stage');
    result.isValid = false;
  }
  
  if (braceCount !== 0) {
    errors.push(`Unmatched braces - Expected 0 balance but found ${braceCount > 0 ? braceCount + ' opening' : Math.abs(braceCount) + ' closing'} braces`);
    result.isValid = false;
  }
  
  // Check for common Jenkins syntax errors
  if (code.includes('env.JOB_NAME') && !code.includes('${env.JOB_NAME}')) {
    errors.push('Jenkins environment variables must be escaped: use ${env.JOB_NAME} instead of env.JOB_NAME');
    suggestions.push('Escape Jenkins environment variables with ${} syntax');
    result.isValid = false;
  }
  
  // Enhanced auto-correction
  let correctedCode = code;
  const corrections = [];
  
  // Fix env variables
  if (correctedCode.includes('env.JOB_NAME') || correctedCode.includes('env.BUILD_NUMBER')) {
    correctedCode = correctedCode.replace(/env\.(JOB_NAME|BUILD_NUMBER|BUILD_URL)/g, '${env.$1}');
    corrections.push('Fixed environment variable syntax');
  }
  
  // Fix missing pipeline block
  if (!hasPipelineBlock && !correctedCode.includes('pipeline')) {
    correctedCode = `pipeline {\n    agent any\n    stages {\n        stage('Example') {\n            steps {\n                echo 'Hello World'\n            }\n        }\n    }\n}\n`;
    corrections.push('Added missing pipeline structure');
  }
  
  // Fix missing agent
  if (!hasAgent && correctedCode.includes('pipeline {')) {
    correctedCode = correctedCode.replace(/(pipeline\s*{\s*)/, '$1agent any\n    ');
    corrections.push('Added missing agent specification');
  }
  
  // Fix missing stages
  if (!hasStages && correctedCode.includes('agent any')) {
    correctedCode = correctedCode.replace(/(agent\s+any\s*)/, '$1\n    stages {\n        stage(\'Build\') {\n            steps {\n                echo \'Building...\'\n            }\n        }\n    }');
    corrections.push('Added missing stages block');
  }
  
  // Fix brace balance
  if (braceCount > 0) {
    correctedCode += '\n}'.repeat(braceCount);
    corrections.push(`Added ${braceCount} missing closing brace(s)`);
  }
  
  // Fix indentation (2 spaces per level)
  const fixedLines = correctedCode.split('\n');
  let currentIndent = 0;
  const finalLines = fixedLines.map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return line;
    
    // Decrease indent for closing braces
    if (trimmed.startsWith('}')) {
      currentIndent = Math.max(0, currentIndent - 1);
    }
    
    const indentedLine = '  '.repeat(currentIndent) + trimmed;
    
    // Increase indent for opening braces
    if (trimmed.endsWith('{')) {
      currentIndent++;
    }
    
    return indentedLine;
  });
  
  correctedCode = finalLines.join('\n');
  corrections.push('Fixed indentation and formatting');
  
  // Add suggestions based on analysis
  if (code.length > 1000) {
    suggestions.push('Consider breaking down large pipelines into smaller, reusable stages');
  }
  
  if (!code.includes('post') && hasStages) {
    suggestions.push('Consider adding a post block for cleanup and notifications');
  }
  
  if (!code.includes('timeout') && hasStages) {
    suggestions.push('Consider adding timeout to prevent hanging stages');
  }
  
  result.errors = errors;
  result.suggestions = suggestions;
  
  if (corrections.length > 0) {
    result.correctedCode = correctedCode;
    suggestions.push(`Auto-corrections applied: ${corrections.join(', ')}`);
  }
}

function validateGitHubActions(code, result) {
  const errors = [];
  const suggestions = [];
  const corrections = [];
  
  try {
    // Try to parse as YAML first
    yaml.load(code);
    
    // Check for required GitHub Actions structure
    if (!code.includes('on:') && !code.includes('on:')) {
      errors.push('Missing trigger - GitHub Actions workflow must have "on:" section');
      result.isValid = false;
    }
    
    if (!code.includes('jobs:')) {
      errors.push('Missing jobs section - GitHub Actions workflow must have "jobs:" section');
      result.isValid = false;
    }
    
    // Check for common YAML issues
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('\t')) {
        errors.push(`Line ${i + 1}: Use spaces instead of tabs for indentation`);
        suggestions.push('Replace tabs with 2 spaces for YAML indentation');
        result.isValid = false;
      }
      
      // Check for proper job syntax
      const trimmedLine = line.trim();
      if (trimmedLine.match(/^[a-zA-Z0-9_-]+:\s*$/) && i < lines.length - 1) {
        const nextLine = lines[i + 1].trim();
        if (!nextLine.startsWith('runs-on:') && !nextLine.startsWith('uses:') && !nextLine.startsWith('with:') && !nextLine.startsWith('steps:')) {
          errors.push(`Line ${i + 1}: Job missing runs-on, uses, or steps specification`);
          result.isValid = false;
        }
      }
    }
    
  } catch (yamlError) {
    errors.push(`YAML syntax error: ${yamlError.message}`);
    result.isValid = false;
    
    // Enhanced auto-correction for YAML issues
    let correctedCode = code;
    
    // Fix common YAML issues
    if (correctedCode.includes('\t')) {
      correctedCode = correctedCode.replace(/\t/g, '  ');
      corrections.push('Replaced tabs with spaces');
    }
    
    // Fix missing quotes around special characters
    correctedCode = correctedCode.replace(/:\s*([^\s\n]*[{}\[\]|>])/g, ': \'$1\'');
    corrections.push('Added quotes around special characters');
    
    // Fix indentation issues
    const fixedLines = correctedCode.split('\n');
    let indentLevel = 0;
    const finalLines = fixedLines.map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      
      // Decrease indent for closing braces
      if (trimmed.startsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      const indentedLine = '  '.repeat(indentLevel) + trimmed;
      
      // Increase indent for opening braces
      if (trimmed.endsWith(':')) {
        indentLevel++;
      }
      
      return indentedLine;
    });
    
    correctedCode = finalLines.join('\n');
    corrections.push('Fixed YAML indentation');
    
    if (correctedCode !== code) {
      result.correctedCode = correctedCode;
    }
  }
  
  // Add intelligent suggestions
  if (!code.includes('timeout-minutes') && code.includes('jobs:')) {
    suggestions.push('Consider adding timeout-minutes to prevent hanging jobs');
  }
  
  if (!code.includes('permissions:') && code.includes('on:')) {
    suggestions.push('Consider adding permissions for security best practices');
  }
  
  if (code.includes('npm') && !code.includes('cache:')) {
    suggestions.push('Consider adding cache for npm dependencies to speed up builds');
  }
  
  // Auto-correction for missing structure
  let correctedCode = result.correctedCode || code;
  
  if (!code.includes('on:') && !correctedCode.includes('on:')) {
    correctedCode = 'on: [push]\n' + correctedCode;
    corrections.push('Added missing trigger section');
  }
  
  if (!code.includes('jobs:') && correctedCode.includes('on:')) {
    correctedCode += '\n\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v3\n      - name: Setup Node.js\n        uses: actions/setup-node@v3\n        with:\n          node-version: \'18\'\n      - run: npm ci\n      - run: npm test';
    corrections.push('Added missing job structure');
  }
  
  result.errors = errors;
  result.suggestions = suggestions;
  
  if (corrections.length > 0) {
    result.correctedCode = correctedCode;
    suggestions.push(`Auto-corrections applied: ${corrections.join(', ')}`);
  }
}

function validateGitLabCI(code, result) {
  try {
    // Try to parse as YAML
    yaml.load(code);
    
    // Check for GitLab CI specific structure
    if (!code.includes('stages:')) {
      result.suggestions.push('Consider adding stages: section to define pipeline stages');
    }
    
    const lines = code.split('\n');
    let hasJob = false;
    
    for (const line of lines) {
      if (line.match(/^[a-zA-Z0-9_-]+:\s*$/)) {
        hasJob = true;
        break;
      }
    }
    
    if (!hasJob) {
      result.errors.push('No jobs found - GitLab CI must have at least one job');
      result.isValid = false;
    }
    
  } catch (yamlError) {
    result.errors.push(`YAML syntax error: ${yamlError.message}`);
    result.isValid = false;
  }
}

function validateYAML(code, result) {
  const errors = [];
  const suggestions = [];
  const corrections = [];
  
  try {
    yaml.load(code);
    suggestions.push('YAML syntax is valid');
    
    // Additional checks for best practices
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('\t')) {
        errors.push(`Line ${i + 1}: Use spaces instead of tabs for YAML indentation`);
        suggestions.push('Replace tabs with 2 spaces for YAML indentation');
        result.isValid = false;
      }
    }
    
  } catch (yamlError) {
    errors.push(`YAML syntax error: ${yamlError.message}`);
    result.isValid = false;
    
    // Enhanced auto-correction for YAML
    let correctedCode = code;
    
    // Fix tabs to spaces
    if (correctedCode.includes('\t')) {
      correctedCode = correctedCode.replace(/\t/g, '  ');
      corrections.push('Replaced tabs with spaces');
    }
    
    // Fix common YAML syntax issues
    // Add quotes around values with special characters
    correctedCode = correctedCode.replace(/:\s*([^\s\n]*[{}\[\]|>])/g, ': \'$1\'');
    corrections.push('Added quotes around special characters');
    
    // Fix missing quotes around string values that contain spaces
    correctedCode = correctedCode.replace(/:\s*([^\n\r]*\s[^\n\r:]*)/g, ': \'$1\'');
    corrections.push('Fixed unquoted string values');
    
    // Fix indentation
    const fixedLines = correctedCode.split('\n');
    let indentLevel = 0;
    const finalLines = fixedLines.map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      
      // Decrease indent for closing braces
      if (trimmed.startsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      const indentedLine = '  '.repeat(indentLevel) + trimmed;
      
      // Increase indent for opening braces
      if (trimmed.endsWith(':')) {
        indentLevel++;
      }
      
      return indentedLine;
    });
    
    correctedCode = finalLines.join('\n');
    corrections.push('Fixed YAML indentation and structure');
    
    // Try to fix unmatched quotes
    const openQuotes = (correctedCode.match(/\'/g) || []).length;
    if (openQuotes % 2 !== 0) {
      correctedCode += '\'';
      corrections.push('Fixed unmatched quote');
    }
    
    if (correctedCode !== code) {
      result.correctedCode = correctedCode;
    }
  }
  
  // Add intelligent suggestions based on content
  if (code.includes('docker') && !code.includes('image:')) {
    suggestions.push('Consider specifying Docker image version for reproducibility');
  }
  
  if (code.includes('port:') && !code.includes('containerPort:')) {
    suggestions.push('Consider using containerPort for Kubernetes services');
  }
  
  if (code.length > 500 && !code.includes('#')) {
    suggestions.push('Consider adding comments to document your YAML configuration');
  }
  
  result.errors = errors;
  result.suggestions = suggestions;
  
  if (corrections.length > 0) {
    result.correctedCode = correctedCode;
    suggestions.push(`Auto-corrections applied: ${corrections.join(', ')}`);
  }
}

// Dockerfile validation using Hadolint API
async function validateDockerfile(code, result) {
  const errors = [];
  const suggestions = [];
  const corrections = [];
  
  try {
    // Basic Dockerfile syntax validation
    const lines = code.split('\n');
    let hasFrom = false;
    let hasWorkdir = false;
    let hasRun = false;
    let hasExpose = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.toUpperCase().startsWith('FROM')) {
        hasFrom = true;
        // Check if FROM uses specific tag
        if (!line.includes(':') && !line.includes('@sha256:')) {
          suggestions.push(`Line ${i + 1}: Consider using a specific tag version instead of 'latest' for reproducibility`);
        }
      }
      
      if (line.toUpperCase().startsWith('WORKDIR')) {
        hasWorkdir = true;
      }
      
      if (line.toUpperCase().startsWith('RUN')) {
        hasRun = true;
        // Check for common RUN issues
        if (line.includes('apt-get update') && !line.includes('apt-get install')) {
          suggestions.push(`Line ${i + 1}: Combine apt-get update with install in the same RUN command`);
        }
        if (line.includes('yum update') && !line.includes('yum install')) {
          suggestions.push(`Line ${i + 1}: Combine yum update with install in the same RUN command`);
        }
      }
      
      if (line.toUpperCase().startsWith('EXPOSE')) {
        hasExpose = true;
      }
      
      // Check for common Dockerfile issues
      if (line.toUpperCase().startsWith('ADD') && !line.includes('http')) {
        suggestions.push(`Line ${i + 1}: Consider using COPY instead of ADD for local files`);
      }
      
      if (line.includes('sudo') && line.toUpperCase().startsWith('RUN')) {
        errors.push(`Line ${i + 1}: Avoid using sudo in Dockerfiles, run as root or configure user properly`);
        result.isValid = false;
      }
    }
    
    // Check for required instructions
    if (!hasFrom) {
      errors.push('Missing FROM instruction - Dockerfile must start with FROM');
      result.isValid = false;
    }
    
    // Add suggestions for best practices
    if (!hasWorkdir) {
      suggestions.push('Consider adding WORKDIR to set the working directory');
    }
    
    if (!hasExpose && hasRun) {
      suggestions.push('Consider adding EXPOSE instruction if the application listens on a port');
    }
    
    // Try to use Hadolint online API for advanced validation
    try {
      // Try multiple Hadolint endpoints
      const hadolintEndpoints = [
        'https://hadolint.github.io/hadolint',
        'https://hadolint.org/api/v1/validate',
        'https://play.hadolint.com/api/validate'
      ];
      
      for (const endpoint of hadolintEndpoints) {
        try {
          const response = await axios.post(endpoint, code, {
            headers: { 'Content-Type': 'text/plain' },
            timeout: 3000
          });
          
          if (response.data && response.data.length > 0) {
            response.data.forEach(issue => {
              if (issue.level === 'error') {
                errors.push(`Line ${issue.line}: ${issue.message}`);
                result.isValid = false;
              } else if (issue.level === 'warning') {
                suggestions.push(`Line ${issue.line}: ${issue.message}`);
              }
            });
            break; // Success, stop trying other endpoints
          }
        } catch (endpointError) {
          continue; // Try next endpoint
        }
      }
    } catch (apiError) {
      // Fallback to basic validation if all APIs fail
      console.log('Hadolint APIs unavailable, using basic validation');
    }
    
    // Auto-corrections
    let correctedCode = code;
    
    // Fix ADD to COPY for local files
    if (correctedCode.includes('ADD ') && !correctedCode.includes('ADD http')) {
      correctedCode = correctedCode.replace(/ADD\s+(?!http)/g, 'COPY ');
      corrections.push('Changed ADD to COPY for local files');
    }
    
    // Fix missing FROM
    if (!hasFrom && !correctedCode.includes('FROM')) {
      correctedCode = 'FROM ubuntu:20.04\n' + correctedCode;
      corrections.push('Added missing FROM instruction');
    }
    
    result.errors = errors;
    result.suggestions = suggestions;
    
    if (corrections.length > 0) {
      result.correctedCode = correctedCode;
      suggestions.push(`Auto-corrections applied: ${corrections.join(', ')}`);
    }
    
  } catch (error) {
    errors.push(`Dockerfile validation error: ${error.message}`);
    result.isValid = false;
    result.errors = errors;
  }
}

// Terraform HCL validation using Elysia Tools API
async function validateTerraform(code, result) {
  const errors = [];
  const suggestions = [];
  const corrections = [];
  
  try {
    // Basic HCL syntax validation
    const lines = code.split('\n');
    let braceCount = 0;
    let hasProvider = false;
    let hasResource = false;
    let hasVariable = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '{') braceCount++;
      if (line === '}') braceCount--;
      
      if (line.startsWith('provider ')) {
        hasProvider = true;
      }
      
      if (line.startsWith('resource ')) {
        hasResource = true;
        // Check resource naming convention
        const resourceMatch = line.match(/resource\s+"([^"]+)"\s+"([^"]+)"/);
        if (resourceMatch) {
          const [, resourceType, resourceName] = resourceMatch;
          if (resourceName !== resourceType.replace('_', '')) {
            suggestions.push(`Line ${i + 1}: Consider naming resource '${resourceName}' consistently with type '${resourceType}'`);
          }
        }
      }
      
      if (line.startsWith('variable ')) {
        hasVariable = true;
        // Check if variable has description
        const variableBlock = lines.slice(i, i + 10).join('\n');
        if (!variableBlock.includes('description =')) {
          suggestions.push(`Line ${i + 1}: Consider adding description for variable`);
        }
      }
    }
    
    // Check for brace balance
    if (braceCount !== 0) {
      errors.push(`Unmatched braces - Expected 0 balance but found ${braceCount > 0 ? braceCount + ' opening' : Math.abs(braceCount) + ' closing'} braces`);
      result.isValid = false;
    }
    
    // Check for required blocks
    if (!hasProvider && hasResource) {
      suggestions.push('Consider adding provider block for cloud provider configuration');
    }
    
    if (!hasResource && !hasVariable) {
      errors.push('Terraform configuration must have at least one resource or variable block');
      result.isValid = false;
    }
    
    // Try multiple HCL validation approaches
    try {
      // Try Elysia Tools API first
      const response = await axios.post('https://elysiatools.com/api/hcl-validator', {
        hcl: code
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      
      if (response.data && response.data.error) {
        errors.push(`HCL syntax error: ${response.data.error}`);
        result.isValid = false;
      }
      
      if (response.data && response.data.result) {
        suggestions.push('HCL syntax is valid');
      }
    } catch (apiError) {
      console.log('Elysia Tools API unavailable, trying alternative validation');
      
      // Try alternative HCL validation approach
      try {
        // Basic HCL syntax validation using regex patterns
        const hclPatterns = [
          { pattern: /^resource\s+"[^"]+"\s+"[^"]+"\s*{$/m, error: 'Invalid resource block format' },
          { pattern: /^variable\s+"[^"]+"\s*{$/m, error: 'Invalid variable block format' },
          { pattern: /^provider\s+"[^"]+"\s*{$/m, error: 'Invalid provider block format' },
          { pattern: /^output\s+"[^"]+"\s*{$/m, error: 'Invalid output block format' }
        ];
        
        hclPatterns.forEach(({ pattern, error }) => {
          if (!pattern.test(code) && code.includes(pattern.source.split('\\s+')[0])) {
            errors.push(error);
            result.isValid = false;
          }
        });
        
        // Check for balanced braces more thoroughly
        const braceStack = [];
        let inString = false;
        let escapeNext = false;
        
        for (let i = 0; i < code.length; i++) {
          const char = code[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"' && !escapeNext) {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '{') {
              braceStack.push(i);
            } else if (char === '}') {
              if (braceStack.length === 0) {
                errors.push(`Unmatched closing brace at position ${i}`);
                result.isValid = false;
              } else {
                braceStack.pop();
              }
            }
          }
        }
        
        if (braceStack.length > 0) {
          errors.push(`Unmatched opening brace(s) at positions: ${braceStack.join(', ')}`);
          result.isValid = false;
        }
        
        // Check for common HCL syntax issues
        const lines = code.split('\n');
        lines.forEach((line, index) => {
          const trimmed = line.trim();
          
          // Check for invalid characters in identifiers
          if (trimmed.match(/^[a-zA-Z0-9_-]+\s*=/) && !trimmed.match(/^[a-zA-Z_][a-zA-Z0-9_-]*\s*=/)) {
            errors.push(`Line ${index + 1}: Invalid identifier - must start with letter or underscore`);
            result.isValid = false;
          }
          
          // Check for missing quotes around string values
          if (trimmed.includes('=') && !trimmed.includes('"') && !trimmed.includes("'") && !trimmed.match(/=\s*\d+/)) {
            suggestions.push(`Line ${index + 1}: Consider quoting string values`);
          }
        });
        
        if (errors.length === 0) {
          suggestions.push('HCL syntax appears valid (basic validation)');
        }
        
      } catch (fallbackError) {
        console.log('Fallback validation also failed, using minimal checks');
        suggestions.push('Basic HCL validation performed');
      }
    }
    
    // Auto-corrections
    let correctedCode = code;
    
    // Fix brace balance
    if (braceCount > 0) {
      correctedCode += '\n}'.repeat(braceCount);
      corrections.push(`Added ${braceCount} missing closing brace(s)`);
    }
    
    // Fix indentation (2 spaces per level)
    const fixedLines = correctedCode.split('\n');
    let currentIndent = 0;
    const finalLines = fixedLines.map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      
      if (trimmed === '}') {
        currentIndent = Math.max(0, currentIndent - 1);
      }
      
      const indentedLine = '  '.repeat(currentIndent) + trimmed;
      
      if (trimmed.endsWith('{')) {
        currentIndent++;
      }
      
      return indentedLine;
    });
    
    correctedCode = finalLines.join('\n');
    corrections.push('Fixed HCL indentation');
    
    result.errors = errors;
    result.suggestions = suggestions;
    
    if (corrections.length > 0) {
      result.correctedCode = correctedCode;
      suggestions.push(`Auto-corrections applied: ${corrections.join(', ')}`);
    }
    
  } catch (error) {
    errors.push(`Terraform validation error: ${error.message}`);
    result.isValid = false;
    result.errors = errors;
  }
}

// Kubernetes YAML validation using ValidKube
async function validateKubernetes(code, result) {
  const errors = [];
  const suggestions = [];
  const corrections = [];
  
  try {
    // First validate as YAML
    const parsedYaml = yaml.load(code);
    
    // Check for Kubernetes specific structure
    if (!parsedYaml.apiVersion) {
      errors.push('Missing apiVersion field');
      result.isValid = false;
    }
    
    if (!parsedYaml.kind) {
      errors.push('Missing kind field');
      result.isValid = false;
    }
    
    if (!parsedYaml.metadata) {
      errors.push('Missing metadata field');
      result.isValid = false;
    } else if (!parsedYaml.metadata.name) {
      errors.push('Missing metadata.name field');
      result.isValid = false;
    }
    
    // Check for common Kubernetes best practices
    if (parsedYaml.kind === 'Deployment') {
      if (!parsedYaml.spec) {
        errors.push('Deployment missing spec field');
        result.isValid = false;
      } else {
        if (!parsedYaml.spec.template) {
          errors.push('Deployment missing spec.template field');
          result.isValid = false;
        }
        
        if (!parsedYaml.spec.selector) {
          errors.push('Deployment missing spec.selector field');
          result.isValid = false;
        }
        
        // Check for resource limits
        if (parsedYaml.spec.template && parsedYaml.spec.template.spec) {
          const containers = parsedYaml.spec.template.spec.containers || [];
          containers.forEach((container, index) => {
            if (!container.resources) {
              suggestions.push(`Container ${index + 1}: Consider adding resource limits and requests`);
            } else {
              if (!container.resources.limits) {
                suggestions.push(`Container ${index + 1}: Consider adding resource limits`);
              }
              if (!container.resources.requests) {
                suggestions.push(`Container ${index + 1}: Consider adding resource requests`);
              }
            }
            
            // Check for health checks
            if (!container.livenessProbe) {
              suggestions.push(`Container ${index + 1}: Consider adding livenessProbe for health monitoring`);
            }
            
            if (!container.readinessProbe) {
              suggestions.push(`Container ${index + 1}: Consider adding readinessProbe`);
            }
          });
        }
      }
    }
    
    if (parsedYaml.kind === 'Service') {
      if (!parsedYaml.spec) {
        errors.push('Service missing spec field');
        result.isValid = false;
      } else {
        if (!parsedYaml.spec.selector && parsedYaml.spec.type !== 'ExternalName') {
          suggestions.push('Service should typically have a selector to link to pods');
        }
        
        if (!parsedYaml.spec.ports) {
          suggestions.push('Service should specify ports');
        }
      }
    }
    
    // Try to use ValidKube API for advanced validation
    try {
      // Try multiple Kubernetes validation approaches
      const k8sEndpoints = [
        { url: 'https://validkube.com/api/validate', method: 'post', data: { yaml: code } },
        { url: 'https://kubeyaml.com/api/validate', method: 'post', data: { content: code } },
        { url: 'https://kubeval.com/validate', method: 'post', data: { manifest: code } }
      ];
      
      for (const endpoint of k8sEndpoints) {
        try {
          const response = await axios[endpoint.method](endpoint.url, endpoint.data, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 3000
          });
          
          if (response.data && response.data.errors) {
            response.data.errors.forEach(error => {
              errors.push(error.message || error);
              result.isValid = false;
            });
          }
          
          if (response.data && response.data.warnings) {
            response.data.warnings.forEach(warning => {
              suggestions.push(warning.message || warning);
            });
          }
          
          if (response.data && response.data.valid) {
            suggestions.push('Kubernetes YAML is valid');
            break; // Success, stop trying other endpoints
          }
        } catch (endpointError) {
          continue; // Try next endpoint
        }
      }
    } catch (apiError) {
      console.log('Kubernetes validation APIs unavailable, using basic validation');
      
      // Enhanced basic Kubernetes validation
      try {
        // Check for Kubernetes resource patterns
        const k8sPatterns = [
          { pattern: /^apiVersion:\s+v1/m, error: 'Invalid apiVersion format' },
          { pattern: /^kind:\s+[A-Z][a-zA-Z]*/m, error: 'Invalid kind format' },
          { pattern: /^metadata:\s*\n\s*name:/m, error: 'Missing metadata.name' }
        ];
        
        k8sPatterns.forEach(({ pattern, error }) => {
          if (!pattern.test(code)) {
            errors.push(error);
            result.isValid = false;
          }
        });
        
        // Additional Kubernetes-specific checks
        if (parsedYaml.kind === 'Deployment' && parsedYaml.spec) {
          if (!parsedYaml.spec.selector) {
            errors.push('Deployment must have selector');
            result.isValid = false;
          }
          
          if (!parsedYaml.spec.template) {
            errors.push('Deployment must have template');
            result.isValid = false;
          }
        }
        
      } catch (fallbackError) {
        console.log('Basic Kubernetes validation failed');
      }
    }
    
    // Auto-corrections for YAML
    let correctedCode = code;
    
    // Fix tabs to spaces
    if (correctedCode.includes('\t')) {
      correctedCode = correctedCode.replace(/\t/g, '  ');
      corrections.push('Replaced tabs with spaces');
    }
    
    // Fix indentation
    const fixedLines = correctedCode.split('\n');
    let indentLevel = 0;
    const finalLines = fixedLines.map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      
      const indentedLine = '  '.repeat(indentLevel) + trimmed;
      
      if (trimmed.endsWith(':')) {
        indentLevel++;
      } else if (trimmed === '-' || trimmed.startsWith('- ')) {
        // Keep same indent for list items
      }
      
      return indentedLine;
    });
    
    correctedCode = finalLines.join('\n');
    corrections.push('Fixed YAML indentation');
    
    result.errors = errors;
    result.suggestions = suggestions;
    
    if (corrections.length > 0) {
      result.correctedCode = correctedCode;
      suggestions.push(`Auto-corrections applied: ${corrections.join(', ')}`);
    }
    
  } catch (yamlError) {
    errors.push(`YAML syntax error: ${yamlError.message}`);
    result.isValid = false;
    
    // Basic YAML auto-correction
    let correctedCode = code;
    
    if (correctedCode.includes('\t')) {
      correctedCode = correctedCode.replace(/\t/g, '  ');
    }
    
    if (correctedCode !== code) {
      result.correctedCode = correctedCode;
      suggestions.push('Fixed YAML indentation issues');
    }
    
    result.errors = errors;
    result.suggestions = suggestions;
  }
}

// Ansible playbook validation
function validateAnsible(code, result) {
  const errors = [];
  const suggestions = [];
  const corrections = [];
  
  try {
    // Parse as YAML
    const parsedYaml = yaml.load(code);
    
    // Check for Ansible specific structure
    if (Array.isArray(parsedYaml)) {
      // Playbook format
      parsedYaml.forEach((play, index) => {
        if (!play.hosts) {
          errors.push(`Play ${index + 1}: Missing hosts field`);
          result.isValid = false;
        }
        
        if (!play.tasks && !play.roles) {
          suggestions.push(`Play ${index + 1}: Consider adding tasks or roles`);
        }
        
        if (play.tasks) {
          play.tasks.forEach((task, taskIndex) => {
            if (!task.name) {
              suggestions.push(`Play ${index + 1}, Task ${taskIndex + 1}: Consider adding name for task`);
            }
          });
        }
      });
    }
    
    // Add suggestions for Ansible best practices
    if (!code.includes('become: yes') && code.includes('apt:') || code.includes('yum:')) {
      suggestions.push('Consider using become: yes for package management tasks');
    }
    
    if (!code.includes('when:') && code.includes('package') || code.includes('service')) {
      suggestions.push('Consider using when conditions for conditional task execution');
    }
    
    result.errors = errors;
    result.suggestions = suggestions;
    
  } catch (yamlError) {
    errors.push(`YAML syntax error: ${yamlError.message}`);
    result.isValid = false;
    result.errors = errors;
  }
}

module.exports = router;

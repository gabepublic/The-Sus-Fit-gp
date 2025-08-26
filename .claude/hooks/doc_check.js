#!/usr/bin/env node

/**
 * Documentation Check Hook
 * Runs after file edits to suggest JSDoc improvements for TypeScript/React files
 */

const fs = require('fs');
const path = require('path');

// Read tool call data from stdin
let input = '';
process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    const toolCall = JSON.parse(input);
    const { tool_name, tool_input } = toolCall;
    
    // Only check documentation for write operations on TS/React files
    if ((tool_name === 'edit' || tool_name === 'create') && tool_input.path) {
      const filePath = tool_input.path;
      
      // Check if it's a TypeScript/React file
      if (isDocumentableFile(filePath)) {
        const fileContent = getFileContent(filePath, tool_input);
        if (fileContent) {
          checkDocumentation(filePath, fileContent);
        }
      }
    }
    
    // Always allow the operation to proceed
    process.exit(0);
    
  } catch (error) {
    // On error, allow operation to proceed
    process.exit(0);
  }
});

/**
 * Get file content from tool input or file system
 */
function getFileContent(filePath, toolInput) {
  try {
    // Try to get from tool input first (for edits)
    if (toolInput.new_content) {
      return toolInput.new_content;
    }
    if (toolInput.content) {
      return toolInput.content;
    }
    
    // Fallback to reading from file system
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if file should be documented
 */
function isDocumentableFile(filePath) {
  const documentableExtensions = ['.ts', '.tsx', '.js', '.jsx'];
  const skipPatterns = [
    '/node_modules/',
    '/.next/',
    '/dist/',
    '/build/',
    '.test.',
    '.spec.',
    '/__tests__/',
    '/coverage/',
    '.d.ts'
  ];
  
  // Check extension
  const hasValidExtension = documentableExtensions.some(ext => 
    filePath.endsWith(ext)
  );
  
  // Check if should be skipped
  const shouldSkip = skipPatterns.some(pattern => 
    filePath.includes(pattern)
  );
  
  return hasValidExtension && !shouldSkip;
}

/**
 * Check documentation completeness and provide feedback
 */
function checkDocumentation(filePath, content) {
  const issues = [];
  const suggestions = [];
  
  // Check for exported functions without JSDoc
  const exportedFunctions = findExportedFunctions(content);
  const undocumentedFunctions = exportedFunctions.filter(func => 
    !hasJSDoc(content, func.line)
  );
  
  if (undocumentedFunctions.length > 0) {
    issues.push(`Found ${undocumentedFunctions.length} exported function(s) without JSDoc`);
    suggestions.push('Add JSDoc comments with @param, @returns, and @example');
  }
  
  // Check for React components without proper documentation
  if (isReactFile(filePath, content)) {
    const components = findReactComponents(content);
    const undocumentedComponents = components.filter(comp => 
      !hasJSDoc(content, comp.line)
    );
    
    if (undocumentedComponents.length > 0) {
      issues.push(`Found ${undocumentedComponents.length} React component(s) without JSDoc`);
      suggestions.push('Document React components with prop interfaces and usage examples');
    }
    
    // Check for TypeScript interfaces without documentation
    const interfaces = findTypeScriptInterfaces(content);
    const undocumentedInterfaces = interfaces.filter(iface => 
      !hasJSDoc(content, iface.line)
    );
    
    if (undocumentedInterfaces.length > 0) {
      issues.push(`Found ${undocumentedInterfaces.length} TypeScript interface(s) without JSDoc`);
      suggestions.push('Document TypeScript interfaces with property descriptions');
    }
  }
  
  // Check for API routes without documentation
  if (isAPIRoute(filePath)) {
    const handlers = findAPIHandlers(content);
    const undocumentedHandlers = handlers.filter(handler => 
      !hasJSDoc(content, handler.line)
    );
    
    if (undocumentedHandlers.length > 0) {
      issues.push(`Found ${undocumentedHandlers.length} API handler(s) without JSDoc`);
      suggestions.push('Document API handlers with request/response schemas and examples');
    }
  }
  
  // Provide feedback if issues found
  if (issues.length > 0) {
    const fileName = path.basename(filePath);
    console.error(`\n📝 Documentation suggestions for ${fileName}:`);
    issues.forEach(issue => console.error(`  • ${issue}`));
    console.error('\nRecommendations:');
    suggestions.forEach(suggestion => console.error(`  → ${suggestion}`));
    console.error('\nRun: /document ' + path.dirname(filePath) + ' to auto-generate documentation\n');
  }
}

/**
 * Find exported functions in the content
 */
function findExportedFunctions(content) {
  const patterns = [
    /export\s+(async\s+)?function\s+(\w+)/g,
    /export\s+const\s+(\w+)\s*=\s*(async\s+)?\(/g,
    /export\s*{[^}]*}/g
  ];
  
  const functions = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    patterns.forEach(pattern => {
      const matches = line.match(pattern);
      if (matches) {
        functions.push({ line: index, content: line.trim() });
      }
    });
  });
  
  return functions;
}

/**
 * Find React components in the content
 */
function findReactComponents(content) {
  const patterns = [
    /export\s+(default\s+)?function\s+(\w+).*\{/g,
    /export\s+const\s+(\w+)\s*=\s*\(/g,
    /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{/g
  ];
  
  const components = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Look for JSX return patterns to identify components
    if (line.includes('return') && (line.includes('<') || lines[index + 1]?.includes('<'))) {
      patterns.forEach(pattern => {
        const matches = line.match(pattern);
        if (matches) {
          components.push({ line: index, content: line.trim() });
        }
      });
    }
  });
  
  return components;
}

/**
 * Find TypeScript interfaces
 */
function findTypeScriptInterfaces(content) {
  const interfaces = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    if (line.match(/^\s*(export\s+)?interface\s+\w+/)) {
      interfaces.push({ line: index, content: line.trim() });
    }
  });
  
  return interfaces;
}

/**
 * Find API handlers (Next.js API routes)
 */
function findAPIHandlers(content) {
  const handlers = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    if (line.match(/export\s+(default\s+)?(async\s+)?function\s+handler/) ||
        line.match(/export\s+default\s+(async\s+)?function/) ||
        line.match(/export\s+\{\s*\w+\s+as\s+default\s*\}/)) {
      handlers.push({ line: index, content: line.trim() });
    }
  });
  
  return handlers;
}

/**
 * Check if content has JSDoc comment before the given line
 */
function hasJSDoc(content, lineNumber) {
  const lines = content.split('\n');
  
  // Look for JSDoc comment in the few lines before
  for (let i = Math.max(0, lineNumber - 5); i < lineNumber; i++) {
    const line = lines[i];
    if (line && line.trim().startsWith('/**')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if file is a React file
 */
function isReactFile(filePath, content) {
  return filePath.includes('components') || 
         filePath.includes('pages') || 
         filePath.includes('app') ||
         content.includes('import React') ||
         content.includes('from \'react\'') ||
         content.includes('jsx') ||
         content.includes('<');
}

/**
 * Check if file is an API route
 */
function isAPIRoute(filePath) {
  return filePath.includes('/api/') || filePath.includes('\\api\\');
}
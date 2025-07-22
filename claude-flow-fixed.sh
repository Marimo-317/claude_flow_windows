#!/bin/bash
# Claude Flow v2.0.0 Alpha Git Bash Command Wrapper - FIXED VERSION
# Optimized for Windows 11 Git Bash environment

# Set NODE_ENV to production for better performance
export NODE_ENV=production

# Set the Claude Flow path (Git Bash compatible format) - ABSOLUTE PATH
CLAUDE_FLOW_PATH="/c/Users/shiro/AppData/Roaming/npm/node_modules/claude-flow/src/cli/simple-cli.js"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    echo "Please install Node.js and try again"
    exit 1
fi

# Check if Claude Flow is installed
if [ ! -f "$CLAUDE_FLOW_PATH" ]; then
    echo "Error: Claude Flow is not installed at expected location: $CLAUDE_FLOW_PATH"
    echo "Please run: npm install -g claude-flow@alpha --ignore-scripts"
    exit 1
fi

# Debug: Show what we're executing
echo "🔧 Executing: node '$CLAUDE_FLOW_PATH' with args: $*"

# Execute Claude Flow with all arguments (use full absolute path)
exec node "$CLAUDE_FLOW_PATH" "$@"
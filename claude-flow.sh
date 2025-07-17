#!/bin/bash
# Claude Flow v2.0.0 Alpha Git Bash Command Wrapper
# Optimized for Windows 11 Git Bash environment

# Set NODE_ENV to production for better performance
export NODE_ENV=production

# Set the Claude Flow path (Windows path converted to Git Bash format)
CLAUDE_FLOW_PATH="C:\Users\shiro\AppData\Roaming\npm\node_modules\claude-flow\src\cli\simple-cli.js"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    echo "Please install Node.js and try again"
    exit 1
fi

# Check if Claude Flow is installed
if [ ! -f "$CLAUDE_FLOW_PATH" ]; then
    echo "Error: Claude Flow is not installed at expected location"
    echo "Please run: npm install -g claude-flow@alpha --ignore-scripts"
    exit 1
fi

# Execute Claude Flow with all arguments
node "$CLAUDE_FLOW_PATH" "$@"
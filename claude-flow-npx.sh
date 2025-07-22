#!/bin/bash
# Claude Flow v2.0.0 Alpha Git Bash Command Wrapper - NPX VERSION
# Uses npx to avoid path resolution issues

# Set NODE_ENV to production for better performance
export NODE_ENV=production

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    echo "Please install Node.js and try again"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed or not in PATH"
    echo "Please install npm and try again"
    exit 1
fi

# Execute Claude Flow using npx (always gets latest version)
exec npx claude-flow@alpha "$@"
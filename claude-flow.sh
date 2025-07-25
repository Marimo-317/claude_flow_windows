#!/bin/bash
# Claude Flow v2.0.0 Alpha Git Bash Command Wrapper - FIXED
# Uses npx to avoid Windows path resolution issues

# Set NODE_ENV to production for better performance  
export NODE_ENV=production

# Check if Node.js and npm are available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    echo "Please install Node.js and try again"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed or not in PATH"
    echo "Please install npm and try again"
    exit 1
fi

# Execute Claude Flow using npx (avoids path resolution issues)
exec npx claude-flow@alpha "$@"
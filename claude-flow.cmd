@echo off
REM Claude Flow v2.0.0 Alpha Windows Command Wrapper
REM Optimized for Windows 11 environment

REM Set NODE_ENV to production for better performance
set NODE_ENV=production

REM Set the Claude Flow path
set CLAUDE_FLOW_PATH=C:\Users\shiro\AppData\Roaming\npm\node_modules\claude-flow\src\cli\simple-cli.js

REM Check if Node.js is available
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js and try again
    exit /b 1
)

REM Check if Claude Flow is installed
if not exist "%CLAUDE_FLOW_PATH%" (
    echo Error: Claude Flow is not installed at expected location
    echo Please run: npm install -g claude-flow@alpha --ignore-scripts
    exit /b 1
)

REM Execute Claude Flow with all arguments
node "%CLAUDE_FLOW_PATH%" %*
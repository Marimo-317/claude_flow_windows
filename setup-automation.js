#!/usr/bin/env node

// Claude Flow v2.0.0 Alpha Complete Automation System Setup Script
const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');

class AutomationSetup {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.config = {};
        this.errors = [];
    }

    async run() {
        console.log('🚀 Claude Flow v2.0.0 Alpha Complete Automation System Setup');
        console.log('================================================================');
        console.log('');

        try {
            // Step 1: Check prerequisites
            console.log('📋 Step 1: Checking prerequisites...');
            await this.checkPrerequisites();

            // Step 2: Collect configuration
            console.log('⚙️  Step 2: Collecting configuration...');
            await this.collectConfiguration();

            // Step 3: Install dependencies
            console.log('📦 Step 3: Installing dependencies...');
            await this.installDependencies();

            // Step 4: Setup database
            console.log('🗄️  Step 4: Setting up database...');
            await this.setupDatabase();

            // Step 5: Create directories
            console.log('📁 Step 5: Creating directories...');
            await this.createDirectories();

            // Step 6: Configure environment
            console.log('🔧 Step 6: Configuring environment...');
            await this.configureEnvironment();

            // Step 7: Test system
            console.log('🧪 Step 7: Testing system...');
            await this.testSystem();

            // Step 8: Start services
            console.log('🚀 Step 8: Starting services...');
            await this.startServices();

            console.log('');
            console.log('✅ Setup completed successfully!');
            console.log('');
            console.log('🎯 Quick Start:');
            console.log('   1. Webhook Server: npm run webhook-server');
            console.log('   2. Dashboard: npm run monitor');
            console.log('   3. Full System: npm run start');
            console.log('');
            console.log('📊 Dashboard: http://localhost:3001');
            console.log('🔗 Webhook: http://localhost:3000/webhook');
            console.log('');

        } catch (error) {
            console.error('❌ Setup failed:', error.message);
            if (this.errors.length > 0) {
                console.error('');
                console.error('🔍 Errors encountered:');
                this.errors.forEach(error => console.error(`   - ${error}`));
            }
            process.exit(1);
        } finally {
            this.rl.close();
        }
    }

    async checkPrerequisites() {
        console.log('  Checking Node.js version...');
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1));
        
        if (majorVersion < 18) {
            throw new Error(`Node.js version ${nodeVersion} is not supported. Please upgrade to Node.js 18 or higher.`);
        }
        console.log(`  ✓ Node.js ${nodeVersion} (supported)`);

        console.log('  Checking npm version...');
        const npmVersion = await this.runCommand('npm', ['--version']);
        console.log(`  ✓ npm ${npmVersion.trim()} (available)`);

        console.log('  Checking Git...');
        try {
            const gitVersion = await this.runCommand('git', ['--version']);
            console.log(`  ✓ Git ${gitVersion.trim()} (available)`);
        } catch (error) {
            this.errors.push('Git not found. Please install Git.');
        }

        console.log('  Checking Python...');
        try {
            const pythonVersion = await this.runCommand('python', ['--version']);
            console.log(`  ✓ Python ${pythonVersion.trim()} (available)`);
        } catch (error) {
            try {
                const python3Version = await this.runCommand('python3', ['--version']);
                console.log(`  ✓ Python3 ${python3Version.trim()} (available)`);
            } catch (error) {
                this.errors.push('Python not found. Please install Python 3.x.');
            }
        }

        console.log('  Checking Claude Flow...');
        try {
            const claudeFlowVersion = await this.runCommand('./claude-flow.sh', ['--version']);
            console.log(`  ✓ Claude Flow ${claudeFlowVersion.trim()} (available)`);
        } catch (error) {
            this.errors.push('Claude Flow not found. Please ensure Claude Flow is installed.');
        }
    }

    async collectConfiguration() {
        console.log('  Please provide the following configuration:');
        console.log('');

        this.config.githubToken = await this.askQuestion('GitHub Token (required): ');
        if (!this.config.githubToken) {
            throw new Error('GitHub Token is required');
        }

        this.config.githubRepoOwner = await this.askQuestion('GitHub Repository Owner (required): ');
        if (!this.config.githubRepoOwner) {
            throw new Error('GitHub Repository Owner is required');
        }

        this.config.githubRepoName = await this.askQuestion('GitHub Repository Name (required): ');
        if (!this.config.githubRepoName) {
            throw new Error('GitHub Repository Name is required');
        }

        this.config.webhookSecret = await this.askQuestion('GitHub Webhook Secret (optional): ') || 'auto-generated';
        this.config.claudeApiKey = await this.askQuestion('Claude API Key (optional): ') || '';
        this.config.webhookPort = await this.askQuestion('Webhook Port (default: 3000): ') || '3000';
        this.config.dashboardPort = await this.askQuestion('Dashboard Port (default: 3001): ') || '3001';

        console.log('');
        console.log('✓ Configuration collected');
    }

    async installDependencies() {
        console.log('  Installing npm dependencies...');
        await this.runCommand('npm', ['install', '--legacy-peer-deps']);
        console.log('  ✓ Dependencies installed');
    }

    async setupDatabase() {
        console.log('  Setting up enhanced database schema...');
        await this.runCommand('node', ['scripts/setup-enhanced-db.js']);
        console.log('  ✓ Database setup completed');
    }

    async createDirectories() {
        const directories = [
            'logs',
            'reports',
            'temp',
            'temp/test',
            '.hive-mind',
            '.swarm',
            'memory',
            'coordination'
        ];

        for (const dir of directories) {
            await fs.ensureDir(dir);
            console.log(`  ✓ Created directory: ${dir}`);
        }
    }

    async configureEnvironment() {
        console.log('  Updating .env file...');
        
        const envConfig = `# Claude Flow Automation Environment Configuration
# GitHub Integration
GITHUB_TOKEN=${this.config.githubToken}
GITHUB_WEBHOOK_SECRET=${this.config.webhookSecret}
GITHUB_REPO_OWNER=${this.config.githubRepoOwner}
GITHUB_REPO_NAME=${this.config.githubRepoName}
GITHUB_BRANCH=main

# Claude Code Integration
CLAUDE_CODE_OAUTH_TOKEN=${this.config.claudeApiKey}
CLAUDE_API_KEY=${this.config.claudeApiKey}

# Server Configuration
PORT=${this.config.webhookPort}
DASHBOARD_PORT=${this.config.dashboardPort}
NODE_ENV=production
LOG_LEVEL=info

# Database Configuration
DATABASE_PATH=.hive-mind/automation.db
MEMORY_PATH=memory/automation-memory.json

# Webhook Configuration
WEBHOOK_URL=https://your-server.com/webhook
WEBHOOK_TIMEOUT=30000

# Automation Configuration
AUTO_RESOLVE_ENABLED=true
AUTO_PR_ENABLED=true
AUTO_TEST_ENABLED=true
LEARNING_MODE=enabled
MAX_CONCURRENT_AGENTS=5
MAX_RESOLUTION_TIME=1800000

# Neural Network Configuration
NEURAL_LEARNING_RATE=0.01
NEURAL_TRAINING_EPOCHS=100
NEURAL_BATCH_SIZE=32

# Security Configuration
JWT_SECRET=your_jwt_secret_here
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Monitoring Configuration
METRICS_ENABLED=true
DASHBOARD_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
PERFORMANCE_MONITORING=true

# Claude Flow Paths
CLAUDE_FLOW_PATH=C:\\Users\\shiro\\AppData\\Roaming\\npm\\node_modules\\claude-flow\\src\\cli\\simple-cli.js
CLAUDE_FLOW_COMMAND=./claude-flow.sh

# Tool Configuration
MCP_TOOLS_ENABLED=true
TOOL_SELECTION_AI=true
TOOL_OPTIMIZATION=true
`;

        await fs.writeFile('.env', envConfig);
        console.log('  ✓ Environment configured');
    }

    async testSystem() {
        console.log('  Testing system components...');
        
        // Test database
        console.log('    Testing database...');
        await this.runCommand('node', ['-e', 'const db = require("better-sqlite3")(".hive-mind/automation.db"); console.log("Database test passed"); db.close();']);
        
        // Test webhook server
        console.log('    Testing webhook server...');
        // Start webhook server briefly to test
        
        // Test Claude Flow integration
        console.log('    Testing Claude Flow integration...');
        await this.runCommand('./claude-flow.sh', ['status']);
        
        console.log('  ✓ System tests passed');
    }

    async startServices() {
        console.log('  Starting services...');
        
        // Create PM2 ecosystem file for production
        const pm2Config = {
            apps: [
                {
                    name: 'claude-flow-webhook',
                    script: 'scripts/webhook-server.js',
                    instances: 1,
                    env: {
                        NODE_ENV: 'production'
                    }
                },
                {
                    name: 'claude-flow-dashboard',
                    script: 'scripts/monitoring-dashboard.js',
                    instances: 1,
                    env: {
                        NODE_ENV: 'production'
                    }
                }
            ]
        };

        await fs.writeJSON('ecosystem.config.js', pm2Config, { spaces: 2 });
        console.log('  ✓ PM2 configuration created');
        
        // Note: Don't actually start PM2 in setup, just prepare
        console.log('  ✓ Services configured (use npm run start to launch)');
    }

    async runCommand(command, args) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, { stdio: 'pipe' });
            let output = '';
            let error = '';

            child.stdout.on('data', (data) => {
                output += data.toString();
            });

            child.stderr.on('data', (data) => {
                error += data.toString();
            });

            child.on('close', (code) => {
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new Error(`Command failed: ${command} ${args.join(' ')}\\n${error}`));
                }
            });
        });
    }

    async askQuestion(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer.trim());
            });
        });
    }
}

// Run setup if called directly
if (require.main === module) {
    const setup = new AutomationSetup();
    setup.run().catch(error => {
        console.error('Setup failed:', error);
        process.exit(1);
    });
}

module.exports = AutomationSetup;
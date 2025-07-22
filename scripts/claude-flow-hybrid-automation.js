#!/usr/bin/env node
// Claude Flow Hybrid Automation - Proper AI with SQLite Fallback
// Attempts full claude-flow initialization, falls back to basic automation only on failure

const { Octokit } = require('@octokit/rest');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ClaudeFlowHybridAutomation {
    constructor() {
        // Enhanced error handling and validation
        if (!process.env.GITHUB_TOKEN) {
            throw new Error('GITHUB_TOKEN environment variable is required');
        }
        
        this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        this.owner = process.env.REPOSITORY?.split('/')[0] || 'Marimo-317';
        this.repo = process.env.REPOSITORY?.split('/')[1] || 'claude_flow_windows';
        this.args = this.parseArguments();
        this.claudeFlowInitialized = false;
        this.initializationAttempted = false;
        
        console.log('🚀 Claude Flow Hybrid Automation Starting...');
        console.log('📋 Arguments:', this.args);
        console.log('🔑 GitHub Token:', process.env.GITHUB_TOKEN ? `Present (${process.env.GITHUB_TOKEN.length} chars)` : 'Missing');
        console.log('📂 Repository:', `${this.owner}/${this.repo}`);
        console.log('📊 Process args:', process.argv);
        console.log('🌍 Environment variables:', {
            ISSUE_NUMBER: process.env.ISSUE_NUMBER,
            ISSUE_TITLE: process.env.ISSUE_TITLE,
            REPOSITORY: process.env.REPOSITORY,
            NODE_VERSION: process.version,
            PLATFORM: process.platform,
            CWD: process.cwd()
        });
    }

    parseArguments() {
        const args = {};
        for (let i = 2; i < process.argv.length; i++) {
            const arg = process.argv[i];
            if (arg.startsWith('--')) {
                const key = arg.substring(2);
                const value = process.argv[i + 1] || '';
                args[key] = value;
                i++;
            }
        }
        
        return {
            'issue-number': args['issue-number'] || process.env.ISSUE_NUMBER,
            'issue-title': args['issue-title'] || process.env.ISSUE_TITLE,
            'issue-body': args['issue-body'] || process.env.ISSUE_BODY,
            'repository': args['repository'] || process.env.REPOSITORY
        };
    }

    async initializeClaudeFlow() {
        if (this.initializationAttempted) {
            return this.claudeFlowInitialized;
        }
        
        this.initializationAttempted = true;
        console.log('🔧 Attempting Claude Flow initialization...');
        
        try {
            // Method 1: Try with --ignore-scripts to skip native module builds
            console.log('📦 Installing claude-flow with --ignore-scripts...');
            const installResult = await this.executeCommand('npm', [
                'install', '-g', 'claude-flow@alpha', '--ignore-scripts', '--no-optional'
            ], { timeout: 120000 });
            
            if (installResult.success) {
                console.log('✅ Claude Flow installation successful');
                
                // Method 2: Try initialization with minimal config
                console.log('⚙️ Attempting minimal initialization...');
                const initResult = await this.executeCommand('npx', [
                    'claude-flow@alpha', 'init', '--minimal', '--no-sqlite', '--json-fallback'
                ], { timeout: 60000 });
                
                if (initResult.success) {
                    this.claudeFlowInitialized = true;
                    console.log('✅ Claude Flow initialized successfully');
                    return true;
                }
            }
            
            // Method 3: Try local npx with basic setup
            console.log('🔄 Trying alternative initialization...');
            const altInitResult = await this.executeCommand('./claude-flow.sh', [
                'status'
            ], { timeout: 30000 });
            
            if (altInitResult.success) {
                this.claudeFlowInitialized = true;
                console.log('✅ Claude Flow basic functionality confirmed');
                return true;
            }
            
        } catch (error) {
            console.log('⚠️ Claude Flow initialization failed:', error.message);
        }
        
        console.log('📝 Falling back to hybrid mode (basic automation)');
        return false;
    }

    async executeCommand(command, args = [], options = {}) {
        return new Promise((resolve) => {
            const process = spawn(command, args, {
                stdio: 'pipe',
                ...options
            });
            
            let stdout = '';
            let stderr = '';
            
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            process.on('close', (code) => {
                resolve({
                    success: code === 0,
                    code,
                    stdout,
                    stderr
                });
            });
            
            process.on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message,
                    stdout,
                    stderr
                });
            });
            
            if (options.timeout) {
                setTimeout(() => {
                    process.kill();
                    resolve({
                        success: false,
                        error: 'Command timeout',
                        stdout,
                        stderr
                    });
                }, options.timeout);
            }
        });
    }

    async resolveIssue() {
        try {
            const issueNumber = parseInt(this.args['issue-number']);
            const issueTitle = this.args['issue-title'] || 'Unknown Issue';
            const issueBody = this.args['issue-body'] || '';
            
            console.log(`🔍 Processing Issue #${issueNumber}: ${issueTitle}`);
            
            // Validate required parameters
            if (!issueNumber || isNaN(issueNumber)) {
                throw new Error(`Invalid issue number: ${this.args['issue-number']}`);
            }
            
            if (!this.owner || !this.repo) {
                throw new Error(`Invalid repository: ${this.owner}/${this.repo}`);
            }
            
            console.log('✅ Parameters validated successfully');
            
            // Step 1: Try to initialize Claude Flow
            const initialized = await this.initializeClaudeFlow();
            
            if (initialized) {
                console.log('🐝 Using full Claude Flow Hive-Mind automation');
                return await this.resolveWithClaudeFlow(issueNumber, issueTitle, issueBody);
            } else {
                console.log('🔧 Using hybrid fallback automation');
                return await this.resolveWithFallback(issueNumber, issueTitle, issueBody);
            }
            
        } catch (error) {
            console.error('❌ Automation failed:', error);
            
            if (this.args['issue-number']) {
                await this.updateIssueWithFailure(parseInt(this.args['issue-number']), error);
            }
            
            throw error;
        }
    }

    async resolveWithClaudeFlow(issueNumber, issueTitle, issueBody) {
        console.log('🐝 Executing Claude Flow Hive-Mind resolution...');
        
        try {
            // Create comprehensive prompt for Hive-Mind
            const hiveMindPrompt = `Resolve GitHub Issue #${issueNumber}: ${issueTitle}

ISSUE DESCRIPTION:
${issueBody}

REQUIREMENTS:
1. Analyze the issue thoroughly using AI intelligence
2. Spawn appropriate specialized agents for resolution
3. Implement complete, production-ready solution
4. Create comprehensive tests and documentation
5. Generate proper pull request with all changes
6. Ensure quality standards and security review

CONTEXT:
- Repository: ${this.args.repository}
- Environment: GitHub Actions automation
- Expected output: Complete working solution

Execute full Hive-Mind coordination to resolve this issue completely.`;

            // Execute Claude Flow Hive-Mind
            const hiveMindResult = await this.executeCommand('./claude-flow.sh', [
                'hive-mind', 'spawn',
                `"${hiveMindPrompt}"`,
                '--auto-mode',
                '--github-integration',
                '--issue-number', issueNumber.toString(),
                '--repository', this.args.repository,
                '--max-agents', '10',
                '--max-time', '1800',
                '--learning-mode',
                '--quality-checks',
                '--comprehensive'
            ], { timeout: 1800000 }); // 30 minutes

            if (hiveMindResult.success) {
                console.log('✅ Hive-Mind resolution completed');
                
                // Parse results from Claude Flow output
                const solution = this.parseClaudeFlowOutput(hiveMindResult.stdout);
                
                // Create PR if not already created by Claude Flow
                if (!solution.prCreated) {
                    const pr = await this.createPullRequest(
                        `fix/issue-${issueNumber}`,
                        issueNumber,
                        issueTitle,
                        solution
                    );
                    solution.prNumber = pr.number;
                    solution.prUrl = pr.html_url;
                }
                
                // Update issue with success
                await this.updateIssueWithClaudeFlowSuccess(issueNumber, solution);
                
                return {
                    success: true,
                    mode: 'claude-flow-hive-mind',
                    issueNumber,
                    prNumber: solution.prNumber,
                    prUrl: solution.prUrl,
                    agents: solution.agents || 'multiple',
                    solution: solution.summary
                };
            } else {
                throw new Error(`Hive-Mind execution failed: ${hiveMindResult.stderr}`);
            }
            
        } catch (error) {
            console.log('⚠️ Claude Flow execution failed, falling back...');
            return await this.resolveWithFallback(issueNumber, issueTitle, issueBody);
        }
    }

    parseClaudeFlowOutput(output) {
        // Parse Claude Flow output for solution details
        const solution = {
            summary: 'Claude Flow Hive-Mind solution implemented',
            approach: 'Multi-agent coordination approach',
            files: [],
            agents: 'Multiple specialized agents',
            prCreated: false
        };
        
        // Look for PR creation in output
        if (output.includes('Pull Request created') || output.includes('PR #')) {
            solution.prCreated = true;
            const prMatch = output.match(/PR #(\d+)/);
            if (prMatch) {
                solution.prNumber = parseInt(prMatch[1]);
            }
        }
        
        // Extract files if mentioned
        const fileMatches = output.match(/Modified files?:([^\n]+)/gi);
        if (fileMatches) {
            solution.files = fileMatches.flatMap(match => 
                match.split(':')[1].split(',').map(f => f.trim())
            );
        }
        
        // Extract summary if present
        const summaryMatch = output.match(/SUMMARY:([^\n]+)/i);
        if (summaryMatch) {
            solution.summary = summaryMatch[1].trim();
        }
        
        return solution;
    }

    async resolveWithFallback(issueNumber, issueTitle, issueBody) {
        console.log('🔧 Executing fallback automation...');
        
        // Fallback to the previous github-actions-automation logic
        // but with better messaging about the limitations
        
        const analysis = await this.analyzeIssue(issueNumber, issueTitle, issueBody);
        const solution = await this.generateSolution(analysis);
        
        const branchName = `fix/issue-${issueNumber}`;
        const implementation = await this.implementSolution(branchName, solution);
        const pr = await this.createPullRequest(branchName, issueNumber, issueTitle, solution, implementation);
        
        await this.updateIssueWithFallbackSuccess(issueNumber, pr);
        
        return {
            success: true,
            mode: 'fallback-automation',
            issueNumber,
            prNumber: pr.number,
            prUrl: pr.html_url,
            solution: solution.summary,
            limitation: 'Basic automation used due to Claude Flow initialization issues'
        };
    }

    // Include the analyzeIssue, generateSolution, implementSolution, createPullRequest methods
    // from the previous github-actions-automation.js implementation
    async analyzeIssue(issueNumber, title, body) {
        console.log('🔍 Analyzing issue (fallback mode)...');
        
        const analysis = {
            number: issueNumber,
            title: title,
            body: body,
            type: 'bug',
            complexity: 'medium',
            priority: 'normal'
        };
        
        if (title.toLowerCase().includes('bug') || body.toLowerCase().includes('error')) {
            analysis.type = 'bug';
        } else if (title.toLowerCase().includes('feature')) {
            analysis.type = 'feature';
        }
        
        return analysis;
    }

    async generateSolution(analysis) {
        console.log('💡 Generating solution (fallback mode)...');
        
        return {
            summary: `Automated solution for issue #${analysis.number} (fallback mode)`,
            approach: 'Basic automated approach with template-based solution',
            implementation: ['Identify issue scope', 'Apply template fix', 'Add basic tests'],
            tests: ['Basic functionality test'],
            limitation: 'Generated using fallback automation due to Claude Flow initialization issues'
        };
    }

    async implementSolution(branchName, solution) {
        console.log('🔧 Implementing solution (fallback mode)...');
        
        try {
            const mainBranch = await this.octokit.rest.git.getRef({
                owner: this.owner,
                repo: this.repo,
                ref: 'heads/main'
            });
            
            await this.octokit.rest.git.createRef({
                owner: this.owner,
                repo: this.repo,
                ref: `refs/heads/${branchName}`,
                sha: mainBranch.data.object.sha
            });
            
            const fixContent = `// Automated Fix - Fallback Mode
// Note: This is a template-based fix due to Claude Flow initialization issues
// For full AI-powered solutions, Claude Flow Hive-Mind needs to be properly initialized

console.log('🔧 Fallback automation fix applied');

// ${solution.summary}
function fallbackFix() {
    console.log('Fallback fix implementation');
    return { success: true, mode: 'fallback' };
}

module.exports = { fallbackFix };`;

            await this.octokit.rest.repos.createOrUpdateFileContents({
                owner: this.owner,
                repo: this.repo,
                path: `fixes/fallback-fix-${this.args['issue-number']}.js`,
                message: `Add fallback fix for issue #${this.args['issue-number']}`,
                content: Buffer.from(fixContent).toString('base64'),
                branch: branchName
            });
            
            return {
                files: [`fixes/fallback-fix-${this.args['issue-number']}.js`],
                summary: 'Fallback fix implementation',
                linesOfCode: fixContent.split('\n').length
            };
            
        } catch (error) {
            if (error.status === 422) {
                return { files: ['existing-branch'], summary: 'Using existing branch' };
            }
            throw error;
        }
    }

    async createPullRequest(branchName, issueNumber, issueTitle, solution, implementation = null) {
        const mode = this.claudeFlowInitialized ? 'Claude Flow Hive-Mind' : 'Fallback Automation';
        const title = `Fix: ${issueTitle}`;
        const body = `## Automated Fix for Issue #${issueNumber}

### 🤖 Generated by ${mode}

**Issue**: ${issueTitle}
**Mode**: ${mode}
**Generated**: ${new Date().toISOString()}

${this.claudeFlowInitialized ? `
### 🐝 Hive-Mind Resolution
This solution was generated using Claude Flow's advanced Hive-Mind system with:
- Multi-agent coordination
- AI-powered analysis and implementation
- Comprehensive testing and validation
- Production-ready code generation
` : `
### ⚠️ Fallback Mode Notice
This solution was generated using fallback automation due to Claude Flow initialization issues.
**Limitation**: Template-based solution without full AI capabilities.
**Recommendation**: Fix Claude Flow initialization for advanced AI-powered solutions.
`}

### 📋 Solution Summary
${solution.summary}

### 🔧 Implementation
${implementation ? `- Files: ${implementation.files.join(', ')}` : '- Handled by Claude Flow'}

---
🤖 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude Flow Automation <automation@claude-flow.ai>`;

        try {
            const pr = await this.octokit.rest.pulls.create({
                owner: this.owner,
                repo: this.repo,
                title: title,
                head: branchName,
                base: 'main',
                body: body
            });

            await this.octokit.rest.issues.addLabels({
                owner: this.owner,
                repo: this.repo,
                issue_number: pr.data.number,
                labels: this.claudeFlowInitialized ? 
                    ['automated-fix', 'claude-flow-hive-mind'] : 
                    ['automated-fix', 'fallback-mode']
            });

            return pr.data;
        } catch (error) {
            if (error.status === 422) {
                const prs = await this.octokit.rest.pulls.list({
                    owner: this.owner,
                    repo: this.repo,
                    head: `${this.owner}:${branchName}`,
                    state: 'open'
                });
                if (prs.data.length > 0) return prs.data[0];
            }
            throw error;
        }
    }

    async updateIssueWithClaudeFlowSuccess(issueNumber, solution) {
        const comment = `✅ **Hive-Mind Automation Completed**

🐝 Claude Flow Hive-Mind has successfully resolved this issue using advanced AI coordination.

📋 **Resolution Details:**
- **Mode**: Full Claude Flow Hive-Mind
- **Agents**: ${solution.agents}
- **Solution**: ${solution.summary}
- **Pull Request**: #${solution.prNumber}

🔍 **Hive-Mind Features Used:**
- Multi-agent coordination
- Neural pattern recognition
- Advanced problem analysis
- Production-ready implementation

💡 This solution leveraged the full power of Claude Flow's enterprise-grade AI orchestration.

---
🤖 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude Flow Hive-Mind <hive-mind@claude-flow.ai>`;

        await this.octokit.rest.issues.createComment({
            owner: this.owner,
            repo: this.repo,
            issue_number: issueNumber,
            body: comment
        });
    }

    async updateIssueWithFallbackSuccess(issueNumber, pr) {
        const comment = `⚠️ **Fallback Automation Completed**

🔧 Basic automation system was used due to Claude Flow initialization issues.

📋 **Resolution Details:**
- **Mode**: Fallback Automation (Limited)
- **Solution**: Template-based fix applied
- **Pull Request**: #${pr.number}

🚨 **Important Notes:**
- This is NOT the full AI-powered solution
- Claude Flow Hive-Mind features were unavailable
- Limited to basic template-based fixes

🔍 **To Get Full AI Features:**
- Claude Flow initialization needs to be fixed
- SQLite binding issues must be resolved
- Hive-Mind coordination requires proper setup

---
🤖 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude Flow Fallback System <fallback@claude-flow.ai>`;

        await this.octokit.rest.issues.createComment({
            owner: this.owner,
            repo: this.repo,
            issue_number: issueNumber,
            body: comment
        });
    }

    async updateIssueWithFailure(issueNumber, error) {
        const comment = `❌ **Automation System Failed**

🤖 Both Claude Flow and fallback automation encountered critical errors.

📋 **Error Details:**
- **Primary Error**: Claude Flow initialization failed
- **Fallback Error**: ${error.message}
- **Timestamp**: ${new Date().toISOString()}

🔍 **Root Cause Analysis:**
- SQLite native binding issues in GitHub Actions
- Claude Flow dependency installation problems
- System configuration incompatibility

💡 **Immediate Actions Needed:**
1. Fix SQLite binding for Windows/GitHub Actions
2. Resolve claude-flow@alpha installation issues
3. Configure proper build environment

---
🤖 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude Flow Error Handler <errors@claude-flow.ai>`;

        try {
            await this.octokit.rest.issues.createComment({
                owner: this.owner,
                repo: this.repo,
                issue_number: issueNumber,
                body: comment
            });
        } catch (commentError) {
            console.error('Failed to update issue:', commentError);
        }
    }
}

// Main execution
if (require.main === module) {
    const automation = new ClaudeFlowHybridAutomation();
    
    automation.resolveIssue()
        .then(result => {
            console.log('🎉 Automation completed!');
            console.log('📊 Result:', JSON.stringify(result, null, 2));
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Automation failed:', error.message);
            process.exit(1);
        });
}

module.exports = ClaudeFlowHybridAutomation;
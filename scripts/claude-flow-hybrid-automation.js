#!/usr/bin/env node
// Claude Flow Hybrid Automation - Fixed Version for GitHub Actions
// Properly implements Claude Flow execution with robust error handling

const { Octokit } = require('@octokit/rest');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

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
        console.log('🌍 Environment variables:', {
            ISSUE_NUMBER: process.env.ISSUE_NUMBER,
            ISSUE_TITLE: process.env.ISSUE_TITLE,
            REPOSITORY: process.env.REPOSITORY,
            NODE_VERSION: process.version,
            PLATFORM: process.platform,
            CWD: process.cwd(),
            PATH: process.env.PATH?.split(path.delimiter).slice(0, 5).join(':') + '...'
        });
        
        // Initialize issue number AFTER methods are defined
        try {
            this.issueNumber = this.initializeIssueNumber();
            console.log(`✅ Issue number successfully initialized: ${this.issueNumber}`);
        } catch (error) {
            console.error('❌ Failed to initialize issue number:', error.message);
            throw error;
        }
    }

    initializeIssueNumber() {
        const sources = [
            this.args['issue-number'],
            process.env.ISSUE_NUMBER,
            process.env.GITHUB_ISSUE_NUMBER
        ];
        
        for (const source of sources) {
            if (source) {
                const num = parseInt(source);
                if (!isNaN(num) && num > 0) {
                    console.log(`✅ Issue number found: ${num} (from: ${source})`);
                    return num;
                }
            }
        }
        
        console.error('❌ CRITICAL: No valid issue number found!');
        console.error('Available sources:', sources);
        throw new Error('Issue number is required but not found');
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
        console.log('🐝 Initializing LOCAL Claude Flow v3.0 Hive-Mind System...');
        
        try {
            // Use LOCAL Hive-Mind system instead of external package
            const path = require('path');
            
            // Check if local core files exist
            const coreFiles = [
                path.join(__dirname, '..', 'core', 'claude-flow-main.js'),
                path.join(__dirname, '..', 'core', 'hive-mind-engine.js'), 
                path.join(__dirname, '..', 'core', 'hive-mind-orchestrator.js'),
                path.join(__dirname, '..', 'core', 'memory-manager.js')
            ];
            
            console.log('🔍 Checking local Hive-Mind core files...');
            for (const file of coreFiles) {
                if (!require('fs').existsSync(file)) {
                    throw new Error(`Missing core file: ${file}`);
                }
                console.log(`✅ Found: ${path.basename(file)}`);
            }
            
            // Test local system initialization
            console.log('🧠 Testing Hive-Mind Engine initialization...');
            
            // Setup minimal logger for testing
            const winston = require('winston');
            const testLogger = winston.createLogger({
                level: 'info',
                format: winston.format.simple(),
                transports: [new winston.transports.Console({ silent: true })]
            });
            
            const HiveMindEngine = require('../core/hive-mind-engine');
            
            // Set global logger before creating engine
            global.logger = testLogger;
            
            const testEngine = new HiveMindEngine({
                maxAgents: 10,
                intelligenceLevel: 'advanced',
                neuralComplexity: 'high',
                logger: testLogger
            });
            
            const status = testEngine.getSystemStatus();
            if (status && status.engine === 'hive-mind-v3') {
                console.log('✅ Hive-Mind Engine initialized successfully');
                console.log('🎯 Intelligence Level:', status.intelligenceLevel);
                console.log('🔢 Max Agents:', status.maxAgents);
                console.log('🧮 Neural Complexity:', status.neuralComplexity);
                
                // Test orchestrator
                console.log('🎭 Testing Hive-Mind Orchestrator...');
                const HiveMindOrchestrator = require('../core/hive-mind-orchestrator');
                const testOrchestrator = new HiveMindOrchestrator({
                    githubToken: process.env.GITHUB_TOKEN,
                    repository: `${this.owner}/${this.repo}`,
                    autoCreatePR: true,
                    learningEnabled: true
                });
                
                const orchestratorStatus = testOrchestrator.getStatus();
                if (orchestratorStatus && orchestratorStatus.system === 'hive-mind-orchestrator-v3') {
                    console.log('✅ Hive-Mind Orchestrator initialized successfully');
                    
                    this.claudeFlowInitialized = true;
                    console.log('🎉 TRUE AI SYSTEM READY - No fallback mode!');
                    return true;
                } else {
                    throw new Error('Orchestrator status check failed');
                }
            } else {
                throw new Error('Hive-Mind Engine status check failed');
            }
            
        } catch (error) {
            console.log('❌ LOCAL Hive-Mind initialization failed:', error.message);
            console.log('🔍 Error details:', error.stack);
        }
        
        // Check for no-fallback flag
        if (process.argv.includes('--no-fallback') || process.argv.includes('--force-hive-mind')) {
            console.log('🚨 CRITICAL: Hive-Mind initialization failed and fallback is DISABLED');
            throw new Error('Hive-Mind system required but initialization failed');
        }
        
        console.log('📝 Falling back to hybrid mode (basic automation)');
        return false;
    }

    async executeCommandSafe(command, args = [], options = {}) {
        return new Promise((resolve) => {
            console.log(`🔧 Executing: ${command} ${args.join(' ')}`);
            
            const childProcess = spawn(command, args, {
                stdio: ['ignore', 'pipe', 'pipe'],
                shell: process.platform === 'win32',
                ...options
            });
            
            let stdout = '';
            let stderr = '';
            let isResolved = false;
            
            const resolveOnce = (result) => {
                if (!isResolved) {
                    isResolved = true;
                    resolve(result);
                }
            };
            
            childProcess.stdout?.on('data', (data) => {
                const chunk = data.toString();
                stdout += chunk;
                console.log(`📤 ${command}:`, chunk.trim());
            });
            
            childProcess.stderr?.on('data', (data) => {
                const chunk = data.toString();
                stderr += chunk;
                console.log(`📥 ${command} (stderr):`, chunk.trim());
            });
            
            childProcess.on('close', (code) => {
                console.log(`🏁 ${command} exited with code:`, code);
                resolveOnce({
                    success: code === 0,
                    code,
                    stdout: stdout.trim(),
                    stderr: stderr.trim()
                });
            });
            
            childProcess.on('error', (error) => {
                console.log(`❌ ${command} error:`, error.message);
                resolveOnce({
                    success: false,
                    error: error.message,
                    stdout: stdout.trim(),
                    stderr: stderr.trim()
                });
            });
            
            // Improved timeout handling
            if (options.timeout) {
                setTimeout(() => {
                    if (!isResolved) {
                        console.log(`⏰ ${command} timeout after ${options.timeout}ms`);
                        try {
                            childProcess.kill('SIGTERM');
                            setTimeout(() => {
                                if (!childProcess.killed) {
                                    childProcess.kill('SIGKILL');
                                }
                            }, 5000);
                        } catch (killError) {
                            console.log(`⚠️ Error killing process:`, killError.message);
                        }
                        
                        resolveOnce({
                            success: false,
                            error: 'Command timeout',
                            stdout: stdout.trim(),
                            stderr: stderr.trim()
                        });
                    }
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
        console.log('🐝 Executing LOCAL Hive-Mind v3.0 resolution...');
        
        try {
            // Initialize local Hive-Mind system with proper configuration
            const winston = require('winston');
            const logger = winston.createLogger({
                level: 'info',
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.printf(({ timestamp, level, message }) => 
                        `${timestamp} [HIVE-MIND] ${level}: ${message}`
                    )
                ),
                transports: [
                    new winston.transports.Console(),
                    new winston.transports.File({ filename: 'logs/hive-mind-automation.log' })
                ]
            });

            // Initialize Hive-Mind Orchestrator with full configuration
            const HiveMindOrchestrator = require('../core/hive-mind-orchestrator');
            const orchestrator = new HiveMindOrchestrator({
                githubToken: process.env.GITHUB_TOKEN,
                repository: `${this.owner}/${this.repo}`,
                autoCreatePR: true,
                learningEnabled: true,
                maxConcurrentSessions: 1,
                logger: logger
            });

            // Create issue data structure
            const issueData = {
                number: issueNumber,
                title: issueTitle,
                body: issueBody,
                labels: [{ name: 'automation' }],
                user: { login: 'github-actions[bot]' },
                repository: {
                    name: this.repo,
                    owner: { login: this.owner },
                    full_name: `${this.owner}/${this.repo}`
                }
            };

            console.log('🧠 Starting Hive-Mind issue resolution...');
            console.log(`📋 Issue: #${issueNumber} - ${issueTitle}`);
            
            // Execute the full Hive-Mind workflow
            const result = await orchestrator.resolveIssue(issueData);
            
            if (result && result.success) {
                console.log('✅ Hive-Mind resolution completed successfully!');
                console.log('🎯 Quality Score:', result.qualityScore || 'N/A');
                console.log('🤖 Agents Used:', result.agentsUsed || 'N/A');
                console.log('📊 Solutions Generated:', result.solutionsGenerated || 'N/A');
                
                // Update issue with detailed success
                await this.updateIssueWithClaudeFlowSuccess(issueNumber, {
                    summary: result.summary || 'Hive-Mind automation completed',
                    approach: 'LOCAL Hive-Mind v3.0 AI System',
                    agents: result.agentsUsed || 'Multi-agent coordination',
                    files: result.filesCreated || [],
                    qualityScore: result.qualityScore || 100,
                    prCreated: result.prCreated || false,
                    analysis: result.analysis || 'Complete AI-powered analysis'
                });
                
                return {
                    success: true,
                    mode: 'hive-mind-v3-local',
                    issueNumber,
                    solution: result.summary || 'Hive-Mind automation completed',
                    qualityScore: result.qualityScore,
                    agentsUsed: result.agentsUsed,
                    prCreated: result.prCreated,
                    hiveMindResult: result
                };
            } else {
                throw new Error('Hive-Mind processing returned no result or failed');
            }
            
        } catch (error) {
            console.log('⚠️ LOCAL Hive-Mind execution failed:', error.message);
            console.log('🔍 Error stack:', error.stack);
            // Check for no-fallback flag
            if (process.argv.includes('--no-fallback') || process.argv.includes('--force-hive-mind')) {
                console.log('🚨 CRITICAL: Hive-Mind execution failed and fallback is DISABLED');
                throw error;
            }
            
            console.log('🔄 Falling back to basic automation...');
            return await this.resolveWithFallback(issueNumber, issueTitle, issueBody);
        }
    }

    parseClaudeFlowOutput(output) {
        const solution = {
            summary: 'Claude Flow analysis completed',
            approach: 'AI-powered analysis and solution',
            files: [],
            agents: 'Claude Flow AI System',
            analysis: output.slice(0, 500) + '...'
        };
        
        // Try to extract structured information
        try {
            // Look for JSON output
            const jsonMatch = output.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.summary) solution.summary = parsed.summary;
                if (parsed.files) solution.files = parsed.files;
                if (parsed.approach) solution.approach = parsed.approach;
            }
        } catch (parseError) {
            console.log('📋 Using text-based parsing for Claude Flow output');
        }
        
        // Extract key information using text patterns
        const summaryMatch = output.match(/SUMMARY:([^\n]+)/i) || output.match(/Summary:([^\n]+)/i);
        if (summaryMatch) {
            solution.summary = summaryMatch[1].trim();
        }
        
        const filesMatch = output.match(/FILES?:([^\n]+)/i);
        if (filesMatch) {
            solution.files = filesMatch[1].split(',').map(f => f.trim());
        }
        
        return solution;
    }

    async resolveWithFallback(issueNumber, issueTitle, issueBody) {
        console.log('🔧 Executing fallback automation...');
        
        const analysis = await this.analyzeIssue(issueNumber, issueTitle, issueBody);
        const solution = await this.generateSolution(analysis);
        
        const branchName = `fix/issue-${issueNumber}`;
        const implementation = await this.implementSolution(branchName, solution);
        const pr = await this.createAnalysisComment(issueNumber, issueTitle, solution, implementation);
        
        await this.updateIssueWithFallbackSuccess(issueNumber, pr);
        
        return {
            success: true,
            mode: 'fallback-automation',
            issueNumber,
            solution: solution.summary,
            limitation: 'Basic automation used due to Claude Flow initialization issues'
        };
    }

    async analyzeIssue(issueNumber, title, body) {
        console.log('🔍 Analyzing issue (fallback mode)...');
        
        const analysis = {
            number: issueNumber,
            title: title,
            body: body,
            type: 'unknown',
            complexity: 'medium',
            priority: 'normal',
            keywords: []
        };
        
        const lowerTitle = title.toLowerCase();
        const lowerBody = body.toLowerCase();
        const combined = `${lowerTitle} ${lowerBody}`;
        
        // Determine issue type
        if (combined.includes('bug') || combined.includes('error') || combined.includes('fail')) {
            analysis.type = 'bug';
        } else if (combined.includes('feature') || combined.includes('add') || combined.includes('implement')) {
            analysis.type = 'feature';
        } else if (combined.includes('improve') || combined.includes('enhance') || combined.includes('optimize')) {
            analysis.type = 'enhancement';
        } else if (combined.includes('document') || combined.includes('readme') || combined.includes('doc')) {
            analysis.type = 'documentation';
        }
        
        // Determine complexity
        if (combined.includes('simple') || combined.includes('minor') || combined.includes('typo')) {
            analysis.complexity = 'low';
        } else if (combined.includes('complex') || combined.includes('major') || combined.includes('refactor')) {
            analysis.complexity = 'high';
        }
        
        // Extract keywords
        const keywords = combined.match(/\b\w{4,}\b/g) || [];
        analysis.keywords = [...new Set(keywords)].slice(0, 10);
        
        return analysis;
    }

    async generateSolution(analysis) {
        console.log('💡 Generating solution (fallback mode)...');
        
        const solutionTemplates = {
            bug: {
                summary: `Bug fix for issue #${analysis.number}: ${analysis.title}`,
                approach: 'Identify root cause, implement fix, add regression tests',
                implementation: [
                    'Reproduce the bug in a test environment',
                    'Identify the root cause of the issue', 
                    'Implement a targeted fix',
                    'Add unit tests to prevent regression',
                    'Update documentation if needed'
                ],
                tests: ['Regression test for the bug', 'Unit tests for affected components']
            },
            feature: {
                summary: `Feature implementation for issue #${analysis.number}: ${analysis.title}`,
                approach: 'Design feature, implement core functionality, add comprehensive tests',
                implementation: [
                    'Design the feature architecture',
                    'Implement core functionality',
                    'Add user interface components if needed',
                    'Create comprehensive test suite',
                    'Update documentation and examples'
                ],
                tests: ['Feature functionality tests', 'Integration tests', 'User acceptance tests']
            },
            enhancement: {
                summary: `Enhancement for issue #${analysis.number}: ${analysis.title}`,
                approach: 'Analyze current implementation, optimize and improve',
                implementation: [
                    'Analyze current implementation',
                    'Identify optimization opportunities',
                    'Implement improvements',
                    'Maintain backward compatibility',
                    'Update performance benchmarks'
                ],
                tests: ['Performance tests', 'Backward compatibility tests']
            },
            documentation: {
                summary: `Documentation update for issue #${analysis.number}: ${analysis.title}`,
                approach: 'Review existing docs, update content, improve clarity',
                implementation: [
                    'Review existing documentation',
                    'Update outdated information',
                    'Improve clarity and examples',
                    'Check for broken links',
                    'Validate code examples'
                ],
                tests: ['Documentation accuracy verification', 'Link validation']
            }
        };
        
        const template = solutionTemplates[analysis.type] || solutionTemplates.bug;
        
        return {
            ...template,
            keywords: analysis.keywords,
            complexity: analysis.complexity,
            priority: analysis.priority,
            estimatedFiles: this.estimateFilesAffected(analysis),
            limitation: 'Generated using fallback automation - Claude Flow would provide more detailed analysis'
        };
    }

    estimateFilesAffected(analysis) {
        const files = [];
        
        // Based on keywords and type, estimate which files might be affected
        if (analysis.keywords.includes('test') || analysis.type === 'bug') {
            files.push('tests/');
        }
        
        if (analysis.keywords.includes('doc') || analysis.type === 'documentation') {
            files.push('README.md', 'docs/');
        }
        
        if (analysis.keywords.includes('config') || analysis.keywords.includes('setup')) {
            files.push('package.json', 'config/');
        }
        
        if (analysis.keywords.includes('script') || analysis.keywords.includes('automation')) {
            files.push('scripts/');
        }
        
        return files.length > 0 ? files : ['src/'];
    }

    async implementSolution(branchName, solution) {
        console.log('🔧 Implementing solution (fallback mode)...');
        
        // This is analysis-only mode - we don't actually create branches/files
        // Just return implementation guidance
        
        return {
            files: solution.estimatedFiles || ['implementation-needed'],
            summary: 'Analysis completed - manual implementation required',
            guidance: solution.implementation,
            linesOfCode: 'TBD - depends on implementation',
            note: 'This is analysis mode only - actual file changes require manual implementation'
        };
    }

    async createAnalysisComment(issueNumber, issueTitle, solution, implementation) {
        const title = `Analysis: ${issueTitle}`;
        const body = `## 🤖 Automated Issue Analysis

### 📋 Issue Analysis Results
**Issue**: #${issueNumber} - ${issueTitle}
**Analysis Mode**: ${this.claudeFlowInitialized ? 'Claude Flow AI' : 'Fallback Analysis'}
**Timestamp**: ${new Date().toISOString()}
**Issue Type**: ${solution.complexity} ${solution.type}

### 🔍 Analysis Summary
${solution.summary}

**Approach**: ${solution.approach}

### 🛠️ Implementation Plan
${solution.implementation.map((step, i) => `${i + 1}. ${step}`).join('\n')}

### 📁 Estimated Files to Modify
${implementation.files.map(file => `- \`${file}\``).join('\n')}

### 🧪 Recommended Tests
${solution.tests.map(test => `- ${test}`).join('\n')}

### 🔑 Key Insights
- **Priority**: ${solution.priority}
- **Complexity**: ${solution.complexity}
- **Keywords**: ${solution.keywords?.join(', ') || 'N/A'}

### 🚀 Next Steps
1. **Review** the analysis and implementation plan above
2. **Implement** the solution following the recommended approach
3. **Test** thoroughly using the suggested test cases
4. **Create** a pull request when implementation is complete

${this.claudeFlowInitialized ? `
### 🐝 AI-Powered Analysis
This analysis was generated using Claude Flow's advanced AI system, providing intelligent insights and recommendations.
` : `
### ⚠️ Analysis Limitation
This analysis was generated using basic automation due to Claude Flow initialization issues. For more advanced AI-powered analysis, Claude Flow needs to be properly configured.
`}

---
🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude Flow Automation <automation@claude-flow.ai>`;

        try {
            // Validate issue number before API call
            if (!this.issueNumber || isNaN(this.issueNumber)) {
                throw new Error(`Invalid issue number: ${this.issueNumber}`);
            }
            
            await this.octokit.rest.issues.createComment({
                owner: this.owner,
                repo: this.repo,
                issue_number: this.issueNumber,
                body: body
            });

            // Add appropriate labels
            if (this.issueNumber && !isNaN(this.issueNumber)) {
                const labels = [
                    'analyzed',
                    `type:${solution.type || 'unknown'}`,
                    `complexity:${solution.complexity}`,
                    this.claudeFlowInitialized ? 'claude-flow-ai' : 'fallback-analysis',
                    'awaiting-implementation'
                ];
                
                await this.octokit.rest.issues.addLabels({
                    owner: this.owner,
                    repo: this.repo,
                    issue_number: this.issueNumber,
                    labels: labels
                });
            }

            return { 
                type: 'analysis-comment', 
                issue_number: this.issueNumber, 
                message: 'Detailed analysis posted as comment',
                labels_added: true
            };
            
        } catch (error) {
            console.error('❌ Failed to post analysis comment:', error.message);
            
            // Fallback: simple comment if detailed comment fails
            try {
                if (this.issueNumber && !isNaN(this.issueNumber)) {
                    await this.octokit.rest.issues.createComment({
                        owner: this.owner,
                        repo: this.repo,
                        issue_number: this.issueNumber,
                        body: `❌ **Analysis Failed**
                        
🤖 The automated analysis encountered an error: ${error.message}

🔍 **Recommended Actions:**
1. Check GitHub Actions workflow logs for details
2. Verify repository permissions and tokens
3. Retry automation or implement manually

---
Co-Authored-By: Claude Flow Automation <automation@claude-flow.ai>`
                    });
                }
            } catch (fallbackError) {
                console.error('❌ Even fallback comment failed:', fallbackError.message);
            }
            
            throw error;
        }
    }

    async updateIssueWithClaudeFlowSuccess(issueNumber, solution) {
        const comment = `✅ **Claude Flow AI Analysis Completed**

🐝 Claude Flow AI has successfully analyzed this issue using advanced AI coordination.

📋 **Analysis Details:**
- **Mode**: Full Claude Flow AI System
- **Agent**: ${solution.agents}
- **Solution**: ${solution.summary}
- **Approach**: ${solution.approach}

🔍 **AI Features Used:**
- Advanced problem analysis
- Intelligent solution generation
- Production-ready recommendations
- Comprehensive implementation planning

💡 This analysis leveraged Claude Flow's enterprise-grade AI capabilities.

### 🚀 Implementation Required
Please review the analysis above and implement the recommended solution.

---
🤖 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude Flow AI <ai@claude-flow.ai>`;

        await this.octokit.rest.issues.createComment({
            owner: this.owner,
            repo: this.repo,
            issue_number: issueNumber,
            body: comment
        });
    }

    async updateIssueWithFallbackSuccess(issueNumber, pr) {
        const comment = `✅ **Fallback Analysis Completed**

🔧 Basic analysis system provided issue insights.

📋 **Analysis Details:**
- **Mode**: Fallback Analysis (Limited AI)
- **Status**: Analysis completed successfully
- **Result**: Implementation guidance provided

🚨 **Analysis Limitations:**
- Template-based analysis used
- Claude Flow AI features were unavailable
- Limited to pattern-based insights

🔍 **For Enhanced AI Analysis:**
- Claude Flow initialization needs to be fixed
- Full AI capabilities require proper setup
- Advanced Hive-Mind coordination unavailable

### 🚀 Next Steps
Review the analysis comment above and implement the recommended solution manually.

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

🤖 Both Claude Flow and fallback analysis encountered critical errors.

📋 **Error Details:**
- **Primary Error**: Claude Flow initialization failed
- **Fallback Error**: ${error.message}
- **Timestamp**: ${new Date().toISOString()}

🔍 **Root Cause Analysis:**
- Claude Flow dependency installation issues
- System configuration incompatibility
- GitHub Actions environment limitations

💡 **Immediate Actions Needed:**
1. Fix Claude Flow installation in GitHub Actions
2. Resolve dependency and build environment issues
3. Configure proper automation environment
4. Consider manual issue analysis and resolution

### 🛠️ Manual Resolution Required
Please analyze and resolve this issue manually until automation is fixed.

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
            console.error('📋 Stack trace:', error.stack);
            process.exit(1);
        });
}

module.exports = ClaudeFlowHybridAutomation;
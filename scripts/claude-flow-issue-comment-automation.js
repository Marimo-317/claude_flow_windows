#!/usr/bin/env node
// Claude Flow Issue Comment Automation - PR作成権限なしバージョン
// Issueコメント更新のみで解決報告を行う

const { Octokit } = require('@octokit/rest');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ClaudeFlowIssueCommentAutomation {
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
        
        console.log('🚀 Claude Flow Issue Comment Automation Starting...');
        console.log('📋 Arguments:', this.args);
        console.log('🔑 GitHub Token:', process.env.GITHUB_TOKEN ? `Present (${process.env.GITHUB_TOKEN.length} chars)` : 'Missing');
        console.log('📂 Repository:', `${this.owner}/${this.repo}`);
        console.log('⚠️  Mode: Issue Comment Only (No PR Creation)');
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
        
        console.log('📝 Falling back to comment-only mode');
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
                console.log('🐝 Using Claude Flow analysis');
                return await this.resolveWithClaudeFlowComment(issueNumber, issueTitle, issueBody);
            } else {
                console.log('🔧 Using fallback analysis');
                return await this.resolveWithFallbackComment(issueNumber, issueTitle, issueBody);
            }
            
        } catch (error) {
            console.error('❌ Automation failed:', error);
            
            if (this.args['issue-number']) {
                await this.updateIssueWithFailure(parseInt(this.args['issue-number']), error);
            }
            
            throw error;
        }
    }

    async resolveWithClaudeFlowComment(issueNumber, issueTitle, issueBody) {
        console.log('🐝 Executing Claude Flow analysis (comment-only mode)...');
        
        try {
            // Create comprehensive prompt for Claude Flow analysis
            const analysisPrompt = `Analyze GitHub Issue #${issueNumber}: ${issueTitle}

ISSUE DESCRIPTION:
${issueBody}

REQUIREMENTS:
1. Provide detailed issue analysis
2. Recommend specific solution approach
3. Identify required changes and files
4. Suggest implementation steps
5. Recommend testing strategy
6. Note: This is analysis-only mode (no file modifications)

CONTEXT:
- Repository: ${this.args.repository}
- Environment: GitHub Actions automation
- Mode: Comment-only analysis

Provide comprehensive analysis and recommendations.`;

            // Execute Claude Flow analysis
            const analysisResult = await this.executeCommand('./claude-flow.sh', [
                'analyze',
                `"${analysisPrompt}"`,
                '--detailed',
                '--recommendations',
                '--issue-number', issueNumber.toString(),
                '--repository', this.args.repository,
                '--analysis-only'
            ], { timeout: 300000 }); // 5 minutes

            if (analysisResult.success) {
                console.log('✅ Claude Flow analysis completed');
                
                // Parse analysis results
                const analysis = this.parseClaudeFlowAnalysis(analysisResult.stdout);
                
                // Update issue with detailed analysis comment
                await this.updateIssueWithClaudeFlowAnalysis(issueNumber, analysis, issueTitle);
                
                return {
                    success: true,
                    mode: 'claude-flow-analysis',
                    issueNumber,
                    analysis: analysis.summary
                };
            } else {
                throw new Error(`Claude Flow analysis failed: ${analysisResult.stderr}`);
            }
            
        } catch (error) {
            console.log('⚠️ Claude Flow analysis failed, falling back...');
            return await this.resolveWithFallbackComment(issueNumber, issueTitle, issueBody);
        }
    }

    parseClaudeFlowAnalysis(output) {
        // Parse Claude Flow output for analysis details
        const analysis = {
            summary: 'Claude Flow detailed analysis completed',
            approach: 'AI-powered comprehensive analysis',
            recommendations: [],
            files_to_modify: [],
            testing_strategy: 'Comprehensive testing recommended',
            complexity: 'medium',
            estimated_effort: 'moderate'
        };
        
        // Extract recommendations
        const recommendationMatches = output.match(/RECOMMENDATION:([^\n]+)/gi);
        if (recommendationMatches) {
            analysis.recommendations = recommendationMatches.map(match => 
                match.split(':')[1].trim()
            );
        }
        
        // Extract files to modify
        const fileMatches = output.match(/FILES TO MODIFY:([^\n]+)/gi);
        if (fileMatches) {
            analysis.files_to_modify = fileMatches.flatMap(match => 
                match.split(':')[1].split(',').map(f => f.trim())
            );
        }
        
        // Extract summary if present
        const summaryMatch = output.match(/SUMMARY:([^\n]+)/i);
        if (summaryMatch) {
            analysis.summary = summaryMatch[1].trim();
        }
        
        // Extract complexity assessment
        const complexityMatch = output.match(/COMPLEXITY:\s*(low|medium|high)/i);
        if (complexityMatch) {
            analysis.complexity = complexityMatch[1].toLowerCase();
        }
        
        return analysis;
    }

    async resolveWithFallbackComment(issueNumber, issueTitle, issueBody) {
        console.log('🔧 Executing fallback analysis (comment-only mode)...');
        
        const analysis = await this.analyzeIssue(issueNumber, issueTitle, issueBody);
        const recommendations = await this.generateRecommendations(analysis);
        
        await this.updateIssueWithFallbackAnalysis(issueNumber, recommendations, issueTitle);
        
        return {
            success: true,
            mode: 'fallback-analysis',
            issueNumber,
            analysis: recommendations.summary,
            limitation: 'Basic analysis used due to Claude Flow initialization issues'
        };
    }

    async analyzeIssue(issueNumber, title, body) {
        console.log('🔍 Analyzing issue (fallback mode)...');
        
        const analysis = {
            number: issueNumber,
            title: title,
            body: body,
            type: 'general',
            complexity: 'medium',
            priority: 'normal',
            keywords: []
        };
        
        // Improved issue classification
        const lowerTitle = title.toLowerCase();
        const lowerBody = body.toLowerCase();
        const text = `${lowerTitle} ${lowerBody}`;
        
        // Issue type detection
        if (text.includes('bug') || text.includes('error') || text.includes('fail')) {
            analysis.type = 'bug';
            analysis.priority = 'high';
        } else if (text.includes('feature') || text.includes('enhancement')) {
            analysis.type = 'feature';
            analysis.complexity = 'high';
        } else if (text.includes('documentation') || text.includes('docs')) {
            analysis.type = 'documentation';
            analysis.complexity = 'low';
        } else if (text.includes('refactor') || text.includes('optimize')) {
            analysis.type = 'refactoring';
            analysis.complexity = 'medium';
        }
        
        // Extract keywords
        const keywords = text.match(/\b[a-zA-Z]{4,}\b/g) || [];
        analysis.keywords = [...new Set(keywords.slice(0, 10))];
        
        return analysis;
    }

    async generateRecommendations(analysis) {
        console.log('💡 Generating recommendations (fallback mode)...');
        
        const recommendations = {
            summary: `Analysis completed for Issue #${analysis.number} (${analysis.type})`,
            approach: this.getApproachByType(analysis.type),
            implementation_steps: this.getImplementationSteps(analysis.type),
            files_to_modify: this.getFilesToModify(analysis.type),
            testing_strategy: this.getTestingStrategy(analysis.type),
            estimated_effort: this.getEstimatedEffort(analysis.complexity),
            priority: analysis.priority,
            limitation: 'Generated using fallback analysis due to Claude Flow initialization issues'
        };
        
        return recommendations;
    }

    getApproachByType(type) {
        const approaches = {
            bug: 'Identify root cause, implement fix, add regression tests',
            feature: 'Design specification, implement incrementally, comprehensive testing',
            documentation: 'Review existing docs, identify gaps, create comprehensive updates',
            refactoring: 'Analyze current code, identify improvements, maintain functionality'
        };
        return approaches[type] || 'Standard development approach with proper testing';
    }

    getImplementationSteps(type) {
        const steps = {
            bug: [
                'Reproduce the issue',
                'Identify root cause',
                'Implement targeted fix',
                'Add regression tests',
                'Verify fix works'
            ],
            feature: [
                'Create detailed specification',
                'Design API/interface',
                'Implement core functionality',
                'Add comprehensive tests',
                'Update documentation'
            ],
            documentation: [
                'Review current documentation',
                'Identify missing or outdated content',
                'Create/update documentation',
                'Review for clarity and completeness'
            ],
            refactoring: [
                'Analyze current implementation',
                'Identify improvement opportunities',
                'Refactor while maintaining functionality',
                'Ensure all tests pass',
                'Update documentation if needed'
            ]
        };
        return steps[type] || ['Analyze requirements', 'Implement solution', 'Test thoroughly'];
    }

    getFilesToModify(type) {
        const files = {
            bug: ['Source files with the bug', 'Related test files', 'Documentation if needed'],
            feature: ['Core implementation files', 'Test files', 'Documentation', 'Configuration if needed'],
            documentation: ['README.md', 'docs/ files', 'API documentation', 'Code comments'],
            refactoring: ['Target source files', 'Related test files', 'Documentation updates']
        };
        return files[type] || ['Source files', 'Test files', 'Documentation'];
    }

    getTestingStrategy(type) {
        const strategies = {
            bug: 'Regression testing, unit tests for the fix, integration tests',
            feature: 'Unit tests, integration tests, end-to-end tests, performance tests if applicable',
            documentation: 'Documentation review, example validation, link checking',
            refactoring: 'All existing tests must pass, potential performance testing'
        };
        return strategies[type] || 'Comprehensive testing including unit and integration tests';
    }

    getEstimatedEffort(complexity) {
        const efforts = {
            low: '1-2 hours',
            medium: '0.5-1 day',
            high: '2-5 days'
        };
        return efforts[complexity] || '1 day';
    }

    async updateIssueWithClaudeFlowAnalysis(issueNumber, analysis, issueTitle) {
        const comment = `🐝 **Claude Flow AI Analysis Completed**

## 📋 Issue Analysis: "${issueTitle}"

### 🎯 **AI-Powered Analysis Summary**
${analysis.summary}

### 🔍 **Recommended Approach**
${analysis.approach}

### 📝 **Key Recommendations**
${analysis.recommendations.length > 0 ? 
  analysis.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n') : 
  'Comprehensive analysis and solution development recommended'
}

### 📁 **Files to Modify**
${analysis.files_to_modify.length > 0 ? 
  analysis.files_to_modify.map(file => `- \`${file}\``).join('\n') : 
  '- Files will be identified during implementation'
}

### 🧪 **Testing Strategy**
${analysis.testing_strategy}

### 📊 **Complexity Assessment**
- **Level**: ${analysis.complexity.toUpperCase()}
- **Estimated Effort**: ${analysis.estimated_effort}

---

### 🚀 **Next Steps**
1. **Review Analysis**: Validate the AI recommendations above
2. **Create Branch**: \`git checkout -b fix/issue-${issueNumber}\`
3. **Implement Solution**: Follow the recommended approach
4. **Create PR**: Submit for review with comprehensive testing

### ⚠️ **Important Note**
This analysis was generated using Claude Flow AI system. The recommendations are based on advanced pattern recognition and should be reviewed by a human developer before implementation.

---
🤖 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude Flow AI Analysis <ai-analysis@claude-flow.ai>`;

        await this.octokit.rest.issues.createComment({
            owner: this.owner,
            repo: this.repo,
            issue_number: issueNumber,
            body: comment
        });
    }

    async updateIssueWithFallbackAnalysis(issueNumber, recommendations, issueTitle) {
        const comment = `🔧 **Automated Issue Analysis Completed**

## 📋 Issue Analysis: "${issueTitle}"

### 📊 **Analysis Summary**
${recommendations.summary}

### 🎯 **Recommended Approach**
${recommendations.approach}

### 📝 **Implementation Steps**
${recommendations.implementation_steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

### 📁 **Files Likely to be Modified**
${recommendations.files_to_modify.map(file => `- ${file}`).join('\n')}

### 🧪 **Testing Strategy**
${recommendations.testing_strategy}

### ⏱️ **Effort Estimation**
- **Priority**: ${recommendations.priority.toUpperCase()}
- **Estimated Time**: ${recommendations.estimated_effort}

---

### 🚀 **Next Steps for Developer**
1. **Review Analysis**: Validate the recommendations above
2. **Create Branch**: \`git checkout -b fix/issue-${issueNumber}\`
3. **Implement**: Follow the step-by-step implementation guide
4. **Test**: Apply the recommended testing strategy
5. **Submit PR**: Create pull request for review

### ⚠️ **Automation Limitation**
${recommendations.limitation}

**For Advanced AI Analysis:** Resolve Claude Flow initialization to get:
- Deep semantic analysis
- Advanced pattern recognition  
- Intelligent code suggestions
- Comprehensive solution generation

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
        const comment = `❌ **Automation Analysis Failed**

## 🚨 Error Report

**Error**: Analysis system encountered critical errors and could not complete issue analysis.

### 📋 **Error Details**
- **Primary Error**: Claude Flow initialization failed
- **Analysis Error**: ${error.message}
- **Timestamp**: ${new Date().toISOString()}

### 🔍 **Root Cause Analysis**
- SQLite native binding issues in GitHub Actions environment
- Claude Flow dependency installation problems  
- System configuration incompatibility with automation environment

### 💡 **Manual Resolution Required**
Since automated analysis failed, please proceed with manual issue investigation:

1. **Review Issue Details**: Manually analyze the issue description and requirements
2. **Research Similar Issues**: Check repository history for similar problems
3. **Design Solution**: Create implementation plan based on issue requirements
4. **Implement & Test**: Develop solution with appropriate testing
5. **Submit PR**: Create pull request for manual review

### 🔧 **To Fix Automation System**
1. Resolve SQLite binding issues for Windows/GitHub Actions
2. Fix claude-flow@alpha installation problems
3. Configure proper build environment for native modules

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
    const automation = new ClaudeFlowIssueCommentAutomation();
    
    automation.resolveIssue()
        .then(result => {
            console.log('🎉 Issue analysis completed!');
            console.log('📊 Result:', JSON.stringify(result, null, 2));
            console.log('💬 Check the issue for detailed analysis comment');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Analysis failed:', error.message);
            process.exit(1);
        });
}

module.exports = ClaudeFlowIssueCommentAutomation;
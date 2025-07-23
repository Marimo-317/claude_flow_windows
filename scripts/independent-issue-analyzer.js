#!/usr/bin/env node
/**
 * Independent Issue Analyzer & Comment System
 * 
 * DESIGN PRINCIPLES:
 * - Zero Claude Flow dependencies
 * - Pure Node.js standard library + GitHub API
 * - Fail-safe error handling
 * - Minimal external dependencies
 * - Works in ANY GitHub Actions environment
 */

const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

class IndependentIssueAnalyzer {
    constructor() {
        // Pre-validate all critical requirements
        this.validateEnvironment();
        
        // Initialize with validated environment
        this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        this.repository = this.parseRepository();
        this.issueNumber = this.getIssueNumber();
        this.issueTitle = process.env.ISSUE_TITLE || 'Unknown Issue';
        this.issueBody = process.env.ISSUE_BODY || '';
        
        console.log('✅ Independent Issue Analyzer initialized successfully');
        console.log(`📋 Repository: ${this.repository.owner}/${this.repository.repo}`);
        console.log(`🎯 Issue: #${this.issueNumber} - ${this.issueTitle}`);
    }

    validateEnvironment() {
        const required = ['GITHUB_TOKEN', 'REPOSITORY'];
        const missing = required.filter(env => !process.env[env]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }

        if (!process.env.ISSUE_NUMBER && !process.argv.includes('--issue-number')) {
            throw new Error('Issue number is required but not provided');
        }
    }

    parseRepository() {
        const repo = process.env.REPOSITORY;
        const [owner, repoName] = repo.split('/');
        
        if (!owner || !repoName) {
            throw new Error(`Invalid repository format: ${repo}`);
        }
        
        return { owner, repo: repoName };
    }

    getIssueNumber() {
        // Multiple fallback sources for issue number
        const sources = [
            process.env.ISSUE_NUMBER,
            process.env.GITHUB_ISSUE_NUMBER,
            this.getArgValue('--issue-number')
        ];
        
        for (const source of sources) {
            if (source) {
                const num = parseInt(source);
                if (!isNaN(num) && num > 0) {
                    return num;
                }
            }
        }
        
        throw new Error('Valid issue number not found in any source');
    }

    getArgValue(flag) {
        const index = process.argv.indexOf(flag);
        return index !== -1 && index + 1 < process.argv.length ? process.argv[index + 1] : null;
    }

    async analyzeIssue() {
        console.log('🔍 Starting independent issue analysis...');
        
        try {
            // Step 1: Fetch issue details from GitHub API
            const issueData = await this.fetchIssueData();
            
            // Step 2: Perform analysis
            const analysis = this.performIssueAnalysis(issueData);
            
            // Step 3: Generate solution recommendations
            const recommendations = this.generateRecommendations(analysis);
            
            // Step 4: Post comprehensive comment
            await this.postAnalysisComment(analysis, recommendations);
            
            // Step 5: Add appropriate labels
            await this.addLabels(analysis);
            
            console.log('✅ Independent analysis completed successfully');
            
            return {
                success: true,
                mode: 'independent-analyzer',
                issueNumber: this.issueNumber,
                analysis,
                recommendations
            };
            
        } catch (error) {
            console.error('❌ Independent analysis failed:', error.message);
            
            // Emergency fallback comment
            await this.postEmergencyComment(error);
            
            throw error;
        }
    }

    async fetchIssueData() {
        console.log(`📡 Fetching issue data for #${this.issueNumber}...`);
        
        try {
            const response = await this.octokit.rest.issues.get({
                owner: this.repository.owner,
                repo: this.repository.repo,
                issue_number: this.issueNumber
            });
            
            console.log('✅ Issue data fetched successfully');
            return response.data;
            
        } catch (error) {
            console.error('❌ Failed to fetch issue data:', error.message);
            
            // Use environment data as fallback
            return {
                number: this.issueNumber,
                title: this.issueTitle,
                body: this.issueBody,
                labels: [],
                state: 'open',
                created_at: new Date().toISOString()
            };
        }
    }

    performIssueAnalysis(issueData) {
        console.log('🧠 Performing issue analysis...');
        
        const analysis = {
            issueNumber: issueData.number,
            title: issueData.title,
            body: issueData.body,
            labels: issueData.labels.map(label => label.name),
            created: issueData.created_at,
            
            // Classification
            type: this.classifyIssueType(issueData),
            severity: this.assessSeverity(issueData),
            complexity: this.estimateComplexity(issueData),
            
            // Content analysis
            keyTerms: this.extractKeyTerms(issueData),
            mentions: this.findMentions(issueData),
            
            // Context
            repository: `${this.repository.owner}/${this.repository.repo}`,
            analyzedAt: new Date().toISOString()
        };
        
        console.log('✅ Issue analysis completed');
        return analysis;
    }

    classifyIssueType(issueData) {
        const title = issueData.title.toLowerCase();
        const body = (issueData.body || '').toLowerCase();
        const text = `${title} ${body}`;
        
        if (text.includes('bug') || text.includes('error') || text.includes('fail')) {
            return 'bug';
        } else if (text.includes('feature') || text.includes('enhancement') || text.includes('add')) {
            return 'feature';
        } else if (text.includes('test') || text.includes('automation')) {
            return 'testing';
        } else if (text.includes('documentation') || text.includes('docs')) {
            return 'documentation';
        } else {
            return 'general';
        }
    }

    assessSeverity(issueData) {
        const title = issueData.title.toLowerCase();
        const body = (issueData.body || '').toLowerCase();
        const text = `${title} ${body}`;
        
        if (text.includes('critical') || text.includes('blocking') || text.includes('urgent')) {
            return 'critical';
        } else if (text.includes('high') || text.includes('important') || text.includes('fail')) {
            return 'high';
        } else if (text.includes('medium') || text.includes('moderate')) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    estimateComplexity(issueData) {
        const body = (issueData.body || '');
        const title = issueData.title;
        
        // Simple heuristics for complexity estimation
        const indicators = {
            simple: ['typo', 'text', 'color', 'style', 'minor'],
            medium: ['feature', 'function', 'component', 'test'],
            complex: ['architecture', 'database', 'security', 'performance', 'integration']
        };
        
        const text = `${title} ${body}`.toLowerCase();
        
        if (indicators.complex.some(term => text.includes(term))) {
            return 'complex';
        } else if (indicators.medium.some(term => text.includes(term))) {
            return 'medium';
        } else {
            return 'simple';
        }
    }

    extractKeyTerms(issueData) {
        const text = `${issueData.title} ${issueData.body || ''}`.toLowerCase();
        
        // Extract technical terms and important keywords
        const technicalTerms = text.match(/\b(api|database|server|client|frontend|backend|github|workflow|action|automation|claude|flow|error|exception|bug|feature|test|deployment|security|performance)\b/g) || [];
        
        return [...new Set(technicalTerms)]; // Remove duplicates
    }

    findMentions(issueData) {
        const text = `${issueData.title} ${issueData.body || ''}`;
        
        return {
            users: text.match(/@[\w-]+/g) || [],
            tags: text.match(/#[\w-]+/g) || [],
            automation: text.includes('@claude-flow-automation')
        };
    }

    generateRecommendations(analysis) {
        console.log('💡 Generating solution recommendations...');
        
        const recommendations = {
            immediate: [],
            shortTerm: [],
            longTerm: [],
            implementation: {
                files: [],
                steps: [],
                testing: []
            }
        };
        
        // Type-specific recommendations
        switch (analysis.type) {
            case 'bug':
                recommendations.immediate.push('Reproduce the issue in a controlled environment');
                recommendations.immediate.push('Check logs and error messages');
                recommendations.shortTerm.push('Implement fix and add regression tests');
                break;
                
            case 'feature':
                recommendations.immediate.push('Define clear requirements and acceptance criteria');
                recommendations.shortTerm.push('Create feature specification document');
                recommendations.longTerm.push('Implement feature with comprehensive testing');
                break;
                
            case 'testing':
                recommendations.immediate.push('Review current test coverage');
                recommendations.shortTerm.push('Implement missing test cases');
                break;
                
            default:
                recommendations.immediate.push('Clarify issue requirements and scope');
                recommendations.shortTerm.push('Plan implementation approach');
        }
        
        // Complexity-specific recommendations
        if (analysis.complexity === 'complex') {
            recommendations.longTerm.push('Consider breaking down into smaller tasks');
            recommendations.longTerm.push('Plan for architecture review');
        }
        
        // Severity-specific recommendations
        if (analysis.severity === 'critical' || analysis.severity === 'high') {
            recommendations.immediate.unshift('Prioritize this issue for immediate attention');
        }
        
        // Generate implementation guidance
        this.generateImplementationGuidance(analysis, recommendations);
        
        console.log('✅ Recommendations generated');
        return recommendations;
    }

    generateImplementationGuidance(analysis, recommendations) {
        // Basic implementation steps based on analysis
        if (analysis.type === 'bug') {
            recommendations.implementation.steps = [
                'Create a new branch for the fix',
                'Write a failing test that reproduces the bug',
                'Implement the minimal fix to make the test pass',
                'Ensure all existing tests still pass',
                'Update documentation if necessary'
            ];
            recommendations.implementation.testing = [
                'Unit tests for the specific fix',
                'Integration tests if multiple components are affected',
                'Manual testing to verify the fix works as intended'
            ];
        } else if (analysis.type === 'feature') {
            recommendations.implementation.steps = [
                'Create feature branch',
                'Write comprehensive tests first (TDD approach)',
                'Implement feature incrementally',
                'Update documentation and examples',
                'Perform code review before merging'
            ];
        }
        
        // Suggest potential file modifications based on key terms
        if (analysis.keyTerms.includes('workflow') || analysis.keyTerms.includes('github')) {
            recommendations.implementation.files.push('.github/workflows/*.yml');
        }
        if (analysis.keyTerms.includes('automation') || analysis.keyTerms.includes('script')) {
            recommendations.implementation.files.push('scripts/*.js');
        }
        if (analysis.keyTerms.includes('test')) {
            recommendations.implementation.files.push('test/*.js', 'spec/*.js');
        }
    }

    async postAnalysisComment(analysis, recommendations) {
        console.log('💬 Posting comprehensive analysis comment...');
        
        const commentBody = this.buildAnalysisComment(analysis, recommendations);
        
        try {
            const response = await this.octokit.rest.issues.createComment({
                owner: this.repository.owner,
                repo: this.repository.repo,
                issue_number: this.issueNumber,
                body: commentBody
            });
            
            console.log('✅ Analysis comment posted successfully');
            return response.data;
            
        } catch (error) {
            console.error('❌ Failed to post analysis comment:', error.message);
            throw error;
        }
    }

    buildAnalysisComment(analysis, recommendations) {
        return `## 🤖 Independent Issue Analysis Complete

### 📋 Analysis Summary
**Issue**: #${analysis.issueNumber} - ${analysis.title}
**Type**: ${analysis.type} | **Severity**: ${analysis.severity} | **Complexity**: ${analysis.complexity}
**Analyzed**: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}

### 🔍 Issue Classification
- **Category**: ${analysis.type.charAt(0).toUpperCase() + analysis.type.slice(1)}
- **Estimated Severity**: ${analysis.severity.toUpperCase()}
- **Implementation Complexity**: ${analysis.complexity}
- **Key Terms**: ${analysis.keyTerms.join(', ') || 'None identified'}

### 💡 Recommended Action Plan

#### ⚡ Immediate Actions (Next 24 hours)
${recommendations.immediate.map(item => `- ${item}`).join('\n')}

#### 📅 Short-term Actions (Next week)  
${recommendations.shortTerm.map(item => `- ${item}`).join('\n')}

${recommendations.longTerm.length > 0 ? `#### 🎯 Long-term Considerations
${recommendations.longTerm.map(item => `- ${item}`).join('\n')}` : ''}

### 🔧 Implementation Guidance

${recommendations.implementation.files.length > 0 ? `**Potential Files to Modify:**
${recommendations.implementation.files.map(file => `- \`${file}\``).join('\n')}

` : ''}**Recommended Implementation Steps:**
${recommendations.implementation.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

${recommendations.implementation.testing.length > 0 ? `**Testing Strategy:**
${recommendations.implementation.testing.map(test => `- ${test}`).join('\n')}` : ''}

### 🚦 Next Steps
1. **Review Analysis**: Confirm the classification and recommendations above
2. **Plan Implementation**: Use the guidance above to create an implementation plan  
3. **Create Branch**: Start with a feature/fix branch when ready
4. **Implement Solution**: Follow the step-by-step recommendations
5. **Create Pull Request**: Submit for review when implementation is complete

---
🤖 **Analysis Method**: Independent Issue Analyzer (No Claude Flow dependencies)
**Reliability**: ✅ Fail-safe operation in any GitHub Actions environment  

*Generated with [Claude Code](https://claude.ai/code)*
*Co-Authored-By: Independent Issue Analyzer <analyzer@claude-flow.ai>*`;
    }

    async addLabels(analysis) {
        console.log('🏷️ Adding analysis-based labels...');
        
        const labels = [];
        
        // Type-based labels
        labels.push(`type:${analysis.type}`);
        
        // Severity-based labels
        labels.push(`severity:${analysis.severity}`);
        
        // Complexity-based labels
        labels.push(`complexity:${analysis.complexity}`);
        
        // Status label
        labels.push('status:analyzed');
        
        try {
            await this.octokit.rest.issues.addLabels({
                owner: this.repository.owner,
                repo: this.repository.repo,
                issue_number: this.issueNumber,
                labels: labels
            });
            
            console.log(`✅ Labels added: ${labels.join(', ')}`);
            
        } catch (error) {
            console.log(`⚠️ Failed to add labels: ${error.message}`);
            // Continue without failing - labels are not critical
        }
    }

    async postEmergencyComment(error) {
        console.log('🚨 Posting emergency fallback comment...');
        
        const emergencyComment = `## ❌ Independent Analysis Failed

🤖 The independent issue analyzer encountered an unexpected error.

**Error Details:**
\`\`\`
${error.message}
\`\`\`

**Timestamp**: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}

### 🔍 Manual Review Required
This issue requires manual attention as the automated analysis system failed.

**Recommended Actions:**
1. Review the error details above
2. Check if the issue requires immediate attention based on title/description
3. Assign appropriate team members for manual review
4. Consider improving automation system to handle similar cases

---
🤖 Emergency fallback system activated
*Generated with [Claude Code](https://claude.ai/code)*`;

        try {
            await this.octokit.rest.issues.createComment({
                owner: this.repository.owner,
                repo: this.repository.repo,
                issue_number: this.issueNumber,
                body: emergencyComment
            });
            
            console.log('✅ Emergency comment posted');
            
        } catch (commentError) {
            console.error('💥 Even emergency comment failed:', commentError.message);
            // At this point, we've done everything possible
        }
    }
}

// Main execution with comprehensive error handling
if (require.main === module) {
    console.log('🚀 Starting Independent Issue Analyzer...');
    
    // Global error handlers
    process.on('uncaughtException', (error) => {
        console.error('💥 Uncaught Exception:', error.message);
        process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });
    
    // Main execution
    (async () => {
        try {
            const analyzer = new IndependentIssueAnalyzer();
            const result = await analyzer.analyzeIssue();
            
            console.log('🎉 Independent analysis completed successfully!');
            console.log('📊 Final Result:', JSON.stringify(result, null, 2));
            
            process.exit(0);
            
        } catch (error) {
            console.error('💥 Independent analyzer failed:', error.message);
            console.error('Stack trace:', error.stack);
            
            process.exit(1);
        }
    })();
}

module.exports = IndependentIssueAnalyzer;
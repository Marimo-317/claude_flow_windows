// Test Issue Analyzer for Claude Flow Automation Testing
require('dotenv').config({ path: '.env.test' });
const fs = require('fs-extra');
const winston = require('winston');

// Mock Issue Analyzer for Testing
class TestIssueAnalyzer {
    constructor() {
        this.logger = winston.createLogger({
            level: 'debug',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.colorize(),
                winston.format.simple()
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'logs/test-issue-analyzer.log' })
            ]
        });
        
        this.testResults = [];
        this.loadTestPatterns();
    }

    loadTestPatterns() {
        this.patterns = {
            complexity: {
                low: [
                    /fix.*typo/i, /button.*text/i, /spelling/i, /color/i, /css/i
                ],
                medium: [
                    /add.*feature/i, /implement/i, /create.*form/i, /validation/i, /api/i
                ],
                high: [
                    /security/i, /authentication/i, /architecture/i, /database/i, /performance/i
                ]
            },
            category: {
                bug: [/bug/i, /fix/i, /error/i, /issue/i, /broken/i],
                feature: [/feature/i, /add/i, /implement/i, /create/i, /new/i],
                security: [/security/i, /vulnerability/i, /exploit/i, /auth/i],
                performance: [/performance/i, /slow/i, /optimize/i, /speed/i]
            },
            languages: {
                javascript: [/javascript/i, /js/i, /react/i, /node/i, /npm/i],
                python: [/python/i, /py/i, /django/i, /flask/i, /pip/i],
                java: [/java/i, /spring/i, /maven/i, /gradle/i],
                csharp: [/c#/i, /csharp/i, /\.net/i, /asp\.net/i]
            }
        };
    }

    async analyzeIssue(issueData) {
        try {
            this.logger.info(`Analyzing issue #${issueData.number}: ${issueData.title}`);

            const analysis = {
                issue_id: issueData.id,
                number: issueData.number,
                title: issueData.title,
                body: issueData.body || '',
                labels: issueData.labels || [],
                complexity: this.assessComplexity(issueData),
                languages: this.detectLanguages(issueData),
                frameworks: this.detectFrameworks(issueData),
                category: this.categorizeIssue(issueData),
                priority: this.calculatePriority(issueData),
                confidence: 0,
                estimatedDuration: 0,
                requiredAgents: [],
                requiredTools: []
            };

            // Calculate estimated duration
            analysis.estimatedDuration = this.estimateDuration(analysis);

            // Determine required agents
            analysis.requiredAgents = this.determineRequiredAgents(analysis);

            // Determine required tools
            analysis.requiredTools = this.determineRequiredTools(analysis);

            // Calculate confidence score
            analysis.confidence = this.calculateConfidence(analysis);

            // Store analysis result
            this.testResults.push({
                timestamp: new Date().toISOString(),
                analysis: analysis,
                success: true
            });

            this.logger.info(`Issue analysis completed with ${analysis.confidence}% confidence`);
            return analysis;

        } catch (error) {
            this.logger.error('Error analyzing issue:', error);
            this.testResults.push({
                timestamp: new Date().toISOString(),
                error: error.message,
                success: false
            });
            throw error;
        }
    }

    assessComplexity(issueData) {
        const text = `${issueData.title} ${issueData.body}`.toLowerCase();
        
        // Check for complexity patterns
        for (const [level, patterns] of Object.entries(this.patterns.complexity)) {
            for (const pattern of patterns) {
                if (pattern.test(text)) {
                    return level;
                }
            }
        }
        
        // Default based on text length
        return text.length > 500 ? 'medium' : 'low';
    }

    detectLanguages(issueData) {
        const text = `${issueData.title} ${issueData.body}`.toLowerCase();
        const detected = [];

        for (const [language, patterns] of Object.entries(this.patterns.languages)) {
            for (const pattern of patterns) {
                if (pattern.test(text)) {
                    detected.push(language);
                    break;
                }
            }
        }

        return detected.length > 0 ? detected : ['general'];
    }

    detectFrameworks(issueData) {
        const text = `${issueData.title} ${issueData.body}`.toLowerCase();
        const frameworks = [];

        if (/react/i.test(text)) frameworks.push('react');
        if (/vue/i.test(text)) frameworks.push('vue');
        if (/angular/i.test(text)) frameworks.push('angular');
        if (/express/i.test(text)) frameworks.push('express');
        if (/django/i.test(text)) frameworks.push('django');

        return frameworks;
    }

    categorizeIssue(issueData) {
        const text = `${issueData.title} ${issueData.body}`.toLowerCase();
        const labels = issueData.labels?.map(label => label.name?.toLowerCase() || '') || [];

        // Check labels first
        for (const label of labels) {
            if (label.includes('bug')) return 'bug';
            if (label.includes('feature')) return 'feature';
            if (label.includes('security')) return 'security';
            if (label.includes('performance')) return 'performance';
        }

        // Check text patterns
        for (const [category, patterns] of Object.entries(this.patterns.category)) {
            for (const pattern of patterns) {
                if (pattern.test(text)) {
                    return category;
                }
            }
        }

        return 'general';
    }

    calculatePriority(issueData) {
        const labels = issueData.labels?.map(label => label.name?.toLowerCase() || '') || [];
        const text = `${issueData.title} ${issueData.body}`.toLowerCase();

        if (labels.some(label => label.includes('critical') || label.includes('high'))) {
            return 'high';
        }
        if (labels.some(label => label.includes('low'))) {
            return 'low';
        }
        if (/critical|urgent|security/i.test(text)) {
            return 'high';
        }

        return 'medium';
    }

    estimateDuration(analysis) {
        const baseTime = {
            low: 300000,     // 5 minutes
            medium: 1800000, // 30 minutes
            high: 3600000    // 60 minutes
        };

        let duration = baseTime[analysis.complexity];

        // Adjust for category
        const categoryMultipliers = {
            bug: 0.7,
            feature: 1.5,
            security: 2.0,
            performance: 1.8
        };

        duration *= categoryMultipliers[analysis.category] || 1.0;

        return Math.round(duration);
    }

    determineRequiredAgents(analysis) {
        const agents = [];

        if (analysis.complexity === 'high') {
            agents.push({
                type: 'coordinator',
                priority: 'high',
                capabilities: ['task-management', 'agent-coordination']
            });
        }

        if (analysis.category === 'feature' && analysis.complexity !== 'low') {
            agents.push({
                type: 'architect',
                priority: 'high',
                capabilities: ['system-design', 'api-design']
            });
        }

        if (analysis.languages.length > 0 && analysis.languages[0] !== 'general') {
            agents.push({
                type: 'coder',
                priority: 'high',
                capabilities: analysis.languages,
                count: Math.min(analysis.languages.length, 3)
            });
        }

        if (['feature', 'bug'].includes(analysis.category)) {
            agents.push({
                type: 'tester',
                priority: 'medium',
                capabilities: ['unit-testing', 'integration-testing']
            });
        }

        if (analysis.category === 'security') {
            agents.push({
                type: 'security',
                priority: 'high',
                capabilities: ['security-audit', 'vulnerability-analysis']
            });
        }

        return agents;
    }

    determineRequiredTools(analysis) {
        const tools = ['file_read', 'file_write', 'file_search', 'directory_list'];

        if (analysis.languages.includes('javascript')) {
            tools.push('npm_install', 'node_run', 'eslint', 'prettier');
        }
        if (analysis.languages.includes('python')) {
            tools.push('pip_install', 'python_run', 'pytest', 'black');
        }
        if (analysis.category === 'testing') {
            tools.push('test_runner', 'coverage_analyzer', 'test_generator');
        }
        if (analysis.category === 'security') {
            tools.push('security_scanner', 'vulnerability_checker');
        }

        tools.push('github_pr_create', 'github_commit', 'github_issue_update');

        return tools;
    }

    calculateConfidence(analysis) {
        let confidence = 50;

        if (analysis.languages.length > 0 && analysis.languages[0] !== 'general') {
            confidence += 20;
        }
        if (analysis.frameworks.length > 0) {
            confidence += 15;
        }
        if (analysis.category !== 'general') {
            confidence += 15;
        }

        return Math.max(0, Math.min(100, confidence));
    }

    async getTestResults() {
        return this.testResults;
    }

    async saveTestResults() {
        await fs.ensureDir('logs');
        await fs.writeJSON('logs/test-issue-analyzer-results.json', this.testResults, { spaces: 2 });
        this.logger.info('Test results saved successfully');
    }
}

// Run tests if called directly
if (require.main === module) {
    const analyzer = new TestIssueAnalyzer();
    
    const testIssues = [
        {
            id: 1001,
            number: 1001,
            title: 'Fix button text is incorrect',
            body: 'The login button shows "Signin" instead of "Sign In". Please fix this typo.',
            labels: [{ name: 'bug' }, { name: 'ui' }]
        },
        {
            id: 1002,
            number: 1002,
            title: 'Add user authentication system',
            body: 'Please implement a complete user authentication system with login, logout, and password reset functionality using JWT tokens.',
            labels: [{ name: 'feature' }, { name: 'enhancement' }]
        },
        {
            id: 1003,
            number: 1003,
            title: 'Security vulnerability in API endpoint',
            body: 'The /api/users endpoint is not properly validating input parameters, which could lead to SQL injection attacks.',
            labels: [{ name: 'security' }, { name: 'critical' }]
        }
    ];

    async function runTests() {
        console.log('🧪 Running Issue Analyzer Tests...');
        
        for (const issue of testIssues) {
            try {
                const analysis = await analyzer.analyzeIssue(issue);
                console.log(`✅ Issue #${issue.number} analyzed successfully`);
                console.log(`   - Complexity: ${analysis.complexity}`);
                console.log(`   - Category: ${analysis.category}`);
                console.log(`   - Languages: ${analysis.languages.join(', ')}`);
                console.log(`   - Agents: ${analysis.requiredAgents.length}`);
                console.log(`   - Tools: ${analysis.requiredTools.length}`);
                console.log(`   - Confidence: ${analysis.confidence}%`);
                console.log('');
            } catch (error) {
                console.error(`❌ Error analyzing issue #${issue.number}:`, error.message);
            }
        }

        await analyzer.saveTestResults();
        console.log('🎉 Issue analyzer tests completed!');
    }

    runTests();
}

module.exports = TestIssueAnalyzer;
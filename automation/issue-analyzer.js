// Advanced Issue Analysis Engine for Claude Flow Automation
const Database = require('better-sqlite3');
const winston = require('winston');
const path = require('path');
const fs = require('fs-extra');

class IssueAnalyzer {
    constructor() {
        this.db = new Database('.hive-mind/automation.db');
        this.logger = this.setupLogger();
        this.initializeAnalyzer();
    }

    setupLogger() {
        return winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/issue-analyzer.log' }),
                new winston.transports.Console()
            ]
        });
    }

    initializeAnalyzer() {
        // Initialize language and framework detection patterns
        this.languagePatterns = {
            javascript: [/\.js$/, /\.jsx$/, /\.ts$/, /\.tsx$/, /javascript/i, /node\.js/i, /react/i, /vue/i, /angular/i],
            python: [/\.py$/, /\.pyx$/, /python/i, /django/i, /flask/i, /fastapi/i, /pytorch/i, /tensorflow/i],
            java: [/\.java$/, /\.kotlin$/, /java/i, /kotlin/i, /spring/i, /maven/i, /gradle/i],
            csharp: [/\.cs$/, /\.csx$/, /c#/i, /csharp/i, /\.net/i, /dotnet/i, /asp\.net/i],
            go: [/\.go$/, /golang/i, /\bgo\b/i],
            rust: [/\.rs$/, /rust/i, /cargo/i],
            php: [/\.php$/, /php/i, /laravel/i, /symfony/i, /wordpress/i],
            ruby: [/\.rb$/, /ruby/i, /rails/i, /gem/i],
            cpp: [/\.cpp$/, /\.cc$/, /\.cxx$/, /c\+\+/i, /cpp/i],
            html: [/\.html$/, /\.htm$/, /html/i, /css/i, /bootstrap/i],
            sql: [/\.sql$/, /database/i, /mysql/i, /postgresql/i, /sqlite/i, /mongodb/i]
        };

        this.frameworkPatterns = {
            react: [/react/i, /jsx/i, /next\.js/i, /gatsby/i],
            vue: [/vue/i, /vuejs/i, /nuxt/i],
            angular: [/angular/i, /ng/i, /typescript/i],
            express: [/express/i, /node\.js/i, /nodejs/i],
            django: [/django/i, /python/i],
            spring: [/spring/i, /java/i, /boot/i],
            laravel: [/laravel/i, /php/i],
            rails: [/rails/i, /ruby/i],
            dotnet: [/\.net/i, /asp\.net/i, /core/i, /framework/i]
        };

        this.complexityIndicators = {
            high: [
                /security/i, /authentication/i, /authorization/i, /encryption/i,
                /performance/i, /optimization/i, /refactor/i, /architecture/i,
                /database.*migration/i, /api.*design/i, /scalability/i,
                /microservice/i, /deployment/i, /ci\/cd/i, /infrastructure/i
            ],
            medium: [
                /feature/i, /enhancement/i, /integration/i, /testing/i,
                /validation/i, /configuration/i, /logging/i, /monitoring/i,
                /error.*handling/i, /user.*interface/i, /responsive/i
            ],
            low: [
                /bug/i, /fix/i, /typo/i, /documentation/i, /readme/i,
                /comment/i, /format/i, /style/i, /lint/i, /warning/i,
                /dependency.*update/i, /version.*bump/i
            ]
        };

        this.logger.info('Issue analyzer initialized with patterns and indicators');
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
                estimatedDuration: 0,
                requiredAgents: [],
                requiredTools: [],
                priority: this.calculatePriority(issueData),
                confidence: 0
            };

            // Calculate estimated duration based on complexity
            analysis.estimatedDuration = this.estimateDuration(analysis);

            // Determine required agents
            analysis.requiredAgents = this.determineRequiredAgents(analysis);

            // Determine required tools
            analysis.requiredTools = this.determineRequiredTools(analysis);

            // Calculate confidence score
            analysis.confidence = this.calculateConfidence(analysis);

            // Store analysis in database
            await this.storeAnalysis(analysis);

            // Learn from historical data
            await this.updateLearningPatterns(analysis);

            this.logger.info(`Issue analysis completed with ${analysis.confidence}% confidence`);
            return analysis;

        } catch (error) {
            this.logger.error('Error analyzing issue:', error);
            throw error;
        }
    }

    assessComplexity(issueData) {
        const text = `${issueData.title} ${issueData.body}`.toLowerCase();
        const labelTexts = issueData.labels?.map(label => label.name?.toLowerCase() || '').join(' ') || '';
        const fullText = `${text} ${labelTexts}`;

        // Check for complexity indicators
        for (const [level, patterns] of Object.entries(this.complexityIndicators)) {
            for (const pattern of patterns) {
                if (pattern.test(fullText)) {
                    return level;
                }
            }
        }

        // Default complexity assessment based on text length and structure
        const textLength = fullText.length;
        const codeBlocks = (fullText.match(/```/g) || []).length / 2;
        const steps = (fullText.match(/\d+\./g) || []).length;

        if (textLength > 1000 || codeBlocks > 2 || steps > 5) {
            return 'medium';
        }

        return 'low';
    }

    detectLanguages(issueData) {
        const text = `${issueData.title} ${issueData.body}`.toLowerCase();
        const detected = [];

        for (const [language, patterns] of Object.entries(this.languagePatterns)) {
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
        const detected = [];

        for (const [framework, patterns] of Object.entries(this.frameworkPatterns)) {
            for (const pattern of patterns) {
                if (pattern.test(text)) {
                    detected.push(framework);
                    break;
                }
            }
        }

        return detected;
    }

    categorizeIssue(issueData) {
        const text = `${issueData.title} ${issueData.body}`.toLowerCase();
        const labels = issueData.labels?.map(label => label.name?.toLowerCase() || '') || [];

        // Check labels first
        for (const label of labels) {
            if (label.includes('bug') || label.includes('fix')) return 'bug';
            if (label.includes('feature') || label.includes('enhancement')) return 'feature';
            if (label.includes('documentation') || label.includes('docs')) return 'documentation';
            if (label.includes('question') || label.includes('help')) return 'question';
            if (label.includes('security')) return 'security';
            if (label.includes('performance')) return 'performance';
            if (label.includes('test')) return 'testing';
        }

        // Check title and body content
        if (/bug|error|issue|problem|broken|fail/i.test(text)) return 'bug';
        if (/feature|add|implement|create|new/i.test(text)) return 'feature';
        if (/documentation|readme|docs|guide/i.test(text)) return 'documentation';
        if (/question|help|how.*to|usage/i.test(text)) return 'question';
        if (/security|vulnerability|exploit/i.test(text)) return 'security';
        if (/performance|slow|optimization|speed/i.test(text)) return 'performance';
        if (/test|testing|spec|coverage/i.test(text)) return 'testing';
        if (/refactor|cleanup|improve|optimize/i.test(text)) return 'refactoring';

        return 'general';
    }

    calculatePriority(issueData) {
        const labels = issueData.labels?.map(label => label.name?.toLowerCase() || '') || [];
        const text = `${issueData.title} ${issueData.body}`.toLowerCase();

        // Check for priority labels
        if (labels.some(label => label.includes('critical') || label.includes('urgent'))) {
            return 'high';
        }
        if (labels.some(label => label.includes('high'))) {
            return 'high';
        }
        if (labels.some(label => label.includes('low'))) {
            return 'low';
        }

        // Check for priority indicators in text
        if (/critical|urgent|blocker|production|security/i.test(text)) {
            return 'high';
        }
        if (/nice.*to.*have|minor|cosmetic/i.test(text)) {
            return 'low';
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
            documentation: 0.5,
            question: 0.3,
            security: 2.0,
            performance: 1.8,
            testing: 1.2,
            refactoring: 2.2
        };

        duration *= categoryMultipliers[analysis.category] || 1.0;

        // Adjust for multiple languages/frameworks
        if (analysis.languages.length > 1) {
            duration *= 1.3;
        }
        if (analysis.frameworks.length > 1) {
            duration *= 1.2;
        }

        return Math.round(duration);
    }

    determineRequiredAgents(analysis) {
        const agents = [];

        // Always need a coordinator for complex issues
        if (analysis.complexity === 'high') {
            agents.push({
                type: 'coordinator',
                priority: 'high',
                capabilities: ['task-management', 'agent-coordination']
            });
        }

        // Architecture agent for complex features
        if (analysis.category === 'feature' && analysis.complexity !== 'low') {
            agents.push({
                type: 'architect',
                priority: 'high',
                capabilities: ['system-design', 'api-design', 'architecture-planning']
            });
        }

        // Code agents based on languages
        if (analysis.languages.length > 0 && analysis.languages[0] !== 'general') {
            agents.push({
                type: 'coder',
                priority: 'high',
                capabilities: analysis.languages,
                count: Math.min(analysis.languages.length, 3)
            });
        }

        // Testing agent for features and bugs
        if (['feature', 'bug', 'testing'].includes(analysis.category)) {
            agents.push({
                type: 'tester',
                priority: 'medium',
                capabilities: ['unit-testing', 'integration-testing', 'test-automation']
            });
        }

        // Security agent for security-related issues
        if (analysis.category === 'security' || analysis.priority === 'high') {
            agents.push({
                type: 'security',
                priority: 'high',
                capabilities: ['security-audit', 'vulnerability-analysis']
            });
        }

        // Documentation agent for docs or complex features
        if (analysis.category === 'documentation' || analysis.complexity === 'high') {
            agents.push({
                type: 'documenter',
                priority: 'low',
                capabilities: ['documentation-writing', 'readme-generation']
            });
        }

        return agents;
    }

    determineRequiredTools(analysis) {
        const tools = [];

        // File operations - always needed
        tools.push('file_read', 'file_write', 'file_search', 'directory_list');

        // Language-specific tools
        if (analysis.languages.includes('javascript')) {
            tools.push('npm_install', 'node_run', 'eslint', 'prettier');
        }
        if (analysis.languages.includes('python')) {
            tools.push('pip_install', 'python_run', 'pytest', 'black');
        }
        if (analysis.languages.includes('java')) {
            tools.push('maven_build', 'gradle_build', 'junit_test');
        }

        // Category-specific tools
        if (analysis.category === 'testing') {
            tools.push('test_runner', 'coverage_analyzer', 'test_generator');
        }
        if (analysis.category === 'security') {
            tools.push('security_scanner', 'vulnerability_checker', 'audit_tool');
        }
        if (analysis.category === 'performance') {
            tools.push('performance_profiler', 'benchmark_runner', 'memory_analyzer');
        }

        // GitHub integration tools
        tools.push('github_pr_create', 'github_commit', 'github_issue_update');

        return tools;
    }

    calculateConfidence(analysis) {
        let confidence = 50; // Base confidence

        // Increase confidence for clear indicators
        if (analysis.languages.length > 0 && analysis.languages[0] !== 'general') {
            confidence += 20;
        }
        if (analysis.frameworks.length > 0) {
            confidence += 15;
        }
        if (analysis.category !== 'general') {
            confidence += 15;
        }

        // Decrease confidence for complex or unclear issues
        if (analysis.complexity === 'high') {
            confidence -= 10;
        }
        if (analysis.languages.length > 3) {
            confidence -= 5;
        }

        return Math.max(0, Math.min(100, confidence));
    }

    async storeAnalysis(analysis) {
        const insertAnalysis = this.db.prepare(`
            INSERT OR REPLACE INTO issues (
                github_id, number, title, body, labels, complexity_score, 
                estimated_duration, language_detected, framework_detected, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const complexityScore = { low: 1, medium: 2, high: 3 }[analysis.complexity];

        insertAnalysis.run(
            analysis.issue_id,
            analysis.number,
            analysis.title,
            analysis.body,
            JSON.stringify(analysis.labels),
            complexityScore,
            analysis.estimatedDuration,
            JSON.stringify(analysis.languages),
            JSON.stringify(analysis.frameworks),
            new Date().toISOString()
        );
    }

    async updateLearningPatterns(analysis) {
        // Store pattern for future learning
        const insertPattern = this.db.prepare(`
            INSERT OR REPLACE INTO learning_patterns (
                pattern_type, pattern_data, confidence_score, 
                issue_characteristics, solution_approach
            ) VALUES (?, ?, ?, ?, ?)
        `);

        insertPattern.run(
            'issue_analysis',
            JSON.stringify({
                complexity: analysis.complexity,
                category: analysis.category,
                languages: analysis.languages,
                frameworks: analysis.frameworks
            }),
            analysis.confidence / 100,
            JSON.stringify({
                title: analysis.title,
                labels: analysis.labels,
                priority: analysis.priority
            }),
            JSON.stringify({
                agents: analysis.requiredAgents,
                tools: analysis.requiredTools,
                duration: analysis.estimatedDuration
            })
        );
    }

    async getHistoricalSuggestions(issueData) {
        // Query similar issues from the past
        const similarIssues = this.db.prepare(`
            SELECT * FROM learning_patterns 
            WHERE pattern_type = 'issue_analysis' 
            AND confidence_score > 0.7
            ORDER BY usage_count DESC, confidence_score DESC
            LIMIT 5
        `).all();

        return similarIssues.map(pattern => ({
            pattern: JSON.parse(pattern.pattern_data),
            solution: JSON.parse(pattern.solution_approach),
            confidence: pattern.confidence_score
        }));
    }
}

module.exports = IssueAnalyzer;
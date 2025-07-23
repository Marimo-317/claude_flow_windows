#!/usr/bin/env node
/**
 * Claude Flow v3.0 - Main Entry Point
 * No-Fallback AI Automation System
 * Replaces all fallback-prone previous systems
 */

const HiveMindOrchestrator = require('./hive-mind-orchestrator');
const winston = require('winston');
const fs = require('fs-extra');
const path = require('path');

// Setup global logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [CLAUDE-FLOW-V3] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ 
            filename: 'logs/claude-flow-main.log',
            maxsize: 10485760,
            maxFiles: 5
        })
    ]
});

class ClaudeFlowMain {
    constructor() {
        this.validateEnvironment();
        this.orchestrator = new HiveMindOrchestrator({
            githubToken: process.env.GITHUB_TOKEN,
            repository: process.env.REPOSITORY,
            autoCreatePR: process.env.AUTO_CREATE_PR !== 'false',
            learningEnabled: process.env.LEARNING_ENABLED !== 'false',
            maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS) || 3
        });
        
        logger.info('🚀 Claude Flow v3.0 Main System Initialized');
        logger.info('✨ True AI Intelligence - No Fallback Mode');
    }
    
    validateEnvironment() {
        const requiredEnvVars = [
            'GITHUB_TOKEN',
            'REPOSITORY'
        ];
        
        const missing = requiredEnvVars.filter(env => !process.env[env]);
        
        if (missing.length > 0) {
            logger.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
            throw new Error(`Missing environment variables: ${missing.join(', ')}`);
        }
        
        // Validate repository format
        if (!process.env.REPOSITORY.includes('/')) {
            throw new Error('REPOSITORY must be in format "owner/repo"');
        }
        
        logger.info('✅ Environment validation passed');
    }
    
    /**
     * Main automation entry point
     * Handles GitHub Actions integration
     */
    async runAutomation() {
        const args = this.parseArguments();
        
        logger.info('🎯 Starting Claude Flow v3.0 Automation');
        logger.info('📋 Arguments:', args);
        
        try {
            // Validate issue number
            if (!args.issueNumber) {
                throw new Error('Issue number is required');
            }
            
            const issueData = {
                number: args.issueNumber,
                title: args.issueTitle || `Issue #${args.issueNumber}`,
                body: args.issueBody || '',
                labels: args.labels ? args.labels.split(',') : []
            };
            
            // Execute Hive-Mind resolution
            const result = await this.orchestrator.resolveIssue(issueData, {
                source: 'github-actions',
                automated: true,
                priority: args.priority || 'normal'
            });
            
            logger.info('🎉 Automation completed successfully!');
            logger.info('📊 Results:', {
                orchestrationId: result.orchestrationId,
                issueNumber: result.issueNumber,
                duration: `${Math.round(result.duration / 1000)}s`,
                intelligence: result.intelligence,
                agents: result.agents,
                qualityScore: `${Math.round(result.qualityScore * 100)}%`
            });
            
            // Output results for GitHub Actions
            this.outputResults(result);
            
            return result;
            
        } catch (error) {
            logger.error('❌ Automation failed:', error.message);
            logger.error('Stack trace:', error.stack);
            
            // Output error for GitHub Actions
            this.outputError(error);
            
            throw error;
        }
    }
    
    parseArguments() {
        const args = {
            issueNumber: null,
            issueTitle: null,
            issueBody: null,
            labels: null,
            priority: 'normal'
        };
        
        // Parse command line arguments
        for (let i = 2; i < process.argv.length; i++) {
            const arg = process.argv[i];
            
            if (arg.startsWith('--issue-number=')) {
                args.issueNumber = parseInt(arg.split('=')[1]);
            } else if (arg.startsWith('--issue-title=')) {
                args.issueTitle = arg.split('=')[1];
            } else if (arg.startsWith('--issue-body=')) {
                args.issueBody = arg.split('=')[1];
            } else if (arg.startsWith('--labels=')) {
                args.labels = arg.split('=')[1];
            } else if (arg.startsWith('--priority=')) {
                args.priority = arg.split('=')[1];
            }
        }
        
        // Try environment variables as fallback
        args.issueNumber = args.issueNumber || parseInt(process.env.ISSUE_NUMBER);
        args.issueTitle = args.issueTitle || process.env.ISSUE_TITLE;
        args.issueBody = args.issueBody || process.env.ISSUE_BODY;
        args.labels = args.labels || process.env.ISSUE_LABELS;
        
        return args;
    }
    
    /**
     * Output results for GitHub Actions consumption
     */
    outputResults(result) {
        const output = {
            success: true,
            orchestration_id: result.orchestrationId,
            issue_number: result.issueNumber,
            duration_seconds: Math.round(result.duration / 1000),
            intelligence_level: result.intelligence,
            agents_used: result.agents,
            quality_score: Math.round(result.qualityScore * 100),
            pr_created: !!result.githubResult?.pullRequest,
            pr_number: result.githubResult?.pullRequest?.number,
            pr_url: result.githubResult?.pullRequest?.url
        };
        
        // Write to GitHub Actions output
        if (process.env.GITHUB_OUTPUT) {
            const outputLines = Object.entries(output)
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
            
            fs.appendFileSync(process.env.GITHUB_OUTPUT, outputLines + '\n');
        }
        
        // Write detailed results
        const resultsPath = 'claude-flow-results.json';
        fs.writeJsonSync(resultsPath, {
            ...output,
            timestamp: new Date().toISOString(),
            system: 'claude-flow-v3-hive-mind',
            details: result.details
        }, { spaces: 2 });
        
        logger.info(`📄 Results written to ${resultsPath}`);
    }
    
    /**
     * Output error information for GitHub Actions
     */
    outputError(error) {
        const errorOutput = {
            success: false,
            error_message: error.message,
            error_type: error.constructor.name,
            timestamp: new Date().toISOString(),
            system: 'claude-flow-v3-hive-mind'
        };
        
        // Write to GitHub Actions output
        if (process.env.GITHUB_OUTPUT) {
            const outputLines = Object.entries(errorOutput)
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
            
            fs.appendFileSync(process.env.GITHUB_OUTPUT, outputLines + '\n');
        }
        
        // Write error details
        const errorPath = 'claude-flow-error.json';
        fs.writeJsonSync(errorPath, {
            ...errorOutput,
            stack: error.stack
        }, { spaces: 2 });
        
        logger.info(`❌ Error details written to ${errorPath}`);
    }
    
    /**
     * Get system status
     */
    async getStatus() {
        return {
            system: 'claude-flow-v3-main',
            version: '3.0.0',
            status: 'operational',
            mode: 'true-ai-no-fallback',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            orchestrator: this.orchestrator.getStatus(),
            environment: {
                repository: process.env.REPOSITORY,
                autoCreatePR: process.env.AUTO_CREATE_PR !== 'false',
                learningEnabled: process.env.LEARNING_ENABLED !== 'false'
            }
        };
    }
}

// CLI execution
if (require.main === module) {
    // Ensure logs directory exists
    fs.ensureDirSync('logs');
    
    const main = new ClaudeFlowMain();
    
    // Handle command
    const command = process.argv[2];
    
    if (command === 'status') {
        main.getStatus()
            .then(status => {
                console.log(JSON.stringify(status, null, 2));
                process.exit(0);
            })
            .catch(error => {
                logger.error('Status check failed:', error.message);
                process.exit(1);
            });
    } else {
        // Default: run automation
        main.runAutomation()
            .then(result => {
                logger.info('✅ Claude Flow v3.0 completed successfully');
                process.exit(0);
            })
            .catch(error => {
                logger.error('💥 Claude Flow v3.0 failed:', error.message);
                process.exit(1);
            });
    }
}

module.exports = ClaudeFlowMain;

// Export orchestrator for direct access
module.exports.HiveMindOrchestrator = HiveMindOrchestrator;
// Test Webhook Server for Claude Flow Automation Testing
const express = require('express');
const winston = require('winston');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config({ path: '.env.test' });

// Initialize logger
const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.simple()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/test-webhook.log' })
    ]
});

class TestWebhookServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.testData = {
            webhookEvents: [],
            automationSessions: [],
            testResults: []
        };
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // CORS for testing
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '2.0.0-alpha.1-test',
                environment: 'test'
            });
        });

        // Test webhook endpoint
        this.app.post('/webhook', async (req, res) => {
            try {
                const result = await this.processTestWebhook(req);
                res.status(200).json(result);
            } catch (error) {
                logger.error('Webhook processing error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // Manual test trigger endpoint
        this.app.post('/test-trigger', async (req, res) => {
            try {
                const { issueTitle, issueBody, issueNumber } = req.body;
                
                const testIssue = {
                    id: Date.now(),
                    number: issueNumber || Math.floor(Math.random() * 1000),
                    title: issueTitle || 'Test Issue',
                    body: issueBody || 'This is a test issue for automation testing',
                    labels: [],
                    state: 'open',
                    created_at: new Date().toISOString()
                };
                
                const result = await this.triggerTestAutomation(testIssue);
                res.json(result);
            } catch (error) {
                logger.error('Manual trigger error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Test data endpoint
        this.app.get('/test-data', (req, res) => {
            res.json(this.testData);
        });

        // Status endpoint
        this.app.get('/status', (req, res) => {
            res.json({
                status: 'running',
                mode: 'test',
                webhookEvents: this.testData.webhookEvents.length,
                automationSessions: this.testData.automationSessions.length,
                testResults: this.testData.testResults.length,
                uptime: process.uptime()
            });
        });

        // Test scenario endpoints
        this.app.post('/test-scenarios/simple-bug', async (req, res) => {
            const testIssue = {
                id: Date.now(),
                number: 1001,
                title: 'Fix button text is incorrect',
                body: 'The login button shows "Signin" instead of "Sign In". Please fix this typo.',
                labels: [{ name: 'bug' }, { name: 'ui' }],
                state: 'open',
                created_at: new Date().toISOString()
            };
            
            const result = await this.triggerTestAutomation(testIssue);
            res.json(result);
        });

        this.app.post('/test-scenarios/feature-request', async (req, res) => {
            const testIssue = {
                id: Date.now(),
                number: 1002,
                title: 'Add user authentication system',
                body: 'Please implement a complete user authentication system with login, logout, and password reset functionality using JWT tokens.',
                labels: [{ name: 'feature' }, { name: 'enhancement' }],
                state: 'open',
                created_at: new Date().toISOString()
            };
            
            const result = await this.triggerTestAutomation(testIssue);
            res.json(result);
        });

        this.app.post('/test-scenarios/security-issue', async (req, res) => {
            const testIssue = {
                id: Date.now(),
                number: 1003,
                title: 'Security vulnerability in API endpoint',
                body: 'The /api/users endpoint is not properly validating input parameters, which could lead to SQL injection attacks.',
                labels: [{ name: 'security' }, { name: 'critical' }],
                state: 'open',
                created_at: new Date().toISOString()
            };
            
            const result = await this.triggerTestAutomation(testIssue);
            res.json(result);
        });
    }

    async processTestWebhook(req) {
        const eventType = req.headers['x-github-event'] || 'test';
        const eventId = req.headers['x-github-delivery'] || `test-${Date.now()}`;
        const payload = req.body;

        logger.info(`Processing test webhook: ${eventType} (${eventId})`);

        // Log webhook event
        const webhookEvent = {
            id: eventId,
            type: eventType,
            payload: payload,
            timestamp: new Date().toISOString(),
            processed: false
        };

        this.testData.webhookEvents.push(webhookEvent);

        // Simulate webhook processing
        if (eventType === 'issues' && payload.action === 'opened') {
            return await this.triggerTestAutomation(payload.issue);
        }

        return { 
            message: 'Test webhook received',
            eventType: eventType,
            eventId: eventId,
            processed: true
        };
    }

    async triggerTestAutomation(issue) {
        logger.info(`🚀 Triggering test automation for issue #${issue.number}`);

        const sessionId = `test-session-${Date.now()}`;
        const session = {
            sessionId: sessionId,
            issueId: issue.id,
            issueNumber: issue.number,
            issueTitle: issue.title,
            status: 'started',
            startTime: new Date().toISOString(),
            phases: []
        };

        this.testData.automationSessions.push(session);

        // Simulate automation phases
        const phases = [
            { name: 'Issue Analysis', duration: 2000 },
            { name: 'Agent Spawning', duration: 3000 },
            { name: 'Tool Selection', duration: 1500 },
            { name: 'Solution Development', duration: 5000 },
            { name: 'Testing', duration: 2000 },
            { name: 'PR Creation', duration: 1000 }
        ];

        // Execute phases asynchronously
        this.executeTestPhases(sessionId, phases);

        return {
            message: 'Test automation triggered successfully',
            sessionId: sessionId,
            issue: {
                number: issue.number,
                title: issue.title
            },
            phases: phases.map(p => p.name),
            estimatedDuration: phases.reduce((sum, p) => sum + p.duration, 0)
        };
    }

    async executeTestPhases(sessionId, phases) {
        const session = this.testData.automationSessions.find(s => s.sessionId === sessionId);
        
        for (const phase of phases) {
            logger.info(`Executing phase: ${phase.name} (${phase.duration}ms)`);
            
            // Simulate phase execution
            await new Promise(resolve => setTimeout(resolve, phase.duration));
            
            session.phases.push({
                name: phase.name,
                status: 'completed',
                duration: phase.duration,
                timestamp: new Date().toISOString()
            });
        }

        // Complete session
        session.status = 'completed';
        session.endTime = new Date().toISOString();
        session.totalDuration = phases.reduce((sum, p) => sum + p.duration, 0);

        logger.info(`✅ Test automation completed for session: ${sessionId}`);

        // Record test result
        this.testData.testResults.push({
            sessionId: sessionId,
            success: true,
            duration: session.totalDuration,
            phasesCompleted: phases.length,
            timestamp: new Date().toISOString()
        });
    }

    async saveTestData() {
        try {
            await fs.ensureDir('logs');
            await fs.writeJSON('logs/test-data.json', this.testData, { spaces: 2 });
            logger.info('Test data saved successfully');
        } catch (error) {
            logger.error('Error saving test data:', error);
        }
    }

    start() {
        this.server = this.app.listen(this.port, () => {
            logger.info(`🚀 Test Webhook Server running on port ${this.port}`);
            logger.info(`📊 Health check: http://localhost:${this.port}/health`);
            logger.info(`🔗 Webhook endpoint: http://localhost:${this.port}/webhook`);
            logger.info(`🧪 Test scenarios: http://localhost:${this.port}/test-scenarios/*`);
        });
    }

    stop() {
        if (this.server) {
            this.server.close(() => {
                logger.info('Test Webhook Server stopped');
            });
        }
    }
}

// Start server if called directly
if (require.main === module) {
    const server = new TestWebhookServer();
    server.start();
    
    // Save test data on exit
    process.on('SIGINT', async () => {
        await server.saveTestData();
        server.stop();
        process.exit(0);
    });
}

module.exports = TestWebhookServer;
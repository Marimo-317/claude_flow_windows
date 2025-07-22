// GitHub Webhook Server for Claude Flow Automation
const express = require('express');
const crypto = require('crypto');
const { spawn } = require('child_process');
const Database = require('better-sqlite3');
const winston = require('winston');
const rateLimit = require('rate-limiter-flexible');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

// Initialize logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/webhook.log' }),
        new winston.transports.Console()
    ]
});

// Initialize database with fallback
let db;
let dbMode = 'sqlite';
try {
    db = new Database('.hive-mind/automation.db');
} catch (error) {
    console.log('SQLite not available, using JSON fallback for webhook database');
    db = null;
    dbMode = 'json';
}

// Rate limiter
const rateLimiter = new rateLimit.RateLimiterMemory({
    keyGenerator: (req) => req.ip,
    points: 100,
    duration: 900 // 15 minutes
});

class WebhookServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
        this.setupMiddleware();
        this.setupRoutes();
        this.setupDatabase();
    }

    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Rate limiting middleware
        this.app.use(async (req, res, next) => {
            try {
                await rateLimiter.consume(req.ip);
                next();
            } catch (rejRes) {
                res.status(429).json({ error: 'Rate limit exceeded' });
            }
        });
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '2.0.0-alpha.1'
            });
        });

        // Main webhook endpoint
        this.app.post('/webhook', async (req, res) => {
            try {
                const result = await this.processWebhook(req);
                res.status(200).json(result);
            } catch (error) {
                logger.error('Webhook processing error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // Manual trigger endpoint for testing
        this.app.post('/manual-trigger', async (req, res) => {
            try {
                const { issueUrl, issueNumber, issueTitle, issueBody, repository } = req.body;
                
                const result = await this.triggerAutomation({
                    html_url: issueUrl,
                    number: issueNumber,
                    title: issueTitle,
                    body: issueBody
                }, repository);
                
                res.json(result);
            } catch (error) {
                logger.error('Manual trigger error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Status endpoint
        this.app.get('/status', (req, res) => {
            const stats = this.getSystemStats();
            res.json(stats);
        });
    }

    setupDatabase() {
        try {
            if (db) {
                // SQLite mode
                db.exec(`
                    CREATE TABLE IF NOT EXISTS webhook_events (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        event_id TEXT,
                        event_type TEXT,
                        payload TEXT,
                        signature TEXT,
                        processed BOOLEAN DEFAULT FALSE,
                        processing_duration INTEGER,
                        status TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                `);
                logger.info('SQLite database initialized for webhook server');
            } else {
                // JSON fallback mode
                logger.info('Using JSON fallback for webhook database');
            }
        } catch (error) {
            logger.error('Database setup error:', error);
        }
    }

    async processWebhook(req) {
        const signature = req.headers['x-hub-signature-256'];
        const payload = JSON.stringify(req.body);
        const eventType = req.headers['x-github-event'];
        const eventId = req.headers['x-github-delivery'];

        // Verify signature
        if (!this.verifySignature(payload, signature)) {
            throw new Error('Invalid signature');
        }

        // Log webhook event
        const insertWebhookEvent = db.prepare(`
            INSERT INTO webhook_events (event_id, event_type, payload, signature, status)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        insertWebhookEvent.run(eventId, eventType, payload, signature, 'received');

        // Process different event types
        const startTime = Date.now();
        let result = { message: 'Event received but not processed' };

        try {
            switch (eventType) {
                case 'issues':
                    result = await this.handleIssueEvent(req.body);
                    break;
                case 'issue_comment':
                    result = await this.handleIssueCommentEvent(req.body);
                    break;
                case 'pull_request':
                    result = await this.handlePullRequestEvent(req.body);
                    break;
                default:
                    result = { message: `Event type ${eventType} not supported` };
            }

            // Update webhook event status
            const processingTime = Date.now() - startTime;
            db.prepare(`
                UPDATE webhook_events 
                SET processed = TRUE, processing_duration = ?, status = ?
                WHERE event_id = ?
            `).run(processingTime, 'processed', eventId);

            logger.info(`Webhook processed: ${eventType} (${processingTime}ms)`);
            return result;

        } catch (error) {
            // Update webhook event with error
            const processingTime = Date.now() - startTime;
            db.prepare(`
                UPDATE webhook_events 
                SET processed = TRUE, processing_duration = ?, status = ?
                WHERE event_id = ?
            `).run(processingTime, `error: ${error.message}`, eventId);

            throw error;
        }
    }

    verifySignature(payload, signature) {
        if (!this.webhookSecret) {
            logger.warn('No webhook secret configured, skipping signature verification');
            return true;
        }

        const hash = `sha256=${crypto
            .createHmac('sha256', this.webhookSecret)
            .update(payload)
            .digest('hex')}`;
        
        return signature === hash;
    }

    async handleIssueEvent(data) {
        if (data.action !== 'opened' && data.action !== 'edited') {
            return { message: `Issue action ${data.action} not handled` };
        }

        const issue = data.issue;
        const repository = data.repository;

        logger.info(`Processing issue: ${issue.number} - ${issue.title}`);

        // Store issue in database
        const insertIssue = db.prepare(`
            INSERT OR REPLACE INTO issues (
                github_id, number, title, body, labels, state, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        insertIssue.run(
            issue.id,
            issue.number,
            issue.title,
            issue.body,
            JSON.stringify(issue.labels),
            issue.state,
            new Date(issue.created_at).toISOString()
        );

        // Only trigger automation if @claude-flow-automation is mentioned
        if (issue.body && issue.body.includes('@claude-flow-automation')) {
            logger.info(`🚀 Hive-Mind automation triggered by @claude-flow-automation in issue: ${issue.number}`);
            return await this.triggerHiveMindAutomation(issue, repository.full_name);
        }

        return { message: 'Issue stored, waiting for @claude-flow-automation trigger' };
    }

    async handleIssueCommentEvent(data) {
        if (data.action !== 'created') {
            return { message: `Comment action ${data.action} not handled` };
        }

        const comment = data.comment;
        const issue = data.issue;

        // Check if comment contains automation trigger
        if (comment.body.includes('@claude-flow-automation') || comment.body.includes('@claude-flow-bot') || comment.body.includes('/autosolve')) {
            logger.info(`🚀 Hive-Mind automation triggered by @claude-flow-automation on issue: ${issue.number}`);
            return await this.triggerHiveMindAutomation(issue, data.repository.full_name);
        }

        return { message: 'Comment does not contain automation trigger' };
    }

    async handlePullRequestEvent(data) {
        // Handle PR events if needed for automation feedback
        logger.info(`PR event: ${data.action} - ${data.pull_request.number}`);
        return { message: `PR event ${data.action} logged` };
    }

    async triggerHiveMindAutomation(issue, repository) {
        try {
            logger.info(`🐝 Triggering Hive-Mind automation for issue #${issue.number}`);

            // Create automation session
            const sessionId = crypto.randomUUID();
            const insertSession = db.prepare(`
                INSERT INTO automation_sessions (
                    session_id, issue_id, status, start_time
                ) VALUES (?, ?, ?, ?)
            `);

            const issueRecord = db.prepare('SELECT id FROM issues WHERE github_id = ?').get(issue.id);
            insertSession.run(sessionId, issueRecord?.id, 'hive-mind-started', new Date().toISOString());

            // Spawn Claude Flow Hive-Mind process with comprehensive automation
            const hiveMindArgs = [
                'hive-mind', 'spawn',
                `"Resolve GitHub Issue #${issue.number}: ${issue.title}\n\nDescription: ${issue.body || 'No description provided'}\n\nRepository: ${repository}\nSession: ${sessionId}\n\nRequirements:\n1. Analyze the issue thoroughly\n2. Spawn appropriate specialized agents\n3. Implement complete solution with tests\n4. Create production-ready code\n5. Generate comprehensive pull request\n6. Ensure quality and security standards"`,
                '--auto-mode',
                '--session-id', sessionId,
                '--github-integration',
                '--issue-number', issue.number.toString(),
                '--repository', repository,
                '--max-agents', '10',
                '--max-time', '1800',
                '--learning-mode',
                '--quality-checks',
                '--auto-pr',
                '--auto-test',
                '--comprehensive'
            ];

            const claudeFlowProcess = spawn('./claude-flow.sh', hiveMindArgs, {
                cwd: process.cwd(),
                stdio: 'pipe',
                env: {
                    ...process.env,
                    CLAUDE_FLOW_AUTO_MODE: 'true',
                    CLAUDE_FLOW_SESSION_ID: sessionId,
                    CLAUDE_FLOW_HIVE_MIND: 'true',
                    GITHUB_ISSUE_NUMBER: issue.number.toString(),
                    GITHUB_REPOSITORY: repository
                }
            });

            // Enhanced logging for Hive-Mind
            claudeFlowProcess.stdout.on('data', (data) => {
                const text = data.toString();
                logger.info(`🐝 Hive-Mind: ${text}`);
            });

            claudeFlowProcess.stderr.on('data', (data) => {
                const text = data.toString();
                logger.error(`🐝 Hive-Mind Error: ${text}`);
            });

            // Handle process completion with enhanced status tracking
            claudeFlowProcess.on('close', (code) => {
                const status = code === 0 ? 'hive-mind-completed' : 'hive-mind-failed';
                db.prepare(`
                    UPDATE automation_sessions 
                    SET status = ?, end_time = ?
                    WHERE session_id = ?
                `).run(status, new Date().toISOString(), sessionId);

                logger.info(`🐝 Hive-Mind session ${sessionId} ${status} with code ${code}`);
            });

            return {
                message: 'Hive-Mind automation triggered successfully',
                mode: 'hive-mind',
                sessionId: sessionId,
                issue: {
                    number: issue.number,
                    title: issue.title
                },
                repository: repository,
                agents: 'auto-spawning',
                expectedFeatures: [
                    'Intelligent agent coordination',
                    'Multi-agent problem solving',
                    'Advanced learning integration',
                    'Quality assurance automation',
                    'Comprehensive testing',
                    'Production-ready solutions'
                ]
            };

        } catch (error) {
            logger.error('🐝 Hive-Mind automation trigger error:', error);
            throw error;
        }
    }

    getSystemStats() {
        try {
            const stats = {
                webhook_events: db.prepare('SELECT COUNT(*) as count FROM webhook_events').get().count,
                processed_events: db.prepare('SELECT COUNT(*) as count FROM webhook_events WHERE processed = TRUE').get().count,
                active_sessions: db.prepare('SELECT COUNT(*) as count FROM automation_sessions WHERE status = ?').get('started').count,
                completed_sessions: db.prepare('SELECT COUNT(*) as count FROM automation_sessions WHERE status = ?').get('completed').count,
                failed_sessions: db.prepare('SELECT COUNT(*) as count FROM automation_sessions WHERE status = ?').get('failed').count,
                uptime: process.uptime(),
                memory_usage: process.memoryUsage(),
                timestamp: new Date().toISOString()
            };

            return stats;
        } catch (error) {
            logger.error('Error getting system stats:', error);
            return { error: 'Unable to retrieve stats' };
        }
    }

    start() {
        this.app.listen(this.port, () => {
            logger.info(`🚀 Claude Flow Webhook Server running on port ${this.port}`);
            logger.info(`📊 Health check: http://localhost:${this.port}/health`);
            logger.info(`📈 Status: http://localhost:${this.port}/status`);
        });
    }
}

// Start server if called directly
if (require.main === module) {
    const server = new WebhookServer();
    server.start();
}

module.exports = WebhookServer;
// Real-time Monitoring Dashboard for Claude Flow Automation
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Database = require('better-sqlite3');
const winston = require('winston');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
require('dotenv').config();

class MonitoringDashboard {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.db = new Database('.hive-mind/automation.db');
        this.logger = this.setupLogger();
        this.port = process.env.DASHBOARD_PORT || 3001;
        
        this.metrics = {
            system: {},
            automation: {},
            agents: {},
            tools: {},
            learning: {}
        };
        
        this.connectedClients = new Map();
        this.updateInterval = 5000; // 5 seconds
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
        this.startMetricsCollection();
    }

    setupLogger() {
        return winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/monitoring-dashboard.log' }),
                new winston.transports.Console()
            ]
        });
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../dashboard')));
        
        // CORS middleware
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });
    }

    setupRoutes() {
        // Main dashboard page
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../dashboard/index.html'));
        });

        // API endpoints
        this.app.get('/api/status', async (req, res) => {
            try {
                const status = await this.getSystemStatus();
                res.json(status);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/metrics', async (req, res) => {
            try {
                const metrics = await this.getAllMetrics();
                res.json(metrics);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/sessions', async (req, res) => {
            try {
                const sessions = await this.getAutomationSessions();
                res.json(sessions);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/agents', async (req, res) => {
            try {
                const agents = await this.getAgentStats();
                res.json(agents);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/tools', async (req, res) => {
            try {
                const tools = await this.getToolStats();
                res.json(tools);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/learning', async (req, res) => {
            try {
                const learning = await this.getLearningStats();
                res.json(learning);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/optimization', async (req, res) => {
            try {
                const optimization = await this.getOptimizationStats();
                res.json(optimization);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Control endpoints
        this.app.post('/api/control/force-optimization', async (req, res) => {
            try {
                // This would trigger the auto-optimizer
                res.json({ message: 'Optimization triggered' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/control/reset-learning', async (req, res) => {
            try {
                // This would reset the learning system
                res.json({ message: 'Learning system reset' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage()
            });
        });
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            const clientId = socket.id;
            this.connectedClients.set(clientId, {
                socket: socket,
                connectedAt: Date.now(),
                subscriptions: new Set()
            });

            this.logger.info(`Client connected: ${clientId}`);

            // Handle client subscriptions
            socket.on('subscribe', (subscriptions) => {
                const client = this.connectedClients.get(clientId);
                if (client) {
                    client.subscriptions = new Set(subscriptions);
                    this.logger.info(`Client ${clientId} subscribed to: ${subscriptions.join(', ')}`);
                }
            });

            // Handle client disconnection
            socket.on('disconnect', () => {
                this.connectedClients.delete(clientId);
                this.logger.info(`Client disconnected: ${clientId}`);
            });

            // Send initial data
            socket.emit('initial-data', {
                system: this.metrics.system,
                automation: this.metrics.automation,
                agents: this.metrics.agents,
                tools: this.metrics.tools,
                learning: this.metrics.learning
            });
        });
    }

    startMetricsCollection() {
        // Start collecting metrics at regular intervals
        setInterval(async () => {
            try {
                await this.collectAndBroadcastMetrics();
            } catch (error) {
                this.logger.error('Error collecting metrics:', error);
            }
        }, this.updateInterval);

        this.logger.info('Metrics collection started');
    }

    async collectAndBroadcastMetrics() {
        // Collect all metrics
        const newMetrics = {
            system: await this.collectSystemMetrics(),
            automation: await this.collectAutomationMetrics(),
            agents: await this.collectAgentMetrics(),
            tools: await this.collectToolMetrics(),
            learning: await this.collectLearningMetrics()
        };

        // Update stored metrics
        this.metrics = newMetrics;

        // Broadcast to connected clients
        this.broadcastMetrics(newMetrics);
    }

    async collectSystemMetrics() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        
        return {
            cpu_usage: await this.getCPUUsage(),
            memory: {
                total: totalMemory,
                used: usedMemory,
                free: freeMemory,
                percentage: (usedMemory / totalMemory) * 100
            },
            uptime: process.uptime(),
            load_average: os.loadavg(),
            platform: os.platform(),
            arch: os.arch(),
            hostname: os.hostname(),
            timestamp: Date.now()
        };
    }

    async getCPUUsage() {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        
        cpus.forEach(cpu => {
            for (let type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });
        
        return ((1 - (totalIdle / totalTick)) * 100).toFixed(2);
    }

    async collectAutomationMetrics() {
        const sessions = this.db.prepare(`
            SELECT 
                COUNT(*) as total_sessions,
                SUM(CASE WHEN status = 'started' THEN 1 ELSE 0 END) as active_sessions,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sessions,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_sessions
            FROM automation_sessions
        `).get();

        const recentSessions = this.db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
                AVG(CASE WHEN end_time IS NOT NULL THEN 
                    (julianday(end_time) - julianday(start_time)) * 24 * 60 * 60 * 1000 
                    ELSE NULL END) as avg_duration
            FROM automation_sessions
            WHERE start_time > datetime('now', '-24 hours')
        `).get();

        return {
            total_sessions: sessions.total_sessions,
            active_sessions: sessions.active_sessions,
            completed_sessions: sessions.completed_sessions,
            failed_sessions: sessions.failed_sessions,
            success_rate: recentSessions.total > 0 ? (recentSessions.successful / recentSessions.total * 100).toFixed(2) : 0,
            avg_duration: recentSessions.avg_duration ? Math.round(recentSessions.avg_duration) : 0,
            timestamp: Date.now()
        };
    }

    async collectAgentMetrics() {
        const agentStats = this.db.prepare(`
            SELECT 
                agent_type,
                COUNT(*) as total_spawned,
                AVG(completion_time) as avg_completion_time,
                AVG(success_rate) as avg_success_rate,
                AVG(quality_score) as avg_quality_score
            FROM agent_performance
            GROUP BY agent_type
        `).all();

        const recentActivity = this.db.prepare(`
            SELECT 
                agent_type,
                COUNT(*) as recent_activity
            FROM agent_performance
            WHERE created_at > datetime('now', '-1 hour')
            GROUP BY agent_type
        `).all();

        // Create activity map
        const activityMap = {};
        recentActivity.forEach(activity => {
            activityMap[activity.agent_type] = activity.recent_activity;
        });

        return {
            agent_types: agentStats.map(stat => ({
                type: stat.agent_type,
                total_spawned: stat.total_spawned,
                avg_completion_time: stat.avg_completion_time,
                avg_success_rate: stat.avg_success_rate,
                avg_quality_score: stat.avg_quality_score,
                recent_activity: activityMap[stat.agent_type] || 0
            })),
            timestamp: Date.now()
        };
    }

    async collectToolMetrics() {
        const toolStats = this.db.prepare(`
            SELECT 
                tool_category,
                COUNT(*) as total_tools,
                AVG(success_rate) as avg_success_rate,
                AVG(performance_score) as avg_performance_score,
                SUM(usage_count) as total_usage
            FROM tool_usage
            GROUP BY tool_category
        `).all();

        const topTools = this.db.prepare(`
            SELECT 
                tool_name,
                tool_category,
                success_rate,
                performance_score,
                usage_count
            FROM tool_usage
            ORDER BY usage_count DESC
            LIMIT 10
        `).all();

        return {
            categories: toolStats,
            top_tools: topTools,
            timestamp: Date.now()
        };
    }

    async collectLearningMetrics() {
        const patterns = this.db.prepare(`
            SELECT 
                pattern_type,
                COUNT(*) as count,
                AVG(confidence_score) as avg_confidence,
                AVG(success_rate) as avg_success_rate
            FROM learning_patterns
            GROUP BY pattern_type
        `).all();

        const trainingData = this.db.prepare(`
            SELECT 
                COUNT(*) as total_training_data,
                AVG(accuracy_score) as avg_accuracy
            FROM neural_training_data
        `).get();

        const recentLearning = this.db.prepare(`
            SELECT COUNT(*) as recent_patterns
            FROM learning_patterns
            WHERE created_at > datetime('now', '-24 hours')
        `).get();

        return {
            patterns: patterns,
            training_data: trainingData,
            recent_learning: recentLearning.recent_patterns,
            timestamp: Date.now()
        };
    }

    broadcastMetrics(metrics) {
        this.connectedClients.forEach((client, clientId) => {
            try {
                // Send only subscribed metrics
                const filteredMetrics = {};
                
                if (client.subscriptions.has('system') || client.subscriptions.size === 0) {
                    filteredMetrics.system = metrics.system;
                }
                if (client.subscriptions.has('automation') || client.subscriptions.size === 0) {
                    filteredMetrics.automation = metrics.automation;
                }
                if (client.subscriptions.has('agents') || client.subscriptions.size === 0) {
                    filteredMetrics.agents = metrics.agents;
                }
                if (client.subscriptions.has('tools') || client.subscriptions.size === 0) {
                    filteredMetrics.tools = metrics.tools;
                }
                if (client.subscriptions.has('learning') || client.subscriptions.size === 0) {
                    filteredMetrics.learning = metrics.learning;
                }

                client.socket.emit('metrics-update', filteredMetrics);
            } catch (error) {
                this.logger.error(`Error broadcasting to client ${clientId}:`, error);
                this.connectedClients.delete(clientId);
            }
        });
    }

    async getSystemStatus() {
        return {
            status: 'running',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            connected_clients: this.connectedClients.size,
            last_update: Date.now()
        };
    }

    async getAllMetrics() {
        return this.metrics;
    }

    async getAutomationSessions() {
        return this.db.prepare(`
            SELECT 
                session_id,
                status,
                start_time,
                end_time,
                metrics
            FROM automation_sessions
            ORDER BY start_time DESC
            LIMIT 50
        `).all();
    }

    async getAgentStats() {
        return this.db.prepare(`
            SELECT 
                agent_id,
                agent_type,
                task_type,
                completion_time,
                success_rate,
                quality_score,
                created_at
            FROM agent_performance
            ORDER BY created_at DESC
            LIMIT 100
        `).all();
    }

    async getToolStats() {
        return this.db.prepare(`
            SELECT 
                tool_name,
                tool_category,
                success_rate,
                avg_execution_time,
                error_rate,
                usage_count,
                performance_score,
                last_used
            FROM tool_usage
            ORDER BY usage_count DESC
        `).all();
    }

    async getLearningStats() {
        return this.db.prepare(`
            SELECT 
                pattern_type,
                pattern_data,
                success_rate,
                confidence_score,
                usage_count,
                created_at
            FROM learning_patterns
            ORDER BY created_at DESC
            LIMIT 100
        `).all();
    }

    async getOptimizationStats() {
        return this.db.prepare(`
            SELECT 
                metric_type,
                metric_value,
                optimization_target,
                timestamp
            FROM optimization_metrics
            WHERE optimization_target = 'auto_optimization'
            ORDER BY timestamp DESC
            LIMIT 100
        `).all();
    }

    start() {
        this.server.listen(this.port, () => {
            this.logger.info(`🚀 Monitoring Dashboard running on port ${this.port}`);
            this.logger.info(`📊 Dashboard URL: http://localhost:${this.port}`);
            this.logger.info(`🔧 API URL: http://localhost:${this.port}/api`);
        });
    }

    stop() {
        this.server.close(() => {
            this.logger.info('Monitoring Dashboard stopped');
        });
    }
}

// Start dashboard if called directly
if (require.main === module) {
    const dashboard = new MonitoringDashboard();
    dashboard.start();
}

module.exports = MonitoringDashboard;
// Intelligent Agent Spawning System for Claude Flow Automation
const { spawn } = require('child_process');
const Database = require('better-sqlite3');
const winston = require('winston');
const crypto = require('crypto');
const path = require('path');

class AgentSpawner {
    constructor() {
        this.db = new Database('.hive-mind/automation.db');
        this.logger = this.setupLogger();
        this.activeAgents = new Map();
        this.agentConfig = this.loadAgentConfig();
        this.maxConcurrentAgents = parseInt(process.env.MAX_CONCURRENT_AGENTS) || 5;
    }

    setupLogger() {
        return winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/agent-spawner.log' }),
                new winston.transports.Console()
            ]
        });
    }

    loadAgentConfig() {
        return {
            coordinator: {
                command: './claude-flow.sh',
                args: ['hive-mind', 'spawn'],
                capabilities: ['task-management', 'agent-coordination', 'workflow-orchestration'],
                maxInstances: 1,
                priority: 'high',
                timeout: 3600000 // 1 hour
            },
            architect: {
                command: './claude-flow.sh',
                args: ['sparc', 'run', 'architect'],
                capabilities: ['system-design', 'api-design', 'architecture-planning', 'database-design'],
                maxInstances: 2,
                priority: 'high',
                timeout: 1800000 // 30 minutes
            },
            coder: {
                command: './claude-flow.sh',
                args: ['sparc', 'run', 'code'],
                capabilities: ['implementation', 'debugging', 'code-review', 'refactoring'],
                maxInstances: 3,
                priority: 'high',
                timeout: 2700000 // 45 minutes
            },
            tester: {
                command: './claude-flow.sh',
                args: ['sparc', 'run', 'tdd'],
                capabilities: ['unit-testing', 'integration-testing', 'test-automation', 'coverage-analysis'],
                maxInstances: 2,
                priority: 'medium',
                timeout: 1200000 // 20 minutes
            },
            security: {
                command: './claude-flow.sh',
                args: ['sparc', 'run', 'security-review'],
                capabilities: ['security-audit', 'vulnerability-analysis', 'code-security', 'penetration-testing'],
                maxInstances: 1,
                priority: 'high',
                timeout: 1800000 // 30 minutes
            },
            documenter: {
                command: './claude-flow.sh',
                args: ['sparc', 'run', 'docs-writer'],
                capabilities: ['documentation-writing', 'readme-generation', 'api-documentation', 'user-guides'],
                maxInstances: 1,
                priority: 'low',
                timeout: 900000 // 15 minutes
            },
            debugger: {
                command: './claude-flow.sh',
                args: ['sparc', 'run', 'debug'],
                capabilities: ['bug-analysis', 'error-tracing', 'performance-debugging', 'log-analysis'],
                maxInstances: 2,
                priority: 'high',
                timeout: 1800000 // 30 minutes
            },
            optimizer: {
                command: './claude-flow.sh',
                args: ['sparc', 'run', 'refinement-optimization-mode'],
                capabilities: ['performance-optimization', 'code-optimization', 'resource-optimization'],
                maxInstances: 1,
                priority: 'medium',
                timeout: 2700000 // 45 minutes
            }
        };
    }

    async spawnAgentsForIssue(issueAnalysis, sessionId) {
        try {
            this.logger.info(`Spawning agents for issue #${issueAnalysis.number} (Session: ${sessionId})`);

            const spawnResults = [];
            const requiredAgents = issueAnalysis.requiredAgents || [];

            // Check if we have capacity
            if (this.activeAgents.size >= this.maxConcurrentAgents) {
                this.logger.warn('Maximum concurrent agents reached, queueing agents');
                return await this.queueAgents(requiredAgents, sessionId);
            }

            // Spawn agents based on analysis
            for (const agentSpec of requiredAgents) {
                const result = await this.spawnAgent(agentSpec, issueAnalysis, sessionId);
                spawnResults.push(result);
            }

            // Update session with spawned agents
            await this.updateSessionAgents(sessionId, spawnResults);

            this.logger.info(`Successfully spawned ${spawnResults.length} agents for session ${sessionId}`);
            return spawnResults;

        } catch (error) {
            this.logger.error('Error spawning agents:', error);
            throw error;
        }
    }

    async spawnAgent(agentSpec, issueAnalysis, sessionId) {
        try {
            const agentId = crypto.randomUUID();
            const agentType = agentSpec.type;
            const config = this.agentConfig[agentType];

            if (!config) {
                throw new Error(`Unknown agent type: ${agentType}`);
            }

            // Check if we can spawn this agent type
            const activeOfType = Array.from(this.activeAgents.values())
                .filter(agent => agent.type === agentType).length;

            if (activeOfType >= config.maxInstances) {
                this.logger.warn(`Maximum instances of ${agentType} reached, queuing`);
                return await this.queueAgent(agentSpec, issueAnalysis, sessionId);
            }

            // Prepare agent command and arguments
            const taskDescription = this.generateTaskDescription(agentSpec, issueAnalysis);
            const agentArgs = [
                ...config.args,
                `"${taskDescription}"`
            ];

            // Add context-specific arguments
            if (agentSpec.capabilities) {
                agentArgs.push('--capabilities', agentSpec.capabilities.join(','));
            }

            agentArgs.push('--session-id', sessionId);
            agentArgs.push('--agent-id', agentId);
            agentArgs.push('--issue-number', issueAnalysis.number.toString());
            agentArgs.push('--auto-mode');

            this.logger.info(`Spawning ${agentType} agent: ${agentId}`);

            // Spawn the agent process
            const agentProcess = spawn(config.command, agentArgs, {
                cwd: process.cwd(),
                stdio: 'pipe',
                env: {
                    ...process.env,
                    CLAUDE_FLOW_AGENT_ID: agentId,
                    CLAUDE_FLOW_SESSION_ID: sessionId,
                    CLAUDE_FLOW_ISSUE_NUMBER: issueAnalysis.number.toString(),
                    CLAUDE_FLOW_AUTO_MODE: 'true'
                }
            });

            // Create agent record
            const agentRecord = {
                id: agentId,
                type: agentType,
                sessionId: sessionId,
                issueNumber: issueAnalysis.number,
                process: agentProcess,
                status: 'running',
                startTime: Date.now(),
                capabilities: agentSpec.capabilities || [],
                priority: agentSpec.priority || 'medium',
                timeout: config.timeout,
                logs: []
            };

            // Store in active agents
            this.activeAgents.set(agentId, agentRecord);

            // Set up process handlers
            this.setupAgentHandlers(agentRecord);

            // Store in database
            await this.storeAgentRecord(agentRecord, issueAnalysis);

            // Set timeout
            setTimeout(() => {
                this.terminateAgent(agentId, 'timeout');
            }, config.timeout);

            return {
                agentId: agentId,
                type: agentType,
                status: 'spawned',
                capabilities: agentSpec.capabilities,
                priority: agentSpec.priority,
                startTime: agentRecord.startTime
            };

        } catch (error) {
            this.logger.error(`Error spawning ${agentSpec.type} agent:`, error);
            throw error;
        }
    }

    generateTaskDescription(agentSpec, issueAnalysis) {
        const baseDescription = `Resolve issue #${issueAnalysis.number}: ${issueAnalysis.title}`;
        
        switch (agentSpec.type) {
            case 'coordinator':
                return `${baseDescription}. Coordinate overall resolution strategy and manage other agents.`;
            
            case 'architect':
                return `${baseDescription}. Design system architecture and technical approach for ${issueAnalysis.category} in ${issueAnalysis.languages.join(', ')}.`;
            
            case 'coder':
                return `${baseDescription}. Implement solution using ${issueAnalysis.languages.join(', ')} with ${issueAnalysis.frameworks.join(', ')} framework(s).`;
            
            case 'tester':
                return `${baseDescription}. Create and run comprehensive tests for the solution.`;
            
            case 'security':
                return `${baseDescription}. Perform security analysis and ensure secure implementation.`;
            
            case 'documenter':
                return `${baseDescription}. Create comprehensive documentation for the solution.`;
            
            case 'debugger':
                return `${baseDescription}. Debug and fix issues in the implementation.`;
            
            case 'optimizer':
                return `${baseDescription}. Optimize performance and code quality of the solution.`;
            
            default:
                return baseDescription;
        }
    }

    setupAgentHandlers(agentRecord) {
        const { id, process: agentProcess } = agentRecord;

        // Handle stdout
        agentProcess.stdout.on('data', (data) => {
            const output = data.toString();
            agentRecord.logs.push({
                type: 'stdout',
                content: output,
                timestamp: Date.now()
            });
            this.logger.info(`Agent ${id} stdout: ${output}`);
        });

        // Handle stderr
        agentProcess.stderr.on('data', (data) => {
            const output = data.toString();
            agentRecord.logs.push({
                type: 'stderr',
                content: output,
                timestamp: Date.now()
            });
            this.logger.error(`Agent ${id} stderr: ${output}`);
        });

        // Handle process exit
        agentProcess.on('close', (code) => {
            this.handleAgentExit(id, code);
        });

        // Handle process error
        agentProcess.on('error', (error) => {
            this.logger.error(`Agent ${id} process error:`, error);
            this.handleAgentError(id, error);
        });
    }

    async handleAgentExit(agentId, exitCode) {
        const agent = this.activeAgents.get(agentId);
        if (!agent) return;

        const duration = Date.now() - agent.startTime;
        const success = exitCode === 0;

        this.logger.info(`Agent ${agentId} exited with code ${exitCode} after ${duration}ms`);

        // Update agent record
        agent.status = success ? 'completed' : 'failed';
        agent.endTime = Date.now();
        agent.duration = duration;
        agent.exitCode = exitCode;

        // Update database
        await this.updateAgentPerformance(agent, success);

        // Remove from active agents
        this.activeAgents.delete(agentId);

        // Check if we can spawn queued agents
        await this.processQueuedAgents();
    }

    async handleAgentError(agentId, error) {
        const agent = this.activeAgents.get(agentId);
        if (!agent) return;

        agent.status = 'error';
        agent.error = error.message;
        agent.endTime = Date.now();

        this.logger.error(`Agent ${agentId} encountered error:`, error);

        // Update database
        await this.updateAgentPerformance(agent, false);

        // Remove from active agents
        this.activeAgents.delete(agentId);
    }

    async terminateAgent(agentId, reason = 'manual') {
        const agent = this.activeAgents.get(agentId);
        if (!agent) return;

        this.logger.info(`Terminating agent ${agentId} (reason: ${reason})`);

        // Kill the process
        if (agent.process && !agent.process.killed) {
            agent.process.kill('SIGTERM');
        }

        // Update status
        agent.status = 'terminated';
        agent.terminationReason = reason;
        agent.endTime = Date.now();

        // Update database
        await this.updateAgentPerformance(agent, false);

        // Remove from active agents
        this.activeAgents.delete(agentId);
    }

    async storeAgentRecord(agentRecord, issueAnalysis) {
        const insertAgent = this.db.prepare(`
            INSERT INTO agent_performance (
                agent_id, agent_type, task_type, issue_id, tools_used, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        const issueRecord = this.db.prepare('SELECT id FROM issues WHERE number = ?').get(issueAnalysis.number);
        
        insertAgent.run(
            agentRecord.id,
            agentRecord.type,
            issueAnalysis.category,
            issueRecord?.id,
            JSON.stringify(agentRecord.capabilities),
            new Date().toISOString()
        );
    }

    async updateAgentPerformance(agent, success) {
        const duration = agent.endTime - agent.startTime;
        const qualityScore = this.calculateQualityScore(agent, success);

        const updatePerformance = this.db.prepare(`
            UPDATE agent_performance 
            SET completion_time = ?, success_rate = ?, quality_score = ?
            WHERE agent_id = ?
        `);

        updatePerformance.run(
            duration,
            success ? 1.0 : 0.0,
            qualityScore,
            agent.id
        );
    }

    calculateQualityScore(agent, success) {
        let score = success ? 0.8 : 0.2;

        // Adjust based on duration vs expected
        const expectedDuration = this.agentConfig[agent.type]?.timeout || 1800000;
        const actualDuration = agent.endTime - agent.startTime;
        const durationRatio = actualDuration / expectedDuration;

        if (durationRatio < 0.5) score += 0.1; // Finished early
        if (durationRatio > 0.9) score -= 0.1; // Took too long

        // Adjust based on error logs
        const errorLogs = agent.logs.filter(log => log.type === 'stderr').length;
        score -= Math.min(errorLogs * 0.05, 0.2);

        return Math.max(0, Math.min(1, score));
    }

    async updateSessionAgents(sessionId, agents) {
        const updateSession = this.db.prepare(`
            UPDATE automation_sessions 
            SET agents_spawned = ?
            WHERE session_id = ?
        `);

        updateSession.run(JSON.stringify(agents), sessionId);
    }

    async queueAgent(agentSpec, issueAnalysis, sessionId) {
        // TODO: Implement agent queueing system
        this.logger.info(`Queueing agent ${agentSpec.type} for session ${sessionId}`);
        return {
            agentId: crypto.randomUUID(),
            type: agentSpec.type,
            status: 'queued',
            capabilities: agentSpec.capabilities,
            priority: agentSpec.priority
        };
    }

    async processQueuedAgents() {
        // TODO: Implement queued agent processing
        this.logger.info('Processing queued agents...');
    }

    getActiveAgents() {
        return Array.from(this.activeAgents.values()).map(agent => ({
            id: agent.id,
            type: agent.type,
            status: agent.status,
            startTime: agent.startTime,
            duration: Date.now() - agent.startTime
        }));
    }

    async getAgentStats() {
        const stats = this.db.prepare(`
            SELECT 
                agent_type,
                COUNT(*) as total_spawned,
                AVG(completion_time) as avg_completion_time,
                AVG(success_rate) as avg_success_rate,
                AVG(quality_score) as avg_quality_score
            FROM agent_performance
            GROUP BY agent_type
        `).all();

        return {
            active_agents: this.activeAgents.size,
            agent_types: stats
        };
    }
}

module.exports = AgentSpawner;
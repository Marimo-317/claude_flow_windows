// Test Agent Spawner for Claude Flow Automation Testing
require('dotenv').config({ path: '.env.test' });
const winston = require('winston');
const fs = require('fs-extra');
const crypto = require('crypto');

class TestAgentSpawner {
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
                new winston.transports.File({ filename: 'logs/test-agent-spawner.log' })
            ]
        });
        
        this.activeAgents = new Map();
        this.agentConfig = this.loadAgentConfig();
        this.maxConcurrentAgents = 3; // Reduced for testing
        this.testResults = [];
    }

    loadAgentConfig() {
        return {
            coordinator: {
                capabilities: ['task-management', 'agent-coordination', 'workflow-orchestration'],
                maxInstances: 1,
                priority: 'high',
                timeout: 300000 // 5 minutes for testing
            },
            architect: {
                capabilities: ['system-design', 'api-design', 'architecture-planning'],
                maxInstances: 2,
                priority: 'high',
                timeout: 180000 // 3 minutes for testing
            },
            coder: {
                capabilities: ['implementation', 'debugging', 'code-review'],
                maxInstances: 3,
                priority: 'high',
                timeout: 240000 // 4 minutes for testing
            },
            tester: {
                capabilities: ['unit-testing', 'integration-testing', 'test-automation'],
                maxInstances: 2,
                priority: 'medium',
                timeout: 120000 // 2 minutes for testing
            },
            security: {
                capabilities: ['security-audit', 'vulnerability-analysis', 'code-security'],
                maxInstances: 1,
                priority: 'high',
                timeout: 180000 // 3 minutes for testing
            }
        };
    }

    async spawnAgentsForIssue(issueAnalysis, sessionId) {
        try {
            this.logger.info(`Spawning agents for issue #${issueAnalysis.number} (Session: ${sessionId})`);

            const spawnResults = [];
            const requiredAgents = issueAnalysis.requiredAgents || [];

            // Check capacity
            if (this.activeAgents.size >= this.maxConcurrentAgents) {
                this.logger.warn('Maximum concurrent agents reached');
                return { error: 'Max agents reached', spawnResults: [] };
            }

            // Spawn agents
            for (const agentSpec of requiredAgents) {
                const result = await this.spawnAgent(agentSpec, issueAnalysis, sessionId);
                spawnResults.push(result);
            }

            // Record test result
            this.testResults.push({
                timestamp: new Date().toISOString(),
                sessionId: sessionId,
                issueNumber: issueAnalysis.number,
                requiredAgents: requiredAgents.length,
                spawnedAgents: spawnResults.length,
                success: spawnResults.every(r => r.status === 'spawned'),
                activeAgents: this.activeAgents.size,
                spawnResults: spawnResults
            });

            this.logger.info(`Successfully spawned ${spawnResults.length} agents for session ${sessionId}`);
            return { spawnResults, activeAgents: this.activeAgents.size };

        } catch (error) {
            this.logger.error('Error spawning agents:', error);
            this.testResults.push({
                timestamp: new Date().toISOString(),
                sessionId: sessionId,
                error: error.message,
                success: false
            });
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
                this.logger.warn(`Maximum instances of ${agentType} reached`);
                return {
                    agentId: agentId,
                    type: agentType,
                    status: 'queued',
                    reason: 'max_instances_reached'
                };
            }

            // Create agent record
            const agentRecord = {
                id: agentId,
                type: agentType,
                sessionId: sessionId,
                issueNumber: issueAnalysis.number,
                status: 'spawned',
                startTime: Date.now(),
                capabilities: agentSpec.capabilities || config.capabilities,
                priority: agentSpec.priority || 'medium',
                timeout: config.timeout
            };

            // Store in active agents
            this.activeAgents.set(agentId, agentRecord);

            // Simulate agent lifecycle
            this.simulateAgentLifecycle(agentRecord);

            this.logger.info(`Agent spawned: ${agentType} (${agentId})`);

            return {
                agentId: agentId,
                type: agentType,
                status: 'spawned',
                capabilities: agentSpec.capabilities || config.capabilities,
                priority: agentSpec.priority || 'medium',
                startTime: agentRecord.startTime
            };

        } catch (error) {
            this.logger.error(`Error spawning ${agentSpec.type} agent:`, error);
            throw error;
        }
    }

    async simulateAgentLifecycle(agentRecord) {
        // Simulate agent work
        const workDuration = Math.random() * 10000 + 5000; // 5-15 seconds
        
        setTimeout(() => {
            agentRecord.status = 'working';
            agentRecord.workStartTime = Date.now();
        }, 1000);

        setTimeout(() => {
            agentRecord.status = 'completed';
            agentRecord.endTime = Date.now();
            agentRecord.duration = agentRecord.endTime - agentRecord.startTime;
            
            // Remove from active agents
            this.activeAgents.delete(agentRecord.id);
            
            this.logger.info(`Agent completed: ${agentRecord.type} (${agentRecord.id}) - ${agentRecord.duration}ms`);
        }, workDuration);
    }

    getActiveAgents() {
        return Array.from(this.activeAgents.values()).map(agent => ({
            id: agent.id,
            type: agent.type,
            status: agent.status,
            startTime: agent.startTime,
            duration: Date.now() - agent.startTime,
            capabilities: agent.capabilities
        }));
    }

    async getTestResults() {
        return this.testResults;
    }

    async saveTestResults() {
        await fs.ensureDir('logs');
        await fs.writeJSON('logs/test-agent-spawner-results.json', this.testResults, { spaces: 2 });
        this.logger.info('Agent spawner test results saved successfully');
    }
}

// Run tests if called directly
if (require.main === module) {
    const spawner = new TestAgentSpawner();
    
    const testIssueAnalyses = [
        {
            number: 1001,
            title: 'Fix button text is incorrect',
            complexity: 'low',
            category: 'bug',
            requiredAgents: [
                { type: 'coder', priority: 'high', capabilities: ['implementation', 'debugging'] }
            ]
        },
        {
            number: 1002,
            title: 'Add user authentication system',
            complexity: 'medium',
            category: 'feature',
            requiredAgents: [
                { type: 'architect', priority: 'high', capabilities: ['system-design', 'api-design'] },
                { type: 'coder', priority: 'high', capabilities: ['implementation'] },
                { type: 'tester', priority: 'medium', capabilities: ['unit-testing'] }
            ]
        },
        {
            number: 1003,
            title: 'Security vulnerability in API endpoint',
            complexity: 'high',
            category: 'security',
            requiredAgents: [
                { type: 'coordinator', priority: 'high', capabilities: ['task-management'] },
                { type: 'security', priority: 'high', capabilities: ['security-audit'] },
                { type: 'coder', priority: 'high', capabilities: ['implementation'] }
            ]
        }
    ];

    async function runTests() {
        console.log('🧪 Running Agent Spawner Tests...');
        
        for (let i = 0; i < testIssueAnalyses.length; i++) {
            const analysis = testIssueAnalyses[i];
            const sessionId = `test-session-agent-${Date.now()}-${i}`;
            
            try {
                console.log(`\n🚀 Testing issue #${analysis.number}:`);
                
                const result = await spawner.spawnAgentsForIssue(analysis, sessionId);
                
                console.log(`✅ Spawned ${result.spawnResults.length} agents`);
                console.log(`   - Active agents: ${result.activeAgents}`);
                
                result.spawnResults.forEach(agent => {
                    console.log(`   - ${agent.type} (${agent.status}): ${agent.capabilities.join(', ')}`);
                });
                
                // Wait a bit between tests
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.error(`❌ Error testing issue #${analysis.number}:`, error.message);
            }
        }

        // Wait for agents to complete
        console.log('\n⏳ Waiting for agents to complete...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        console.log('\n📊 Final agent status:');
        const activeAgents = spawner.getActiveAgents();
        console.log(`Active agents: ${activeAgents.length}`);
        
        await spawner.saveTestResults();
        console.log('\n🎉 Agent spawner tests completed!');
    }

    runTests();
}

module.exports = TestAgentSpawner;
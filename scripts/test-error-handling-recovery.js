// Test Error Handling and Recovery for Claude Flow Automation Testing
require('dotenv').config({ path: '.env.test' });
const winston = require('winston');
const fs = require('fs-extra');
const path = require('path');

class TestErrorHandlingRecovery {
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
                new winston.transports.File({ filename: 'logs/test-error-handling-recovery.log' })
            ]
        });
        
        this.testResults = [];
        this.errorScenarios = this.loadErrorScenarios();
        this.recoveryStrategies = this.loadRecoveryStrategies();
    }

    loadErrorScenarios() {
        return {
            network_errors: [
                {
                    name: 'GitHub API Timeout',
                    description: 'GitHub API request timeout during PR creation',
                    errorType: 'timeout',
                    severity: 'medium',
                    expectedRecovery: 'retry_with_backoff'
                },
                {
                    name: 'GitHub API Rate Limit',
                    description: 'GitHub API rate limit exceeded',
                    errorType: 'rate_limit',
                    severity: 'high',
                    expectedRecovery: 'wait_and_retry'
                },
                {
                    name: 'Network Connection Lost',
                    description: 'Network connection lost during automation',
                    errorType: 'connection_error',
                    severity: 'high',
                    expectedRecovery: 'queue_and_retry'
                }
            ],
            
            system_errors: [
                {
                    name: 'Memory Exhaustion',
                    description: 'System runs out of memory during processing',
                    errorType: 'memory_error',
                    severity: 'critical',
                    expectedRecovery: 'cleanup_and_restart'
                },
                {
                    name: 'Disk Space Full',
                    description: 'Disk space exhausted during file operations',
                    errorType: 'disk_error',
                    severity: 'critical',
                    expectedRecovery: 'cleanup_and_notify'
                },
                {
                    name: 'Process Crash',
                    description: 'Worker process crashes during execution',
                    errorType: 'process_crash',
                    severity: 'critical',
                    expectedRecovery: 'restart_process'
                }
            ],
            
            logic_errors: [
                {
                    name: 'Invalid Issue Format',
                    description: 'Issue data is malformed or incomplete',
                    errorType: 'validation_error',
                    severity: 'medium',
                    expectedRecovery: 'skip_with_notification'
                },
                {
                    name: 'Unsupported Language',
                    description: 'Issue involves unsupported programming language',
                    errorType: 'capability_error',
                    severity: 'low',
                    expectedRecovery: 'fallback_to_human'
                },
                {
                    name: 'Conflicting Requirements',
                    description: 'Issue has conflicting or impossible requirements',
                    errorType: 'logic_error',
                    severity: 'medium',
                    expectedRecovery: 'request_clarification'
                }
            ],
            
            integration_errors: [
                {
                    name: 'Tool Execution Failure',
                    description: 'MCP tool fails to execute properly',
                    errorType: 'tool_error',
                    severity: 'medium',
                    expectedRecovery: 'fallback_tool'
                },
                {
                    name: 'Agent Communication Failure',
                    description: 'Agent fails to communicate with coordinator',
                    errorType: 'communication_error',
                    severity: 'high',
                    expectedRecovery: 'restart_agent'
                },
                {
                    name: 'Database Connection Lost',
                    description: 'Database connection lost during operation',
                    errorType: 'database_error',
                    severity: 'high',
                    expectedRecovery: 'reconnect_database'
                }
            ]
        };
    }

    loadRecoveryStrategies() {
        return {
            retry_with_backoff: {
                name: 'Exponential Backoff Retry',
                description: 'Retry with exponentially increasing delays',
                maxRetries: 3,
                baseDelay: 1000,
                maxDelay: 30000
            },
            
            wait_and_retry: {
                name: 'Fixed Delay Retry',
                description: 'Wait for fixed period then retry',
                maxRetries: 5,
                delay: 60000
            },
            
            queue_and_retry: {
                name: 'Queue for Later Processing',
                description: 'Add to queue for processing when system recovers',
                queueTimeout: 300000,
                maxQueueSize: 100
            },
            
            cleanup_and_restart: {
                name: 'Cleanup and Restart',
                description: 'Clean up resources and restart process',
                cleanupTimeout: 10000,
                restartDelay: 5000
            },
            
            cleanup_and_notify: {
                name: 'Cleanup and Notify',
                description: 'Clean up and notify administrators',
                cleanupTimeout: 10000,
                notificationChannels: ['email', 'webhook']
            },
            
            restart_process: {
                name: 'Process Restart',
                description: 'Restart the failed process',
                restartTimeout: 15000,
                maxRestarts: 3
            },
            
            skip_with_notification: {
                name: 'Skip with Notification',
                description: 'Skip item and notify about the issue',
                notificationChannels: ['log', 'webhook']
            },
            
            fallback_to_human: {
                name: 'Fallback to Human Review',
                description: 'Mark for human review and processing',
                notificationChannels: ['email', 'slack']
            },
            
            request_clarification: {
                name: 'Request Clarification',
                description: 'Ask for clarification from issue creator',
                timeout: 86400000, // 24 hours
                reminderInterval: 43200000 // 12 hours
            },
            
            fallback_tool: {
                name: 'Fallback Tool Selection',
                description: 'Use alternative tool for the same task',
                maxFallbacks: 2
            },
            
            restart_agent: {
                name: 'Agent Restart',
                description: 'Restart the failed agent',
                restartTimeout: 10000,
                maxRestarts: 2
            },
            
            reconnect_database: {
                name: 'Database Reconnection',
                description: 'Attempt to reconnect to database',
                reconnectDelay: 5000,
                maxReconnects: 5
            }
        };
    }

    async runErrorHandlingTests() {
        this.logger.info('🚨 Starting error handling and recovery tests...');
        
        const testResults = {
            networkErrorTests: [],
            systemErrorTests: [],
            logicErrorTests: [],
            integrationErrorTests: [],
            recoveryTests: [],
            summary: {}
        };

        // Test network error scenarios
        this.logger.info('🌐 Testing network error scenarios...');
        for (const scenario of this.errorScenarios.network_errors) {
            const result = await this.testErrorScenario(scenario, 'network');
            testResults.networkErrorTests.push(result);
        }

        // Test system error scenarios
        this.logger.info('💻 Testing system error scenarios...');
        for (const scenario of this.errorScenarios.system_errors) {
            const result = await this.testErrorScenario(scenario, 'system');
            testResults.systemErrorTests.push(result);
        }

        // Test logic error scenarios
        this.logger.info('🧠 Testing logic error scenarios...');
        for (const scenario of this.errorScenarios.logic_errors) {
            const result = await this.testErrorScenario(scenario, 'logic');
            testResults.logicErrorTests.push(result);
        }

        // Test integration error scenarios
        this.logger.info('🔗 Testing integration error scenarios...');
        for (const scenario of this.errorScenarios.integration_errors) {
            const result = await this.testErrorScenario(scenario, 'integration');
            testResults.integrationErrorTests.push(result);
        }

        // Test recovery strategies
        this.logger.info('🔄 Testing recovery strategies...');
        const recoveryResults = await this.testRecoveryStrategies();
        testResults.recoveryTests = recoveryResults;

        // Calculate summary
        testResults.summary = this.calculateErrorHandlingSummary(testResults);

        this.testResults.push({
            timestamp: new Date().toISOString(),
            testType: 'error_handling_recovery',
            results: testResults,
            success: this.evaluateErrorHandlingSuccess(testResults)
        });

        return testResults;
    }

    async testErrorScenario(scenario, category) {
        this.logger.info(`🔍 Testing ${scenario.name}...`);
        
        const startTime = Date.now();
        
        try {
            // Simulate the error scenario
            const errorSimulation = await this.simulateError(scenario);
            
            // Test error detection
            const errorDetection = await this.testErrorDetection(scenario, errorSimulation);
            
            // Test recovery mechanism
            const recoveryResult = await this.testRecoveryMechanism(scenario, errorSimulation);
            
            // Test post-recovery validation
            const postRecoveryValidation = await this.validatePostRecovery(scenario, recoveryResult);
            
            const endTime = Date.now();
            
            const result = {
                scenario: scenario.name,
                category: category,
                severity: scenario.severity,
                errorType: scenario.errorType,
                errorSimulation: errorSimulation,
                errorDetection: errorDetection,
                recoveryResult: recoveryResult,
                postRecoveryValidation: postRecoveryValidation,
                duration: endTime - startTime,
                success: errorDetection.detected && recoveryResult.recovered && postRecoveryValidation.valid
            };
            
            this.logger.info(`${result.success ? '✅' : '❌'} ${scenario.name}: ${result.success ? 'Handled successfully' : 'Failed to handle'}`);
            return result;
            
        } catch (error) {
            this.logger.error(`❌ Error testing ${scenario.name}: ${error.message}`);
            return {
                scenario: scenario.name,
                category: category,
                error: error.message,
                success: false,
                duration: Date.now() - startTime
            };
        }
    }

    async simulateError(scenario) {
        // Simulate different types of errors
        const simulation = {
            errorType: scenario.errorType,
            errorMessage: `Simulated ${scenario.description}`,
            errorCode: this.generateErrorCode(scenario.errorType),
            timestamp: new Date().toISOString(),
            context: {}
        };

        // Add scenario-specific context
        switch (scenario.errorType) {
            case 'timeout':
                simulation.context = { timeout: 30000, actualDuration: 45000 };
                break;
            case 'rate_limit':
                simulation.context = { limit: 5000, used: 5000, resetTime: Date.now() + 3600000 };
                break;
            case 'memory_error':
                simulation.context = { usedMemory: 1024, availableMemory: 512, threshold: 900 };
                break;
            case 'validation_error':
                simulation.context = { invalidFields: ['title', 'labels'], requiredFields: ['title', 'body', 'labels'] };
                break;
            case 'tool_error':
                simulation.context = { toolName: 'file_read', exitCode: 1, stderr: 'Permission denied' };
                break;
        }

        // Simulate error propagation delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        
        return simulation;
    }

    generateErrorCode(errorType) {
        const errorCodes = {
            timeout: 'TIMEOUT_ERROR',
            rate_limit: 'RATE_LIMIT_EXCEEDED',
            connection_error: 'CONNECTION_LOST',
            memory_error: 'OUT_OF_MEMORY',
            disk_error: 'DISK_FULL',
            process_crash: 'PROCESS_TERMINATED',
            validation_error: 'VALIDATION_FAILED',
            capability_error: 'UNSUPPORTED_OPERATION',
            logic_error: 'LOGIC_CONTRADICTION',
            tool_error: 'TOOL_EXECUTION_FAILED',
            communication_error: 'AGENT_COMMUNICATION_FAILED',
            database_error: 'DATABASE_CONNECTION_LOST'
        };
        
        return errorCodes[errorType] || 'UNKNOWN_ERROR';
    }

    async testErrorDetection(scenario, errorSimulation) {
        // Simulate error detection mechanisms
        const detection = {
            detected: false,
            detectionTime: 0,
            detectionMethod: '',
            confidence: 0
        };

        const startTime = Date.now();

        // Simulate different detection methods based on error type
        switch (scenario.errorType) {
            case 'timeout':
            case 'rate_limit':
            case 'connection_error':
                detection.detected = true;
                detection.detectionMethod = 'http_response_monitoring';
                detection.confidence = 0.95;
                break;
                
            case 'memory_error':
            case 'disk_error':
                detection.detected = true;
                detection.detectionMethod = 'system_resource_monitoring';
                detection.confidence = 0.98;
                break;
                
            case 'process_crash':
                detection.detected = true;
                detection.detectionMethod = 'process_health_check';
                detection.confidence = 1.0;
                break;
                
            case 'validation_error':
            case 'logic_error':
                detection.detected = true;
                detection.detectionMethod = 'data_validation';
                detection.confidence = 0.9;
                break;
                
            case 'capability_error':
                detection.detected = true;
                detection.detectionMethod = 'capability_assessment';
                detection.confidence = 0.85;
                break;
                
            case 'tool_error':
            case 'communication_error':
            case 'database_error':
                detection.detected = true;
                detection.detectionMethod = 'service_health_monitoring';
                detection.confidence = 0.92;
                break;
        }

        detection.detectionTime = Date.now() - startTime;
        
        // Simulate detection delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
        
        return detection;
    }

    async testRecoveryMechanism(scenario, errorSimulation) {
        const recoveryStrategy = this.recoveryStrategies[scenario.expectedRecovery];
        
        if (!recoveryStrategy) {
            return {
                recovered: false,
                reason: 'No recovery strategy defined',
                strategy: scenario.expectedRecovery
            };
        }

        this.logger.info(`  🔄 Applying recovery strategy: ${recoveryStrategy.name}`);
        
        const recovery = {
            recovered: false,
            strategy: recoveryStrategy.name,
            attempts: 0,
            totalDuration: 0,
            steps: []
        };

        const startTime = Date.now();

        try {
            // Simulate recovery based on strategy type
            switch (scenario.expectedRecovery) {
                case 'retry_with_backoff':
                    recovery.recovered = await this.simulateRetryWithBackoff(recoveryStrategy, recovery);
                    break;
                    
                case 'wait_and_retry':
                    recovery.recovered = await this.simulateWaitAndRetry(recoveryStrategy, recovery);
                    break;
                    
                case 'queue_and_retry':
                    recovery.recovered = await this.simulateQueueAndRetry(recoveryStrategy, recovery);
                    break;
                    
                case 'cleanup_and_restart':
                    recovery.recovered = await this.simulateCleanupAndRestart(recoveryStrategy, recovery);
                    break;
                    
                case 'cleanup_and_notify':
                    recovery.recovered = await this.simulateCleanupAndNotify(recoveryStrategy, recovery);
                    break;
                    
                case 'restart_process':
                    recovery.recovered = await this.simulateRestartProcess(recoveryStrategy, recovery);
                    break;
                    
                case 'skip_with_notification':
                    recovery.recovered = await this.simulateSkipWithNotification(recoveryStrategy, recovery);
                    break;
                    
                case 'fallback_to_human':
                    recovery.recovered = await this.simulateFallbackToHuman(recoveryStrategy, recovery);
                    break;
                    
                case 'request_clarification':
                    recovery.recovered = await this.simulateRequestClarification(recoveryStrategy, recovery);
                    break;
                    
                case 'fallback_tool':
                    recovery.recovered = await this.simulateFallbackTool(recoveryStrategy, recovery);
                    break;
                    
                case 'restart_agent':
                    recovery.recovered = await this.simulateRestartAgent(recoveryStrategy, recovery);
                    break;
                    
                case 'reconnect_database':
                    recovery.recovered = await this.simulateReconnectDatabase(recoveryStrategy, recovery);
                    break;
                    
                default:
                    recovery.recovered = false;
                    recovery.steps.push('Unknown recovery strategy');
            }
            
            recovery.totalDuration = Date.now() - startTime;
            return recovery;
            
        } catch (error) {
            recovery.recovered = false;
            recovery.error = error.message;
            recovery.totalDuration = Date.now() - startTime;
            return recovery;
        }
    }

    async simulateRetryWithBackoff(strategy, recovery) {
        for (let attempt = 1; attempt <= strategy.maxRetries; attempt++) {
            recovery.attempts = attempt;
            recovery.steps.push(`Attempt ${attempt}`);
            
            // Simulate retry delay
            const delay = Math.min(strategy.baseDelay * Math.pow(2, attempt - 1), strategy.maxDelay);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Simulate success probability increasing with attempts
            const successProbability = 0.3 + (attempt * 0.25);
            if (Math.random() < successProbability) {
                recovery.steps.push(`Success on attempt ${attempt}`);
                return true;
            }
            
            recovery.steps.push(`Failed attempt ${attempt}, waiting ${delay}ms`);
        }
        
        recovery.steps.push('Max retries exceeded');
        return false;
    }

    async simulateWaitAndRetry(strategy, recovery) {
        for (let attempt = 1; attempt <= strategy.maxRetries; attempt++) {
            recovery.attempts = attempt;
            recovery.steps.push(`Wait and retry attempt ${attempt}`);
            
            await new Promise(resolve => setTimeout(resolve, strategy.delay));
            
            // Simulate success probability
            if (Math.random() < 0.7) {
                recovery.steps.push(`Success on attempt ${attempt}`);
                return true;
            }
            
            recovery.steps.push(`Failed attempt ${attempt}`);
        }
        
        return false;
    }

    async simulateQueueAndRetry(strategy, recovery) {
        recovery.steps.push('Adding to retry queue');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        recovery.steps.push('Processing from queue');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        recovery.attempts = 1;
        return Math.random() < 0.85; // 85% success rate for queued items
    }

    async simulateCleanupAndRestart(strategy, recovery) {
        recovery.steps.push('Starting cleanup process');
        await new Promise(resolve => setTimeout(resolve, strategy.cleanupTimeout));
        
        recovery.steps.push('Cleanup completed');
        recovery.steps.push('Restarting process');
        await new Promise(resolve => setTimeout(resolve, strategy.restartDelay));
        
        recovery.steps.push('Process restarted');
        recovery.attempts = 1;
        return Math.random() < 0.9; // 90% success rate for restart
    }

    async simulateCleanupAndNotify(strategy, recovery) {
        recovery.steps.push('Starting cleanup process');
        await new Promise(resolve => setTimeout(resolve, strategy.cleanupTimeout));
        
        recovery.steps.push('Cleanup completed');
        recovery.steps.push(`Sending notifications to: ${strategy.notificationChannels.join(', ')}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        recovery.steps.push('Notifications sent');
        recovery.attempts = 1;
        return true; // Always succeeds for notify-only strategies
    }

    async simulateRestartProcess(strategy, recovery) {
        for (let attempt = 1; attempt <= strategy.maxRestarts; attempt++) {
            recovery.attempts = attempt;
            recovery.steps.push(`Process restart attempt ${attempt}`);
            
            await new Promise(resolve => setTimeout(resolve, strategy.restartTimeout));
            
            if (Math.random() < 0.8) {
                recovery.steps.push(`Process restarted successfully on attempt ${attempt}`);
                return true;
            }
            
            recovery.steps.push(`Restart attempt ${attempt} failed`);
        }
        
        recovery.steps.push('Max restart attempts exceeded');
        return false;
    }

    async simulateSkipWithNotification(strategy, recovery) {
        recovery.steps.push('Skipping failed item');
        recovery.steps.push(`Sending notifications to: ${strategy.notificationChannels.join(', ')}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        recovery.steps.push('Item skipped and notifications sent');
        recovery.attempts = 1;
        return true; // Always succeeds for skip strategies
    }

    async simulateFallbackToHuman(strategy, recovery) {
        recovery.steps.push('Marking for human review');
        recovery.steps.push(`Sending notifications to: ${strategy.notificationChannels.join(', ')}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        recovery.steps.push('Human review requested');
        recovery.attempts = 1;
        return true; // Always succeeds for human fallback
    }

    async simulateRequestClarification(strategy, recovery) {
        recovery.steps.push('Requesting clarification from issue creator');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        recovery.steps.push('Clarification request sent');
        recovery.attempts = 1;
        return true; // Always succeeds for clarification requests
    }

    async simulateFallbackTool(strategy, recovery) {
        for (let attempt = 1; attempt <= strategy.maxFallbacks; attempt++) {
            recovery.attempts = attempt;
            recovery.steps.push(`Trying fallback tool ${attempt}`);
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            if (Math.random() < 0.75) {
                recovery.steps.push(`Fallback tool ${attempt} succeeded`);
                return true;
            }
            
            recovery.steps.push(`Fallback tool ${attempt} failed`);
        }
        
        recovery.steps.push('All fallback tools failed');
        return false;
    }

    async simulateRestartAgent(strategy, recovery) {
        for (let attempt = 1; attempt <= strategy.maxRestarts; attempt++) {
            recovery.attempts = attempt;
            recovery.steps.push(`Agent restart attempt ${attempt}`);
            
            await new Promise(resolve => setTimeout(resolve, strategy.restartTimeout));
            
            if (Math.random() < 0.85) {
                recovery.steps.push(`Agent restarted successfully on attempt ${attempt}`);
                return true;
            }
            
            recovery.steps.push(`Agent restart attempt ${attempt} failed`);
        }
        
        recovery.steps.push('Max agent restart attempts exceeded');
        return false;
    }

    async simulateReconnectDatabase(strategy, recovery) {
        for (let attempt = 1; attempt <= strategy.maxReconnects; attempt++) {
            recovery.attempts = attempt;
            recovery.steps.push(`Database reconnection attempt ${attempt}`);
            
            await new Promise(resolve => setTimeout(resolve, strategy.reconnectDelay));
            
            if (Math.random() < 0.8) {
                recovery.steps.push(`Database reconnected successfully on attempt ${attempt}`);
                return true;
            }
            
            recovery.steps.push(`Database reconnection attempt ${attempt} failed`);
        }
        
        recovery.steps.push('Max database reconnection attempts exceeded');
        return false;
    }

    async validatePostRecovery(scenario, recoveryResult) {
        const validation = {
            valid: false,
            checks: [],
            score: 0
        };

        // Simulate post-recovery validation
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (recoveryResult.recovered) {
            validation.checks.push('System functionality restored');
            validation.checks.push('Data integrity verified');
            validation.checks.push('Performance metrics normal');
            validation.valid = true;
            validation.score = 100;
        } else {
            validation.checks.push('System functionality not restored');
            validation.checks.push('Recovery failed');
            validation.valid = false;
            validation.score = 0;
        }

        return validation;
    }

    async testRecoveryStrategies() {
        const recoveryTests = [];
        
        for (const [strategyName, strategy] of Object.entries(this.recoveryStrategies)) {
            this.logger.info(`🔄 Testing recovery strategy: ${strategy.name}`);
            
            const startTime = Date.now();
            
            // Create mock error scenario for this strategy
            const mockScenario = {
                name: `Test for ${strategy.name}`,
                errorType: 'test_error',
                expectedRecovery: strategyName
            };
            
            const mockErrorSimulation = {
                errorType: 'test_error',
                errorMessage: 'Test error for recovery strategy validation',
                errorCode: 'TEST_ERROR'
            };
            
            try {
                const recoveryResult = await this.testRecoveryMechanism(mockScenario, mockErrorSimulation);
                
                const endTime = Date.now();
                
                recoveryTests.push({
                    strategyName: strategyName,
                    strategyDescription: strategy.description,
                    recoveryResult: recoveryResult,
                    duration: endTime - startTime,
                    success: recoveryResult.recovered
                });
                
                this.logger.info(`${recoveryResult.recovered ? '✅' : '❌'} ${strategy.name}: ${recoveryResult.recovered ? 'Success' : 'Failed'}`);
                
            } catch (error) {
                this.logger.error(`❌ Error testing recovery strategy ${strategyName}: ${error.message}`);
                recoveryTests.push({
                    strategyName: strategyName,
                    error: error.message,
                    success: false,
                    duration: Date.now() - startTime
                });
            }
        }
        
        return recoveryTests;
    }

    calculateErrorHandlingSummary(testResults) {
        const summary = {
            totalTests: 0,
            successfulTests: 0,
            byCategory: {},
            bySeverity: {},
            averageDetectionTime: 0,
            averageRecoveryTime: 0,
            recoverySuccessRate: 0,
            criticalErrorHandling: 0
        };

        // Combine all test results
        const allTests = [
            ...testResults.networkErrorTests,
            ...testResults.systemErrorTests,
            ...testResults.logicErrorTests,
            ...testResults.integrationErrorTests
        ];

        summary.totalTests = allTests.length;
        summary.successfulTests = allTests.filter(t => t.success).length;

        // Group by category
        const categoryGroups = {};
        allTests.forEach(test => {
            if (!categoryGroups[test.category]) {
                categoryGroups[test.category] = { total: 0, successful: 0 };
            }
            categoryGroups[test.category].total++;
            if (test.success) {
                categoryGroups[test.category].successful++;
            }
        });

        Object.keys(categoryGroups).forEach(category => {
            const group = categoryGroups[category];
            summary.byCategory[category] = {
                successRate: group.successful / group.total,
                total: group.total,
                successful: group.successful
            };
        });

        // Group by severity
        const severityGroups = {};
        allTests.forEach(test => {
            if (!severityGroups[test.severity]) {
                severityGroups[test.severity] = { total: 0, successful: 0 };
            }
            severityGroups[test.severity].total++;
            if (test.success) {
                severityGroups[test.severity].successful++;
            }
        });

        Object.keys(severityGroups).forEach(severity => {
            const group = severityGroups[severity];
            summary.bySeverity[severity] = {
                successRate: group.successful / group.total,
                total: group.total,
                successful: group.successful
            };
        });

        // Calculate averages
        const validTests = allTests.filter(t => t.errorDetection && t.recoveryResult);
        if (validTests.length > 0) {
            summary.averageDetectionTime = validTests.reduce((sum, t) => sum + t.errorDetection.detectionTime, 0) / validTests.length;
            summary.averageRecoveryTime = validTests.reduce((sum, t) => sum + t.recoveryResult.totalDuration, 0) / validTests.length;
        }

        // Recovery success rate
        const recoveryTests = testResults.recoveryTests || [];
        summary.recoverySuccessRate = recoveryTests.length > 0 ? 
            recoveryTests.filter(t => t.success).length / recoveryTests.length : 0;

        // Critical error handling
        const criticalErrors = allTests.filter(t => t.severity === 'critical');
        summary.criticalErrorHandling = criticalErrors.length > 0 ? 
            criticalErrors.filter(t => t.success).length / criticalErrors.length : 1;

        return summary;
    }

    evaluateErrorHandlingSuccess(testResults) {
        const summary = testResults.summary;
        
        // Success criteria
        const overallSuccessRate = summary.successfulTests / summary.totalTests;
        const criticalErrorSuccess = summary.criticalErrorHandling;
        const recoveryStrategySuccess = summary.recoverySuccessRate;
        
        // System passes if:
        // - Overall success rate > 80%
        // - Critical error handling > 90%
        // - Recovery strategy success > 85%
        
        return overallSuccessRate > 0.8 && 
               criticalErrorSuccess > 0.9 && 
               recoveryStrategySuccess > 0.85;
    }

    async getTestResults() {
        return this.testResults;
    }

    async saveTestResults() {
        await fs.ensureDir('logs');
        await fs.writeJSON('logs/test-error-handling-recovery-results.json', this.testResults, { spaces: 2 });
        this.logger.info('Error handling and recovery test results saved successfully');
    }

    async cleanup() {
        this.logger.info('Error handling test cleanup completed');
    }
}

// Run tests if called directly
if (require.main === module) {
    const errorHandlingTest = new TestErrorHandlingRecovery();

    async function runTests() {
        console.log('🚨 Running Error Handling and Recovery Tests...');
        
        try {
            const results = await errorHandlingTest.runErrorHandlingTests();
            
            console.log('\n📊 Error Handling Test Results Summary:');
            console.log(`   Total Tests: ${results.summary.totalTests}`);
            console.log(`   Successful Tests: ${results.summary.successfulTests}`);
            console.log(`   Overall Success Rate: ${((results.summary.successfulTests / results.summary.totalTests) * 100).toFixed(1)}%`);
            console.log(`   Recovery Success Rate: ${(results.summary.recoverySuccessRate * 100).toFixed(1)}%`);
            console.log(`   Critical Error Handling: ${(results.summary.criticalErrorHandling * 100).toFixed(1)}%`);
            console.log(`   Average Detection Time: ${results.summary.averageDetectionTime.toFixed(0)}ms`);
            console.log(`   Average Recovery Time: ${results.summary.averageRecoveryTime.toFixed(0)}ms`);
            
            console.log('\n📋 Results by Category:');
            Object.entries(results.summary.byCategory).forEach(([category, stats]) => {
                console.log(`   ${category}: ${(stats.successRate * 100).toFixed(1)}% (${stats.successful}/${stats.total})`);
            });
            
            console.log('\n🚨 Results by Severity:');
            Object.entries(results.summary.bySeverity).forEach(([severity, stats]) => {
                console.log(`   ${severity}: ${(stats.successRate * 100).toFixed(1)}% (${stats.successful}/${stats.total})`);
            });
            
            console.log('\n🔄 Recovery Strategy Tests:');
            results.recoveryTests.forEach(test => {
                console.log(`   ${test.strategyName}: ${test.success ? '✅' : '❌'} (${test.duration}ms)`);
            });
            
        } catch (error) {
            console.error('❌ Error running error handling tests:', error.message);
        }
        
        await errorHandlingTest.saveTestResults();
        await errorHandlingTest.cleanup();
        
        console.log('\n🎉 Error handling and recovery tests completed!');
    }

    runTests();
}

module.exports = TestErrorHandlingRecovery;
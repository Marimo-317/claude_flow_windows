// Test Performance and Scalability for Claude Flow Automation Testing
require('dotenv').config({ path: '.env.test' });
const winston = require('winston');
const fs = require('fs-extra');
const path = require('path');
const { performance } = require('perf_hooks');

class TestPerformanceScalability {
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
                new winston.transports.File({ filename: 'logs/test-performance-scalability.log' })
            ]
        });
        
        this.testResults = [];
        this.performanceMetrics = {
            concurrentSessions: [],
            resourceUsage: [],
            responseTimesMs: [],
            throughputMetrics: [],
            scalabilityLimits: [],
            errorRates: []
        };
        
        this.testConfigurations = this.loadTestConfigurations();
    }

    loadTestConfigurations() {
        return {
            load_levels: [
                { name: 'Light', concurrent_sessions: 5, duration_ms: 30000 },
                { name: 'Medium', concurrent_sessions: 15, duration_ms: 45000 },
                { name: 'Heavy', concurrent_sessions: 25, duration_ms: 60000 }
            ],
            
            issue_types: [
                { category: 'bug', complexity: 'low', weight: 0.4 },
                { category: 'feature', complexity: 'medium', weight: 0.3 },
                { category: 'security', complexity: 'high', weight: 0.2 },
                { category: 'performance', complexity: 'medium', weight: 0.1 }
            ],
            
            performance_thresholds: {
                max_response_time_ms: 5000,
                max_memory_usage_mb: 512,
                max_cpu_usage_percent: 80,
                min_throughput_per_minute: 12,
                max_error_rate_percent: 5
            },
            
            scalability_targets: {
                concurrent_sessions_target: 30,
                issues_per_hour_target: 100,
                memory_efficiency_target: 0.85,
                response_time_degradation_limit: 2.0
            }
        };
    }

    async runPerformanceTests() {
        this.logger.info('🚀 Starting performance and scalability tests...');
        
        const testResults = {
            loadTests: [],
            concurrencyTests: [],
            resourceTests: [],
            scalabilityTests: [],
            summary: {}
        };

        // Run load tests at different levels
        for (const loadLevel of this.testConfigurations.load_levels) {
            this.logger.info(`📊 Running ${loadLevel.name} load test...`);
            
            const loadTestResult = await this.runLoadTest(loadLevel);
            testResults.loadTests.push(loadTestResult);
            
            // Wait between tests to allow cleanup
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        // Run concurrency tests
        this.logger.info('🔄 Running concurrency tests...');
        const concurrencyResult = await this.runConcurrencyTest();
        testResults.concurrencyTests.push(concurrencyResult);

        // Run resource utilization tests
        this.logger.info('💾 Running resource utilization tests...');
        const resourceResult = await this.runResourceTest();
        testResults.resourceTests.push(resourceResult);

        // Run scalability tests
        this.logger.info('📈 Running scalability tests...');
        const scalabilityResult = await this.runScalabilityTest();
        testResults.scalabilityTests.push(scalabilityResult);

        // Calculate summary metrics
        testResults.summary = this.calculateSummaryMetrics(testResults);

        this.testResults.push({
            timestamp: new Date().toISOString(),
            testType: 'performance_scalability',
            results: testResults,
            success: this.evaluateOverallPerformance(testResults)
        });

        return testResults;
    }

    async runLoadTest(loadLevel) {
        const startTime = performance.now();
        const sessions = [];
        const completedSessions = [];
        const errors = [];

        this.logger.info(`🎯 Load test: ${loadLevel.concurrent_sessions} concurrent sessions for ${loadLevel.duration_ms}ms`);

        try {
            // Start concurrent sessions
            for (let i = 0; i < loadLevel.concurrent_sessions; i++) {
                const sessionPromise = this.simulateAutomationSession(
                    `load-test-${loadLevel.name}-${i}`, 
                    loadLevel.duration_ms / loadLevel.concurrent_sessions
                );
                sessions.push(sessionPromise);
            }

            // Monitor resource usage during test
            const resourceMonitor = this.startResourceMonitoring();

            // Wait for all sessions to complete or timeout
            const results = await Promise.allSettled(sessions);
            
            // Stop resource monitoring
            const resourceData = await this.stopResourceMonitoring(resourceMonitor);

            // Process results
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    completedSessions.push(result.value);
                } else {
                    errors.push({
                        sessionIndex: index,
                        error: result.reason.message || 'Unknown error'
                    });
                }
            });

            const endTime = performance.now();
            const totalDuration = endTime - startTime;

            const loadTestResult = {
                loadLevel: loadLevel.name,
                concurrentSessions: loadLevel.concurrent_sessions,
                targetDuration: loadLevel.duration_ms,
                actualDuration: totalDuration,
                completedSessions: completedSessions.length,
                errors: errors.length,
                successRate: completedSessions.length / loadLevel.concurrent_sessions,
                averageResponseTime: completedSessions.reduce((sum, s) => sum + s.duration, 0) / completedSessions.length,
                throughput: (completedSessions.length / totalDuration) * 1000 * 60, // per minute
                resourceUsage: resourceData,
                performanceScore: this.calculatePerformanceScore(completedSessions, errors, resourceData)
            };

            this.logger.info(`✅ Load test completed: ${loadTestResult.successRate * 100}% success rate`);
            return loadTestResult;

        } catch (error) {
            this.logger.error(`❌ Load test failed: ${error.message}`);
            return {
                loadLevel: loadLevel.name,
                error: error.message,
                success: false
            };
        }
    }

    async simulateAutomationSession(sessionId, maxDuration) {
        const startTime = performance.now();
        
        try {
            // Simulate issue analysis phase
            await this.simulatePhase('analysis', Math.random() * 2000 + 1000);
            
            // Simulate agent spawning
            await this.simulatePhase('agent_spawning', Math.random() * 1500 + 500);
            
            // Simulate tool selection
            await this.simulatePhase('tool_selection', Math.random() * 1000 + 500);
            
            // Simulate solution development
            await this.simulatePhase('solution_development', Math.random() * 5000 + 3000);
            
            // Simulate testing
            await this.simulatePhase('testing', Math.random() * 2000 + 1000);
            
            // Simulate PR creation
            await this.simulatePhase('pr_creation', Math.random() * 1000 + 500);
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Simulate random errors (5% failure rate)
            if (Math.random() < 0.05) {
                throw new Error('Simulated automation failure');
            }
            
            return {
                sessionId: sessionId,
                duration: duration,
                success: true,
                phases: 6,
                memoryUsage: this.simulateMemoryUsage(),
                cpuUsage: this.simulateCPUUsage()
            };
            
        } catch (error) {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            return {
                sessionId: sessionId,
                duration: duration,
                success: false,
                error: error.message,
                phases: 0
            };
        }
    }

    async simulatePhase(phaseName, duration) {
        // Simulate CPU and memory usage during phase
        const cpuLoad = Math.random() * 50 + 20; // 20-70% CPU usage
        const memoryLoad = Math.random() * 100 + 50; // 50-150 MB memory usage
        
        // Simulate work with actual delay
        await new Promise(resolve => setTimeout(resolve, duration));
        
        return {
            phase: phaseName,
            duration: duration,
            cpuUsage: cpuLoad,
            memoryUsage: memoryLoad
        };
    }

    simulateMemoryUsage() {
        return Math.floor(Math.random() * 200 + 100); // 100-300 MB
    }

    simulateCPUUsage() {
        return Math.floor(Math.random() * 60 + 20); // 20-80% CPU
    }

    startResourceMonitoring() {
        const monitor = {
            interval: null,
            data: [],
            startTime: performance.now()
        };

        monitor.interval = setInterval(() => {
            const timestamp = performance.now() - monitor.startTime;
            monitor.data.push({
                timestamp: timestamp,
                memoryUsage: this.simulateMemoryUsage(),
                cpuUsage: this.simulateCPUUsage(),
                activeConnections: Math.floor(Math.random() * 20 + 5),
                diskIO: Math.floor(Math.random() * 50 + 10)
            });
        }, 1000);

        return monitor;
    }

    async stopResourceMonitoring(monitor) {
        if (monitor.interval) {
            clearInterval(monitor.interval);
        }

        // Calculate averages and peaks
        const data = monitor.data;
        
        if (data.length === 0) {
            return {
                avgMemoryUsage: 0,
                avgCPUUsage: 0,
                peakMemoryUsage: 0,
                peakCPUUsage: 0,
                avgActiveConnections: 0,
                avgDiskIO: 0
            };
        }

        return {
            avgMemoryUsage: data.reduce((sum, d) => sum + d.memoryUsage, 0) / data.length,
            avgCPUUsage: data.reduce((sum, d) => sum + d.cpuUsage, 0) / data.length,
            peakMemoryUsage: Math.max(...data.map(d => d.memoryUsage)),
            peakCPUUsage: Math.max(...data.map(d => d.cpuUsage)),
            avgActiveConnections: data.reduce((sum, d) => sum + d.activeConnections, 0) / data.length,
            avgDiskIO: data.reduce((sum, d) => sum + d.diskIO, 0) / data.length,
            samples: data.length
        };
    }

    calculatePerformanceScore(completedSessions, errors, resourceData) {
        let score = 100;

        // Deduct points for errors
        const errorRate = errors.length / (completedSessions.length + errors.length);
        score -= errorRate * 30;

        // Deduct points for slow response times
        const avgResponseTime = completedSessions.reduce((sum, s) => sum + s.duration, 0) / completedSessions.length;
        if (avgResponseTime > this.testConfigurations.performance_thresholds.max_response_time_ms) {
            score -= 20;
        }

        // Deduct points for high resource usage
        if (resourceData.peakMemoryUsage > this.testConfigurations.performance_thresholds.max_memory_usage_mb) {
            score -= 15;
        }

        if (resourceData.peakCPUUsage > this.testConfigurations.performance_thresholds.max_cpu_usage_percent) {
            score -= 15;
        }

        return Math.max(0, Math.min(100, score));
    }

    async runConcurrencyTest() {
        this.logger.info('🔄 Testing concurrent session handling...');
        
        const concurrencyLevels = [5, 10, 15, 20, 25, 30];
        const results = [];

        for (const level of concurrencyLevels) {
            this.logger.info(`  Testing ${level} concurrent sessions...`);
            
            const startTime = performance.now();
            const sessions = [];

            // Create concurrent sessions
            for (let i = 0; i < level; i++) {
                sessions.push(this.simulateAutomationSession(`concurrency-${level}-${i}`, 10000));
            }

            try {
                const sessionResults = await Promise.allSettled(sessions);
                const endTime = performance.now();
                
                const successful = sessionResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
                const failed = sessionResults.length - successful;
                
                results.push({
                    concurrencyLevel: level,
                    totalSessions: level,
                    successful: successful,
                    failed: failed,
                    successRate: successful / level,
                    totalDuration: endTime - startTime,
                    averageResponseTime: sessionResults
                        .filter(r => r.status === 'fulfilled')
                        .reduce((sum, r) => sum + r.value.duration, 0) / successful,
                    throughput: (successful / (endTime - startTime)) * 1000 * 60
                });
                
            } catch (error) {
                this.logger.error(`Error in concurrency test at level ${level}: ${error.message}`);
                results.push({
                    concurrencyLevel: level,
                    error: error.message,
                    success: false
                });
            }
        }

        return {
            testType: 'concurrency',
            results: results,
            maxConcurrentSessions: Math.max(...results.filter(r => r.successRate > 0.8).map(r => r.concurrencyLevel)),
            degradationPoint: results.find(r => r.successRate < 0.9)?.concurrencyLevel || 'Not reached'
        };
    }

    async runResourceTest() {
        this.logger.info('💾 Testing resource utilization...');
        
        const testScenarios = [
            { name: 'Memory Intensive', sessions: 10, duration: 20000 },
            { name: 'CPU Intensive', sessions: 15, duration: 15000 },
            { name: 'I/O Intensive', sessions: 8, duration: 25000 }
        ];

        const results = [];

        for (const scenario of testScenarios) {
            this.logger.info(`  Testing ${scenario.name} scenario...`);
            
            const resourceMonitor = this.startResourceMonitoring();
            const startTime = performance.now();
            
            const sessions = [];
            for (let i = 0; i < scenario.sessions; i++) {
                sessions.push(this.simulateAutomationSession(`resource-${scenario.name}-${i}`, scenario.duration));
            }

            try {
                await Promise.allSettled(sessions);
                const endTime = performance.now();
                
                const resourceData = await this.stopResourceMonitoring(resourceMonitor);
                
                results.push({
                    scenario: scenario.name,
                    sessions: scenario.sessions,
                    duration: endTime - startTime,
                    resourceUsage: resourceData,
                    efficiency: this.calculateResourceEfficiency(resourceData, scenario.sessions),
                    withinThresholds: this.checkResourceThresholds(resourceData)
                });
                
            } catch (error) {
                await this.stopResourceMonitoring(resourceMonitor);
                this.logger.error(`Error in resource test ${scenario.name}: ${error.message}`);
                results.push({
                    scenario: scenario.name,
                    error: error.message,
                    success: false
                });
            }
        }

        return {
            testType: 'resource_utilization',
            results: results,
            overallEfficiency: results.reduce((sum, r) => sum + (r.efficiency || 0), 0) / results.length,
            thresholdCompliance: results.every(r => r.withinThresholds)
        };
    }

    calculateResourceEfficiency(resourceData, sessionCount) {
        // Calculate efficiency as work done per resource unit
        const memoryEfficiency = sessionCount / resourceData.avgMemoryUsage;
        const cpuEfficiency = sessionCount / resourceData.avgCPUUsage;
        
        return (memoryEfficiency + cpuEfficiency) / 2;
    }

    checkResourceThresholds(resourceData) {
        const thresholds = this.testConfigurations.performance_thresholds;
        
        return resourceData.peakMemoryUsage <= thresholds.max_memory_usage_mb &&
               resourceData.peakCPUUsage <= thresholds.max_cpu_usage_percent;
    }

    async runScalabilityTest() {
        this.logger.info('📈 Testing scalability characteristics...');
        
        const scalabilityData = {
            responseTimeVsLoad: [],
            memoryUsageVsLoad: [],
            throughputVsLoad: [],
            errorRateVsLoad: []
        };

        const loadLevels = [1, 5, 10, 15, 20, 25, 30];
        
        for (const load of loadLevels) {
            this.logger.info(`  Testing scalability at load level ${load}...`);
            
            const resourceMonitor = this.startResourceMonitoring();
            const startTime = performance.now();
            
            const sessions = [];
            for (let i = 0; i < load; i++) {
                sessions.push(this.simulateAutomationSession(`scalability-${load}-${i}`, 15000));
            }

            try {
                const results = await Promise.allSettled(sessions);
                const endTime = performance.now();
                
                const resourceData = await this.stopResourceMonitoring(resourceMonitor);
                
                const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
                const failed = results.length - successful;
                
                const avgResponseTime = results
                    .filter(r => r.status === 'fulfilled')
                    .reduce((sum, r) => sum + r.value.duration, 0) / successful;
                
                scalabilityData.responseTimeVsLoad.push({ load, responseTime: avgResponseTime });
                scalabilityData.memoryUsageVsLoad.push({ load, memoryUsage: resourceData.avgMemoryUsage });
                scalabilityData.throughputVsLoad.push({ load, throughput: (successful / (endTime - startTime)) * 1000 * 60 });
                scalabilityData.errorRateVsLoad.push({ load, errorRate: failed / load });
                
            } catch (error) {
                await this.stopResourceMonitoring(resourceMonitor);
                this.logger.error(`Error in scalability test at load ${load}: ${error.message}`);
            }
        }

        return {
            testType: 'scalability',
            data: scalabilityData,
            scalabilityMetrics: this.calculateScalabilityMetrics(scalabilityData),
            recommendations: this.generateScalabilityRecommendations(scalabilityData)
        };
    }

    calculateScalabilityMetrics(data) {
        // Calculate response time degradation
        const responseTimeData = data.responseTimeVsLoad;
        const baselineResponseTime = responseTimeData[0]?.responseTime || 0;
        const maxResponseTime = Math.max(...responseTimeData.map(d => d.responseTime));
        const responseTimeDegradation = maxResponseTime / baselineResponseTime;

        // Calculate memory scaling factor
        const memoryData = data.memoryUsageVsLoad;
        const baselineMemory = memoryData[0]?.memoryUsage || 0;
        const maxMemory = Math.max(...memoryData.map(d => d.memoryUsage));
        const memoryScalingFactor = maxMemory / baselineMemory;

        // Calculate throughput efficiency
        const throughputData = data.throughputVsLoad;
        const maxThroughput = Math.max(...throughputData.map(d => d.throughput));
        const throughputEfficiency = maxThroughput / throughputData[throughputData.length - 1]?.throughput || 1;

        return {
            responseTimeDegradation: responseTimeDegradation,
            memoryScalingFactor: memoryScalingFactor,
            throughputEfficiency: throughputEfficiency,
            maxSupportedLoad: this.findMaxSupportedLoad(data),
            scalabilityScore: this.calculateScalabilityScore(responseTimeDegradation, memoryScalingFactor, throughputEfficiency)
        };
    }

    findMaxSupportedLoad(data) {
        const thresholds = this.testConfigurations.performance_thresholds;
        
        // Find the maximum load where all thresholds are met
        for (let i = data.responseTimeVsLoad.length - 1; i >= 0; i--) {
            const responseTime = data.responseTimeVsLoad[i].responseTime;
            const memoryUsage = data.memoryUsageVsLoad[i].memoryUsage;
            const errorRate = data.errorRateVsLoad[i].errorRate;
            
            if (responseTime <= thresholds.max_response_time_ms &&
                memoryUsage <= thresholds.max_memory_usage_mb &&
                errorRate <= thresholds.max_error_rate_percent / 100) {
                return data.responseTimeVsLoad[i].load;
            }
        }
        
        return 1; // Fallback to minimum load
    }

    calculateScalabilityScore(responseTimeDegradation, memoryScalingFactor, throughputEfficiency) {
        let score = 100;
        
        // Deduct points for response time degradation
        if (responseTimeDegradation > 2.0) {
            score -= 30;
        } else if (responseTimeDegradation > 1.5) {
            score -= 20;
        }
        
        // Deduct points for memory scaling issues
        if (memoryScalingFactor > 3.0) {
            score -= 25;
        } else if (memoryScalingFactor > 2.0) {
            score -= 15;
        }
        
        // Deduct points for throughput inefficiency
        if (throughputEfficiency < 0.7) {
            score -= 20;
        } else if (throughputEfficiency < 0.8) {
            score -= 10;
        }
        
        return Math.max(0, Math.min(100, score));
    }

    generateScalabilityRecommendations(data) {
        const recommendations = [];
        
        const maxLoad = this.findMaxSupportedLoad(data);
        const targets = this.testConfigurations.scalability_targets;
        
        if (maxLoad < targets.concurrent_sessions_target) {
            recommendations.push({
                type: 'capacity',
                priority: 'high',
                description: `System supports ${maxLoad} concurrent sessions vs target of ${targets.concurrent_sessions_target}`,
                suggestion: 'Consider optimizing resource usage or scaling infrastructure'
            });
        }
        
        const responseTimeData = data.responseTimeVsLoad;
        const responseTimeDegradation = Math.max(...responseTimeData.map(d => d.responseTime)) / responseTimeData[0]?.responseTime;
        
        if (responseTimeDegradation > targets.response_time_degradation_limit) {
            recommendations.push({
                type: 'performance',
                priority: 'medium',
                description: `Response time degrades by ${responseTimeDegradation.toFixed(1)}x under load`,
                suggestion: 'Implement caching or optimize critical path performance'
            });
        }
        
        const memoryData = data.memoryUsageVsLoad;
        const memoryEfficiency = memoryData[0]?.memoryUsage / memoryData[memoryData.length - 1]?.memoryUsage;
        
        if (memoryEfficiency < targets.memory_efficiency_target) {
            recommendations.push({
                type: 'resource',
                priority: 'medium',
                description: `Memory efficiency is ${(memoryEfficiency * 100).toFixed(1)}% vs target of ${targets.memory_efficiency_target * 100}%`,
                suggestion: 'Implement memory pooling or optimize data structures'
            });
        }
        
        return recommendations;
    }

    calculateSummaryMetrics(testResults) {
        const summary = {
            overallPerformanceScore: 0,
            maxConcurrentSessions: 0,
            avgResponseTime: 0,
            maxThroughput: 0,
            resourceEfficiency: 0,
            scalabilityScore: 0,
            recommendations: []
        };

        // Calculate overall performance score
        const loadTestScores = testResults.loadTests.map(t => t.performanceScore || 0);
        const avgLoadScore = loadTestScores.reduce((sum, score) => sum + score, 0) / loadTestScores.length;
        
        const concurrencyScore = testResults.concurrencyTests[0]?.results?.reduce((sum, r) => sum + (r.successRate * 100), 0) / testResults.concurrencyTests[0]?.results?.length || 0;
        
        const resourceScore = testResults.resourceTests[0]?.overallEfficiency * 20 || 0;
        
        const scalabilityScore = testResults.scalabilityTests[0]?.scalabilityMetrics?.scalabilityScore || 0;

        summary.overallPerformanceScore = (avgLoadScore + concurrencyScore + resourceScore + scalabilityScore) / 4;

        // Extract other metrics
        summary.maxConcurrentSessions = testResults.concurrencyTests[0]?.maxConcurrentSessions || 0;
        summary.avgResponseTime = testResults.loadTests.reduce((sum, t) => sum + (t.averageResponseTime || 0), 0) / testResults.loadTests.length;
        summary.maxThroughput = Math.max(...testResults.loadTests.map(t => t.throughput || 0));
        summary.resourceEfficiency = testResults.resourceTests[0]?.overallEfficiency || 0;
        summary.scalabilityScore = scalabilityScore;

        // Combine all recommendations
        testResults.scalabilityTests.forEach(test => {
            if (test.recommendations) {
                summary.recommendations.push(...test.recommendations);
            }
        });

        return summary;
    }

    evaluateOverallPerformance(testResults) {
        const summary = testResults.summary;
        
        // Check if performance meets minimum requirements
        const meetsRequirements = 
            summary.overallPerformanceScore >= 70 &&
            summary.maxConcurrentSessions >= 15 &&
            summary.avgResponseTime <= this.testConfigurations.performance_thresholds.max_response_time_ms &&
            summary.resourceEfficiency >= 0.5;

        return meetsRequirements;
    }

    async getTestResults() {
        return this.testResults;
    }

    async saveTestResults() {
        await fs.ensureDir('logs');
        await fs.writeJSON('logs/test-performance-scalability-results.json', this.testResults, { spaces: 2 });
        await fs.writeJSON('logs/performance-metrics.json', this.performanceMetrics, { spaces: 2 });
        this.logger.info('Performance and scalability test results saved successfully');
    }

    async cleanup() {
        // Clean up any temporary files or resources
        this.logger.info('Performance test cleanup completed');
    }
}

// Run tests if called directly
if (require.main === module) {
    const performanceTest = new TestPerformanceScalability();

    async function runTests() {
        console.log('🚀 Running Performance and Scalability Tests...');
        
        try {
            const results = await performanceTest.runPerformanceTests();
            
            console.log('\n📊 Performance Test Results Summary:');
            console.log(`   Overall Performance Score: ${results.summary.overallPerformanceScore.toFixed(1)}/100`);
            console.log(`   Max Concurrent Sessions: ${results.summary.maxConcurrentSessions}`);
            console.log(`   Average Response Time: ${results.summary.avgResponseTime.toFixed(0)}ms`);
            console.log(`   Max Throughput: ${results.summary.maxThroughput.toFixed(1)} requests/minute`);
            console.log(`   Resource Efficiency: ${(results.summary.resourceEfficiency * 100).toFixed(1)}%`);
            console.log(`   Scalability Score: ${results.summary.scalabilityScore.toFixed(1)}/100`);
            
            console.log('\n📈 Load Test Results:');
            results.loadTests.forEach(test => {
                console.log(`   ${test.loadLevel}: ${(test.successRate * 100).toFixed(1)}% success, ${test.averageResponseTime.toFixed(0)}ms avg response`);
            });
            
            console.log('\n🔄 Concurrency Test Results:');
            if (results.concurrencyTests[0]) {
                console.log(`   Max Concurrent Sessions: ${results.concurrencyTests[0].maxConcurrentSessions}`);
                console.log(`   Degradation Point: ${results.concurrencyTests[0].degradationPoint}`);
            }
            
            console.log('\n💾 Resource Test Results:');
            if (results.resourceTests[0]) {
                console.log(`   Overall Efficiency: ${(results.resourceTests[0].overallEfficiency * 100).toFixed(1)}%`);
                console.log(`   Threshold Compliance: ${results.resourceTests[0].thresholdCompliance ? '✅ Pass' : '❌ Fail'}`);
            }
            
            console.log('\n📈 Scalability Test Results:');
            if (results.scalabilityTests[0]) {
                const metrics = results.scalabilityTests[0].scalabilityMetrics;
                console.log(`   Response Time Degradation: ${metrics.responseTimeDegradation.toFixed(1)}x`);
                console.log(`   Memory Scaling Factor: ${metrics.memoryScalingFactor.toFixed(1)}x`);
                console.log(`   Max Supported Load: ${metrics.maxSupportedLoad} concurrent sessions`);
                console.log(`   Scalability Score: ${metrics.scalabilityScore.toFixed(1)}/100`);
            }
            
            if (results.summary.recommendations.length > 0) {
                console.log('\n💡 Recommendations:');
                results.summary.recommendations.forEach(rec => {
                    console.log(`   ${rec.priority.toUpperCase()}: ${rec.description}`);
                    console.log(`     → ${rec.suggestion}`);
                });
            }
            
        } catch (error) {
            console.error('❌ Error running performance tests:', error.message);
        }
        
        await performanceTest.saveTestResults();
        await performanceTest.cleanup();
        
        console.log('\n🎉 Performance and scalability tests completed!');
    }

    runTests();
}

module.exports = TestPerformanceScalability;
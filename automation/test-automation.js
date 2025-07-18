// Test Automation System for Claude Flow Automation
const { spawn } = require('child_process');
const Database = require('better-sqlite3');
const winston = require('winston');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

class TestAutomation {
    constructor() {
        this.db = new Database('.hive-mind/automation.db');
        this.logger = this.setupLogger();
        this.testSuites = this.loadTestSuites();
        this.testResults = new Map();
        this.coverageThreshold = 80;
        this.testTimeout = 300000; // 5 minutes
    }

    setupLogger() {
        return winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/test-automation.log' }),
                new winston.transports.Console()
            ]
        });
    }

    loadTestSuites() {
        return {
            unit_tests: {
                command: 'npm',
                args: ['test'],
                pattern: '**/*.test.js',
                timeout: 120000,
                coverage: true
            },
            integration_tests: {
                command: 'npm',
                args: ['run', 'test:integration'],
                pattern: '**/*.integration.js',
                timeout: 300000,
                coverage: false
            },
            e2e_tests: {
                command: 'npm',
                args: ['run', 'test:e2e'],
                pattern: '**/*.e2e.js',
                timeout: 600000,
                coverage: false
            },
            security_tests: {
                command: 'npm',
                args: ['audit'],
                pattern: null,
                timeout: 60000,
                coverage: false
            },
            performance_tests: {
                command: 'npm',
                args: ['run', 'test:performance'],
                pattern: '**/*.perf.js',
                timeout: 300000,
                coverage: false
            },
            claude_flow_tests: {
                command: './claude-flow.sh',
                args: ['sparc', 'run', 'tdd'],
                pattern: null,
                timeout: 300000,
                coverage: false
            }
        };
    }

    async runAllTests(sessionId, context = {}) {
        const testRunId = crypto.randomUUID();
        const startTime = Date.now();
        
        this.logger.info(`Starting comprehensive test run: ${testRunId}`);
        
        try {
            // Create test run record
            await this.createTestRun(testRunId, sessionId, context);
            
            // Run all test suites
            const suiteResults = [];
            for (const [suiteName, config] of Object.entries(this.testSuites)) {
                this.logger.info(`Running test suite: ${suiteName}`);
                
                const result = await this.runTestSuite(suiteName, config, testRunId);
                suiteResults.push(result);
                
                // Store individual suite result
                await this.storeTestResult(testRunId, suiteName, result);
            }
            
            // Calculate overall results
            const overallResult = this.calculateOverallResult(suiteResults);
            
            // Update test run with final results
            await this.updateTestRun(testRunId, overallResult, Date.now() - startTime);
            
            // Generate test report
            const report = await this.generateTestReport(testRunId, suiteResults, overallResult);
            
            this.logger.info(`Test run completed: ${testRunId}, Success: ${overallResult.success}`);
            
            return {
                testRunId: testRunId,
                success: overallResult.success,
                duration: Date.now() - startTime,
                suiteResults: suiteResults,
                overallResult: overallResult,
                report: report
            };
            
        } catch (error) {
            this.logger.error(`Test run failed: ${testRunId}`, error);
            
            await this.updateTestRun(testRunId, {
                success: false,
                error: error.message,
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                coverage: 0
            }, Date.now() - startTime);
            
            throw error;
        }
    }

    async runTestSuite(suiteName, config, testRunId) {
        const suiteStartTime = Date.now();
        
        try {
            // Prepare test environment
            await this.prepareTestEnvironment(suiteName, config);
            
            // Execute test suite
            const result = await this.executeTestSuite(suiteName, config);
            
            // Parse test results
            const parsedResult = this.parseTestResults(result, config);
            
            // Cleanup test environment
            await this.cleanupTestEnvironment(suiteName, config);
            
            return {
                suiteName: suiteName,
                success: parsedResult.success,
                duration: Date.now() - suiteStartTime,
                totalTests: parsedResult.totalTests,
                passedTests: parsedResult.passedTests,
                failedTests: parsedResult.failedTests,
                skippedTests: parsedResult.skippedTests,
                coverage: parsedResult.coverage,
                details: parsedResult.details,
                output: result.output
            };
            
        } catch (error) {
            this.logger.error(`Test suite failed: ${suiteName}`, error);
            
            return {
                suiteName: suiteName,
                success: false,
                duration: Date.now() - suiteStartTime,
                totalTests: 0,
                passedTests: 0,
                failedTests: 1,
                skippedTests: 0,
                coverage: 0,
                error: error.message,
                details: [],
                output: error.toString()
            };
        }
    }

    async prepareTestEnvironment(suiteName, config) {
        // Create test-specific directories
        const testDir = path.join(process.cwd(), 'temp', 'test', suiteName);
        await fs.ensureDir(testDir);
        
        // Set up test database
        if (suiteName === 'integration_tests') {
            await this.setupTestDatabase();
        }
        
        // Copy test fixtures
        const fixturesDir = path.join(process.cwd(), 'test', 'fixtures');
        if (await fs.pathExists(fixturesDir)) {
            await fs.copy(fixturesDir, path.join(testDir, 'fixtures'));
        }
        
        this.logger.info(`Test environment prepared for: ${suiteName}`);
    }

    async executeTestSuite(suiteName, config) {
        return new Promise((resolve, reject) => {
            const testProcess = spawn(config.command, config.args, {
                cwd: process.cwd(),
                stdio: 'pipe',
                env: {
                    ...process.env,
                    NODE_ENV: 'test',
                    TEST_SUITE: suiteName,
                    TEST_TIMEOUT: config.timeout.toString()
                }
            });

            let output = '';
            let errorOutput = '';

            testProcess.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                this.logger.info(`Test ${suiteName}: ${text}`);
            });

            testProcess.stderr.on('data', (data) => {
                const text = data.toString();
                errorOutput += text;
                this.logger.error(`Test ${suiteName} Error: ${text}`);
            });

            testProcess.on('close', (code) => {
                resolve({
                    exitCode: code,
                    output: output,
                    errorOutput: errorOutput,
                    success: code === 0
                });
            });

            testProcess.on('error', (error) => {
                reject(error);
            });

            // Set timeout
            setTimeout(() => {
                testProcess.kill('SIGTERM');
                reject(new Error(`Test suite ${suiteName} timed out after ${config.timeout}ms`));
            }, config.timeout);
        });
    }

    parseTestResults(result, config) {
        const output = result.output;
        
        // Parse Jest/Mocha output
        const passedMatch = output.match(/(\d+) passed/);
        const failedMatch = output.match(/(\d+) failed/);
        const skippedMatch = output.match(/(\d+) skipped/);
        const totalMatch = output.match(/(\d+) total/);
        const coverageMatch = output.match(/All files[^|]*\|\s*(\d+\.?\d*)/);
        
        // Parse test details
        const details = this.parseTestDetails(output);
        
        const totalTests = totalMatch ? parseInt(totalMatch[1]) : 0;
        const passedTests = passedMatch ? parseInt(passedMatch[1]) : 0;
        const failedTests = failedMatch ? parseInt(failedMatch[1]) : 0;
        const skippedTests = skippedMatch ? parseInt(skippedMatch[1]) : 0;
        const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;
        
        return {
            success: result.success && failedTests === 0,
            totalTests: totalTests,
            passedTests: passedTests,
            failedTests: failedTests,
            skippedTests: skippedTests,
            coverage: coverage,
            details: details
        };
    }

    parseTestDetails(output) {
        const details = [];
        const lines = output.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Parse test failures
            if (line.includes('FAIL') || line.includes('✕')) {
                const testName = line.replace(/.*FAIL|.*✕/, '').trim();
                const errorLines = [];
                
                // Collect error details
                for (let j = i + 1; j < lines.length && j < i + 10; j++) {
                    if (lines[j].includes('Expected:') || lines[j].includes('Received:') || 
                        lines[j].includes('Error:') || lines[j].includes('at ')) {
                        errorLines.push(lines[j].trim());
                    }
                }
                
                details.push({
                    type: 'failure',
                    test: testName,
                    error: errorLines.join('\n')
                });
            }
            
            // Parse test passes
            if (line.includes('PASS') || line.includes('✓')) {
                const testName = line.replace(/.*PASS|.*✓/, '').trim();
                details.push({
                    type: 'pass',
                    test: testName
                });
            }
        }
        
        return details;
    }

    async cleanupTestEnvironment(suiteName, config) {
        // Remove test directories
        const testDir = path.join(process.cwd(), 'temp', 'test', suiteName);
        await fs.remove(testDir);
        
        // Clean up test database
        if (suiteName === 'integration_tests') {
            await this.cleanupTestDatabase();
        }
        
        this.logger.info(`Test environment cleaned up for: ${suiteName}`);
    }

    async setupTestDatabase() {
        // Create test database
        const testDb = new Database('.hive-mind/test.db');
        
        // Copy schema from main database
        const schema = fs.readFileSync('scripts/setup-enhanced-db.js', 'utf8');
        // Execute schema setup logic for test database
        
        testDb.close();
    }

    async cleanupTestDatabase() {
        // Remove test database
        const testDbPath = '.hive-mind/test.db';
        if (await fs.pathExists(testDbPath)) {
            await fs.remove(testDbPath);
        }
    }

    calculateOverallResult(suiteResults) {
        const totalTests = suiteResults.reduce((sum, result) => sum + result.totalTests, 0);
        const passedTests = suiteResults.reduce((sum, result) => sum + result.passedTests, 0);
        const failedTests = suiteResults.reduce((sum, result) => sum + result.failedTests, 0);
        const skippedTests = suiteResults.reduce((sum, result) => sum + result.skippedTests, 0);
        
        // Calculate weighted coverage
        const coverageResults = suiteResults.filter(result => result.coverage > 0);
        const avgCoverage = coverageResults.length > 0 
            ? coverageResults.reduce((sum, result) => sum + result.coverage, 0) / coverageResults.length
            : 0;
        
        const success = failedTests === 0 && totalTests > 0 && avgCoverage >= this.coverageThreshold;
        
        return {
            success: success,
            totalTests: totalTests,
            passedTests: passedTests,
            failedTests: failedTests,
            skippedTests: skippedTests,
            coverage: avgCoverage,
            successRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0
        };
    }

    async generateTestReport(testRunId, suiteResults, overallResult) {
        const report = {
            testRunId: testRunId,
            timestamp: new Date().toISOString(),
            summary: {
                success: overallResult.success,
                totalTests: overallResult.totalTests,
                passedTests: overallResult.passedTests,
                failedTests: overallResult.failedTests,
                skippedTests: overallResult.skippedTests,
                coverage: overallResult.coverage,
                successRate: overallResult.successRate
            },
            suites: suiteResults.map(result => ({
                name: result.suiteName,
                success: result.success,
                duration: result.duration,
                totalTests: result.totalTests,
                passedTests: result.passedTests,
                failedTests: result.failedTests,
                coverage: result.coverage,
                failures: result.details.filter(d => d.type === 'failure')
            })),
            recommendations: this.generateRecommendations(suiteResults, overallResult)
        };
        
        // Save report to file
        const reportPath = path.join(process.cwd(), 'reports', `test-report-${testRunId}.json`);
        await fs.ensureDir(path.dirname(reportPath));
        await fs.writeJSON(reportPath, report, { spaces: 2 });
        
        return report;
    }

    generateRecommendations(suiteResults, overallResult) {
        const recommendations = [];
        
        // Coverage recommendations
        if (overallResult.coverage < this.coverageThreshold) {
            recommendations.push({
                type: 'coverage',
                message: `Test coverage is ${overallResult.coverage.toFixed(1)}%, below threshold of ${this.coverageThreshold}%`,
                priority: 'high'
            });
        }
        
        // Failed test recommendations
        const failedSuites = suiteResults.filter(result => !result.success);
        if (failedSuites.length > 0) {
            recommendations.push({
                type: 'failures',
                message: `${failedSuites.length} test suite(s) failed: ${failedSuites.map(s => s.suiteName).join(', ')}`,
                priority: 'critical'
            });
        }
        
        // Performance recommendations
        const slowSuites = suiteResults.filter(result => result.duration > 60000);
        if (slowSuites.length > 0) {
            recommendations.push({
                type: 'performance',
                message: `Slow test suites detected: ${slowSuites.map(s => s.suiteName).join(', ')}`,
                priority: 'medium'
            });
        }
        
        return recommendations;
    }

    async createTestRun(testRunId, sessionId, context) {
        const insertTestRun = this.db.prepare(`
            INSERT INTO test_runs (
                test_run_id, session_id, status, start_time, context
            ) VALUES (?, ?, ?, ?, ?)
        `);
        
        // Ensure test_runs table exists
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS test_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                test_run_id TEXT UNIQUE,
                session_id TEXT,
                status TEXT,
                start_time DATETIME,
                end_time DATETIME,
                duration INTEGER,
                success BOOLEAN,
                total_tests INTEGER,
                passed_tests INTEGER,
                failed_tests INTEGER,
                coverage REAL,
                context TEXT
            )
        `);
        
        insertTestRun.run(
            testRunId,
            sessionId,
            'running',
            new Date().toISOString(),
            JSON.stringify(context)
        );
    }

    async updateTestRun(testRunId, result, duration) {
        const updateTestRun = this.db.prepare(`
            UPDATE test_runs 
            SET status = ?, end_time = ?, duration = ?, success = ?, 
                total_tests = ?, passed_tests = ?, failed_tests = ?, coverage = ?
            WHERE test_run_id = ?
        `);
        
        updateTestRun.run(
            result.success ? 'completed' : 'failed',
            new Date().toISOString(),
            duration,
            result.success,
            result.totalTests || 0,
            result.passedTests || 0,
            result.failedTests || 0,
            result.coverage || 0,
            testRunId
        );
    }

    async storeTestResult(testRunId, suiteName, result) {
        const insertResult = this.db.prepare(`
            INSERT INTO test_results (
                test_run_id, suite_name, success, duration, total_tests, 
                passed_tests, failed_tests, coverage, details
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        // Ensure test_results table exists
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS test_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                test_run_id TEXT,
                suite_name TEXT,
                success BOOLEAN,
                duration INTEGER,
                total_tests INTEGER,
                passed_tests INTEGER,
                failed_tests INTEGER,
                coverage REAL,
                details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        insertResult.run(
            testRunId,
            suiteName,
            result.success,
            result.duration,
            result.totalTests,
            result.passedTests,
            result.failedTests,
            result.coverage,
            JSON.stringify(result.details)
        );
    }

    async getTestHistory(limit = 50) {
        return this.db.prepare(`
            SELECT * FROM test_runs 
            ORDER BY start_time DESC 
            LIMIT ?
        `).all(limit);
    }

    async getTestStats() {
        const stats = this.db.prepare(`
            SELECT 
                COUNT(*) as total_runs,
                SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_runs,
                AVG(duration) as avg_duration,
                AVG(coverage) as avg_coverage,
                AVG(total_tests) as avg_total_tests
            FROM test_runs
        `).get();
        
        return stats;
    }

    async generateCoverageReport() {
        // Generate comprehensive coverage report
        const coverageData = this.db.prepare(`
            SELECT 
                suite_name,
                AVG(coverage) as avg_coverage,
                COUNT(*) as run_count
            FROM test_results
            WHERE coverage > 0
            GROUP BY suite_name
        `).all();
        
        return {
            timestamp: new Date().toISOString(),
            overall_coverage: coverageData.reduce((sum, d) => sum + d.avg_coverage, 0) / coverageData.length,
            suite_coverage: coverageData,
            recommendations: this.generateCoverageRecommendations(coverageData)
        };
    }

    generateCoverageRecommendations(coverageData) {
        const recommendations = [];
        
        coverageData.forEach(suite => {
            if (suite.avg_coverage < this.coverageThreshold) {
                recommendations.push({
                    suite: suite.suite_name,
                    current_coverage: suite.avg_coverage,
                    target_coverage: this.coverageThreshold,
                    recommendation: `Increase test coverage for ${suite.suite_name} from ${suite.avg_coverage.toFixed(1)}% to ${this.coverageThreshold}%`
                });
            }
        });
        
        return recommendations;
    }

    async runQuickTest(testType = 'unit') {
        if (!this.testSuites[testType]) {
            throw new Error(`Unknown test type: ${testType}`);
        }
        
        const config = this.testSuites[testType];
        const testRunId = crypto.randomUUID();
        
        this.logger.info(`Running quick ${testType} test: ${testRunId}`);
        
        const result = await this.runTestSuite(testType, config, testRunId);
        
        return {
            testRunId: testRunId,
            testType: testType,
            success: result.success,
            duration: result.duration,
            totalTests: result.totalTests,
            passedTests: result.passedTests,
            failedTests: result.failedTests,
            coverage: result.coverage
        };
    }
}

module.exports = TestAutomation;
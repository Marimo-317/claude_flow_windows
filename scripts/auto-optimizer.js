// Auto-Optimization System for Claude Flow Automation
const Database = require('better-sqlite3');
const winston = require('winston');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class AutoOptimizer {
    constructor() {
        this.db = new Database('.hive-mind/automation.db');
        this.logger = this.setupLogger();
        this.optimizationRules = this.loadOptimizationRules();
        this.systemMetrics = this.initializeSystemMetrics();
        this.optimizationHistory = [];
        this.lastOptimization = Date.now();
        this.optimizationInterval = 300000; // 5 minutes
        
        this.startOptimizationLoop();
    }

    setupLogger() {
        return winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/auto-optimizer.log' }),
                new winston.transports.Console()
            ]
        });
    }

    loadOptimizationRules() {
        return {
            // Agent allocation optimization rules
            agent_allocation: {
                max_concurrent_agents: {
                    min: 1,
                    max: 10,
                    optimal: 5,
                    adjust_based_on: ['cpu_usage', 'memory_usage', 'success_rate']
                },
                agent_timeout: {
                    min: 300000, // 5 minutes
                    max: 3600000, // 1 hour
                    optimal: 1800000, // 30 minutes
                    adjust_based_on: ['complexity', 'success_rate', 'avg_completion_time']
                },
                agent_spawn_delay: {
                    min: 0,
                    max: 30000,
                    optimal: 5000,
                    adjust_based_on: ['system_load', 'error_rate']
                }
            },
            
            // Tool selection optimization rules
            tool_selection: {
                max_tools_per_task: {
                    min: 5,
                    max: 20,
                    optimal: 12,
                    adjust_based_on: ['complexity', 'success_rate', 'performance']
                },
                tool_confidence_threshold: {
                    min: 0.3,
                    max: 0.9,
                    optimal: 0.7,
                    adjust_based_on: ['success_rate', 'false_positive_rate']
                }
            },
            
            // Learning system optimization rules
            learning_system: {
                learning_rate: {
                    min: 0.001,
                    max: 0.1,
                    optimal: 0.01,
                    adjust_based_on: ['learning_progress', 'accuracy', 'convergence_rate']
                },
                confidence_threshold: {
                    min: 0.5,
                    max: 0.95,
                    optimal: 0.8,
                    adjust_based_on: ['prediction_accuracy', 'false_positive_rate']
                },
                pattern_retention: {
                    min: 100,
                    max: 10000,
                    optimal: 1000,
                    adjust_based_on: ['storage_usage', 'pattern_relevance']
                }
            },
            
            // System performance optimization rules
            system_performance: {
                memory_threshold: {
                    min: 0.5,
                    max: 0.9,
                    optimal: 0.7,
                    adjust_based_on: ['memory_usage', 'gc_frequency']
                },
                cpu_threshold: {
                    min: 0.5,
                    max: 0.9,
                    optimal: 0.7,
                    adjust_based_on: ['cpu_usage', 'response_time']
                },
                database_size_limit: {
                    min: 100, // MB
                    max: 10000, // MB
                    optimal: 1000, // MB
                    adjust_based_on: ['storage_usage', 'query_performance']
                }
            }
        };
    }

    initializeSystemMetrics() {
        return {
            cpu_usage: 0,
            memory_usage: 0,
            disk_usage: 0,
            network_io: 0,
            database_size: 0,
            active_sessions: 0,
            success_rate: 0,
            avg_response_time: 0,
            error_rate: 0,
            learning_accuracy: 0,
            agent_efficiency: 0,
            tool_effectiveness: 0
        };
    }

    startOptimizationLoop() {
        setInterval(() => {
            this.performOptimization();
        }, this.optimizationInterval);
        
        this.logger.info('Auto-optimization loop started');
    }

    async performOptimization() {
        try {
            this.logger.info('Starting optimization cycle...');
            
            // Collect current metrics
            const currentMetrics = await this.collectSystemMetrics();
            
            // Analyze performance trends
            const trends = await this.analyzePerformanceTrends(currentMetrics);
            
            // Generate optimization recommendations
            const recommendations = await this.generateOptimizationRecommendations(trends);
            
            // Apply optimizations
            const appliedOptimizations = await this.applyOptimizations(recommendations);
            
            // Record optimization results
            await this.recordOptimizationResults(appliedOptimizations);
            
            // Update system configuration
            await this.updateSystemConfiguration(appliedOptimizations);
            
            this.logger.info(`Optimization cycle completed. Applied ${appliedOptimizations.length} optimizations.`);
            
        } catch (error) {
            this.logger.error('Error during optimization cycle:', error);
        }
    }

    async collectSystemMetrics() {
        const metrics = {
            // System metrics
            cpu_usage: await this.getCPUUsage(),
            memory_usage: await this.getMemoryUsage(),
            disk_usage: await this.getDiskUsage(),
            
            // Application metrics
            active_sessions: await this.getActiveSessionCount(),
            success_rate: await this.getSuccessRate(),
            avg_response_time: await this.getAverageResponseTime(),
            error_rate: await this.getErrorRate(),
            
            // Component metrics
            agent_efficiency: await this.getAgentEfficiency(),
            tool_effectiveness: await this.getToolEffectiveness(),
            learning_accuracy: await this.getLearningAccuracy(),
            
            // Database metrics
            database_size: await this.getDatabaseSize(),
            query_performance: await this.getQueryPerformance(),
            
            timestamp: Date.now()
        };
        
        // Store metrics in database
        await this.storeMetrics(metrics);
        
        return metrics;
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
        
        return 1 - (totalIdle / totalTick);
    }

    async getMemoryUsage() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        return (totalMemory - freeMemory) / totalMemory;
    }

    async getDiskUsage() {
        try {
            const stats = await fs.stat(process.cwd());
            // This is a simplified calculation
            return 0.5; // Placeholder
        } catch (error) {
            return 0;
        }
    }

    async getActiveSessionCount() {
        const result = this.db.prepare(`
            SELECT COUNT(*) as count 
            FROM automation_sessions 
            WHERE status = 'started'
        `).get();
        
        return result.count;
    }

    async getSuccessRate() {
        const result = this.db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful
            FROM automation_sessions
            WHERE start_time > datetime('now', '-24 hours')
        `).get();
        
        return result.total > 0 ? result.successful / result.total : 0;
    }

    async getAverageResponseTime() {
        const result = this.db.prepare(`
            SELECT AVG(
                (julianday(end_time) - julianday(start_time)) * 24 * 60 * 60 * 1000
            ) as avg_time
            FROM automation_sessions
            WHERE end_time IS NOT NULL
            AND start_time > datetime('now', '-24 hours')
        `).get();
        
        return result.avg_time || 0;
    }

    async getErrorRate() {
        const result = this.db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
            FROM automation_sessions
            WHERE start_time > datetime('now', '-24 hours')
        `).get();
        
        return result.total > 0 ? result.failed / result.total : 0;
    }

    async getAgentEfficiency() {
        const result = this.db.prepare(`
            SELECT AVG(success_rate) as avg_success_rate
            FROM agent_performance
            WHERE created_at > datetime('now', '-24 hours')
        `).get();
        
        return result.avg_success_rate || 0;
    }

    async getToolEffectiveness() {
        const result = this.db.prepare(`
            SELECT AVG(success_rate) as avg_success_rate
            FROM tool_usage
            WHERE last_used > datetime('now', '-24 hours')
        `).get();
        
        return result.avg_success_rate || 0;
    }

    async getLearningAccuracy() {
        const result = this.db.prepare(`
            SELECT AVG(accuracy_score) as avg_accuracy
            FROM neural_training_data
            WHERE created_at > datetime('now', '-24 hours')
        `).get();
        
        return result.avg_accuracy || 0;
    }

    async getDatabaseSize() {
        const stats = await fs.stat('.hive-mind/automation.db');
        return stats.size / (1024 * 1024); // MB
    }

    async getQueryPerformance() {
        const start = Date.now();
        this.db.prepare('SELECT COUNT(*) FROM automation_sessions').get();
        return Date.now() - start;
    }

    async storeMetrics(metrics) {
        const insertMetric = this.db.prepare(`
            INSERT INTO optimization_metrics (
                metric_type, metric_value, optimization_target, timestamp
            ) VALUES (?, ?, ?, ?)
        `);
        
        Object.entries(metrics).forEach(([key, value]) => {
            if (typeof value === 'number') {
                insertMetric.run(key, value, 'performance_optimization', new Date().toISOString());
            }
        });
    }

    async analyzePerformanceTrends(currentMetrics) {
        // Get historical metrics for trend analysis
        const historicalMetrics = this.db.prepare(`
            SELECT metric_type, metric_value, timestamp
            FROM optimization_metrics
            WHERE timestamp > datetime('now', '-1 hour')
            ORDER BY timestamp ASC
        `).all();
        
        const trends = {};
        
        // Group metrics by type
        const groupedMetrics = {};
        historicalMetrics.forEach(metric => {
            if (!groupedMetrics[metric.metric_type]) {
                groupedMetrics[metric.metric_type] = [];
            }
            groupedMetrics[metric.metric_type].push(metric.metric_value);
        });
        
        // Calculate trends
        Object.entries(groupedMetrics).forEach(([metricType, values]) => {
            if (values.length > 1) {
                const slope = this.calculateTrendSlope(values);
                const variance = this.calculateVariance(values);
                const average = values.reduce((a, b) => a + b, 0) / values.length;
                
                trends[metricType] = {
                    slope: slope,
                    variance: variance,
                    average: average,
                    current: currentMetrics[metricType] || 0,
                    trend: slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable'
                };
            }
        });
        
        return trends;
    }

    calculateTrendSlope(values) {
        if (values.length < 2) return 0;
        
        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
        const sumXX = values.reduce((sum, _, x) => sum + x * x, 0);
        
        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    calculateVariance(values) {
        if (values.length < 2) return 0;
        
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
        
        return variance;
    }

    async generateOptimizationRecommendations(trends) {
        const recommendations = [];
        
        // Analyze each optimization rule
        Object.entries(this.optimizationRules).forEach(([category, rules]) => {
            Object.entries(rules).forEach(([parameter, rule]) => {
                const recommendation = this.evaluateOptimizationRule(category, parameter, rule, trends);
                if (recommendation) {
                    recommendations.push(recommendation);
                }
            });
        });
        
        // Sort recommendations by priority
        recommendations.sort((a, b) => b.priority - a.priority);
        
        return recommendations;
    }

    evaluateOptimizationRule(category, parameter, rule, trends) {
        const adjustmentFactors = rule.adjust_based_on || [];
        let adjustmentScore = 0;
        let priority = 0;
        
        // Calculate adjustment score based on relevant metrics
        adjustmentFactors.forEach(factor => {
            const trend = trends[factor];
            if (trend) {
                if (trend.trend === 'increasing' && this.isNegativeMetric(factor)) {
                    adjustmentScore -= trend.slope;
                    priority += 0.3;
                } else if (trend.trend === 'decreasing' && this.isPositiveMetric(factor)) {
                    adjustmentScore -= trend.slope;
                    priority += 0.3;
                } else if (trend.variance > 0.1) {
                    adjustmentScore += 0.1;
                    priority += 0.1;
                }
            }
        });
        
        // Generate recommendation if adjustment is needed
        if (Math.abs(adjustmentScore) > 0.05) {
            const currentValue = this.getCurrentParameterValue(category, parameter);
            const targetValue = this.calculateTargetValue(rule, currentValue, adjustmentScore);
            
            if (targetValue !== currentValue) {
                return {
                    category: category,
                    parameter: parameter,
                    currentValue: currentValue,
                    targetValue: targetValue,
                    adjustmentScore: adjustmentScore,
                    priority: priority,
                    reason: this.generateOptimizationReason(category, parameter, adjustmentScore, trends)
                };
            }
        }
        
        return null;
    }

    isNegativeMetric(metric) {
        return ['cpu_usage', 'memory_usage', 'error_rate', 'avg_response_time'].includes(metric);
    }

    isPositiveMetric(metric) {
        return ['success_rate', 'learning_accuracy', 'agent_efficiency', 'tool_effectiveness'].includes(metric);
    }

    getCurrentParameterValue(category, parameter) {
        // Get current parameter value from configuration
        const config = this.loadCurrentConfiguration();
        return config[category]?.[parameter] || this.optimizationRules[category][parameter].optimal;
    }

    calculateTargetValue(rule, currentValue, adjustmentScore) {
        const range = rule.max - rule.min;
        const adjustment = adjustmentScore * range * 0.1; // 10% adjustment
        const targetValue = currentValue + adjustment;
        
        // Clamp to rule bounds
        return Math.max(rule.min, Math.min(rule.max, targetValue));
    }

    generateOptimizationReason(category, parameter, adjustmentScore, trends) {
        const direction = adjustmentScore > 0 ? 'increase' : 'decrease';
        const relevantTrends = [];
        
        Object.entries(trends).forEach(([metric, trend]) => {
            if (trend.trend !== 'stable') {
                relevantTrends.push(`${metric} is ${trend.trend}`);
            }
        });
        
        return `${direction} ${parameter} due to: ${relevantTrends.join(', ')}`;
    }

    async applyOptimizations(recommendations) {
        const appliedOptimizations = [];
        
        for (const recommendation of recommendations) {
            try {
                await this.applyOptimization(recommendation);
                appliedOptimizations.push({
                    ...recommendation,
                    status: 'applied',
                    timestamp: Date.now()
                });
                
                this.logger.info(`Applied optimization: ${recommendation.category}.${recommendation.parameter} = ${recommendation.targetValue}`);
                
            } catch (error) {
                this.logger.error(`Failed to apply optimization: ${recommendation.category}.${recommendation.parameter}`, error);
                appliedOptimizations.push({
                    ...recommendation,
                    status: 'failed',
                    error: error.message,
                    timestamp: Date.now()
                });
            }
        }
        
        return appliedOptimizations;
    }

    async applyOptimization(recommendation) {
        const { category, parameter, targetValue } = recommendation;
        
        switch (category) {
            case 'agent_allocation':
                await this.updateAgentAllocationSettings(parameter, targetValue);
                break;
            case 'tool_selection':
                await this.updateToolSelectionSettings(parameter, targetValue);
                break;
            case 'learning_system':
                await this.updateLearningSystemSettings(parameter, targetValue);
                break;
            case 'system_performance':
                await this.updateSystemPerformanceSettings(parameter, targetValue);
                break;
            default:
                throw new Error(`Unknown optimization category: ${category}`);
        }
    }

    async updateAgentAllocationSettings(parameter, value) {
        const config = this.loadCurrentConfiguration();
        
        if (!config.agent_allocation) {
            config.agent_allocation = {};
        }
        
        config.agent_allocation[parameter] = value;
        
        await this.saveConfiguration(config);
    }

    async updateToolSelectionSettings(parameter, value) {
        const config = this.loadCurrentConfiguration();
        
        if (!config.tool_selection) {
            config.tool_selection = {};
        }
        
        config.tool_selection[parameter] = value;
        
        await this.saveConfiguration(config);
    }

    async updateLearningSystemSettings(parameter, value) {
        const config = this.loadCurrentConfiguration();
        
        if (!config.learning_system) {
            config.learning_system = {};
        }
        
        config.learning_system[parameter] = value;
        
        await this.saveConfiguration(config);
    }

    async updateSystemPerformanceSettings(parameter, value) {
        const config = this.loadCurrentConfiguration();
        
        if (!config.system_performance) {
            config.system_performance = {};
        }
        
        config.system_performance[parameter] = value;
        
        await this.saveConfiguration(config);
    }

    loadCurrentConfiguration() {
        try {
            const configPath = path.join(process.cwd(), 'automation-config.json');
            if (fs.existsSync(configPath)) {
                return JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }
        } catch (error) {
            this.logger.error('Error loading configuration:', error);
        }
        
        return {};
    }

    async saveConfiguration(config) {
        try {
            const configPath = path.join(process.cwd(), 'automation-config.json');
            await fs.writeJSON(configPath, config, { spaces: 2 });
        } catch (error) {
            this.logger.error('Error saving configuration:', error);
            throw error;
        }
    }

    async recordOptimizationResults(optimizations) {
        const insertOptimization = this.db.prepare(`
            INSERT INTO optimization_metrics (
                metric_type, metric_value, optimization_target, timestamp
            ) VALUES (?, ?, ?, ?)
        `);
        
        optimizations.forEach(optimization => {
            insertOptimization.run(
                `optimization_${optimization.category}_${optimization.parameter}`,
                optimization.targetValue,
                'auto_optimization',
                new Date(optimization.timestamp).toISOString()
            );
        });
        
        // Store in optimization history
        this.optimizationHistory.push({
            timestamp: Date.now(),
            optimizations: optimizations,
            totalApplied: optimizations.filter(o => o.status === 'applied').length,
            totalFailed: optimizations.filter(o => o.status === 'failed').length
        });
        
        // Limit history size
        if (this.optimizationHistory.length > 100) {
            this.optimizationHistory = this.optimizationHistory.slice(-50);
        }
    }

    async updateSystemConfiguration(optimizations) {
        // Update environment variables based on optimizations
        const appliedOptimizations = optimizations.filter(o => o.status === 'applied');
        
        appliedOptimizations.forEach(optimization => {
            const envVarName = this.getEnvironmentVariableName(optimization.category, optimization.parameter);
            if (envVarName) {
                process.env[envVarName] = optimization.targetValue.toString();
            }
        });
        
        // Notify other components of configuration changes
        await this.notifyConfigurationChange(appliedOptimizations);
    }

    getEnvironmentVariableName(category, parameter) {
        const mappings = {
            'agent_allocation': {
                'max_concurrent_agents': 'MAX_CONCURRENT_AGENTS',
                'agent_timeout': 'AGENT_TIMEOUT',
                'agent_spawn_delay': 'AGENT_SPAWN_DELAY'
            },
            'learning_system': {
                'learning_rate': 'NEURAL_LEARNING_RATE',
                'confidence_threshold': 'CONFIDENCE_THRESHOLD'
            }
        };
        
        return mappings[category]?.[parameter];
    }

    async notifyConfigurationChange(optimizations) {
        // Emit configuration change events to other system components
        // This would typically involve sending messages to running processes
        this.logger.info(`Configuration updated with ${optimizations.length} optimizations`);
    }

    async getOptimizationStats() {
        const stats = {
            total_optimizations: this.optimizationHistory.length,
            successful_optimizations: this.optimizationHistory.reduce((sum, h) => sum + h.totalApplied, 0),
            failed_optimizations: this.optimizationHistory.reduce((sum, h) => sum + h.totalFailed, 0),
            last_optimization: this.optimizationHistory[this.optimizationHistory.length - 1]?.timestamp,
            optimization_categories: this.getOptimizationCategoryStats(),
            current_configuration: this.loadCurrentConfiguration(),
            system_health: await this.getSystemHealthScore()
        };
        
        return stats;
    }

    getOptimizationCategoryStats() {
        const categoryStats = {};
        
        this.optimizationHistory.forEach(history => {
            history.optimizations.forEach(optimization => {
                if (!categoryStats[optimization.category]) {
                    categoryStats[optimization.category] = {
                        total: 0,
                        successful: 0,
                        failed: 0
                    };
                }
                
                categoryStats[optimization.category].total++;
                if (optimization.status === 'applied') {
                    categoryStats[optimization.category].successful++;
                } else {
                    categoryStats[optimization.category].failed++;
                }
            });
        });
        
        return categoryStats;
    }

    async getSystemHealthScore() {
        const currentMetrics = this.systemMetrics;
        let healthScore = 100;
        
        // Deduct points for poor performance
        if (currentMetrics.cpu_usage > 0.8) healthScore -= 20;
        if (currentMetrics.memory_usage > 0.8) healthScore -= 20;
        if (currentMetrics.error_rate > 0.1) healthScore -= 30;
        if (currentMetrics.success_rate < 0.8) healthScore -= 30;
        
        return Math.max(0, healthScore);
    }

    async forceOptimization() {
        // Force an immediate optimization cycle
        this.logger.info('Forcing optimization cycle...');
        await this.performOptimization();
    }

    async resetOptimizations() {
        // Reset all optimizations to default values
        this.logger.info('Resetting optimizations to default values...');
        
        const defaultConfig = {};
        Object.entries(this.optimizationRules).forEach(([category, rules]) => {
            defaultConfig[category] = {};
            Object.entries(rules).forEach(([parameter, rule]) => {
                defaultConfig[category][parameter] = rule.optimal;
            });
        });
        
        await this.saveConfiguration(defaultConfig);
        this.optimizationHistory = [];
    }
}

module.exports = AutoOptimizer;
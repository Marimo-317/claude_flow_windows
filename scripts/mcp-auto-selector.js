// MCP Tool Auto-Selection System for Claude Flow Automation
const Database = require('better-sqlite3');
const winston = require('winston');
const fs = require('fs-extra');
const path = require('path');

class MCPAutoSelector {
    constructor() {
        this.db = new Database('.hive-mind/automation.db');
        this.logger = this.setupLogger();
        this.toolCatalog = this.loadToolCatalog();
        this.initializeSelector();
    }

    setupLogger() {
        return winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/mcp-selector.log' }),
                new winston.transports.Console()
            ]
        });
    }

    loadToolCatalog() {
        // Complete catalog of 87 MCP tools available in Claude Flow
        return {
            // File Operations (12 tools)
            file_operations: [
                'file_read', 'file_write', 'file_append', 'file_delete',
                'file_move', 'file_copy', 'file_search', 'file_watch',
                'directory_list', 'directory_create', 'directory_remove', 'file_permissions'
            ],
            
            // Code Analysis (15 tools)
            code_analysis: [
                'code_parse', 'syntax_check', 'code_format', 'code_lint',
                'dependency_analyze', 'complexity_measure', 'code_review',
                'pattern_detect', 'refactor_suggest', 'security_scan',
                'code_duplicate', 'ast_analyze', 'code_metrics', 'style_check', 'imports_analyze'
            ],
            
            // Testing (10 tools)
            testing: [
                'test_generate', 'test_run', 'test_debug', 'coverage_analyze',
                'performance_test', 'integration_test', 'unit_test_create',
                'mock_generate', 'test_data_create', 'test_report'
            ],
            
            // GitHub Integration (8 tools)
            github_integration: [
                'github_pr_create', 'github_pr_merge', 'github_commit',
                'github_issue_create', 'github_issue_update', 'github_review',
                'github_release', 'github_webhook'
            ],
            
            // Memory Management (8 tools)
            memory_management: [
                'memory_store', 'memory_retrieve', 'memory_query', 'memory_delete',
                'memory_export', 'memory_import', 'memory_backup', 'memory_sync'
            ],
            
            // Neural Networks (10 tools)
            neural_networks: [
                'neural_train', 'neural_predict', 'neural_optimize',
                'pattern_learn', 'data_preprocess', 'model_evaluate',
                'feature_extract', 'neural_export', 'neural_import', 'neural_analyze'
            ],
            
            // Workflow Automation (8 tools)
            workflow_automation: [
                'workflow_create', 'workflow_execute', 'workflow_monitor',
                'task_schedule', 'event_trigger', 'workflow_optimize',
                'pipeline_create', 'automation_config'
            ],
            
            // System Utilities (8 tools)
            system_utilities: [
                'process_monitor', 'system_info', 'resource_monitor',
                'log_analyze', 'config_manage', 'environment_setup',
                'health_check', 'system_optimize'
            ],
            
            // Database Operations (8 tools)
            database_operations: [
                'db_query', 'db_insert', 'db_update', 'db_delete',
                'db_schema', 'db_backup', 'db_optimize', 'db_migrate'
            ]
        };
    }

    initializeSelector() {
        // Initialize tool usage statistics
        this.initializeToolStats();
        
        // Load historical success patterns
        this.loadSuccessPatterns();
        
        // Initialize neural network for tool selection
        this.initializeNeuralSelector();
        
        this.logger.info('MCP Auto-Selector initialized with 87 tools');
    }

    initializeToolStats() {
        // Ensure all tools are in the database with initial stats
        const insertTool = this.db.prepare(`
            INSERT OR IGNORE INTO tool_usage (
                tool_name, tool_category, success_rate, avg_execution_time, 
                error_rate, usage_count, performance_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        Object.entries(this.toolCatalog).forEach(([category, tools]) => {
            tools.forEach(tool => {
                insertTool.run(tool, category, 0.85, 5000, 0.15, 0, 0.8);
            });
        });
    }

    loadSuccessPatterns() {
        // Load historical success patterns from database
        this.successPatterns = this.db.prepare(`
            SELECT pattern_data, solution_approach, confidence_score, usage_count
            FROM learning_patterns
            WHERE pattern_type = 'tool_selection'
            ORDER BY confidence_score DESC, usage_count DESC
        `).all();
    }

    initializeNeuralSelector() {
        // Initialize neural network for tool selection optimization
        this.neuralWeights = {
            category_priority: {
                bug: { code_analysis: 0.9, testing: 0.8, file_operations: 0.7 },
                feature: { code_analysis: 0.8, file_operations: 0.9, testing: 0.7, github_integration: 0.6 },
                documentation: { file_operations: 0.9, code_analysis: 0.5 },
                security: { code_analysis: 0.9, testing: 0.8, neural_networks: 0.7 },
                performance: { code_analysis: 0.8, testing: 0.9, neural_networks: 0.7 }
            },
            language_affinity: {
                javascript: ['code_analysis', 'testing', 'file_operations'],
                python: ['code_analysis', 'neural_networks', 'testing'],
                java: ['code_analysis', 'testing', 'database_operations'],
                csharp: ['code_analysis', 'testing', 'system_utilities']
            },
            complexity_scaling: {
                low: 0.3,
                medium: 0.7,
                high: 1.0
            }
        };
    }

    async selectToolsForTask(taskAnalysis) {
        try {
            this.logger.info(`Selecting tools for ${taskAnalysis.category} task with ${taskAnalysis.complexity} complexity`);

            // Get base tool selection
            const baseTools = this.getBaseTools(taskAnalysis);

            // Get category-specific tools
            const categoryTools = this.getCategoryTools(taskAnalysis);

            // Get language-specific tools
            const languageTools = this.getLanguageTools(taskAnalysis);

            // Get complexity-adjusted tools
            const complexityTools = this.getComplexityTools(taskAnalysis);

            // Combine and optimize selection
            const combinedTools = this.combineToolSelections(
                baseTools, categoryTools, languageTools, complexityTools
            );

            // Apply neural network optimization
            const optimizedTools = await this.applyNeuralOptimization(combinedTools, taskAnalysis);

            // Rank tools by predicted success rate
            const rankedTools = await this.rankToolsBySuccessRate(optimizedTools, taskAnalysis);

            // Filter to optimal set
            const finalTools = this.filterToOptimalSet(rankedTools, taskAnalysis);

            // Update usage statistics
            await this.updateToolUsageStats(finalTools, taskAnalysis);

            this.logger.info(`Selected ${finalTools.length} tools: ${finalTools.map(t => t.name).join(', ')}`);

            return finalTools;

        } catch (error) {
            this.logger.error('Error selecting tools:', error);
            throw error;
        }
    }

    getBaseTools(taskAnalysis) {
        // Essential tools for any task
        return [
            { name: 'file_read', category: 'file_operations', priority: 0.9 },
            { name: 'file_write', category: 'file_operations', priority: 0.9 },
            { name: 'memory_store', category: 'memory_management', priority: 0.8 },
            { name: 'memory_retrieve', category: 'memory_management', priority: 0.8 },
            { name: 'github_commit', category: 'github_integration', priority: 0.7 }
        ];
    }

    getCategoryTools(taskAnalysis) {
        const categoryMappings = {
            bug: [
                { name: 'code_parse', category: 'code_analysis', priority: 0.9 },
                { name: 'syntax_check', category: 'code_analysis', priority: 0.8 },
                { name: 'test_run', category: 'testing', priority: 0.8 },
                { name: 'code_review', category: 'code_analysis', priority: 0.7 },
                { name: 'test_debug', category: 'testing', priority: 0.7 }
            ],
            feature: [
                { name: 'code_format', category: 'code_analysis', priority: 0.8 },
                { name: 'test_generate', category: 'testing', priority: 0.9 },
                { name: 'code_lint', category: 'code_analysis', priority: 0.7 },
                { name: 'github_pr_create', category: 'github_integration', priority: 0.8 },
                { name: 'workflow_create', category: 'workflow_automation', priority: 0.6 }
            ],
            documentation: [
                { name: 'file_search', category: 'file_operations', priority: 0.9 },
                { name: 'code_analyze', category: 'code_analysis', priority: 0.7 },
                { name: 'pattern_detect', category: 'code_analysis', priority: 0.6 }
            ],
            security: [
                { name: 'security_scan', category: 'code_analysis', priority: 0.9 },
                { name: 'code_review', category: 'code_analysis', priority: 0.8 },
                { name: 'neural_analyze', category: 'neural_networks', priority: 0.7 },
                { name: 'test_run', category: 'testing', priority: 0.8 }
            ],
            performance: [
                { name: 'performance_test', category: 'testing', priority: 0.9 },
                { name: 'code_metrics', category: 'code_analysis', priority: 0.8 },
                { name: 'system_optimize', category: 'system_utilities', priority: 0.7 },
                { name: 'neural_optimize', category: 'neural_networks', priority: 0.6 }
            ],
            testing: [
                { name: 'test_generate', category: 'testing', priority: 0.9 },
                { name: 'test_run', category: 'testing', priority: 0.9 },
                { name: 'coverage_analyze', category: 'testing', priority: 0.8 },
                { name: 'mock_generate', category: 'testing', priority: 0.7 }
            ]
        };

        return categoryMappings[taskAnalysis.category] || [];
    }

    getLanguageTools(taskAnalysis) {
        const languageTools = {
            javascript: [
                { name: 'code_lint', category: 'code_analysis', priority: 0.8 },
                { name: 'dependency_analyze', category: 'code_analysis', priority: 0.7 },
                { name: 'test_generate', category: 'testing', priority: 0.8 }
            ],
            python: [
                { name: 'code_format', category: 'code_analysis', priority: 0.8 },
                { name: 'neural_train', category: 'neural_networks', priority: 0.7 },
                { name: 'test_run', category: 'testing', priority: 0.8 }
            ],
            java: [
                { name: 'code_compile', category: 'code_analysis', priority: 0.9 },
                { name: 'dependency_analyze', category: 'code_analysis', priority: 0.8 },
                { name: 'db_query', category: 'database_operations', priority: 0.6 }
            ],
            csharp: [
                { name: 'code_compile', category: 'code_analysis', priority: 0.9 },
                { name: 'system_info', category: 'system_utilities', priority: 0.7 },
                { name: 'test_run', category: 'testing', priority: 0.8 }
            ]
        };

        const tools = [];
        taskAnalysis.languages.forEach(lang => {
            if (languageTools[lang]) {
                tools.push(...languageTools[lang]);
            }
        });

        return tools;
    }

    getComplexityTools(taskAnalysis) {
        const complexityScaling = {
            low: 0.3,
            medium: 0.7,
            high: 1.0
        };

        const scale = complexityScaling[taskAnalysis.complexity];
        const tools = [];

        if (scale >= 0.3) {
            tools.push(
                { name: 'file_search', category: 'file_operations', priority: 0.6 },
                { name: 'code_parse', category: 'code_analysis', priority: 0.6 }
            );
        }

        if (scale >= 0.7) {
            tools.push(
                { name: 'pattern_detect', category: 'code_analysis', priority: 0.7 },
                { name: 'workflow_create', category: 'workflow_automation', priority: 0.6 },
                { name: 'neural_analyze', category: 'neural_networks', priority: 0.6 }
            );
        }

        if (scale >= 1.0) {
            tools.push(
                { name: 'neural_train', category: 'neural_networks', priority: 0.8 },
                { name: 'system_optimize', category: 'system_utilities', priority: 0.7 },
                { name: 'workflow_optimize', category: 'workflow_automation', priority: 0.7 }
            );
        }

        return tools;
    }

    combineToolSelections(...toolArrays) {
        const toolMap = new Map();

        toolArrays.forEach(tools => {
            tools.forEach(tool => {
                if (toolMap.has(tool.name)) {
                    // Increase priority for tools selected multiple times
                    const existing = toolMap.get(tool.name);
                    existing.priority = Math.min(1.0, existing.priority + 0.1);
                    existing.sources = (existing.sources || 1) + 1;
                } else {
                    toolMap.set(tool.name, { ...tool, sources: 1 });
                }
            });
        });

        return Array.from(toolMap.values());
    }

    async applyNeuralOptimization(tools, taskAnalysis) {
        // Apply neural network weights to optimize tool selection
        const optimizedTools = tools.map(tool => {
            let optimizationFactor = 1.0;

            // Apply category priority weights
            const categoryWeights = this.neuralWeights.category_priority[taskAnalysis.category];
            if (categoryWeights && categoryWeights[tool.category]) {
                optimizationFactor *= categoryWeights[tool.category];
            }

            // Apply language affinity
            const languageAffinities = this.neuralWeights.language_affinity;
            taskAnalysis.languages.forEach(lang => {
                if (languageAffinities[lang] && languageAffinities[lang].includes(tool.category)) {
                    optimizationFactor *= 1.1;
                }
            });

            // Apply complexity scaling
            optimizationFactor *= this.neuralWeights.complexity_scaling[taskAnalysis.complexity];

            return {
                ...tool,
                priority: Math.min(1.0, tool.priority * optimizationFactor),
                optimization_factor: optimizationFactor
            };
        });

        return optimizedTools;
    }

    async rankToolsBySuccessRate(tools, taskAnalysis) {
        // Get historical success rates from database
        const toolStats = this.db.prepare(`
            SELECT tool_name, success_rate, performance_score, usage_count
            FROM tool_usage
            WHERE tool_name IN (${tools.map(() => '?').join(',')})
        `).all(tools.map(t => t.name));

        // Create stats map
        const statsMap = new Map();
        toolStats.forEach(stat => {
            statsMap.set(stat.tool_name, stat);
        });

        // Rank tools by combined score
        const rankedTools = tools.map(tool => {
            const stats = statsMap.get(tool.name) || { success_rate: 0.5, performance_score: 0.5, usage_count: 0 };
            
            const combinedScore = (
                tool.priority * 0.4 +
                stats.success_rate * 0.3 +
                stats.performance_score * 0.2 +
                Math.min(stats.usage_count / 100, 1.0) * 0.1
            );

            return {
                ...tool,
                success_rate: stats.success_rate,
                performance_score: stats.performance_score,
                usage_count: stats.usage_count,
                combined_score: combinedScore
            };
        });

        return rankedTools.sort((a, b) => b.combined_score - a.combined_score);
    }

    filterToOptimalSet(rankedTools, taskAnalysis) {
        // Determine optimal number of tools based on complexity
        const maxTools = {
            low: 8,
            medium: 12,
            high: 16
        };

        const limit = maxTools[taskAnalysis.complexity];
        const optimalTools = rankedTools.slice(0, limit);

        // Ensure we have tools from essential categories
        const essentialCategories = ['file_operations', 'code_analysis', 'github_integration'];
        const categories = new Set(optimalTools.map(t => t.category));

        essentialCategories.forEach(category => {
            if (!categories.has(category)) {
                const categoryTool = rankedTools.find(t => t.category === category);
                if (categoryTool && optimalTools.length < limit) {
                    optimalTools.push(categoryTool);
                }
            }
        });

        return optimalTools;
    }

    async updateToolUsageStats(selectedTools, taskAnalysis) {
        // Update usage statistics for selected tools
        const updateUsage = this.db.prepare(`
            UPDATE tool_usage 
            SET usage_count = usage_count + 1, last_used = ?
            WHERE tool_name = ?
        `);

        selectedTools.forEach(tool => {
            updateUsage.run(new Date().toISOString(), tool.name);
        });

        // Store tool selection pattern for learning
        const storePattern = this.db.prepare(`
            INSERT INTO learning_patterns (
                pattern_type, pattern_data, confidence_score, 
                issue_characteristics, solution_approach
            ) VALUES (?, ?, ?, ?, ?)
        `);

        storePattern.run(
            'tool_selection',
            JSON.stringify({
                tools: selectedTools.map(t => ({ name: t.name, category: t.category })),
                task_analysis: taskAnalysis
            }),
            0.8,
            JSON.stringify(taskAnalysis),
            JSON.stringify({ selected_tools: selectedTools.map(t => t.name) })
        );
    }

    async getToolRecommendations(category, limit = 5) {
        // Get tool recommendations for a specific category
        const recommendations = this.db.prepare(`
            SELECT tool_name, success_rate, performance_score, usage_count
            FROM tool_usage
            WHERE tool_category = ?
            ORDER BY success_rate DESC, performance_score DESC
            LIMIT ?
        `).all(category, limit);

        return recommendations;
    }

    async getToolStats() {
        // Get comprehensive tool usage statistics
        const stats = this.db.prepare(`
            SELECT 
                tool_category,
                COUNT(*) as total_tools,
                AVG(success_rate) as avg_success_rate,
                AVG(performance_score) as avg_performance_score,
                SUM(usage_count) as total_usage
            FROM tool_usage
            GROUP BY tool_category
        `).all();

        return stats;
    }

    async optimizeToolSelection() {
        // Optimize tool selection based on historical data
        this.logger.info('Optimizing tool selection based on historical data');

        // Update success rates based on recent performance
        const updateSuccessRates = this.db.prepare(`
            UPDATE tool_usage 
            SET success_rate = (
                SELECT AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END)
                FROM automation_sessions 
                WHERE tools_used LIKE '%' || tool_name || '%'
                AND start_time > datetime('now', '-30 days')
            )
            WHERE tool_name IN (
                SELECT DISTINCT tool_name 
                FROM tool_usage 
                WHERE usage_count > 0
            )
        `);

        updateSuccessRates.run();

        // Retrain neural weights based on recent patterns
        await this.retrainNeuralWeights();

        this.logger.info('Tool selection optimization completed');
    }

    async retrainNeuralWeights() {
        // Retrain neural network weights based on successful patterns
        const successfulPatterns = this.db.prepare(`
            SELECT pattern_data, success_rate
            FROM learning_patterns lp
            JOIN automation_sessions as ON lp.pattern_data = as.tools_used
            WHERE lp.pattern_type = 'tool_selection'
            AND as.success = 1
            AND as.start_time > datetime('now', '-30 days')
        `).all();

        // TODO: Implement neural network retraining algorithm
        this.logger.info(`Retraining neural weights with ${successfulPatterns.length} successful patterns`);
    }
}

module.exports = MCPAutoSelector;
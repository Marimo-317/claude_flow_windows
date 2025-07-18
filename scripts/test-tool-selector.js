// Test Tool Selector for Claude Flow Automation Testing
require('dotenv').config({ path: '.env.test' });
const winston = require('winston');
const fs = require('fs-extra');

class TestToolSelector {
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
                new winston.transports.File({ filename: 'logs/test-tool-selector.log' })
            ]
        });
        
        this.toolCatalog = this.loadToolCatalog();
        this.testResults = [];
    }

    loadToolCatalog() {
        // Catalog of 87 MCP tools available in Claude Flow
        return {
            file_operations: [
                'file_read', 'file_write', 'file_append', 'file_delete',
                'file_move', 'file_copy', 'file_search', 'file_watch',
                'directory_list', 'directory_create', 'directory_remove', 'file_permissions'
            ],
            code_analysis: [
                'code_parse', 'syntax_check', 'code_format', 'code_lint',
                'dependency_analyze', 'complexity_measure', 'code_review',
                'pattern_detect', 'refactor_suggest', 'security_scan',
                'code_duplicate', 'ast_analyze', 'code_metrics', 'style_check', 'imports_analyze'
            ],
            testing: [
                'test_generate', 'test_run', 'test_debug', 'coverage_analyze',
                'performance_test', 'integration_test', 'unit_test_create',
                'mock_generate', 'test_data_create', 'test_report'
            ],
            github_integration: [
                'github_pr_create', 'github_pr_merge', 'github_commit',
                'github_issue_create', 'github_issue_update', 'github_review',
                'github_release', 'github_webhook'
            ],
            memory_management: [
                'memory_store', 'memory_retrieve', 'memory_query', 'memory_delete',
                'memory_export', 'memory_import', 'memory_backup', 'memory_sync'
            ],
            neural_networks: [
                'neural_train', 'neural_predict', 'neural_optimize',
                'pattern_learn', 'data_preprocess', 'model_evaluate',
                'feature_extract', 'neural_export', 'neural_import', 'neural_analyze'
            ],
            workflow_automation: [
                'workflow_create', 'workflow_execute', 'workflow_monitor',
                'task_schedule', 'event_trigger', 'workflow_optimize',
                'pipeline_create', 'automation_config'
            ],
            system_utilities: [
                'process_monitor', 'system_info', 'resource_monitor',
                'log_analyze', 'config_manage', 'environment_setup',
                'health_check', 'system_optimize'
            ],
            database_operations: [
                'db_query', 'db_insert', 'db_update', 'db_delete',
                'db_schema', 'db_backup', 'db_optimize', 'db_migrate'
            ]
        };
    }

    async selectToolsForTask(taskAnalysis) {
        try {
            this.logger.info(`Selecting tools for ${taskAnalysis.category} task with ${taskAnalysis.complexity} complexity`);

            // Get base tools
            const baseTools = this.getBaseTools(taskAnalysis);
            
            // Get category-specific tools
            const categoryTools = this.getCategoryTools(taskAnalysis);
            
            // Get language-specific tools
            const languageTools = this.getLanguageTools(taskAnalysis);
            
            // Get complexity-adjusted tools
            const complexityTools = this.getComplexityTools(taskAnalysis);

            // Combine all tools
            const allTools = [...baseTools, ...categoryTools, ...languageTools, ...complexityTools];
            
            // Remove duplicates and optimize
            const uniqueTools = this.removeDuplicateTools(allTools);
            
            // Apply neural network optimization (simulated)
            const optimizedTools = this.applyOptimization(uniqueTools, taskAnalysis);
            
            // Rank tools by success rate
            const rankedTools = this.rankToolsBySuccessRate(optimizedTools);
            
            // Filter to optimal set
            const finalTools = this.filterToOptimalSet(rankedTools, taskAnalysis);

            // Record test result
            this.testResults.push({
                timestamp: new Date().toISOString(),
                taskAnalysis: taskAnalysis,
                baseTools: baseTools.length,
                categoryTools: categoryTools.length,
                languageTools: languageTools.length,
                complexityTools: complexityTools.length,
                uniqueTools: uniqueTools.length,
                optimizedTools: optimizedTools.length,
                finalTools: finalTools.length,
                selectedTools: finalTools.map(t => t.name),
                success: true
            });

            this.logger.info(`Selected ${finalTools.length} tools from ${uniqueTools.length} available`);
            return finalTools;

        } catch (error) {
            this.logger.error('Error selecting tools:', error);
            this.testResults.push({
                timestamp: new Date().toISOString(),
                taskAnalysis: taskAnalysis,
                error: error.message,
                success: false
            });
            throw error;
        }
    }

    getBaseTools(taskAnalysis) {
        return [
            { name: 'file_read', category: 'file_operations', priority: 0.9, successRate: 0.95 },
            { name: 'file_write', category: 'file_operations', priority: 0.9, successRate: 0.95 },
            { name: 'memory_store', category: 'memory_management', priority: 0.8, successRate: 0.92 },
            { name: 'memory_retrieve', category: 'memory_management', priority: 0.8, successRate: 0.92 },
            { name: 'github_commit', category: 'github_integration', priority: 0.7, successRate: 0.88 }
        ];
    }

    getCategoryTools(taskAnalysis) {
        const categoryMappings = {
            bug: [
                { name: 'code_parse', category: 'code_analysis', priority: 0.9, successRate: 0.87 },
                { name: 'syntax_check', category: 'code_analysis', priority: 0.8, successRate: 0.92 },
                { name: 'test_run', category: 'testing', priority: 0.8, successRate: 0.85 },
                { name: 'code_review', category: 'code_analysis', priority: 0.7, successRate: 0.82 }
            ],
            feature: [
                { name: 'code_format', category: 'code_analysis', priority: 0.8, successRate: 0.88 },
                { name: 'test_generate', category: 'testing', priority: 0.9, successRate: 0.83 },
                { name: 'github_pr_create', category: 'github_integration', priority: 0.8, successRate: 0.90 },
                { name: 'workflow_create', category: 'workflow_automation', priority: 0.6, successRate: 0.78 }
            ],
            security: [
                { name: 'security_scan', category: 'code_analysis', priority: 0.9, successRate: 0.85 },
                { name: 'code_review', category: 'code_analysis', priority: 0.8, successRate: 0.82 },
                { name: 'neural_analyze', category: 'neural_networks', priority: 0.7, successRate: 0.75 }
            ],
            performance: [
                { name: 'performance_test', category: 'testing', priority: 0.9, successRate: 0.80 },
                { name: 'code_metrics', category: 'code_analysis', priority: 0.8, successRate: 0.85 },
                { name: 'system_optimize', category: 'system_utilities', priority: 0.7, successRate: 0.82 }
            ]
        };

        return categoryMappings[taskAnalysis.category] || [];
    }

    getLanguageTools(taskAnalysis) {
        const languageTools = {
            javascript: [
                { name: 'code_lint', category: 'code_analysis', priority: 0.8, successRate: 0.88 },
                { name: 'dependency_analyze', category: 'code_analysis', priority: 0.7, successRate: 0.85 }
            ],
            python: [
                { name: 'code_format', category: 'code_analysis', priority: 0.8, successRate: 0.90 },
                { name: 'neural_train', category: 'neural_networks', priority: 0.7, successRate: 0.78 }
            ],
            java: [
                { name: 'code_parse', category: 'code_analysis', priority: 0.9, successRate: 0.85 },
                { name: 'dependency_analyze', category: 'code_analysis', priority: 0.8, successRate: 0.82 }
            ]
        };

        const tools = [];
        (taskAnalysis.languages || []).forEach(lang => {
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

        const scale = complexityScaling[taskAnalysis.complexity] || 0.5;
        const tools = [];

        if (scale >= 0.3) {
            tools.push(
                { name: 'file_search', category: 'file_operations', priority: 0.6, successRate: 0.90 },
                { name: 'code_parse', category: 'code_analysis', priority: 0.6, successRate: 0.87 }
            );
        }

        if (scale >= 0.7) {
            tools.push(
                { name: 'pattern_detect', category: 'code_analysis', priority: 0.7, successRate: 0.80 },
                { name: 'workflow_create', category: 'workflow_automation', priority: 0.6, successRate: 0.78 }
            );
        }

        if (scale >= 1.0) {
            tools.push(
                { name: 'neural_train', category: 'neural_networks', priority: 0.8, successRate: 0.75 },
                { name: 'system_optimize', category: 'system_utilities', priority: 0.7, successRate: 0.82 }
            );
        }

        return tools;
    }

    removeDuplicateTools(tools) {
        const toolMap = new Map();
        
        tools.forEach(tool => {
            if (toolMap.has(tool.name)) {
                const existing = toolMap.get(tool.name);
                existing.priority = Math.max(existing.priority, tool.priority);
                existing.sources = (existing.sources || 1) + 1;
            } else {
                toolMap.set(tool.name, { ...tool, sources: 1 });
            }
        });

        return Array.from(toolMap.values());
    }

    applyOptimization(tools, taskAnalysis) {
        // Simulate neural network optimization
        return tools.map(tool => {
            let optimizationFactor = 1.0;

            // Apply category-specific optimization
            if (tool.category === 'code_analysis' && taskAnalysis.category === 'bug') {
                optimizationFactor *= 1.2;
            }
            if (tool.category === 'testing' && taskAnalysis.category === 'feature') {
                optimizationFactor *= 1.1;
            }
            if (tool.category === 'code_analysis' && taskAnalysis.category === 'security') {
                optimizationFactor *= 1.3;
            }

            // Apply complexity scaling
            const complexityMultiplier = {
                low: 0.8,
                medium: 1.0,
                high: 1.2
            };
            optimizationFactor *= complexityMultiplier[taskAnalysis.complexity] || 1.0;

            return {
                ...tool,
                priority: Math.min(1.0, tool.priority * optimizationFactor),
                optimizationFactor: optimizationFactor
            };
        });
    }

    rankToolsBySuccessRate(tools) {
        return tools.sort((a, b) => {
            const scoreA = a.priority * 0.6 + a.successRate * 0.4;
            const scoreB = b.priority * 0.6 + b.successRate * 0.4;
            return scoreB - scoreA;
        });
    }

    filterToOptimalSet(rankedTools, taskAnalysis) {
        const maxTools = {
            low: 8,
            medium: 12,
            high: 16
        };

        const limit = maxTools[taskAnalysis.complexity] || 10;
        const optimalTools = rankedTools.slice(0, limit);

        // Ensure essential categories are represented
        const categories = new Set(optimalTools.map(t => t.category));
        const essentialCategories = ['file_operations', 'code_analysis', 'github_integration'];

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

    async getTestResults() {
        return this.testResults;
    }

    async saveTestResults() {
        await fs.ensureDir('logs');
        await fs.writeJSON('logs/test-tool-selector-results.json', this.testResults, { spaces: 2 });
        this.logger.info('Tool selector test results saved successfully');
    }

    getToolCatalogStats() {
        const stats = {};
        let totalTools = 0;
        
        Object.entries(this.toolCatalog).forEach(([category, tools]) => {
            stats[category] = tools.length;
            totalTools += tools.length;
        });
        
        return { categories: stats, totalTools };
    }
}

// Run tests if called directly
if (require.main === module) {
    const selector = new TestToolSelector();
    
    const testTaskAnalyses = [
        {
            number: 1001,
            title: 'Fix button text is incorrect',
            complexity: 'low',
            category: 'bug',
            languages: ['javascript'],
            frameworks: ['react']
        },
        {
            number: 1002,
            title: 'Add user authentication system',
            complexity: 'medium',
            category: 'feature',
            languages: ['javascript', 'python'],
            frameworks: ['express', 'django']
        },
        {
            number: 1003,
            title: 'Security vulnerability in API endpoint',
            complexity: 'high',
            category: 'security',
            languages: ['python'],
            frameworks: ['flask']
        }
    ];

    async function runTests() {
        console.log('🧪 Running Tool Selector Tests...');
        
        // Show tool catalog stats
        const catalogStats = selector.getToolCatalogStats();
        console.log(`📊 Tool Catalog: ${catalogStats.totalTools} tools across ${Object.keys(catalogStats.categories).length} categories`);
        Object.entries(catalogStats.categories).forEach(([category, count]) => {
            console.log(`   - ${category}: ${count} tools`);
        });
        console.log('');

        for (const analysis of testTaskAnalyses) {
            try {
                console.log(`🔧 Testing tool selection for issue #${analysis.number}:`);
                
                const selectedTools = await selector.selectToolsForTask(analysis);
                
                console.log(`✅ Selected ${selectedTools.length} tools for ${analysis.complexity} ${analysis.category} task`);
                
                // Group tools by category
                const toolsByCategory = {};
                selectedTools.forEach(tool => {
                    if (!toolsByCategory[tool.category]) {
                        toolsByCategory[tool.category] = [];
                    }
                    toolsByCategory[tool.category].push(tool.name);
                });

                Object.entries(toolsByCategory).forEach(([category, tools]) => {
                    console.log(`   - ${category}: ${tools.join(', ')}`);
                });
                
                console.log('');
                
            } catch (error) {
                console.error(`❌ Error testing issue #${analysis.number}:`, error.message);
            }
        }

        await selector.saveTestResults();
        console.log('🎉 Tool selector tests completed!');
    }

    runTests();
}

module.exports = TestToolSelector;
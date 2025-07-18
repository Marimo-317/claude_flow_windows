// Continuous Learning System for Claude Flow Automation
const Database = require('better-sqlite3');
const winston = require('winston');
const crypto = require('crypto');
const fs = require('fs-extra');

class LearningSystem {
    constructor() {
        this.db = new Database('.hive-mind/automation.db');
        this.logger = this.setupLogger();
        this.neuralNetwork = this.initializeNeuralNetwork();
        this.learningMetrics = this.initializeLearningMetrics();
        this.confidenceThreshold = 0.7;
        this.learningRate = parseFloat(process.env.NEURAL_LEARNING_RATE) || 0.01;
    }

    setupLogger() {
        return winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/learning-system.log' }),
                new winston.transports.Console()
            ]
        });
    }

    initializeNeuralNetwork() {
        // Initialize neural network for pattern recognition and prediction
        return {
            weights: {
                issue_patterns: new Map(),
                solution_patterns: new Map(),
                success_patterns: new Map(),
                failure_patterns: new Map()
            },
            biases: {
                complexity_bias: 0.1,
                language_bias: 0.05,
                category_bias: 0.08
            },
            learning_history: []
        };
    }

    initializeLearningMetrics() {
        return {
            total_sessions: 0,
            successful_sessions: 0,
            failed_sessions: 0,
            learning_iterations: 0,
            pattern_accuracy: 0.0,
            prediction_accuracy: 0.0,
            last_updated: Date.now()
        };
    }

    async recordSuccess(context) {
        try {
            this.logger.info(`Recording success for session: ${context.sessionId}`);

            // Store success pattern in database
            const successId = await this.storeSuccessPattern(context);

            // Update neural network with success data
            await this.updateNeuralNetwork(context, true);

            // Update learning metrics
            await this.updateLearningMetrics(true);

            // Generate insights from success
            const insights = await this.generateInsights(context, true);

            // Store insights for future reference
            await this.storeInsights(insights, successId);

            this.logger.info(`Success pattern recorded and learned from session: ${context.sessionId}`);
            return successId;

        } catch (error) {
            this.logger.error('Error recording success:', error);
            throw error;
        }
    }

    async recordFailure(context) {
        try {
            this.logger.info(`Recording failure for session: ${context.sessionId}`);

            // Store failure pattern in database
            const failureId = await this.storeFailurePattern(context);

            // Update neural network with failure data
            await this.updateNeuralNetwork(context, false);

            // Update learning metrics
            await this.updateLearningMetrics(false);

            // Generate insights from failure
            const insights = await this.generateInsights(context, false);

            // Store insights for future reference
            await this.storeInsights(insights, failureId);

            // Suggest improvements
            const improvements = await this.suggestImprovements(context);

            this.logger.info(`Failure pattern recorded and learned from session: ${context.sessionId}`);
            return { failureId, improvements };

        } catch (error) {
            this.logger.error('Error recording failure:', error);
            throw error;
        }
    }

    async storeSuccessPattern(context) {
        const successId = crypto.randomUUID();
        
        const insertSuccess = this.db.prepare(`
            INSERT INTO learning_patterns (
                pattern_type, pattern_data, success_rate, confidence_score,
                issue_characteristics, solution_approach, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const patternData = {
            issue: {
                complexity: context.issue.complexity,
                category: context.issue.category,
                languages: context.issue.languages,
                frameworks: context.issue.frameworks
            },
            solution: {
                agents: context.agents.map(a => a.type),
                tools: context.toolsUsed,
                duration: context.duration,
                approach: context.approach
            },
            metrics: context.metrics
        };

        insertSuccess.run(
            'success_pattern',
            JSON.stringify(patternData),
            1.0,
            context.confidence || 0.8,
            JSON.stringify(context.issue),
            JSON.stringify(context.solution),
            new Date().toISOString()
        );

        return successId;
    }

    async storeFailurePattern(context) {
        const failureId = crypto.randomUUID();
        
        const insertFailure = this.db.prepare(`
            INSERT INTO learning_patterns (
                pattern_type, pattern_data, success_rate, confidence_score,
                issue_characteristics, solution_approach, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const patternData = {
            issue: {
                complexity: context.issue.complexity,
                category: context.issue.category,
                languages: context.issue.languages,
                frameworks: context.issue.frameworks
            },
            attempted_solution: {
                agents: context.agents.map(a => a.type),
                tools: context.toolsUsed,
                duration: context.duration,
                approach: context.approach
            },
            error: {
                message: context.error.message,
                stack: context.error.stack,
                phase: context.error.phase
            }
        };

        insertFailure.run(
            'failure_pattern',
            JSON.stringify(patternData),
            0.0,
            context.confidence || 0.3,
            JSON.stringify(context.issue),
            JSON.stringify(context.attemptedSolution),
            new Date().toISOString()
        );

        return failureId;
    }

    async updateNeuralNetwork(context, success) {
        try {
            // Create feature vectors from context
            const features = this.createFeatureVectors(context);

            // Update weights based on success/failure
            await this.updateWeights(features, success);

            // Update biases
            await this.updateBiases(context, success);

            // Record learning iteration
            this.neuralNetwork.learning_history.push({
                timestamp: Date.now(),
                session_id: context.sessionId,
                success: success,
                features: features,
                learning_rate: this.learningRate
            });

            // Limit history size
            if (this.neuralNetwork.learning_history.length > 1000) {
                this.neuralNetwork.learning_history = this.neuralNetwork.learning_history.slice(-500);
            }

            this.logger.info(`Neural network updated with ${success ? 'success' : 'failure'} data`);

        } catch (error) {
            this.logger.error('Error updating neural network:', error);
            throw error;
        }
    }

    createFeatureVectors(context) {
        // Create numerical feature vectors from context
        const features = {
            complexity: this.complexityToNumber(context.issue.complexity),
            category: this.categoryToVector(context.issue.category),
            languages: this.languagesToVector(context.issue.languages),
            frameworks: this.frameworksToVector(context.issue.frameworks),
            agents: this.agentsToVector(context.agents),
            tools: this.toolsToVector(context.toolsUsed),
            duration: this.normalizeDuration(context.duration),
            priority: this.priorityToNumber(context.issue.priority)
        };

        return features;
    }

    complexityToNumber(complexity) {
        const mapping = { low: 0.3, medium: 0.7, high: 1.0 };
        return mapping[complexity] || 0.5;
    }

    categoryToVector(category) {
        const categories = ['bug', 'feature', 'documentation', 'security', 'performance', 'testing'];
        const vector = new Array(categories.length).fill(0);
        const index = categories.indexOf(category);
        if (index !== -1) vector[index] = 1;
        return vector;
    }

    languagesToVector(languages) {
        const supportedLanguages = ['javascript', 'python', 'java', 'csharp', 'go', 'rust'];
        const vector = new Array(supportedLanguages.length).fill(0);
        languages.forEach(lang => {
            const index = supportedLanguages.indexOf(lang);
            if (index !== -1) vector[index] = 1;
        });
        return vector;
    }

    frameworksToVector(frameworks) {
        const supportedFrameworks = ['react', 'vue', 'angular', 'express', 'django', 'spring'];
        const vector = new Array(supportedFrameworks.length).fill(0);
        frameworks.forEach(framework => {
            const index = supportedFrameworks.indexOf(framework);
            if (index !== -1) vector[index] = 1;
        });
        return vector;
    }

    agentsToVector(agents) {
        const agentTypes = ['coordinator', 'architect', 'coder', 'tester', 'security', 'documenter'];
        const vector = new Array(agentTypes.length).fill(0);
        agents.forEach(agent => {
            const index = agentTypes.indexOf(agent.type);
            if (index !== -1) vector[index] = 1;
        });
        return vector;
    }

    toolsToVector(tools) {
        // Create binary vector for top 20 most used tools
        const topTools = [
            'file_read', 'file_write', 'code_parse', 'test_run', 'github_commit',
            'code_lint', 'test_generate', 'memory_store', 'code_review', 'github_pr_create',
            'security_scan', 'code_format', 'neural_analyze', 'workflow_create', 'db_query',
            'performance_test', 'code_metrics', 'file_search', 'dependency_analyze', 'system_optimize'
        ];
        
        const vector = new Array(topTools.length).fill(0);
        tools.forEach(tool => {
            const index = topTools.indexOf(tool);
            if (index !== -1) vector[index] = 1;
        });
        return vector;
    }

    normalizeDuration(duration) {
        // Normalize duration to 0-1 range (max 1 hour)
        const maxDuration = 3600000; // 1 hour in milliseconds
        return Math.min(duration / maxDuration, 1.0);
    }

    priorityToNumber(priority) {
        const mapping = { low: 0.3, medium: 0.7, high: 1.0 };
        return mapping[priority] || 0.5;
    }

    async updateWeights(features, success) {
        // Update neural network weights using gradient descent
        const target = success ? 1.0 : 0.0;
        const prediction = this.predict(features);
        const error = target - prediction;

        // Update weights for each feature type
        Object.entries(features).forEach(([featureType, featureValue]) => {
            if (!this.neuralNetwork.weights.issue_patterns.has(featureType)) {
                this.neuralNetwork.weights.issue_patterns.set(featureType, 0.5);
            }

            const currentWeight = this.neuralNetwork.weights.issue_patterns.get(featureType);
            const gradient = error * this.sigmoid(featureValue);
            const newWeight = currentWeight + (this.learningRate * gradient);

            this.neuralNetwork.weights.issue_patterns.set(featureType, newWeight);
        });
    }

    async updateBiases(context, success) {
        // Update biases based on success/failure patterns
        const adjustment = success ? 0.001 : -0.001;

        this.neuralNetwork.biases.complexity_bias += adjustment;
        this.neuralNetwork.biases.language_bias += adjustment;
        this.neuralNetwork.biases.category_bias += adjustment;

        // Clamp biases to reasonable range
        Object.keys(this.neuralNetwork.biases).forEach(bias => {
            this.neuralNetwork.biases[bias] = Math.max(-0.5, Math.min(0.5, this.neuralNetwork.biases[bias]));
        });
    }

    predict(features) {
        // Make prediction using current neural network
        let prediction = 0.0;

        Object.entries(features).forEach(([featureType, featureValue]) => {
            const weight = this.neuralNetwork.weights.issue_patterns.get(featureType) || 0.5;
            prediction += weight * this.sigmoid(featureValue);
        });

        // Apply biases
        prediction += this.neuralNetwork.biases.complexity_bias;
        prediction += this.neuralNetwork.biases.language_bias;
        prediction += this.neuralNetwork.biases.category_bias;

        return this.sigmoid(prediction);
    }

    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    async suggestSolution(newIssue) {
        try {
            this.logger.info(`Suggesting solution for issue: ${newIssue.title}`);

            // Find similar issues from learning patterns
            const similarIssues = await this.findSimilarIssues(newIssue);

            if (similarIssues.length === 0) {
                this.logger.info('No similar issues found, using default approach');
                return null;
            }

            // Create prediction based on similar issues
            const prediction = await this.createPrediction(similarIssues, newIssue);

            // Validate prediction confidence
            if (prediction.confidence < this.confidenceThreshold) {
                this.logger.info(`Prediction confidence ${prediction.confidence} below threshold ${this.confidenceThreshold}`);
                return null;
            }

            this.logger.info(`Generated solution suggestion with ${prediction.confidence}% confidence`);
            return prediction;

        } catch (error) {
            this.logger.error('Error suggesting solution:', error);
            throw error;
        }
    }

    async findSimilarIssues(newIssue) {
        // Find similar issues using vector similarity
        const similarIssues = this.db.prepare(`
            SELECT * FROM learning_patterns 
            WHERE pattern_type = 'success_pattern'
            AND success_rate > 0.7
            ORDER BY confidence_score DESC, usage_count DESC
            LIMIT 10
        `).all();

        // Calculate similarity scores
        const newIssueFeatures = this.createFeatureVectors({
            issue: newIssue,
            agents: [],
            toolsUsed: [],
            duration: 0
        });

        const scored = similarIssues.map(issue => {
            const issueData = JSON.parse(issue.pattern_data);
            const issueFeatures = this.createFeatureVectors({
                issue: issueData.issue,
                agents: issueData.solution.agents,
                toolsUsed: issueData.solution.tools,
                duration: issueData.solution.duration
            });

            const similarity = this.calculateSimilarity(newIssueFeatures, issueFeatures);
            
            return {
                ...issue,
                similarity: similarity,
                issue_data: issueData
            };
        });

        return scored
            .filter(issue => issue.similarity > 0.6)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 5);
    }

    calculateSimilarity(features1, features2) {
        // Calculate cosine similarity between feature vectors
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        Object.keys(features1).forEach(key => {
            if (features2[key] !== undefined) {
                const val1 = Array.isArray(features1[key]) ? features1[key].reduce((a, b) => a + b, 0) : features1[key];
                const val2 = Array.isArray(features2[key]) ? features2[key].reduce((a, b) => a + b, 0) : features2[key];
                
                dotProduct += val1 * val2;
                norm1 += val1 * val1;
                norm2 += val2 * val2;
            }
        });

        if (norm1 === 0 || norm2 === 0) return 0;
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    async createPrediction(similarIssues, newIssue) {
        // Create prediction based on similar successful issues
        const prediction = {
            suggestedAgents: [],
            suggestedTools: [],
            estimatedDuration: 0,
            confidence: 0,
            reasoning: []
        };

        // Aggregate suggestions from similar issues
        const agentCounts = new Map();
        const toolCounts = new Map();
        let totalDuration = 0;
        let totalConfidence = 0;

        similarIssues.forEach(issue => {
            const data = issue.issue_data;
            
            // Count agent types
            data.solution.agents.forEach(agent => {
                agentCounts.set(agent, (agentCounts.get(agent) || 0) + issue.similarity);
            });

            // Count tools
            data.solution.tools.forEach(tool => {
                toolCounts.set(tool, (toolCounts.get(tool) || 0) + issue.similarity);
            });

            totalDuration += data.solution.duration * issue.similarity;
            totalConfidence += issue.confidence_score * issue.similarity;
        });

        // Generate suggestions
        const totalSimilarity = similarIssues.reduce((sum, issue) => sum + issue.similarity, 0);

        // Top agents
        prediction.suggestedAgents = Array.from(agentCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([agent, score]) => ({
                type: agent,
                confidence: score / totalSimilarity,
                priority: score > totalSimilarity * 0.7 ? 'high' : 'medium'
            }));

        // Top tools
        prediction.suggestedTools = Array.from(toolCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tool, score]) => ({
                name: tool,
                confidence: score / totalSimilarity
            }));

        // Estimated duration
        prediction.estimatedDuration = Math.round(totalDuration / totalSimilarity);

        // Overall confidence
        prediction.confidence = Math.round((totalConfidence / totalSimilarity) * 100);

        // Reasoning
        prediction.reasoning = similarIssues.map(issue => ({
            similarity: Math.round(issue.similarity * 100),
            pattern: issue.issue_data.issue.category,
            success_rate: issue.success_rate
        }));

        return prediction;
    }

    async generateInsights(context, success) {
        // Generate insights from success/failure patterns
        const insights = {
            pattern_type: success ? 'success' : 'failure',
            key_factors: [],
            recommendations: [],
            confidence: 0
        };

        // Analyze key factors
        if (success) {
            insights.key_factors = [
                `Complexity: ${context.issue.complexity}`,
                `Category: ${context.issue.category}`,
                `Agents used: ${context.agents.map(a => a.type).join(', ')}`,
                `Duration: ${Math.round(context.duration / 1000)}s`,
                `Tools: ${context.toolsUsed.length} tools used`
            ];

            insights.recommendations = [
                'Similar issues can use the same agent configuration',
                'Tool selection pattern proved effective',
                'Duration was within expected range'
            ];
        } else {
            insights.key_factors = [
                `Error phase: ${context.error.phase}`,
                `Error type: ${context.error.message}`,
                `Attempted agents: ${context.agents.map(a => a.type).join(', ')}`,
                `Duration before failure: ${Math.round(context.duration / 1000)}s`
            ];

            insights.recommendations = [
                'Consider different agent configuration',
                'Review tool selection strategy',
                'Add additional error handling'
            ];
        }

        insights.confidence = context.confidence || (success ? 0.8 : 0.3);

        return insights;
    }

    async storeInsights(insights, patternId) {
        // Store insights in database for future reference
        const insertInsights = this.db.prepare(`
            INSERT INTO neural_training_data (
                input_data, expected_output, actual_output, accuracy_score
            ) VALUES (?, ?, ?, ?)
        `);

        insertInsights.run(
            JSON.stringify(insights.key_factors),
            JSON.stringify(insights.recommendations),
            JSON.stringify(insights),
            insights.confidence
        );
    }

    async suggestImprovements(context) {
        // Suggest improvements based on failure analysis
        const improvements = [];

        if (context.error.phase === 'agent_spawn') {
            improvements.push('Consider using different agent types');
            improvements.push('Check agent resource requirements');
        }

        if (context.error.phase === 'tool_selection') {
            improvements.push('Review tool compatibility');
            improvements.push('Consider alternative tool combinations');
        }

        if (context.error.phase === 'execution') {
            improvements.push('Add more error handling');
            improvements.push('Increase timeout values');
        }

        return improvements;
    }

    async updateLearningMetrics(success) {
        // Update learning metrics
        this.learningMetrics.total_sessions++;
        this.learningMetrics.learning_iterations++;

        if (success) {
            this.learningMetrics.successful_sessions++;
        } else {
            this.learningMetrics.failed_sessions++;
        }

        // Calculate success rate
        const successRate = this.learningMetrics.successful_sessions / this.learningMetrics.total_sessions;

        // Update metrics in database
        const updateMetrics = this.db.prepare(`
            INSERT OR REPLACE INTO optimization_metrics (
                metric_type, metric_value, optimization_target, timestamp
            ) VALUES (?, ?, ?, ?)
        `);

        updateMetrics.run('success_rate', successRate, 'learning_optimization', new Date().toISOString());
        updateMetrics.run('total_sessions', this.learningMetrics.total_sessions, 'learning_optimization', new Date().toISOString());
        updateMetrics.run('learning_iterations', this.learningMetrics.learning_iterations, 'learning_optimization', new Date().toISOString());

        this.learningMetrics.last_updated = Date.now();
    }

    async getLearningStats() {
        // Get comprehensive learning statistics
        const stats = {
            ...this.learningMetrics,
            neural_network: {
                weights_count: this.neuralNetwork.weights.issue_patterns.size,
                learning_history_size: this.neuralNetwork.learning_history.length,
                biases: this.neuralNetwork.biases
            },
            pattern_stats: this.db.prepare(`
                SELECT 
                    pattern_type,
                    COUNT(*) as count,
                    AVG(confidence_score) as avg_confidence,
                    AVG(success_rate) as avg_success_rate
                FROM learning_patterns
                GROUP BY pattern_type
            `).all()
        };

        return stats;
    }
}

module.exports = LearningSystem;
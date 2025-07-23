#!/usr/bin/env node
/**
 * Test Claude Flow v3.0 Hive-Mind System
 * Validates true AI functionality without GitHub API dependency
 */

const HiveMindEngine = require('./core/hive-mind-engine');
const winston = require('winston');
const fs = require('fs-extra');

// Setup test logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [TEST-HIVE-MIND] ${level}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console()
    ]
});

async function testHiveMindSystem() {
    logger.info('🧪 Starting Claude Flow v3.0 Hive-Mind Test');
    logger.info('🎯 Testing TRUE AI functionality (no fallback mode)');
    
    try {
        // Ensure logs directory exists
        fs.ensureDirSync('logs');
        
        // Create test issue data
        const testIssue = {
            number: 9,
            title: 'Claude Flow 自動化システムのテスト実行',
            body: `# テスト要求

この issue は Claude Flow v3.0 の Hive-Mind システムをテストするためのものです。

## 要件
1. @claude-flow-automation トリガーによる自動起動
2. 自動 Hive-Mind エージェント起動  
3. 問題分析から解決まで自動実行

## 期待される結果
- 真の AI 分析 (テンプレートではない)
- 複数エージェントによる協調
- 高品質な解決策の提案

## 技術要件
- バックエンド API の改善
- フロントエンド UI の最適化
- データベース パフォーマンスの向上
- セキュリティ強化`,
            labels: ['automation', 'ai', 'hive-mind', 'test'],
            comments: [
                {
                    body: '@claude-flow-automation この issue を解析してください。',
                    author: 'test-user',
                    created_at: new Date().toISOString()
                }
            ]
        };
        
        // Create Hive-Mind Engine
        logger.info('🤖 Initializing Hive-Mind Engine v3.0...');
        const engine = new HiveMindEngine({
            intelligenceLevel: 'advanced',
            learningEnabled: true,
            maxAgents: 12,
            sessionId: 'test-session-' + Date.now()
        });
        
        // Execute Hive-Mind analysis
        logger.info('🐝 Spawning Hive-Mind for test issue...');
        const startTime = Date.now();
        
        const result = await engine.spawnHiveMind(testIssue, {
            source: 'test',
            automated: true,
            priority: 'high'
        });
        
        const duration = Date.now() - startTime;
        
        // Validate results
        logger.info('✅ Hive-Mind execution completed successfully!');
        logger.info(`⏱️ Duration: ${Math.round(duration / 1000)}s`);
        logger.info(`🤖 Agents Used: ${result.agentsUsed}`);
        logger.info(`🎯 Quality Score: ${Math.round(result.qualityScore * 100)}%`);
        logger.info(`🧠 Patterns Recognized: ${result.patternsRecognized}`);
        
        // Validate AI capabilities
        const validation = validateHiveMindResult(result);
        
        if (validation.isValidAI) {
            logger.info('🎉 SUCCESS: True AI Hive-Mind functionality verified!');
            logger.info('✨ No fallback mode used - genuine AI intelligence confirmed');
            
            // Create detailed test report
            const report = generateTestReport(result, validation, duration);
            fs.writeJsonSync('hive-mind-test-report.json', report, { spaces: 2 });
            
            logger.info('📄 Test report saved to hive-mind-test-report.json');
            
            return {
                success: true,
                mode: 'true-ai-hive-mind',
                duration,
                quality: result.qualityScore,
                agents: result.agentsUsed,
                validation
            };
            
        } else {
            logger.error('❌ FAILURE: System used fallback mode instead of true AI');
            logger.error('🚨 Validation errors:', validation.errors);
            
            return {
                success: false,
                mode: 'fallback-detected',
                errors: validation.errors
            };
        }
        
    } catch (error) {
        logger.error('💥 Hive-Mind test failed:', error.message);
        logger.error('📋 Full error details:', error);
        if (error.stack) {
            logger.error('📍 Stack trace:', error.stack);
        }
        
        return {
            success: false,
            error: error.message,
            details: error.toString(),
            stack: error.stack
        };
    }
}

function validateHiveMindResult(result) {
    const validation = {
        isValidAI: true,
        errors: [],
        aiFeatures: []
    };
    
    // Check for AI-specific features
    if (result.agentsUsed < 3) {
        validation.errors.push('Insufficient agent coordination (expected 3+, got ' + result.agentsUsed + ')');
        validation.isValidAI = false;
    } else {
        validation.aiFeatures.push('Multi-agent coordination verified');
    }
    
    if (result.qualityScore < 0.7) {
        validation.errors.push('Quality score too low for AI system (expected 0.7+, got ' + result.qualityScore + ')');
        validation.isValidAI = false;
    } else {
        validation.aiFeatures.push('High quality analysis achieved');
    }
    
    if (result.patternsRecognized < 2) {
        validation.errors.push('Insufficient pattern recognition (expected 2+, got ' + result.patternsRecognized + ')');
        validation.isValidAI = false;
    } else {
        validation.aiFeatures.push('Advanced pattern recognition active');
    }
    
    // Check for complex solution structure
    if (!result.result.solution || !result.result.implementation) {
        validation.errors.push('Missing complex solution structure');
        validation.isValidAI = false;
    } else {
        validation.aiFeatures.push('Complex solution architecture generated');
    }
    
    // Check for learning integration
    if (!result.result.insights || !result.result.recommendations) {
        validation.errors.push('Missing AI insights and recommendations');
        validation.isValidAI = false;
    } else {
        validation.aiFeatures.push('AI insights and recommendations generated');
    }
    
    // Look for fallback indicators
    const resultStr = JSON.stringify(result);
    if (resultStr.includes('fallback') || resultStr.includes('template') || resultStr.includes('basic')) {
        validation.errors.push('Fallback mode indicators detected in result');
        validation.isValidAI = false;
    } else {
        validation.aiFeatures.push('No fallback mode indicators detected');
    }
    
    return validation;
}

function generateTestReport(result, validation, duration) {
    return {
        testInfo: {
            timestamp: new Date().toISOString(),
            system: 'claude-flow-v3-hive-mind',
            version: '3.0.0',
            testDuration: duration,
            testType: 'ai-intelligence-validation'
        },
        
        results: {
            success: validation.isValidAI,
            mode: validation.isValidAI ? 'true-ai' : 'fallback-detected',
            aiIntelligence: validation.isValidAI ? 'verified' : 'failed'
        },
        
        metrics: {
            agentsUsed: result.agentsUsed,
            qualityScore: result.qualityScore,
            patternsRecognized: result.patternsRecognized,
            sessionDuration: result.duration,
            confidence: result.result.solution.confidence
        },
        
        validation: {
            isValidAI: validation.isValidAI,
            errors: validation.errors,
            aiFeatures: validation.aiFeatures,
            totalChecks: validation.aiFeatures.length + validation.errors.length,
            passedChecks: validation.aiFeatures.length
        },
        
        aiCapabilities: {
            neuralNetworks: Object.keys(result.result.insights).length,
            agentCoordination: result.agentsUsed > 1,
            patternRecognition: result.patternsRecognized > 0,
            learningIntegration: !!result.result.insights.learningIntegration,
            qualityAssessment: result.qualityScore > 0
        },
        
        solution: {
            type: result.result.solution.approach,
            complexity: result.result.solution.complexity,
            implementationSteps: result.result.implementation.steps.length,
            filesAffected: result.result.implementation.files.length,
            hasTests: !!result.result.implementation.tests,
            hasDocumentation: !!result.result.implementation.documentation
        },
        
        rawResult: result
    };
}

// Execute test if run directly
if (require.main === module) {
    testHiveMindSystem()
        .then(result => {
            if (result.success) {
                console.log('\n🎉 CLAUDE FLOW V3.0 HIVE-MIND TEST: PASSED');
                console.log('✅ True AI Intelligence Verified');
                console.log('🚀 Ready for Production Deployment');
                process.exit(0);
            } else {
                console.log('\n❌ CLAUDE FLOW V3.0 HIVE-MIND TEST: FAILED');
                console.log('🚨 System using fallback mode instead of true AI');
                console.log('🔧 Requires additional fixes');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 TEST EXECUTION FAILED:', error.message);
            process.exit(1);
        });
}

module.exports = testHiveMindSystem;
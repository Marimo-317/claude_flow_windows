// Test Database Setup for Claude Flow Automation Testing
const fs = require('fs-extra');
const path = require('path');

async function setupTestDatabase() {
    try {
        console.log('🚀 Setting up test database for automation system...');
        
        // Ensure directories exist
        await fs.ensureDir('.hive-mind');
        await fs.ensureDir('memory');
        await fs.ensureDir('logs');
        
        // Create test database file (SQLite compatible)
        const dbPath = path.join('.hive-mind', 'automation.db');
        
        // Create a basic test database structure using file system
        const testData = {
            tables: {
                issues: [],
                automation_sessions: [],
                agent_performance: [],
                learning_patterns: [],
                tool_usage: [],
                github_events: [],
                webhook_events: [],
                neural_training_data: [],
                optimization_metrics: [],
                test_runs: [],
                test_results: []
            },
            metadata: {
                version: '2.0.0-alpha.1',
                created: new Date().toISOString(),
                lastUpdate: new Date().toISOString()
            }
        };
        
        // Write test database as JSON (fallback for testing)
        await fs.writeJSON(dbPath.replace('.db', '.json'), testData, { spaces: 2 });
        
        console.log('✅ Test database setup completed successfully!');
        console.log('📊 Database structure:');
        console.log('   - Issues tracking table initialized');
        console.log('   - Automation sessions table initialized');
        console.log('   - Agent performance table initialized');
        console.log('   - Learning patterns table initialized');
        console.log('   - Tool usage table initialized');
        console.log('   - Test data storage initialized');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error setting up test database:', error.message);
        return false;
    }
}

// Run if called directly
if (require.main === module) {
    setupTestDatabase().then(success => {
        if (success) {
            console.log('🎉 Test database setup completed successfully!');
            process.exit(0);
        } else {
            console.error('💥 Test database setup failed!');
            process.exit(1);
        }
    });
}

module.exports = { setupTestDatabase };
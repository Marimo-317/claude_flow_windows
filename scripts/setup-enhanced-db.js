// Enhanced Database Schema Setup for Claude Flow Automation
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs-extra');

async function setupEnhancedDatabase() {
    try {
        // Ensure directories exist
        await fs.ensureDir('.hive-mind');
        await fs.ensureDir('memory');
        
        // Create enhanced automation database
        const dbPath = path.join('.hive-mind', 'automation.db');
        const db = new Database(dbPath);
        
        console.log('🚀 Setting up enhanced database schema...');
        
        // Execute enhanced schema
        db.exec(`
            -- Issue Tracking and Analysis
            CREATE TABLE IF NOT EXISTS issues (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                github_id INTEGER UNIQUE,
                number INTEGER,
                title TEXT,
                body TEXT,
                labels TEXT,
                state TEXT,
                complexity_score INTEGER,
                estimated_duration INTEGER,
                language_detected TEXT,
                framework_detected TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                resolved_at DATETIME,
                resolution_time INTEGER
            );
            
            -- Agent Performance Tracking
            CREATE TABLE IF NOT EXISTS agent_performance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id TEXT,
                agent_type TEXT,
                task_type TEXT,
                issue_id INTEGER,
                success_rate REAL,
                completion_time INTEGER,
                quality_score REAL,
                tools_used TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (issue_id) REFERENCES issues(id)
            );
            
            -- Learning Patterns Storage
            CREATE TABLE IF NOT EXISTS learning_patterns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pattern_type TEXT,
                pattern_data TEXT,
                success_rate REAL,
                usage_count INTEGER DEFAULT 1,
                confidence_score REAL,
                issue_characteristics TEXT,
                solution_approach TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Tool Usage Analytics
            CREATE TABLE IF NOT EXISTS tool_usage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tool_name TEXT,
                tool_category TEXT,
                task_type TEXT,
                success_rate REAL,
                avg_execution_time INTEGER,
                error_rate REAL,
                usage_count INTEGER DEFAULT 1,
                last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
                performance_score REAL
            );
            
            -- Automation Sessions
            CREATE TABLE IF NOT EXISTS automation_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT UNIQUE,
                issue_id INTEGER,
                status TEXT,
                agents_spawned TEXT,
                tools_used TEXT,
                start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                end_time DATETIME,
                success BOOLEAN,
                error_message TEXT,
                metrics TEXT,
                FOREIGN KEY (issue_id) REFERENCES issues(id)
            );
            
            -- GitHub Integration Log
            CREATE TABLE IF NOT EXISTS github_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT,
                event_data TEXT,
                processed BOOLEAN DEFAULT FALSE,
                processing_time INTEGER,
                result TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Neural Network Training Data
            CREATE TABLE IF NOT EXISTS neural_training_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                input_data TEXT,
                expected_output TEXT,
                actual_output TEXT,
                training_epoch INTEGER,
                loss_score REAL,
                accuracy_score REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            -- System Optimization Metrics
            CREATE TABLE IF NOT EXISTS optimization_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_type TEXT,
                metric_value REAL,
                optimization_target TEXT,
                improvement_percentage REAL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Webhook Events Log
            CREATE TABLE IF NOT EXISTS webhook_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id TEXT,
                event_type TEXT,
                payload TEXT,
                signature TEXT,
                processed BOOLEAN DEFAULT FALSE,
                processing_duration INTEGER,
                status TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Create indexes for better performance
            CREATE INDEX IF NOT EXISTS idx_issues_github_id ON issues(github_id);
            CREATE INDEX IF NOT EXISTS idx_issues_state ON issues(state);
            CREATE INDEX IF NOT EXISTS idx_issues_complexity ON issues(complexity_score);
            CREATE INDEX IF NOT EXISTS idx_agent_performance_type ON agent_performance(agent_type);
            CREATE INDEX IF NOT EXISTS idx_learning_patterns_type ON learning_patterns(pattern_type);
            CREATE INDEX IF NOT EXISTS idx_tool_usage_name ON tool_usage(tool_name);
            CREATE INDEX IF NOT EXISTS idx_automation_sessions_status ON automation_sessions(status);
            CREATE INDEX IF NOT EXISTS idx_github_events_processed ON github_events(processed);
            CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
        `);
        
        // Insert initial system data
        const insertSystemData = db.prepare(`
            INSERT OR REPLACE INTO optimization_metrics (metric_type, metric_value, optimization_target) 
            VALUES (?, ?, ?)
        `);
        
        insertSystemData.run('system_init', 1.0, 'initialization');
        insertSystemData.run('neural_learning_rate', 0.01, 'learning_optimization');
        insertSystemData.run('max_concurrent_agents', 5, 'resource_optimization');
        insertSystemData.run('success_rate_target', 0.90, 'quality_optimization');
        
        // Insert initial tool categories
        const insertToolData = db.prepare(`
            INSERT OR REPLACE INTO tool_usage (tool_name, tool_category, success_rate, performance_score) 
            VALUES (?, ?, ?, ?)
        `);
        
        const toolCategories = [
            ['file_operations', 'system', 0.95, 0.9],
            ['code_analysis', 'development', 0.88, 0.85],
            ['testing', 'quality', 0.92, 0.87],
            ['github_integration', 'integration', 0.85, 0.82],
            ['neural_networks', 'ai', 0.78, 0.75],
            ['memory_management', 'system', 0.94, 0.91],
            ['workflow_automation', 'automation', 0.87, 0.84]
        ];
        
        toolCategories.forEach(([name, category, success, performance]) => {
            insertToolData.run(name, category, success, performance);
        });
        
        // Verify database setup
        const counts = {
            issues: db.prepare('SELECT COUNT(*) as count FROM issues').get().count,
            patterns: db.prepare('SELECT COUNT(*) as count FROM learning_patterns').get().count,
            tools: db.prepare('SELECT COUNT(*) as count FROM tool_usage').get().count,
            metrics: db.prepare('SELECT COUNT(*) as count FROM optimization_metrics').get().count
        };
        
        console.log('✅ Enhanced database schema created successfully!');
        console.log('📊 Database verification:');
        console.log(`   - Issues table: ${counts.issues} entries`);
        console.log(`   - Learning patterns: ${counts.patterns} entries`);
        console.log(`   - Tool usage: ${counts.tools} entries`);
        console.log(`   - Optimization metrics: ${counts.metrics} entries`);
        
        db.close();
        return true;
        
    } catch (error) {
        console.error('❌ Error setting up enhanced database:', error.message);
        return false;
    }
}

// Run if called directly
if (require.main === module) {
    setupEnhancedDatabase().then(success => {
        if (success) {
            console.log('🎉 Database setup completed successfully!');
            process.exit(0);
        } else {
            console.error('💥 Database setup failed!');
            process.exit(1);
        }
    });
}

module.exports = { setupEnhancedDatabase };
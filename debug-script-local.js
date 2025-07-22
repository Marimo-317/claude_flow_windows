#!/usr/bin/env node
// Local debug test for the hybrid automation script

const path = require('path');

// Set up mock environment
process.env.GITHUB_TOKEN = 'mock_token_for_testing';
process.env.REPOSITORY = 'Marimo-317/claude_flow_windows';
process.env.ISSUE_NUMBER = '4';
process.env.ISSUE_TITLE = 'Test Issue for Calculation Bug';
process.env.ISSUE_BODY = 'Simple calculation function needs fixing.';

console.log('🧪 Local Debug Test - Hybrid Automation Script');
console.log('======================================================');

// Test argument parsing first
process.argv = [
    'node',
    'debug-script-local.js',
    '--issue-number', '4',
    '--issue-title', 'Test Issue',
    '--issue-body', 'Test body', 
    '--repository', 'Marimo-317/claude_flow_windows'
];

try {
    console.log('1️⃣ Testing script import...');
    const HybridAutomation = require('./scripts/claude-flow-hybrid-automation.js');
    console.log('✅ Script imported successfully');
    
    console.log('\n2️⃣ Testing class instantiation...');
    const automation = new HybridAutomation();
    console.log('✅ Class instantiated successfully');
    console.log('📋 Parsed arguments:', automation.args);
    
    console.log('\n3️⃣ Testing argument validation...');
    if (!automation.args['issue-number']) {
        throw new Error('Issue number not parsed correctly');
    }
    console.log('✅ Arguments parsed correctly');
    
    console.log('\n4️⃣ Testing claude-flow initialization attempt...');
    
    // Mock the initialization test
    automation.initializeClaudeFlow().then(initialized => {
        console.log(`🔧 Claude Flow initialized: ${initialized}`);
        
        if (initialized) {
            console.log('✅ Would use full Hive-Mind automation');
        } else {
            console.log('⚠️ Would use fallback automation');
        }
        
        console.log('\n📊 Debug Test Results:');
        console.log('- Script syntax: ✅ Valid');
        console.log('- Class creation: ✅ Success');  
        console.log('- Argument parsing: ✅ Working');
        console.log('- Environment setup: ✅ Configured');
        console.log(`- Claude-flow init: ${initialized ? '✅ Working' : '⚠️ Fallback mode'}`);
        
        console.log('\n🎯 The script appears to be functioning correctly locally.');
        console.log('The 23-second GitHub Actions failure is likely due to:');
        console.log('- Missing environment variables');
        console.log('- GitHub Actions environment differences');
        console.log('- Dependency installation issues');
        console.log('- Authentication problems');
        
    }).catch(error => {
        console.error('❌ Initialization test failed:', error.message);
    });
    
} catch (error) {
    console.error('❌ Debug test failed:', error.message);
    console.error('Stack:', error.stack);
    
    console.log('\n🔍 Common issues to check:');
    console.log('- Missing dependencies in package.json');
    console.log('- Syntax errors in the script');
    console.log('- Incorrect require() statements');
    console.log('- Environment variable issues');
}
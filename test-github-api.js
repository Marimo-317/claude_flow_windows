#!/usr/bin/env node
// Direct GitHub API test to trigger automation on Issue #4

const { Octokit } = require('@octokit/rest');

async function triggerAutomationOnIssue4() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        console.error('❌ GITHUB_TOKEN environment variable not set');
        console.log('Please set GITHUB_TOKEN with a personal access token');
        process.exit(1);
    }

    const octokit = new Octokit({ auth: token });
    const owner = 'Marimo-317';
    const repo = 'claude_flow_windows';
    const issueNumber = 4;

    try {
        console.log('🚀 Triggering automation on Issue #4...');
        
        const comment = `🧪 **ULTRATHINK Test Execution**

Testing the new claude-flow-hybrid-automation system.

@claude-flow-automation

**Expected Behavior:**
1. ✅ GitHub Actions detects @claude-flow-automation trigger
2. 🔧 Attempts claude-flow@alpha initialization with SQLite workarounds  
3. 🐝 If successful: Uses full Hive-Mind AI capabilities
4. 🔄 If failed: Uses fallback automation with clear limitations
5. 📝 Creates PR with solution
6. 💬 Comments on issue with detailed results

**Test Details:**
- Timestamp: ${new Date().toISOString()}
- Mode: Direct API trigger test
- Expected outcome: Successful automation run or clear failure reason

Let's validate that our hybrid approach resolves the persistent automation failures!`;

        const result = await octokit.rest.issues.createComment({
            owner: owner,
            repo: repo,
            issue_number: issueNumber,
            body: comment
        });

        console.log('✅ Comment posted successfully');
        console.log(`📋 Comment ID: ${result.data.id}`);
        console.log(`🔗 Comment URL: ${result.data.html_url}`);
        
        console.log('\n⏱️  Waiting for GitHub Actions to trigger...');
        console.log('📊 Monitor progress at: https://github.com/Marimo-317/claude_flow_windows/actions');
        console.log('🔍 Check issue updates at: https://github.com/Marimo-317/claude_flow_windows/issues/4');
        
        return result.data;
        
    } catch (error) {
        console.error('❌ Failed to post comment:', error.message);
        if (error.status) {
            console.error(`HTTP Status: ${error.status}`);
        }
        throw error;
    }
}

// Execute if run directly
if (require.main === module) {
    triggerAutomationOnIssue4()
        .then(() => {
            console.log('\n🎯 Test trigger completed successfully!');
            console.log('Now monitoring for automation execution...');
        })
        .catch(error => {
            console.error('\n💥 Test trigger failed:', error.message);
            process.exit(1);
        });
}

module.exports = triggerAutomationOnIssue4;
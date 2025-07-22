#!/usr/bin/env node
// Check GitHub Actions workflow status via API

const { Octokit } = require('@octokit/rest');

async function checkWorkflowStatus() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        console.error('❌ GITHUB_TOKEN environment variable not set');
        process.exit(1);
    }

    const octokit = new Octokit({ auth: token });
    const owner = 'Marimo-317';
    const repo = 'claude_flow_windows';

    try {
        console.log('🔍 Checking recent workflow runs...');
        
        // Get recent workflow runs
        const workflowRuns = await octokit.rest.actions.listWorkflowRunsForRepo({
            owner: owner,
            repo: repo,
            per_page: 10,
            branch: 'main'
        });

        console.log(`📊 Found ${workflowRuns.data.total_count} workflow runs`);
        
        // Find the most recent "Claude Flow Auto Issue Resolver" runs
        const claudeFlowRuns = workflowRuns.data.workflow_runs.filter(run => 
            run.name === 'Claude Flow Auto Issue Resolver'
        );

        if (claudeFlowRuns.length === 0) {
            console.log('❌ No Claude Flow Auto Issue Resolver runs found');
            return;
        }

        console.log('\n🎯 Recent Claude Flow runs:');
        
        for (const run of claudeFlowRuns.slice(0, 3)) {
            console.log(`\n📋 Run #${run.run_number}:`);
            console.log(`   Status: ${run.status}`);
            console.log(`   Conclusion: ${run.conclusion || 'In Progress'}`);
            console.log(`   Created: ${new Date(run.created_at).toLocaleString()}`);
            console.log(`   Duration: ${run.updated_at ? Math.round((new Date(run.updated_at) - new Date(run.created_at)) / 1000) : 'N/A'} seconds`);
            console.log(`   URL: ${run.html_url}`);
            console.log(`   Head SHA: ${run.head_sha.substring(0, 7)}`);
            
            // Get detailed job information
            try {
                const jobs = await octokit.rest.actions.listJobsForWorkflowRun({
                    owner: owner,
                    repo: repo,
                    run_id: run.id
                });

                console.log(`   Jobs: ${jobs.data.jobs.length}`);
                for (const job of jobs.data.jobs) {
                    console.log(`   - ${job.name}: ${job.status} (${job.conclusion || 'running'})`);
                    if (job.conclusion === 'failure') {
                        console.log(`     ❌ Failed at: ${new Date(job.completed_at).toLocaleString()}`);
                    }
                }
            } catch (error) {
                console.log(`   ⚠️ Could not fetch job details: ${error.message}`);
            }
        }

        // Check for any recent issues/comments that might have triggered runs
        console.log('\n🔍 Checking recent issue activity...');
        
        const issue4 = await octokit.rest.issues.get({
            owner: owner,
            repo: repo,
            issue_number: 4
        });

        const comments = await octokit.rest.issues.listComments({
            owner: owner,
            repo: repo,
            issue_number: 4,
            per_page: 5
        });

        console.log(`\n📝 Issue #4 status: ${issue4.data.state}`);
        console.log(`💬 Recent comments: ${comments.data.length > 5 ? '5+' : comments.data.length}`);
        
        const recentComments = comments.data.slice(-3);
        for (const comment of recentComments) {
            console.log(`   - ${new Date(comment.created_at).toLocaleString()}: ${comment.body.substring(0, 100)}...`);
            if (comment.body.includes('@claude-flow-automation')) {
                console.log('     🎯 Contains automation trigger');
            }
        }

    } catch (error) {
        console.error('❌ Failed to check workflow status:', error.message);
        if (error.status) {
            console.error(`HTTP Status: ${error.status}`);
        }
    }
}

if (require.main === module) {
    checkWorkflowStatus();
}

module.exports = checkWorkflowStatus;
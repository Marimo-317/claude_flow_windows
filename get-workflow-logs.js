#!/usr/bin/env node
// Get detailed workflow logs via GitHub API

const { Octokit } = require('@octokit/rest');

async function getWorkflowLogs() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        console.error('❌ GITHUB_TOKEN environment variable not set');
        process.exit(1);
    }

    const octokit = new Octokit({ auth: token });
    const owner = 'Marimo-317';
    const repo = 'claude_flow_windows';
    const runId = 16454150113; // Most recent failed run

    try {
        console.log(`🔍 Getting detailed logs for run #${runId}...`);
        
        // Get run details
        const run = await octokit.rest.actions.getWorkflowRun({
            owner: owner,
            repo: repo,
            run_id: runId
        });

        console.log(`📋 Run Details:`);
        console.log(`   Name: ${run.data.name}`);
        console.log(`   Status: ${run.data.status}`);
        console.log(`   Conclusion: ${run.data.conclusion}`);
        console.log(`   Created: ${new Date(run.data.created_at).toLocaleString()}`);
        console.log(`   Updated: ${new Date(run.data.updated_at).toLocaleString()}`);
        console.log(`   Duration: ${Math.round((new Date(run.data.updated_at) - new Date(run.data.created_at)) / 1000)} seconds`);
        console.log(`   Trigger: ${run.data.triggering_actor?.login || 'Unknown'}`);
        console.log(`   Event: ${run.data.event}`);

        // Get jobs for this run
        const jobs = await octokit.rest.actions.listJobsForWorkflowRun({
            owner: owner,
            repo: repo,
            run_id: runId
        });

        console.log(`\n🎯 Jobs (${jobs.data.jobs.length}):`);
        
        for (const job of jobs.data.jobs) {
            console.log(`\n📊 Job: ${job.name}`);
            console.log(`   Status: ${job.status}`);
            console.log(`   Conclusion: ${job.conclusion}`);
            console.log(`   Started: ${new Date(job.started_at).toLocaleString()}`);
            console.log(`   Completed: ${job.completed_at ? new Date(job.completed_at).toLocaleString() : 'N/A'}`);
            console.log(`   Duration: ${job.started_at && job.completed_at ? Math.round((new Date(job.completed_at) - new Date(job.started_at)) / 1000) : 'N/A'} seconds`);
            
            console.log(`   Steps (${job.steps.length}):`);
            for (const step of job.steps) {
                const status = step.conclusion || step.status;
                const emoji = status === 'success' ? '✅' : status === 'failure' ? '❌' : status === 'skipped' ? '⏭️' : '🔄';
                console.log(`   ${emoji} ${step.name}: ${status}`);
                if (step.started_at && step.completed_at) {
                    const duration = Math.round((new Date(step.completed_at) - new Date(step.started_at)) / 1000);
                    console.log(`      Duration: ${duration} seconds`);
                }
            }
        }

        // Try to get logs (this might not work due to API limitations)
        try {
            console.log('\n📝 Attempting to get log download URL...');
            const logs = await octokit.rest.actions.downloadWorkflowRunLogs({
                owner: owner,
                repo: repo,
                run_id: runId
            });
            console.log(`✅ Logs available at: ${logs.url}`);
        } catch (logError) {
            console.log(`⚠️ Could not get logs: ${logError.message}`);
        }

        console.log('\n🔍 Analysis:');
        const failedSteps = [];
        for (const job of jobs.data.jobs) {
            for (const step of job.steps) {
                if (step.conclusion === 'failure') {
                    failedSteps.push({
                        job: job.name,
                        step: step.name,
                        number: step.number
                    });
                }
            }
        }

        if (failedSteps.length > 0) {
            console.log('❌ Failed Steps:');
            for (const failed of failedSteps) {
                console.log(`   - Job "${failed.job}", Step #${failed.number}: "${failed.step}"`);
            }
        } else {
            console.log('🤔 No specific step failures detected, but run failed overall');
        }

    } catch (error) {
        console.error('❌ Failed to get workflow details:', error.message);
        if (error.status) {
            console.error(`HTTP Status: ${error.status}`);
        }
    }
}

if (require.main === module) {
    getWorkflowLogs();
}

module.exports = getWorkflowLogs;
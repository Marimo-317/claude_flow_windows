// GitHub API Integration for Claude Flow Automation
const { Octokit } = require('@octokit/rest');
const Database = require('better-sqlite3');
const winston = require('winston');
const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

class GitHubAPI {
    constructor() {
        this.octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN,
            baseUrl: process.env.GITHUB_API_URL || 'https://api.github.com'
        });
        
        this.db = new Database('.hive-mind/automation.db');
        this.logger = this.setupLogger();
        
        this.owner = process.env.GITHUB_REPO_OWNER;
        this.repo = process.env.GITHUB_REPO_NAME;
        this.defaultBranch = process.env.GITHUB_BRANCH || 'main';
        
        this.validateConfiguration();
    }

    setupLogger() {
        return winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/github-api.log' }),
                new winston.transports.Console()
            ]
        });
    }

    validateConfiguration() {
        if (!process.env.GITHUB_TOKEN) {
            throw new Error('GITHUB_TOKEN environment variable is required');
        }
        if (!this.owner || !this.repo) {
            throw new Error('GITHUB_REPO_OWNER and GITHUB_REPO_NAME environment variables are required');
        }
        
        this.logger.info(`GitHub API initialized for ${this.owner}/${this.repo}`);
    }

    // Issue Management
    async getIssue(issueNumber) {
        try {
            const response = await this.octokit.rest.issues.get({
                owner: this.owner,
                repo: this.repo,
                issue_number: issueNumber
            });
            
            return response.data;
        } catch (error) {
            this.logger.error(`Error fetching issue ${issueNumber}:`, error);
            throw error;
        }
    }

    async updateIssue(issueNumber, updates) {
        try {
            const response = await this.octokit.rest.issues.update({
                owner: this.owner,
                repo: this.repo,
                issue_number: issueNumber,
                ...updates
            });
            
            this.logger.info(`Issue ${issueNumber} updated successfully`);
            return response.data;
        } catch (error) {
            this.logger.error(`Error updating issue ${issueNumber}:`, error);
            throw error;
        }
    }

    async addIssueComment(issueNumber, body) {
        try {
            const response = await this.octokit.rest.issues.createComment({
                owner: this.owner,
                repo: this.repo,
                issue_number: issueNumber,
                body: body
            });
            
            this.logger.info(`Comment added to issue ${issueNumber}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Error adding comment to issue ${issueNumber}:`, error);
            throw error;
        }
    }

    async addIssueLabels(issueNumber, labels) {
        try {
            const response = await this.octokit.rest.issues.addLabels({
                owner: this.owner,
                repo: this.repo,
                issue_number: issueNumber,
                labels: labels
            });
            
            this.logger.info(`Labels added to issue ${issueNumber}: ${labels.join(', ')}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Error adding labels to issue ${issueNumber}:`, error);
            throw error;
        }
    }

    // Branch Management
    async createBranch(branchName, baseBranch = null) {
        try {
            // Get base branch reference
            const baseRef = baseBranch || this.defaultBranch;
            const baseResponse = await this.octokit.rest.git.getRef({
                owner: this.owner,
                repo: this.repo,
                ref: `heads/${baseRef}`
            });
            
            // Create new branch
            const response = await this.octokit.rest.git.createRef({
                owner: this.owner,
                repo: this.repo,
                ref: `refs/heads/${branchName}`,
                sha: baseResponse.data.object.sha
            });
            
            this.logger.info(`Branch ${branchName} created successfully`);
            return response.data;
        } catch (error) {
            if (error.status === 422) {
                this.logger.warn(`Branch ${branchName} already exists`);
                return await this.getBranch(branchName);
            }
            this.logger.error(`Error creating branch ${branchName}:`, error);
            throw error;
        }
    }

    async getBranch(branchName) {
        try {
            const response = await this.octokit.rest.git.getRef({
                owner: this.owner,
                repo: this.repo,
                ref: `heads/${branchName}`
            });
            
            return response.data;
        } catch (error) {
            this.logger.error(`Error fetching branch ${branchName}:`, error);
            throw error;
        }
    }

    async deleteBranch(branchName) {
        try {
            const response = await this.octokit.rest.git.deleteRef({
                owner: this.owner,
                repo: this.repo,
                ref: `heads/${branchName}`
            });
            
            this.logger.info(`Branch ${branchName} deleted successfully`);
            return response.data;
        } catch (error) {
            this.logger.error(`Error deleting branch ${branchName}:`, error);
            throw error;
        }
    }

    // File Operations
    async getFileContent(filePath, branch = null) {
        try {
            const response = await this.octokit.rest.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path: filePath,
                ref: branch
            });
            
            if (response.data.type === 'file') {
                return {
                    content: Buffer.from(response.data.content, 'base64').toString(),
                    sha: response.data.sha,
                    size: response.data.size
                };
            } else {
                throw new Error(`${filePath} is not a file`);
            }
        } catch (error) {
            this.logger.error(`Error fetching file ${filePath}:`, error);
            throw error;
        }
    }

    async createOrUpdateFile(filePath, content, message, branch = null) {
        try {
            const targetBranch = branch || this.defaultBranch;
            let sha = null;
            
            // Check if file exists
            try {
                const existingFile = await this.getFileContent(filePath, targetBranch);
                sha = existingFile.sha;
            } catch (error) {
                // File doesn't exist, that's okay
            }
            
            const response = await this.octokit.rest.repos.createOrUpdateFileContents({
                owner: this.owner,
                repo: this.repo,
                path: filePath,
                message: message,
                content: Buffer.from(content).toString('base64'),
                branch: targetBranch,
                sha: sha
            });
            
            this.logger.info(`File ${filePath} ${sha ? 'updated' : 'created'} successfully`);
            return response.data;
        } catch (error) {
            this.logger.error(`Error creating/updating file ${filePath}:`, error);
            throw error;
        }
    }

    async deleteFile(filePath, message, branch = null) {
        try {
            const targetBranch = branch || this.defaultBranch;
            const fileData = await this.getFileContent(filePath, targetBranch);
            
            const response = await this.octokit.rest.repos.deleteFile({
                owner: this.owner,
                repo: this.repo,
                path: filePath,
                message: message,
                sha: fileData.sha,
                branch: targetBranch
            });
            
            this.logger.info(`File ${filePath} deleted successfully`);
            return response.data;
        } catch (error) {
            this.logger.error(`Error deleting file ${filePath}:`, error);
            throw error;
        }
    }

    // Commit Operations
    async createCommit(message, files, branch = null) {
        try {
            const targetBranch = branch || this.defaultBranch;
            const commitId = crypto.randomUUID();
            
            // Get latest commit
            const branchData = await this.getBranch(targetBranch);
            const parentSha = branchData.object.sha;
            
            // Create tree
            const tree = await this.createTree(files, parentSha);
            
            // Create commit
            const commit = await this.octokit.rest.git.createCommit({
                owner: this.owner,
                repo: this.repo,
                message: message,
                tree: tree.sha,
                parents: [parentSha],
                author: {
                    name: 'Claude Flow Automation',
                    email: 'automation@claude-flow.ai'
                }
            });
            
            // Update branch reference
            await this.octokit.rest.git.updateRef({
                owner: this.owner,
                repo: this.repo,
                ref: `heads/${targetBranch}`,
                sha: commit.data.sha
            });
            
            this.logger.info(`Commit created successfully: ${commit.data.sha}`);
            return commit.data;
        } catch (error) {
            this.logger.error('Error creating commit:', error);
            throw error;
        }
    }

    async createTree(files, baseTreeSha) {
        const treeItems = [];
        
        for (const file of files) {
            if (file.action === 'create' || file.action === 'update') {
                treeItems.push({
                    path: file.path,
                    mode: '100644',
                    type: 'blob',
                    content: file.content
                });
            } else if (file.action === 'delete') {
                treeItems.push({
                    path: file.path,
                    mode: '100644',
                    type: 'blob',
                    sha: null
                });
            }
        }
        
        const response = await this.octokit.rest.git.createTree({
            owner: this.owner,
            repo: this.repo,
            tree: treeItems,
            base_tree: baseTreeSha
        });
        
        return response.data;
    }

    // Pull Request Operations
    async createPullRequest(title, body, headBranch, baseBranch = null) {
        try {
            const targetBaseBranch = baseBranch || this.defaultBranch;
            
            const response = await this.octokit.rest.pulls.create({
                owner: this.owner,
                repo: this.repo,
                title: title,
                body: body,
                head: headBranch,
                base: targetBaseBranch,
                draft: false
            });
            
            this.logger.info(`Pull request created: #${response.data.number}`);
            return response.data;
        } catch (error) {
            this.logger.error('Error creating pull request:', error);
            throw error;
        }
    }

    async updatePullRequest(prNumber, updates) {
        try {
            const response = await this.octokit.rest.pulls.update({
                owner: this.owner,
                repo: this.repo,
                pull_number: prNumber,
                ...updates
            });
            
            this.logger.info(`Pull request ${prNumber} updated successfully`);
            return response.data;
        } catch (error) {
            this.logger.error(`Error updating pull request ${prNumber}:`, error);
            throw error;
        }
    }

    async addPullRequestComment(prNumber, body) {
        try {
            const response = await this.octokit.rest.issues.createComment({
                owner: this.owner,
                repo: this.repo,
                issue_number: prNumber,
                body: body
            });
            
            this.logger.info(`Comment added to pull request ${prNumber}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Error adding comment to pull request ${prNumber}:`, error);
            throw error;
        }
    }

    async mergePullRequest(prNumber, mergeMethod = 'merge') {
        try {
            const response = await this.octokit.rest.pulls.merge({
                owner: this.owner,
                repo: this.repo,
                pull_number: prNumber,
                merge_method: mergeMethod
            });
            
            this.logger.info(`Pull request ${prNumber} merged successfully`);
            return response.data;
        } catch (error) {
            this.logger.error(`Error merging pull request ${prNumber}:`, error);
            throw error;
        }
    }

    async getPullRequest(prNumber) {
        try {
            const response = await this.octokit.rest.pulls.get({
                owner: this.owner,
                repo: this.repo,
                pull_number: prNumber
            });
            
            return response.data;
        } catch (error) {
            this.logger.error(`Error fetching pull request ${prNumber}:`, error);
            throw error;
        }
    }

    // Repository Operations
    async getRepository() {
        try {
            const response = await this.octokit.rest.repos.get({
                owner: this.owner,
                repo: this.repo
            });
            
            return response.data;
        } catch (error) {
            this.logger.error('Error fetching repository:', error);
            throw error;
        }
    }

    async listRepositoryFiles(path = '', branch = null) {
        try {
            const response = await this.octokit.rest.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path: path,
                ref: branch
            });
            
            return response.data;
        } catch (error) {
            this.logger.error(`Error listing files in ${path}:`, error);
            throw error;
        }
    }

    // Webhook Operations
    async createWebhook(config) {
        try {
            const response = await this.octokit.rest.repos.createWebhook({
                owner: this.owner,
                repo: this.repo,
                name: 'web',
                config: {
                    url: config.url,
                    content_type: 'json',
                    secret: config.secret,
                    insecure_ssl: config.insecure_ssl || '0'
                },
                events: config.events || ['issues', 'pull_request', 'push'],
                active: true
            });
            
            this.logger.info(`Webhook created successfully: ${response.data.id}`);
            return response.data;
        } catch (error) {
            this.logger.error('Error creating webhook:', error);
            throw error;
        }
    }

    async listWebhooks() {
        try {
            const response = await this.octokit.rest.repos.listWebhooks({
                owner: this.owner,
                repo: this.repo
            });
            
            return response.data;
        } catch (error) {
            this.logger.error('Error listing webhooks:', error);
            throw error;
        }
    }

    // Status and Checks
    async createCheckRun(name, headSha, status, conclusion = null) {
        try {
            const response = await this.octokit.rest.checks.create({
                owner: this.owner,
                repo: this.repo,
                name: name,
                head_sha: headSha,
                status: status,
                conclusion: conclusion
            });
            
            this.logger.info(`Check run created: ${name}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Error creating check run ${name}:`, error);
            throw error;
        }
    }

    async updateCheckRun(checkRunId, updates) {
        try {
            const response = await this.octokit.rest.checks.update({
                owner: this.owner,
                repo: this.repo,
                check_run_id: checkRunId,
                ...updates
            });
            
            this.logger.info(`Check run updated: ${checkRunId}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Error updating check run ${checkRunId}:`, error);
            throw error;
        }
    }

    // Utility Methods
    async searchIssues(query, options = {}) {
        try {
            const response = await this.octokit.rest.search.issuesAndPullRequests({
                q: `repo:${this.owner}/${this.repo} ${query}`,
                ...options
            });
            
            return response.data;
        } catch (error) {
            this.logger.error('Error searching issues:', error);
            throw error;
        }
    }

    async getRateLimit() {
        try {
            const response = await this.octokit.rest.rateLimit.get();
            return response.data;
        } catch (error) {
            this.logger.error('Error fetching rate limit:', error);
            throw error;
        }
    }

    async validateToken() {
        try {
            const response = await this.octokit.rest.user.getAuthenticated();
            this.logger.info(`GitHub token validated for user: ${response.data.login}`);
            return response.data;
        } catch (error) {
            this.logger.error('Error validating GitHub token:', error);
            throw error;
        }
    }

    // Database Integration
    async logGitHubEvent(eventType, eventData, result = null) {
        const insertEvent = this.db.prepare(`
            INSERT INTO github_events (
                event_type, event_data, processed, result, created_at
            ) VALUES (?, ?, ?, ?, ?)
        `);
        
        insertEvent.run(
            eventType,
            JSON.stringify(eventData),
            result ? true : false,
            result ? JSON.stringify(result) : null,
            new Date().toISOString()
        );
    }

    async getEventHistory(eventType = null, limit = 100) {
        let query = 'SELECT * FROM github_events';
        const params = [];
        
        if (eventType) {
            query += ' WHERE event_type = ?';
            params.push(eventType);
        }
        
        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);
        
        return this.db.prepare(query).all(...params);
    }
}

module.exports = GitHubAPI;
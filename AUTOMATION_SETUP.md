# Claude Flow Automation Setup Guide

## 🚨 Critical Issue Resolution

The Claude Flow multi-agent automation system is **architecturally complete** but failing due to missing GitHub repository secrets. This guide will fix the automation.

## Root Cause Analysis

The automation system expects these environment variables to be configured as GitHub repository secrets:

1. **`CLAUDE_CODE_OAUTH_TOKEN`** - Required for Claude Code integration
2. **`CLAUDE_API_KEY`** - Optional but recommended for Claude API access

## Required GitHub Repository Secrets

### 1. Set up CLAUDE_CODE_OAUTH_TOKEN

```bash
# Method 1: Using GitHub CLI (recommended)
gh secret set CLAUDE_CODE_OAUTH_TOKEN

# Method 2: Via GitHub Web Interface
# Go to: https://github.com/Marimo-317/claude_flow_windows/settings/secrets/actions
# Click "New repository secret"
# Name: CLAUDE_CODE_OAUTH_TOKEN
# Value: [Your Claude Code OAuth token]
```

**To get your Claude Code OAuth token:**
1. Run `claude-code auth status` to check current authentication
2. If not authenticated, run `claude-code auth login`
3. The token will be stored in your system and can be retrieved for GitHub secrets

### 2. Set up CLAUDE_API_KEY (Optional)

```bash
# Using GitHub CLI
gh secret set CLAUDE_API_KEY

# Or via GitHub Web Interface at the same secrets page
```

## Quick Fix Commands

Run these commands to set up the automation:

```bash
# 1. Navigate to project directory
cd "C:\Users\shiro\claude_flow_windows"

# 2. Check current GitHub authentication
gh auth status

# 3. Check current Claude Code authentication
claude-code auth status

# 4. Set up GitHub repository secrets (interactive)
gh secret set CLAUDE_CODE_OAUTH_TOKEN
gh secret set CLAUDE_API_KEY

# 5. Verify secrets are set
gh secret list

# 6. Test the automation by triggering GitHub Actions
gh workflow run "Claude Flow Auto Issue Resolver"
```

## Testing the Fix

After setting up the secrets, test the automation:

1. **Create a test issue** in the repository
2. **Mention `@claude-flow-automation`** in the issue or comments
3. **Monitor GitHub Actions** at: https://github.com/Marimo-317/claude_flow_windows/actions
4. **Check automation logs** for successful multi-agent spawning

## Expected Automation Workflow

Once configured, the system will:

1. **Trigger** - GitHub webhook detects issue creation/editing
2. **Analyze** - AI analyzes issue complexity and requirements
3. **Spawn Agents** - Multi-agent system deploys specialized agents:
   - Coordinator (task management)
   - Architect (system design) 
   - Coder (implementation)
   - Tester (validation)
   - Security (security review)
4. **Implement** - Agents collaborate to create solution
5. **Test** - Automated testing and validation
6. **Create PR** - Automatic pull request with fix
7. **Learn** - System learns from success/failure for improvement

## System Status

✅ **Working Components:**
- Multi-agent coordination system
- GitHub API integration
- Issue analysis engine
- Agent spawning system
- Test automation
- Pull request creation
- Learning system

❌ **Missing Configuration:**
- GitHub repository secrets (CLAUDE_CODE_OAUTH_TOKEN)
- Claude API key (optional)

## Verification Commands

```bash
# Check if automation is working
node scripts/full-automation.js --test-mode

# Check database setup
ls -la .hive-mind/

# View recent automation logs
ls -la logs/

# Test GitHub API access
gh api repos/Marimo-317/claude_flow_windows/issues
```

## Alternative Manual Trigger

If webhook automation isn't working, you can manually trigger:

```bash
# Manual automation trigger for specific issue
node scripts/full-automation.js --issue-number 4 --manual-mode
```

## Support

The Claude Flow automation system is designed for enterprise-grade automated issue resolution with neural learning capabilities. Once configured, it should automatically handle most GitHub issues without human intervention.

For additional support:
- Check GitHub Actions logs: https://github.com/Marimo-317/claude_flow_windows/actions
- Review automation logs in `logs/` directory
- Test individual components using the scripts in `automation/` directory
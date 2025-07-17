# Claude Code Action Setup Guide

This guide will help you complete the setup of Claude Code Action in your GitHub repository.

## Prerequisites Completed

✅ GitHub workflow file created at `.github/workflows/claude.yml`
✅ Configured to use `CLAUDE_CODE_OAUTH_TOKEN` instead of `ANTHROPIC_API_KEY`

## Next Steps to Complete

### 1. Install Claude GitHub App

Visit the GitHub Marketplace and install the Claude Code app:
1. Go to [Claude Code GitHub App](https://github.com/apps/claude-code) 
2. Click "Install"
3. Select your repository or organization
4. Grant the required permissions

### 2. Generate OAuth Token

Generate your Claude Code OAuth token locally:

```bash
claude setup-token
```

This command will:
- Open a browser window for authentication
- Generate a personal OAuth token for Claude Code
- Display the token for you to copy

**Important**: This token is only available for Claude Pro and Max users.

### 3. Add Token to GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Create a new secret:
   - Name: `CLAUDE_CODE_OAUTH_TOKEN`
   - Value: [Paste the token generated in step 2]
5. Click "Add secret"

### 4. Test the Setup

1. Create a new issue or pull request
2. In the body or comment, mention `@claude` followed by your request
3. Claude will respond within a few seconds

Example:
```
@claude Please review this code and suggest improvements
```

## Configuration Options

The workflow file supports additional configuration options:

```yaml
allowed_tools: |
  Bash(npm install)
  Bash(npm run test)
  Bash(npm run build)
  
custom_instructions: |
  Always follow our coding standards
  Use TypeScript for new files
```

## Troubleshooting

- If Claude doesn't respond, check the Actions tab for workflow runs
- Ensure the OAuth token is correctly set in repository secrets
- Verify the Claude GitHub App has proper permissions
- Check that `@claude` is mentioned in the comment/issue/PR

## Security Notes

- Never commit the OAuth token directly to the repository
- The token should only be stored in GitHub Secrets
- Regularly rotate your tokens for security
- The workflow has write permissions to contents, PRs, and issues
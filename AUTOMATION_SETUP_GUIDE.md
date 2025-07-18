# Claude Flow v2.0.0 Alpha Complete Automation System - Setup Guide

## 🚀 Overview

This guide will help you set up the complete automation system that automatically resolves GitHub issues from creation to PR merge using Claude Flow's AI-powered agents.

## 📋 Prerequisites

### System Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher  
- **Git**: Latest version
- **Python**: Version 3.8 or higher
- **Operating System**: Windows 11 with Git Bash
- **Memory**: Minimum 8GB RAM (16GB recommended)
- **Storage**: Minimum 2GB free space

### Required Accounts & Tokens
- **GitHub Account** with repository access
- **GitHub Personal Access Token** with repository permissions
- **Claude Code Account** (optional, for enhanced features)

## 🔧 Installation Steps

### Step 1: Clone and Setup

```bash
# Navigate to your project directory
cd C:\Users\shiro\claude_flow_windows

# Verify Claude Flow is installed
./claude-flow.sh --version

# Install dependencies
npm install --legacy-peer-deps
```

### Step 2: Run Automated Setup

```bash
# Run the interactive setup script
node setup-automation.js
```

The setup script will:
1. Check all prerequisites
2. Collect your configuration
3. Install dependencies
4. Setup the database
5. Create necessary directories
6. Configure environment variables
7. Test system components
8. Prepare services for launch

### Step 3: Manual Configuration (if needed)

If you need to manually configure the system, edit the `.env` file:

```bash
# Edit environment variables
notepad .env
```

Key configuration options:
- `GITHUB_TOKEN`: Your GitHub personal access token
- `GITHUB_REPO_OWNER`: Your GitHub username
- `GITHUB_REPO_NAME`: Your repository name
- `WEBHOOK_SECRET`: Secret for GitHub webhook security
- `CLAUDE_API_KEY`: Claude API key (optional)

### Step 4: Initialize Database

```bash
# Setup enhanced database schema
node scripts/setup-enhanced-db.js
```

### Step 5: Test Installation

```bash
# Test webhook server
npm run webhook-server

# Test monitoring dashboard (in new terminal)
npm run monitor

# Test full automation (in new terminal)
npm run auto-resolve --issue-number=1 --issue-title="Test Issue"
```

## 🎯 Quick Start

### Starting the System

```bash
# Start all services
npm run start

# Or start individual components:
npm run webhook-server    # Webhook server on port 3000
npm run monitor          # Dashboard on port 3001
npm run dev              # Development mode with auto-restart
```

### Access Points

- **Dashboard**: http://localhost:3001
- **Webhook Endpoint**: http://localhost:3000/webhook
- **Health Check**: http://localhost:3000/health
- **API**: http://localhost:3000/api

## 🔗 GitHub Integration

### Setting up GitHub Webhook

1. Go to your GitHub repository
2. Navigate to **Settings** → **Webhooks** → **Add webhook**
3. Set the **Payload URL** to: `https://your-server.com/webhook`
4. Set **Content type** to: `application/json`
5. Set **Secret** to your webhook secret from `.env`
6. Select events: `Issues`, `Pull requests`, `Issue comments`
7. Click **Add webhook**

### GitHub Actions Integration

The system includes a GitHub Actions workflow that automatically triggers on issue creation:

```yaml
# .github/workflows/claude-flow-auto-resolver.yml
name: Claude Flow Auto Issue Resolver
on:
  issues:
    types: [opened, edited, labeled, reopened]
```

## 🧪 Testing the System

### Test Issue Resolution

1. Create a test issue in your GitHub repository
2. The system should automatically:
   - Detect the issue via webhook
   - Analyze the issue complexity and requirements
   - Spawn appropriate agents
   - Generate a solution
   - Create comprehensive tests
   - Submit a pull request
   - Update the issue with progress

### Manual Testing

```bash
# Test specific components
npm run test              # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only

# Test automation flow
node scripts/full-automation.js --issue-number=123 --issue-title="Test Issue"
```

## 📊 Monitoring & Control

### Dashboard Features

Access the dashboard at http://localhost:3001:

- **Real-time metrics**: System performance, success rates
- **Session tracking**: Active and completed automation sessions
- **Agent monitoring**: Agent performance and status
- **Tool analytics**: MCP tool usage and effectiveness
- **Learning progress**: Neural network training and patterns
- **System logs**: Real-time log streaming

### API Endpoints

- `GET /api/status` - System status
- `GET /api/metrics` - All metrics
- `GET /api/sessions` - Automation sessions
- `GET /api/agents` - Agent statistics
- `GET /api/tools` - Tool usage data
- `GET /api/learning` - Learning system data

## 🔍 Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```bash
# Recreate database
rm .hive-mind/automation.db
node scripts/setup-enhanced-db.js
```

#### 2. Webhook Not Receiving Events
- Check webhook URL is publicly accessible
- Verify webhook secret matches
- Check GitHub webhook delivery logs

#### 3. Agent Spawning Failures
- Ensure Claude Flow is properly installed
- Check system resources (CPU, Memory)
- Verify `.env` configuration

#### 4. High Memory Usage
- Reduce `MAX_CONCURRENT_AGENTS` in `.env`
- Enable memory optimization in config
- Restart services periodically

### Log Analysis

```bash
# View system logs
tail -f logs/full-automation.log
tail -f logs/webhook.log
tail -f logs/monitoring-dashboard.log

# View specific component logs
tail -f logs/issue-analyzer.log
tail -f logs/agent-spawner.log
tail -f logs/learning-system.log
```

### Performance Optimization

```bash
# Run performance analysis
node scripts/auto-optimizer.js

# Check system resources
npm run system-check

# Optimize database
node scripts/optimize-database.js
```

## 🔒 Security Considerations

### Production Deployment

1. **Environment Variables**: Never commit `.env` files
2. **Webhook Security**: Always use webhook secrets
3. **Rate Limiting**: Configure appropriate rate limits
4. **HTTPS**: Use HTTPS for webhook endpoints
5. **Token Security**: Rotate GitHub tokens regularly

### Access Control

- Dashboard access should be protected in production
- API endpoints should have authentication
- Webhook endpoints should validate signatures
- Database should have backup and recovery

## 📈 Performance Expectations

### Typical Performance Metrics

- **Issue Analysis**: 5-15 seconds
- **Agent Spawning**: 10-30 seconds
- **Simple Issue Resolution**: 2-5 minutes
- **Complex Issue Resolution**: 10-30 minutes
- **Success Rate**: 70-90% (improves with learning)

### Scalability

- **Concurrent Issues**: 5-10 (configurable)
- **Agent Limit**: 50+ agents
- **Database**: Supports 10,000+ sessions
- **Memory Usage**: 2-4GB typical

## 🔄 Maintenance

### Regular Tasks

```bash
# Daily maintenance
npm run cleanup-logs     # Clean old logs
npm run backup-database  # Backup database
npm run health-check     # System health check

# Weekly maintenance
npm run optimize-system  # Performance optimization
npm run update-deps      # Update dependencies
npm run security-audit   # Security scan
```

### Updates

```bash
# Update Claude Flow
npm update claude-flow@alpha

# Update automation system
git pull origin main
npm install --legacy-peer-deps
```

## 🆘 Support

### Getting Help

1. Check the [troubleshooting section](#troubleshooting)
2. Review system logs for error messages
3. Test individual components to isolate issues
4. Check GitHub repository for known issues

### Useful Commands

```bash
# System diagnostics
npm run diagnose

# Reset system
npm run reset-system

# Export logs
npm run export-logs

# System status
npm run status
```

## 🎉 Success Indicators

Your system is working correctly when:

1. ✅ Dashboard shows "Online" status
2. ✅ Webhook receives GitHub events
3. ✅ Test issues are automatically resolved
4. ✅ PRs are created with comprehensive solutions
5. ✅ Learning system shows improving patterns
6. ✅ Success rate above 70%

## 📚 Next Steps

Once your system is running:

1. **Monitor Performance**: Watch the dashboard for insights
2. **Tune Configuration**: Adjust settings based on your needs
3. **Expand Learning**: Let the system learn from more issues
4. **Scale Up**: Increase concurrent agents as needed
5. **Customize**: Adapt the system to your specific workflows

---

🤖 **Claude Flow Automation System** - Transforming issue resolution with AI-powered automation
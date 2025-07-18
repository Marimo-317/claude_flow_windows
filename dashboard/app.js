// Claude Flow Automation Dashboard JavaScript
class AutomationDashboard {
    constructor() {
        this.socket = null;
        this.charts = {};
        this.isConnected = false;
        this.metricsHistory = {
            system: [],
            automation: [],
            agents: [],
            tools: [],
            learning: []
        };
        
        this.initializeSocket();
        this.initializeCharts();
        this.bindEvents();
    }

    initializeSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.updateConnectionStatus('Connected', 'connection-connected');
            this.addLogEntry('Connected to Claude Flow Automation system', 'info');
            
            // Subscribe to all metrics
            this.socket.emit('subscribe', ['system', 'automation', 'agents', 'tools', 'learning']);
        });

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            this.updateConnectionStatus('Disconnected', 'connection-disconnected');
            this.addLogEntry('Disconnected from Claude Flow Automation system', 'error');
        });

        this.socket.on('initial-data', (data) => {
            this.addLogEntry('Received initial data from server', 'info');
            this.updateMetrics(data);
        });

        this.socket.on('metrics-update', (data) => {
            this.updateMetrics(data);
        });

        this.socket.on('agent-update', (data) => {
            this.handleAgentUpdate(data);
        });

        this.socket.on('task-update', (data) => {
            this.handleTaskUpdate(data);
        });

        this.socket.on('learning-update', (data) => {
            this.handleLearningUpdate(data);
        });
    }

    initializeCharts() {
        // System Performance Chart
        const systemCtx = document.getElementById('systemChart').getContext('2d');
        this.charts.system = new Chart(systemCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'CPU Usage (%)',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1
                }, {
                    label: 'Memory Usage (%)',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        // Success Rate Chart
        const successCtx = document.getElementById('successChart').getContext('2d');
        this.charts.success = new Chart(successCtx, {
            type: 'doughnut',
            data: {
                labels: ['Successful', 'Failed'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(255, 99, 132, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

        // Learning Progress Chart
        const learningCtx = document.getElementById('learningChart').getContext('2d');
        this.charts.learning = new Chart(learningCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Pattern Count',
                    data: [],
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    bindEvents() {
        // Refresh button handlers
        document.getElementById('sessions-tab').addEventListener('click', () => {
            this.refreshSessions();
        });

        document.getElementById('agents-tab').addEventListener('click', () => {
            this.refreshAgents();
        });

        document.getElementById('tools-tab').addEventListener('click', () => {
            this.refreshTools();
        });

        document.getElementById('learning-tab').addEventListener('click', () => {
            this.refreshLearning();
        });
    }

    updateConnectionStatus(text, className) {
        const statusEl = document.getElementById('connection-status');
        statusEl.textContent = text;
        statusEl.className = className;
        statusEl.innerHTML = `<i class="fas fa-circle"></i> ${text}`;
    }

    updateMetrics(data) {
        if (data.system) {
            this.updateSystemMetrics(data.system);
        }
        if (data.automation) {
            this.updateAutomationMetrics(data.automation);
        }
        if (data.agents) {
            this.updateAgentMetrics(data.agents);
        }
        if (data.tools) {
            this.updateToolMetrics(data.tools);
        }
        if (data.learning) {
            this.updateLearningMetrics(data.learning);
        }
    }

    updateSystemMetrics(systemData) {
        // Update system status cards
        document.getElementById('system-status').textContent = 'Online';
        document.getElementById('system-uptime').textContent = `Uptime: ${this.formatUptime(systemData.uptime)}`;

        // Update system chart
        const now = new Date().toLocaleTimeString();
        const chart = this.charts.system;
        
        chart.data.labels.push(now);
        chart.data.datasets[0].data.push(parseFloat(systemData.cpu_usage));
        chart.data.datasets[1].data.push(systemData.memory.percentage);

        // Keep only last 20 data points
        if (chart.data.labels.length > 20) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
            chart.data.datasets[1].data.shift();
        }

        chart.update();
    }

    updateAutomationMetrics(automationData) {
        // Update automation status cards
        document.getElementById('active-sessions').textContent = automationData.active_sessions;
        document.getElementById('total-sessions').textContent = `Total: ${automationData.total_sessions}`;
        document.getElementById('success-rate').textContent = `${automationData.success_rate}%`;
        document.getElementById('avg-duration').textContent = `Avg: ${this.formatDuration(automationData.avg_duration)}`;

        // Update success rate chart
        const successChart = this.charts.success;
        const totalSessions = automationData.completed_sessions + automationData.failed_sessions;
        
        if (totalSessions > 0) {
            successChart.data.datasets[0].data = [
                automationData.completed_sessions,
                automationData.failed_sessions
            ];
            successChart.update();
        }
    }

    updateAgentMetrics(agentData) {
        if (agentData.agent_types && agentData.agent_types.length > 0) {
            const tableBody = document.getElementById('agents-table');
            tableBody.innerHTML = '';

            agentData.agent_types.forEach(agent => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${agent.type}</td>
                    <td>${agent.total_spawned}</td>
                    <td>${(agent.avg_success_rate * 100).toFixed(1)}%</td>
                    <td>${this.formatDuration(agent.avg_completion_time)}</td>
                    <td>${(agent.avg_quality_score * 100).toFixed(1)}%</td>
                    <td><span class="badge bg-primary">${agent.recent_activity}</span></td>
                `;
                tableBody.appendChild(row);
            });
        }
    }

    updateToolMetrics(toolData) {
        if (toolData.top_tools && toolData.top_tools.length > 0) {
            const tableBody = document.getElementById('tools-table');
            tableBody.innerHTML = '';

            toolData.top_tools.forEach(tool => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${tool.tool_name}</td>
                    <td><span class="badge bg-secondary">${tool.tool_category}</span></td>
                    <td>${tool.usage_count}</td>
                    <td>${(tool.success_rate * 100).toFixed(1)}%</td>
                    <td>${(tool.performance_score * 100).toFixed(1)}%</td>
                    <td>${tool.last_used ? new Date(tool.last_used).toLocaleString() : 'Never'}</td>
                `;
                tableBody.appendChild(row);
            });
        }
    }

    updateLearningMetrics(learningData) {
        // Update learning progress card
        const totalPatterns = learningData.patterns ? learningData.patterns.reduce((sum, p) => sum + p.count, 0) : 0;
        const avgConfidence = learningData.patterns && learningData.patterns.length > 0 
            ? learningData.patterns.reduce((sum, p) => sum + p.avg_confidence, 0) / learningData.patterns.length 
            : 0;

        document.getElementById('learning-progress').textContent = `${(avgConfidence * 100).toFixed(1)}%`;
        document.getElementById('learning-patterns').textContent = `Patterns: ${totalPatterns}`;

        // Update learning patterns table
        if (learningData.patterns && learningData.patterns.length > 0) {
            const tableBody = document.getElementById('learning-patterns-table');
            tableBody.innerHTML = '';

            learningData.patterns.forEach(pattern => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${pattern.pattern_type}</td>
                    <td>${pattern.count}</td>
                    <td>${(pattern.avg_confidence * 100).toFixed(1)}%</td>
                    <td>${(pattern.avg_success_rate * 100).toFixed(1)}%</td>
                `;
                tableBody.appendChild(row);
            });

            // Update learning chart
            const learningChart = this.charts.learning;
            learningChart.data.labels = learningData.patterns.map(p => p.pattern_type);
            learningChart.data.datasets[0].data = learningData.patterns.map(p => p.count);
            learningChart.update();
        }
    }

    refreshSessions() {
        fetch('/api/sessions')
            .then(response => response.json())
            .then(data => {
                const tableBody = document.getElementById('sessions-table');
                tableBody.innerHTML = '';

                data.forEach(session => {
                    const row = document.createElement('tr');
                    const statusBadge = this.getStatusBadge(session.status);
                    const duration = session.end_time 
                        ? this.formatDuration(new Date(session.end_time) - new Date(session.start_time))
                        : 'Running...';

                    row.innerHTML = `
                        <td><code>${session.session_id.substring(0, 8)}</code></td>
                        <td>${statusBadge}</td>
                        <td>${new Date(session.start_time).toLocaleString()}</td>
                        <td>${duration}</td>
                        <td>
                            <button class="btn btn-sm btn-info" onclick="dashboard.viewSession('${session.session_id}')">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            })
            .catch(error => {
                this.addLogEntry(`Error fetching sessions: ${error.message}`, 'error');
            });
    }

    refreshAgents() {
        fetch('/api/agents')
            .then(response => response.json())
            .then(data => {
                this.updateAgentMetrics({ agent_types: data });
            })
            .catch(error => {
                this.addLogEntry(`Error fetching agents: ${error.message}`, 'error');
            });
    }

    refreshTools() {
        fetch('/api/tools')
            .then(response => response.json())
            .then(data => {
                this.updateToolMetrics({ top_tools: data });
            })
            .catch(error => {
                this.addLogEntry(`Error fetching tools: ${error.message}`, 'error');
            });
    }

    refreshLearning() {
        fetch('/api/learning')
            .then(response => response.json())
            .then(data => {
                this.updateLearningMetrics(data);
            })
            .catch(error => {
                this.addLogEntry(`Error fetching learning data: ${error.message}`, 'error');
            });
    }

    handleAgentUpdate(data) {
        const message = `Agent ${data.agent.id} ${data.type}`;
        this.addLogEntry(message, 'info');
    }

    handleTaskUpdate(data) {
        const message = `Task ${data.task.id} ${data.type}`;
        this.addLogEntry(message, 'info');
    }

    handleLearningUpdate(data) {
        const message = `Learning system updated: ${data.type}`;
        this.addLogEntry(message, 'info');
    }

    getStatusBadge(status) {
        const badges = {
            'started': '<span class="badge bg-primary">Started</span>',
            'running': '<span class="badge bg-info">Running</span>',
            'completed': '<span class="badge bg-success">Completed</span>',
            'failed': '<span class="badge bg-danger">Failed</span>'
        };
        return badges[status] || '<span class="badge bg-secondary">Unknown</span>';
    }

    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    formatDuration(milliseconds) {
        if (!milliseconds) return '--';
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    addLogEntry(message, type) {
        const logsContainer = document.getElementById('logs-container');
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
        
        logsContainer.appendChild(entry);
        logsContainer.scrollTop = logsContainer.scrollHeight;
        
        // Keep only last 100 log entries
        const logEntries = logsContainer.querySelectorAll('.log-entry');
        if (logEntries.length > 100) {
            logEntries[0].remove();
        }
    }

    clearLogs() {
        const logsContainer = document.getElementById('logs-container');
        logsContainer.innerHTML = '';
        this.addLogEntry('Logs cleared', 'info');
    }

    viewSession(sessionId) {
        // Open session details in modal or new tab
        window.open(`/session/${sessionId}`, '_blank');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new AutomationDashboard();
});

// Global functions for button handlers
function refreshSessions() {
    window.dashboard.refreshSessions();
}

function clearLogs() {
    window.dashboard.clearLogs();
}
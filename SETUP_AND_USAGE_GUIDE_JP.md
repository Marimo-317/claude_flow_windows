# Claude Flow v2.0.0 完全自動開発システム セットアップ＆使用ガイド

## 目次
1. [システム概要](#システム概要)
2. [システム要件](#システム要件)
3. [インストール手順](#インストール手順)
4. [設定手順](#設定手順)
5. [使用方法](#使用方法)
6. [アーキテクチャ](#アーキテクチャ)
7. [トラブルシューティング](#トラブルシューティング)
8. [ベストプラクティス](#ベストプラクティス)

---

## システム概要

Claude Flow v2.0.0 完全自動開発システムは、GitHubのIssue作成から解決（PR作成・マージ）まで、開発プロセス全体を自動化するAI駆動型システムです。

### 主要機能
- 🤖 **AI駆動型Issue分析**: 自動的にIssueを分析し、複雑度とカテゴリを判定
- 👥 **インテリジェントエージェント管理**: タスクに応じて適切なAIエージェントを自動配置
- 🔧 **87種類のMCPツール**: 開発タスクに必要なツールを自動選択
- 🧠 **機械学習システム**: 継続的に学習し、パフォーマンスを改善
- 🚨 **包括的エラーハンドリング**: 自動リカバリー機能を搭載
- 📊 **リアルタイムモニタリング**: 進捗状況を可視化

---

## システム要件

### 必須要件
- **OS**: Windows 10/11, macOS 10.15+, Linux (Ubuntu 20.04+)
- **Node.js**: v18.0.0以上（推奨: v24.4.1）
- **npm**: v8.0.0以上（推奨: v11.4.2）
- **Git**: v2.25.0以上
- **GitHub アカウント**: Webhook設定権限付き
- **メモリ**: 最小8GB RAM（推奨: 16GB）
- **ディスク容量**: 最小10GB空き容量

### 推奨要件
- **CPU**: 4コア以上
- **インターネット接続**: 安定した高速接続
- **Visual Studio Build Tools**: Windows環境の場合（C++コンパイル用）

---

## インストール手順

### 1. Claude Flowのインストール

```bash
# npmからグローバルインストール
npm install -g claude-code-flow

# バージョン確認
claude-flow --version
# 出力例: Claude Flow version: 2.0.0-alpha.56
```

### 2. プロジェクトディレクトリの作成

```bash
# プロジェクトディレクトリを作成
mkdir my-automated-project
cd my-automated-project

# Claude Flowプロジェクトを初期化
claude-flow init
```

### 3. 依存関係のインストール

```bash
# package.jsonの作成
npm init -y

# 必要な依存関係をインストール
npm install express winston fs-extra dotenv
npm install --save-dev nodemon

# Windows環境でコンパイルエラーが発生する場合
npm install --legacy-peer-deps --ignore-scripts
```

### 4. フォルダ構造の設定

```bash
# 必要なディレクトリを作成
mkdir -p logs scripts memory .claude/commands temp
```

---

## 設定手順

### 1. 環境変数の設定

`.env`ファイルを作成：

```bash
# GitHub設定
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_WEBHOOK_SECRET=your_webhook_secret_key
GITHUB_OWNER=your_github_username
GITHUB_REPO=your_repository_name

# サーバー設定
PORT=3000
DASHBOARD_PORT=3001
NODE_ENV=production

# Claude Flow設定
CLAUDE_API_KEY=your_claude_api_key
MAX_CONCURRENT_AGENTS=10
MAX_CONCURRENT_SESSIONS=30

# データベース設定
DATABASE_URL=./data/automation.db
DATABASE_TYPE=sqlite

# ログ設定
LOG_LEVEL=info
LOG_DIR=./logs

# 学習システム設定
ENABLE_LEARNING=true
LEARNING_RATE=0.001
PATTERN_THRESHOLD=0.7
```

### 2. GitHubアクセストークンの作成

1. GitHub → Settings → Developer settings → Personal access tokens
2. "Generate new token (classic)"をクリック
3. 必要な権限を選択：
   - `repo` - フルコントロール
   - `workflow` - ワークフロー更新
   - `write:packages` - パッケージ書き込み
   - `admin:org` - Organization webhooks（組織の場合）
4. トークンを`.env`ファイルに保存

### 3. Webhookサーバーの設定

`scripts/webhook-server.js`を作成：

```javascript
const express = require('express');
const winston = require('winston');
const { ClaudeFlowAutomation } = require('claude-code-flow');

const app = express();
const automation = new ClaudeFlowAutomation();

// ログ設定
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/webhook.log' }),
        new winston.transports.Console()
    ]
});

// ミドルウェア
app.use(express.json());

// Webhookエンドポイント
app.post('/webhook', async (req, res) => {
    const event = req.headers['x-github-event'];
    const payload = req.body;
    
    if (event === 'issues' && payload.action === 'opened') {
        logger.info(`New issue created: #${payload.issue.number}`);
        
        // 自動化プロセスを開始
        const result = await automation.processIssue(payload.issue);
        
        res.json({ success: true, sessionId: result.sessionId });
    } else {
        res.json({ success: true, message: 'Event ignored' });
    }
});

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Webhook server running on port ${PORT}`);
});
```

### 4. GitHub Webhookの設定

1. GitHubリポジトリ → Settings → Webhooks
2. "Add webhook"をクリック
3. 設定内容：
   - **Payload URL**: `https://your-domain.com/webhook`
   - **Content type**: `application/json`
   - **Secret**: 環境変数の`GITHUB_WEBHOOK_SECRET`と同じ値
   - **Events**: "Issues"を選択
4. "Add webhook"で保存

### 5. MCPツールの設定

`.claude/mcp.json`を作成：

```json
{
  "tools": {
    "file_operations": {
      "enabled": true,
      "permissions": ["read", "write", "create", "delete"]
    },
    "code_analysis": {
      "enabled": true,
      "linters": ["eslint", "prettier", "pylint"]
    },
    "testing": {
      "enabled": true,
      "frameworks": ["jest", "pytest", "mocha"]
    },
    "github_integration": {
      "enabled": true,
      "auto_pr": true,
      "auto_merge": false
    },
    "memory_management": {
      "enabled": true,
      "max_memory_mb": 1024
    },
    "neural_networks": {
      "enabled": true,
      "model": "claude-3-opus"
    }
  }
}
```

---

## 使用方法

### 1. システムの起動

```bash
# Webhookサーバーの起動
npm run start:webhook

# ダッシュボードの起動（別ターミナル）
npm run start:dashboard

# 開発モードで起動
npm run dev
```

### 2. 自動化フローの確認

```bash
# 現在の設定を確認
claude-flow status

# アクティブなセッションを確認
claude-flow sessions list

# ログをリアルタイムで確認
claude-flow logs --follow
```

### 3. Issue作成から解決までのフロー

#### ステップ1: Issue作成
GitHubで新しいIssueを作成：

```markdown
Title: Fix button text is incorrect

Body:
The login button currently shows "Signin" but it should show "Sign In" with proper spacing.

Labels: bug, ui
```

#### ステップ2: 自動プロセスの開始
システムが自動的に以下を実行：

1. **Issue分析** (〜30秒)
   - カテゴリ判定: bug
   - 複雑度評価: low
   - 必要なエージェント決定

2. **エージェント起動** (〜1分)
   - Coderエージェントを起動
   - 必要なツールを選択

3. **ソリューション開発** (〜5分)
   - ファイルを検索・分析
   - コードを修正
   - テストを実行

4. **PR作成** (〜1分)
   - ブランチ作成
   - コミット作成
   - PR作成とラベル付け

#### ステップ3: 進捗モニタリング

```bash
# セッションの詳細を確認
claude-flow session details <session-id>

# リアルタイムログ
claude-flow logs --session <session-id> --follow
```

### 4. 手動介入が必要な場合

```bash
# セッションを一時停止
claude-flow session pause <session-id>

# 設定を変更
claude-flow config set max_retries 5

# セッションを再開
claude-flow session resume <session-id>
```

---

## アーキテクチャ

### システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                         GitHub                               │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐ │
│  │ Issues  │───▶│Webhooks │───▶│   API   │◀──▶│   PRs   │ │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Claude Flow Core                           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Webhook   │  │    Issue     │  │     Learning     │  │
│  │   Server    │──│   Analyzer   │──│     System       │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│         │                 │                    │            │
│         ▼                 ▼                    ▼            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │    Agent    │  │     Tool     │  │     Memory       │  │
│  │   Manager   │──│   Selector   │──│   Management     │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI Agents Layer                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐│
│  │Coordinator │ │ Architect  │ │   Coder    │ │  Tester  ││
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘│
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     MCP Tools (87種類)                       │
│  File Ops │ Code Analysis │ Testing │ GitHub │ Memory │... │
└─────────────────────────────────────────────────────────────┘
```

### コンポーネント説明

1. **Webhook Server**
   - GitHubイベントを受信
   - 自動化プロセスをトリガー

2. **Issue Analyzer**
   - AI駆動のIssue分析
   - 複雑度とカテゴリの判定

3. **Agent Manager**
   - エージェントのライフサイクル管理
   - リソース割り当て

4. **Tool Selector**
   - 87種類のツールから最適なものを選択
   - ニューラルネットワークベースの最適化

5. **Learning System**
   - パターン認識と最適化
   - 継続的な改善

6. **Memory Management**
   - セッション情報の永続化
   - 学習データの保存

---

## トラブルシューティング

### よくある問題と解決方法

#### 1. better-sqlite3のコンパイルエラー

**問題**: Windows環境で`better-sqlite3`のコンパイルに失敗

**解決方法**:
```bash
# Visual Studio Build Toolsをインストール
# または、--ignore-scriptsフラグを使用
npm install --legacy-peer-deps --ignore-scripts

# 代替: JSONベースのデータベースを使用
node scripts/setup-json-database.js
```

#### 2. GitHub APIレート制限

**問題**: "API rate limit exceeded"エラー

**解決方法**:
```bash
# レート制限の確認
claude-flow github rate-limit

# 待機時間を設定
claude-flow config set github_retry_delay 60000
```

#### 3. エージェントがタイムアウト

**問題**: エージェントが応答しない

**解決方法**:
```bash
# タイムアウト設定を増やす
claude-flow config set agent_timeout 300000

# エージェントを再起動
claude-flow agent restart <agent-id>
```

#### 4. メモリ不足エラー

**問題**: "Out of memory"エラー

**解決方法**:
```bash
# Node.jsのメモリ制限を増やす
export NODE_OPTIONS="--max-old-space-size=8192"

# または package.jsonのスクリプトに追加
"scripts": {
  "start": "node --max-old-space-size=8192 scripts/webhook-server.js"
}
```

### デバッグモード

詳細なデバッグ情報を有効化：

```bash
# 環境変数でデバッグモードを有効化
export DEBUG=claude-flow:*
export LOG_LEVEL=debug

# または .envファイルに追加
DEBUG=claude-flow:*
LOG_LEVEL=debug
```

---

## ベストプラクティス

### 1. Issue作成のガイドライン

良いIssueの例：
```markdown
Title: Add user authentication system with JWT

Body:
## Description
Implement a complete user authentication system using JWT tokens.

## Requirements
- User registration with email verification
- Login/logout functionality
- Password reset feature
- JWT token management

## Technical Details
- Framework: Express.js
- Database: PostgreSQL
- Authentication: JWT
- Password hashing: bcrypt

## Acceptance Criteria
- [ ] Users can register with email/password
- [ ] Email verification is required
- [ ] Users can login and receive JWT token
- [ ] Password reset via email
- [ ] All endpoints are properly secured

Labels: feature, backend, security
```

### 2. パフォーマンス最適化

```javascript
// claude-flow.config.js
module.exports = {
  performance: {
    maxConcurrentAgents: 5,      // 同時実行エージェント数を制限
    maxConcurrentSessions: 20,   // 同時セッション数を制限
    cacheEnabled: true,          // キャッシュを有効化
    cacheTTL: 3600000           // キャッシュTTL: 1時間
  },
  
  optimization: {
    enableLearning: true,        // 学習システムを有効化
    learningRate: 0.001,        // 学習率
    patternThreshold: 0.7       // パターン認識閾値
  }
};
```

### 3. セキュリティベストプラクティス

1. **環境変数の管理**
   - `.env`ファイルを`.gitignore`に追加
   - 本番環境では環境変数を使用

2. **アクセス制御**
   - Webhook URLにIP制限を設定
   - シークレットトークンを定期的に更新

3. **監査ログ**
   - すべての自動化アクションをログに記録
   - 定期的にログをレビュー

### 4. モニタリングとアラート

```bash
# Prometheusメトリクスを有効化
claude-flow config set metrics_enabled true
claude-flow config set metrics_port 9090

# アラート設定
claude-flow alerts add --type error_rate --threshold 0.05
claude-flow alerts add --type response_time --threshold 5000
```

### 5. バックアップとリカバリー

```bash
# 定期バックアップスクリプト
#!/bin/bash
# backup.sh

BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# データベースのバックアップ
cp -r ./data $BACKUP_DIR/

# メモリデータのバックアップ
cp -r ./memory $BACKUP_DIR/

# 設定ファイルのバックアップ
cp .env $BACKUP_DIR/
cp claude-flow.config.js $BACKUP_DIR/

echo "Backup completed: $BACKUP_DIR"
```

---

## 高度な設定

### カスタムエージェントの追加

```javascript
// agents/custom-agent.js
const { BaseAgent } = require('claude-code-flow');

class CustomAgent extends BaseAgent {
  constructor() {
    super('custom-agent');
    this.capabilities = ['custom-analysis', 'special-processing'];
  }
  
  async process(task) {
    // カスタム処理ロジック
    const result = await this.analyzeTask(task);
    return result;
  }
}

module.exports = CustomAgent;
```

### カスタムツールの追加

```javascript
// tools/custom-tool.js
const { BaseTool } = require('claude-code-flow');

class CustomTool extends BaseTool {
  constructor() {
    super('custom-tool');
    this.category = 'custom';
  }
  
  async execute(params) {
    // カスタムツールの実装
    return { success: true, data: 'Custom tool result' };
  }
}

module.exports = CustomTool;
```

---

## まとめ

Claude Flow v2.0.0完全自動開発システムは、GitHubのIssue作成から解決まで、開発プロセス全体を自動化する強力なツールです。適切な設定と運用により、開発効率を大幅に向上させることができます。

### サポートとリソース

- **公式ドキュメント**: https://github.com/ruvnet/claude-code-flow/docs
- **コミュニティフォーラム**: https://community.claude-flow.dev
- **バグレポート**: https://github.com/ruvnet/claude-code-flow/issues
- **機能リクエスト**: https://github.com/ruvnet/claude-code-flow/discussions

### ライセンス

MIT License - 詳細は[LICENSE](./LICENSE)ファイルを参照してください。

---

**最終更新日**: 2025年7月18日  
**バージョン**: v2.0.0-alpha.56
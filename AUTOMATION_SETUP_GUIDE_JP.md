# Claude Flow v2.0.0 Alpha 完全自動化システム - セットアップガイド

## 🚀 概要

このガイドは、Claude FlowのAI駆動エージェントを使用して、GitHubのIssue作成からPRマージまでを自動的に解決する完全自動化システムのセットアップを支援します。

## 📋 前提条件

### システム要件
- **Node.js**: バージョン18.0.0以上
- **npm**: バージョン9.0.0以上
- **Git**: 最新バージョン
- **Python**: バージョン3.8以上
- **オペレーティングシステム**: Windows 11（Git Bash付き）
- **メモリ**: 最小8GB RAM（16GB推奨）
- **ストレージ**: 最小2GB空き容量

### 必要なアカウント＆トークン
- **GitHubアカウント**（リポジトリアクセス権限付き）
- **GitHub個人アクセストークン**（リポジトリ権限付き）
- **Claude Codeアカウント**（拡張機能用、オプション）

## 🔧 インストール手順

### ステップ1: クローンとセットアップ

```bash
# プロジェクトディレクトリに移動
cd C:\Users\shiro\claude_flow_windows

# Claude Flowのインストールを確認
./claude-flow.sh --version

# 依存関係をインストール
npm install --legacy-peer-deps
```

### ステップ2: 自動セットアップの実行

```bash
# インタラクティブセットアップスクリプトを実行
node setup-automation.js
```

セットアップスクリプトは以下を実行します：
1. すべての前提条件をチェック
2. 設定を収集
3. 依存関係をインストール
4. データベースをセットアップ
5. 必要なディレクトリを作成
6. 環境変数を設定
7. システムコンポーネントをテスト
8. 起動のためのサービスを準備

### ステップ3: 手動設定（必要に応じて）

システムを手動で設定する必要がある場合は、`.env`ファイルを編集します：

```bash
# 環境変数を編集
notepad .env
```

主要な設定オプション：
- `GITHUB_TOKEN`: GitHub個人アクセストークン
- `GITHUB_REPO_OWNER`: GitHubユーザー名
- `GITHUB_REPO_NAME`: リポジトリ名
- `WEBHOOK_SECRET`: GitHub Webhookセキュリティ用の秘密鍵
- `CLAUDE_API_KEY`: Claude APIキー（オプション）

### ステップ4: データベースの初期化

```bash
# 拡張データベーススキーマをセットアップ
node scripts/setup-enhanced-db.js
```

### ステップ5: インストールのテスト

```bash
# Webhookサーバーをテスト
npm run webhook-server

# 監視ダッシュボードをテスト（新しいターミナル）
npm run monitor

# 完全自動化をテスト（新しいターミナル）
npm run auto-resolve --issue-number=1 --issue-title="Test Issue"
```

## 🎯 クイックスタート

### システムの起動

```bash
# すべてのサービスを開始
npm run start

# または個別のコンポーネントを開始：
npm run webhook-server    # ポート3000でWebhookサーバー
npm run monitor          # ポート3001でダッシュボード
npm run dev              # 自動再起動付きの開発モード
```

### アクセスポイント

- **ダッシュボード**: http://localhost:3001
- **Webhookエンドポイント**: http://localhost:3000/webhook
- **ヘルスチェック**: http://localhost:3000/health
- **API**: http://localhost:3000/api

## 🔗 GitHub統合

### GitHub Webhookの設定

1. GitHubリポジトリに移動
2. **Settings** → **Webhooks** → **Add webhook**に移動
3. 設定内容：
   - **Payload URL**: `https://your-server.com/webhook`
   - **Content type**: `application/json`
   - **Secret**: `.env`のwebhook secretと同じ値
   - **Events**: `Issues`、`Pull requests`、`Issue comments`を選択
4. **Add webhook**をクリックして保存

### GitHub Actionsの統合

システムにはIssue作成時に自動的にトリガーされるGitHub Actionsワークフローが含まれています：

```yaml
# .github/workflows/claude-flow-auto-resolver.yml
name: Claude Flow Auto Issue Resolver
on:
  issues:
    types: [opened, edited, labeled, reopened]
```

## 🧪 システムのテスト

### テストIssue解決

1. GitHubリポジトリでテストIssueを作成
2. システムが自動的に以下を実行するはずです：
   - Webhookを介してIssueを検出
   - Issue の複雑さと要件を分析
   - 適切なエージェントを起動
   - ソリューションを生成
   - 包括的なテストを作成
   - プルリクエストを提出
   - 進捗状況でIssueを更新

### 手動テスト

```bash
# 特定のコンポーネントをテスト
npm run test              # すべてのテストを実行
npm run test:unit        # ユニットテストのみ
npm run test:integration # 統合テストのみ

# 自動化フローをテスト
node scripts/full-automation.js --issue-number=123 --issue-title="Test Issue"
```

## 📊 監視と制御

### ダッシュボード機能

http://localhost:3001 でダッシュボードにアクセス：

- **リアルタイムメトリクス**: システムパフォーマンス、成功率
- **セッション追跡**: アクティブで完了した自動化セッション
- **エージェント監視**: エージェントパフォーマンスとステータス
- **ツール分析**: MCPツール使用状況と効果
- **学習進捗**: ニューラルネットワークトレーニングとパターン
- **システムログ**: リアルタイムログストリーミング

### APIエンドポイント

- `GET /api/status` - システムステータス
- `GET /api/metrics` - すべてのメトリクス
- `GET /api/sessions` - 自動化セッション
- `GET /api/agents` - エージェント統計
- `GET /api/tools` - ツール使用データ
- `GET /api/learning` - 学習システムデータ

## 🔍 トラブルシューティング

### よくある問題

#### 1. データベース接続エラー
```bash
# データベースを再作成
rm .hive-mind/automation.db
node scripts/setup-enhanced-db.js
```

#### 2. Webhookがイベントを受信しない
- Webhook URLが公開アクセス可能であることを確認
- Webhook秘密鍵が一致することを確認
- GitHub Webhook配信ログを確認

#### 3. エージェント起動の失敗
- Claude Flowが適切にインストールされていることを確認
- システムリソース（CPU、メモリ）を確認
- `.env`設定を確認

#### 4. 高メモリ使用量
- `.env`の`MAX_CONCURRENT_AGENTS`を減らす
- 設定でメモリ最適化を有効にする
- 定期的にサービスを再起動

### ログ分析

```bash
# システムログを表示
tail -f logs/full-automation.log
tail -f logs/webhook.log
tail -f logs/monitoring-dashboard.log

# 特定のコンポーネントログを表示
tail -f logs/issue-analyzer.log
tail -f logs/agent-spawner.log
tail -f logs/learning-system.log
```

### パフォーマンス最適化

```bash
# パフォーマンス分析を実行
node scripts/auto-optimizer.js

# システムリソースを確認
npm run system-check

# データベースを最適化
node scripts/optimize-database.js
```

## 🔒 セキュリティ考慮事項

### 本番環境でのデプロイ

1. **環境変数**: `.env`ファイルをコミットしない
2. **Webhookセキュリティ**: 必ずwebhook秘密鍵を使用
3. **レート制限**: 適切なレート制限を設定
4. **HTTPS**: Webhookエンドポイントには必ずHTTPSを使用
5. **トークンセキュリティ**: GitHubトークンを定期的にローテーション

### アクセス制御

- 本番環境ではダッシュボードアクセスを保護
- APIエンドポイントに認証を設定
- Webhookエンドポイントで署名を検証
- データベースにはバックアップとリカバリーを設定

## 📈 パフォーマンス期待値

### 典型的なパフォーマンスメトリクス

- **Issue分析**: 5-15秒
- **エージェント起動**: 10-30秒
- **シンプルなIssue解決**: 2-5分
- **複雑なIssue解決**: 10-30分
- **成功率**: 70-90%（学習により改善）

### スケーラビリティ

- **同時Issue処理**: 5-10件（設定可能）
- **エージェント制限**: 50+エージェント
- **データベース**: 10,000+セッションをサポート
- **メモリ使用量**: 2-4GB（通常）

## 🔄 メンテナンス

### 定期的なタスク

```bash
# 日次メンテナンス
npm run cleanup-logs     # 古いログをクリーンアップ
npm run backup-database  # データベースをバックアップ
npm run health-check     # システムヘルスチェック

# 週次メンテナンス
npm run optimize-system  # パフォーマンス最適化
npm run update-deps      # 依存関係を更新
npm run security-audit   # セキュリティスキャン
```

### 更新

```bash
# Claude Flowを更新
npm update claude-flow@alpha

# 自動化システムを更新
git pull origin main
npm install --legacy-peer-deps
```

## 🆘 サポート

### ヘルプを受ける

1. [トラブルシューティングセクション](#トラブルシューティング)を確認
2. エラーメッセージについてシステムログを確認
3. 問題を特定するために個別のコンポーネントをテスト
4. 既知の問題についてGitHubリポジトリを確認

### 便利なコマンド

```bash
# システム診断
npm run diagnose

# システムリセット
npm run reset-system

# ログをエクスポート
npm run export-logs

# システムステータス
npm run status
```

## 🎉 成功指標

次の場合にシステムが正常に動作しています：

1. ✅ ダッシュボードが「オンライン」ステータスを表示
2. ✅ WebhookがGitHubイベントを受信
3. ✅ テストIssueが自動的に解決される
4. ✅ 包括的なソリューションでPRが作成される
5. ✅ 学習システムがパターンの改善を示す
6. ✅ 成功率が70%以上

## 📚 次のステップ

システムが稼働したら：

1. **パフォーマンス監視**: 洞察のためにダッシュボードを監視
2. **設定調整**: ニーズに基づいて設定を調整
3. **学習の拡張**: システムにより多くのIssueから学習させる
4. **スケールアップ**: 必要に応じて同時エージェント数を増やす
5. **カスタマイズ**: 特定のワークフローにシステムを適応させる

---

🤖 **Claude Flow自動化システム** - AI駆動の自動化によるIssue解決の変革
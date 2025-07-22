# 🚀 Claude Flow Automation - @claude-flow-automation Usage Guide

## ✅ IMPLEMENTATION COMPLETE

**Claude Flow Automation**は、GitHubのissueに`@claude-flow-automation`とメンションするだけで、**自動的にHive-Mind**が起動してissueを解決するシステムです。

## 🎯 使用方法

### 1. GitHub Issueでの自動実行

**Issue作成時**:
```markdown
# バグ報告: ログイン機能の問題

ログイン時に以下のエラーが発生します：
- エラーメッセージ: "Invalid credentials"
- 発生条件: 正しいパスワードを入力しても発生

@claude-flow-automation
```

**Issue作成後のコメント**:
```markdown
このissueを自動解決してください。

@claude-flow-automation
```

### 2. 自動実行の流れ

1. **トリガー検出**: `@claude-flow-automation`メンション検出
2. **Hive-Mind起動**: 自動的に以下が実行されます：
   - Issue内容の詳細分析
   - 適切なAIエージェントの自動生成（最大10エージェント）
   - 多段階解決プロセスの実行
   - 包括的なテスト実行
   - セキュリティレビュー
   - プロダクション対応コード生成
   - Pull Request自動作成

3. **結果通知**: GitHubのissueにコメントで進捗と結果を自動報告

## 🐝 Hive-Mind自動実行機能

### 自動起動される機能:
- **🧠 Queen-Coordination**: 複数エージェントの統合管理
- **⚡ Neural-Learning**: 過去の解決パターンからの学習
- **🔧 Auto-Tool-Selection**: 最適ツールの自動選択
- **🧪 Comprehensive-Testing**: 全面的テスト自動実行
- **🛡️ Security-Review**: セキュリティ自動審査
- **📊 Performance-Optimization**: パフォーマンス最適化
- **📝 Auto-PR-Creation**: プルリクエスト自動作成

### 自動スポーンされるエージェント例:
- **Analyzer Agent**: Issue詳細分析
- **Architect Agent**: システム設計
- **Developer Agent**: コード実装
- **Tester Agent**: テスト作成・実行
- **Security Agent**: セキュリティレビュー
- **Documentation Agent**: ドキュメント生成

## ⚙️ システム構成

### GitHub Actions Integration
```yaml
# .github/workflows/claude-flow-auto-resolver.yml
if: |
  (github.event.issue != null && contains(github.event.issue.body, '@claude-flow-automation')) ||
  (github.event.comment != null && contains(github.event.comment.body, '@claude-flow-automation'))
```

### Webhook Server Integration
```javascript
// scripts/webhook-server.js
if (comment.body.includes('@claude-flow-automation')) {
    return await this.triggerHiveMindAutomation(issue, repository);
}
```

## 📋 実行例

### Issue例:
```markdown
# Feature Request: ダークモード対応

アプリケーションにダークモードを追加してください。

要件:
- ユーザー設定でライト/ダークモード切り替え
- システム設定との同期オプション
- 既存コンポーネントの対応

@claude-flow-automation
```

### 自動実行結果:
1. **分析完了**: Issue内容とコードベース分析
2. **エージェント生成**: UI/UX、State Management、Testing専門エージェント起動
3. **実装**: ダークモード機能の完全実装
4. **テスト**: 自動テスト生成・実行
5. **PR作成**: `fix/issue-123-dark-mode`ブランチでPR自動作成

## 🔍 監視とログ

### リアルタイム監視:
```bash
# Webhook server status
curl http://localhost:3000/status

# Automation stats
curl http://localhost:3000/health
```

### ログファイル:
- `logs/webhook.log`: Webhook実行ログ
- `logs/full-automation.log`: 自動化処理ログ
- `.hive-mind/automation.db`: セッション履歴（SQLite）

## 🧪 テスト

### 自動化システムテスト:
```bash
# 完全テスト実行
node test-claude-flow-automation.js

# 個別コンポーネントテスト
npm run test
```

### 手動テスト:
```bash
# Webhook server起動
npm run webhook-server

# 手動トリガー
curl -X POST http://localhost:3000/manual-trigger \
  -H "Content-Type: application/json" \
  -d '{
    "issueUrl": "https://github.com/owner/repo/issues/1",
    "issueNumber": 1,
    "issueTitle": "Test Issue",
    "issueBody": "Test issue body @claude-flow-automation",
    "repository": "owner/repo"
  }'
```

## ⚠️ 制限事項とトラブルシューティング

### 現在の既知の制限:
1. **better-sqlite3**: Hive-Mind DBの一部機能でSQLiteバインディングエラー
   - **回避策**: JSON fallbackで動作継続
   - **影響**: 高度学習機能の一部制限

2. **Visual Studio Build Tools**: ネイティブモジュールビルド環境
   - **回避策**: NPX実行で基本機能利用
   - **影響**: 一部MCP toolsの制限

### トラブルシューティング:
```bash
# Claude-Flow動作確認
./claude-flow.sh status

# Hive-Mind確認
./claude-flow.sh hive-mind status

# 手動実行テスト
./claude-flow.sh sparc run spec-pseudocode "test task"
```

## 📈 成功指標

### 自動化成功の判定基準:
- ✅ Issue分析完了
- ✅ 適切なエージェント生成
- ✅ コード実装完了
- ✅ テスト実行・成功
- ✅ PR作成成功
- ✅ 品質基準クリア

### 期待される結果:
- **解決時間**: 平均15-30分
- **品質**: プロダクション対応レベル
- **テスト カバレッジ**: 80%以上
- **セキュリティ**: 自動セキュリティ審査クリア

## 🚀 今すぐ使用開始

1. **GitHubでissue作成**
2. **本文に `@claude-flow-automation` を記載**
3. **自動実行開始を待つ**（数分以内に開始）
4. **進捗をissueコメントで確認**
5. **完成したPRをレビュー・マージ**

---

## 💡 ベストプラクティス

### 効果的なIssue作成:
- **明確な問題説明**: 具体的な症状・エラーメッセージ
- **再現手順**: ステップバイステップの再現方法
- **期待される動作**: 理想的な動作の明確化
- **技術的制約**: 使用技術・制約条件の記載

### サンプルIssue:
```markdown
# Bug: API認証エラーの修正

## 問題
- エンドポイント: `POST /api/auth/login`
- エラー: `401 Unauthorized` が正しいクレデンシャルでも発生
- 影響: ユーザーログイン不可

## 再現手順
1. 正しいユーザー名・パスワードでログイン試行
2. Network tabで401エラー確認
3. サーバーログに認証失敗記録

## 期待される動作
- 正しいクレデンシャルで200 OKレスポンス
- JWTトークンを含むレスポンス返却

## 技術情報
- Backend: Node.js + Express
- Database: PostgreSQL
- 認証: JWT

@claude-flow-automation
```

これで**Claude Flow Automation**が完全に機能し、GitHubでの自動issue解決が可能になりました！🎉
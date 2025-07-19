# Claude Code Action セットアップガイド

このガイドは、GitHubリポジトリでClaude Code Actionのセットアップを完了するのに役立ちます。

## 完了済みの前提条件

✅ `.github/workflows/claude.yml`にGitHubワークフローファイルが作成されました
✅ `ANTHROPIC_API_KEY`の代わりに`CLAUDE_CODE_OAUTH_TOKEN`を使用するよう設定されました

## 完了すべき次のステップ

### 1. Claude GitHub Appのインストール

GitHub MarketplaceでClaude Code appをインストールします：
1. [Claude Code GitHub App](https://github.com/apps/claude-code)にアクセス
2. "Install"をクリック
3. リポジトリまたは組織を選択
4. 必要な権限を付与

### 2. OAuthトークンの生成

Claude Code OAuthトークンをローカルで生成します：

```bash
claude setup-token
```

このコマンドは以下を実行します：
- 認証用のブラウザウィンドウを開く
- Claude Code用の個人OAuthトークンを生成
- コピー用のトークンを表示

**重要**: このトークンはClaude ProおよびMaxユーザーのみ利用可能です。

### 3. GitHubシークレットにトークンを追加

1. GitHubでリポジトリに移動
2. Settings → Secrets and variables → Actionsに移動
3. "New repository secret"をクリック
4. 新しいシークレットを作成：
   - 名前: `CLAUDE_CODE_OAUTH_TOKEN`
   - 値: [ステップ2で生成されたトークンを貼り付け]
5. "Add secret"をクリック

### 4. セットアップのテスト

1. 新しいIssueまたはプルリクエストを作成
2. 本文またはコメントで、`@claude`の後にリクエストを記述
3. Claudeが数秒以内に応答します

例:
```
@claude このコードをレビューして改善提案をお願いします
```

## 設定オプション

ワークフローファイルは追加の設定オプションをサポートします：

```yaml
allowed_tools: |
  Bash(npm install)
  Bash(npm run test)
  Bash(npm run build)
  
custom_instructions: |
  常にコーディング標準に従ってください
  新しいファイルにはTypeScriptを使用してください
```

## トラブルシューティング

- Claudeが応答しない場合は、Actionsタブでワークフローランをチェックしてください
- OAuthトークンがリポジトリシークレットに正しく設定されていることを確認してください
- Claude GitHub Appが適切な権限を持っていることを確認してください
- コメント/Issue/PRで`@claude`がメンションされていることを確認してください

## セキュリティ注意事項

- OAuthトークンをリポジトリに直接コミットしないでください
- トークンはGitHub Secretsにのみ保存してください
- セキュリティのためにトークンを定期的にローテーションしてください
- ワークフローはcontents、PRs、およびissuesへの書き込み権限を持ちます
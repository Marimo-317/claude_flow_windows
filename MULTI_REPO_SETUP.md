# 🚀 Claude Flow マルチリポジトリ開発環境セットアップ

## 概要

この環境により、**claude_flow_windows** の開発環境から複数のリポジトリ（**lunar-wallpaper** など）でClaude Flow自動化を使用できるようになります。

## ✅ 完了した作業

1. **lunar-wallpaper用のワークフローファイル作成**
   - `lunar-wallpaper-workflow.yml` を作成
   - 簡略化された自動化ワークフローを設計
   - Claude Code統合を含む

2. **セットアップドキュメント作成**
   - `setup-lunar-wallpaper.md` に詳細な手順を記載
   - GitHub Web UIとCLIの両方の方法を提供

## 🔧 lunar-wallpaperで自動化を有効にする手順

### ステップ1: GitHub Secretsの設定
1. https://github.com/Marimo-317/lunar-wallpaper/settings/secrets/actions にアクセス
2. "New repository secret" をクリック
3. 以下を設定：
   - **Name**: `CLAUDE_CODE_OAUTH_TOKEN`
   - **Value**: claude_flow_windowsで使用している同じトークン値

### ステップ2: ワークフローファイルの追加
1. https://github.com/Marimo-317/lunar-wallpaper で "Create new file" をクリック
2. ファイル名: `.github/workflows/claude-flow-auto-resolver.yml`
3. `lunar-wallpaper-workflow.yml` の内容をコピー＆ペースト
4. "Commit new file" で保存

### ステップ3: 動作確認
1. lunar-wallpaperリポジトリで新しいIssueを作成
2. Issue本文に `@claude-flow-automation` とメンション
3. GitHub Actionsで自動化が起動することを確認

## 📊 複数リポジトリ管理のベストプラクティス

### 現在のアーキテクチャ
```
claude_flow_windows/ (メイン開発環境)
├── .env (claude_flow_windows用設定)
├── automation/ (高度な自動化システム)
├── scripts/ (自動化スクリプト)
└── lunar-wallpaper-workflow.yml (他リポジトリ用テンプレート)

lunar-wallpaper/ (対象リポジトリ)
└── .github/
    └── workflows/
        └── claude-flow-auto-resolver.yml (簡略版ワークフロー)
```

### 推奨事項
1. **共通のCLAUDE_CODE_OAUTH_TOKEN**を使用
2. 各リポジトリに個別のワークフローファイルを配置
3. 複雑な自動化はclaude_flow_windowsで開発し、簡略版を他リポジトリに展開

## 🎯 今後の拡張可能性

### 1. 組織レベルの自動化
- GitHub Organization Secretsを使用して全リポジトリで共有
- Organization workflowsで一元管理

### 2. 動的リポジトリ切り替え
- 環境変数でターゲットリポジトリを指定
- CLIコマンドでリポジトリを切り替え

### 3. GitHub App化
- 専用のGitHub Appを作成
- 複数リポジトリへの統一的なアクセス

## 💡 使用例

### claude_flow_windowsでの開発
```bash
# 通常通り開発
cd claude_flow_windows
# @claude-flow-automation でIssueを作成
```

### lunar-wallpaperでの使用
```bash
# lunar-wallpaperリポジトリでIssueを作成
# 本文に @claude-flow-automation とメンション
# 自動的にClaude Codeが問題を解決
```

## ⚠️ 注意事項

1. **各リポジトリで個別にSecretを設定する必要があります**
2. **ワークフローファイルは各リポジトリに配置する必要があります**
3. **lunar-wallpaper用のワークフローは簡略版です（SQLiteなどの高度な機能は含まれません）**

## 📋 チェックリスト

- [x] lunar-wallpaper用ワークフローファイル作成
- [x] セットアップドキュメント作成
- [ ] lunar-wallpaperリポジトリにCLAUDE_CODE_OAUTH_TOKEN Secretを設定
- [ ] lunar-wallpaperリポジトリにワークフローファイルを追加
- [ ] テストIssueで動作確認

これで、両方のリポジトリでClaude Flow自動化を使用できるようになります！
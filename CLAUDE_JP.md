# Claude Code Configuration - SPARC Development Environment

## 🚨 CRITICAL: CONCURRENT EXECUTION FOR ALL ACTIONS

**ABSOLUTE RULE**: ALL operations MUST be concurrent/parallel in a single message:

### 🔴 MANDATORY CONCURRENT PATTERNS:
1. **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
2. **Task tool**: ALWAYS spawn ALL agents in ONE message with full instructions
3. **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
4. **Bash commands**: ALWAYS batch ALL terminal operations in ONE message
5. **Memory operations**: ALWAYS batch ALL memory store/retrieve in ONE message

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**Examples of CORRECT concurrent execution:**
```javascript
// ✅ CORRECT: Everything in ONE message
[Single Message]:
  - TodoWrite { todos: [10+ todos with all statuses/priorities] }
  - Task("Agent 1 with full instructions and hooks")
  - Task("Agent 2 with full instructions and hooks")
  - Task("Agent 3 with full instructions and hooks")
  - Read("file1.js")
  - Read("file2.js")
  - Write("output1.js", content)
  - Write("output2.js", content)
  - Bash("npm install")
  - Bash("npm test")
  - Bash("npm run build")
```

**Examples of WRONG sequential execution:**
```javascript
// ❌ WRONG: Multiple messages (NEVER DO THIS)
Message 1: TodoWrite { todos: [single todo] }
Message 2: Task("Agent 1")
Message 3: Task("Agent 2")
Message 4: Read("file1.js")
Message 5: Write("output1.js")
Message 6: Bash("npm install")
// This is 6x slower and breaks coordination!
```

### 🎯 CONCURRENT EXECUTION CHECKLIST:

Before sending ANY message, ask yourself:
- ✅ Are ALL related TodoWrite operations batched together?
- ✅ Are ALL Task spawning operations in ONE message?
- ✅ Are ALL file operations (Read/Write/Edit) batched together?
- ✅ Are ALL bash commands grouped in ONE message?
- ✅ Are ALL memory operations concurrent?

If ANY answer is "No", you MUST combine operations into a single message!

## プロジェクト概要
このプロジェクトは、Claude-Flow連携によるAI支援を通じて、体系的なテスト駆動開発のためのSPARC（Specification, Pseudocode, Architecture, Refinement, Completion）方法論を使用します。

## SPARC開発コマンド

### 主要SPARCコマンド
- `./claude-flow sparc modes`: 利用可能なすべてのSPARC開発モードを一覧表示
- `./claude-flow sparc run <mode> "<task>"`: タスクに対して特定のSPARCモードを実行
- `./claude-flow sparc tdd "<feature>"`: SPARC方法論を使用して完全なTDDワークフローを実行
- `./claude-flow sparc info <mode>`: 特定のモードの詳細情報を取得

### 標準ビルドコマンド
- `npm run build`: プロジェクトをビルド
- `npm run test`: テストスイートを実行
- `npm run lint`: リンターとフォーマットチェックを実行
- `npm run typecheck`: TypeScript型チェックを実行

## SPARC方法論ワークフロー

### 1. 仕様段階
```bash
# 詳細な仕様と要件を作成
./claude-flow sparc run spec-pseudocode "Define user authentication requirements"
```
- 明確な機能要件を定義
- エッジケースと制約をドキュメント化
- ユーザーストーリーと受入れ基準を作成
- 非機能要件を確立

### 2. 疑似コード段階
```bash
# アルゴリズムロジックとデータフローを開発
./claude-flow sparc run spec-pseudocode "Create authentication flow pseudocode"
```
- 複雑なロジックをステップに分解
- データ構造とインターフェースを定義
- エラーハンドリングとエッジケースを計画
- モジュール化可能でテスト可能なコンポーネントを作成

### 3. アーキテクチャ段階
```bash
# システムアーキテクチャとコンポーネント構造を設計
./claude-flow sparc run architect "Design authentication service architecture"
```
- システム図とコンポーネント関係を作成
- APIコントラクトとインターフェースを定義
- データベーススキーマとデータフローを計画
- セキュリティとスケーラビリティパターンを確立

### 4. 改良段階（TDD実装）
```bash
# テスト駆動開発サイクルを実行
./claude-flow sparc tdd "implement user authentication system"
```

**TDDサイクル:**
1. **Red（赤）**: 最初に失敗するテストを書く
2. **Green（緑）**: テストに合格する最小限のコードを実装
3. **Refactor（リファクタリング）**: コードを最適化・クリーンアップ
4. **Repeat（繰り返し）**: 機能が完成するまで続ける

### 5. 完成段階
```bash
# 統合、ドキュメント、検証
./claude-flow sparc run integration "integrate authentication with user management"
```
- すべてのコンポーネントを統合
- エンドツーエンドテストを実行
- 包括的なドキュメントを作成
- 元の要件に対して検証

## SPARCモードリファレンス

### 開発モード
- **`architect`**: システム設計とアーキテクチャ計画
- **`code`**: クリーンでモジュール化されたコード実装
- **`tdd`**: テスト駆動開発とテスト
- **`spec-pseudocode`**: 要件とアルゴリズム計画
- **`integration`**: システム統合と調整

### 品質保証モード
- **`debug`**: トラブルシューティングとバグ解決
- **`security-review`**: セキュリティ分析と脆弱性評価
- **`refinement-optimization-mode`**: パフォーマンス最適化とリファクタリング

### サポートモード
- **`docs-writer`**: ドキュメント作成とメンテナンス
- **`devops`**: デプロイメントとインフラ管理
- **`mcp`**: 外部サービス統合
- **`swarm`**: 複雑なタスクのためのマルチエージェント調整

## Claude Codeスラッシュコマンド

Claude Codeスラッシュコマンドは`.claude/commands/`で利用可能です：

### プロジェクトコマンド
- `/sparc`: SPARC方法論ワークフローを実行
- `/sparc-<mode>`: 特定のSPARCモードを実行（例：/sparc-architect）
- `/claude-flow-help`: すべてのClaude-Flowコマンドを表示
- `/claude-flow-memory`: メモリシステムと対話
- `/claude-flow-swarm`: マルチエージェントスワームを調整

### スラッシュコマンドの使用方法
1. Claude Codeで`/`を入力して利用可能なコマンドを表示
2. コマンドを選択するか名前を入力
3. コマンドはコンテキスト対応でプロジェクト固有
4. カスタムコマンドを`.claude/commands/`に追加可能

## コードスタイルとベストプラクティス

### SPARC開発原則
- **モジュール設計**: ファイルを500行以下に保ち、論理的なコンポーネントに分割
- **環境安全性**: 秘密情報や環境固有の値をハードコーディングしない
- **テストファースト**: 実装前に常にテストを書く（Red-Green-Refactor）
- **クリーンアーキテクチャ**: 関心の分離、依存性注入を使用
- **ドキュメント**: 明確で最新のドキュメントを維持

### コーディング標準
- 型安全性と優れたツールサポートのためにTypeScriptを使用
- 一貫した命名規則に従う（変数にはcamelCase、クラスにはPascalCase）
- 適切なエラーハンドリングとロギングを実装
- 非同期操作にはasync/awaitを使用
- 継承よりもコンポジションを優先

### メモリと状態管理
- セッション間の永続状態にはclaude-flowメモリシステムを使用
- 名前空間キーを使用して進捗と発見を保存
- 新しいタスクを開始する前に以前の作業をクエリ
- バックアップと共有のためにメモリをエクスポート/インポート

## SPARCメモリ統合

### SPARC開発のためのメモリコマンド
```bash
# プロジェクト仕様を保存
./claude-flow memory store spec_auth "User authentication requirements and constraints"

# アーキテクチャ決定を保存
./claude-flow memory store arch_decisions "Database schema and API design choices"

# テスト結果とカバレッジを保存
./claude-flow memory store test_coverage "Authentication module: 95% coverage, all tests passing"

# 以前の作業をクエリ
./claude-flow memory query auth_implementation

# プロジェクトメモリをエクスポート
./claude-flow memory export project_backup.json
```

### メモリ名前空間
- **`spec`**: 要件と仕様
- **`arch`**: アーキテクチャと設計決定
- **`impl`**: 実装ノートとコードパターン
- **`test`**: テスト結果とカバレッジレポート
- **`debug`**: バグレポートと解決ノート

## ワークフロー例

### 機能開発ワークフロー
```bash
# 1. 仕様から開始
./claude-flow sparc run spec-pseudocode "User profile management feature"

# 2. アーキテクチャを設計
./claude-flow sparc run architect "Profile service architecture with data validation"

# 3. TDDで実装
./claude-flow sparc tdd "user profile CRUD operations"

# 4. セキュリティレビュー
./claude-flow sparc run security-review "profile data access and validation"

# 5. 統合テスト
./claude-flow sparc run integration "profile service with authentication system"

# 6. ドキュメント作成
./claude-flow sparc run docs-writer "profile service API documentation"
```

### バグ修正ワークフロー
```bash
# 1. デバッグと分析
./claude-flow sparc run debug "authentication token expiration issue"

# 2. 回帰テストを書く
./claude-flow sparc run tdd "token refresh mechanism tests"

# 3. 修正を実装
./claude-flow sparc run code "fix token refresh in authentication service"

# 4. セキュリティレビュー
./claude-flow sparc run security-review "token handling security implications"
```

## 設定ファイル

### Claude Code統合
- **`.claude/commands/`**: すべてのSPARCモードのためのClaude Codeスラッシュコマンド
- **`.claude/logs/`**: 会話とセッションログ

### SPARC設定
- **`.roomodes`**: SPARCモード定義と設定（自動生成）
- **`.roo/`**: SPARCテンプレートとワークフロー（自動生成）

### Claude-Flow設定
- **`memory/`**: 永続メモリとセッションデータ
- **`coordination/`**: マルチエージェント調整設定
- **`CLAUDE.md`**: Claude Codeのためのプロジェクト指示

## Gitワークフロー統合

### SPARCでのコミット戦略
- **仕様コミット**: 要件分析完了後
- **アーキテクチャコミット**: 設計段階完了後
- **TDDコミット**: 各Red-Green-Refactorサイクル後
- **統合コミット**: 成功したコンポーネント統合後
- **ドキュメントコミット**: ドキュメント更新完了後

### ブランチ戦略
- **`feature/sparc-<feature-name>`**: SPARC方法論での機能開発
- **`hotfix/sparc-<issue>`**: SPARCデバッグワークフローを使用したバグ修正
- **`refactor/sparc-<component>`**: 最適化モードを使用したリファクタリング

## トラブルシューティング

### 一般的なSPARCの問題
- **モードが見つからない**: `.roomodes`ファイルが存在し、有効なJSONであることを確認
- **メモリ永続化**: `memory/`ディレクトリに書き込み権限があることを確認
- **ツールアクセス**: 選択したモードに必要なツールが利用可能であることを確認
- **名前空間の競合**: 異なる機能に一意のメモリ名前空間を使用

### デバッグコマンド
```bash
# SPARC設定を確認
./claude-flow sparc modes

# メモリシステムを確認
./claude-flow memory stats

# システムステータスを確認
./claude-flow status

# 詳細なモード情報を表示
./claude-flow sparc info <mode-name>
```

## プロジェクトアーキテクチャ

このSPARC対応プロジェクトは体系的な開発アプローチに従います：
- **モジュール設計による明確な関心の分離**
- **信頼性と保守性を確保するテスト駆動開発**
- **継続的改善のための反復的改良**
- **チームコラボレーションのための包括的ドキュメント**
- **専門化されたSPARCモードによるAI支援開発**

## 重要な注意事項

- コミット前に必ずテストを実行（`npm run test`）
- セッション間のコンテキスト維持にSPARCメモリシステムを使用
- TDD段階ではRed-Green-Refactorサイクルに従う
- 将来の参照のためにアーキテクチャ決定をメモリにドキュメント化
- 認証やデータ処理コードの定期的なセキュリティレビュー
- Claude CodeスラッシュコマンドによるSPARCモードへの迅速なアクセス

SPARC方法論の詳細については、以下を参照してください：https://github.com/ruvnet/claude-code-flow/docs/sparc.md

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
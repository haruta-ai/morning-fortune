# Every Morning Fortune

毎朝30秒、自分を整える占いPWAです。

## 現在の状態

- App Version: 0.2.0
- Engine Version: 1.0.0
- Content Version: 0.2.0-seed
- 外部APIなし
- 外部分析なし
- GitHub Pages対応
- iPhone / Safari / PWA対応
- IndexedDBによる端末内保存

## 実装済み

- Every Morning共通スプラッシュ
- プロフィール登録
- Profile Vector
- Day Vector
- 8 Signals
- 総合運
- 恋愛運
- 金運
- 仕事運
- 星1〜5評価
- 16テーマ選定
- Today's Key
- Lucky Action
- Today's Promise
- 当日結果のIndexedDB保存
- Every Morning Studio基盤
- JSONバックアップ／復元
- Service Worker
- PWA manifest

## ローカルで確認する方法

VS Codeでこのフォルダを開き、ターミナルで以下を実行します。

```bash
python3 -m http.server 8000
```

Safariで以下を開きます。

```text
http://localhost:8000
```

## GitHub Pages

リポジトリの `main` ブランチ直下を公開対象にします。

Settings → Pages → Deploy from a branch → main / root

## 主要ファイル

```text
/
├── index.html
├── studio.html
├── styles.css
├── manifest.webmanifest
├── service-worker.js
├── data/
├── docs/
└── js/
```

## 次の開発予定

- 夜の振り返り
- Studio編集機能
- 重複文章チェック
- コンテンツ品質チェック
- 利用分析
- 月次振り返り

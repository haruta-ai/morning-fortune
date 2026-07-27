# 古い試作からGitHub整理版へ入れ替える手順

対象フォルダ:

```text
~/Documents/morning-fortune
```

これはGitHubからCloneした正式リポジトリです。

## 1. VS Codeを一度閉じる

現在開いている `morning-fortune` を閉じます。

## 2. Finderで正式リポジトリを開く

Finderで次を開きます。

```text
書類 / morning-fortune
```

## 3. 古い試作をバックアップ

正式リポジトリの中に次のフォルダを作ります。

```text
old-prototype-backup
```

古いファイルをこの中へ移動します。

例:

- app.js
- script.js
- style.css
- sw.js
- manifest.json
- 古いアイコン
- 古いindex.html
- 古いservice-worker.js

`.git` フォルダは絶対に移動・削除しないでください。
Finderでは通常 `.git` は表示されません。

## 4. 新しい整理版をコピー

このZIPを展開し、`morning-fortune-github-sprint-2` フォルダの中身をすべて、正式リポジトリ直下へコピーします。

コピー後の直下は次のようになります。

```text
morning-fortune/
├── .gitignore
├── README.md
├── index.html
├── studio.html
├── styles.css
├── manifest.webmanifest
├── service-worker.js
├── data/
├── docs/
└── js/
```

## 5. VS Codeで開き直す

VS Codeから次を開きます。

```text
~/Documents/morning-fortune
```

上部にRestricted Modeが表示されたら、Trust this folderを選びます。

## 6. ローカル確認

VS Codeのターミナルで実行します。

```bash
python3 -m http.server 8000
```

Safariで開きます。

```text
http://localhost:8000
```

## 7. GitHubへ反映

VS Code左側のソース管理アイコンを開きます。

Commitメッセージ:

```text
Replace old prototype with GitHub Sprint 2
```

Commit後、Sync ChangesまたはPushを押します。

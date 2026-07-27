# GitHub版へ入れ替える手順

対象: `haruta-ai/morning-fortune` をMacへCloneしたフォルダ

## 最も安全な方法
1. VS Codeで現在の `morning-fortune` を閉じる。
2. Finderでクローン済み `morning-fortune` フォルダを開く。
3. 中の古いファイルを `old-prototype-backup` フォルダへ移動する。
4. このZIPを展開し、`morning-fortune-sprint-1.2` の「中身」をすべてクローン済み `morning-fortune` 直下へコピーする。
5. VS Codeで `morning-fortune` を開き直す。
6. ターミナルで `python3 -m http.server 8000`。
7. Safariで `http://localhost:8000` を確認する。
8. VS Codeのソース管理から変更をCommitし、Sync ChangesでGitHubへ反映する。

## Commitメッセージ
`Replace prototype with EMF Sprint 1.2 engine`

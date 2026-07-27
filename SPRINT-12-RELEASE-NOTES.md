# Sprint 12 Release Notes — v1.0.1

## 実装済み

- 起動失敗時の復旧パネル
- 「もう一度読み込む」ボタン
- 「キャッシュを更新」ボタン
- 常時確認できる「アプリ管理」欄
- オフライン表示
- Service Worker更新通知
- Every Morning Fortune専用キャッシュだけを更新・削除する処理
- アプリバージョン表示

## データ保護

「キャッシュを更新」は、`emf-`で始まるCache Storageだけを削除します。
プロフィール・毎日の結果・振り返りを保存するIndexedDBとlocalStorageは削除しません。
他のGitHub Pagesアプリのキャッシュも削除しません。

## 未確認

- iPhone Safari実機での表示と操作
- ホーム画面追加後の起動
- 実機でのオフライン再起動

これらは実機確認後にStable判定します。

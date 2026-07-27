# Release Validation — Version 1.0.0

## 基準

Sprint 10 RC1の安定構成から再構築し、Sprint 11の破損コードは取り込んでいません。

## この環境で実施済み

- JavaScript全ファイルの構文検査：合格
- JSON／manifest構文検査：合格
- index.htmlとstudio.html、および全主要静的ファイルのHTTP応答：合格
- `registerServiceWorker` の定義と呼び出しの整合確認：合格
- `registerAppServiceWorker`／`initializeApp` など破損版由来の未定義参照がないことを確認
- Service Workerのキャッシュ対象ファイル存在確認：合格
- 外部API・従量課金サービス：未使用

## この環境では未実施

実ブラウザの自動起動は実行環境のローカル接続制限により完了できませんでした。したがって、次は実機で確認してください。

- iPhone Safariでの起動
- ホーム画面への追加
- 実機オフライン再起動
- GitHub Pages本番URLでの更新挙動

本ZIPは、静的検査済みの **Version 1.0.0 Final Candidate** です。

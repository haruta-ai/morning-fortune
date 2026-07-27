# CHANGELOG

## 0.2.1 — Sprint 2 Phase 1

- `engine.js` を追加
- UIと占いエンジンの接続を分離
- 起動状態を `appState` に集約
- Service Worker登録処理を整理
- 当日結果取得処理を整理
- DOM生成を安全な `replaceChildren` ベースへ変更
- Service Workerキャッシュを更新

## 0.2.0 — Sprint 2

- EMF Method v1占いエンジンを実装
- Profile Vector / Day Vectorを実装
- 8 Signalsを実装
- 総合運・恋愛運・金運・仕事運を実装
- 星1〜5の評価を実装
- 16テーマの特徴ベクトルと選定ロジックを実装
- 同日・同プロフィールで結果が変わらない決定論的生成を実装
- dailyResultsへのスナップショット保存を実装

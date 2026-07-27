# Every Morning Fortune 統合最終仕様書 v1.0

**統合対象**  
- Every Morning Fortune Bible v1.0  
- Fortune Engine Technical Specification v1.0  
- Every Morning Studio v1.0  

**文書種別**：JavaScript実装用・最終仕様書  
**対象リリース**：MVP v1.0  
**策定日**：2026年7月26日  
**実装基盤**：GitHub Pages / HTML / CSS / JavaScript / PWA / 端末内保存  
**外部API・従量課金サービス**：使用しない  

---

## 0. この仕様書の位置づけ

本書は、Every Morning Fortune（以下「EMF」）のブランド思想、独自占術、画面体験、文章データ、保存形式、管理画面、品質管理、テスト、完成判定を一つに統合した実装上の正本である。

実装中に判断が分かれた場合は、次の優先順位で本書を解釈する。

1. 利用者の安心・尊厳・自己決定
2. 占い結果全体の一貫性
3. 毎朝30秒で楽しめる軽さ
4. 再現性・保守性・検証可能性
5. 演出や機能の多さ

本書に記載のない新機能は、MVP完成後に追加提案として扱い、MVPへ無断で混入させない。

---

# 1. ブランド・占い・UXの最上位原則

## 1.1 ブランド目的

EMFは「未来を断定する占い」ではなく、利用者が朝に自分を整え、小さな一歩を選ぶための占い体験である。

中心価値は次の三つ。

- **楽しみ**：毎朝、今日はどんな言葉に出会えるか楽しみになる
- **安心**：低い運勢でも傷つけられず、自分を守るヒントが得られる
- **前進**：無理のない行動を一つ選べる

## 1.2 禁止する体験設計

以下は採用しない。

- 不安、恐怖、罪悪感、焦りを煽って継続利用させる
- 「見ないと不幸になる」「今日中に課金しないと運を逃す」等の脅し
- 病気、事故、死、破産、離婚、裏切り等の重大事象を断定する
- 利用者の判断を占いへ従属させる
- 星1を「最悪」「凶」「何をしても失敗」と表現する
- 医療、法律、投資、ギャンブル等の専門判断を占いで代替する
- 同じ日に再読み込みを繰り返すと都合のよい結果へ変わる仕様
- 他者の心情や行動を事実として断定する
- 個人情報を無断で外部送信・収集する

## 1.3 占い文の基本トーン

- 断定より提案
- 命令より選択肢
- 抽象論だけで終わらず、小さな実行へつなげる
- 過度に幼くしない
- 説教しない
- 低評価ほど、刺激を弱め、安心と自己保護を厚くする
- 高評価でも万能感や過信を煽らない

### 推奨表現

- 「今日は〜を意識すると流れが整いそうです」
- 「急がず、一つずつ確かめるのが味方になります」
- 「小さな一歩が、思った以上に良い連鎖を生みそうです」
- 「無理に進めるより、守る選択にも価値があります」

### 禁止表現

- 「必ず成功する」
- 「絶対に連絡が来る」
- 「事故に遭う」
- 「裏切られる」
- 「あなたは運が悪い」
- 「この占いに従わないと後悔する」

## 1.4 30秒UX

朝の主要画面は、通常の読書速度で約30秒以内に把握できる情報量とする。

### 初期表示の優先順位

1. 今日のテーマ
2. 総合運の星と短い要約
3. 今日の鍵
4. 今日の約束
5. 開運アクション
6. 恋愛運・金運・仕事運
7. 詳細説明
8. 夜の振り返りへの導線

主要画面の本文合計は、原則として日本語 **260〜420文字**。  
折りたたみ後の詳細を含めても **700文字以内**を目安とする。

## 1.5 朝と夜の一つの物語

朝は「今日の過ごし方を選ぶ」、夜は「できたことを見つける」体験とする。

朝に提示した以下の情報を夜へ引き継ぐ。

- 今日のテーマ
- 今日の鍵
- 今日の約束
- 開運アクション
- 最も注意または活用したい運勢軸

夜の振り返りは採点ではなく、自己認識の補助とする。

---

# 2. EMF Methodの全体設計

## 2.1 設計目標

EMF Methodは、占星術や血液型占い等の既存占術をそのまま再現するものではない。プロフィール、日付、曜日、季節、周期、複数運勢軸を組み合わせ、同一条件で同一結果を返すEMF独自のエンターテインメント方式である。

必須特性は次のとおり。

- 決定論的：同じ入力では同じ結果
- 説明可能：各スコアの構成要素を開発者が追跡可能
- 調整可能：重みや閾値をStudioで検証可能
- 偏り抑制：特定テーマ・星・文章に集中しにくい
- プライバシー優先：端末内で計算完結
- バージョン固定：ロジック更新前後で結果を区別可能

## 2.2 用語

| 用語 | 定義 |
|---|---|
| Profile Vector | 生年月日等から作る利用者固有の数値群 |
| Day Vector | 対象日から作る日固有の数値群 |
| Axis | 総合・恋愛・金運・仕事の4運勢軸 |
| Signal | 0〜100の補助指標 |
| Raw Score | 補正前の運勢値 |
| Final Score | 0〜100へ収めた確定運勢値 |
| Theme | 計算結果から導く今日の統一テーマ |
| Content Pack | 占い文章を構成するデータ集合 |
| Engine Version | 計算ロジックの版番号 |
| Content Version | 文章データの版番号 |

## 2.3 入力項目

### MVP必須

- 生年月日（年・月・日）
- 表示名またはニックネーム（任意）
- 血液型（任意、A / B / O / AB / 不明）
- 出生時間帯（任意、不明 / 深夜 / 朝 / 昼 / 夕方 / 夜）
- 居住地域のタイムゾーン（端末から取得、原則 Asia/Tokyo）
- 対象ローカル日付

### 将来追加候補

- 出生時刻の分単位
- 出生地
- 目標カテゴリ
- 生活リズム
- 月経周期等の健康情報

健康情報等のセンシティブ項目はMVPでは扱わない。

## 2.4 正規化

```text
birthDate   = YYYY-MM-DD
bloodType   = A | B | O | AB | UNKNOWN
birthSlot   = MIDNIGHT | MORNING | DAY | EVENING | NIGHT | UNKNOWN
displayName = Unicode正規化NFKC、前後空白除去、最大24文字
targetDate  = 端末ローカルのYYYY-MM-DD
timezone    = IANA形式。取得不能時はAsia/Tokyo
```

表示名は画面表示にのみ使い、占い計算の主要値には使用しない。名前を変えただけで運勢が変わる混乱を避けるためである。

---

# 3. プロフィール値の生成方法

## 3.1 基本数値

生年月日を `Y, M, D` とする。

```js
birthDigitSum = sumDigits(`${Y}${pad2(M)}${pad2(D)}`);
lifeNumber = digitalRoot(birthDigitSum);       // 1〜9
dayNumber = digitalRoot(D);                    // 1〜9
monthNumber = digitalRoot(M);                  // 1〜9
yearNumber = digitalRoot(Y);                   // 1〜9
```

`digitalRoot(n)` は、0を除き1〜9へ縮約する。

```js
function digitalRoot(n) {
  return n === 0 ? 0 : 1 + ((n - 1) % 9);
}
```

## 3.2 血液型値

血液型は人格断定に使わず、結果の微細な位相差だけに使う。

```js
BLOOD_VALUE = {
  A: 11,
  B: 23,
  O: 37,
  AB: 47,
  UNKNOWN: 0
};
```

全スコアへの影響は最大±2.0点相当とし、血液型だけで星が大きく変わらないようにする。

## 3.3 出生時間帯値

```js
BIRTH_SLOT_VALUE = {
  MIDNIGHT: 5,  // 0:00–4:59
  MORNING: 13,  // 5:00–10:59
  DAY: 29,      // 11:00–15:59
  EVENING: 43,  // 16:00–18:59
  NIGHT: 59,    // 19:00–23:59
  UNKNOWN: 0
};
```

影響は最大±1.5点相当。

## 3.4 Profile Seed

個人を直接識別しない計算用文字列を作る。

```text
profileSeedSource =
  "EMF|v1|" +
  birthDate + "|" +
  bloodType + "|" +
  birthSlot
```

Web Crypto APIのSHA-256でハッシュし、先頭16バイトを4つの符号なし32bit整数として利用する。

```js
profileHash = SHA256(profileSeedSource);
p0, p1, p2, p3 = Uint32(profileHash[0..15]);
```

Web Crypto APIが利用できない環境では、MVP対象外とせず、FNV-1a 32bitを4種類のsaltで実行するフォールバックを備える。ただし保存データには `hashMode: "SHA-256" | "FNV1A_FALLBACK"` を記録する。

## 3.5 Profile Vector

```js
profileVector = {
  core:      unit(p0), // 0以上1未満
  relation:  unit(p1),
  material:  unit(p2),
  vocation:  unit(p3),
  lifeNumber,
  dayNumber,
  monthNumber,
  yearNumber,
  bloodValue,
  birthSlotValue
};
```

```js
function unit(uint32) {
  return uint32 / 4294967296;
}
```

プロフィール情報は運勢の「傾向差」に使い、日付由来の変動を打ち消さない。

---

# 4. 日運値の生成方法

## 4.1 日付由来の基本値

対象日を `TY, TM, TD` とする。

```js
dateNumber = digitalRoot(sumDigits(`${TY}${pad2(TM)}${pad2(TD)}`));
weekday = 0..6; // 日曜0〜土曜6
dayOfYear = 1..366;
daysFromEpoch = floor((localDateMidnight - 2000-01-01) / 86400000);
```

UTC変換による日付ずれを避け、ローカル年月日から日数を算出する専用関数を使う。

## 4.2 季節

日本向けMVPでは気象データを取得せず、暦上の季節を用いる。

| seasonId | 期間 |
|---|---|
| early_spring | 2/4〜3/19 |
| spring | 3/20〜5/4 |
| early_summer | 5/5〜6/20 |
| rainy | 6/21〜7/19 |
| summer | 7/20〜8/31 |
| autumn | 9/1〜11/6 |
| early_winter | 11/7〜12/20 |
| winter | 12/21〜2/3 |

境界日はStudio設定で変更可能とする。うるう年にも対応する。

## 4.3 Day Seed

```text
daySeedSource =
  "EMF|v1|" +
  targetDate + "|" +
  seasonId + "|" +
  engineVersion
```

SHA-256から `d0〜d7` の8個の32bit整数を得る。

## 4.4 周期信号

固定周期だけではパターンが単調になるため、異なる周期を合成する。

```js
annualWave  = sin(2π * dayOfYear / yearLength);
lunarLike   = sin(2π * daysFromEpoch / 29.53059); // 天文学的月齢の断定には使わない
weeklyWave  = sin(2π * weekday / 7);
shortWave   = sin(2π * daysFromEpoch / 11);
mediumWave  = cos(2π * daysFromEpoch / 37);
```

`lunarLike` は表示上「月齢」と呼ばず、内部の周期変化としてのみ利用する。

## 4.5 Day Vector

```js
dayVector = {
  energy:      mixUnit(d0, annualWave),
  connection:  mixUnit(d1, weeklyWave),
  resource:    mixUnit(d2, mediumWave),
  focus:       mixUnit(d3, shortWave),
  pace:        mixUnit(d4, -annualWave),
  caution:     mixUnit(d5, lunarLike),
  openness:    mixUnit(d6, weeklyWave * annualWave),
  recovery:    mixUnit(d7, -shortWave),
  dateNumber,
  weekday,
  dayOfYear,
  seasonId
};
```

```js
function mixUnit(uint32, wave) {
  const hashPart = unit(uint32);
  return clamp01(hashPart * 0.72 + ((wave + 1) / 2) * 0.28);
}
```

日ごとの変化は主にハッシュ値、緩やかな季節感は周期信号が担う。

---

# 5. 補助指標（Signals）の算出

最終文章を一貫させるため、4運勢だけでなく8つの補助指標を作る。

| Signal | 意味 |
|---|---|
| vitality | 行動エネルギー |
| receptivity | 受け取りやすさ |
| connection | 対人の流れ |
| expression | 伝える力 |
| focus | 集中・整理 |
| material | お金・物・資源 |
| caution | 慎重さの必要度 |
| recovery | 休息・立て直し |

各Signalは0〜100。

### 5.1 共通式

```js
signal = clamp(
  50
  + profileTerm
  + dayTerm
  + cycleTerm
  + interactionTerm,
  0,
  100
);
```

### 5.2 具体式

`center(u) = (u - 0.5) * 2` とし、-1〜+1へ変換する。

```js
vitality =
  50
  + 12 * center(profile.core)
  + 20 * center(day.energy)
  +  6 * annualWave
  +  5 * center(profile.core) * center(day.energy);

receptivity =
  50
  + 10 * center(profile.relation)
  + 18 * center(day.openness)
  +  7 * center(day.recovery)
  -  4 * center(day.caution);

connection =
  50
  + 14 * center(profile.relation)
  + 20 * center(day.connection)
  +  5 * weeklyWave
  +  4 * center(profile.relation) * center(day.connection);

expression =
  50
  +  8 * center(profile.core)
  +  8 * center(profile.relation)
  + 18 * center(day.openness)
  -  6 * center(day.caution);

focus =
  50
  + 14 * center(profile.vocation)
  + 20 * center(day.focus)
  +  5 * mediumWave
  -  4 * abs(shortWave);

material =
  50
  + 14 * center(profile.material)
  + 20 * center(day.resource)
  +  5 * mediumWave
  -  5 * center(day.caution);

caution =
  50
  + 24 * center(day.caution)
  -  6 * center(profile.core)
  -  4 * center(day.recovery)
  +  4 * abs(lunarLike);

recovery =
  50
  + 12 * center(profile.core)
  + 20 * center(day.recovery)
  -  8 * center(day.energy)
  +  6 * center(day.caution);
```

最後に各値を四捨五入し、0〜100へ収める。

### 5.3 小規模プロフィール補正

```js
bloodOffset = signedNoise(bloodValue, targetDate) * 2.0;
slotOffset  = signedNoise(birthSlotValue, targetDate) * 1.5;
```

補正はSignalごとに符号を変え、全項目へ同じ方向に加算しない。

---

# 6. 4運勢軸の算出方法

## 6.1 Raw Score

### 総合運

```js
overallRaw =
  0.22 * vitality
+ 0.14 * receptivity
+ 0.14 * connection
+ 0.16 * focus
+ 0.10 * material
+ 0.14 * recovery
+ 0.10 * (100 - caution);
```

### 恋愛運

恋愛は交際状況を推測せず、好意・信頼・会話・自分へのいたわりを含む広義の関係運として扱う。

```js
loveRaw =
  0.30 * connection
+ 0.24 * receptivity
+ 0.22 * expression
+ 0.10 * vitality
+ 0.08 * recovery
+ 0.06 * (100 - caution);
```

### 金運

金運は一攫千金や投機を煽らず、管理・選択・価値の受け取り方として扱う。

```js
moneyRaw =
  0.34 * material
+ 0.22 * focus
+ 0.14 * caution
+ 0.12 * receptivity
+ 0.10 * recovery
+ 0.08 * vitality;
```

注意度が金運では正方向なのは、確認・節度が資源管理に役立つため。ただし注意度が高すぎる場合は後段で過剰慎重補正を行う。

### 仕事運

仕事は会社員だけでなく、家事、学業、創作、役割遂行を含む。

```js
workRaw =
  0.32 * focus
+ 0.20 * vitality
+ 0.16 * expression
+ 0.12 * connection
+ 0.10 * material
+ 0.10 * (100 - caution);
```

## 6.2 非線形補正

極端な高得点・低得点が頻発しないよう、中心へ緩やかに圧縮する。

```js
function soften(raw) {
  const centered = raw - 50;
  return 50 + Math.tanh(centered / 28) * 31;
}
```

結果は概ね19〜81へ収まり、追加補正で最終0〜100とする。

## 6.3 相互作用補正

```js
overallAdj =
  + synergy(vitality, focus, 3.0)
  + synergy(receptivity, recovery, 2.0)
  - overload(caution, vitality, 3.0);

loveAdj =
  + synergy(connection, expression, 4.0)
  + synergy(receptivity, recovery, 2.0)
  - overload(caution, expression, 3.0);

moneyAdj =
  + synergy(material, focus, 3.5)
  + balancedCaution(caution, 2.5)
  - overload(caution, material, 2.5);

workAdj =
  + synergy(focus, vitality, 4.0)
  + synergy(expression, connection, 2.0)
  - overload(caution, vitality, 3.0);
```

- `synergy(a,b,max)`：両方65以上のとき最大max加点
- `overload(caution,target,max)`：caution 75以上かつtarget 45未満で最大max減点
- `balancedCaution(caution,max)`：55〜72で加点、85超では減点

## 6.4 日間急変の抑制

同じ利用者で前日との差が過度にならないよう、表示スコアのみ平滑化する。ただし結果の保存有無に依存させてはならないため、前日値もエンジンで再計算する。

```js
delta = todayBase - yesterdayBase;

if (abs(delta) > 28) {
  todaySmoothed = yesterdayBase + sign(delta) * (28 + (abs(delta) - 28) * 0.35);
} else {
  todaySmoothed = todayBase;
}
```

星評価の変化は原則1日最大2段階。例外は、ロジックバージョン更新日、プロフィール変更日、日付境界異常時。

## 6.5 Final Score

```js
finalScore = round(clamp(
  soften(rawScore) + interactionAdjustment + microVariation,
  0,
  100
));
```

`microVariation` は軸専用ハッシュから得る -1.5〜+1.5点。星評価を恣意的に操作しない。

---

# 7. 星評価

## 7.1 基本閾値

| 星 | Final Score | 意味 |
|---|---:|---|
| ★★★★★ | 76〜100 | 広げる日 |
| ★★★★☆ | 64〜75 | 進める日 |
| ★★★☆☆ | 50〜63 | 整える日 |
| ★★☆☆☆ | 38〜49 | 選ぶ日 |
| ★☆☆☆☆ | 0〜37 | 守る日 |

星は優劣や人格評価ではない。「今日に合う進み方」の分類である。

## 7.2 分布目標

長期シミュレーションで各軸の分布を次の範囲へ収める。

| 星 | 目標比率 |
|---|---:|
| 5 | 8〜16% |
| 4 | 20〜30% |
| 3 | 28〜38% |
| 2 | 18〜28% |
| 1 | 8〜16% |

全軸が同日に同じ星になる割合は12%以下を目標とする。  
4軸すべて星1、または4軸すべて星5は、プロフィール当たり年間各2日以下を目標とする。

## 7.3 表現ルール

### 星5

- 勢い、広がり、受け取り、挑戦
- 過信防止の一文を含めてもよい
- 「何でも成功」は禁止

### 星4

- 具体的な前進
- 小さな決断
- 人との協力

### 星3

- バランス、調整、日常の丁寧さ
- 「普通」「退屈」と表現しない

### 星2

- 優先順位、確認、余白
- 失敗予告にしない

### 星1

- 休む、守る、急がない、境界線を引く
- 「悪い日」「不運」「危険日」と呼ばない
- 必ず安心文を含む
- 開運アクションは負荷の低いものに限定
- 大きな契約等は「占いだけで延期を決めず、必要な確認を丁寧に」とする

---

# 8. 今日のテーマ決定ロジック

## 8.1 原則

テーマは先にランダム選択しない。計算済みのSignals、4軸、星、前日差、季節から候補を採点し、最も結果を説明できるテーマを選ぶ。

## 8.2 MVPテーマ体系

「テーマ100選」は採用せず、意味の重複が少なく文章統一しやすい **16テーマ**をMVP標準とする。

| themeId | 表示名 | 中心概念 |
|---|---|---|
| begin | はじめる | 小さな開始 |
| advance | 一歩進める | 前進 |
| connect | つながる | 関係・協力 |
| express | 伝える | 言葉・表現 |
| receive | 受け取る | 好意・成果・気づき |
| choose | 選ぶ | 優先順位 |
| focus | 集中する | 一点集中 |
| organize | 整える | 整理・調整 |
| protect | 守る | 慎重・境界線 |
| rest | 休ませる | 回復 |
| release | 手放す | 執着・余白 |
| trust | 信じる | 自分・流れ |
| enjoy | 味わう | 喜び・感覚 |
| nurture | 育てる | 継続・手入れ |
| review | 見直す | 確認・修正 |
| prepare | 備える | 準備 |

## 8.3 テーマ特徴量

各テーマは、Signalsに対する理想ベクトル、許容星、季節タグ、禁止条件を持つ。

例：

```js
{
  id: "protect",
  label: "守る",
  target: {
    vitality: 42,
    receptivity: 48,
    connection: 45,
    expression: 40,
    focus: 58,
    material: 52,
    caution: 82,
    recovery: 68
  },
  preferredOverallStars: [1, 2, 3],
  dominantSignals: ["caution", "recovery"],
  seasonBoost: ["winter", "rainy"],
  minConditions: [
    { signal: "caution", op: ">=", value: 64 }
  ],
  exclusion: [
    { signal: "vitality", op: ">=", value: 80 },
    { signal: "caution", op: "<", value: 45 }
  ]
}
```

## 8.4 テーマスコア

```js
themeScore =
  vectorSimilarity(currentSignals, theme.target) * 55
+ dominantSignalMatch * 15
+ overallStarMatch * 10
+ axisPatternMatch * 10
+ seasonFit * 4
+ continuityFit * 3
+ rarityAdjustment * 3
- exclusionPenalty;
```

### vectorSimilarity

各Signalの差の加重平均を0〜1に変換する。

```js
similarity = 1 - weightedMean(abs(actual - target)) / 100;
```

### axisPatternMatch

例：

- 恋愛運が最高軸でconnection高 → connect / express / receive
- 仕事運が最高軸でfocus高 → focus / advance / prepare
- 金運が低くcaution高 → choose / review / protect
- recoveryが最高Signalでvitality低 → rest / organize
- 全体が中間でばらつき小 → organize / nurture / enjoy

## 8.5 同点処理

上位テーマ差が1.5点未満の場合、以下で決める。

1. 過去7日で未使用のテーマ
2. 過去30日の出現回数が少ないテーマ
3. 日付・プロフィールのテーマ専用ハッシュ値

履歴が消えても結果を再現できるよう、履歴補正は原則「表示候補の同点処理」にだけ使用する。履歴がなくても基礎テーマは変わらない設計が望ましいため、正式結果に保存する `themeBaseId` と、同点分散後の `themeId` を分ける。

## 8.6 テーマ変更防止

同じ対象日・同じプロフィール・同じEngine Version・同じContent Versionでは、再読み込みや端末再起動でテーマを変えない。初回生成時の結果スナップショットを保存し、その日中は再利用する。

プロフィール変更後は「今日の占いを新しいプロフィールで再生成します」と明示し、利用者の操作後にのみ更新する。

---

# 9. 星評価と文章内容の整合ルール

## 9.1 文章生成方式

完全な自由作文は行わない。Studioで管理する承認済み文章部品を、計算結果とタグに基づき組み立てる。

構成：

1. Theme Lead：今日のテーマを伝える
2. Overall Summary：総合運の意味
3. Key：今日の鍵
4. Promise：今日の約束
5. Action：開運アクション
6. Axis Cards：恋愛・金運・仕事
7. Night Reflection：夜の問いと締め

## 9.2 コンテンツ選択条件

文章部品は次を満たす場合だけ候補になる。

- `enabled === true`
- 対応テーマに一致
- 対応星範囲に一致
- 対応軸に一致
- 季節指定がある場合は一致
- 禁止Signal条件に該当しない
- 利用者属性を不必要に仮定しない
- 過去の短期重複制限を満たす

## 9.3 絶対整合ルール

- 星1の総合文で「勢いに乗って大胆に挑戦」は使用不可
- 星5の総合文で「今日は何もせず閉じこもる」は原則不可
- `protect` テーマで無計画な購入を勧めない
- `rest` テーマで高負荷行動を開運アクションにしない
- 金運が星1〜2のとき、投資・賭け・宝くじを推奨しない
- 恋愛運が星1〜2でも、別れや裏切りを予告しない
- 仕事運が星1〜2でも、退職や拒絶を断定しない
- `caution >= 75` なら、少なくとも1か所に確認・余白・境界線の要素を入れる
- `recovery >= 70` かつ `vitality < 45` なら、休息を肯定する
- `expression >= 70` なら、伝える行動を候補にできる
- `connection < 40` の日に「多くの人へ積極的に話しかける」を主要行動にしない

## 9.4 今日の鍵

名詞または短い名詞句。2〜12文字を推奨。

例：

- 深呼吸
- 一つずつ
- 素直な言葉
- 余白
- 小さな確認
- 先に整える

抽象的すぎる「宇宙」「波動」「奇跡」等を乱用しない。

## 9.5 今日の約束

利用者が自分に向ける一人称の短文。18〜45文字。

例：

- 「今日は、急がず自分の歩幅を守ります。」
- 「小さくても、始めた自分を認めます。」
- 「受け取った好意を、素直に喜びます。」

約束は達成できなかった場合に罪悪感を生む絶対命令にしない。

## 9.6 開運アクション

- 1〜5分程度で可能
- 無料またはほぼ無料
- 健康・安全を害さない
- 特定商品購入を要求しない
- 宗教儀式を強制しない
- 行動負荷レベル `low / medium / high` を持つ
- 星1は原則 `low`
- 星2は `low` または短い `medium`
- 星4〜5でも危険行動や浪費を含めない

---

# 10. 占い文章のデータ構造

## 10.1 データファイル分割

```text
/data/
  config.json
  themes.json
  content-overall.json
  content-love.json
  content-money.json
  content-work.json
  content-keys.json
  content-promises.json
  content-actions.json
  content-night.json
  seasons.json
  banned-phrases.json
```

MVP初期は管理しやすさを優先し、`content.json` 一ファイルへ統合してもよい。ただしJavaScriptコードへ文章を直書きしない。

## 10.2 共通Content Item

```json
{
  "id": "overall_protect_s1_001",
  "type": "overall",
  "version": 1,
  "enabled": true,
  "text": "今日は、急いで前へ出るより、自分のペースを守るほど流れが整います。",
  "themes": ["protect", "rest"],
  "axes": ["overall"],
  "stars": [1, 2],
  "scoreRange": { "min": 0, "max": 49 },
  "seasons": [],
  "weekdays": [],
  "requiredSignals": [
    { "name": "caution", "op": ">=", "value": 60 }
  ],
  "excludedSignals": [
    { "name": "vitality", "op": ">=", "value": 78 }
  ],
  "toneTags": ["calm", "reassuring"],
  "semanticTags": ["pace", "boundary", "care"],
  "intensity": 1,
  "actionLoad": null,
  "charCount": 37,
  "qualityStatus": "approved",
  "createdAt": "2026-07-26T00:00:00+09:00",
  "updatedAt": "2026-07-26T00:00:00+09:00",
  "authorNote": ""
}
```

## 10.3 テンプレート変数

MVPで許可する変数を限定する。

```text
{{displayName}}
{{themeLabel}}
{{key}}
{{seasonLabel}}
```

数値や星を文章テンプレート内で直接条件分岐させない。条件は選択ロジック側で処理する。

表示名が空の場合に不自然な空白・読点が残らないよう、名前入り文と名前なし文を別アイテムにするか、専用レンダラーを使う。

## 10.4 Result Snapshot

```json
{
  "resultId": "UUID",
  "date": "2026-07-26",
  "timezone": "Asia/Tokyo",
  "profileId": "local-profile-1",
  "engineVersion": "1.0.0",
  "contentVersion": "1.0.0",
  "hashMode": "SHA-256",
  "scores": {
    "overall": 61,
    "love": 68,
    "money": 52,
    "work": 64
  },
  "stars": {
    "overall": 3,
    "love": 4,
    "money": 3,
    "work": 4
  },
  "signals": {
    "vitality": 63,
    "receptivity": 66,
    "connection": 71,
    "expression": 69,
    "focus": 62,
    "material": 49,
    "caution": 44,
    "recovery": 58
  },
  "themeBaseId": "connect",
  "themeId": "connect",
  "contentIds": {
    "themeLead": "lead_connect_s3_002",
    "overall": "overall_connect_s3_004",
    "love": "love_connect_s4_003",
    "money": "money_connect_s3_005",
    "work": "work_connect_s4_002",
    "key": "key_connect_004",
    "promise": "promise_connect_003",
    "action": "action_connect_low_007",
    "night": "night_connect_002"
  },
  "rendered": {
    "themeLabel": "つながる",
    "key": "素直なひと言",
    "promise": "今日は、受け取った好意を素直に喜びます。",
    "action": "感謝を一言だけ伝える"
  },
  "generatedAt": "2026-07-26T06:01:12+09:00"
}
```

表示結果の再現性を守るため、使用したContent IDと主要表示文を保存する。

---

# 11. 文章選択アルゴリズム

## 11.1 候補フィルタ

```js
candidates = items.filter(item =>
  item.enabled &&
  item.qualityStatus === "approved" &&
  item.themes.includes(themeId) &&
  item.stars.includes(axisStar) &&
  matchScoreRange(item, axisScore) &&
  matchSignals(item, signals) &&
  matchSeason(item, seasonId) &&
  matchWeekday(item, weekday)
);
```

候補0件の場合は段階的に条件を緩和する。

1. 曜日条件を外す
2. 季節条件を外す
3. `themeId` に加え互換テーマを許可
4. 星を±1まで許可。ただし文章の安全分類が同じ範囲のみ
5. 汎用フォールバック文を使用

星1から星3以上の文へ緩和しない。星5から星2以下の文へ緩和しない。

## 11.2 候補採点

```js
contentScore =
  themeExact * 30
+ starExact * 20
+ signalSpecificity * 15
+ seasonFit * 5
+ semanticCoherence * 15
+ freshness * 10
+ deterministicNoise * 5
- repetitionPenalty
- contradictionPenalty;
```

## 11.3 決定論的選択

ランダム関数 `Math.random()` は正式結果に使わない。

```text
selectionSeed =
  profileSeedSource + "|" +
  targetDate + "|" +
  slotType + "|" +
  themeId + "|" +
  contentVersion
```

ハッシュ値を候補数で剰余し、同じ条件では同じ候補を選ぶ。候補採点がある場合は上位グループ内でのみハッシュ選択する。

## 11.4 文章の統一

選択後、全Content Itemの `semanticTags` を比較する。

必須条件：

- 全体の共通タグが最低1個ある
- 主要3項目（総合文・今日の鍵・開運アクション）は共通タグを持つ
- 恋愛・金運・仕事はテーマと矛盾しない
- 同じ語尾が3連続しない
- 同義文の重複を避ける

矛盾が見つかった場合、優先度の低い項目から再選択する。

再選択順：

1. 軸別文章
2. 開運アクション
3. 今日の約束
4. 今日の鍵
5. 総合文
6. テーマ（原則変更しない）

---

# 12. 重複・矛盾・偏りを防ぐ品質管理

## 12.1 重複の種類

1. 完全一致
2. 正規化後一致
3. 高い文字列類似
4. 意味タグ重複
5. 同一利用者への短期再出現
6. 同一日の画面内重複

## 12.2 正規化

比較前に以下を行う。

- Unicode NFKC
- 空白除去または統一
- 句読点除去
- ひらがな・カタカナの比較用統一
- テンプレート変数をプレースホルダ化
- よくある語尾を比較用に除外した補助文字列も作る

## 12.3 類似度

MVPは外部ライブラリなしで以下を実装する。

- 文字3-gram Jaccard係数
- 単語集合Jaccard係数
- Levenshtein距離は短文のみ
- semanticTags一致率

警告基準：

| 条件 | 判定 |
|---|---|
| 正規化完全一致 | error |
| 3-gram Jaccard ≥ 0.82 | error |
| 3-gram Jaccard 0.68〜0.81 | warning |
| semanticTags完全一致かつ文頭・文末類似 | warning |
| 同一画面で主要語句が3回以上 | warning |

## 12.4 矛盾ルールエンジン

ルールはJSONで管理する。

```json
{
  "id": "RULE_LOW_STAR_NO_BIG_PUSH",
  "severity": "error",
  "when": {
    "starMax": 2
  },
  "forbidTerms": ["大胆に挑戦", "一気に進め", "迷わず即決"],
  "message": "低評価日に強い前進を促す表現は使用できません。"
}
```

カテゴリ：

- 星と強度
- テーマと行動
- 運勢軸と表現
- プライバシー
- 医療・法律・金融断定
- 差別・偏見
- 恐怖・依存誘導
- 文法・文字数
- アクセシビリティ

## 12.5 分布検査

Studioで少なくとも以下のシミュレーションを実行する。

- 365日 × 20プロフィール
- 10年 × 10プロフィール
- 必須プロフィール欠損パターン
- 全血液型・全出生時間帯
- うるう日を含む期間
- 年末年始・季節境界

出力：

- 各星比率
- 各テーマ比率
- 4軸平均・中央値・標準偏差
- 軸間相関
- 連続同一テーマ日数
- 連続星1・星5日数
- 使用されない文章
- 過剰使用文章
- フォールバック発生率
- 矛盾ルール違反件数

### 完成基準

- フォールバック率 0.5%未満
- error 0件
- warningは全件レビュー済み
- 1テーマの年間比率が15%を超えない
- 1文章の年間出現率が同一slot内で8%を超えない
- 同一テーマ4日連続は原則0、最大でも全体の0.2%未満
- 同一主要文30日以内再出現率5%未満
- 軸間相関がすべて0.90以上にならない

---

# 13. 朝画面仕様

## 13.1 画面構成

```text
[起動アニメーション]
  ↓
[今日の日付・挨拶]
[今日のテーマ]
[総合運 星・要約]
[今日の鍵]
[今日の約束]
[開運アクション]
[恋愛運 / 金運 / 仕事運]
[詳しく読む]
[夜の振り返り]
```

## 13.2 Every Morning共通起動アニメーション

正式な「Every Morning 起動アニメーション完全設計書」を優先適用する。

- Morning Navy背景
- 354°リング
- 終端の柔らかな光
- アプリ名の静かなフェードイン
- 約2秒でホームへ遷移
- 無音
- SVG + CSS + JavaScript
- 外部アニメーションライブラリ不使用
- `prefers-reduced-motion` 対応
- 最大2.8秒で強制終了
- 起動中にデータ準備を並行
- シリーズ共通の構造・速度・リング形状
- Fortune固有のリング色・光色を設定

毎回起動時に必ず2秒待たせない。初回起動、日付変更後初回、一定時間以上未使用時のみ完全演出。短時間の再訪では短縮または省略する。

## 13.3 アクセシビリティ

- 本文最小16px相当
- 星は色だけでなく数とラベルで示す
- コントラストはWCAG AAを目標
- タップ領域44×44 CSS px以上
- 動きを減らす設定に対応
- VoiceOverで読み上げ順が自然
- 絵文字だけに意味を依存しない
- 横向き、小型画面、文字拡大200%を確認
- Safe Areaへ対応
- モーダル内のフォーカス管理
- エラーを色だけで表現しない

---

# 14. 夜の振り返り仕様

## 14.1 表示タイミング

- 当日17:00以降は主要導線を表示
- 17:00以前でも利用者が手動で開ける
- 通知はMVP必須にしない
- 日付変更後は前日の振り返りを最大7日間入力可能

## 14.2 質問

MVPでは負担を抑えて3項目。

1. 「今日の約束を、少しでも意識できましたか？」
   - できた
   - 少しできた
   - できなかった
   - 答えない

2. 「今日の気分は？」
   - 穏やか
   - うれしい
   - ふつう
   - 疲れた
   - もやもや
   - 答えない

3. 自由メモ（任意、最大280文字）

## 14.3 夜の返答

選択内容を評価せず、テーマに沿って一文返す。

例：

- できた：「小さくても、今日選べた一歩はちゃんと残っています。」
- 少しできた：「少し意識できたことが、今日の十分な前進です。」
- できなかった：「できなかった日も、気づけたことから明日が整います。」
- 疲れた：「今日はここまでで大丈夫。休むことも、明日への準備です。」

## 14.4 朝夜連携データ

```json
{
  "date": "2026-07-26",
  "resultId": "UUID",
  "themeId": "connect",
  "promiseResponse": "partial",
  "mood": "calm",
  "note": "",
  "completedAt": "2026-07-26T21:14:00+09:00"
}
```

---

# 15. 保存設計

## 15.1 方針

MVPは **IndexedDBを主保存**、`localStorage` を軽量設定と起動補助に使う。

理由：

- 占い履歴、文章データ、分析データは構造化・件数増加が見込まれる
- localStorageは同期APIで容量も限定的
- IndexedDBは構造化データ、索引、トランザクションに適する
- PWAのキャッシュはCache Storageへ分離する

ブラウザ保存は利用者操作やOS判断で消える可能性があるため、JSONバックアップを正式機能とする。

## 15.2 localStorage

キー接頭辞：`emf.`

| Key | 内容 |
|---|---|
| `emf.app.version` | アプリバージョン |
| `emf.engine.version` | Engine Version |
| `emf.content.version` | Content Version |
| `emf.activeProfileId` | 使用中プロフィールID |
| `emf.onboarding.completed` | 初期設定完了 |
| `emf.theme.mode` | light / dark / system |
| `emf.splash.lastShownAt` | 起動演出制御 |
| `emf.studio.lockUntil` | Studio誤操作防止ロック |
| `emf.storage.migrationVersion` | 移行版 |

プロフィール実データ、占い履歴、自由メモ、パスコード平文はlocalStorageへ保存しない。

## 15.3 IndexedDB

DB名：`every-morning-fortune`  
DB Version：`1`

### Object Stores

#### `profiles`

KeyPath: `id`

Indexes:
- `updatedAt`
- `isActive`

#### `dailyResults`

KeyPath: `resultId`

Indexes:
- unique `[profileId, date, engineVersion, contentVersion]`
- `date`
- `themeId`
- `overallStar`
- `generatedAt`

#### `reflections`

KeyPath: `id`

Indexes:
- unique `[profileId, date]`
- `mood`
- `completedAt`

#### `contentItems`

KeyPath: `id`

Indexes:
- `type`
- `enabled`
- `qualityStatus`
- multiEntry `themes`
- multiEntry `stars`

#### `themes`

KeyPath: `id`

#### `settings`

KeyPath: `key`

#### `analyticsEvents`

KeyPath: `id`

Indexes:
- `eventType`
- `occurredAt`
- `localDate`

#### `contentUsage`

KeyPath: `[contentId, profileId, date]`

Indexes:
- `contentId`
- `date`

#### `studioDrafts`

KeyPath: `id`

#### `backups`

MVPでは実ファイルをDBへ蓄積せず、直近のエクスポートメタ情報だけ保持。

## 15.4 容量と永続化

起動時または設定画面で以下を確認できる。

```js
navigator.storage.estimate()
navigator.storage.persisted()
navigator.storage.persist()
```

永続化要求は、利用者が「端末内データを守る」設定を明示操作したときに行う。自動で権限要求を連打しない。

## 15.5 データ保持

- 占い履歴：利用者が削除するまで
- 分析イベント：初期設定は直近400日
- 自由メモ：利用者が削除するまで
- Studio下書き：最大20件
- エラー診断ログ：直近100件、個人情報を含めない
- キャッシュ：Service Worker更新方針に従う

## 15.6 削除

設定画面に以下を用意する。

- 占い履歴だけ削除
- 夜の振り返りだけ削除
- 利用状況データだけ削除
- プロフィール削除
- 端末内の全データ削除

全削除は確認画面で対象を明示し、二段階操作とする。削除後に復元不可であることを表示する。

---

# 16. 利用状況分析

## 16.1 原則

分析は端末内のみ。外部送信しない。  
利用者向けの振り返りと、Studioでの品質改善に必要な最小限へ限定する。

## 16.2 イベント

```json
{
  "id": "UUID",
  "eventType": "morning_open",
  "occurredAt": "2026-07-26T06:01:00+09:00",
  "localDate": "2026-07-26",
  "profileId": "local-profile-1",
  "resultId": "UUID",
  "properties": {
    "entry": "pwa_icon",
    "sessionType": "new_day"
  }
}
```

MVPイベント：

- `app_open`
- `morning_open`
- `result_generated`
- `axis_expanded`
- `action_viewed`
- `night_open`
- `reflection_saved`
- `backup_exported`
- `backup_imported`
- `studio_open`
- `content_previewed`

タップ位置、連絡先、位置情報、閲覧中の他サイト、端末広告識別子は取得しない。

## 16.3 指標

- 朝の利用日数
- 夜の利用日数
- 朝夜連携率
- 7日・30日の継続日数
- 最長連続利用
- テーマ分布
- 星評価分布
- 軸別平均
- 文章利用回数
- 重複間隔
- 未使用文章数
- フォールバック率
- 品質警告数

「継続できなかった」と責める表現は禁止。空白期間は失敗扱いしない。

---

# 17. Every Morning Studio v1.0

## 17.1 目的

Studioは、開発者がコードを直接編集せずに以下を行う端末内管理画面。

- 占い文編集
- テーマ定義編集
- 出現条件・重み調整
- 季節設定
- 表示内容設定
- プレビュー
- シミュレーション
- 品質チェック
- 利用状況分析
- JSON / CSV入出力
- バックアップ・復元
- GitHub反映用ファイル作成

Studioでの変更は、その端末の下書きまたはプレビューに留める。公開版への正式反映は、エクスポートしたファイルをGitHubへコミットして行う。

## 17.2 画面

1. ダッシュボード
2. 文章ライブラリ
3. テーマ管理
4. Engine設定
5. 季節設定
6. プレビュー
7. シミュレーション
8. 品質チェック
9. 利用状況分析
10. 入出力・バックアップ
11. Studio設定

## 17.3 パスコード

目的は誤操作防止であり、強固な認証ではない。

- 初期値は設定しない
- 4〜12桁
- 平文保存禁止
- 端末固有salt + SHA-256ダイジェストを保存
- 5回失敗で5分ロック
- 「このパスコードは機密データを保護する強固な認証ではありません」と明記
- 忘れた場合はStudio設定の初期化で解除可能
- 公開ページのURLやJavaScriptを知る者からの防御にはならない

GitHub Pagesは静的配信のため、Studioの秘密機能をパスコードだけで安全に隠せるとは扱わない。公開データに秘密情報を含めない。

## 17.4 文章編集

必須機能：

- 新規作成
- 複製
- 編集
- 無効化
- 削除（参照中の場合は警告）
- 絞り込み
- 並び替え
- 一括タグ編集
- 文字数表示
- 条件編集
- プレビュー
- 品質チェック
- 変更履歴の簡易記録

編集フォーム：

- ID（作成後は原則変更不可）
- 種別
- 本文
- テーマ
- 軸
- 星
- スコア範囲
- 季節
- 曜日
- 必須Signal
- 除外Signal
- トーンタグ
- 意味タグ
- 強度
- 行動負荷
- 有効/無効
- 品質状態
- 管理メモ

## 17.5 テーマ編集

- 表示名
- 説明
- 理想Signalベクトル
- 推奨星
- dominantSignals
- 季節補正
- 最低条件
- 除外条件
- 互換テーマ
- 表示色
- アイコン名
- 有効/無効

テーマID変更は参照破損を招くため、作成後はロック。名称は変更可能。

## 17.6 Engine設定

Studioで変更可能だが、MVP公開版では上級者設定として警告する。

- Signal重み
- 4軸重み
- 星閾値
- テーマ採点重み
- 重複ペナルティ
- 日間急変上限
- 季節境界
- 分布目標

重み合計チェック、自動正規化、変更前後比較、リセットを実装する。

Engine設定を保存した場合は `engineVersion` の更新を必須とする。旧バージョンと同じ版番号で計算内容を変えない。

## 17.7 プレビュー

指定可能項目：

- プロフィール
- 日付
- 時刻
- 季節
- 強制テーマ
- 強制星
- Content Version
- Engine Version

強制テーマ・強制星は編集確認用であり、正式結果生成には使わない。画面には常に「プレビューモード」と表示する。

表示モード：

- iPhone小型
- iPhone標準
- iPhone大型
- ダークモード
- 文字サイズ100 / 130 / 160 / 200%
- reduced motion

## 17.8 シミュレーション

- 期間：7日 / 30日 / 365日 / 任意
- プロフィール：単一 / サンプル20 / CSV取込
- Engine設定：現行 / 下書き
- Content：現行 / 下書き
- 実行上限を設け、UIを固めないようWeb Workerを利用可能
- 進捗表示と中止
- 結果をCSV出力

## 17.9 品質チェック

### 自動検査

- JSON Schema相当の必須項目
- ID重複
- 参照切れ
- 文字数
- 禁止語
- 星・テーマ矛盾
- Signal条件矛盾
- 到達不能条件
- 候補0件パターン
- 完全一致・類似文
- 同じ語尾
- 未使用タグ
- 未使用文章
- 過剰使用文章
- 分布偏り
- アクセシビリティ上の不足

### 結果レベル

- `error`：公開不可
- `warning`：要確認
- `info`：改善候補
- `passed`：問題なし

「公開候補ファイルを書き出す」はerror 0件のときだけ有効にする。

## 17.10 分析画面

- 期間選択
- KPIカード
- テーマ棒グラフ
- 星分布
- 朝夜利用
- 継続カレンダー
- 軸平均推移
- 文章重複表
- 未使用文章
- フォールバック一覧
- 品質エラー履歴

グラフがなくても情報が読める表形式を併設する。

## 17.11 JSON入出力

### Export Package

```json
{
  "format": "EMF_EXPORT",
  "formatVersion": "1.0",
  "exportedAt": "2026-07-26T12:00:00+09:00",
  "appVersion": "1.0.0",
  "engineVersion": "1.0.0",
  "contentVersion": "1.0.0",
  "scope": ["themes", "content", "engineConfig"],
  "checksum": "sha256-hex",
  "data": {}
}
```

### Import手順

1. ファイル選択
2. 形式・版・サイズ確認
3. checksum確認
4. スキーマ検証
5. 参照整合チェック
6. 差分表示
7. 下書き領域へ取込
8. 品質チェック
9. 利用者が確定
10. IndexedDBへ反映

既存データへ即上書きしない。

## 17.12 CSV

用途：

- 文章一覧
- 利用回数
- テーマ分布
- 星分布
- シミュレーション結果

CSVはUTF-8 BOM付きでExcel等の文字化けを避ける。  
本文内の改行、ダブルクォート、カンマをRFC 4180準拠でエスケープする。

プロフィールの生年月日や自由メモは、分析CSVの標準出力に含めない。

## 17.13 バックアップ・復元

バックアップ種別：

- 利用者バックアップ：プロフィール、履歴、振り返り、設定
- Studioバックアップ：文章、テーマ、Engine設定、下書き
- 完全バックアップ：上記すべて

バックアップには個人情報が含まれ得るため、保存先と取り扱い注意を表示する。MVPでは暗号化ZIPを実装必須にせず、JSON内に注意表示を入れる。将来、Web Cryptoによるパスフレーズ暗号化を検討する。

復元は差分と対象件数を表示し、以下を選択可能にする。

- 置換
- 追加
- 重複をスキップ
- 新しい方を採用

---

# 18. 個人情報・プライバシー設計

## 18.1 収集最小化

MVPで扱う可能性がある個人データ：

- 生年月日
- 任意の表示名
- 任意の血液型
- 任意の出生時間帯
- 占い閲覧履歴
- 夜の気分
- 任意メモ

これらは端末内にのみ保存し、GitHub Pagesの配信元や外部サービスへ送信しない。

## 18.2 明示事項

初期設定とプライバシー画面に以下を表示する。

- 占いはエンターテインメントである
- 入力データは原則この端末内に保存される
- 初期版では他利用者のデータを収集しない
- ブラウザやOSの操作でデータが消える可能性がある
- 必要に応じてバックアップできる
- 端末共有時は他者に見られる可能性がある
- パスコードはStudio誤操作防止であり強固な秘密保護ではない

## 18.3 禁止

- 外部解析タグ
- 広告トラッカー
- フィンガープリンティング
- 端末連絡先アクセス
- 正確な位置情報取得
- 個人データをURLクエリへ含める
- consoleへ生年月日やメモを出力
- Service WorkerキャッシュへプロフィールJSONを保存
- GitHubリポジトリへ実利用データをコミット

## 18.4 セキュリティ基本

- GitHub PagesのHTTPSを使用
- DOM挿入は `textContent` を基本
- Studioの自由入力HTMLをそのまま描画しない
- JSONインポートのサイズ上限を設ける
- Prototype Pollutionを防ぐキー検査
- CSV Formula Injection対策として `=`, `+`, `-`, `@` 始まりを必要に応じてエスケープ
- CSPを可能な範囲で設定
- 外部スクリプトを使用しない
- パスコード平文を保存しない
- エクスポート時の個人情報範囲を明示

---

# 19. PWA・オフライン・更新設計

## 19.1 必須

- `manifest.webmanifest`
- Service Worker
- オフライン起動
- アイコン
- theme color
- standalone表示
- start_url
- scope
- iOS向けmeta
- Safe Area
- ホーム画面追加案内

## 19.2 キャッシュ

### App Shell

Cache First：

- HTML基本シェル
- CSS
- JavaScript
- アイコン
- フォント（原則システムフォント）
- 初期コンテンツJSON

### 更新

- 新Service Worker検知時に「新しい版があります」
- 朝の結果表示前に強制リロードしない
- 利用者が更新を選択した時点で適用
- データ移行成功後に新画面へ
- 旧キャッシュ削除はactivate後
- `CACHE_VERSION` を明示

占い表示を更新確認で遅らせない。

## 19.3 オフライン

- 起動済みApp Shellで当日占いを生成可能
- 日付・プロフィール・コンテンツが端末にあればネット不要
- GitHub更新確認だけオンライン時に行う
- オフライン中も夜の振り返りを保存可能
- オフライン表示を過度に警告しない

---

# 20. 実装ファイル構成

初心者がiPhone上でも扱いやすく、ファイル過多を避けるMVP構成。

```text
every-morning-fortune/
├─ index.html
├─ studio.html
├─ manifest.webmanifest
├─ service-worker.js
├─ README.md
├─ docs/
│  ├─ every-morning-fortune-spec-v1.0.md
│  ├─ every-morning-brand-guidelines.md
│  └─ privacy-policy.md
├─ css/
│  ├─ app.css
│  └─ studio.css
├─ js/
│  ├─ app.js
│  ├─ fortune-engine.js
│  ├─ content-engine.js
│  ├─ storage.js
│  ├─ reflection.js
│  ├─ analytics.js
│  ├─ pwa.js
│  ├─ studio.js
│  ├─ studio-quality.js
│  └─ utilities.js
├─ data/
│  ├─ config.json
│  ├─ themes.json
│  ├─ content.json
│  ├─ quality-rules.json
│  └─ seasons.json
├─ icons/
│  ├─ icon-192.png
│  ├─ icon-512.png
│  └─ apple-touch-icon.png
└─ tests/
   ├─ test-runner.html
   ├─ fortune-engine.test.js
   ├─ content-engine.test.js
   ├─ storage.test.js
   └─ fixtures.js
```

## 20.1 責務

| ファイル | 責務 |
|---|---|
| `app.js` | 画面初期化・画面遷移 |
| `fortune-engine.js` | Profile/Day Vector、Signals、4軸、星、テーマ |
| `content-engine.js` | 文章候補、選択、整合、レンダリング |
| `storage.js` | IndexedDB、localStorage、移行、バックアップ |
| `reflection.js` | 夜の振り返り |
| `analytics.js` | 端末内イベント・集計 |
| `pwa.js` | SW登録、更新表示、インストール補助 |
| `studio.js` | Studio UI |
| `studio-quality.js` | 重複・矛盾・分布検査 |
| `utilities.js` | 日付、hash、clamp、CSV等 |
| `service-worker.js` | App Shellキャッシュ、オフライン |

依存方向：

```text
UI → Engine / Content / Storage
Content → Engine結果を参照
Engine → Utilitiesのみ
Storage → Utilitiesのみ
EngineがDOMやIndexedDBを直接操作しない
```

---

# 21. バージョニングと移行

## 21.1 3種類の版

- `appVersion`：UI・機能
- `engineVersion`：計算式
- `contentVersion`：文章・テーマデータ

## 21.2 ルール

- 計算結果が変わる変更 → engineVersion更新
- 文章選択結果が変わる変更 → contentVersion更新
- CSSのみ → appVersionのみ
- 同一日の保存済み結果は、原則その日の間は旧版を維持
- 翌日から新版
- 利用者が明示的に再生成した場合のみ当日新版へ

## 21.3 移行

IndexedDBの `onupgradeneeded` で段階移行。  
移行は冪等であり、途中失敗時に元データを壊さない。

移行前に件数確認、移行後に検証、失敗時はエラー表示とバックアップ案内。

---

# 22. MVPと将来機能

## 22.1 MVP v1.0必須

- プロフィール登録
- EMF Method v1.0
- 総合・恋愛・金運・仕事
- 16テーマ
- 星1〜5の安心設計
- 今日の鍵
- 今日の約束
- 開運アクション
- 夜の振り返り
- 朝夜履歴
- IndexedDB保存
- JSONバックアップ・復元
- PWA・オフライン
- 共通起動アニメーション
- Studio文章編集
- Studioテーマ編集
- Studioプレビュー
- Studio品質チェック
- Studio基本分析
- JSON / CSV入出力
- GitHub反映用データ出力
- プライバシー説明
- 自動テスト・シミュレーション

## 22.2 MVP後

- 月次振り返り
- ラッキーカラー
- ラッキータイム
- ウィジェット相当表示
- Web Push通知
- 複数プロフィール
- 多言語
- Android最適化強化
- App Storeラッパー
- 高度な文章暗号化バックアップ
- Studioの差分履歴・ロールバック
- コンテンツ承認ワークフロー
- 全国地域向け季節設定
- アクセシビリティ個別設定
- 端末間同期（外部サービス導入時のみ、別途許可が必要）

## 22.3 採用しないもの

- 未検証のテーマ100選
- 文章を大量投入するだけの方式
- 毎回完全ランダムな占い
- 外部AIによるリアルタイム文章生成
- 外部APIによる個人情報送信
- 恐怖訴求による課金
- 星の再抽選
- 有料ガチャ型占い
- 未承認文章の自動公開

---

# 23. テスト項目

## 23.1 Unit Test

### Utilities

- digitalRoot
- 日付のローカル変換
- うるう年
- dayOfYear
- season境界
- SHA-256 / fallback
- clamp
- CSV escape
- JSON checksum

### Fortune Engine

- 同一入力で同一出力
- 日付変更で適切に変化
- 表示名変更でスコア不変
- 任意項目UNKNOWNで正常
- 全Signalが0〜100
- 全Scoreが0〜100
- 星閾値境界
- 星1意味分類
- テーマ最低条件
- 除外条件
- 同点処理
- 前日平滑化
- バージョン変更

### Content Engine

- 条件フィルタ
- 候補0件フォールバック
- 決定論的選択
- 重複回避
- 矛盾再選択
- テンプレート安全置換
- HTML注入防止
- 文字数
- 語尾重複

### Storage

- DB新規作成
- CRUD
- unique index
- トランザクション失敗
- DB移行
- 容量不足
- JSON export/import
- checksum不一致
- 破損ファイル
- 全削除

## 23.2 Integration Test

- 初回設定→当日占い→夜振り返り
- 再読み込み後も同じ結果
- オフライン起動
- 日付変更
- プロフィール変更
- Service Worker更新
- Engine Version更新
- Content Version更新
- Studio編集→プレビュー→品質チェック→書出し
- バックアップ→全削除→復元
- 旧DBから移行

## 23.3 UI Test

対象：

- 最新iOS対応の小型〜大型iPhone
- Safari通常タブ
- ホーム画面追加PWA
- 縦・横
- ライト・ダーク
- 文字拡大
- VoiceOver
- reduced motion
- 低電力モード
- オフライン
- 低速回線
- ストレージ制限時

確認：

- Safe Area
- ボタン押下
- スクロール
- キーボード表示
- Studio表編集
- モーダル
- 破綻しない改行
- 起動2.8秒以内
- 主要表示が30秒以内に読める

## 23.4 性能

目標値：

- 初回App Shell表示：実用的な回線で2.5秒以内を目標
- 再訪時：1秒以内を目標
- 占い計算：通常端末で100ms以内を目標
- IndexedDB読込：通常100ms以内を目標
- 365日×20プロフィールのStudioシミュレーション：UIをブロックしない
- JavaScript総量：MVPでは圧縮前500KB未満を目標
- 外部フォントなし
- 大型画像なし
- 起動演出最大2.8秒

## 23.5 品質・倫理テスト

レビュー担当が確認する質問：

- 星1でも利用者の尊厳が守られているか
- 不安を利用して再訪を促していないか
- 専門判断を占いで代替していないか
- 恋人・家族・職業の存在を勝手に仮定していないか
- 性別役割、血液型、年齢の偏見を含まないか
- 占い結果と行動提案が矛盾しないか
- 高評価が無謀な行動を促していないか
- 夜の振り返りが自己否定を生まないか
- データが本当に端末外へ送られていないか

---

# 24. 完成判定基準

MVP v1.0は以下をすべて満たしたときのみ「公開候補」とする。

## 24.1 機能

- 必須機能がすべて動作
- 主要導線に未実装リンクなし
- データ保存・復元が成功
- オフラインで当日占い表示
- Studioから公開候補JSON/CSVを生成可能

## 24.2 ロジック

- 10年シミュレーションで異常分布なし
- 同一入力の再現性100%
- 星と文章の重大矛盾0件
- テーマと文章の重大矛盾0件
- フォールバック率0.5%未満
- 星・テーマ・文章の偏りが目標範囲内

## 24.3 UX

- 朝の中心情報を30秒以内で把握可能
- 星1でも安心できる
- 起動演出が邪魔にならない
- 小型iPhone・文字拡大・VoiceOverで主要操作可能
- 夜の振り返りが1分以内

## 24.4 プライバシー

- 外部API 0
- 外部解析 0
- 個人情報のネットワーク送信 0
- GitHub公開ファイルに個人データ 0
- 全削除・バックアップが機能
- プライバシー説明が実装済み

## 24.5 品質

- 自動テスト全件成功
- Studio品質チェックerror 0
- 既知の重大バグ0
- データ移行テスト成功
- Service Worker更新事故なし
- README・仕様書・プライバシーポリシー更新済み

---

# 25. 実装順序

## Phase 1：基盤

1. フォルダ作成
2. ブランド変数・基本UI
3. 起動アニメーション
4. Utilities
5. IndexedDBラッパー
6. 初期プロフィール

## Phase 2：Fortune Engine

1. Profile Vector
2. Day Vector
3. Signals
4. 4運勢
5. 星
6. テーマ
7. テスト
8. 長期シミュレーション

## Phase 3：Content Engine

1. JSON Schema
2. 初期16テーマ
3. 各slotの承認済み文章
4. 選択ロジック
5. 矛盾・重複検査
6. 朝画面

## Phase 4：夜・履歴

1. 夜の振り返り
2. 朝夜連携
3. 履歴
4. 端末内分析

## Phase 5：PWA

1. Manifest
2. Service Worker
3. Offline
4. 更新UI
5. iOS検証

## Phase 6：Studio

1. ダッシュボード
2. 文章編集
3. テーマ編集
4. プレビュー
5. 品質チェック
6. 分析
7. JSON / CSV
8. バックアップ・復元

## Phase 7：公開候補

1. 全テスト
2. 倫理レビュー
3. UXレビュー
4. 性能改善
5. README
6. Privacy Policy
7. GitHub Pages公開候補

---

# 26. 実装上の不変条件

以下はコード内で定数・テスト・品質ルールの三重で守る。

1. 同日再抽選をさせない
2. テーマを計算前にランダム選択しない
3. 星1を悪い日として扱わない
4. 全体文章を同一テーマで統一する
5. 外部APIを使わない
6. 個人データを外部送信しない
7. Studio変更を自動公開しない
8. パスコードを強固な認証と表示しない
9. Content IDとEngine Versionを結果へ保存する
10. 品質errorがあるデータを公開候補として書き出さない
11. 結果生成に `Math.random()` を使わない
12. UI文言で未来・他者・重大事象を断定しない

---

# 27. 初期コンテンツ最低数

大量生成ではなく、品質と組み合わせ耐性を優先する。MVP公開前の最低目標：

| 種別 | 1テーマ当たり | 合計目安 |
|---|---:|---:|
| Theme Lead | 3 | 48 |
| Overall | 星帯別5 | 400 |
| Love | 星帯別3 | 240 |
| Money | 星帯別3 | 240 |
| Work | 星帯別3 | 240 |
| Key | 5 | 80 |
| Promise | 5 | 80 |
| Action | 6 | 96 |
| Night | 4 | 64 |

合計目安：**1,488件**

これは機械的に数を埋める目標ではない。類似文、矛盾文、意味の薄い文を含めて数を達成してはならない。公開時に品質を保てない場合は、テーマ数を12へ減らして各テーマの厚みを優先する。

---

# 28. 最終設計判断

## 28.1 localStorageかIndexedDBか

**IndexedDBを正式採用**。localStorageは小さな設定のみ。

## 28.2 完全ランダムか決定論的か

**決定論的方式を正式採用**。ハッシュで多様性を出す。

## 28.3 テーマ数

MVPは **16テーマ**。100テーマ案は不採用。

## 28.4 文章生成

外部AI・API・自由生成を使わず、**承認済みデータ部品の条件付き組み立て**。

## 28.5 Studio公開方式

Studioは端末内編集・検証・書出しまで。**正式公開はGitHub更新**。

## 28.6 利用分析

**端末内のみ**。他ユーザーのデータを収集しない。

## 28.7 パスコード

**誤操作防止**。認証や秘密保護を保証しない。

---

# 29. 実装開始条件

次工程のJavaScript実装は、以下を固定した状態で開始する。

- Engine Version：`1.0.0`
- Content Version：`1.0.0-draft`
- テーマ数：16
- 星閾値：本書第7章
- Profile / Day Vector：本書第3〜4章
- Signals：本書第5章
- 4軸式：本書第6章
- 保存：IndexedDB主、localStorage補助
- 結果：Result Snapshot保存
- 正式結果の選択にMath.random不使用
- Studio変更はGitHubコミット前まで下書き
- 品質error 0を公開条件とする

---

# 30. 自己点検結果

本仕様は次の観点で統合点検済み。

- ブランド思想と星1表現が矛盾していない
- テーマが運勢計算後に決まる
- 4軸が同じ計算の名前違いになっていない
- 日付・季節・曜日・プロフィールが計算へ入る
- 同一条件の再現性がある
- 文章が星・テーマ・Signalと整合する
- 朝と夜が同じテーマでつながる
- 履歴の有無だけで基礎結果が変わらない
- Studioの編集内容が自動公開されない
- パスコードの限界を明記している
- 保存消失リスクをバックアップで補う
- 外部API・従量課金を必要としない
- 幅広いiPhoneとPWA運用を前提としている
- MVPと将来機能を分離している
- 実装・シミュレーション・完成判定まで定義している

---

**本書を Every Morning Fortune v1.0 開発の実装正本とする。**

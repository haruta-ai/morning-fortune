/* 毎朝の運勢 v0.4.0 */
"use strict";

const VERSION = "0.4.0";
const STORAGE_KEYS = {
  favorites: "morningFortuneFavoritesV1",
  history: "morningFortuneHistoryV1",
  missions: "morningFortuneMissionsV1",
  moods: "morningFortuneMoodsV1"
};

const DATA = {
  themes: [
    ["流れを整える", "目の前のことを一つずつ整えると、運が味方します。"],
    ["小さく踏み出す", "完璧を待たずに始めることで、新しい流れが生まれます。"],
    ["言葉を丁寧に", "ひと言の思いやりが、心地よいご縁を運んできます。"],
    ["余白を楽しむ", "予定を詰めすぎないことが、良いひらめきにつながります。"],
    ["自分を信じる", "迷ったときは、最初に感じた素直な気持ちを大切に。"],
    ["感謝を伝える", "小さなありがとうが、今日の空気をやわらかくします。"],
    ["軽やかに選ぶ", "抱え込まず、今の自分に必要なものを選びましょう。"]
  ],
  overallComments: [
    "小さな決断が、心地よい流れを作る日です。",
    "自然体でいるほど、うれしい偶然が近づきます。",
    "焦らず順番を決めると、物事がすっきり進みます。",
    "いつもと違う選択に、運気を変えるヒントがあります。",
    "人との会話から、前向きなきっかけを得られそうです。",
    "自分のペースを守ることが、今日いちばんの開運です。"
  ],
  scoreComments: {
    work: ["優先順位を決めると集中力が上がります。", "午前中の着手が良い結果につながります。", "丁寧な確認が評価につながる日です。"],
    money: ["必要なものを見極めると満足度が高まります。", "小さな節約が気持ちの余裕を生みます。", "長く使えるものに目を向けると吉。"],
    people: ["素直なひと言が、良い空気を作ります。", "相手の話を最後まで聞くと関係が深まります。", "久しぶりの連絡にうれしい反応がありそう。"],
    health: ["深呼吸と軽いストレッチが調子を整えます。", "温かい飲み物で体をいたわりましょう。", "少し早めの休憩が集中力を守ります。"]
  },
  guidance: [
    ["午前中の小さな行動", "後回しにしていたことを一つ始めると、流れが軽くなります。", "返事を急ぎすぎない", "一度深呼吸して言葉を選ぶと、誤解を防げます。", "他人との比較", "今日は自分の昨日と比べるだけで十分です。"],
    ["いつもより5分早い準備", "少しの余裕が、良いタイミングを引き寄せます。", "予定の詰め込み", "余白を残すと、本当に大切なことが見えてきます。", "決めつけ", "まず一度、相手の事情を想像してみましょう。"],
    ["笑顔でのあいさつ", "あなたの明るさが、周囲の空気も軽くします。", "細かい失敗への執着", "切り替えの早さが、次の幸運につながります。", "夜更かし", "今日は少し早めに休むと明日が楽になります。"]
  ],
  missions: [
    ["机の上を3分だけ整える", "視界が整うと、頭の中も自然に整理されます。"],
    ["誰かに『ありがとう』を伝える", "感謝の言葉が、今日の運をやさしく巡らせます。"],
    ["5分だけ外の空気を吸う", "景色を変えると、気持ちにも新しい風が入ります。"],
    ["後回しの用事を一つ終える", "小さな完了が、大きな自信につながります。"],
    ["鏡を見て笑顔を作る", "表情を整えると、心も少しずつ前を向きます。"],
    ["温かい飲み物をゆっくり飲む", "急がない時間が、今日の余裕を育てます。"]
  ],
  actions: [
    "朝の光を浴びながら、温かい飲み物を飲む",
    "いつもより丁寧に靴をそろえる",
    "好きな音楽を一曲だけ聴く",
    "玄関やデスクを小さく整える",
    "空を見上げて三回深呼吸する",
    "大切な人に短いメッセージを送る"
  ],
  colors: [
    ["サンドベージュ", "#cbb28f"], ["オリーブグリーン", "#7e8b63"], ["スカイブルー", "#7fa9c4"],
    ["コーラルピンク", "#d58d86"], ["ラベンダー", "#a99abe"], ["アイボリー", "#e8dfc9"], ["ネイビー", "#52647a"]
  ],
  items: [["☕", "お気に入りのマグ"], ["🖊️", "書きやすいペン"], ["📕", "小さなノート"], ["🧣", "やわらかな布小物"], ["🔑", "いつもの鍵"], ["🎧", "イヤホン"], ["⌚", "腕時計"]],
  quotes: [
    "大きく変えなくていい。小さく整えるだけで、今日の流れは変わる。",
    "ゆっくりでも、前を向いているなら、それは立派な前進です。",
    "今日できる小さなことが、明日の自分を助けてくれる。",
    "比べるなら昨日の自分と。あなたの歩幅で進めばいい。",
    "余白があるから、新しい幸運が入ってこられる。",
    "やさしい言葉は、めぐりめぐって自分の心も温める。"
  ]
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const today = new Date();
const dateKey = toDateKey(today);
const fortune = createFortune(today);
let toastTimer;

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function hash(text) {
  let value = 2166136261;
  for (const char of text) {
    value ^= char.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function pick(list, seed, offset = 0) {
  return list[(seed + offset * 97) % list.length];
}

function createFortune(date) {
  const key = toDateKey(date);
  const seed = hash(`morning-fortune-${key}`);
  const score = (offset) => 68 + ((seed >>> offset) % 29);
  const scores = { work: score(1), money: score(4), people: score(7), health: score(10) };
  const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 4);
  const theme = pick(DATA.themes, seed, 1);
  const guide = pick(DATA.guidance, seed, 2);
  const mission = pick(DATA.missions, seed, 3);
  const color = pick(DATA.colors, seed, 4);
  const item = pick(DATA.items, seed, 5);
  const hour = 8 + (seed % 10);
  const minute = [10, 20, 30, 40, 50][(seed >>> 3) % 5];
  return {
    dateKey: key,
    overall,
    scores,
    themeTitle: theme[0], themeText: theme[1],
    overallComment: pick(DATA.overallComments, seed, 6),
    guidance: {
      wind: [guide[0], guide[1]], caution: [guide[2], guide[3]], avoid: [guide[4], guide[5]]
    },
    missionTitle: mission[0], missionText: mission[1],
    action: pick(DATA.actions, seed, 7),
    colorName: color[0], colorHex: color[1],
    luckyTime: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    luckyTimeText: hour < 12 ? "午前のひと息前" : hour < 15 ? "昼下がり" : "夕方の切り替え時",
    itemEmoji: item[0], itemName: item[1],
    quote: pick(DATA.quotes, seed, 8)
  };
}

function readStore(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

function writeStore(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { showToast("端末への保存に失敗しました"); }
}

function formatDate(key, withYear = true) {
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("ja-JP", {
    ...(withYear ? { year: "numeric" } : {}), month: "long", day: "numeric", weekday: "short"
  }).format(new Date(y, m - 1, d));
}

function showToast(message) {
  clearTimeout(toastTimer);
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function badgeFor(score) {
  if (score >= 90) return "GREAT DAY";
  if (score >= 80) return "GOOD DAY";
  if (score >= 72) return "STEADY DAY";
  return "SLOW DAY";
}

function renderToday() {
  $("#todayDate").textContent = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(today);
  $("#themeTitle").textContent = fortune.themeTitle;
  $("#themeText").textContent = fortune.themeText;
  $("#scoreBadge").textContent = badgeFor(fortune.overall);
  $("#overallComment").textContent = fortune.overallComment;
  $("#overallScore").textContent = fortune.overall;
  $("#overallRing").setAttribute("aria-label", `総合運 ${fortune.overall}点`);

  const cards = [
    ["⌘", "仕事運", "work"], ["¥", "金運", "money"], ["☻", "対人運", "people"], ["＋", "健康運", "health"]
  ];
  $("#fortuneGrid").innerHTML = cards.map(([icon, label, key]) => {
    const score = fortune.scores[key];
    const comment = pick(DATA.scoreComments[key], hash(dateKey), cards.findIndex((c) => c[2] === key));
    return `<article class="fortune-card"><div class="fortune-card-head"><span class="fortune-icon" aria-hidden="true">${icon}</span><span>${label}</span></div><strong>${score}</strong><div class="score-bar"><span style="--score:${score}%"></span></div><p>${comment}</p></article>`;
  }).join("");

  const guidance = [
    ["accent-green", "↗", "今日の追い風", ...fortune.guidance.wind],
    ["accent-amber", "!", "気を付けること", ...fortune.guidance.caution],
    ["accent-rose", "×", "避けたいこと", ...fortune.guidance.avoid]
  ];
  $("#guidanceList").innerHTML = guidance.map(([cls, symbol, label, title, text]) => `<article class="guidance-card ${cls}"><span class="guidance-symbol" aria-hidden="true">${symbol}</span><div><p>${label}</p><strong>${title}</strong><span>${text}</span></div></article>`).join("");

  $("#missionTitle").textContent = fortune.missionTitle;
  $("#missionText").textContent = fortune.missionText;
  $("#luckyAction").textContent = fortune.action;
  $("#colorDot").style.background = fortune.colorHex;
  $("#luckyColor").textContent = fortune.colorName;
  $("#luckyTime").textContent = fortune.luckyTime;
  $("#luckyTimeText").textContent = fortune.luckyTimeText;
  $("#luckyEmoji").textContent = fortune.itemEmoji;
  $("#luckyItem").textContent = fortune.itemName;
  $("#quoteText").textContent = fortune.quote;
  renderFavoriteState();
  renderMissionState();
  renderMoodState();
}

function saveTodayToHistory() {
  const history = readStore(STORAGE_KEYS.history, []);
  const record = { ...fortune, savedAt: Date.now() };
  const updated = [record, ...history.filter((item) => item.dateKey !== dateKey)].slice(0, 30);
  writeStore(STORAGE_KEYS.history, updated);
}

function getFavorites() { return readStore(STORAGE_KEYS.favorites, []); }
function isFavorite() { return getFavorites().some((item) => item.dateKey === dateKey); }

function renderFavoriteState() {
  const active = isFavorite();
  const button = $("#favoriteButton");
  button.classList.toggle("is-favorite", active);
  button.setAttribute("aria-pressed", String(active));
  button.setAttribute("aria-label", active ? "今日の運勢をお気に入りから外す" : "今日の運勢をお気に入りに追加");
  button.querySelector("span").textContent = active ? "♥" : "♡";
}

function toggleFavorite() {
  const favorites = getFavorites();
  const active = isFavorite();
  const updated = active ? favorites.filter((item) => item.dateKey !== dateKey) : [{ ...fortune, savedAt: Date.now() }, ...favorites].slice(0, 60);
  writeStore(STORAGE_KEYS.favorites, updated);
  renderFavoriteState();
  renderRecords();
  showToast(active ? "お気に入りから外しました" : "お気に入りに追加しました");
}

function renderMissionState() {
  const missions = readStore(STORAGE_KEYS.missions, {});
  const complete = Boolean(missions[dateKey]);
  const button = $("#missionButton");
  button.classList.toggle("is-complete", complete);
  button.innerHTML = complete ? '<span>達成済み</span><span aria-hidden="true">✓</span>' : '<span>達成した</span><span aria-hidden="true">✓</span>';
}

function toggleMission() {
  const missions = readStore(STORAGE_KEYS.missions, {});
  missions[dateKey] = !missions[dateKey];
  writeStore(STORAGE_KEYS.missions, missions);
  renderMissionState();
  showToast(missions[dateKey] ? "今日のミッション達成。いい流れです" : "ミッションを未達成に戻しました");
}

function recordCard(record, favoriteMode = false) {
  return `<article class="record-card"><div><span>${formatDate(record.dateKey)}</span><strong>${record.themeTitle}</strong><p>${record.overallComment}</p></div><div class="record-score"><b>${record.overall}</b><small>点</small></div>${favoriteMode ? `<button class="record-remove" type="button" data-remove-favorite="${record.dateKey}" aria-label="お気に入りから削除">×</button>` : ""}</article>`;
}

function renderRecords() {
  const history = readStore(STORAGE_KEYS.history, []);
  const favorites = getFavorites();
  $("#historyList").innerHTML = history.length ? history.map((r) => recordCard(r)).join("") : '<div class="empty-state">まだ履歴はありません。<br>今日の運勢を開くと自動で保存されます。</div>';
  $("#favoritesList").innerHTML = favorites.length ? favorites.map((r) => recordCard(r, true)).join("") : '<div class="empty-state">お気に入りはまだありません。<br>右上の♡を押して保存できます。</div>';
  $$('[data-remove-favorite]').forEach((button) => button.addEventListener("click", () => {
    writeStore(STORAGE_KEYS.favorites, getFavorites().filter((item) => item.dateKey !== button.dataset.removeFavorite));
    renderFavoriteState();
    renderRecords();
    showToast("お気に入りから削除しました");
  }));
}

function renderMoodState() {
  const moods = readStore(STORAGE_KEYS.moods, {});
  const current = moods[dateKey];
  $$("#moodButtons button").forEach((button) => button.classList.toggle("is-selected", button.dataset.mood === current));
  $("#reviewStatus").textContent = current ? "今日の気分を記録しました。お疲れさまでした。" : "まだ記録されていません。";
}

function saveMood(mood) {
  const moods = readStore(STORAGE_KEYS.moods, {});
  moods[dateKey] = mood;
  writeStore(STORAGE_KEYS.moods, moods);
  renderMoodState();
  showToast("今日の気分を保存しました");
}

async function shareFortune() {
  const text = `🌅 ${formatDate(dateKey)}の運勢\n総合運 ${fortune.overall}点｜${fortune.themeTitle}\n${fortune.overallComment}\nラッキーカラー：${fortune.colorName}\n#毎朝の運勢`;
  const shareData = { title: "毎朝の運勢", text, url: location.href.split("#")[0] };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      showToast("シェア画面を開きました");
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${text}\n${shareData.url}`);
      showToast("運勢をコピーしました");
    } else {
      const area = document.createElement("textarea");
      area.value = `${text}\n${shareData.url}`;
      area.style.position = "fixed"; area.style.opacity = "0";
      document.body.appendChild(area); area.select(); document.execCommand("copy"); area.remove();
      showToast("運勢をコピーしました");
    }
  } catch (error) {
    if (error?.name !== "AbortError") showToast("シェアを開始できませんでした");
  }
}

function openPage(page) {
  $$("[data-page-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.pagePanel === page));
  $$(".nav-item").forEach((item) => item.classList.toggle("is-active", item.dataset.page === page));
  $("#favoriteButton").hidden = page !== "today";
  const titles = { today: "毎朝の運勢", history: "運勢の履歴", favorites: "お気に入り", review: "今日の振り返り", settings: "設定" };
  $("#pageTitle").textContent = titles[page];
  if (page === "history" || page === "favorites") renderRecords();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearAllData() {
  if (!window.confirm("履歴・お気に入り・ミッション・振り返りをすべて削除しますか？")) return;
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  saveTodayToHistory();
  renderToday();
  renderRecords();
  showToast("保存データを削除しました");
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js?v=0.4.0");
      registration.update();
    } catch (error) {
      console.warn("Service Workerの登録に失敗しました。", error);
    }
  });
}

function bindEvents() {
  $("#favoriteButton").addEventListener("click", toggleFavorite);
  $("#missionButton").addEventListener("click", toggleMission);
  $("#shareButton").addEventListener("click", shareFortune);
  $("#clearDataButton").addEventListener("click", clearAllData);
  $$(".nav-item").forEach((item) => item.addEventListener("click", () => openPage(item.dataset.page)));
  $$("#moodButtons button").forEach((button) => button.addEventListener("click", () => saveMood(button.dataset.mood)));
  window.addEventListener("load", () => setTimeout(() => $("#splashScreen").classList.add("is-hidden"), 500));
}

saveTodayToHistory();
renderToday();
renderRecords();
bindEvents();
registerServiceWorker();
console.info(`毎朝の運勢 v${VERSION}`);

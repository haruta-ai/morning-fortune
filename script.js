/* 毎朝の運勢 v0.8.1 */
"use strict";

const VERSION = "0.8.1";
const STORAGE_KEYS = {
  favorites: "morningFortuneFavoritesV1",
  history: "morningFortuneHistoryV1",
  missions: "morningFortuneMissionsV1",
  moods: "morningFortuneMoodsV1",
  notes: "morningFortuneNotesV1",
  settings: "morningFortuneSettingsV1",
  badgeSeen: "morningFortuneBadgeSeenV1"
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
let calendarCursor = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedHistoryDateKey = null;

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



function applyTimeTheme() {
  const hour = new Date().getHours();
  const period = hour < 10 ? "morning" : hour < 16 ? "day" : hour < 19 ? "evening" : "night";
  document.documentElement.dataset.time = period;
  const greeting = $("#greeting");
  if (greeting) {
    greeting.textContent =
      period === "morning" ? "おはようございます" :
      period === "day" ? "こんにちは" :
      period === "evening" ? "おつかれさまです" : "今日もおつかれさまです";
  }
}

const BADGE_DEFINITIONS = [
  { id: "start", icon: "🌱", title: "はじめの一歩", text: "運勢を1日記録", value: (s) => s.history, target: 1 },
  { id: "streak3", icon: "🔥", title: "朝の習慣", text: "3日連続で利用", value: (s) => s.streak, target: 3 },
  { id: "mission3", icon: "🎯", title: "小さな達成", text: "ミッションを3回達成", value: (s) => s.missions, target: 3 },
  { id: "review3", icon: "✍️", title: "自分と向き合う", text: "振り返りを3回記録", value: (s) => s.reviews, target: 3 },
  { id: "favorite3", icon: "💛", title: "心に残る日", text: "お気に入りを3件保存", value: (s) => s.favorites, target: 3 },
  { id: "streak7", icon: "🏆", title: "一週間の相棒", text: "7日連続で利用", value: (s) => s.streak, target: 7 }
];

function getActivityStats() {
  const history = readStore(STORAGE_KEYS.history, []);
  const missions = readStore(STORAGE_KEYS.missions, {});
  const moods = readStore(STORAGE_KEYS.moods, {});
  return {
    history: history.length,
    streak: calculateStreak(history),
    missions: Object.values(missions).filter(Boolean).length,
    reviews: Object.keys(moods).length,
    favorites: getFavorites().length
  };
}

function getBadgeStates() {
  const stats = getActivityStats();
  return BADGE_DEFINITIONS.map((badge) => {
    const current = Math.max(0, badge.value(stats));
    return { ...badge, current, unlocked: current >= badge.target };
  });
}

function renderBadges() {
  const badges = getBadgeStates();
  const unlocked = badges.filter((badge) => badge.unlocked);
  const grid = $("#badgesGrid");

  if (grid) {
    grid.innerHTML = badges.map((badge) => `
      <article class="badge-item ${badge.unlocked ? "is-unlocked" : "is-locked"}">
        <span class="badge-icon" aria-hidden="true">${badge.unlocked ? badge.icon : "🔒"}</span>
        <div><strong>${badge.title}</strong><small>${badge.text}</small></div>
      </article>`).join("");
  }

  const progress = $("#badgeProgress");
  if (progress) progress.textContent = `${unlocked.length} / ${badges.length} 獲得`;

  const latest = [...unlocked].reverse()[0] || badges[0];
  if ($("#badgeTeaserIcon")) {
    $("#badgeTeaserIcon").textContent = latest.unlocked ? latest.icon : "🌱";
    $("#badgeTeaserTitle").textContent = latest.title;
    $("#badgeTeaserText").textContent = latest.unlocked ? `${latest.text}を達成しました。` : latest.text;
  }

  const next = badges.find((badge) => !badge.unlocked);
  const panel = $("#nextBadgePanel");
  if (panel) {
    panel.hidden = !next;
    if (next) {
      const remaining = Math.max(0, next.target - next.current);
      $("#nextBadgeTitle").textContent = next.title;
      $("#nextBadgeText").textContent = `あと${remaining}回・日で「${next.text}」を達成`;
      $("#nextBadgeBar").style.width = `${Math.min(100, (next.current / next.target) * 100)}%`;
    }
  }
}

function checkNewBadgeUnlock() {
  const badges = getBadgeStates();
  const unlockedIds = badges.filter((badge) => badge.unlocked).map((badge) => badge.id);
  const seenIds = readStore(STORAGE_KEYS.badgeSeen, []);
  const newlyUnlocked = badges.find((badge) => badge.unlocked && !seenIds.includes(badge.id));

  writeStore(STORAGE_KEYS.badgeSeen, unlockedIds);
  if (!newlyUnlocked) return;

  $("#celebrationIcon").textContent = newlyUnlocked.icon;
  $("#celebrationTitle").textContent = newlyUnlocked.title;
  $("#celebrationText").textContent = newlyUnlocked.text;
  const layer = $("#badgeCelebration");
  layer.hidden = false;
  requestAnimationFrame(() => layer.classList.add("is-visible"));
}

function closeBadgeCelebration() {
  const layer = $("#badgeCelebration");
  layer.classList.remove("is-visible");
  setTimeout(() => { layer.hidden = true; }, 260);
}

function scoreTone(score) {
  if (score >= 90) return "great";
  if (score >= 80) return "good";
  if (score >= 72) return "steady";
  return "slow";
}

function renderCalendar() {
  const title = $("#calendarTitle");
  const grid = $("#calendarGrid");
  if (!title || !grid) return;

  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  title.textContent = `${year}年${month + 1}月`;

  const history = readStore(STORAGE_KEYS.history, []);
  const historyMap = new Map(history.map((item) => [item.dateKey, item]));
  const moods = readStore(STORAGE_KEYS.moods, {});
  const missions = readStore(STORAGE_KEYS.missions, {});
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells = [];

  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - firstDay + 1;
    let cellDate;
    let outside = false;

    if (dayNumber < 1) {
      cellDate = new Date(year, month - 1, previousMonthDays + dayNumber);
      outside = true;
    } else if (dayNumber > daysInMonth) {
      cellDate = new Date(year, month + 1, dayNumber - daysInMonth);
      outside = true;
    } else {
      cellDate = new Date(year, month, dayNumber);
    }

    const key = toDateKey(cellDate);
    const record = historyMap.get(key);
    const mood = MOOD_LABELS[moods[key]]?.[0] || "";
    const mission = Boolean(missions[key]);
    const isToday = key === dateKey;
    const isSelected = key === selectedHistoryDateKey;
    const label = record
      ? `${formatDate(key)}、運勢${record.overall}点${mood ? `、気分${mood}` : ""}${mission ? "、ミッション達成" : ""}`
      : `${formatDate(key)}、記録なし`;

    cells.push(`
      <button class="calendar-cell ${outside ? "is-outside" : ""} ${record ? "has-record" : ""} ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""}"
        type="button" data-calendar-date="${key}" aria-label="${label}" aria-pressed="${isSelected}">
        <span class="calendar-day">${cellDate.getDate()}</span>
        ${record ? `<strong class="calendar-score tone-${scoreTone(record.overall)}">${record.overall}</strong>` : '<span class="calendar-no-record" aria-hidden="true">·</span>'}
        <span class="calendar-marks">${mood ? `<i>${mood}</i>` : ""}${mission ? '<i class="mission-mark">✓</i>' : ""}</span>
      </button>`);
  }

  grid.innerHTML = cells.join("");
  $("#nextMonthButton").disabled = year === today.getFullYear() && month >= today.getMonth();
}

function selectCalendarDate(key) {
  const history = readStore(STORAGE_KEYS.history, []);
  const record = history.find((item) => item.dateKey === key);
  selectedHistoryDateKey = key;
  renderCalendar();
  renderHistoryDayDetail(record, key);

  requestAnimationFrame(() => {
    $("#historyDayDetail")?.scrollIntoView({
      behavior: getSettings().reduceMotion ? "auto" : "smooth",
      block: "nearest"
    });
  });
}

function renderHistoryDayDetail(record, key) {
  const target = $("#historyDayDetail");
  if (!target) return;

  if (!record) {
    target.innerHTML = `
      <div class="history-detail-placeholder">
        <span aria-hidden="true">○</span>
        <strong>${formatDate(key)}</strong>
        <p>この日の運勢記録はありません。</p>
      </div>`;
    return;
  }

  const moods = readStore(STORAGE_KEYS.moods, {});
  const missions = readStore(STORAGE_KEYS.missions, {});
  const notes = readStore(STORAGE_KEYS.notes, {});
  const moodKey = moods[record.dateKey];
  const mood = moodKey ? MOOD_LABELS[moodKey] : null;
  const note = notes[record.dateKey]?.trim();
  const labels = [
    ["仕事運", record.scores.work],
    ["金運", record.scores.money],
    ["対人運", record.scores.people],
    ["健康運", record.scores.health]
  ];

  target.innerHTML = `
    <div class="history-detail-head">
      <div><p class="section-kicker">DAILY RECORD</p><h3>${formatDate(record.dateKey)}</h3></div>
      <div class="history-detail-overall"><strong>${record.overall}</strong><span>点</span></div>
    </div>
    <div class="history-detail-theme">
      <small>${badgeFor(record.overall)}</small>
      <strong>${escapeHtml(record.themeTitle)}</strong>
      <p>${escapeHtml(record.overallComment)}</p>
    </div>
    <div class="detail-score-grid">
      ${labels.map(([label, score]) => `<div><span>${label}</span><strong>${score}</strong></div>`).join("")}
    </div>
    <div class="detail-status-grid">
      <div><span>気分</span><strong>${mood ? `${mood[0]} ${mood[1]}` : "未記録"}</strong></div>
      <div><span>ミッション</span><strong>${missions[record.dateKey] ? "✓ 達成済み" : "未達成"}</strong></div>
    </div>
    ${note ? `<div class="detail-note-box"><span>ひとことメモ</span><p>${escapeHtml(note)}</p></div>` : ""}`;
}

function moveCalendarMonth(offset) {
  const next = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + offset, 1);
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  if (next > currentMonth) return;
  calendarCursor = next;
  selectedHistoryDateKey = null;
  renderCalendar();
  const target = $("#historyDayDetail");
  if (target) target.innerHTML = '<div class="history-detail-placeholder"><span aria-hidden="true">☝</span><p>記録のある日をタップしてください。</p></div>';
}

function jumpToCurrentMonth() {
  calendarCursor = new Date(today.getFullYear(), today.getMonth(), 1);
  selectedHistoryDateKey = dateKey;
  renderCalendar();
  const history = readStore(STORAGE_KEYS.history, []);
  renderHistoryDayDetail(history.find((item) => item.dateKey === dateKey), dateKey);
}

function getSettings() {
  return { fontSize: "normal", reduceMotion: false, ...readStore(STORAGE_KEYS.settings, {}) };
}

function applySettings() {
  const settings = getSettings();
  document.documentElement.dataset.fontSize = settings.fontSize;
  document.documentElement.classList.toggle("reduce-motion", settings.reduceMotion);
  const fontSelect = $("#fontSizeSelect");
  const motionToggle = $("#motionToggle");
  if (fontSelect) fontSelect.value = settings.fontSize;
  if (motionToggle) motionToggle.checked = settings.reduceMotion;
}

function calculateStreak(history) {
  if (!history.length) return 0;
  const keys = new Set(history.map((item) => item.dateKey));
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let streak = 0;
  while (keys.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function renderActivitySummary() {
  const history = readStore(STORAGE_KEYS.history, []);
  const missions = readStore(STORAGE_KEYS.missions, {});
  const moods = readStore(STORAGE_KEYS.moods, {});
  $("#streakDays").textContent = `${Math.max(1, calculateStreak(history))}日`;
  $("#missionCount").textContent = `${Object.values(missions).filter(Boolean).length}回`;
  $("#reviewCount").textContent = `${Object.keys(moods).length}回`;
  renderBadges();
}

function renderHistorySummary() {
  const history = readStore(STORAGE_KEYS.history, []);
  const scores = history.map((item) => Number(item.overall)).filter(Number.isFinite);
  $("#historyDays").textContent = history.length;
  $("#historyAverage").textContent = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : "--";
  $("#historyBest").textContent = scores.length ? Math.max(...scores) : "--";
}

const MOOD_LABELS = {
  great: ["😊", "とても良い"],
  good: ["🙂", "良い"],
  normal: ["😐", "ふつう"],
  tired: ["😮‍💨", "お疲れ"]
};

function renderReviewHistory() {
  const moods = readStore(STORAGE_KEYS.moods, {});
  const notes = readStore(STORAGE_KEYS.notes, {});
  const keys = [...new Set([...Object.keys(moods), ...Object.keys(notes)])]
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 7);
  const target = $("#reviewHistoryList");
  if (!target) return;
  target.innerHTML = keys.length ? keys.map((key) => {
    const mood = MOOD_LABELS[moods[key]] || ["✎", "メモ"];
    const note = notes[key]?.trim() || "ひと言メモはありません。";
    return `<article class="review-record"><div class="review-record-icon" aria-hidden="true">${mood[0]}</div><div><span>${formatDate(key)}</span><strong>${mood[1]}</strong><p>${escapeHtml(note)}</p></div></article>`;
  }).join("") : '<div class="empty-state">振り返りはまだありません。<br>今日の気分やメモを残してみましょう。</div>';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderReviewNote() {
  const notes = readStore(STORAGE_KEYS.notes, {});
  const input = $("#reviewNote");
  if (!input) return;
  input.value = notes[dateKey] || "";
  updateNoteCount();
}

function updateNoteCount() {
  const input = $("#reviewNote");
  const count = $("#noteCount");
  if (input && count) count.textContent = `${input.value.length} / 120`;
}

function saveReview() {
  const input = $("#reviewNote");
  const notes = readStore(STORAGE_KEYS.notes, {});
  const value = input.value.trim();
  if (value) notes[dateKey] = value;
  else delete notes[dateKey];
  writeStore(STORAGE_KEYS.notes, notes);
  renderReviewHistory();
  renderActivitySummary();
  showToast("振り返りを保存しました");
}

function saveSetting(name, value) {
  const settings = getSettings();
  settings[name] = value;
  writeStore(STORAGE_KEYS.settings, settings);
  applySettings();
}

function exportData() {
  const data = {
    app: "毎朝の運勢",
    version: VERSION,
    exportedAt: new Date().toISOString(),
    data: Object.fromEntries(Object.entries(STORAGE_KEYS).map(([name, key]) => [name, readStore(key, name === "history" || name === "favorites" ? [] : {})]))
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `morning-fortune-backup-${dateKey}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("バックアップを書き出しました");
}

async function importData(file) {
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (!parsed?.data || typeof parsed.data !== "object") throw new Error("invalid");
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      if (Object.prototype.hasOwnProperty.call(parsed.data, name)) writeStore(key, parsed.data[name]);
    });
    saveTodayToHistory();
    renderToday();
    renderRecords();
    renderHistorySummary();
    renderReviewHistory();
    renderActivitySummary();
    applySettings();
    showToast("バックアップを復元しました");
  } catch {
    showToast("バックアップを読み込めませんでした");
  } finally {
    $("#importFile").value = "";
  }
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
  renderReviewNote();
  renderActivitySummary();
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
  renderActivitySummary();
  checkNewBadgeUnlock();
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
  renderHistorySummary();
  renderCalendar();
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
  renderReviewHistory();
  renderActivitySummary();
  renderCalendar();
  checkNewBadgeUnlock();
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
  $$("[data-page-panel]").forEach((panel) => {
    const active = panel.dataset.pagePanel === page;
    panel.classList.toggle("is-active", active);
    if (active) {
      panel.classList.remove("page-enter");
      requestAnimationFrame(() => panel.classList.add("page-enter"));
    }
  });
  $$(".nav-item").forEach((item) => item.classList.toggle("is-active", item.dataset.page === page));
  $("#favoriteButton").hidden = page !== "today";
  const titles = { today: "毎朝の運勢", history: "運勢の履歴", favorites: "お気に入り", review: "今日の振り返り", settings: "設定" };
  $("#pageTitle").textContent = titles[page];
  if (page === "history" || page === "favorites") renderRecords();
  if (page === "review") { renderMoodState(); renderReviewNote(); renderReviewHistory(); }
  if (page === "settings") { applySettings(); renderBadges(); }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearAllData() {
  if (!window.confirm("履歴・お気に入り・ミッション・振り返りをすべて削除しますか？")) return;
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  saveTodayToHistory();
  renderToday();
  renderRecords();
  renderReviewHistory();
  renderActivitySummary();
  selectedHistoryDateKey = dateKey;
  renderCalendar();
  renderHistoryDayDetail(readStore(STORAGE_KEYS.history, []).find((item) => item.dateKey === dateKey), dateKey);
  closeBadgeCelebration();
  showToast("保存データを削除しました");
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js?v=0.8.0");
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
  $("#saveReviewButton").addEventListener("click", saveReview);
  $("#reviewNote").addEventListener("input", updateNoteCount);
  $("#fontSizeSelect").addEventListener("change", (event) => saveSetting("fontSize", event.target.value));
  $("#motionToggle").addEventListener("change", (event) => saveSetting("reduceMotion", event.target.checked));
  $("#exportButton").addEventListener("click", exportData);
  $("#importButton").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", (event) => importData(event.target.files[0]));
  $("#prevMonthButton").addEventListener("click", () => moveCalendarMonth(-1));
  $("#nextMonthButton").addEventListener("click", () => moveCalendarMonth(1));
  $("#currentMonthButton").addEventListener("click", jumpToCurrentMonth);
  $("#calendarGrid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-calendar-date]");
    if (!button) return;
    selectCalendarDate(button.dataset.calendarDate);
  });
  $("#badgeTeaser").addEventListener("click", () => openPage("settings"));
  $("#closeCelebrationButton").addEventListener("click", closeBadgeCelebration);
  $$(".nav-item").forEach((item) => item.addEventListener("click", () => openPage(item.dataset.page)));
  $$("#moodButtons button").forEach((button) => button.addEventListener("click", () => saveMood(button.dataset.mood)));
  window.addEventListener("load", () => setTimeout(() => $("#splashScreen").classList.add("is-hidden"), 500));
}

applyTimeTheme();
applySettings();
saveTodayToHistory();
renderToday();
renderRecords();
renderCalendar();
renderReviewHistory();
renderActivitySummary();
bindEvents();
setTimeout(checkNewBadgeUnlock, 850);
registerServiceWorker();
console.info(`毎朝の運勢 v${VERSION}`);

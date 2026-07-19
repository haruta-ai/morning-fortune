/* =========================================================
   毎朝の運勢 v0.8.0
   外部APIなし・日付から毎日同じ結果を生成
========================================================= */

"use strict";

const VERSION = "0.8.0";

const STORAGE_KEYS = {
  favorites: "morningFortuneFavoritesV080",
  reviews: "morningFortuneReviewsV080",
  settings: "morningFortuneSettingsV080"
};

const MASTER = {
  themes: [
    ["小さく整える日", "身の回りを少し整えると、気持ちにも良い余白が生まれます。"],
    ["一歩だけ進む日", "完璧を待たず、できることを一つ始めると流れが変わります。"],
    ["人との縁を育てる日", "やさしいひと言が、思った以上に良い空気を連れてきます。"],
    ["自分のペースを守る日", "周りと比べず、自分に合う速さを選ぶほど運気が安定します。"],
    ["選び直す日", "違和感を放置せず、小さく方向を変えることが幸運につながります。"],
    ["休む勇気を持つ日", "力を抜く時間を先に確保すると、午後からの集中力が戻ります。"],
    ["好奇心を大切にする日", "気になったことを少し調べるだけで、新しい可能性が見えてきます。"]
  ],
  categoryMessages: {
    work: ["優先順位を一つ決めると、作業がすっきり進みます。", "午前中の集中が成果につながります。", "確認を丁寧にすると信頼が高まります。", "小さな改善案が評価されやすい日です。"],
    money: ["買う前に一度考えると満足度が上がります。", "身近な節約が気持ちの余裕につながります。", "必要なものへの出費は前向きな投資になります。", "財布や支払い方法を整えると金運が安定します。"],
    people: ["素直な返事が良い関係を育てます。", "相手の話を最後まで聞くと誤解を防げます。", "久しぶりの人への連絡に良い日です。", "感謝を言葉にすると空気がやわらぎます。"],
    health: ["肩と目をこまめに休ませましょう。", "水分補給を意識すると調子が整います。", "短い散歩が気分転換になります。", "夜は少し早めに休むと回復しやすい日です。"]
  },
  guidance: {
    wind: ["午前中に小さな用事を一つ片付ける", "机や鞄の中を3分だけ整える", "気になっていた人へ短い連絡をする", "朝の光を浴びながら深呼吸する"],
    caution: ["返事を急ぎすぎない", "予定を詰め込みすぎない", "思い込みだけで判断しない", "疲れているのに無理を続けない"],
    avoid: ["他人との比較", "感情だけで結論を出すこと", "夜更かししての作業", "後回しを増やしすぎること"]
  },
  colors: [
    ["ネイビー", "#30486f"],
    ["テラコッタ", "#bd6f4a"],
    ["フォレストグリーン", "#4d705a"],
    ["ラベンダー", "#8a76bd"],
    ["サンドベージュ", "#c4a57d"],
    ["スカイブルー", "#70a7c4"],
    ["ワインレッド", "#8e4755"]
  ],
  times: ["8:20〜9:00", "10:30〜11:10", "12:40〜13:20", "14:00〜15:00", "16:30〜17:10", "19:00〜20:00"],
  items: ["お気に入りのマグ", "腕時計", "白いハンカチ", "小さなノート", "革製の小物", "イヤホン", "温かい飲み物"],
  quotes: [
    "急がなくても、一歩進めば流れは変わる。",
    "整えることは、自分を大切にすること。",
    "小さな選択が、今日の空気を変えていく。",
    "できたことを数えると、心は少し軽くなる。",
    "自分の速さで進む人は、遠くまで行ける。",
    "余白があるから、新しい運が入ってくる。",
    "やさしい言葉は、まず自分から始めよう。"
  ]
};

const state = {
  activePage: "today",
  calendarDate: startOfMonth(new Date()),
  selectedDateKey: null,
  selectedMood: 0,
  favorites: loadJson(STORAGE_KEYS.favorites, {}),
  reviews: loadJson(STORAGE_KEYS.reviews, {}),
  settings: loadJson(STORAGE_KEYS.settings, {
    largeText: false,
    reduceMotion: false
  })
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const elements = {
  pages: $$(".app-page"),
  navItems: $$(".nav-item"),
  appMain: $("#appMain"),
  toast: $("#toast"),
  todayDate: $("#todayDate"),
  todayTheme: $("#todayTheme"),
  todayScore: $("#todayScore"),
  todayStars: $("#todayStars"),
  todayMessage: $("#todayMessage"),
  todayCategories: $("#todayCategories"),
  todayGuidance: $("#todayGuidance"),
  todayLucky: $("#todayLucky"),
  todayQuote: $("#todayQuote"),
  favoriteTodayButton: $("#favoriteTodayButton"),
  calendarYear: $("#calendarYear"),
  calendarMonth: $("#calendarMonth"),
  calendarGrid: $("#calendarGrid"),
  historyDetail: $("#historyDetail"),
  favoritesList: $("#favoritesList"),
  reviewText: $("#reviewText"),
  reviewCount: $("#reviewCount"),
  moodButtons: $$("#reviewMood button"),
  largeTextToggle: $("#largeTextToggle"),
  reduceMotionToggle: $("#reduceMotionToggle")
};

let toastTimer = 0;

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn("保存データを読み込めませんでした。", error);
    return fallback;
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("保存できませんでした。", error);
    showToast("保存できませんでした。ブラウザの設定をご確認ください。");
    return false;
  }
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(date, includeYear = true) {
  return new Intl.DateTimeFormat("ja-JP", {
    ...(includeYear ? { year: "numeric" } : {}),
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(date);
}

function hashDate(date) {
  const key = Number(dateKey(date).replaceAll("-", ""));
  let value = key ^ 0x9e3779b9;
  value = Math.imul(value ^ (value >>> 16), 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35);
  return (value ^ (value >>> 16)) >>> 0;
}

function seededIndex(seed, length, shift = 0) {
  return ((seed >>> shift) + shift * 17) % length;
}

function createFortune(date) {
  const seed = hashDate(date);
  const theme = MASTER.themes[seededIndex(seed, MASTER.themes.length)];
  const overall = 70 + (seed % 27);
  const scores = {
    work: 68 + ((seed >>> 2) % 30),
    money: 66 + ((seed >>> 5) % 31),
    people: 70 + ((seed >>> 8) % 28),
    health: 67 + ((seed >>> 11) % 31)
  };

  const categoryDefs = [
    ["work", "仕事運", "💼"],
    ["money", "金運", "👛"],
    ["people", "対人運", "🤝"],
    ["health", "健康運", "♡"]
  ];

  return {
    key: dateKey(date),
    date,
    theme: theme[0],
    message: theme[1],
    overall,
    stars: Math.max(3, Math.round(overall / 20)),
    categories: categoryDefs.map(([key, label, icon], index) => ({
      key,
      label,
      icon,
      score: scores[key],
      message: MASTER.categoryMessages[key][seededIndex(seed, MASTER.categoryMessages[key].length, 4 + index * 3)]
    })),
    guidance: [
      ["🍃", "今日の追い風", MASTER.guidance.wind[seededIndex(seed, MASTER.guidance.wind.length, 3)]],
      ["⚠️", "気を付けること", MASTER.guidance.caution[seededIndex(seed, MASTER.guidance.caution.length, 7)]],
      ["⛔", "避けたいこと", MASTER.guidance.avoid[seededIndex(seed, MASTER.guidance.avoid.length, 11)]]
    ],
    lucky: {
      color: MASTER.colors[seededIndex(seed, MASTER.colors.length, 5)],
      time: MASTER.times[seededIndex(seed, MASTER.times.length, 9)],
      item: MASTER.items[seededIndex(seed, MASTER.items.length, 13)]
    },
    quote: MASTER.quotes[seededIndex(seed, MASTER.quotes.length, 17)]
  };
}

function renderStars(count) {
  return `${"★".repeat(count)}${"☆".repeat(5 - count)}`;
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2200);
}

function renderToday() {
  const today = new Date();
  const fortune = createFortune(today);
  const favorite = Boolean(state.favorites[fortune.key]);

  elements.todayDate.textContent = formatDate(today);
  elements.todayTheme.textContent = fortune.theme;
  elements.todayScore.textContent = `${fortune.overall}点`;
  elements.todayStars.textContent = renderStars(fortune.stars);
  elements.todayMessage.textContent = fortune.message;

  elements.todayCategories.innerHTML = fortune.categories.map((category) => `
    <article class="fortune-tile">
      <div class="fortune-tile-head">
        <span>${category.icon} ${category.label}</span>
        <span>${renderStars(Math.max(1, Math.round(category.score / 20)))}</span>
      </div>
      <strong>${category.score}点</strong>
      <p>${category.message}</p>
    </article>
  `).join("");

  elements.todayGuidance.innerHTML = fortune.guidance.map(([icon, title, text]) => `
    <article class="guidance-item">
      <span class="guidance-icon" aria-hidden="true">${icon}</span>
      <div><strong>${title}</strong><span>${text}</span></div>
    </article>
  `).join("");

  elements.todayLucky.innerHTML = `
    <article class="lucky-tile">
      <small>ラッキーカラー</small>
      <i class="color-chip" style="background:${fortune.lucky.color[1]}" aria-hidden="true"></i>
      <strong>${fortune.lucky.color[0]}</strong>
    </article>
    <article class="lucky-tile">
      <small>ラッキータイム</small>
      <strong>⏰ ${fortune.lucky.time}</strong>
    </article>
    <article class="lucky-tile">
      <small>ラッキーアイテム</small>
      <strong>🎁 ${fortune.lucky.item}</strong>
    </article>
  `;

  elements.todayQuote.textContent = `“${fortune.quote}”`;
  elements.favoriteTodayButton.textContent = favorite
    ? "♥ お気に入りから外す"
    : "♡ 今日の運勢をお気に入りに保存";
  elements.favoriteTodayButton.setAttribute("aria-pressed", String(favorite));
}

function renderCalendar() {
  const year = state.calendarDate.getFullYear();
  const month = state.calendarDate.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  const todayKey = dateKey(new Date());

  elements.calendarYear.textContent = `${year}年`;
  elements.calendarMonth.textContent = `${month + 1}月`;

  const days = [];
  for (let index = 0; index < 42; index += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const key = dateKey(day);
    const isOutside = day.getMonth() !== month;
    const hasRecord = Boolean(state.reviews[key] || state.favorites[key]);

    days.push(`
      <button
        class="calendar-day${isOutside ? " is-outside" : ""}${key === todayKey ? " is-today" : ""}${key === state.selectedDateKey ? " is-selected" : ""}${hasRecord ? " has-record" : ""}"
        type="button"
        data-date="${key}"
        aria-label="${formatDate(day)}${hasRecord ? "、記録あり" : ""}"
        ${key === state.selectedDateKey ? 'aria-pressed="true"' : 'aria-pressed="false"'}
      >${day.getDate()}</button>
    `);
  }

  elements.calendarGrid.innerHTML = days.join("");
}

function renderHistoryDetail(key) {
  const date = parseDateKey(key);
  const fortune = createFortune(date);
  const review = state.reviews[key];

  elements.historyDetail.innerHTML = `
    <div class="detail-header">
      <div>
        <p class="section-kicker">DAILY DETAIL</p>
        <h3>${formatDate(date)}</h3>
      </div>
      <div class="detail-score">${fortune.overall}点</div>
    </div>
    <div class="stars" aria-label="星評価 ${fortune.stars}">${renderStars(fortune.stars)}</div>
    <p class="detail-message"><strong>${fortune.theme}</strong><br>${fortune.message}</p>
    <div class="detail-mini-grid">
      ${fortune.categories.map((item) => `
        <div class="detail-mini"><small>${item.icon} ${item.label}</small><strong>${item.score}点</strong></div>
      `).join("")}
    </div>
    ${review ? `
      <div class="detail-review">
        <strong>振り返り ${"★".repeat(review.mood)}${"☆".repeat(5 - review.mood)}</strong>
        <p>${escapeHtml(review.text || "コメントなし")}</p>
      </div>
    ` : `
      <div class="detail-review">
        <strong>振り返り</strong>
        <p>この日の振り返りはまだありません。</p>
      </div>
    `}
  `;
}

function renderFavorites() {
  const keys = Object.keys(state.favorites)
    .filter((key) => state.favorites[key])
    .sort()
    .reverse();

  if (keys.length === 0) {
    elements.favoritesList.innerHTML = `
      <div class="empty-state">
        <div><div style="font-size:2rem">♡</div><strong>お気に入りはまだありません</strong><p>「今日」画面から保存できます。</p></div>
      </div>
    `;
    return;
  }

  elements.favoritesList.innerHTML = keys.map((key) => {
    const date = parseDateKey(key);
    const fortune = createFortune(date);
    return `
      <article class="list-card">
        <div class="list-card-head">
          <div>
            <p class="section-kicker">${formatDate(date)}</p>
            <h3>${fortune.theme}</h3>
          </div>
          <strong class="detail-score">${fortune.overall}点</strong>
        </div>
        <p>${fortune.quote}</p>
        <button class="text-button favorite-remove-button" type="button" data-date="${key}">削除</button>
      </article>
    `;
  }).join("");
}

function renderReview() {
  const key = dateKey(new Date());
  const saved = state.reviews[key];
  state.selectedMood = saved?.mood || 0;
  elements.reviewText.value = saved?.text || "";
  updateReviewCount();
  renderMood();
}

function renderMood() {
  elements.moodButtons.forEach((button) => {
    const selected = Number(button.dataset.mood) === state.selectedMood;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-checked", String(selected));
  });
}

function updateReviewCount() {
  elements.reviewCount.textContent = String(elements.reviewText.value.length);
}

function applySettings() {
  document.body.classList.toggle("is-large-text", Boolean(state.settings.largeText));
  document.body.classList.toggle("is-reduced-motion", Boolean(state.settings.reduceMotion));
  elements.largeTextToggle.checked = Boolean(state.settings.largeText);
  elements.reduceMotionToggle.checked = Boolean(state.settings.reduceMotion);
}

function switchPage(target) {
  state.activePage = target;

  elements.pages.forEach((page) => {
    page.classList.toggle("is-active", page.dataset.page === target);
  });

  elements.navItems.forEach((item) => {
    const active = item.dataset.target === target;
    item.classList.toggle("is-active", active);
    active ? item.setAttribute("aria-current", "page") : item.removeAttribute("aria-current");
  });

  if (target === "history") {
    renderCalendar();
  } else if (target === "favorites") {
    renderFavorites();
  } else if (target === "review") {
    renderReview();
  }

  window.scrollTo({ top: 0, behavior: state.settings.reduceMotion ? "auto" : "smooth" });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

elements.navItems.forEach((item) => {
  item.addEventListener("click", () => switchPage(item.dataset.target));
});

elements.favoriteTodayButton.addEventListener("click", () => {
  const key = dateKey(new Date());
  const next = !state.favorites[key];

  if (next) {
    state.favorites[key] = true;
  } else {
    delete state.favorites[key];
  }

  if (saveJson(STORAGE_KEYS.favorites, state.favorites)) {
    renderToday();
    showToast(next ? "お気に入りに保存しました" : "お気に入りから外しました");
  }
});

$("#prevMonthButton").addEventListener("click", () => {
  state.calendarDate = new Date(
    state.calendarDate.getFullYear(),
    state.calendarDate.getMonth() - 1,
    1
  );
  renderCalendar();
});

$("#nextMonthButton").addEventListener("click", () => {
  state.calendarDate = new Date(
    state.calendarDate.getFullYear(),
    state.calendarDate.getMonth() + 1,
    1
  );
  renderCalendar();
});

function jumpToCurrentMonth() {
  state.calendarDate = startOfMonth(new Date());
  renderCalendar();
}

$("#jumpTodayButton").addEventListener("click", jumpToCurrentMonth);
$("#monthTitleButton").addEventListener("click", jumpToCurrentMonth);

elements.calendarGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".calendar-day");
  if (!button) return;

  state.selectedDateKey = button.dataset.date;
  const selectedDate = parseDateKey(state.selectedDateKey);

  if (
    selectedDate.getFullYear() !== state.calendarDate.getFullYear() ||
    selectedDate.getMonth() !== state.calendarDate.getMonth()
  ) {
    state.calendarDate = startOfMonth(selectedDate);
  }

  renderCalendar();
  renderHistoryDetail(state.selectedDateKey);

  requestAnimationFrame(() => {
    elements.historyDetail.scrollIntoView({
      behavior: state.settings.reduceMotion ? "auto" : "smooth",
      block: "nearest"
    });
  });
});

elements.favoritesList.addEventListener("click", (event) => {
  const button = event.target.closest(".favorite-remove-button");
  if (!button) return;

  delete state.favorites[button.dataset.date];
  if (saveJson(STORAGE_KEYS.favorites, state.favorites)) {
    renderFavorites();
    renderCalendar();
    renderToday();
    showToast("お気に入りから削除しました");
  }
});

elements.moodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.selectedMood = Number(button.dataset.mood);
    renderMood();
  });
});

elements.reviewText.addEventListener("input", updateReviewCount);

$("#saveReviewButton").addEventListener("click", () => {
  if (state.selectedMood === 0) {
    showToast("満足度を選んでください");
    return;
  }

  const key = dateKey(new Date());
  state.reviews[key] = {
    mood: state.selectedMood,
    text: elements.reviewText.value.trim(),
    savedAt: new Date().toISOString()
  };

  if (saveJson(STORAGE_KEYS.reviews, state.reviews)) {
    renderCalendar();
    showToast("今日の振り返りを保存しました");
  }
});

elements.largeTextToggle.addEventListener("change", () => {
  state.settings.largeText = elements.largeTextToggle.checked;
  saveJson(STORAGE_KEYS.settings, state.settings);
  applySettings();
});

elements.reduceMotionToggle.addEventListener("change", () => {
  state.settings.reduceMotion = elements.reduceMotionToggle.checked;
  saveJson(STORAGE_KEYS.settings, state.settings);
  applySettings();
});

$("#resetDataButton").addEventListener("click", () => {
  const approved = window.confirm("お気に入り・振り返り・設定をすべて初期化します。よろしいですか？");
  if (!approved) return;

  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  state.favorites = {};
  state.reviews = {};
  state.settings = { largeText: false, reduceMotion: false };
  state.selectedMood = 0;
  state.selectedDateKey = null;

  applySettings();
  renderToday();
  renderCalendar();
  renderFavorites();
  renderReview();
  showToast("保存データを初期化しました");
});

function registerServiceWorker() {
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch((error) => {
        console.warn("Service Workerを登録できませんでした。", error);
      });
    });
  }
}

function init() {
  applySettings();
  renderToday();
  renderCalendar();
  renderReview();
  registerServiceWorker();
  console.info(`毎朝の運勢 v${VERSION} を起動しました。`);
}

init();

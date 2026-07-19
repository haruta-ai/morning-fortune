/* =========================================
   毎朝の運勢 v0.1.0
   ホーム画面の表示と簡単な操作
========================================= */

"use strict";

const STORAGE_KEYS = {
  favorite: "morningFortuneFavorite",
  mission: "morningFortuneMissionComplete"
};

const todayDate = document.getElementById("todayDate");
const greeting = document.getElementById("greeting");
const favoriteButton = document.getElementById("favoriteButton");
const missionButton = document.getElementById("missionButton");
const toast = document.getElementById("toast");
const navItems = document.querySelectorAll(".nav-item");

let toastTimer;

/**
 * 今日の日付を日本語で表示します。
 */
function renderToday() {
  const now = new Date();

  const dateText = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(now);

  todayDate.textContent = dateText;
}

/**
 * 現在時刻に合わせて挨拶を切り替えます。
 */
function renderGreeting() {
  const hour = new Date().getHours();

  if (hour < 10) {
    greeting.textContent = "おはようございます";
  } else if (hour < 17) {
    greeting.textContent = "こんにちは";
  } else {
    greeting.textContent = "おつかれさまです";
  }
}

/**
 * 画面下部に短いメッセージを表示します。
 * @param {string} message 表示する文章
 */
function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");

  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

/**
 * お気に入り状態を画面へ反映します。
 * @param {boolean} isFavorite お気に入り登録済みか
 */
function renderFavoriteState(isFavorite) {
  favoriteButton.classList.toggle("is-favorite", isFavorite);
  favoriteButton.setAttribute("aria-pressed", String(isFavorite));
  favoriteButton.setAttribute(
    "aria-label",
    isFavorite
      ? "今日の運勢をお気に入りから外す"
      : "今日の運勢をお気に入りに追加"
  );

  favoriteButton.querySelector("span").textContent = isFavorite ? "♥" : "♡";
}

/**
 * ミッション達成状態を画面へ反映します。
 * @param {boolean} isComplete 達成済みか
 */
function renderMissionState(isComplete) {
  missionButton.classList.toggle("is-complete", isComplete);

  missionButton.innerHTML = isComplete
    ? "<span>達成済み</span><span aria-hidden=\"true\">✓</span>"
    : "<span>達成した</span><span aria-hidden=\"true\">✓</span>";
}

/**
 * 保存済みデータを読み込みます。
 */
function restoreSavedState() {
  const isFavorite = localStorage.getItem(STORAGE_KEYS.favorite) === "true";
  const isMissionComplete =
    localStorage.getItem(STORAGE_KEYS.mission) === "true";

  renderFavoriteState(isFavorite);
  renderMissionState(isMissionComplete);
}

/**
 * お気に入りボタンの処理です。
 */
favoriteButton.addEventListener("click", () => {
  const nextState =
    favoriteButton.getAttribute("aria-pressed") !== "true";

  localStorage.setItem(STORAGE_KEYS.favorite, String(nextState));
  renderFavoriteState(nextState);

  showToast(
    nextState
      ? "今日の運勢をお気に入りに追加しました"
      : "お気に入りから外しました"
  );
});

/**
 * 今日のミッションボタンの処理です。
 */
missionButton.addEventListener("click", () => {
  const isComplete = missionButton.classList.contains("is-complete");
  const nextState = !isComplete;

  localStorage.setItem(STORAGE_KEYS.mission, String(nextState));
  renderMissionState(nextState);

  showToast(
    nextState
      ? "今日のミッション達成。いい流れです"
      : "ミッションを未達成に戻しました"
  );
});

/**
 * 下部メニューの仮動作です。
 * v0.1.0では「今日」以外は準備中表示にしています。
 */
navItems.forEach((item) => {
  item.addEventListener("click", () => {
    const page = item.dataset.page;

    if (page === "today") {
      navItems.forEach((navItem) => {
        navItem.classList.toggle("is-active", navItem === item);
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      return;
    }

    showToast("この機能は次のバージョンで追加します");
  });
});

/**
 * 初期表示
 */
renderToday();
renderGreeting();
restoreSavedState();

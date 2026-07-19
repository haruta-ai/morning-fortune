/* 毎朝の運勢 v0.2.0 */

"use strict";

const STORAGE_KEYS = {
  favorite: "morningFortuneFavorite",
  mission: "morningFortuneMissionComplete"
};

const todayDate = document.getElementById("todayDate");
const favoriteButton = document.getElementById("favoriteButton");
const missionButton = document.getElementById("missionButton");
const toast = document.getElementById("toast");
const splashScreen = document.getElementById("splashScreen");
const navItems = document.querySelectorAll(".nav-item");

let toastTimer;

function renderToday() {
  const dateText = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(new Date());

  todayDate.textContent = dateText;
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");

  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

function renderFavoriteState(isFavorite) {
  favoriteButton.classList.toggle("is-favorite", isFavorite);
  favoriteButton.setAttribute("aria-pressed", String(isFavorite));
  favoriteButton.querySelector("span").textContent = isFavorite ? "♥" : "♡";
}

function renderMissionState(isComplete) {
  missionButton.classList.toggle("is-complete", isComplete);
  missionButton.innerHTML = isComplete
    ? '<span>達成済み</span><span aria-hidden="true">✓</span>'
    : '<span>達成した</span><span aria-hidden="true">✓</span>';
}

function restoreSavedState() {
  renderFavoriteState(
    localStorage.getItem(STORAGE_KEYS.favorite) === "true"
  );

  renderMissionState(
    localStorage.getItem(STORAGE_KEYS.mission) === "true"
  );
}

favoriteButton.addEventListener("click", () => {
  const nextState = favoriteButton.getAttribute("aria-pressed") !== "true";

  localStorage.setItem(STORAGE_KEYS.favorite, String(nextState));
  renderFavoriteState(nextState);

  showToast(
    nextState
      ? "今日の運勢をお気に入りに追加しました"
      : "お気に入りから外しました"
  );
});

missionButton.addEventListener("click", () => {
  const nextState = !missionButton.classList.contains("is-complete");

  localStorage.setItem(STORAGE_KEYS.mission, String(nextState));
  renderMissionState(nextState);

  showToast(
    nextState
      ? "今日のミッション達成。いい流れです"
      : "ミッションを未達成に戻しました"
  );
});

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    if (item.dataset.page === "today") {
      navItems.forEach((navItem) => {
        navItem.classList.toggle("is-active", navItem === item);
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    showToast("この機能は今後のバージョンで追加します");
  });
});

window.addEventListener("load", () => {
  window.setTimeout(() => {
    splashScreen.classList.add("is-hidden");
  }, 650);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      console.log("Service Workerの登録に失敗しました。");
    });
  });
}

renderToday();
restoreSavedState();

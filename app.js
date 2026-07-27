import { APP_CONFIG } from "./config.js";
import { database } from "./database.js";
import { fortuneEngine } from "./engine.js";
import {
  createAnalyticsEvent,
  createProfile,
  createReflection
} from "./models.js";
import { localSettings } from "./storage.js";
import { formatJapaneseDate, toLocalDateKey } from "./utils.js";

const $ = selector => document.querySelector(selector);

const ui = {
  splash: $("#splash"),
  welcome: $("#welcomePanel"),
  home: $("#homePanel"),
  form: $("#profileForm"),
  name: $("#displayName"),
  birth: $("#birthDate"),
  blood: $("#bloodType"),
  date: $("#todayLabel"),
  greeting: $("#greeting"),
  overallStars: $("#overallStars"),
  theme: $("#themeLabel"),
  lead: $("#themeLead"),
  overallScore: $("#overallScore"),
  loveStars: $("#loveStars"),
  loveScore: $("#loveScore"),
  moneyStars: $("#moneyStars"),
  moneyScore: $("#moneyScore"),
  workStars: $("#workStars"),
  workScore: $("#workScore"),
  key: $("#todayKey"),
  action: $("#luckyAction"),
  promise: $("#todayPromise"),
  luckyColor: $("#luckyColor"),
  luckyTime: $("#luckyTime"),
  overallMessage: $("#overallMessage"),
  axisMessages: $("#axisMessages"),
  openProfile: $("#openProfileButton"),
  dialog: $("#profileDialog"),
  summary: $("#profileSummary"),
  reset: $("#resetProfileButton"),
  reflectionForm: $("#reflectionForm"),
  reflectionMessage: $("#reflectionMessage"),
  reflectionNote: $("#reflectionNote"),
  promiseFulfilled: $("#promiseFulfilled"),
  nightThemeLead: $("#nightThemeLead"),
  offlineBanner: $("#offlineBanner"),
  updateBanner: $("#updateBanner"),
  applyUpdate: $("#applyUpdateButton"),
  startupError: $("#startupErrorPanel"),
  startupErrorMessage: $("#startupErrorMessage"),
  appManagementMessage: $("#appManagementMessage"),
  appVersion: $("#appVersion")
};

const appState = {
  profile: null,
  themes: [],
  content: {},
  currentResult: null
};

function starText(stars) {
  return "★".repeat(stars) + "☆".repeat(5 - stars);
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${path}を読み込めませんでした。`);
  }
  return response.json();
}

async function registerServiceWorker() {
  const secure =
    location.protocol === "https:" || location.hostname === "localhost";

  if (!("serviceWorker" in navigator) || !secure) return;

  try {
    const registration = await navigator.serviceWorker.register("./service-worker.js");

    const offerUpdate = worker => {
      if (!worker || !navigator.serviceWorker.controller) return;
      ui.updateBanner.hidden = false;
      ui.applyUpdate.onclick = () => worker.postMessage({ type: "SKIP_WAITING" });
    };

    offerUpdate(registration.waiting);
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed") offerUpdate(worker);
      });
    });

    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
  } catch (error) {
    console.warn("Service Worker registration failed:", error);
  }
}

function updateConnectionStatus() {
  ui.offlineBanner.hidden = navigator.onLine;
}

function showStartupError(error) {
  ui.welcome.hidden = true;
  ui.home.hidden = true;
  ui.startupError.hidden = false;
  ui.startupErrorMessage.textContent =
    `詳細：${error?.message || "不明なエラー"}`;
}

async function refreshAppCache() {
  ui.appManagementMessage.textContent = "キャッシュを更新しています…";

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith("emf-"))
        .map(key => caches.delete(key))
    );
  }

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration("./");
    await registration?.update();
  }

  window.location.reload();
}

async function getTodayResult() {
  const dateKey = toLocalDateKey();
  const resultId =
    `primary:${dateKey}:${APP_CONFIG.engineVersion}:${APP_CONFIG.contentVersion}`;

  let result = await database.get("dailyResults", resultId);

  if (!result) {
    result = await fortuneEngine.generate(
      appState.profile,
      new Date(),
      appState.themes,
      appState.content
    );

    await database.put("dailyResults", result);
    await database.put(
      "analyticsEvents",
      createAnalyticsEvent("fortune_generated", {
        themeId: result.themeId,
        stars: result.axes.overall.stars,
        contentId: result.content.id
      })
    );
  }

  return result;
}

function renderProfileSummary() {
  const profile = appState.profile;

  ui.summary.textContent = profile
    ? [
        `表示名：${profile.displayName || "未設定"}`,
        `生年月日：${profile.birthDate}`,
        `血液型：${profile.bloodType ? `${profile.bloodType}型` : "未設定"}`
      ].join("\n")
    : "";
}

async function renderHome() {
  const result = await getTodayResult();
  appState.currentResult = result;

  ui.date.textContent = formatJapaneseDate();
  ui.greeting.textContent =
    `おはようございます、${appState.profile.displayName || "あなた"}さん`;

  ui.overallStars.textContent = starText(result.axes.overall.stars);
  ui.theme.textContent = result.themeLabel;
  ui.lead.textContent = result.content.lead;
  ui.overallScore.textContent = `${result.axes.overall.score} / 100`;

  for (const axis of ["love", "money", "work"]) {
    ui[`${axis}Stars`].textContent = starText(result.axes[axis].stars);
    ui[`${axis}Score`].textContent = `${result.axes[axis].score}点`;
  }

  ui.key.textContent = result.content.key;
  ui.action.textContent = result.content.action;
  ui.promise.textContent = result.content.promise;
  ui.luckyColor.textContent = result.content.luckyColor.label;
  ui.luckyTime.textContent = result.content.luckyTime;
  ui.overallMessage.textContent = result.content.axisMessages.overall;

  const axisNames = {
    love: "恋愛運",
    money: "金運",
    work: "仕事運"
  };

  ui.axisMessages.replaceChildren(
    ...["love", "money", "work"].map(axis => {
      const paragraph = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = axisNames[axis];
      paragraph.append(
        strong,
        document.createElement("br"),
        document.createTextNode(result.content.axisMessages[axis])
      );
      return paragraph;
    })
  );

  renderProfileSummary();

  ui.nightThemeLead.textContent =
    `今朝のテーマは「${result.themeLabel}」でした。` +
    result.content.nightPrompt;

  const reflection = await database.get(
    "reflections",
    `${appState.profile.id}:${result.dateKey}`
  );

  if (reflection) {
    const moodInput = ui.reflectionForm.querySelector(
      `input[name="mood"][value="${reflection.mood}"]`
    );
    if (moodInput) moodInput.checked = true;
    ui.promiseFulfilled.checked = reflection.fulfilled;
    ui.reflectionNote.value = reflection.note;
    ui.reflectionMessage.textContent = "今日の振り返りは保存済みです。";
  } else {
    ui.reflectionForm.reset();
    const defaultMood = ui.reflectionForm.querySelector(
      'input[name="mood"][value="3"]'
    );
    if (defaultMood) defaultMood.checked = true;
    ui.reflectionMessage.textContent = "";
  }
}

async function render() {
  const hasProfile = Boolean(appState.profile);
  ui.welcome.hidden = hasProfile;
  ui.home.hidden = !hasProfile;

  if (hasProfile) {
    await renderHome();
  }
}

ui.form.addEventListener("submit", async event => {
  event.preventDefault();

  try {
    const profile = createProfile({
      displayName: ui.name.value,
      birthDate: ui.birth.value,
      bloodType: ui.blood.value
    });

    await database.put("profiles", profile);
    await database.put(
      "analyticsEvents",
      createAnalyticsEvent("profile_saved")
    );

    appState.profile = profile;
    await render();
  } catch (error) {
    window.alert(error.message);
  }
});

ui.openProfile.addEventListener("click", () => {
  if (!appState.profile) return;
  renderProfileSummary();
  ui.dialog.showModal();
});

ui.reset.addEventListener("click", async () => {
  if (!window.confirm("プロフィールを削除しますか？")) return;

  await database.delete("profiles", "primary");
  appState.profile = null;
  ui.dialog.close();
  ui.form.reset();
  await render();
});

ui.reflectionForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (!appState.profile || !appState.currentResult) {
    ui.reflectionMessage.textContent =
      "今日の運勢を読み込んでから保存してください。";
    return;
  }

  try {
    const mood =
      ui.reflectionForm.querySelector(
        'input[name="mood"]:checked'
      )?.value || 3;

    const reflection = createReflection({
      profileId: appState.profile.id,
      dateKey: appState.currentResult.dateKey,
      themeId: appState.currentResult.themeId,
      themeLabel: appState.currentResult.themeLabel,
      mood,
      fulfilled: ui.promiseFulfilled.checked,
      note: ui.reflectionNote.value
    });

    const existing = await database.get("reflections", reflection.id);
    if (existing) reflection.createdAt = existing.createdAt;

    await database.put("reflections", reflection);
    await database.put(
      "analyticsEvents",
      createAnalyticsEvent("reflection_saved", {
        themeId: reflection.themeId,
        mood: reflection.mood,
        fulfilled: reflection.fulfilled
      })
    );

    ui.reflectionMessage.textContent =
      "今日の振り返りを保存しました。おつかれさまでした。";
  } catch (error) {
    ui.reflectionMessage.textContent =
      `保存できませんでした：${error.message}`;
  }
});

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);

document.querySelectorAll('[data-app-action="reload"]').forEach(button => {
  button.addEventListener("click", () => window.location.reload());
});

document.querySelectorAll('[data-app-action="refresh-cache"]').forEach(button => {
  button.addEventListener("click", async () => {
    const buttons = document.querySelectorAll('[data-app-action="refresh-cache"]');
    buttons.forEach(item => { item.disabled = true; });
    try {
      await refreshAppCache();
    } catch (error) {
      buttons.forEach(item => { item.disabled = false; });
      const message = `キャッシュを更新できませんでした：${error.message}`;
      ui.appManagementMessage.textContent = message;
      ui.startupErrorMessage.textContent = message;
    }
  });
});

async function initialize() {
  const hardStop = window.setTimeout(() => {
    ui.splash.classList.add("is-hidden");
  }, 2800);

  try {
    ui.startupError.hidden = true;
    ui.appVersion.textContent = APP_CONFIG.appVersion;
    updateConnectionStatus();
    localSettings.set("contentVersion", APP_CONFIG.contentVersion);
    await database.ready();

    [appState.themes, appState.content] = await Promise.all([
      loadJson("./data/themes.json"),
      loadJson("./data/content.json")
    ]);

    appState.profile = await database.get("profiles", "primary");

    await render();
    await registerServiceWorker();

    await database.put(
      "analyticsEvents",
      createAnalyticsEvent("app_open", {
        appVersion: APP_CONFIG.appVersion
      })
    );
  } catch (error) {
    console.error(error);
    showStartupError(error);
  } finally {
    window.clearTimeout(hardStop);
    window.setTimeout(() => {
      ui.splash.classList.add("is-hidden");
    }, 1850);
  }
}

initialize();

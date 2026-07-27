import { APP_CONFIG } from "./config.js";
import { database } from "./database.js";
import { fortuneEngine } from "./engine.js";
import { createAnalyticsEvent, createProfile, createReflection } from "./models.js";
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
  nightThemeLead: $("#nightThemeLead")
};

const appState = {
  profile: null,
  themes: [],
  content: {},
  initialized: false,
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
  const isSecure =
    location.protocol === "https:" || location.hostname === "localhost";

  if (!("serviceWorker" in navigator) || !isSecure) {
    return;
  }

  try {
    await navigator.serviceWorker.register("./service-worker.js");
  } catch (error) {
    console.warn("Service Worker registration failed:", error);
  }
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
        stars: result.axes.overall.stars
      })
    );
  }

  return result;
}

function renderProfileSummary() {
  const profile = appState.profile;

  if (!profile) {
    ui.summary.textContent = "";
    return;
  }

  ui.summary.textContent = [
    `表示名：${profile.displayName || "未設定"}`,
    `生年月日：${profile.birthDate}`,
    `血液型：${profile.bloodType ? `${profile.bloodType}型` : "未設定"}`
  ].join("\n");
}

async function renderHome() {
  const result = await getTodayResult();
  appState.currentResult = result;
  const profile = appState.profile;

  ui.date.textContent = formatJapaneseDate();
  ui.greeting.textContent =
    `おはようございます、${profile.displayName || "あなた"}さん`;

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
      const lineBreak = document.createElement("br");
      const message = document.createTextNode(
        result.content.axisMessages[axis]
      );

      strong.textContent = axisNames[axis];
      paragraph.append(strong, lineBreak, message);
      return paragraph;
    })
  );

  renderProfileSummary();

  ui.nightThemeLead.textContent =
    `今朝のテーマは「${result.themeLabel}」でした。` +
    "できたことを一つ見つけて、今日を閉じましょう。";

  const reflection = await database.get(
    "reflections",
    `${profile.id}:${result.dateKey}`
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

async function initialize() {
  const hardStop = window.setTimeout(() => {
    ui.splash.classList.add("is-hidden");
  }, 2800);

  try {
    localSettings.
ui.reflectionForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (!appState.profile || !appState.currentResult) {
    ui.reflectionMessage.textContent =
      "今日の運勢を読み込んでから保存してください。";
    return;
  }

  try {
    const mood =
      ui.reflectionForm.querySelector('input[name="mood"]:checked')?.value || 3;

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
    if (existing) {
      reflection.createdAt = existing.createdAt;
    }

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

initialize();
    await database.ready();

    [appState.themes, appState.content] = await Promise.all([
      loadJson("./data/themes.json"),
      loadJson("./data/content.json")
    ]);

    appState.profile = await database.get("profiles", "primary");
    appState.initialized = true;

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
    window.alert(`初期化に失敗しました：${error.message}`);
  } finally {
    window.clearTimeout(hardStop);
    window.setTimeout(() => {
      ui.splash.classList.add("is-hidden");
    }, 1850);
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
  if (appState.profile) {
    renderProfileSummary();
    ui.dialog.showModal();
  }
});

ui.reset.addEventListener("click", async () => {
  if (!window.confirm("プロフィールを削除しますか？")) {
    return;
  }

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
      ui.reflectionForm.querySelector('input[name="mood"]:checked')?.value || 3;

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
    if (existing) {
      reflection.createdAt = existing.createdAt;
    }

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

initialize();

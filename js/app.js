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
  birthYear: $("#birthYear"),
  birthMonth: $("#birthMonth"),
  birthDay: $("#birthDay"),
  blood: $("#bloodType"),
  date: $("#todayLabel"),
  greeting: $("#greeting"),
  overallStars: $("#overallStars"),
  theme: $("#themeLabel"),
  lead: $("#themeLead"),
  dailyRhythm: $("#dailyRhythm"),
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
  overallPreview: $("#overallPreview"),
  lovePreview: $("#lovePreview"),
  loveDetail: $("#loveDetail"),
  moneyPreview: $("#moneyPreview"),
  moneyDetail: $("#moneyDetail"),
  workPreview: $("#workPreview"),
  workDetail: $("#workDetail"),
  healthStars: $("#healthStars"),
  healthScore: $("#healthScore"),
  healthPreview: $("#healthPreview"),
  healthDetail: $("#healthDetail"),
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

function themeHeadline(themeId, fallbackLabel) {
  const headlines = {
    begin: "小さくはじめる一歩が、今日の流れを変えていく",
    advance: "迷いを越えて、未来へつながる一歩を進める",
    connect: "心をひらいて、大切な人とのつながりを育てる",
    express: "素直な言葉で、自分らしい気持ちを伝える",
    receive: "訪れる好意や幸運を、やわらかく受け取る",
    choose: "今の自分に本当に必要なものを、丁寧に選ぶ",
    focus: "大切な一つに心を向けて、静かに集中する",
    organize: "身の回りと気持ちを整えて、軽やかに進む",
    protect: "自分のペースと大切なものを、やさしく守る",
    rest: "頑張る手を少し休めて、心と体を回復させる",
    release: "抱えすぎたものを手放して、新しい余白をつくる",
    trust: "積み重ねてきた自分の力を、今日は信じてみる",
    enjoy: "目の前の小さな喜びを、ゆっくり味わう",
    nurture: "急がず丁寧に、これから育つものへ心を注ぐ",
    review: "立ち止まって見直し、よりよい流れへ整える",
    prepare: "次の一歩を安心して踏み出せるよう、今を備える"
  };

  return headlines[themeId] || `${fallbackLabel}ことから、今日の流れを整える`;
}

function dailyHeartLine(result) {
  const score = result.axes.overall.score;
  const index = Number.parseInt(result.dayVector.hash.slice(0, 2), 16) % 4;
  const lines = score >= 70
    ? [
        "ここまで積み重ねてきたことを、今日は信じて大丈夫です。",
        "遠慮して小さくまとまるより、自分の可能性へ心をひらいて。",
        "あなたの中にある準備は、思っている以上に整っています。",
        "うれしい予感を疑わず、今日できる一歩へ変えてみましょう。"
      ]
    : score >= 45
      ? [
          "全部を完璧にしなくて大丈夫。今の自分に合う歩幅で進みましょう。",
          "迷いがあるのは、真剣に今日を選ぼうとしている証拠です。",
          "大きな変化より、心が少し軽くなる選択を重ねて。",
          "焦らなくても大丈夫。整えた分だけ、今日の景色は変わります。"
        ]
      : [
          "思うように動けない朝もあります。今日は自分を守ることから始めて。",
          "元気を出そうとしなくて大丈夫。静かに過ごすことも立派な選択です。",
          "立ち止まる日は、後退ではありません。心と体が追いつく時間です。",
          "今日は頑張る量ではなく、自分へのやさしさを大切にして。"
        ];

  return lines[index];
}

function axisHeartLine(axis, score) {
  const level = score >= 65 ? "high" : score >= 40 ? "middle" : "low";
  const lines = {
    overall: {
      high: "あなたが選んできた道に、今日は追い風が重なります。",
      middle: "少し迷っても大丈夫。整えながら進むことが、今日の正解です。",
      low: "うまく進めない自分を責めないで。守る選択にも意味があります。"
    },
    love: {
      high: "誰かを大切に思う気持ちは、言葉にしたとき初めて相手へ届きます。",
      middle: "近づきたい気持ちと、自分を守りたい気持ち。どちらも本音で大丈夫です。",
      low: "相手の反応で、あなたの価値が決まるわけではありません。"
    },
    money: {
      high: "豊かさは増やすことだけでなく、納得して使えることにも宿ります。",
      middle: "お金の不安は、見えないままのときほど大きく感じるものです。",
      low: "今の数字だけで、これまでの努力まで否定しなくて大丈夫です。"
    },
    work: {
      high: "積み重ねてきた力を、今日は形にして見せられる日です。",
      middle: "頑張っている人ほど、まだ足りないと感じてしまうものです。",
      low: "仕事が進まない日にも、あなた自身の価値は変わりません。"
    },
    health: {
      high: "心と体の軽やかさを、今日の心地よい習慣につなげましょう。",
      middle: "小さな休息を選ぶことも、元気を保つ大切な行動です。",
      low: "調子が出ない日は、回復を優先するだけで十分です。"
    }
  };

  return lines[axis][level];
}

function axisDetailSections(axis, result) {
  const score = result.axes[axis].score;
  const base = result.content.axisMessages[axis];
  const luckyTime = result.content.luckyTime;
  const luckyColor = result.content.luckyColor.label;

  const plans = {
    overall: {
      action:
        `今日の判断基準は「${result.content.key}」です。` +
        `最初の具体的な一歩として「${result.content.action}」を実行すると、残りの予定も整いやすくなります。`,
      timing:
        `${luckyTime}は、予定の見直しや大切な判断に向く時間です。` +
        `${luckyColor}を目に入る場所へ置くと、焦ったときに自分のペースを思い出せます。`,
      caution:
        `迷ったときは「${result.content.promise}」を思い出してください。` +
        "人の速度に合わせすぎず、今日できる範囲を終えれば十分です。"
    },
    love: {
      action: score >= 60
        ? "好意や感謝は、短くても言葉にして伝えてください。相手の話を最後まで聞いてから自分の気持ちを返すと、自然な距離の縮まり方になります。"
        : "返事の速さや言葉の一部だけで結論を出さず、まず相手の状況を想像してください。連絡するなら、答えを求めすぎない明るい一言が適しています。",
      timing:
        `${luckyTime}の連絡や会話は、落ち着いた雰囲気を作りやすいでしょう。` +
        `${luckyColor}を服や小物に少し取り入れると、柔らかな印象を助けます。`,
      caution:
        "遠慮して本音を隠しすぎることと、寂しさから相手を試すことは避けてください。大切なのは、分かってもらう前に自分から穏やかに伝えることです。"
    },
    money: {
      action: score >= 60
        ? "必要な買い物や手続きは進めて構いません。ただし購入前に価格・利用頻度・保管場所の3点を確認すると、満足度の高い選択になります。"
        : "今日は大きな買い物を即決せず、欲しい物を一度メモへ移してください。固定費や残高を一項目だけ確認することが、無理のない立て直しにつながります。",
      timing:
        `${luckyTime}に財布・口座・今週の予定支出を5分だけ確認してください。` +
        `${luckyColor}の印を必要な支払いメモへ付けると、優先順位が見やすくなります。`,
      caution:
        "気分転換のための衝動買いと、安さだけを理由にしたまとめ買いに注意してください。金額の大小より、買った後に本当に使うかを基準にしましょう。"
    },
    work: {
      action: score >= 60
        ? "始業後の15分で、今日終えることを三つ以内に絞ってください。重要な連絡や判断を先に済ませると、その後の作業へ集中しやすくなります。"
        : "難しい仕事を抱え込まず、作業を15分単位まで小さく分けてください。不明点は早めに一つだけ質問し、手戻りを防ぐことが今日の成果になります。",
      timing:
        `${luckyTime}は集中作業、確認、相談のいずれか一つへ充てると効果的です。` +
        `${luckyColor}の付箋や目印を最優先の仕事に使ってください。`,
      caution:
        "急な依頼をすべて引き受けず、期限と優先順位を確認してから返事をしてください。完成度を上げ続けるより、必要な品質で一度共有する方が前進します。"
    },
    health: {
      action: score >= 60
        ? "気持ちよく体を動かせる日です。朝か昼に5分だけ歩く、伸ばす、深呼吸するのどれか一つを選んでください。"
        : "頑張って運動するより、温かい飲み物と短い休憩を優先してください。肩や首をゆっくり回すだけでも十分です。",
      timing:
        `${luckyTime}に一度画面から目を離し、姿勢と呼吸を整えてください。` +
        `${luckyColor}を目に入る場所へ置くと、休憩の合図にできます。`,
      caution:
        "占いの点数だけで体調を決めつけず、実際の体の声を優先してください。つらい症状がある場合は無理をせず、必要な休息や専門家への相談を選びましょう。"
    }
  };

  return [
    ["今日の流れ", `${axisHeartLine(axis, score)} ${base}`],
    ["具体的な行動", plans[axis].action],
    ["おすすめの時間と色", plans[axis].timing],
    ["気をつけること", plans[axis].caution]
  ];
}

function renderAxisDetail(axis, result) {
  ui[`${axis}Preview`].textContent = result.content.axisMessages[axis];
  ui[`${axis}Detail`].replaceChildren(
    ...axisDetailSections(axis, result).map(([label, text]) => {
      const paragraph = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = label;
      paragraph.append(strong, document.createElement("br"), text);
      return paragraph;
    })
  );
}

function appendOption(select, value, label) {
  const option = document.createElement("option");
  option.value = String(value);
  option.textContent = label;
  select.append(option);
}

function updateBirthDayOptions() {
  const previousDay = Number.parseInt(ui.birthDay.value, 10);
  const year = Number.parseInt(ui.birthYear.value, 10);
  const month = Number.parseInt(ui.birthMonth.value, 10);

  ui.birthDay.replaceChildren(new Option("日", ""));

  if (!year || !month) {
    ui.birthDay.disabled = true;
    return;
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  for (let day = 1; day <= daysInMonth; day += 1) {
    appendOption(ui.birthDay, day, `${day}日`);
  }

  ui.birthDay.disabled = false;
  if (previousDay && previousDay <= daysInMonth) {
    ui.birthDay.value = String(previousDay);
  }
}

function initializeBirthDateSelectors() {
  const currentYear = new Date().getFullYear();

  for (let year = currentYear; year >= 1900; year -= 1) {
    appendOption(ui.birthYear, year, `${year}年`);
  }

  for (let month = 1; month <= 12; month += 1) {
    appendOption(ui.birthMonth, month, `${month}月`);
  }

  ui.birthYear.addEventListener("change", updateBirthDayOptions);
  ui.birthMonth.addEventListener("change", updateBirthDayOptions);
}

function getBirthDate() {
  const year = ui.birthYear.value;
  const month = ui.birthMonth.value.padStart(2, "0");
  const day = ui.birthDay.value.padStart(2, "0");

  if (!year || !ui.birthMonth.value || !ui.birthDay.value) return "";

  const birthDate = `${year}-${month}-${day}`;
  if (birthDate > toLocalDateKey()) {
    throw new Error("未来の生年月日は登録できません。");
  }
  return birthDate;
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
  ui.theme.textContent = themeHeadline(result.themeId, result.themeLabel);
  ui.lead.textContent = dailyHeartLine(result);
  ui.overallScore.textContent = `${result.axes.overall.score} / 100`;

  for (const axis of ["love", "money", "work", "health"]) {
    ui[`${axis}Stars`].textContent = starText(result.axes[axis].stars);
    ui[`${axis}Score`].textContent = `${result.axes[axis].score}点`;
  }

  ui.key.textContent = result.content.key;
  ui.action.textContent = result.content.action;
  ui.promise.textContent = result.content.promise;
  ui.luckyColor.textContent = result.content.luckyColor.label;
  ui.luckyTime.textContent = result.content.luckyTime;
  ui.overallPreview.textContent = result.content.dailyFortune;
  ui.dailyRhythm.textContent = result.content.dailyRhythm;
  for (const axis of ["love", "money", "work", "health"]) {
    renderAxisDetail(axis, result);
  }

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
      birthDate: getBirthDate(),
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
  updateBirthDayOptions();
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

const fortuneScoreCards = [...document.querySelectorAll("details.fortune-score")];
const secondaryFortuneCards = fortuneScoreCards.filter(
  card => card.parentElement?.classList.contains("fortune-score-grid")
);

function restoreSecondaryFortuneOrder() {
  const grid = document.querySelector(".fortune-score-grid");
  if (!grid) return;
  secondaryFortuneCards.forEach(card => grid.append(card));
}

fortuneScoreCards.forEach(card => {
  card.addEventListener("toggle", () => {
    if (!card.open) {
      if (!secondaryFortuneCards.some(item => item.open)) {
        restoreSecondaryFortuneOrder();
      }
      return;
    }

    fortuneScoreCards.forEach(other => {
      if (other !== card) other.open = false;
    });

    if (secondaryFortuneCards.includes(card)) {
      card.parentElement.prepend(card);
    }
  });

  card.addEventListener("click", event => {
    if (card.open && !event.target.closest("summary")) {
      card.open = false;
      card.querySelector("summary")?.focus({ preventScroll: true });
    }
  });
});

async function initialize() {
  const splashStartedAt = performance.now();

  initializeBirthDateSelectors();

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
    const reducedMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elapsed = performance.now() - splashStartedAt;
    const remaining = reducedMotion ? 0 : Math.max(0, 2250 - elapsed);

    window.setTimeout(() => {
      ui.splash.classList.add("is-hidden");
      window.clearTimeout(hardStop);
    }, remaining);
  }
}

initialize();

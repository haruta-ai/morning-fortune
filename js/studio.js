import { APP_CONFIG } from "./config.js";
import { database } from "./database.js";
import { validateBackup } from "./models.js";
import {
  downloadJson,
  readJsonFile,
  toLocalDateKey
} from "./utils.js";

const $ = selector => document.querySelector(selector);

const ui = {
  morningCount: $("#morningCount"),
  reflectionCount: $("#reflectionCount"),
  streakCount: $("#streakCount"),
  promiseRate: $("#promiseRate"),
  resultCountBadge: $("#resultCountBadge"),
  starDistribution: $("#starDistribution"),
  themeDistribution: $("#themeDistribution"),
  morningDays: $("#morningDays"),
  nightDays: $("#nightDays"),
  completionRate: $("#completionRate"),
  averageMood: $("#averageMood"),
  noteRate: $("#noteRate"),
  latestReflection: $("#latestReflection"),
  diagnostics: $("#diagnostics"),
  refresh: $("#refreshDiagnostics"),
  exportButton: $("#exportButton"),
  importInput: $("#importInput"),
  message: $("#studioMessage")
};

function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function uniqueDateKeys(rows) {
  return [...new Set(rows.map(row => row.dateKey).filter(Boolean))];
}

function calculateCurrentStreak(dateKeys) {
  if (!dateKeys.length) return 0;

  const sorted = [...new Set(dateKeys)]
    .map(key => new Date(`${key}T00:00:00`))
    .filter(date => !Number.isNaN(date.getTime()))
    .sort((a, b) => b - a);

  if (!sorted.length) return 0;

  let streak = 1;

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    const difference = Math.round((previous - current) / 86400000);

    if (difference === 1) {
      streak += 1;
      continue;
    }

    if (difference > 1) break;
  }

  return streak;
}

function createBarRow(label, value, total, suffix = "日") {
  const row = document.createElement("div");
  row.className = "analytics-bar-row";

  const top = document.createElement("div");
  top.className = "analytics-bar-top";

  const labelElement = document.createElement("span");
  labelElement.textContent = label;

  const valueElement = document.createElement("strong");
  valueElement.textContent = `${value}${suffix}`;

  const track = document.createElement("div");
  track.className = "analytics-bar-track";

  const fill = document.createElement("div");
  fill.className = "analytics-bar-fill";
  fill.style.width = `${percent(value, total)}%`;

  top.append(labelElement, valueElement);
  track.append(fill);
  row.append(top, track);

  return row;
}

function renderStarDistribution(results) {
  const counts = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  };

  for (const result of results) {
    const stars = result?.axes?.overall?.stars;
    if (counts[stars] !== undefined) counts[stars] += 1;
  }

  ui.starDistribution.replaceChildren(
    ...[5, 4, 3, 2, 1].map(stars =>
      createBarRow(
        `${"★".repeat(stars)}${"☆".repeat(5 - stars)}`,
        counts[stars],
        results.length
      )
    )
  );
}

function renderThemeDistribution(results) {
  const counts = new Map();

  for (const result of results) {
    const label = result.themeLabel || "未設定";
    counts.set(label, (counts.get(label) || 0) + 1);
  }

  const ranking = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (!ranking.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "まだテーマ履歴がありません。";
    ui.themeDistribution.replaceChildren(empty);
    return;
  }

  const max = ranking[0][1];

  ui.themeDistribution.replaceChildren(
    ...ranking.map(([label, count], index) => {
      const row = createBarRow(
        `${index + 1}. ${label}`,
        count,
        max,
        "回"
      );
      row.classList.add("theme-ranking-row");
      return row;
    })
  );
}

function renderReflectionStats(reflections) {
  if (!reflections.length) {
    ui.averageMood.textContent = "—";
    ui.noteRate.textContent = "0%";
    ui.latestReflection.textContent = "未記録";
    return;
  }

  const moodTotal = reflections.reduce(
    (sum, reflection) => sum + Number(reflection.mood || 0),
    0
  );

  const noteCount = reflections.filter(
    reflection => String(reflection.note || "").trim().length > 0
  ).length;

  const latest = [...reflections].sort((a, b) =>
    String(b.updatedAt || b.createdAt || "").localeCompare(
      String(a.updatedAt || a.createdAt || "")
    )
  )[0];

  ui.averageMood.textContent =
    `${(moodTotal / reflections.length).toFixed(1)} / 5`;
  ui.noteRate.textContent = `${percent(noteCount, reflections.length)}%`;
  ui.latestReflection.textContent = latest?.dateKey || "未記録";
}

function renderSummary(results, reflections, events) {
  const morningDateKeys = uniqueDateKeys(results);
  const reflectionDateKeys = uniqueDateKeys(reflections);

  const promiseDone = reflections.filter(
    reflection => reflection.fulfilled
  ).length;

  ui.morningCount.textContent = String(results.length);
  ui.reflectionCount.textContent = String(reflections.length);
  ui.streakCount.textContent = String(
    calculateCurrentStreak(morningDateKeys)
  );
  ui.promiseRate.textContent =
    `${percent(promiseDone, reflections.length)}%`;

  ui.resultCountBadge.textContent =
    `${results.length} ${results.length === 1 ? "DAY" : "DAYS"}`;

  ui.morningDays.textContent = `${morningDateKeys.length}日`;
  ui.nightDays.textContent = `${reflectionDateKeys.length}日`;
  ui.completionRate.textContent =
    `${percent(reflectionDateKeys.length, morningDateKeys.length)}%`;

  renderStarDistribution(results);
  renderThemeDistribution(results);
  renderReflectionStats(reflections);

  return {
    morningDateKeys,
    reflectionDateKeys,
    promiseDone,
    eventCount: events.length
  };
}

function renderDiagnostics(rows) {
  ui.diagnostics.replaceChildren(
    ...rows.map(([label, value]) => {
      const row = document.createElement("div");
      row.className = "diagnostic-row";

      const labelElement = document.createElement("span");
      labelElement.textContent = label;

      const valueElement = document.createElement("strong");
      valueElement.textContent = value;

      row.append(labelElement, valueElement);
      return row;
    })
  );
}

async function renderAnalytics() {
  ui.message.textContent = "";

  try {
    await database.ready();

    const [
      profiles,
      results,
      reflections,
      events,
      contentItems,
      themes
    ] = await Promise.all([
      database.getAll("profiles"),
      database.getAll("dailyResults"),
      database.getAll("reflections"),
      database.getAll("analyticsEvents"),
      database.getAll("contentItems"),
      database.getAll("themes")
    ]);

    const summary = renderSummary(results, reflections, events);

    renderDiagnostics([
      ["IndexedDB", "正常"],
      ["プロフィール", `${profiles.length}件`],
      ["占い結果", `${results.length}件`],
      ["振り返り", `${reflections.length}件`],
      ["分析イベント", `${events.length}件`],
      ["朝の記録日", `${summary.morningDateKeys.length}日`],
      ["夜の記録日", `${summary.reflectionDateKeys.length}日`],
      ["Studioテーマ", `${themes.length}件`],
      ["Studio文章", `${contentItems.length}件`],
      ["App Version", APP_CONFIG.appVersion],
      ["Engine Version", APP_CONFIG.engineVersion],
      ["Content Version", APP_CONFIG.contentVersion]
    ]);
  } catch (error) {
    console.error(error);
    renderDiagnostics([
      ["IndexedDB", `エラー：${error.message}`]
    ]);
    ui.message.textContent =
      "分析データを読み込めませんでした。";
  }
}

ui.refresh.addEventListener("click", renderAnalytics);

ui.exportButton.addEventListener("click", async () => {
  try {
    const data = await database.exportAll();

    downloadJson(
      `every-morning-fortune-backup-${toLocalDateKey()}.json`,
      {
        format: "every-morning-fortune-backup",
        version: 1,
        exportedAt: new Date().toISOString(),
        appVersion: APP_CONFIG.appVersion,
        data
      }
    );

    ui.message.textContent =
      "JSONバックアップを書き出しました。";
  } catch (error) {
    ui.message.textContent =
      `書き出しに失敗しました：${error.message}`;
  }
});

ui.importInput.addEventListener("change", async () => {
  const [file] = ui.importInput.files;
  if (!file) return;

  try {
    const payload = await readJsonFile(file);
    validateBackup(payload);
    await database.importAll(payload.data);

    ui.message.textContent =
      "バックアップを復元しました。";
    await renderAnalytics();
  } catch (error) {
    ui.message.textContent =
      `読み込みに失敗しました：${error.message}`;
  } finally {
    ui.importInput.value = "";
  }
});

renderAnalytics();

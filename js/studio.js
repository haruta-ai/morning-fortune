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
  message: $("#studioMessage"),
  qualityStatusBadge: $("#qualityStatusBadge"),
  qualityScore: $("#qualityScore"),
  qualitySummary: $("#qualitySummary"),
  duplicateCount: $("#duplicateCount"),
  shortTextCount: $("#shortTextCount"),
  longTextCount: $("#longTextCount"),
  missingThemeCount: $("#missingThemeCount"),
  qualityIssues: $("#qualityIssues"),
  qualityBreakdown: $("#qualityBreakdown"),
  duplicateList: $("#duplicateList")
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


function normalizeText(text) {
  return String(text || "")
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/[。、！？!?「」『』（）()・…]/g, "")
    .toLowerCase();
}

function bigrams(text) {
  const normalized = normalizeText(text);
  const set = new Set();

  for (let index = 0; index < normalized.length - 1; index += 1) {
    set.add(normalized.slice(index, index + 2));
  }

  return set;
}

function similarity(a, b) {
  const setA = bigrams(a);
  const setB = bigrams(b);

  if (!setA.size || !setB.size) return 0;

  let overlap = 0;
  for (const item of setA) {
    if (setB.has(item)) overlap += 1;
  }

  return (2 * overlap) / (setA.size + setB.size);
}

function flattenContent(content) {
  const rows = [];

  for (const [themeId, variants] of Object.entries(content || {})) {
    const list = Array.isArray(variants) ? variants : [variants];

    for (const item of list) {
      rows.push({
        themeId,
        id: item.id || `${themeId}-unknown`,
        season: item.season || "未設定",
        lead: String(item.lead || ""),
        key: String(item.key || ""),
        promise: String(item.promise || ""),
        action: String(item.action || ""),
        nightPrompt: String(item.nightPrompt || "")
      });
    }
  }

  return rows;
}

function findDuplicates(rows) {
  const fields = ["lead", "key", "promise", "action", "nightPrompt"];
  const exactGroups = [];
  const similarPairs = [];

  for (const field of fields) {
    const groups = new Map();

    for (const row of rows) {
      const normalized = normalizeText(row[field]);
      if (!normalized) continue;

      if (!groups.has(normalized)) {
        groups.set(normalized, {
          type: "exact",
          field,
          text: row[field],
          items: []
        });
      }

      groups.get(normalized).items.push({
        id: row.id,
        themeId: row.themeId,
        season: row.season
      });
    }

    for (const group of groups.values()) {
      if (group.items.length >= 2) {
        exactGroups.push({
          ...group,
          score: 1
        });
      }
    }

    const uniqueRows = [];
    const seenTexts = new Set();

    for (const row of rows) {
      const normalized = normalizeText(row[field]);
      if (!normalized || seenTexts.has(normalized)) continue;
      seenTexts.add(normalized);
      uniqueRows.push(row);
    }

    for (let i = 0; i < uniqueRows.length; i += 1) {
      for (let j = i + 1; j < uniqueRows.length; j += 1) {
        const left = uniqueRows[i];
        const right = uniqueRows[j];
        const score = similarity(left[field], right[field]);

        if (score >= 0.84 && score < 1) {
          similarPairs.push({
            type: "similar",
            field,
            score,
            left,
            right
          });
        }
      }
    }
  }

  exactGroups.sort((a, b) =>
    b.items.length - a.items.length ||
    a.field.localeCompare(b.field)
  );

  similarPairs.sort((a, b) => b.score - a.score);

  return [...exactGroups, ...similarPairs];
}

function evaluateQuality(content, themes) {
  const rows = flattenContent(content);
  const duplicates = findDuplicates(rows);

  const shortTexts = [];
  const longTexts = [];

  const lengthRules = {
    lead: { min: 18, max: 80 },
    key: { min: 8, max: 40 },
    promise: { min: 10, max: 46 },
    action: { min: 10, max: 46 },
    nightPrompt: { min: 12, max: 60 }
  };

  for (const row of rows) {
    for (const [field, rule] of Object.entries(lengthRules)) {
      const length = [...row[field]].length;

      if (length < rule.min) {
        shortTexts.push({ ...row, field, length });
      }

      if (length > rule.max) {
        longTexts.push({ ...row, field, length });
      }
    }
  }

  const expectedThemeIds = new Set(themes.map(theme => theme.id));
  const actualThemeIds = new Set(rows.map(row => row.themeId));
  const missingThemes = [...expectedThemeIds].filter(
    id => !actualThemeIds.has(id)
  );

  const themeCounts = {};
  const seasonCounts = {};

  for (const row of rows) {
    themeCounts[row.themeId] = (themeCounts[row.themeId] || 0) + 1;
    seasonCounts[row.season] = (seasonCounts[row.season] || 0) + 1;
  }

  const expectedPerTheme = rows.length && expectedThemeIds.size
    ? rows.length / expectedThemeIds.size
    : 0;

  const themeImbalance = Object.values(themeCounts).filter(
    count => expectedPerTheme && Math.abs(count - expectedPerTheme) > 1
  ).length;

  const uniqueExact = new Set(
    rows.flatMap(row => [
      normalizeText(row.lead),
      normalizeText(row.key),
      normalizeText(row.promise),
      normalizeText(row.action),
      normalizeText(row.nightPrompt)
    ])
  );

  const totalTexts = rows.length * 5;
  const exactDuplicateCount = Math.max(0, totalTexts - uniqueExact.size);

  const duplicatePenalty = Math.min(25, duplicates.length * 2);
  const lengthPenalty = Math.min(
    20,
    shortTexts.length + longTexts.length
  );
  const themePenalty = Math.min(
    20,
    missingThemes.length * 8 + themeImbalance * 3
  );

  const requiredSeasons = ["spring", "summer", "autumn", "winter"];
  const missingSeasons = requiredSeasons.filter(
    season => !seasonCounts[season]
  );
  const seasonPenalty = Math.min(15, missingSeasons.length * 4);
  const exactPenalty = Math.min(20, exactDuplicateCount * 2);

  const score = Math.max(
    0,
    Math.round(
      100 -
      duplicatePenalty -
      lengthPenalty -
      themePenalty -
      seasonPenalty -
      exactPenalty
    )
  );

  const breakdown = {
    uniqueness: Math.max(0, 100 - duplicatePenalty - exactPenalty),
    readability: Math.max(0, 100 - lengthPenalty * 3),
    themeBalance: Math.max(0, 100 - themePenalty * 4),
    seasonBalance: Math.max(0, 100 - seasonPenalty * 5)
  };

  return {
    rows,
    duplicates,
    shortTexts,
    longTexts,
    missingThemes,
    missingSeasons,
    themeCounts,
    seasonCounts,
    exactDuplicateCount,
    score,
    breakdown
  };
}

function renderQualityIssues(report) {
  const issues = [];

  if (report.duplicates.length) {
    issues.push({
      level: "warning",
      title: "類似文章があります",
      detail: `${report.duplicates.length}組を確認してください。`
    });
  }

  if (report.shortTexts.length) {
    issues.push({
      level: "notice",
      title: "短すぎる文章があります",
      detail: `${report.shortTexts.length}件は内容が薄く見える可能性があります。`
    });
  }

  if (report.longTexts.length) {
    issues.push({
      level: "notice",
      title: "長すぎる文章があります",
      detail: `${report.longTexts.length}件は朝30秒体験を圧迫する可能性があります。`
    });
  }

  if (report.missingThemes.length) {
    issues.push({
      level: "danger",
      title: "テーマ不足があります",
      detail: report.missingThemes.join("、")
    });
  }

  if (report.missingSeasons.length) {
    issues.push({
      level: "danger",
      title: "季節コンテンツが不足しています",
      detail: report.missingSeasons.join("、")
    });
  }

  if (!issues.length) {
    issues.push({
      level: "good",
      title: "大きな問題は見つかりませんでした",
      detail: "現在のコンテンツ構成は良好です。"
    });
  }

  ui.qualityIssues.replaceChildren(
    ...issues.map(issue => {
      const article = document.createElement("article");
      article.className = `quality-issue quality-issue--${issue.level}`;

      const title = document.createElement("strong");
      title.textContent = issue.title;

      const detail = document.createElement("p");
      detail.textContent = issue.detail;

      article.append(title, detail);
      return article;
    })
  );
}

function renderQualityBreakdown(report) {
  const labels = {
    uniqueness: "文章の独自性",
    readability: "読みやすさ",
    themeBalance: "テーマ均衡",
    seasonBalance: "季節均衡"
  };

  ui.qualityBreakdown.replaceChildren(
    ...Object.entries(report.breakdown).map(([key, value]) =>
      createBarRow(labels[key], value, 100, "点")
    )
  );
}

function renderDuplicateList(report) {
  if (!report.duplicates.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "類似度84%以上の文章は見つかりませんでした。";
    ui.duplicateList.replaceChildren(empty);
    return;
  }

  ui.duplicateList.replaceChildren(
    ...report.duplicates.slice(0, 30).map(item => {
      const article = document.createElement("article");
      article.className = "duplicate-card";

      const header = document.createElement("div");
      header.className = "duplicate-card__header";

      const title = document.createElement("strong");
      const meta = document.createElement("span");

      if (item.type === "exact") {
        title.textContent =
          `${item.field}・完全一致・${item.items.length}件で使用`;

        meta.textContent = item.items
          .map(entry => entry.id)
          .join("、");

        const text = document.createElement("p");
        text.textContent = item.text;

        header.append(title, meta);
        article.append(header, text);
        return article;
      }

      title.textContent =
        `${item.field}・類似度${Math.round(item.score * 100)}%`;

      meta.textContent = `${item.left.id} ↔ ${item.right.id}`;

      const left = document.createElement("p");
      left.textContent = item.left[item.field];

      const right = document.createElement("p");
      right.textContent = item.right[item.field];

      header.append(title, meta);
      article.append(header, left, right);
      return article;
    })
  );
}

function renderQualityReport(report) {
  ui.qualityScore.textContent = String(report.score);

  const status =
    report.score >= 90 ? "良好" :
    report.score >= 75 ? "要確認" :
    report.score >= 60 ? "改善推奨" :
    "要修正";

  ui.qualityStatusBadge.textContent = status;
  ui.qualityStatusBadge.dataset.status = status;

  ui.qualitySummary.textContent =
    `全${report.rows.length}件を検査しました。` +
    `重複・類似候補${report.duplicates.length}グループ、` +
    `文字数注意${report.shortTexts.length + report.longTexts.length}件です。`;

  ui.duplicateCount.textContent = `${report.duplicates.length}グループ`;
  ui.shortTextCount.textContent = `${report.shortTexts.length}件`;
  ui.longTextCount.textContent = `${report.longTexts.length}件`;
  ui.missingThemeCount.textContent = `${report.missingThemes.length}件`;

  renderQualityIssues(report);
  renderQualityBreakdown(report);
  renderDuplicateList(report);
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
      themes,
      sourceThemes,
      sourceContent
    ] = await Promise.all([
      database.getAll("profiles"),
      database.getAll("dailyResults"),
      database.getAll("reflections"),
      database.getAll("analyticsEvents"),
      database.getAll("contentItems"),
      database.getAll("themes"),
      fetch("./data/themes.json", { cache: "no-store" }).then(response => response.json()),
      fetch("./data/content.json", { cache: "no-store" }).then(response => response.json())
    ]);

    const summary = renderSummary(results, reflections, events);
    const qualityReport = evaluateQuality(sourceContent, sourceThemes);
    renderQualityReport(qualityReport);

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

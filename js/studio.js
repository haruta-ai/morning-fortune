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
  duplicateList: $("#duplicateList"),
  editorStatusBadge: $("#editorStatusBadge"),
  editorThemeSelect: $("#editorThemeSelect"),
  editorSeasonSelect: $("#editorSeasonSelect"),
  editorVariantSelect: $("#editorVariantSelect"),
  contentEditorForm: $("#contentEditorForm"),
  editorLead: $("#editorLead"),
  editorKey: $("#editorKey"),
  editorPromise: $("#editorPromise"),
  editorAction: $("#editorAction"),
  editorNightPrompt: $("#editorNightPrompt"),
  editorLeadCount: $("#editorLeadCount"),
  editorKeyCount: $("#editorKeyCount"),
  editorPromiseCount: $("#editorPromiseCount"),
  editorActionCount: $("#editorActionCount"),
  editorNightPromptCount: $("#editorNightPromptCount"),
  resetEditorButton: $("#resetEditorButton"),
  editorMessage: $("#editorMessage"),
  previewTheme: $("#previewTheme"),
  previewLead: $("#previewLead"),
  previewKey: $("#previewKey"),
  previewPromise: $("#previewPromise"),
  previewAction: $("#previewAction"),
  previewNightPrompt: $("#previewNightPrompt"),
  exportEditedContentButton: $("#exportEditedContentButton"),
  exportPublishedContentButton: $("#exportPublishedContentButton"),
  importEditedContentInput: $("#importEditedContentInput"),
  editorSearchInput: $("#editorSearchInput"),
  editorIssueSelect: $("#editorIssueSelect"),
  clearEditorSearchButton: $("#clearEditorSearchButton"),
  editorHistoryList: $("#editorHistoryList"),
  clearEditorHistoryButton: $("#clearEditorHistoryButton")
};

const editorState = {
  themes: [],
  sourceContent: {},
  workingContent: {},
  selectedThemeId: "",
  selectedSeason: "spring",
  selectedVariantId: "",
  lastQualityReport: null,
  history: []
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

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




function loadEditorHistory() {
  try {
    editorState.history = JSON.parse(localStorage.getItem("emf-editor-history") || "[]");
  } catch {
    editorState.history = [];
  }
}

function saveEditorHistory() {
  localStorage.setItem("emf-editor-history", JSON.stringify(editorState.history.slice(0, 50)));
}

function renderEditorHistory() {
  if (!editorState.history.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "編集履歴はまだありません。";
    ui.editorHistoryList.replaceChildren(empty);
    return;
  }

  ui.editorHistoryList.replaceChildren(
    ...editorState.history.map(entry => {
      const article = document.createElement("article");
      article.className = "editor-history-item";

      const top = document.createElement("div");
      top.className = "editor-history-item__top";

      const title = document.createElement("strong");
      title.textContent = `${entry.themeLabel}・${entry.variantId}`;

      const time = document.createElement("time");
      time.textContent = new Date(entry.createdAt).toLocaleString("ja-JP");

      const detail = document.createElement("p");
      detail.textContent = entry.summary;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "text-button";
      button.textContent = "この項目を開く";
      button.addEventListener("click", () => {
        if (entry.themeId && entry.variantId) jumpToEditorItem(entry.themeId, entry.variantId);
      });

      top.append(title, time);
      article.append(top, detail, button);
      return article;
    })
  );
}

function addEditorHistory(entry) {
  editorState.history.unshift({ createdAt: new Date().toISOString(), ...entry });
  editorState.history = editorState.history.slice(0, 50);
  saveEditorHistory();
  renderEditorHistory();
}

function jumpToEditorItem(themeId, variantId) {
  const target = getThemeVariants(themeId).find(item => item.id === variantId);
  if (!target) return;

  editorState.selectedThemeId = themeId;
  editorState.selectedSeason = target.season;
  editorState.selectedVariantId = variantId;
  ui.editorThemeSelect.value = themeId;
  ui.editorSeasonSelect.value = target.season;
  populateVariantSelect();

  document.querySelector(".content-editor-card")?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

async function loadSavedEditorOverrides() {
  const savedItems = await database.getAll("contentItems");

  for (const saved of savedItems) {
    const target = (editorState.workingContent[saved.themeId] || [])
      .find(item => item.id === saved.id);
    if (!target) continue;

    for (const field of ["season", "lead", "key", "promise", "action", "nightPrompt"]) {
      if (saved[field] !== undefined) target[field] = saved[field];
    }
  }
}

function getProblemItemIds() {
  const report = editorState.lastQualityReport;
  const mode = ui.editorIssueSelect.value;
  const ids = new Set();

  if (!report || !mode) return ids;

  if (mode === "duplicate") {
    for (const item of report.duplicates) {
      if (item.type === "exact") {
        item.items.forEach(entry => ids.add(entry.id));
      } else {
        ids.add(item.left.id);
        ids.add(item.right.id);
      }
    }
  }

  if (mode === "short") report.shortTexts.forEach(item => ids.add(item.id));
  if (mode === "long") report.longTexts.forEach(item => ids.add(item.id));

  return ids;
}

function applyEditorSearch() {
  const query = normalizeText(ui.editorSearchInput.value);
  const mode = ui.editorIssueSelect.value;
  const problemIds = getProblemItemIds();
  const matches = [];

  for (const [themeId, variants] of Object.entries(editorState.workingContent)) {
    const themeLabel = getThemeLabel(themeId);

    for (const item of variants) {
      const text = normalizeText([
        item.id, themeId, themeLabel, item.season,
        item.lead, item.key, item.promise, item.action, item.nightPrompt
      ].join(" "));

      if ((!query || text.includes(query)) && (!mode || problemIds.has(item.id))) {
        matches.push({ themeId, item });
      }
    }
  }

  if (!query && !mode) {
    ui.editorMessage.textContent = "";
    return;
  }

  if (!matches.length) {
    ui.editorMessage.textContent = "条件に一致する項目はありません。";
    return;
  }

  jumpToEditorItem(matches[0].themeId, matches[0].item.id);
  ui.editorMessage.textContent =
    `${matches.length}件見つかりました。最初の項目を表示しています。`;
}

function buildPublishedContent() {
  return clone(editorState.workingContent);
}

function getThemeLabel(themeId) {
  return editorState.themes.find(theme => theme.id === themeId)?.label || themeId;
}

function getThemeVariants(themeId) {
  const variants = editorState.workingContent[themeId];
  return Array.isArray(variants) ? variants : [];
}

function getFilteredVariants() {
  return getThemeVariants(editorState.selectedThemeId).filter(
    item => item.season === editorState.selectedSeason
  );
}

function getSelectedVariant() {
  return getThemeVariants(editorState.selectedThemeId).find(
    item => item.id === editorState.selectedVariantId
  ) || null;
}

function updateCharacterCount(input, counter) {
  counter.textContent = `${[...input.value].length} / ${input.maxLength}`;
}

function updateAllCharacterCounts() {
  updateCharacterCount(ui.editorLead, ui.editorLeadCount);
  updateCharacterCount(ui.editorKey, ui.editorKeyCount);
  updateCharacterCount(ui.editorPromise, ui.editorPromiseCount);
  updateCharacterCount(ui.editorAction, ui.editorActionCount);
  updateCharacterCount(ui.editorNightPrompt, ui.editorNightPromptCount);
}

function updateEditorPreview() {
  ui.previewTheme.textContent = getThemeLabel(editorState.selectedThemeId);
  ui.previewLead.textContent = ui.editorLead.value || "朝の文章を入力してください。";
  ui.previewKey.textContent = ui.editorKey.value || "未入力";
  ui.previewPromise.textContent = ui.editorPromise.value || "未入力";
  ui.previewAction.textContent = ui.editorAction.value || "未入力";
  ui.previewNightPrompt.textContent =
    ui.editorNightPrompt.value || "夜の振り返り文を入力してください。";

  updateAllCharacterCounts();
}

function renderEditorForm() {
  const item = getSelectedVariant();

  if (!item) {
    ui.contentEditorForm.reset();
    ui.editorStatusBadge.textContent = "未選択";
    updateEditorPreview();
    return;
  }

  ui.editorLead.value = item.lead || "";
  ui.editorKey.value = item.key || "";
  ui.editorPromise.value = item.promise || "";
  ui.editorAction.value = item.action || "";
  ui.editorNightPrompt.value = item.nightPrompt || "";

  const changed = JSON.stringify(item) !== JSON.stringify(
    (editorState.sourceContent[editorState.selectedThemeId] || []).find(
      source => source.id === item.id
    )
  );

  ui.editorStatusBadge.textContent = changed ? "編集中" : "原本";
  ui.editorStatusBadge.dataset.status = changed ? "要確認" : "良好";
  ui.editorMessage.textContent = "";
  updateEditorPreview();
}

function populateVariantSelect() {
  const variants = getFilteredVariants();

  ui.editorVariantSelect.replaceChildren(
    ...variants.map(item => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.id;
      return option;
    })
  );

  editorState.selectedVariantId =
    variants.some(item => item.id === editorState.selectedVariantId)
      ? editorState.selectedVariantId
      : variants[0]?.id || "";

  ui.editorVariantSelect.value = editorState.selectedVariantId;
  renderEditorForm();
}

async function initializeContentEditor(themes, content) {
  editorState.themes = themes;
  editorState.sourceContent = clone(content);
  editorState.workingContent = clone(content);

  await loadSavedEditorOverrides();
  loadEditorHistory();
  renderEditorHistory();

  ui.editorThemeSelect.replaceChildren(
    ...themes.map(theme => {
      const option = document.createElement("option");
      option.value = theme.id;
      option.textContent = theme.label;
      return option;
    })
  );

  editorState.selectedThemeId = themes[0]?.id || "";
  editorState.selectedSeason = "spring";

  ui.editorThemeSelect.value = editorState.selectedThemeId;
  ui.editorSeasonSelect.value = editorState.selectedSeason;

  populateVariantSelect();
}

function applyEditorFieldsToVariant() {
  const item = getSelectedVariant();
  if (!item) return null;

  item.lead = ui.editorLead.value.trim();
  item.key = ui.editorKey.value.trim();
  item.promise = ui.editorPromise.value.trim();
  item.action = ui.editorAction.value.trim();
  item.nightPrompt = ui.editorNightPrompt.value.trim();

  return item;
}

function validateEditorFields() {
  const fields = [
    ["朝のメイン文章", ui.editorLead.value],
    ["今日の鍵", ui.editorKey.value],
    ["今日の約束", ui.editorPromise.value],
    ["開運アクション", ui.editorAction.value],
    ["夜の振り返り文", ui.editorNightPrompt.value]
  ];

  const empty = fields.find(([, value]) => !value.trim());

  if (empty) {
    throw new Error(`${empty[0]}を入力してください。`);
  }
}

function getEditedItems() {
  const edited = [];

  for (const [themeId, variants] of Object.entries(editorState.workingContent)) {
    const sourceVariants = editorState.sourceContent[themeId] || [];

    for (const item of variants) {
      const source = sourceVariants.find(entry => entry.id === item.id);

      if (JSON.stringify(item) !== JSON.stringify(source)) {
        edited.push({
          themeId,
          ...item
        });
      }
    }
  }

  return edited;
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
  editorState.lastQualityReport = report;
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

    if (!editorState.themes.length) {
      await initializeContentEditor(sourceThemes, sourceContent);
    }

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
    await 
ui.editorThemeSelect.addEventListener("change", () => {
  editorState.selectedThemeId = ui.editorThemeSelect.value;
  populateVariantSelect();
});

ui.editorSeasonSelect.addEventListener("change", () => {
  editorState.selectedSeason = ui.editorSeasonSelect.value;
  populateVariantSelect();
});

ui.editorVariantSelect.addEventListener("change", () => {
  editorState.selectedVariantId = ui.editorVariantSelect.value;
  renderEditorForm();
});

for (const input of [
  ui.editorLead,
  ui.editorKey,
  ui.editorPromise,
  ui.editorAction,
  ui.editorNightPrompt
]) {
  input.addEventListener("input", updateEditorPreview);
}

ui.contentEditorForm.addEventListener("submit", async event => {
  event.preventDefault();

  try {
    validateEditorFields();
    const item = applyEditorFieldsToVariant();

    if (!item) {
      throw new Error("編集する文章を選択してください。");
    }

    await database.put("contentItems", {
      id: item.id,
      themeId: editorState.selectedThemeId,
      season: item.season,
      lead: item.lead,
      key: item.key,
      promise: item.promise,
      action: item.action,
      nightPrompt: item.nightPrompt,
      updatedAt: new Date().toISOString()
    });

    ui.editorStatusBadge.textContent = "保存済み";
    ui.editorStatusBadge.dataset.status = "良好";
    ui.editorMessage.textContent =
      "この端末のStudio編集データとして保存しました。";

    addEditorHistory({
      themeId: editorState.selectedThemeId,
      themeLabel: getThemeLabel(editorState.selectedThemeId),
      variantId: item.id,
      summary: "文章を編集して保存しました。"
    });

    const qualityReport = evaluateQuality(
      editorState.workingContent,
      editorState.themes
    );
    renderQualityReport(qualityReport);
  } catch (error) {
    ui.editorMessage.textContent = error.message;
  }
});

ui.resetEditorButton.addEventListener("click", () => {
  const source = (
    editorState.sourceContent[editorState.selectedThemeId] || []
  ).find(item => item.id === editorState.selectedVariantId);

  const target = getSelectedVariant();

  if (!source || !target) return;

  Object.assign(target, clone(source));
  renderEditorForm();
  ui.editorMessage.textContent = "原本の文章へ戻しました。";
});

ui.exportEditedContentButton.addEventListener("click", () => {
  const editedItems = getEditedItems();

  if (!editedItems.length) {
    ui.editorMessage.textContent =
      "書き出す編集データはまだありません。";
    return;
  }

  downloadJson(
    `every-morning-fortune-edited-content-${toLocalDateKey()}.json`,
    {
      format: "every-morning-fortune-content-edits",
      version: 1,
      appVersion: APP_CONFIG.appVersion,
      exportedAt: new Date().toISOString(),
      editedItems
    }
  );

  ui.editorMessage.textContent =
    `${editedItems.length}件の編集データを書き出しました。`;
});


ui.editorSearchInput.addEventListener("input", () => {
  window.clearTimeout(ui.editorSearchInput._timer);
  ui.editorSearchInput._timer = window.setTimeout(applyEditorSearch, 250);
});

ui.editorIssueSelect.addEventListener("change", applyEditorSearch);

ui.clearEditorSearchButton.addEventListener("click", () => {
  ui.editorSearchInput.value = "";
  ui.editorIssueSelect.value = "";
  ui.editorMessage.textContent = "";
});

ui.importEditedContentInput.addEventListener("change", async () => {
  const [file] = ui.importEditedContentInput.files;
  if (!file) return;

  try {
    const payload = await readJsonFile(file);

    if (
      payload?.format !== "every-morning-fortune-content-edits" ||
      !Array.isArray(payload.editedItems)
    ) {
      throw new Error("編集差分JSONではありません。");
    }

    let applied = 0;

    for (const edited of payload.editedItems) {
      const target = (editorState.workingContent[edited.themeId] || [])
        .find(item => item.id === edited.id);
      if (!target) continue;

      Object.assign(target, {
        season: edited.season ?? target.season,
        lead: edited.lead ?? target.lead,
        key: edited.key ?? target.key,
        promise: edited.promise ?? target.promise,
        action: edited.action ?? target.action,
        nightPrompt: edited.nightPrompt ?? target.nightPrompt
      });

      await database.put("contentItems", {
        id: target.id,
        themeId: edited.themeId,
        season: target.season,
        lead: target.lead,
        key: target.key,
        promise: target.promise,
        action: target.action,
        nightPrompt: target.nightPrompt,
        updatedAt: new Date().toISOString()
      });

      applied += 1;
    }

    renderEditorForm();
    renderQualityReport(evaluateQuality(editorState.workingContent, editorState.themes));

    addEditorHistory({
      themeId: "import",
      themeLabel: "JSON読み込み",
      variantId: `${applied}件`,
      summary: `${applied}件の編集内容を読み込みました。`
    });

    ui.editorMessage.textContent = `${applied}件の編集内容を読み込みました。`;
  } catch (error) {
    ui.editorMessage.textContent = `読み込みに失敗しました：${error.message}`;
  } finally {
    ui.importEditedContentInput.value = "";
  }
});

ui.exportPublishedContentButton.addEventListener("click", () => {
  downloadJson("content.json", buildPublishedContent());

  addEditorHistory({
    themeId: "publish",
    themeLabel: "公開用JSON",
    variantId: "content.json",
    summary: "公開用content.jsonを生成しました。"
  });

  ui.editorMessage.textContent = "公開用content.jsonを生成しました。";
});

ui.clearEditorHistoryButton.addEventListener("click", () => {
  if (!window.confirm("編集履歴を消去しますか？")) return;

  editorState.history = [];
  saveEditorHistory();
  renderEditorHistory();
  ui.editorMessage.textContent = "編集履歴を消去しました。";
});

renderAnalytics();
  } catch (error) {
    ui.message.textContent =
      `読み込みに失敗しました：${error.message}`;
  } finally {
    ui.importInput.value = "";
  }
});


ui.editorThemeSelect.addEventListener("change", () => {
  editorState.selectedThemeId = ui.editorThemeSelect.value;
  populateVariantSelect();
});

ui.editorSeasonSelect.addEventListener("change", () => {
  editorState.selectedSeason = ui.editorSeasonSelect.value;
  populateVariantSelect();
});

ui.editorVariantSelect.addEventListener("change", () => {
  editorState.selectedVariantId = ui.editorVariantSelect.value;
  renderEditorForm();
});

for (const input of [
  ui.editorLead,
  ui.editorKey,
  ui.editorPromise,
  ui.editorAction,
  ui.editorNightPrompt
]) {
  input.addEventListener("input", updateEditorPreview);
}

ui.contentEditorForm.addEventListener("submit", async event => {
  event.preventDefault();

  try {
    validateEditorFields();
    const item = applyEditorFieldsToVariant();

    if (!item) {
      throw new Error("編集する文章を選択してください。");
    }

    await database.put("contentItems", {
      id: item.id,
      themeId: editorState.selectedThemeId,
      season: item.season,
      lead: item.lead,
      key: item.key,
      promise: item.promise,
      action: item.action,
      nightPrompt: item.nightPrompt,
      updatedAt: new Date().toISOString()
    });

    ui.editorStatusBadge.textContent = "保存済み";
    ui.editorStatusBadge.dataset.status = "良好";
    ui.editorMessage.textContent =
      "この端末のStudio編集データとして保存しました。";

    addEditorHistory({
      themeId: editorState.selectedThemeId,
      themeLabel: getThemeLabel(editorState.selectedThemeId),
      variantId: item.id,
      summary: "文章を編集して保存しました。"
    });

    const qualityReport = evaluateQuality(
      editorState.workingContent,
      editorState.themes
    );
    renderQualityReport(qualityReport);
  } catch (error) {
    ui.editorMessage.textContent = error.message;
  }
});

ui.resetEditorButton.addEventListener("click", () => {
  const source = (
    editorState.sourceContent[editorState.selectedThemeId] || []
  ).find(item => item.id === editorState.selectedVariantId);

  const target = getSelectedVariant();

  if (!source || !target) return;

  Object.assign(target, clone(source));
  renderEditorForm();
  ui.editorMessage.textContent = "原本の文章へ戻しました。";
});

ui.exportEditedContentButton.addEventListener("click", () => {
  const editedItems = getEditedItems();

  if (!editedItems.length) {
    ui.editorMessage.textContent =
      "書き出す編集データはまだありません。";
    return;
  }

  downloadJson(
    `every-morning-fortune-edited-content-${toLocalDateKey()}.json`,
    {
      format: "every-morning-fortune-content-edits",
      version: 1,
      appVersion: APP_CONFIG.appVersion,
      exportedAt: new Date().toISOString(),
      editedItems
    }
  );

  ui.editorMessage.textContent =
    `${editedItems.length}件の編集データを書き出しました。`;
});


ui.editorSearchInput.addEventListener("input", () => {
  window.clearTimeout(ui.editorSearchInput._timer);
  ui.editorSearchInput._timer = window.setTimeout(applyEditorSearch, 250);
});

ui.editorIssueSelect.addEventListener("change", applyEditorSearch);

ui.clearEditorSearchButton.addEventListener("click", () => {
  ui.editorSearchInput.value = "";
  ui.editorIssueSelect.value = "";
  ui.editorMessage.textContent = "";
});

ui.importEditedContentInput.addEventListener("change", async () => {
  const [file] = ui.importEditedContentInput.files;
  if (!file) return;

  try {
    const payload = await readJsonFile(file);

    if (
      payload?.format !== "every-morning-fortune-content-edits" ||
      !Array.isArray(payload.editedItems)
    ) {
      throw new Error("編集差分JSONではありません。");
    }

    let applied = 0;

    for (const edited of payload.editedItems) {
      const target = (editorState.workingContent[edited.themeId] || [])
        .find(item => item.id === edited.id);
      if (!target) continue;

      Object.assign(target, {
        season: edited.season ?? target.season,
        lead: edited.lead ?? target.lead,
        key: edited.key ?? target.key,
        promise: edited.promise ?? target.promise,
        action: edited.action ?? target.action,
        nightPrompt: edited.nightPrompt ?? target.nightPrompt
      });

      await database.put("contentItems", {
        id: target.id,
        themeId: edited.themeId,
        season: target.season,
        lead: target.lead,
        key: target.key,
        promise: target.promise,
        action: target.action,
        nightPrompt: target.nightPrompt,
        updatedAt: new Date().toISOString()
      });

      applied += 1;
    }

    renderEditorForm();
    renderQualityReport(evaluateQuality(editorState.workingContent, editorState.themes));

    addEditorHistory({
      themeId: "import",
      themeLabel: "JSON読み込み",
      variantId: `${applied}件`,
      summary: `${applied}件の編集内容を読み込みました。`
    });

    ui.editorMessage.textContent = `${applied}件の編集内容を読み込みました。`;
  } catch (error) {
    ui.editorMessage.textContent = `読み込みに失敗しました：${error.message}`;
  } finally {
    ui.importEditedContentInput.value = "";
  }
});

ui.exportPublishedContentButton.addEventListener("click", () => {
  downloadJson("content.json", buildPublishedContent());

  addEditorHistory({
    themeId: "publish",
    themeLabel: "公開用JSON",
    variantId: "content.json",
    summary: "公開用content.jsonを生成しました。"
  });

  ui.editorMessage.textContent = "公開用content.jsonを生成しました。";
});

ui.clearEditorHistoryButton.addEventListener("click", () => {
  if (!window.confirm("編集履歴を消去しますか？")) return;

  editorState.history = [];
  saveEditorHistory();
  renderEditorHistory();
  ui.editorMessage.textContent = "編集履歴を消去しました。";
});

renderAnalytics();

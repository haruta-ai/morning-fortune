export const APP_CONFIG = Object.freeze({
  appName: "Every Morning Fortune",
  appVersion: "1.0.9",
  engineVersion: "1.0.5",
  contentVersion: "1.0.7-daily-range",
  databaseName: "everyMorningFortuneDB",
  databaseVersion: 1,
  stores: Object.freeze([
    "profiles",
    "dailyResults",
    "reflections",
    "contentItems",
    "themes",
    "settings",
    "analyticsEvents",
    "contentUsage",
    "studioDrafts"
  ])
});

export const STORAGE_KEYS = Object.freeze({
  initialized: "emf.initialized",
  appearance: "emf.appearance",
  engineVersion: "emf.engineVersion",
  contentVersion: "1.0.7-daily-range"
});

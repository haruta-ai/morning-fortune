export const APP_CONFIG = Object.freeze({
  appName: "Every Morning Fortune",
  appVersion: "0.2.1",
  engineVersion: "1.0.0",
  contentVersion: "0.2.0-seed",
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
  contentVersion: "emf.contentVersion"
});

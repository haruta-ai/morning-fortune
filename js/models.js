import{normalizeText,uuid}from"./utils.js";
export function createProfile({displayName,birthDate,bloodType}){if(!birthDate)throw new Error("生年月日は必須です。");return{id:"primary",displayName:normalizeText(displayName).slice(0,24),birthDate,bloodType:["A","B","O","AB"].includes(bloodType)?bloodType:"",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};}
export function createAnalyticsEvent(type,metadata={}){return{id:uuid(),type,metadata,createdAt:new Date().toISOString()};}
export function validateBackup(payload){if(!payload||typeof payload!=="object"||!payload.data||typeof payload.data!=="object")throw new Error("バックアップ形式が正しくありません。");return true;}


export function createReflection({
  profileId,
  dateKey,
  themeId,
  themeLabel,
  mood,
  fulfilled,
  note
}) {
  if (!profileId || !dateKey || !themeId) {
    throw new Error("振り返りの保存に必要な情報が不足しています。");
  }

  const normalizedMood = Number.parseInt(mood, 10);
  const safeMood = Number.isFinite(normalizedMood)
    ? Math.min(Math.max(normalizedMood, 1), 5)
    : 3;

  return {
    id: `${profileId}:${dateKey}`,
    profileId,
    dateKey,
    themeId,
    themeLabel,
    mood: safeMood,
    fulfilled: Boolean(fulfilled),
    note: normalizeText(note).slice(0, 240),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

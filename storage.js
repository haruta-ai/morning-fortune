import{APP_CONFIG,STORAGE_KEYS}from"./config.js";
export const localSettings={
 initialize(){localStorage.setItem(STORAGE_KEYS.initialized,"true");localStorage.setItem(STORAGE_KEYS.engineVersion,APP_CONFIG.engineVersion);localStorage.setItem(STORAGE_KEYS.contentVersion,APP_CONFIG.contentVersion);if(!localStorage.getItem(STORAGE_KEYS.appearance))localStorage.setItem(STORAGE_KEYS.appearance,"system");},
 get(key,fallback=null){return localStorage.getItem(key)??fallback;},
 set(key,value){localStorage.setItem(key,String(value));},
 remove(key){localStorage.removeItem(key);}
};

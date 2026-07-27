import { generateDailyFortune } from "./fortune-engine.js";

/**
 * Every Morning Fortune engine facade.
 * Future engine versions can be switched here without changing the UI layer.
 */
export const fortuneEngine = Object.freeze({
  async generate(profile, targetDate, themes, content) {
    return generateDailyFortune(profile, targetDate, themes, content);
  }
});

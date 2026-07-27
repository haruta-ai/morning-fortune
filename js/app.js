import { APP_CONFIG } from "./config.js";
import { database } from "./database.js";
import { generateDailyFortune } from "./fortune-engine.js";
import { createAnalyticsEvent, createProfile } from "./models.js";
import { localSettings } from "./storage.js";
import { formatJapaneseDate, toLocalDateKey } from "./utils.js";

const $ = s => document.querySelector(s);
const ui = {
  splash:$("#splash"), welcome:$("#welcomePanel"), home:$("#homePanel"), form:$("#profileForm"),
  name:$("#displayName"), birth:$("#birthDate"), blood:$("#bloodType"), date:$("#todayLabel"),
  greeting:$("#greeting"), overallStars:$("#overallStars"), theme:$("#themeLabel"), lead:$("#themeLead"),
  overallScore:$("#overallScore"), loveStars:$("#loveStars"), loveScore:$("#loveScore"),
  moneyStars:$("#moneyStars"), moneyScore:$("#moneyScore"), workStars:$("#workStars"), workScore:$("#workScore"),
  key:$("#todayKey"), action:$("#luckyAction"), promise:$("#todayPromise"), overallMessage:$("#overallMessage"),
  axisMessages:$("#axisMessages"), openProfile:$("#openProfileButton"), dialog:$("#profileDialog"),
  summary:$("#profileSummary"), reset:$("#resetProfileButton")
};
let profile=null, themes=[], content={};

function starText(n){ return "★".repeat(n)+"☆".repeat(5-n); }
async function loadJson(path){ const r=await fetch(path,{cache:"no-store"}); if(!r.ok) throw new Error(`${path}を読み込めません`); return r.json(); }

async function initialize(){
  const hardStop=setTimeout(()=>ui.splash.classList.add("is-hidden"),2800);
  try{
    localSettings.initialize();
    await database.ready();
    [themes,content]=await Promise.all([loadJson("./data/themes.json"),loadJson("./data/content.json")]);
    profile=await database.get("profiles","primary");
    await render();
    await database.put("analyticsEvents",createAnalyticsEvent("app_open",{appVersion:APP_CONFIG.appVersion}));
    if("serviceWorker" in navigator && (location.protocol==="https:"||location.hostname==="localhost")){
      navigator.serviceWorker.register("./service-worker.js").catch(console.warn);
    }
  }catch(e){ console.error(e); alert(`初期化に失敗しました：${e.message}`); }
  finally{ clearTimeout(hardStop); setTimeout(()=>ui.splash.classList.add("is-hidden"),1850); }
}

async function getTodayResult(){
  const key=`primary:${toLocalDateKey()}:${APP_CONFIG.engineVersion}:${APP_CONFIG.contentVersion}`;
  let result=await database.get("dailyResults",key);
  if(!result){
    result=await generateDailyFortune(profile,new Date(),themes,content);
    await database.put("dailyResults",result);
    await database.put("analyticsEvents",createAnalyticsEvent("fortune_generated",{themeId:result.themeId,stars:result.axes.overall.stars}));
  }
  return result;
}

async function render(){
  ui.welcome.hidden=Boolean(profile);
  ui.home.hidden=!profile;
  if(!profile) return;
  const result=await getTodayResult();
  ui.date.textContent=formatJapaneseDate();
  ui.greeting.textContent=`おはようございます、${profile.displayName||"あなた"}さん`;
  ui.overallStars.textContent=starText(result.axes.overall.stars);
  ui.theme.textContent=result.themeLabel;
  ui.lead.textContent=result.content.lead;
  ui.overallScore.textContent=`${result.axes.overall.score} / 100`;
  for(const axis of ["love","money","work"]){
    ui[`${axis}Stars`].textContent=starText(result.axes[axis].stars);
    ui[`${axis}Score`].textContent=`${result.axes[axis].score}点`;
  }
  ui.key.textContent=result.content.key;
  ui.action.textContent=result.content.action;
  ui.promise.textContent=result.content.promise;
  ui.overallMessage.textContent=result.content.axisMessages.overall;
  ui.axisMessages.innerHTML=["love","money","work"].map(axis=>`<p><strong>${{love:"恋愛運",money:"金運",work:"仕事運"}[axis]}</strong><br>${result.content.axisMessages[axis]}</p>`).join("");
  ui.summary.textContent=`表示名：${profile.displayName||"未設定"}\n生年月日：${profile.birthDate}\n血液型：${profile.bloodType?profile.bloodType+"型":"未設定"}`;
}

ui.form.addEventListener("submit",async e=>{
  e.preventDefault();
  try{
    profile=createProfile({displayName:ui.name.value,birthDate:ui.birth.value,bloodType:ui.blood.value});
    await database.put("profiles",profile);
    await database.put("analyticsEvents",createAnalyticsEvent("profile_saved"));
    await render();
  }catch(err){ alert(err.message); }
});
ui.openProfile.addEventListener("click",()=>{ if(profile) ui.dialog.showModal(); });
ui.reset.addEventListener("click",async()=>{
  if(!confirm("プロフィールを削除しますか？")) return;
  await database.delete("profiles","primary"); profile=null; ui.dialog.close(); ui.form.reset(); await render();
});
initialize();

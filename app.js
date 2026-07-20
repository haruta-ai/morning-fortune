"use strict";

const APP = Object.freeze({
  version: "0.9.0-rc1",
  storageKey: "morningFortuneStateV2",
  worker: "./service-worker.js",
  splashMs: 1350,
  toastMs: 2200,
  dateCheckMs: 60000
});

const FORTUNES = Object.freeze([
  Object.freeze({
    rank:"大吉", icon:"☀️", stars:"★★★★★",
    message:"新しい挑戦が幸運を引き寄せる日。最初の一歩を軽やかに。",
    action:"気になっていたことを一つ始める", color:"ゴールド", time:"10:00〜12:00",
    caution:"勢いだけで約束しすぎない", word:"笑顔は、今日いちばんの追い風。"
  }),
  Object.freeze({
    rank:"中吉", icon:"🌤️", stars:"★★★★☆",
    message:"穏やかな追い風が吹いています。焦らず丁寧に進みましょう。",
    action:"目の前のことを一つずつ進める", color:"ラベンダー", time:"13:00〜15:00",
    caution:"結論を急ぎすぎない", word:"丁寧さは、静かな強さ。"
  }),
  Object.freeze({
    rank:"小吉", icon:"🍀", stars:"★★★☆☆",
    message:"小さな幸運を見つけられる日。いつもと違う選択が鍵です。",
    action:"普段と違う道や順番を選ぶ", color:"ミントグリーン", time:"15:00〜17:00",
    caution:"小さな違和感を見逃さない", word:"小さな変化が、流れを変える。"
  }),
  Object.freeze({
    rank:"吉", icon:"🌸", stars:"★★★★☆",
    message:"人との会話に運があります。短いひと言が良い流れを生みます。",
    action:"感謝を言葉にして伝える", color:"コーラルピンク", time:"9:00〜11:00",
    caution:"相手の話を途中で決めつけない", word:"やさしい言葉は、めぐって戻る。"
  }),
  Object.freeze({
    rank:"末吉", icon:"🌙", stars:"★★☆☆☆",
    message:"今日は準備を整える日。無理をせず、心と予定に余白を。",
    action:"予定を一つ減らして余白を作る", color:"ネイビーブルー", time:"18:00〜20:00",
    caution:"疲れているのに無理を重ねない", word:"休むことも、前へ進むこと。"
  }),
  Object.freeze({
    rank:"中吉", icon:"🕊️", stars:"★★★★☆",
    message:"落ち着いた判断が良い結果につながる日。静かな自信を大切に。",
    action:"大事なことを朝のうちに決める", color:"アイボリー", time:"8:00〜10:00",
    caution:"周囲に合わせすぎない", word:"自分の歩幅が、いちばん続く。"
  }),
  Object.freeze({
    rank:"吉", icon:"🌈", stars:"★★★★☆",
    message:"思いがけない発見がありそう。好奇心を少しだけ広げてみて。",
    action:"初めてのものを一つ試す", color:"スカイブルー", time:"14:00〜16:00",
    caution:"情報を集めすぎて迷わない", word:"好奇心は、未来への小さな扉。"
  })
]);

let toastTimer = 0;
let waitingWorker = null;

const $ = (id) => document.getElementById(id);

function dateKey(date=new Date()){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function formatDate(date){
  const days=["日","月","火","水","木","金","土"];
  return `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日（${days[date.getDay()]}）`;
}

function greetingForHour(hour){
  if(hour < 5) return "静かな夜ですね";
  if(hour < 11) return "おはようございます";
  if(hour < 17) return "こんにちは";
  return "今日もおつかれさまです";
}

function dailyIndex(date){
  const seed = Number(`${date.getFullYear()}${String(date.getMonth()+1).padStart(2,"0")}${String(date.getDate()).padStart(2,"0")}`);
  return (seed * 17 + date.getDay() * 13) % FORTUNES.length;
}

function readState(){
  try{ return JSON.parse(localStorage.getItem(APP.storageKey) || "null"); }
  catch{ return null; }
}

function writeState(){
  try{ localStorage.setItem(APP.storageKey, JSON.stringify({date:dateKey()})); }
  catch(error){ console.warn("状態を保存できませんでした", error); }
}

function renderDate(){
  const now=new Date();
  $("todayDate").textContent=formatDate(now);
  $("miniDate").textContent=`${now.getMonth()+1}/${now.getDate()}`;
  $("greeting").textContent=greetingForHour(now.getHours());
}

function resetFortune(){
  $("fortuneIcon").textContent="✨";
  $("fortuneRank").textContent="？？";
  $("fortuneStars").textContent="☆☆☆☆☆";
  $("fortuneMessage").textContent="ボタンを押して、今日の運勢を受け取りましょう。";
  $("luckyAction").textContent="運勢を見ると表示されます";
  $("luckyColor").textContent="—";
  $("luckyTime").textContent="—";
  $("caution").textContent="無理をしすぎないこと";
  $("dailyWord").textContent="今日という日は、まだ何色にでも変えられます。";
  $("buttonLabel").textContent="今日の運勢を見る";
  $("startButton").disabled=false;
  $("fortuneNote").textContent="運勢は毎日変わります。";
}

function renderFortune(save=true){
  const fortune=FORTUNES[dailyIndex(new Date())];
  $("fortuneIcon").textContent=fortune.icon;
  $("fortuneRank").textContent=fortune.rank;
  $("fortuneStars").textContent=fortune.stars;
  $("fortuneStars").setAttribute("aria-label",`運勢レベル ${fortune.stars}`);
  $("fortuneMessage").textContent=fortune.message;
  $("luckyAction").textContent=fortune.action;
  $("luckyColor").textContent=fortune.color;
  $("luckyTime").textContent=fortune.time;
  $("caution").textContent=fortune.caution;
  $("dailyWord").textContent=fortune.word;
  $("buttonLabel").textContent="今日も良い一日を";
  $("startButton").disabled=true;
  $("fortuneNote").textContent="今日の運勢は保存されています。";
  if(save) writeState();
}

function restore(){
  const state=readState();
  if(state?.date === dateKey()) renderFortune(false);
  else resetFortune();
}

function showToast(message){
  clearTimeout(toastTimer);
  $("toast").textContent=message;
  $("toast").classList.add("is-visible");
  toastTimer=setTimeout(()=>$("toast").classList.remove("is-visible"),APP.toastMs);
}

function setupButtons(){
  $("startButton").addEventListener("click",()=>{
    renderFortune(true);
    showToast("今日の運勢を開きました");
  });
  $("helpButton").addEventListener("click",()=>$("helpDialog").showModal());
  $("updateButton").addEventListener("click",()=>{
    waitingWorker?.postMessage({type:"SKIP_WAITING"});
  });
}

function setupSplash(){
  setTimeout(()=>$("splash").classList.add("is-hidden"),APP.splashMs);
}

function checkDay(){
  const current=dateKey();
  if(document.documentElement.dataset.day !== current){
    document.documentElement.dataset.day=current;
    renderDate();
    restore();
  }
}

function setupDayWatcher(){
  setInterval(checkDay,APP.dateCheckMs);
  document.addEventListener("visibilitychange",()=>{
    if(document.visibilityState==="visible") checkDay();
  });
  window.addEventListener("pageshow",checkDay);
}

function showUpdate(worker){
  waitingWorker=worker;
  $("updateBanner").classList.add("is-visible");
}

async function registerWorker(){
  if(!("serviceWorker" in navigator)){
    $("statusText").textContent="このブラウザではオフライン機能を使えません";
    return;
  }
  try{
    const reg=await navigator.serviceWorker.register(APP.worker,{scope:"./"});
    if(reg.waiting) showUpdate(reg.waiting);
    reg.addEventListener("updatefound",()=>{
      const worker=reg.installing;
      worker?.addEventListener("statechange",()=>{
        if(worker.state==="installed" && navigator.serviceWorker.controller) showUpdate(worker);
      });
    });
    let refreshing=false;
    navigator.serviceWorker.addEventListener("controllerchange",()=>{
      if(refreshing) return;
      refreshing=true;
      location.reload();
    });
    reg.update().catch(()=>{});
  }catch(error){
    $("statusText").textContent="オンライン時に再読み込みしてください";
    console.error(error);
  }
}

function init(){
  $("versionText").textContent="RC1";
  setupSplash();
  renderDate();
  restore();
  setupButtons();
  setupDayWatcher();
  window.addEventListener("load",registerWorker,{once:true});
  window.addEventListener("online",()=>$("statusText").textContent="オフラインでも使えます");
  window.addEventListener("offline",()=>$("statusText").textContent="現在オフラインです");
}

document.addEventListener("DOMContentLoaded",init,{once:true});

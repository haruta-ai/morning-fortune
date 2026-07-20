"use strict";

const APP = Object.freeze({
  version: "0.9.0-rc3",
  storageKey: "morningFortuneStateV4",
  detailKey: "morningFortuneDetailOpen",
  worker: "./service-worker.js",
  splashMs: 1000,
  toastMs: 2200,
  dateCheckMs: 60000
});

const FORTUNES = Object.freeze([
  Object.freeze({
    rank:"大吉", icon:"☀️", stars:"★★★★★",
    message:"今日は挑戦の日。迷っていたことを始めると、思った以上に良い流れになります。",
    work:["★★★★★","集中力と決断力が高まる日。大事な仕事は午前中に進めると好結果に。"],
    love:["★★★★☆","やさしいひと言が距離を縮めます。感謝は言葉にして伝えて。"],
    money:["★★★★☆","必要な買い物には良い日。勢いよりも、長く使えるかで選ぶと吉。"],
    health:["★★★★☆","体を軽く動かすと一日のリズムが整います。朝の深呼吸もおすすめ。"],
    action:"気になっていたことを一つ始める", color:"ゴールド", item:"新しいノート",
    number:"7", time:"10:00〜12:00", caution:"勢いだけで約束しすぎない",
    word:"笑顔は、今日いちばんの追い風。"
  }),
  Object.freeze({
    rank:"中吉", icon:"🌤️", stars:"★★★★☆",
    message:"穏やかな追い風が吹いています。焦らず丁寧に進むほど、結果につながります。",
    work:["★★★★☆","丁寧な確認が評価につながる日。急ぐより、抜け漏れを減らすことを優先して。"],
    love:["★★★☆☆","相手のペースを尊重すると穏やかに過ごせます。聞き役になると吉。"],
    money:["★★★☆☆","小さな節約が気持ちの余裕につながります。買う前に一度だけ比較を。"],
    health:["★★★★☆","生活のリズムを整えやすい日。水分補給をこまめにすると好調を保てます。"],
    action:"目の前のことを一つずつ進める", color:"ラベンダー", item:"ハンカチ",
    number:"4", time:"13:00〜15:00", caution:"結論を急ぎすぎない",
    word:"丁寧さは、静かな強さ。"
  }),
  Object.freeze({
    rank:"小吉", icon:"🍀", stars:"★★★☆☆",
    message:"小さな幸運を見つけられる日。いつもと違う選択が、良い刺激になります。",
    work:["★★★☆☆","いつもの手順を少し見直すと効率が上がります。小さな改善が鍵。"],
    love:["★★★★☆","自然体の会話に運があります。飾らない言葉が好印象につながりそう。"],
    money:["★★★☆☆","予算を決めてから動くと安心。お得さだけでなく必要性を大切に。"],
    health:["★★★☆☆","目や肩を休ませる時間を意識して。短い休憩が集中力を戻します。"],
    action:"普段と違う道や順番を選ぶ", color:"ミントグリーン", item:"イヤホン",
    number:"3", time:"15:00〜17:00", caution:"小さな違和感を見逃さない",
    word:"小さな変化が、流れを変える。"
  }),
  Object.freeze({
    rank:"吉", icon:"🌸", stars:"★★★★☆",
    message:"人との会話に運があります。短いひと言が、思いがけない良い流れを生みます。",
    work:["★★★★☆","相談や共有が成果につながる日。一人で抱えず、早めに声をかけて。"],
    love:["★★★★★","素直な気持ちが伝わりやすい日。笑顔で話すほど魅力が高まります。"],
    money:["★★★☆☆","人付き合いの出費が増えそう。無理のない範囲で楽しむと吉。"],
    health:["★★★★☆","気分転換が体にも良い影響を与えます。外の空気を吸う時間を作って。"],
    action:"感謝を言葉にして伝える", color:"コーラルピンク", item:"コーヒー",
    number:"8", time:"9:00〜11:00", caution:"相手の話を途中で決めつけない",
    word:"やさしい言葉は、めぐって戻る。"
  }),
  Object.freeze({
    rank:"末吉", icon:"🌙", stars:"★★☆☆☆",
    message:"今日は準備を整える日。無理をせず、心と予定に余白を作りましょう。",
    work:["★★☆☆☆","新しいことより整理や確認に向く日。急ぎでない決断は明日に回しても大丈夫。"],
    love:["★★★☆☆","疲れているときは無理に盛り上げなくて大丈夫。穏やかな時間を大切に。"],
    money:["★★☆☆☆","衝動買いに注意。今日は使うより、手元に残す選択が安心です。"],
    health:["★★★☆☆","疲れが表に出やすい日。睡眠と食事を優先し、無理を重ねないで。"],
    action:"予定を一つ減らして余白を作る", color:"ネイビーブルー", item:"温かい飲み物",
    number:"2", time:"18:00〜20:00", caution:"疲れているのに無理を重ねない",
    word:"休むことも、前へ進むこと。"
  }),
  Object.freeze({
    rank:"中吉", icon:"🕊️", stars:"★★★★☆",
    message:"落ち着いた判断が良い結果につながる日。静かな自信を大切に。",
    work:["★★★★★","判断力が冴える日。重要なことは周囲に流されず、自分の基準で決めて。"],
    love:["★★★☆☆","無理に答えを出さず、相手を信じて待つ姿勢が良い流れを作ります。"],
    money:["★★★★☆","計画的な買い物に向く日。将来のための準備に使うと満足度が高まりそう。"],
    health:["★★★★☆","姿勢を整えると気分も前向きに。背筋を伸ばすことを意識して。"],
    action:"大事なことを朝のうちに決める", color:"アイボリー", item:"腕時計",
    number:"6", time:"8:00〜10:00", caution:"周囲に合わせすぎない",
    word:"自分の歩幅が、いちばん続く。"
  }),
  Object.freeze({
    rank:"吉", icon:"🌈", stars:"★★★★☆",
    message:"思いがけない発見がありそう。好奇心を少しだけ広げると、楽しい一日に。",
    work:["★★★★☆","新しい情報や方法が役立つ日。知らないことを一つ調べると成果につながります。"],
    love:["★★★★☆","共通の話題から自然に距離が縮まりそう。相手への興味を言葉にして。"],
    money:["★★★☆☆","新しいものに惹かれやすい日。買うなら一晩考えると納得できる選択に。"],
    health:["★★★★★","気力と体力のバランスが良い日。散歩や軽い運動でさらに運気アップ。"],
    action:"初めてのものを一つ試す", color:"スカイブルー", item:"本",
    number:"9", time:"14:00〜16:00", caution:"情報を集めすぎて迷わない",
    word:"好奇心は、未来への小さな扉。"
  })
]);

let toastTimer=0;
let waitingWorker=null;
const $=(id)=>document.getElementById(id);

function dateKey(date=new Date()){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function formatDate(date){
  const days=["日","月","火","水","木","金","土"];
  return `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日（${days[date.getDay()]}）`;
}

function greetingForHour(hour){
  if(hour<5)return"静かな夜ですね";
  if(hour<11)return"おはようございます";
  if(hour<17)return"こんにちは";
  return"今日もおつかれさまです";
}

function dailyIndex(date){
  const seed=Number(`${date.getFullYear()}${String(date.getMonth()+1).padStart(2,"0")}${String(date.getDate()).padStart(2,"0")}`);
  return(seed*17+date.getDay()*13)%FORTUNES.length;
}

function readState(){
  try{return JSON.parse(localStorage.getItem(APP.storageKey)||"null");}
  catch{return null;}
}

function writeState(){
  try{localStorage.setItem(APP.storageKey,JSON.stringify({date:dateKey()}));}
  catch(error){console.warn("状態を保存できませんでした",error);}
}

function renderDate(){
  const now=new Date();
  $("todayDate").textContent=formatDate(now);
  $("miniDate").textContent=`${now.getMonth()+1}/${now.getDate()}`;
  $("greeting").textContent=greetingForHour(now.getHours());
}

function setCategory(prefix,stars,message){
  $(`${prefix}Stars`).textContent=stars;
  $(`${prefix}StarsMini`).textContent=stars;
  $(`${prefix}Message`).textContent=message;
}

function resetFortune(){
  $("fortuneIcon").textContent="✨";
  $("fortuneRank").textContent="？？";
  $("fortuneStars").textContent="☆☆☆☆☆";
  $("fortuneMessage").textContent="ボタンを押して、今日の運勢を受け取りましょう。";
  ["work","love","money","health"].forEach(prefix=>setCategory(prefix,"☆☆☆☆☆","運勢を見ると表示されます。"));
  $("luckyAction").textContent="運勢を見ると表示されます";
  $("luckyColor").textContent="—";
  $("luckyItem").textContent="—";
  $("luckyNumber").textContent="—";
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
  setCategory("work",fortune.work[0],fortune.work[1]);
  setCategory("love",fortune.love[0],fortune.love[1]);
  setCategory("money",fortune.money[0],fortune.money[1]);
  setCategory("health",fortune.health[0],fortune.health[1]);
  $("luckyAction").textContent=fortune.action;
  $("luckyColor").textContent=fortune.color;
  $("luckyItem").textContent=fortune.item;
  $("luckyNumber").textContent=fortune.number;
  $("luckyTime").textContent=fortune.time;
  $("caution").textContent=fortune.caution;
  $("dailyWord").textContent=fortune.word;
  $("buttonLabel").textContent="今日も良い一日を";
  $("startButton").disabled=true;
  $("fortuneNote").textContent="今日の運勢は保存されています。";
  if(save)writeState();
}

function restore(){
  const state=readState();
  if(state?.date===dateKey())renderFortune(false);
  else resetFortune();
}

function showToast(message){
  clearTimeout(toastTimer);
  $("toast").textContent=message;
  $("toast").classList.add("is-visible");
  toastTimer=setTimeout(()=>$("toast").classList.remove("is-visible"),APP.toastMs);
}

function setDetails(open){
  $("categoryDetails").hidden=!open;
  $("detailToggle").setAttribute("aria-expanded",String(open));
  $("detailToggle").querySelector("strong").textContent=open?"詳しい運勢を閉じる":"詳しい運勢を見る";
  try{localStorage.setItem(APP.detailKey,open?"1":"0");}catch{}
}

function setupButtons(){
  $("startButton").addEventListener("click",()=>{
    renderFortune(true);
    showToast("今日の運勢を開きました");
  });
  $("detailToggle").addEventListener("click",()=>{
    setDetails($("detailToggle").getAttribute("aria-expanded")!=="true");
  });
  $("helpButton").addEventListener("click",()=>$("helpDialog").showModal());
  $("updateButton").addEventListener("click",()=>waitingWorker?.postMessage({type:"SKIP_WAITING"}));
}

function setupSplash(){
  setTimeout(()=>$("splash").classList.add("is-hidden"),APP.splashMs);
}

function checkDay(){
  const current=dateKey();
  if(document.documentElement.dataset.day!==current){
    document.documentElement.dataset.day=current;
    renderDate();
    restore();
  }
}

function setupDayWatcher(){
  setInterval(checkDay,APP.dateCheckMs);
  document.addEventListener("visibilitychange",()=>{
    if(document.visibilityState==="visible")checkDay();
  });
  window.addEventListener("pageshow",checkDay);
}

function showUpdate(worker){
  waitingWorker=worker;
  $("updateBanner").classList.add("is-visible");
}

async function registerWorker(){
  if(!("serviceWorker"in navigator)){
    $("statusText").textContent="このブラウザではオフライン機能を使えません";
    return;
  }
  try{
    const reg=await navigator.serviceWorker.register(APP.worker,{scope:"./"});
    if(reg.waiting)showUpdate(reg.waiting);
    reg.addEventListener("updatefound",()=>{
      const worker=reg.installing;
      worker?.addEventListener("statechange",()=>{
        if(worker.state==="installed"&&navigator.serviceWorker.controller)showUpdate(worker);
      });
    });
    let refreshing=false;
    navigator.serviceWorker.addEventListener("controllerchange",()=>{
      if(refreshing)return;
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
  $("versionText").textContent="RC3";
  setupSplash();
  renderDate();
  restore();
  setupButtons();
  try{setDetails(localStorage.getItem(APP.detailKey)==="1");}catch{setDetails(false);}
  setupDayWatcher();
  window.addEventListener("load",registerWorker,{once:true});
  window.addEventListener("online",()=>$("statusText").textContent="オフラインでも使えます");
  window.addEventListener("offline",()=>$("statusText").textContent="現在オフラインです");
}

document.addEventListener("DOMContentLoaded",init,{once:true});

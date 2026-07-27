import { APP_CONFIG } from "./config.js";
import { clamp, digitalRoot, sha256Hex, toLocalDateKey } from "./utils.js";

const AXES = ["overall", "love", "money", "work"];
const SIGNAL_KEYS = ["vitality","receptivity","connection","expression","focus","material","caution","recovery"];

function center(v) { return (v - 0.5) * 2; }
function unit(n) { return (n >>> 0) / 4294967296; }
function pad2(n) { return String(n).padStart(2, "0"); }
function scoreToStars(score) {
  if (score >= 76) return 5;
  if (score >= 64) return 4;
  if (score >= 50) return 3;
  if (score >= 38) return 2;
  return 1;
}
function soften(raw) { return 50 + Math.tanh((raw - 50) / 28) * 31; }
function synergy(a,b,max) {
  if (a < 65 || b < 65) return 0;
  return ((Math.min(a,b)-65)/35) * max;
}
function overload(caution,target,max) {
  if (caution < 75 || target >= 45) return 0;
  return ((caution-75)/25) * ((45-target)/45) * max;
}
function balancedCaution(c,max) {
  if (c >= 55 && c <= 72) return max * (1 - Math.abs(c-63.5)/8.5);
  if (c > 85) return -max * ((c-85)/15);
  return 0;
}
function localDayNumber(date) {
  return Math.floor(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()) / 86400000);
}
function dayOfYear(date) {
  const start = Date.UTC(date.getFullYear(),0,1);
  const now = Date.UTC(date.getFullYear(),date.getMonth(),date.getDate());
  return Math.floor((now-start)/86400000)+1;
}
function getSeasonId(date) {
  const m = date.getMonth()+1, d = date.getDate(), md=m*100+d;
  if (md >= 204 && md <= 319) return "early_spring";
  if (md >= 320 && md <= 504) return "spring";
  if (md >= 505 && md <= 620) return "early_summer";
  if (md >= 621 && md <= 719) return "rainy";
  if (md >= 720 && md <= 831) return "summer";
  if (md >= 901 && md <= 1106) return "autumn";
  if (md >= 1107 && md <= 1220) return "early_winter";
  return "winter";
}
function bytesFromHex(hex) {
  const bytes=[];
  for(let i=0;i<hex.length;i+=2) bytes.push(parseInt(hex.slice(i,i+2),16));
  return bytes;
}
function u32(bytes, offset) {
  return (((bytes[offset]<<24)>>>0) | (bytes[offset+1]<<16) | (bytes[offset+2]<<8) | bytes[offset+3]) >>> 0;
}
function numericParts(dateStr) {
  const digits=dateStr.replace(/\D/g,"").split("").map(Number);
  const [y,m,d]=dateStr.split("-").map(Number);
  return {
    lifeNumber:digitalRoot(digits.reduce((a,b)=>a+b,0)),
    dayNumber:digitalRoot(d),
    monthNumber:digitalRoot(m),
    yearNumber:digitalRoot(String(y).split("").reduce((a,b)=>a+Number(b),0))
  };
}
function mixUnit(uint32,wave) {
  return clamp(unit(uint32)*0.72 + ((wave+1)/2)*0.28,0,1);
}
function starLabel(stars) {
  return ["","守る日","選ぶ日","整える日","進める日","広げる日"][stars];
}
function axisMicro(hash, index) {
  const byte=parseInt(hash.slice(index*2,index*2+2),16);
  return (byte/255)*3-1.5;
}

async function createProfileVector(profile) {
  const birthSlot = profile.birthSlot || "UNKNOWN";
  const blood = profile.bloodType || "UNKNOWN";
  const source=`EMF|v1|${profile.birthDate}|${blood}|${birthSlot}`;
  const hash=await sha256Hex(source);
  const bytes=bytesFromHex(hash.padEnd(64,"0"));
  const parts=numericParts(profile.birthDate);
  const bloodValue={A:.22,B:.48,O:.73,AB:.91,UNKNOWN:.5}[blood] ?? .5;
  const birthSlotValue={DAWN:.15,MORNING:.32,DAY:.5,EVENING:.69,NIGHT:.86,UNKNOWN:.5}[birthSlot] ?? .5;
  return {
    core:unit(u32(bytes,0)), relation:unit(u32(bytes,4)),
    material:unit(u32(bytes,8)), vocation:unit(u32(bytes,12)),
    ...parts, bloodValue, birthSlotValue, hash
  };
}

async function createDayVector(date) {
  const dateKey=toLocalDateKey(date);
  const seasonId=getSeasonId(date);
  const source=`EMF|v1|${dateKey}|${seasonId}|${APP_CONFIG.engineVersion}`;
  const hash=await sha256Hex(source);
  const bytes=bytesFromHex(hash.padEnd(64,"0"));
  const ds=localDayNumber(date)-localDayNumber(new Date(2000,0,1));
  const doy=dayOfYear(date), yearLength=new Date(date.getFullYear(),1,29).getMonth()===1?366:365;
  const annualWave=Math.sin(2*Math.PI*doy/yearLength);
  const lunarLike=Math.sin(2*Math.PI*ds/29.53059);
  const weeklyWave=Math.sin(2*Math.PI*date.getDay()/7);
  const shortWave=Math.sin(2*Math.PI*ds/11);
  const mediumWave=Math.cos(2*Math.PI*ds/37);
  const d=Array.from({length:8},(_,i)=>u32(bytes,i*4));
  return {
    energy:mixUnit(d[0],annualWave), connection:mixUnit(d[1],weeklyWave),
    resource:mixUnit(d[2],mediumWave), focus:mixUnit(d[3],shortWave),
    pace:mixUnit(d[4],-annualWave), caution:mixUnit(d[5],lunarLike),
    openness:mixUnit(d[6],weeklyWave*annualWave), recovery:mixUnit(d[7],-shortWave),
    dateNumber:digitalRoot(dateKey.replace(/\D/g,"").split("").reduce((a,b)=>a+Number(b),0)),
    weekday:date.getDay(), dayOfYear:doy, seasonId, annualWave,lunarLike,weeklyWave,shortWave,mediumWave,hash
  };
}

function createSignals(p,d) {
  const s={};
  s.vitality=50+12*center(p.core)+20*center(d.energy)+6*d.annualWave+5*center(p.core)*center(d.energy);
  s.receptivity=50+10*center(p.relation)+18*center(d.openness)+7*center(d.recovery)-4*center(d.caution);
  s.connection=50+14*center(p.relation)+20*center(d.connection)+5*d.weeklyWave+4*center(p.relation)*center(d.connection);
  s.expression=50+10*center(p.core)+12*center(p.relation)+18*center(d.openness)+7*center(d.pace)-5*center(d.caution);
  s.focus=50+14*center(p.vocation)+22*center(d.focus)+5*d.shortWave-4*center(d.openness);
  s.material=50+14*center(p.material)+20*center(d.resource)+5*d.mediumWave+4*center(p.material)*center(d.resource);
  s.caution=50+8*center(1-p.core)+24*center(d.caution)+6*d.lunarLike-4*center(d.energy);
  s.recovery=50+12*center(1-p.core)+22*center(d.recovery)-5*d.shortWave+5*center(d.caution);
  for (const k of SIGNAL_KEYS) s[k]=Math.round(clamp(s[k],0,100));
  return s;
}

function calculateAxes(s, dayHash) {
  const raw={
    overall:.20*s.vitality+.14*s.receptivity+.14*s.connection+.12*s.expression+.14*s.focus+.10*s.material+.08*(100-s.caution)+.08*s.recovery,
    love:.30*s.connection+.24*s.receptivity+.22*s.expression+.10*s.vitality+.08*s.recovery+.06*(100-s.caution),
    money:.34*s.material+.22*s.focus+.14*s.caution+.12*s.receptivity+.10*s.recovery+.08*s.vitality,
    work:.32*s.focus+.20*s.vitality+.16*s.expression+.12*s.connection+.10*s.material+.10*(100-s.caution)
  };
  const adj={
    overall:synergy(s.vitality,s.focus,3)+synergy(s.receptivity,s.recovery,2)-overload(s.caution,s.vitality,3),
    love:synergy(s.connection,s.expression,4)+synergy(s.receptivity,s.recovery,2)-overload(s.caution,s.expression,3),
    money:synergy(s.material,s.focus,3.5)+balancedCaution(s.caution,2.5)-overload(s.caution,s.material,2.5),
    work:synergy(s.focus,s.vitality,4)+synergy(s.expression,s.connection,2)-overload(s.caution,s.vitality,3)
  };
  const axes={};
  AXES.forEach((key,i)=>{
    const score=Math.round(clamp(soften(raw[key])+adj[key]+axisMicro(dayHash,i),0,100));
    axes[key]={score,stars:scoreToStars(score),label:starLabel(scoreToStars(score))};
  });
  return axes;
}

function themeSimilarity(signals, theme) {
  const diffs=SIGNAL_KEYS.map(k=>Math.abs(signals[k]-theme.target[k]));
  return 1-diffs.reduce((a,b)=>a+b,0)/(diffs.length*100);
}
function selectTheme(signals,axes,themes,seasonId,seedHash) {
  const highestAxis=AXES.slice(1).sort((a,b)=>axes[b].score-axes[a].score)[0];
  const scored=themes.map((theme,index)=>{
    let score=themeSimilarity(signals,theme)*55;
    const ranked=SIGNAL_KEYS.slice().sort((a,b)=>signals[b]-signals[a]);
    score += theme.dominantSignals.filter(k=>ranked.slice(0,3).includes(k)).length*7.5;
    if(theme.preferredOverallStars.includes(axes.overall.stars)) score+=10;
    if(theme.seasonBoost.includes(seasonId)) score+=4;
    if(highestAxis==="love" && ["connect","express","receive","trust"].includes(theme.id)) score+=7;
    if(highestAxis==="money" && ["choose","review","protect","prepare","organize"].includes(theme.id)) score+=7;
    if(highestAxis==="work" && ["focus","advance","prepare","organize"].includes(theme.id)) score+=7;
    if(signals.recovery>72 && signals.vitality<48 && ["rest","organize","release"].includes(theme.id)) score+=8;
    if(signals.caution>72 && ["protect","review","choose","prepare"].includes(theme.id)) score+=8;
    const tie=parseInt(seedHash.slice((index%16)*2,(index%16)*2+2),16)/255;
    score+=tie*.01;
    return {theme,score};
  }).sort((a,b)=>b.score-a.score);
  return scored[0].theme;
}

function axisMessage(axis, stars, themeLabel) {
  const tone = {
    5:"追い風を活かしつつ、丁寧さも忘れずに。",
    4:"小さな決断を前へ進める好機です。",
    3:"急がず、バランスを整えると安定します。",
    2:"優先順位を絞り、確認を一つ増やしましょう。",
    1:"無理に動かず、安心できる選択を優先してください。"
  }[stars];
  const names={overall:"総合運",love:"恋愛運",money:"金運",work:"仕事運"};
  return `${names[axis]}は「${themeLabel}」を意識すると整います。${tone}`;
}

export async function generateDailyFortune(profile, targetDate=new Date(), themeData=[], contentData={}) {
  const [profileVector,dayVector]=await Promise.all([createProfileVector(profile),createDayVector(targetDate)]);
  const signals=createSignals(profileVector,dayVector);
  const axes=calculateAxes(signals,dayVector.hash);
  const theme=selectTheme(signals,axes,themeData,dayVector.seasonId,profileVector.hash+dayVector.hash);
  const c=contentData[theme.id] || {};
  const dateKey=toLocalDateKey(targetDate);
  return {
    id:`primary:${dateKey}:${APP_CONFIG.engineVersion}:${APP_CONFIG.contentVersion}`,
    profileId:profile.id,
    dateKey,
    engineVersion:APP_CONFIG.engineVersion,
    contentVersion:APP_CONFIG.contentVersion,
    generatedAt:new Date().toISOString(),
    themeBaseId:theme.id,
    themeId:theme.id,
    themeLabel:theme.label,
    profileVector:{...profileVector,hash:profileVector.hash.slice(0,16)},
    dayVector:{...dayVector,hash:dayVector.hash.slice(0,16)},
    signals,
    axes,
    content:{
      lead:c.lead || `今日は「${theme.label}」がテーマです。`,
      key:c.key || "一つずつ、丁寧に進める。",
      promise:c.promise || "今日の自分に合う歩幅を選びます。",
      action:c.action || "深呼吸して、最初の一歩を決める。",
      axisMessages:Object.fromEntries(AXES.map(k=>[k,axisMessage(k,axes[k].stars,theme.label)]))
    }
  };
}

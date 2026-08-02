import { APP_CONFIG } from "./config.js";
import { clamp, digitalRoot, sha256Hex, toLocalDateKey } from "./utils.js";

const AXES = ["overall", "love", "money", "work", "health"];
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
    work:.32*s.focus+.20*s.vitality+.16*s.expression+.12*s.connection+.10*s.material+.10*(100-s.caution),
    health:.34*s.recovery+.28*s.vitality+.16*(100-s.caution)+.12*s.focus+.10*s.receptivity
  };
  const adj={
    overall:synergy(s.vitality,s.focus,3)+synergy(s.receptivity,s.recovery,2)-overload(s.caution,s.vitality,3),
    love:synergy(s.connection,s.expression,4)+synergy(s.receptivity,s.recovery,2)-overload(s.caution,s.expression,3),
    money:synergy(s.material,s.focus,3.5)+balancedCaution(s.caution,2.5)-overload(s.caution,s.material,2.5),
    work:synergy(s.focus,s.vitality,4)+synergy(s.expression,s.connection,2)-overload(s.caution,s.vitality,3),
    health:synergy(s.recovery,s.vitality,3)+balancedCaution(s.caution,1.5)-overload(s.caution,s.recovery,2)
  };
  const axes={};
  AXES.forEach((key,i)=>{
    const score=Math.round(clamp(soften(raw[key])+adj[key]+axisMicro(dayHash,i),0,100));
    axes[key]={score,stars:scoreToStars(score),label:starLabel(scoreToStars(score))};
  });
  return axes;
}

const OVERALL_RHYTHM = [18, 100, 50, 78, 20, 100, 56, 84, 24, 98];
const AXIS_RHYTHMS = {
  love: [-9, 7, 2, -5, 10, -3, 5],
  money: [6, -8, 9, -4, 3, -10, 7],
  work: [-4, 8, -9, 5, 10, -3, 4],
  health: [7, -5, 3, 9, -8, 4, -6]
};

function updateAxisScore(axis, score) {
  axis.score = Math.round(clamp(score, 0, 100));
  axis.stars = scoreToStars(axis.score);
  axis.label = starLabel(axis.stars);
}

function shapeDailyRhythm(axes, dayVector, profileVector) {
  const overallOffset = parseInt(profileVector.hash.slice(0, 2), 16) % OVERALL_RHYTHM.length;
  const overallPhase = (dayVector.dayOfYear - 1 + overallOffset) % OVERALL_RHYTHM.length;
  const target = OVERALL_RHYTHM[overallPhase];

  // 日ごとの高低差を明確にし、低めの日の次には上向くリズムを作る。
  updateAxisScore(axes.overall, axes.overall.score * .18 + target * .82);

  AXES.slice(1).forEach((axis, index) => {
    const rhythm = AXIS_RHYTHMS[axis];
    const offset = parseInt(profileVector.hash.slice(2 + index * 2, 4 + index * 2), 16) % rhythm.length;
    const phase = (dayVector.dayOfYear - 1 + offset) % rhythm.length;
    updateAxisScore(axes[axis], axes[axis].score + rhythm[phase]);
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
    if(highestAxis==="health" && ["rest","enjoy","nurture","organize"].includes(theme.id)) score+=7;
    if(signals.recovery>72 && signals.vitality<48 && ["rest","organize","release"].includes(theme.id)) score+=8;
    if(signals.caution>72 && ["protect","review","choose","prepare"].includes(theme.id)) score+=8;
    const tie=parseInt(seedHash.slice((index%16)*2,(index%16)*2+2),16)/255;
    score+=tie*.01;
    return {theme,score};
  }).sort((a,b)=>b.score-a.score);
  return scored[0].theme;
}

function themeAxisLens(themeId, axis) {
  const lenses = {
    begin: {
      love: "関係を変えたいなら、まずあなたから小さな本音を見せて。",
      money: "貯めることも整えることも、今日の小さな一回から始まります。",
      work: "完璧な準備より、未完成でも着手する勇気が流れを作ります。"
    },
    advance: {
      love: "待ち続けるより、やさしい一歩をあなたから選んで。",
      money: "未来の安心へつながる使い方を、一つだけ実行しましょう。",
      work: "迷いを抱えたままでも進めます。最初の工程だけ終わらせて。"
    },
    connect: {
      love: "分かってもらう前に、相手を知ろうとする姿勢が心を結びます。",
      money: "信頼できる人との情報交換が、堅実な選択を助けます。",
      work: "一人で完成させようとせず、早めの共有を味方につけて。"
    },
    express: {
      love: "言わなくても分かるはず、を手放すと関係はもっと自由になります。",
      money: "欲しい理由を言葉にすると、本当に必要かが見えてきます。",
      work: "考えを短い言葉にまとめるほど、提案の力が増します。"
    },
    receive: {
      love: "愛されるために頑張り続けなくても、受け取っていい好意があります。",
      money: "得たものを素直に喜ぶことも、豊かさを育てる行動です。",
      work: "褒め言葉や助けを否定せず、今日はそのまま受け取って。"
    },
    choose: {
      love: "好かれる選択より、自分を大切にできる関係を選んで。",
      money: "安さや勢いではなく、明日の自分も納得できる方を選びましょう。",
      work: "全部を引き受けるより、成果につながる仕事を選ぶ勇気を。"
    },
    focus: {
      love: "多くの反応を求めるより、大切な一人との会話へ心を向けて。",
      money: "一つの数字を丁寧に見ると、漠然とした不安が具体策へ変わります。",
      work: "通知と雑音を遠ざけ、今いちばん価値のある一つへ集中して。"
    },
    organize: {
      love: "言葉にする前に気持ちを整えると、本音はやさしく届きます。",
      money: "財布や支払いを整えることは、未来の自分への思いやりです。",
      work: "机・予定・頭の中のどれか一つを整えると、仕事が動き始めます。"
    },
    protect: {
      love: "相手を大切にすることと、自分の境界を守ることは両立します。",
      money: "断ることや買わないことも、大切な暮らしを守る選択です。",
      work: "期待へ応え続ける前に、集中する時間と休む時間を守って。"
    },
    rest: {
      love: "心が疲れている日は、誰かの気持ちを決めつけず休ませて。",
      money: "疲れを埋める買い物より、何も決めない時間が助けになります。",
      work: "休むことは遅れではなく、明日の判断力を取り戻す仕事です。"
    },
    release: {
      love: "正しさへの執着を少し手放すと、相手の本音が見えやすくなります。",
      money: "使っていない物や契約を一つ手放すと、余白が戻ってきます。",
      work: "自分だけで抱える前提を手放し、任せられるものを分けて。"
    },
    trust: {
      love: "不安の答え合わせを繰り返すより、積み重ねた関係を信じて。",
      money: "一度決めた堅実な計画を、今日は静かに続けましょう。",
      work: "経験から生まれた最初の判断を、必要以上に疑わないで。"
    },
    enjoy: {
      love: "関係の行方を考えすぎず、今日一緒に笑える瞬間を味わって。",
      money: "罪悪感のない小さな楽しみは、暮らしを豊かにする支出です。",
      work: "得意なことや面白い部分へ目を向けると、集中が自然に戻ります。"
    },
    nurture: {
      love: "すぐに答えを求めず、小さな信頼が育つ時間を大切にして。",
      money: "少額でも続けられる習慣が、未来の安心をゆっくり育てます。",
      work: "今日の成果だけでなく、これから伸びる力へ時間を使って。"
    },
    review: {
      love: "同じすれ違いを責めるより、伝え方を一つ見直してみて。",
      money: "過去の失敗を責めず、次に変えられる一項目だけ見つけましょう。",
      work: "やり直しではなく改善です。目的に合わない手順を一つ変えて。"
    },
    prepare: {
      love: "大切な話ほど、伝えたいことを先に心の中で整えて。",
      money: "予定外へ備える小さな余白が、今日の安心を作ります。",
      work: "本番の不安は準備で小さくできます。必要なものを三つ確認して。"
    }
  };

  return lenses[themeId]?.[axis] || "";
}

function axisMessage(axis, stars, themeId, themeLabel, variantIndex) {
  const messages = {
    overall: {
      5: [
        `今日は全体の流れが味方します。「${themeLabel}」を軸に、温めてきたことを堂々と前へ進めて。`,
        `心と行動が自然にかみ合う一日です。「${themeLabel}」を意識すると、好機をつかみやすくなります。`,
        `視界がひらけ、次の一歩が見えやすい日。「${themeLabel}」を合図に、迷いより期待を選びましょう。`
      ],
      4: [
        `穏やかな追い風があります。「${themeLabel}」を意識した小さな決断が、今日をよい方向へ動かします。`,
        `準備してきたことが形になりやすい日です。「${themeLabel}」を忘れず、一つずつ確実に進めて。`,
        `日常の中に好機が隠れています。「${themeLabel}」を判断基準にすると、迷いが少なくなるでしょう。`
      ],
      3: [
        `大きく急ぐより、流れを整えたい一日です。「${themeLabel}」を意識して、自分の歩幅を守りましょう。`,
        `小さな調整が運気を安定させます。「${themeLabel}」を軸に、優先することを一つ決めて。`,
        `今日の鍵は無理のないバランスです。「${themeLabel}」を心に置くと、落ち着いて選べます。`
      ],
      2: [
        `予定を詰め込みすぎないことが大切です。「${themeLabel}」を意識し、確認の時間を少し増やして。`,
        `今日は守りを固めるほど安心できます。「${themeLabel}」を軸に、必要なことだけへ力を注ぎましょう。`,
        `思いどおりに進まないときは立ち止まって。「${themeLabel}」へ戻ると、次の道筋が見えてきます。`
      ],
      1: [
        `無理に流れを変えなくて大丈夫です。「${themeLabel}」を心に置き、休息と安心を最優先にして。`,
        `今日は自分を守る選択が正解です。「${themeLabel}」を意識し、できたことを一つ認めましょう。`,
        `結果を急がず、心身を整える日に。「${themeLabel}」を小さく実践するだけで十分です。`
      ]
    },
    love: {
      5: [
        `気持ちが素直に届きやすい日です。大切な人へ、飾らない感謝や好意を言葉にしてみて。`,
        `人との間にあたたかな空気が生まれます。相手のよいところを見つけたら、その場で伝えましょう。`,
        `心の距離を縮める好機です。待つだけでなく、あなたから明るい一言を届けて。`
      ],
      4: [
        `丁寧な会話が関係を育てます。答えを急がず、相手の話を最後まで聞くことを大切に。`,
        `やさしい気遣いが印象に残る日です。短い連絡でも、相手を思う一言を添えてみて。`,
        `自然体の魅力が伝わりやすいでしょう。無理に盛り上げず、心地よい時間を共有して。`
      ],
      3: [
        `相手の反応を深読みしすぎないで。今日は穏やかなやり取りを重ねることが、信頼につながります。`,
        `近すぎず遠すぎない距離が心地よい日。自分の時間も相手の時間も、同じように尊重して。`,
        `言葉より態度が伝わりやすい一日です。約束や返事を丁寧に扱うと、安心感が育ちます。`
      ],
      2: [
        `寂しさから答えを急がないこと。伝える前に一度深呼吸し、やわらかな言葉を選びましょう。`,
        `小さなすれ違いは、その場で決めつけずに。相手の事情を想像する余白を残して。`,
        `今日は無理に距離を縮めなくて大丈夫。自分の気持ちを整えてから、誠実に向き合いましょう。`
      ],
      1: [
        `心が敏感になりやすい日です。相手を試すより、自分が安心できる時間を先に確保して。`,
        `返事や反応だけで愛情を測らないで。今日は静かに自分をいたわることを優先しましょう。`,
        `無理に分かり合おうとせず、少し距離を置くのもやさしさです。落ち着いてから言葉を選んで。`
      ]
    },
    money: {
      5: [
        `価値ある使い方を選べる日です。長く役立つものや、学びにつながる支出を優先して。`,
        `お金の流れを前向きに整えられます。必要な手続きや見直しは、今日進めるとスムーズです。`,
        `よい判断力が働きます。価格だけでなく、使う回数と満足度を比べて選びましょう。`
      ],
      4: [
        `堅実な選択ができる日です。買う前に用途を一つ確認すると、満足のいく支出になります。`,
        `小さな見直しが今後の余裕につながります。固定費や予定支出を一項目だけ確認して。`,
        `必要なものと欲しいものを上手に分けられそう。予算を決めてから選ぶと安心です。`
      ],
      3: [
        `収支のバランスを整えたい日です。財布や口座を5分だけ確認し、現在地を把握して。`,
        `大きく増やすより、無駄を一つ減らす意識が有効です。使っていないサービスを見直して。`,
        `普段どおりの堅実さが味方します。迷う買い物は一晩置き、本当に必要か確かめましょう。`
      ],
      2: [
        `気分転換の衝動買いに注意したい日です。欲しい物はいったんメモへ移し、今日は決めないで。`,
        `安さだけを理由に選ぶと後悔しやすいかも。金額より、最後まで使えるかを基準にして。`,
        `予定外の出費へ備え、今日は余白を残しましょう。支払い期限の確認だけでも十分です。`
      ],
      1: [
        `大きな買い物や契約は急がないで。今日は残高と予定を確認し、守りを優先しましょう。`,
        `不安から極端な判断をしないこと。必要な支払いを整理し、できる範囲から落ち着いて。`,
        `お金のことで自分を責めなくて大丈夫です。今日は新しい支出を増やさず、状況確認に集中して。`
      ]
    },
    work: {
      5: [
        `集中力と判断力が高まる日です。最重要の仕事から着手し、午前中に流れをつくって。`,
        `あなたの提案が届きやすい一日です。考えを簡潔に整理し、自信を持って共有しましょう。`,
        `難しい課題にも手応えを得られそう。最初の15分を深い作業へ使うと勢いがつきます。`
      ],
      4: [
        `段取りのよさが成果につながります。今日終えることを三つ以内に絞ってから始めて。`,
        `周囲との連携がスムーズな日です。重要な確認や相談は、早めに共有しましょう。`,
        `丁寧な仕事が評価されます。完成度を上げる前に、まず一度形にして見せて。`
      ],
      3: [
        `優先順位を明確にすると安定します。急ぎと重要を分け、目の前の一つへ集中して。`,
        `小さな区切りを作ると進みやすい日です。25分取り組んだら、短く休憩を入れましょう。`,
        `いつもの手順を丁寧に守ることが近道です。不明点は早めに一つだけ確認して。`
      ],
      2: [
        `抱え込みすぎると効率が下がりそう。期限と優先順位を確認し、必要なら早めに相談して。`,
        `手戻りを防ぐことが今日の成果です。着手前に目的と完了条件を一度確かめましょう。`,
        `集中が途切れやすい日は、作業を15分単位へ小さく分けて。通知を一つ減らすのも有効です。`
      ],
      1: [
        `無理に成果を増やそうとしないで。最低限終える一つを決め、確実に完了させましょう。`,
        `判断を急ぐより、情報をそろえることが先です。重要な決定は可能なら明日へ回して。`,
        `疲れが仕事へ影響しやすい日です。短い休憩を確保し、ミスを防ぐ確認を増やしましょう。`
      ]
    },
    health: {
      5: [
        `心身ともに軽やかに動けそうです。朝の深呼吸と短い散歩で、心地よいリズムを広げて。`,
        `元気を前向きに使える日です。好きな音楽に合わせて、無理のない範囲で体を動かしましょう。`,
        `回復力が高まりやすい一日です。水分と食事を丁寧に取り、好調な流れを育てて。`
      ],
      4: [
        `穏やかな調子を保てそうです。座り続ける前に一度立ち、肩と背中をゆっくり伸ばして。`,
        `生活の小さな工夫が元気につながります。いつもより少し早めの休憩を予定に入れましょう。`,
        `体の声を素直に聞ける日です。心地よい食事と軽い運動を一つずつ選んで。`
      ],
      3: [
        `頑張る時間と休む時間のバランスが大切です。一区切りごとに姿勢と呼吸を整えましょう。`,
        `いつものペースを守るほど安定します。水分を手元に置き、こまめにひと息入れて。`,
        `小さなセルフケアが役立つ日です。目や肩を休ませる5分を先に確保しましょう。`
      ],
      2: [
        `少し疲れを感じたら、早めに休む合図です。予定を一つ減らし、温かい時間を作って。`,
        `調子を上げようと急がなくて大丈夫です。消化のよい食事と静かな休憩を優先しましょう。`,
        `今日は省エネで過ごすほど明日が軽くなります。無理のない歩幅と十分な水分を意識して。`
      ],
      1: [
        `元気が出ない自分を責めなくて大丈夫です。まず横になる、温める、深呼吸するの一つを選んで。`,
        `回復を最優先にしたい日です。できることを減らし、安心して休める時間を確保しましょう。`,
        `体調の変化にはやさしく慎重に向き合って。無理をせず、必要なら周囲や専門家を頼ってください。`
      ]
    }
  };

  const variants = messages[axis][stars];
  const message = variants[variantIndex % variants.length];
  const lens = axis === "overall" ? "" : themeAxisLens(themeId, axis);
  return lens ? `${message} ${lens}` : message;
}

const DAILY_OPENINGS = [
  "朝の小さな選択が、夕方の安心につながる日です。",
  "今日は、気持ちを整えるほど次の一歩が見えやすくなります。",
  "何気ない会話や予定の中に、うれしい転機の種が隠れています。",
  "急いで答えを出さなくても、丁寧に向き合ったことが形になりそうです。",
  "いつもの景色の中で、自分らしさを取り戻せる瞬間があります。",
  "今のあなたに必要なものは、遠くではなく手の届くところにあります。",
  "今日は、後回しにしていた気持ちへ優しく光を当てられる日です。",
  "小さな違和感を見過ごさないことが、心地よい一日を作ります。",
  "思いがけない言葉が、次の行動を後押ししてくれるかもしれません。",
  "自分のために選んだ時間が、周りとの関係にも良い余白を生みます。",
  "完璧に始めるより、今の自分にできる形で動き出すことが大切です。",
  "今日は、これまでの頑張りを静かに受け取る場面がありそうです。",
  "迷いがあるからこそ、本当に大切にしたいことがはっきりしてきます。",
  "ひとつのことを丁寧に扱うほど、気持ちの流れが穏やかに整います。",
  "少し立ち止まる時間が、次に進むための確かな準備になります。",
  "人と比べない選択が、あなたらしい魅力をいちばん引き出します。",
  "今日は、見えないところで積み重ねてきたことが力を発揮しそうです。",
  "気になっていたことへ、無理のない一歩を向ける好機です。",
  "心がふっと軽くなる方を選ぶと、今日の流れに乗りやすくなります。",
  "やさしく断ることも、前向きに進むための大切な行動になります。",
  "今の自分を信じて言葉にすると、新しい可能性がひらきます。",
  "今日は、身の回りを少し整えるだけで気分まで変わっていきます。",
  "小さな約束を守ることが、思っている以上の自信につながります。",
  "予想どおりに進まない場面にも、あなたの工夫が生きる余地があります。",
  "誰かの期待より、自分が納得できる選択を大切にしたい一日です。"
];

const DAILY_FOCUSES = [
  "午前中に、今日いちばん大切にしたいことを一つだけ言葉にしてみてください。",
  "返信や決断を急ぐ前に、深呼吸を三回すると気持ちの軸が戻ります。",
  "気になっている人や場所へ、短くても自分から明るい合図を送ってみましょう。",
  "予定に五分の余白を入れると、焦りではなく工夫で一日を進められます。",
  "机、バッグ、画面のどれか一つを整えることが、思考の整理にもつながります。",
  "迷うことはメモに書き出し、今すぐ決めることと後で考えることを分けましょう。",
  "感謝を一つ伝えると、あなた自身の心にもあたたかな余韻が残ります。",
  "最初の十五分だけ集中したいことへ使うと、その後の流れが軽くなります。",
  "今日は、できなかったことより、すでに進めたことを一つ数えてください。",
  "予定外の出来事には、正解を急がず『今できること』から手をつけましょう。",
  "心が疲れたら、画面から目を離して飲み物を一口。小さな休息が判断を助けます。",
  "大切な話ほど、結論を一つだけ決めてから言葉にするとまっすぐ届きます。",
  "買い物や約束は、明日の自分も心地よいかを想像して選んでください。",
  "夕方には、今日うれしかったことを一つ思い出す時間を作りましょう。",
  "周りの速さに合わせすぎず、自分の呼吸が整うペースを選んで大丈夫です。"
];

function strongestAxis(axes) {
  return AXES.slice(1).sort((a, b) => axes[b].score - axes[a].score)[0];
}

function dailyAxisAction(axis, stars) {
  const actions = {
    love: stars >= 4
      ? "人との縁が動きやすいので、好意や感謝を短い言葉で届けると、思いがけず心地よい返事が返ってくるでしょう。"
      : "人とのことは答えを急がず、相手にも自分にも余白を残すと、穏やかな関係を育てられます。",
    money: stars >= 4
      ? "お金や暮らしの感覚が冴えています。必要なものを一つ見極めると、未来の安心につながる選択になりそうです。"
      : "お金のことは大きく動かすより、残高や予定を一項目だけ確かめると、不安が具体的な安心へ変わります。",
    work: stars >= 4
      ? "仕事や学びでは、先に大事な一件へ手をつけてください。あなたの丁寧さが、今日の信頼と手応えを作ります。"
      : "仕事や学びでは、目の前の作業を小さく分けるのが近道です。一つ終えるたびに、次の一歩が見えやすくなります。",
    health: stars >= 4
      ? "心と体のリズムが味方します。軽く歩く、伸ばす、早めに休むなど、気持ちよい習慣を一つ続けてみましょう。"
      : "心と体には、少し早めの休息を贈ってください。頑張る量を減らす選択が、明日の軽やかさを育てます。"
  };

  return actions[axis];
}

function dailyRhythmNote(dayVector, overallStars) {
  const rhythms = [
    "静かな波。予定を詰める前に呼吸を整えると、自分の本音が聞こえてきます。",
    "ひらく波。気になったことへ一歩近づくほど、今日の景色が明るく変わります。",
    "満ちる波。受け取った好意や小さな達成を、そのまま喜んで大丈夫です。",
    "整える波。やることを減らし、いちばん大切な一つへ心を向けましょう。",
    "つながる波。短い会話や挨拶から、思いがけない安心が生まれそうです。",
    "進める波。迷いが残っていても、最初の工程だけ始めれば流れが変わります。",
    "休ませる波。少しの余白を作ることが、明日の自分を助ける準備になります。",
    "育てる波。すぐに答えを求めず、続けたい習慣へ静かに時間を使いましょう。",
    "選ぶ波。周りの期待より、あなたが心地よく続けられる方を選んでください。",
    "ほどく波。抱え込みすぎたことを一つ手放すと、心に新しい余白が戻ります。"
  ];
  const index = (dayVector.dayOfYear - 1) % rhythms.length;
  const encouragement = overallStars <= 2
    ? "今日は小さく整えるだけで、十分に前へ進んでいます。"
    : overallStars >= 4
      ? "この軽やかな流れを、あなたらしい行動へつなげてみましょう。"
      : "自分のリズムを守るほど、今日の流れは味方になります。";

  return `今日のリズム：${rhythms[index]} ${encouragement}`;
}

function dailyFortuneNarrative({ dayVector, axes, themeLabel }) {
  const dayIndex = dayVector.dayOfYear - 1;
  const opening = DAILY_OPENINGS[dayIndex % DAILY_OPENINGS.length];
  const focus = DAILY_FOCUSES[Math.floor(dayIndex / DAILY_OPENINGS.length)];
  const stars = axes.overall.stars;
  const tone = {
    5: `「${themeLabel}」を合図に、遠慮していた一歩へ手を伸ばせる日です。`,
    4: `「${themeLabel}」を意識すると、普段の行動がうれしい流れへつながります。`,
    3: `今日の鍵は「${themeLabel}」。無理のない選択を重ねるほど、心地よい流れが育ちます。`,
    2: `「${themeLabel}」を小さく実践して、今日は自分のペースを守りましょう。`,
    1: `「${themeLabel}」を心に置き、できることを一つ選べれば十分です。`
  }[stars];
  const axis = strongestAxis(axes);

  return `${opening} ${tone} ${dailyAxisAction(axis, axes[axis].stars)} ${focus}`;
}

export async function generateDailyFortune(profile, targetDate=new Date(), themeData=[], contentData={}) {
  const [profileVector,dayVector]=await Promise.all([createProfileVector(profile),createDayVector(targetDate)]);
  const signals=createSignals(profileVector,dayVector);
  const axes=shapeDailyRhythm(
    calculateAxes(signals,dayVector.hash),
    dayVector,
    profileVector
  );
  const theme=selectTheme(signals,axes,themeData,dayVector.seasonId,profileVector.hash+dayVector.hash);
  const variants = Array.isArray(contentData[theme.id])
    ? contentData[theme.id]
    : [contentData[theme.id] || {}];
  const seed = parseInt(
    `${profileVector.hash}${dayVector.hash}`.slice(0, 8),
    16
  );
  const seasonMatches = variants.filter(
    item => item.season === dayVector.seasonId ||
      (dayVector.seasonId.includes("spring") && item.season === "spring") ||
      (["early_summer", "rainy", "summer"].includes(dayVector.seasonId) &&
        item.season === "summer") ||
      (dayVector.seasonId === "autumn" && item.season === "autumn") ||
      (["early_winter", "winter"].includes(dayVector.seasonId) &&
        item.season === "winter")
  );
  const candidates = seasonMatches.length ? seasonMatches : variants;
  const c = candidates[seed % candidates.length] || {};

  const luckyColors = [
    { label: "モーニングネイビー", value: "#0b1830" },
    { label: "やわらかい金色", value: "#d9b46f" },
    { label: "若葉グリーン", value: "#77966d" },
    { label: "空色", value: "#759bbd" },
    { label: "桜色", value: "#d8a5ad" },
    { label: "生成り", value: "#e8dfcf" },
    { label: "葡萄色", value: "#79566e" },
    { label: "珊瑚色", value: "#cf806b" }
  ];
  const luckyHours = [7, 8, 9, 10, 11, 12, 14, 15, 16, 18, 19, 20];
  const colorIndex = parseInt(dayVector.hash.slice(8, 10), 16) % luckyColors.length;
  const hourIndex = parseInt(profileVector.hash.slice(8, 10), 16) % luckyHours.length;
  const luckyHour = luckyHours[hourIndex];
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
      id: c.id || theme.id,
      season: c.season || dayVector.seasonId,
      lead:c.lead || `今日は「${theme.label}」がテーマです。`,
      key:c.key || "一つずつ、丁寧に進める。",
      promise:c.promise || "今日の自分に合う歩幅を選びます。",
      action:c.action || "深呼吸して、最初の一歩を決める。",
      nightPrompt:
        c.nightPrompt || "できたことを一つ見つけて、今日を閉じましょう。",
      luckyColor: luckyColors[colorIndex],
      luckyTime: `${String(luckyHour).padStart(2, "0")}:00〜${String(luckyHour + 1).padStart(2, "0")}:00`,
      dailyFortune: dailyFortuneNarrative({ dayVector, axes, themeLabel: theme.label }),
      dailyRhythm: dailyRhythmNote(dayVector, axes.overall.stars),
      axisMessages:Object.fromEntries(
        AXES.map((axis, index) => [
          axis,
          axisMessage(
            axis,
            axes[axis].stars,
            theme.id,
            theme.label,
            seed + index + parseInt(dayVector.hash.slice(10, 12), 16)
          )
        ])
      )
    }
  };
}

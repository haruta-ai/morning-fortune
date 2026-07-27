import{APP_CONFIG}from"./config.js";
import{database}from"./database.js";
import{validateBackup}from"./models.js";
import{downloadJson,readJsonFile,toLocalDateKey}from"./utils.js";
const diagnostics=document.querySelector("#diagnostics"),refresh=document.querySelector("#refreshDiagnostics"),exportButton=document.querySelector("#exportButton"),importInput=document.querySelector("#importInput"),message=document.querySelector("#studioMessage");
async function render(){
 const rows=[];
 try{
  await database.ready();
  for(const [label,store]of[["プロフィール","profiles"],["占い結果","dailyResults"],["分析イベント","analyticsEvents"]])rows.push([label,`${(await database.getAll(store)).length}件`]);
  rows.unshift(["IndexedDB","正常"]);
  rows.push(["App Version",APP_CONFIG.appVersion],["Engine Version",APP_CONFIG.engineVersion],["Content Version",APP_CONFIG.contentVersion]);
 }catch(e){rows.push(["IndexedDB",`エラー：${e.message}`]);}
 diagnostics.replaceChildren(...rows.map(([a,b])=>{const d=document.createElement("div");d.className="diagnostic-row";d.innerHTML=`<span>${a}</span><strong>${b}</strong>`;return d;}));
}
refresh.addEventListener("click",render);
exportButton.addEventListener("click",async()=>{downloadJson(`every-morning-fortune-backup-${toLocalDateKey()}.json`,{format:"every-morning-fortune-backup",version:1,exportedAt:new Date().toISOString(),appVersion:APP_CONFIG.appVersion,data:await database.exportAll()});message.textContent="JSONバックアップを書き出しました。";});
importInput.addEventListener("change",async()=>{const[file]=importInput.files;if(!file)return;try{const p=await readJsonFile(file);validateBackup(p);await database.importAll(p.data);message.textContent="バックアップを復元しました。";await render();}catch(e){message.textContent=`読み込みに失敗しました：${e.message}`;}finally{importInput.value="";}});
render();

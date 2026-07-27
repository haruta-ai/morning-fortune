export function clamp(value,min,max){return Math.min(Math.max(Number(value),min),max);}
export function digitalRoot(value){let n=Math.abs(Number.parseInt(value,10)||0);while(n>9)n=String(n).split("").reduce((s,d)=>s+Number(d),0);return n;}
export function normalizeText(value){return String(value??"").normalize("NFKC").replace(/\s+/g," ").trim();}
export function uuid(){return globalThis.crypto?.randomUUID?globalThis.crypto.randomUUID():`emf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;}
export async function sha256Hex(text){
  const normalized=normalizeText(text);
  if(globalThis.crypto?.subtle){
    const data=new TextEncoder().encode(normalized);
    const digest=await globalThis.crypto.subtle.digest("SHA-256",data);
    return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
  }
  return fnv1aHex(normalized).repeat(8);
}
export function fnv1aHex(text){let h=0x811c9dc5;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,0x01000193);}return(h>>>0).toString(16).padStart(8,"0");}
export function toLocalDateKey(date=new Date()){return`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;}
export function formatJapaneseDate(date=new Date()){return new Intl.DateTimeFormat("ja-JP",{year:"numeric",month:"long",day:"numeric",weekday:"short"}).format(date);}
export function downloadJson(filename,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}
export async function readJsonFile(file){return JSON.parse(await file.text());}

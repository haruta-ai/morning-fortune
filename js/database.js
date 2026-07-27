import{APP_CONFIG}from"./config.js";
let dbPromise;
function openDatabase(){
 if(dbPromise)return dbPromise;
 dbPromise=new Promise((resolve,reject)=>{
  if(!("indexedDB"in globalThis)){reject(new Error("IndexedDBに対応していません。"));return;}
  const req=indexedDB.open(APP_CONFIG.databaseName,APP_CONFIG.databaseVersion);
  req.onupgradeneeded=()=>{const db=req.result;for(const name of APP_CONFIG.stores)if(!db.objectStoreNames.contains(name))db.createObjectStore(name,{keyPath:"id"});};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error("IndexedDBを開けませんでした。"));
 });
 return dbPromise;
}
export const database={
 ready(){return openDatabase();},
 async put(storeName,value){const db=await openDatabase();return new Promise((res,rej)=>{const tx=db.transaction(storeName,"readwrite");tx.objectStore(storeName).put(value);tx.oncomplete=()=>res(value);tx.onerror=()=>rej(tx.error);});},
 async get(storeName,id){const db=await openDatabase();return new Promise((res,rej)=>{const req=db.transaction(storeName,"readonly").objectStore(storeName).get(id);req.onsuccess=()=>res(req.result??null);req.onerror=()=>rej(req.error);});},
 async getAll(storeName){const db=await openDatabase();return new Promise((res,rej)=>{const req=db.transaction(storeName,"readonly").objectStore(storeName).getAll();req.onsuccess=()=>res(req.result??[]);req.onerror=()=>rej(req.error);});},
 async delete(storeName,id){const db=await openDatabase();return new Promise((res,rej)=>{const tx=db.transaction(storeName,"readwrite");tx.objectStore(storeName).delete(id);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);});},
 async exportAll(){const out={};for(const name of APP_CONFIG.stores)out[name]=await this.getAll(name);return out;},
 async importAll(payload){const db=await openDatabase();for(const name of APP_CONFIG.stores){const rows=Array.isArray(payload?.[name])?payload[name]:[];await new Promise((res,rej)=>{const tx=db.transaction(name,"readwrite");const store=tx.objectStore(name);store.clear();rows.forEach(row=>store.put(row));tx.oncomplete=res;tx.onerror=()=>rej(tx.error);});}}
};

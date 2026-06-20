
const KEY='shiftTrackerV2';
const $=i=>document.getElementById(i);
let db=JSON.parse(localStorage.getItem(KEY)||'{"history":[],"active":null}');

function save(){localStorage.setItem(KEY,JSON.stringify(db));}
function ms(v){const m=Math.floor(v/60000);return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
function now(){return new Date().toISOString()}
function sumBreaks(arr){return arr.reduce((a,b)=>a+(new Date(b.end)-new Date(b.start)),0)}

$('month').value=new Date().toISOString().slice(0,7);

startShift.onclick=()=>{
 if(db.active)return alert('Смена уже идёт');
 db.active={id:crypto.randomUUID(),start:now(),breaks:[],activeBreak:null};
 save();render();
}
startBreak.onclick=()=>{
 if(!db.active||db.active.activeBreak)return;
 db.active.activeBreak=now();save();render();
}
endBreak.onclick=()=>{
 if(!db.active?.activeBreak)return;
 db.active.breaks.push({start:db.active.activeBreak,end:now()});
 db.active.activeBreak=null;save();render();
}
endShift.onclick=()=>{
 if(!db.active)return;
 if(db.active.activeBreak){db.active.breaks.push({start:db.active.activeBreak,end:now()})}
 db.history.push({...db.active,end:now(),activeBreak:null});
 db.active=null;save();render();
}

function editShift(id){
 const s=db.history.find(x=>x.id===id); if(!s)return;
 const st=prompt('Начало YYYY-MM-DDTHH:MM',s.start.slice(0,16));
 const en=prompt('Конец YYYY-MM-DDTHH:MM',s.end.slice(0,16));
 if(st&&en){s.start=st;s.end=en;save();render();}
}
function delShift(id){
 if(confirm('Удалить смену?')){
 db.history=db.history.filter(x=>x.id!==id);save();render();
 }
}

exportBtn.onclick=()=>{
 const a=document.createElement('a');
 a.href=URL.createObjectURL(new Blob([JSON.stringify(db)],{type:'application/json'}));
 a.download='shift-backup.json';a.click();
}

importFile.onchange=e=>{
 const f=e.target.files[0]; if(!f)return;
 const r=new FileReader();
 r.onload=()=>{db=JSON.parse(r.result);save();render();}
 r.readAsText(f);
}

function render(){
 if(db.active){
  let sh=new Date()-new Date(db.active.start);
  let br=sumBreaks(db.active.breaks);
  if(db.active.activeBreak) br+=new Date()-new Date(db.active.activeBreak);
  status.textContent='Смена с '+new Date(db.active.start).toLocaleString();
  shift.textContent=ms(sh);breaks.textContent=ms(br);work.textContent=ms(sh-br);
 } else {
  status.textContent='Смена не начата';shift.textContent=breaks.textContent=work.textContent='00:00';
 }

 const month=$('month').value;
 const data=[...db.history].filter(x=>x.start.startsWith(month)).reverse();
 let total=0;
 history.innerHTML=data.map(s=>{
  const w=(new Date(s.end)-new Date(s.start))-sumBreaks(s.breaks);
  total+=w;
  return `<div class="item">
  <b>${new Date(s.start).toLocaleDateString()}</b><br>
  ${new Date(s.start).toLocaleString()} → ${new Date(s.end).toLocaleString()}<br>
  Паузы: ${ms(sumBreaks(s.breaks))} · Работа: ${ms(w)}
  <div class="actions">
   <button onclick="editShift('${s.id}')">✏️</button>
   <button onclick="delShift('${s.id}')">🗑️</button>
  </div></div>`
 }).join('');
 summary.textContent=`Смен: ${data.length} · Часов: ${ms(total)}`;
 save();
}

month.onchange=render;

if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js')}
setInterval(render,1000);render();

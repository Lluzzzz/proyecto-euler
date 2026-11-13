'use strict';
/**
 * Misión NASA 1962. Modelo didáctico: m v' = T - m g - k v, y' = v.
 * Las funciones se exponen a module.exports para facilitar las pruebas con Node.
 */
const DEFAULTS = Object.freeze({mass:1000,thrust:15000,gravity:9.81,drag:100,v0:0,y0:0,time:20,step:2});
const CSV_COLUMNS = ['n','t','vEuler','yEuler','vExact','yExact','errorV','errorY'];

function validate(p){
  for(const [key,value] of Object.entries(p)){
    if(!Number.isFinite(value)) throw new Error(`El campo «${key}» debe ser un número finito.`);
  }
  if(p.mass<=0) throw new Error('La masa debe ser mayor que cero.');
  if(p.gravity<0) throw new Error('La gravedad no puede ser negativa.');
  if(p.drag<=0) throw new Error('La resistencia k debe ser positiva.');
  if(p.thrust<=p.mass*p.gravity) throw new Error('Para el ascenso, el empuje debe superar al peso: T > mg.');
  if(p.v0<0) throw new Error('La velocidad inicial debe ser mayor o igual a cero en el escenario de ascenso.');
  if(p.y0<0) throw new Error('La altura inicial debe ser mayor o igual a cero.');
  if(p.time<=0 || p.step<=0) throw new Error('El tiempo final y el paso h deben ser positivos.');
  if(Math.ceil(p.time/p.step)>3000) throw new Error('Demasiadas iteraciones: usa como máximo 3000 pasos.');
  if(p.time>100000 || p.mass>1e9 || p.thrust>1e12) throw new Error('Los parámetros exceden el rango admitido por el simulador.');
  const b=p.drag/p.mass;
  if(!Number.isFinite(b)||b===0) throw new Error('La relación k/m debe ser un número positivo representable.');
  if(b*p.step>=1) throw new Error('Para asegurar una aproximación de Euler sin oscilaciones, utiliza h < m/k.');
  return p;
}
function exact(p,t){
  const a=p.thrust/p.mass-p.gravity,b=p.drag/p.mass;
  const vt=a/b,delta=p.v0-vt;
  const decay=-Math.expm1(-b*t); // 1-exp(-bt), precisión estable para bt pequeño
  const result={t,v:vt+delta*(1-decay),y:p.y0+vt*t+delta*decay/b};
  if(!Number.isFinite(result.v)||!Number.isFinite(result.y))throw new Error('La solución analítica produjo valores no finitos.');
  return result;
}
function solve(p){
  validate(p);
  const a=p.thrust/p.mass-p.gravity,b=p.drag/p.mass;
  let t=0,v=p.v0,y=p.y0,n=0;
  const rows=[];
  function append(){const ex=exact(p,t);const data={n,t,vEuler:v,yEuler:y,vExact:ex.v,yExact:ex.y,errorV:Math.abs(v-ex.v),errorY:Math.abs(y-ex.y)};
    if(Object.values(data).some(x=>!Number.isFinite(x)))throw new Error('La simulación produjo números no finitos.');rows.push(data);}
  append();
  const count=Math.ceil(p.time/p.step-1e-12);
  for(let i=0;i<count;i++){
    const dt=Math.min(p.step,p.time-t);
    if(dt<=0)break;
    const oldV=v; // Euler explícito: y usa v_n, no v_(n+1)
    y=y+dt*oldV;
    v=v+dt*(a-b*oldV);
    n++;t=i===count-1?p.time:Math.min(p.time,t+dt);
    append();
  }
  return rows;
}
function compareBase(){return [2,1,.5].map(h=>{const rows=solve({...DEFAULTS,step:h});return {step:h,steps:rows.length-1,final:rows[rows.length-1]};});}
function fmt(n,digits=4){return Number(n).toLocaleString('es-ES',{minimumFractionDigits:digits,maximumFractionDigits:digits});}
function valueFromForm(){const form=document.getElementById('params-form');const out={};for(const k of Object.keys(DEFAULTS)){const s=form.elements.namedItem(k).value;out[k]=s.trim()===''?NaN:Number(s);}return out;}
function renderChart(id,rows,series,unit){
  const parent=document.getElementById(id);const W=840,H=290,pad={l:70,r:18,t:17,b:49};
  const vals=rows.flatMap(r=>[r[series[0]],r[series[1]]]);const tMax=rows[rows.length-1].t;
  let lo=Math.min(0,...vals),hi=Math.max(0,...vals);if(hi===lo)hi=lo+1;
  const span=hi-lo;lo-=span*.06;hi+=span*.06;
  const x=t=>pad.l+(t/tMax)*(W-pad.l-pad.r),y=v=>pad.t+(hi-v)/(hi-lo)*(H-pad.t-pad.b);
  const safe=n=>Number(n).toFixed(2);
  const makePath=key=>rows.map((r,i)=>`${i===0?'M':'L'}${safe(x(r.t))},${safe(y(r[key]))}`).join(' ');
  let svg=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`;
  for(let j=0;j<=4;j++){const ty=pad.t+(H-pad.t-pad.b)*j/4;const val=hi-(hi-lo)*j/4;svg+=`<line class="grid-line" x1="${pad.l}" x2="${W-pad.r}" y1="${safe(ty)}" y2="${safe(ty)}"/><text x="${pad.l-12}" y="${safe(ty+4)}" font-size="11" text-anchor="end">${safe(val)}</text>`;}
  for(let j=0;j<=5;j++){const tx=pad.l+(W-pad.l-pad.r)*j/5;svg+=`<line class="grid-line" x1="${safe(tx)}" x2="${safe(tx)}" y1="${pad.t}" y2="${H-pad.b}"/><text x="${safe(tx)}" y="${H-pad.b+19}" font-size="11" text-anchor="middle">${safe(tMax*j/5)}</text>`;}
  svg+=`<line class="axis-line" x1="${pad.l}" x2="${W-pad.r}" y1="${H-pad.b}" y2="${H-pad.b}"/><text x="${W/2}" y="${H-7}" text-anchor="middle" font-size="12">Tiempo (s)</text><text x="14" y="${H/2}" font-size="11" transform="rotate(-90 14 ${H/2})" text-anchor="middle">${unit}</text>`;
  svg+=`<path class="euler-line" d="${makePath(series[0])}"/><path class="exact-line" d="${makePath(series[1])}"/>`;
  for(const r of rows.filter((_,i)=>i===0||i===rows.length-1)){svg+=`<circle cx="${safe(x(r.t))}" cy="${safe(y(r[series[0]]))}" r="3.5"/>`;}
  svg+='</svg>';parent.innerHTML=svg;
}
function populateTable(id,rows,keys){
  const tbody=document.querySelector(`#${id} tbody`);const frag=document.createDocumentFragment();
  for(const row of rows){const tr=document.createElement('tr');for(const k of keys){const td=document.createElement('td');td.textContent=(k==='n'||k==='steps')?String(row[k]):fmt(row[k]);tr.appendChild(td);}frag.appendChild(tr);}tbody.replaceChildren(frag);
}
function showComparison(){
  const c=compareBase();populateTable('comparison-table',c.map(r=>({step:r.step,steps:r.steps,vEuler:r.final.vEuler,yEuler:r.final.yEuler,errorV:r.final.errorV,errorY:r.final.errorY})),['step','steps','vEuler','yEuler','errorV','errorY']);
  const vCut=c[0].final.errorV/c[2].final.errorV,yCut=c[0].final.errorY/c[2].final.errorY;
  document.getElementById('comparison-message').textContent=`Con h = 0,5 s se usan 40 iteraciones (frente a 10 con h = 2 s), y los errores de velocidad y altura se reducen aproximadamente ${fmt(vCut,2)} veces y ${fmt(yCut,2)} veces, respectivamente. Resultados calculados con los datos base del desafío.`;
  document.getElementById('compare-tag').textContent='20 s / parámetros originales';
  document.getElementById('compare-section').classList.add('computed');
}
let lastRows=[];
function displayError(msg){const el=document.getElementById('validation');el.textContent=msg;el.hidden=false;const status=document.getElementById('status');status.textContent='CORRIGE LOS DATOS';status.classList.add('error');}
function compute(){
  document.getElementById('validation').hidden=true;
  for(const el of document.querySelectorAll('#params-form input'))el.removeAttribute('aria-invalid');
  try{
    const p=valueFromForm(),rows=solve(p),f=rows[rows.length-1];lastRows=rows;
    const ids={'metric-v':f.vEuler,'metric-y':f.yEuler,'metric-ev':f.errorV,'metric-ey':f.errorY};
    for(const [id,value] of Object.entries(ids))document.getElementById(id).textContent=fmt(value);
    document.getElementById('metric-caption').textContent=`t = ${fmt(p.time,2)} s · ${rows.length-1} iteraciones · analítica: v = ${fmt(f.vExact)} m/s, y = ${fmt(f.yExact)} m`;
    document.getElementById('equation-specific').textContent=`Para estos parámetros: dv/dt = ${fmt(p.thrust/p.mass-p.gravity,4)} − ${fmt(p.drag/p.mass,4)} v`;
    renderChart('velocity-plot',rows,['vEuler','vExact'],'Velocidad (m/s)');
    renderChart('height-plot',rows,['yEuler','yExact'],'Altura (m)');
    populateTable('iteration-table',rows,CSV_COLUMNS);
    document.getElementById('status').textContent='CÁLCULO COMPLETADO';document.getElementById('status').classList.remove('error');
    return true;
  }catch(err){displayError(err.message);return false;}
}
function exportCsv(){if(!lastRows.length)return;const header=['n','Tiempo (s)','Velocidad Euler (m/s)','Altura Euler (m)','Velocidad analítica (m/s)','Altura analítica (m)','Error absoluto velocidad (m/s)','Error absoluto altura (m)'];
const lines=[header.join(';'),...lastRows.map(row=>CSV_COLUMNS.map(k=>String(row[k])).join(';'))];const file=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download='iteraciones_euler_nasa.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
if(typeof document!=='undefined'){
  const form=document.getElementById('params-form');form.addEventListener('submit',e=>{e.preventDefault();compute();});
  form.addEventListener('input',()=>{compute();});
  document.getElementById('reset').addEventListener('click',()=>{for(const[k,v]of Object.entries(DEFAULTS))form.elements.namedItem(k).value=v;compute();showComparison();});
  document.getElementById('compare').addEventListener('click',()=>{showComparison();document.getElementById('compare-section').scrollIntoView({behavior:'smooth',block:'center'});});
  document.getElementById('csv-button').addEventListener('click',exportCsv);
  compute();showComparison();
}
if(typeof module!=='undefined'&&module.exports)module.exports={DEFAULTS,validate,exact,solve,compareBase};

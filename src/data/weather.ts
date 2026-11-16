export type OpenMeteoGrid={
 latitudes:number[];longitudes:number[];times:number[];
 u10:Float32Array;v10:Float32Array;u100:Float32Array;v100:Float32Array;
 temperature2m:Float32Array;humidity2m:Float32Array;precipitation:Float32Array;pressurePa:Float32Array;pbl:Float32Array;
};
export type OpenMeteoSample={u:number;v:number;w:number;temperatureK:number;humidity:number;precipitationMm:number;pressurePa:number;pblHeight:number};
let grid:OpenMeteoGrid|null=null;
const DEG=Math.PI/180;
const GRID_STEP=2.5;
const START='2010-04-14',END='2010-05-25';
export function setOpenMeteoGrid(value:OpenMeteoGrid|null){grid=value;}
export function hasOpenMeteoGrid(){return grid!==null;}
export function getOpenMeteoGridInfo(){return grid?{points:grid.latitudes.length*grid.longitudes.length,hours:grid.times.length}:null;}
const chunks=<T,>(a:T[],n:number)=>Array.from({length:Math.ceil(a.length/n)},(_,i)=>a.slice(i*n,(i+1)*n));
function toVector(speed:number,direction:number){const r=direction*DEG;return{u:-speed*Math.sin(r),v:-speed*Math.cos(r)};}
async function requestBatch(points:{lat:number;lon:number}[]){
 const url=new URL('https://archive-api.open-meteo.com/v1/archive');
 const q:Record<string,string>={latitude:points.map(p=>p.lat.toFixed(2)).join(','),longitude:points.map(p=>p.lon.toFixed(2)).join(','),start_date:START,end_date:END,hourly:'temperature_2m,relative_humidity_2m,precipitation,pressure_msl,wind_speed_10m,wind_direction_10m,wind_speed_100m,wind_direction_100m,boundary_layer_height',wind_speed_unit:'ms',timezone:'UTC',models:'era5'};
 Object.entries(q).forEach(([k,v])=>url.searchParams.set(k,v));
 let lastMessage='알 수 없는 API 오류';
 for(let attempt=0;attempt<6;attempt++){
  try{
   const res=await fetch(url.toString());
   if(!res.ok){
    const body=(await res.text()).slice(0,500);
    const detail='HTTP '+res.status+(body?' · '+body:'');
    if(res.status===429||res.status===500||res.status===502||res.status===503||res.status===504){
     lastMessage=detail;
     const retryAfter=Number(res.headers.get('Retry-After'));
     const delay=Number.isFinite(retryAfter)&&retryAfter>0?retryAfter*1000:Math.min(20000,1500*Math.pow(2,attempt));
     if(attempt<5){await new Promise(r=>setTimeout(r,delay));continue;}
    }
    throw new Error('Open-Meteo 요청 실패: '+detail);
   }
   const data=await res.json();
   const payload=Array.isArray(data)?data:[data];
   if(payload.some((x:any)=>x?.error))throw new Error('Open-Meteo 오류: '+payload.map((x:any)=>x.reason||'요청 거부').join('; '));
   return payload;
  }catch(e){
   lastMessage=e instanceof Error?e.message:String(e);
   if(attempt<5)await new Promise(r=>setTimeout(r,Math.min(20000,1200*Math.pow(2,attempt))));
  }
 }
 throw new Error(lastMessage+' (6회 재시도 후 중단)');
}
export async function fetchOpenMeteoGrid(onProgress?:(done:number,total:number)=>void):Promise<OpenMeteoGrid>{
 const latitudes=Array.from({length:11},(_,i)=>45+i*GRID_STEP);
 const longitudes=Array.from({length:25},(_,i)=>-30+i*GRID_STEP);
 const points=latitudes.flatMap(lat=>longitudes.map(lon=>({lat,lon})));
 const batches=chunks(points,10),responses=new Array<any>(points.length);
 let done=0;
 for(const group of chunks(batches,3)){
  await Promise.all(group.map(async(batch)=>{
   const payload=await requestBatch(batch);
   if(payload.length!==batch.length)throw new Error('API 다중 좌표 응답 개수가 요청과 다릅니다. ('+payload.length+'/'+batch.length+')');
   const start=points.findIndex(p=>p.lat===batch[0].lat&&p.lon===batch[0].lon);
   batch.forEach((_,i)=>{responses[start+i]=payload[i];});
   done+=batch.length;onProgress?.(done,points.length);
  }));
 }
 const first=responses[0]?.hourly;
 if(!first?.time?.length)throw new Error('API 응답에 시간별 기상자료가 없습니다.');
 const times=(first.time as string[]).map((v:string)=>Date.parse(v.endsWith('Z')?v:v+'Z')/1000);
 if(times.some((v:number)=>!Number.isFinite(v)))throw new Error('API 시간 형식을 해석할 수 없습니다.');
 const n=times.length*points.length;
 const out:OpenMeteoGrid={latitudes,longitudes,times,u10:new Float32Array(n),v10:new Float32Array(n),u100:new Float32Array(n),v100:new Float32Array(n),temperature2m:new Float32Array(n),humidity2m:new Float32Array(n),precipitation:new Float32Array(n),pressurePa:new Float32Array(n),pbl:new Float32Array(n)};
 const fields=['temperature_2m','relative_humidity_2m','precipitation','pressure_msl','wind_speed_10m','wind_direction_10m','wind_speed_100m','wind_direction_100m','boundary_layer_height'];
 for(let pi=0;pi<responses.length;pi++){
  const h=responses[pi]?.hourly;if(!h||h.time?.length!==times.length)throw new Error('격자점 '+pi+'의 시간 배열 길이가 일치하지 않습니다.');
  for(const f of fields)if(!Array.isArray(h[f])||h[f].length!==times.length)throw new Error('API 응답 변수 누락: '+f);
  for(let ti=0;ti<times.length;ti++){
   const ix=ti*points.length+pi;
   const a=toVector(Number(h.wind_speed_10m[ti]),Number(h.wind_direction_10m[ti]));
   const b=toVector(Number(h.wind_speed_100m[ti]),Number(h.wind_direction_100m[ti]));
   out.u10[ix]=a.u;out.v10[ix]=a.v;out.u100[ix]=b.u;out.v100[ix]=b.v;
   out.temperature2m[ix]=Number(h.temperature_2m[ti])+273.15;
   out.humidity2m[ix]=Number(h.relative_humidity_2m[ti])/100;
   out.precipitation[ix]=Number(h.precipitation[ti]);
   out.pressurePa[ix]=Number(h.pressure_msl[ti])*100;
   out.pbl[ix]=Number(h.boundary_layer_height[ti]);
  }
 }
 for(const k of ['u10','v10','u100','v100','temperature2m','humidity2m','pressurePa'] as const)for(let i=0;i<out[k].length;i++)if(!Number.isFinite(out[k][i]))throw new Error('기상 격자에 누락/비정상 값이 있습니다: '+k);
 return out;
}
function bracket(a:number[],v:number):[number,number,number]{if(v<=a[0])return[0,0,0];const n=a.length-1;if(v>=a[n])return[n,n,0];let l=0,h=n;while(h-l>1){const m=(l+h)>>1;if(a[m]<=v)l=m;else h=m;}return[l,h,(v-a[l])/(a[h]-a[l])];}
const mix=(a:number,b:number,f:number)=>a+(b-a)*f;
export function sampleOpenMeteo(lat:number,lon:number,z:number,timeSeconds:number):OpenMeteoSample|null{
 const g=grid;if(!g)return null;
 const [t0,t1,ft]=bracket(g.times,timeSeconds),[y0,y1,fy]=bracket(g.latitudes,lat);
 let L=lon;while(L<g.longitudes[0])L+=360;while(L>g.longitudes[g.longitudes.length-1])L-=360;
 const [x0,x1,fx]=bracket(g.longitudes,L),ny=g.latitudes.length,nx=g.longitudes.length;
 const idx=(t:number,y:number,x:number)=>t*ny*nx+y*nx+x;
 const spatial=(a:Float32Array,t:number)=>mix(mix(a[idx(t,y0,x0)],a[idx(t,y0,x1)],fx),mix(a[idx(t,y1,x0)],a[idx(t,y1,x1)],fx),fy);
 const interp=(a:Float32Array)=>mix(spatial(a,t0),spatial(a,t1),ft);
 const u10=interp(g.u10),v10=interp(g.v10),u100=interp(g.u100),v100=interp(g.v100);
 let u:number,v:number;
 if(z<=10){const f=Math.max(0,z/10);u=u10*f;v=v10*f;}
 else if(z<=100){const f=Math.log(z/10)/Math.log(10);u=mix(u10,u100,f);v=mix(v10,v100,f);}
 else{const scale=Math.min(1.8,Math.pow(z/100,0.14));u=u100*scale;v=v100*scale;}
 const temp=Math.max(180,interp(g.temperature2m)-0.0065*Math.max(0,z-2));
 const pressure=interp(g.pressurePa)*Math.exp(-9.80665*Math.max(0,z)/(287.05*Math.max(180,(interp(g.temperature2m)+temp)/2)));
 const out={u,v,w:0,temperatureK:temp,humidity:interp(g.humidity2m),precipitationMm:interp(g.precipitation),pressurePa:pressure,pblHeight:interp(g.pbl)};
 return Object.values(out).every(Number.isFinite)?out:null;
}

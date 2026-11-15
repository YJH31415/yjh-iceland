export type Era5Grid={schema:'yjhiceland-era5-v1';units:{u:'m/s';v:'m/s';w:'m/s';temperature:'K';specificHumidity:'kg/kg';altitude:'m'};times:number[];latitudes:number[];longitudes:number[];levels:number[];u:number[];v:number[];w:number[];temperature:number[];specificHumidity:number[]};
export type WindSample={u:number;v:number;w:number;temperature:number;specificHumidity:number};
let grid:Era5Grid|null=null;
const valid=(a:any)=>Array.isArray(a)&&a.length>0&&a.every(Number.isFinite);
const asc=(a:number[])=>a.every((v,i)=>i===0||v>a[i-1]);
export function validateEra5Grid(x:any):Era5Grid{
 if(x?.schema!=='yjhiceland-era5-v1')throw new Error('스키마 불일치');
 const {times,latitudes,longitudes,levels}=x;
 if(!valid(times)||!valid(latitudes)||!valid(longitudes)||!valid(levels)||!asc(times)||!asc(levels))throw new Error('시간과 고도는 오름차순 유효 숫자 배열이어야 합니다.');
 if(latitudes.length<2||longitudes.length<2||levels.length<2)throw new Error('위도·경도·고도 격자는 각각 2개 이상이어야 합니다.');
 const n=times.length*latitudes.length*longitudes.length*levels.length;
 for(const k of ['u','v','w','temperature','specificHumidity'])if(!valid(x[k])||x[k].length!==n)throw new Error(k+' 배열 크기가 격자와 다릅니다.');
 const u=x.units;if(u?.u!=='m/s'||u?.v!=='m/s'||u?.w!=='m/s'||u?.temperature!=='K'||u?.specificHumidity!=='kg/kg'||u?.altitude!=='m')throw new Error('단위 메타데이터가 누락되었거나 잘못되었습니다.');
 return x as Era5Grid;
}
export function setEra5Grid(x:Era5Grid|null){grid=x;}
export function hasEra5Grid(){return !!grid;}
function br(a:number[],v:number):[number,number,number]{if(v<=a[0])return[0,0,0];const n=a.length-1;if(v>=a[n])return[n,n,0];let l=0,h=n;while(h-l>1){const m=(l+h)>>1;if(a[m]<=v)l=m;else h=m;}return[l,h,(v-a[l])/(a[h]-a[l])];}
const mix=(a:number,b:number,f:number)=>a+(b-a)*f;
export function sampleEra5(lat:number,lon:number,z:number,time:number):WindSample|null{
 const g=grid;if(!g)return null;
 const [t0,t1,ft]=br(g.times,time),[z0,z1,fz]=br(g.levels,z);
 const inc=g.latitudes[0]<g.latitudes[g.latitudes.length-1],ys=inc?g.latitudes:[...g.latitudes].reverse();
 const [ya,yb,fy]=br(ys,lat),y0=inc?ya:g.latitudes.length-1-yb,y1=inc?yb:g.latitudes.length-1-ya;
 let L=lon;while(L<g.longitudes[0])L+=360;while(L>g.longitudes[g.longitudes.length-1])L-=360;
 const [x0,x1,fx]=br(g.longitudes,L);
 const idx=(t:number,zv:number,y:number,x:number)=>((t*g.levels.length+zv)*g.latitudes.length+y)*g.longitudes.length+x;
 const interp=(a:number[])=>{const at=(ti:number)=>{const q=(zz:number,yy:number,xx:number)=>a[idx(ti,zz,yy,xx)];const lo=mix(mix(q(z0,y0,x0),q(z0,y0,x1),fx),mix(q(z0,y1,x0),q(z0,y1,x1),fx),fy);const hi=mix(mix(q(z1,y0,x0),q(z1,y0,x1),fx),mix(q(z1,y1,x0),q(z1,y1,x1),fx),fy);return mix(lo,hi,fz);};return mix(at(t0),at(t1),ft);};
 const out={u:interp(g.u),v:interp(g.v),w:interp(g.w),temperature:interp(g.temperature),specificHumidity:interp(g.specificHumidity)};
 return Object.values(out).every(Number.isFinite)?out:null;
}
/** Arrays are flattened [time, altitude, latitude, longitude]. Times=Unix UTC seconds; levels=ascending geometric metres. Convert geopotential to geometric altitude and ERA5 omega (Pa/s) to geometric W (m/s) offline. */

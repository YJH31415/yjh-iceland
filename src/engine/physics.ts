import type {Particle,SimConfig} from './types';
const R=6371008.8, G=9.80665;
const rad=(x:number)=>x*Math.PI/180;
// Approximate ERA5-compatible field interface. Current demo wind is explicitly synthetic.
export function demoWind(lat:number,lon:number,z:number,t:number){
  const altitudeFactor=Math.min(1.8,0.45+z/9000); const jet=Math.sin(rad(lat*2+lon*.35+t*.7));
  return {u:(8+7*jet)*altitudeFactor,v:(3+5*Math.cos(rad(lon+lat*.6-t*.4)))*altitudeFactor,w:0.025*Math.sin(rad(lat*3+lon+t))};
}
export function makeParticle(id:number,t:number,c:SimConfig):Particle{
  const d=(c.minDiameter+Math.random()*(c.maxDiameter-c.minDiameter))*1e-6;
  const mass=Math.PI/6*c.particleDensity*d**3;
  return {id,lat:63.63+(Math.random()-.5)*.12,lon:-19.62+(Math.random()-.5)*.12,z:1651+Math.random()*c.plumeTop,u:0,v:0,w:0,diameter:d,density:c.particleDensity,mass,alive:true};
}
export function stepParticle(p:Particle,dt:number,t:number,c:SimConfig){
  if(!p.alive)return;
  const wind=demoWind(p.lat,p.lon,p.z,t); const rho=1.225*Math.exp(-Math.max(0,p.z)/8500); const area=Math.PI*p.diameter*p.diameter/4;
  const rel=Math.hypot(wind.u-p.u,wind.v-p.v,wind.w-p.w); const re=Math.max(1e-6,rho*rel*p.diameter/1.81e-5);
  const cd=re<1000?24/re*(1+0.15*Math.pow(re,.687)):.44;
  const drag=.5*cd*rho*area*rel/Math.max(p.mass,1e-20);
  const ax=drag*(wind.u-p.u), ay=drag*(wind.v-p.v), az=drag*(wind.w-p.w)-G;
  p.u+=ax*dt;p.v+=ay*dt;p.w+=az*dt;
  const noise=Math.sqrt(2*c.turbulence*dt); p.u+=(Math.random()-.5)*noise*.08;p.v+=(Math.random()-.5)*noise*.08;p.w+=(Math.random()-.5)*noise*.015;
  const north=p.v*dt,east=p.u*dt;p.lat+=north/R*180/Math.PI;p.lon+=east/(R*Math.max(.05,Math.cos(rad(p.lat))))*180/Math.PI;p.z+=p.w*dt;
  // Wrap longitude continuously; latitude is bounded only by physical globe coordinates.
  p.lon=((p.lon+540)%360)-180;
  if(p.z<=0){p.z=0;p.alive=false;} if(p.z>45000){p.z=45000;p.w=Math.min(0,p.w);}
}
export function concentrationAt(lat:number,lon:number,particles:Particle[],radiusKm=35){
  // Mass-conserving local box estimate; super-particle weights are represented by particle.mass.
  const volume=Math.PI*(radiusKm*1000)**2*1500; let mass=0;
  for(const p of particles){if(!p.alive)continue;const dy=(p.lat-lat)*111.2,dx=(p.lon-lon)*111.2*Math.cos(rad(lat));if(dx*dx+dy*dy<radiusKm*radiusKm)mass+=p.mass*1e9;}
  return mass/volume*1e6; // mg/m3; demo particle weights are illustrative, not calibrated.
}
export function alertLevel(v:number){return v>=10?'매우 높음':v>=5?'높음':v>=2?'중간':v>=.2?'낮음':'매우 낮음';}

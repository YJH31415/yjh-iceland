import type {Particle,SimConfig} from './types';
import {sampleOpenMeteo} from '../data/weather';
const R=6371008.8, G=9.80665, MU=1.81e-5;
const rad=(x:number)=>x*Math.PI/180;
const gaussian=()=>{const a=Math.max(1e-12,Math.random()),b=Math.random();return Math.sqrt(-2*Math.log(a))*Math.cos(2*Math.PI*b);};
export function demoWind(lat:number,lon:number,z:number,t:number){
  const altitudeFactor=Math.min(1.8,0.45+z/9000); const jet=Math.sin(rad(lat*2+lon*.35+t*.7));
  return {u:(8+7*jet)*altitudeFactor,v:(3+5*Math.cos(rad(lon+lat*.6-t*.4)))*altitudeFactor,w:0.025*Math.sin(rad(lat*3+lon+t))};
}
export function makeParticle(id:number,t:number,c:SimConfig,representedMassKg?:number):Particle{
  const d=(c.minDiameter+Math.random()*(c.maxDiameter-c.minDiameter))*1e-6;
  const grainMass=Math.PI/6*c.particleDensity*d**3;
  // mass is the physical ash mass represented by this computational super-particle.
  const mass=representedMassKg??grainMass;
  return {id,lat:63.63+(Math.random()-.5)*.12,lon:-19.62+(Math.random()-.5)*.12,z:1651+Math.random()*c.plumeTop,u:0,v:0,w:0,diameter:d,density:c.particleDensity,mass,alive:true};
}
export function stepParticle(p:Particle,dt:number,t:number,c:SimConfig){
  if(!p.alive||dt<=0)return;
  const met=sampleOpenMeteo(p.lat,p.lon,p.z,Date.UTC(2010,3,14)/1000+t*3600);const wind=met??demoWind(p.lat,p.lon,p.z,t),rho=met?Math.max(0.05,met.pressurePa/(287.05*met.temperatureK)):1.225*Math.exp(-Math.max(0,p.z)/8500);
  const rel=Math.max(0.001,Math.hypot(wind.u-p.u,wind.v-p.v,wind.w-p.w));
  const re=rho*rel*p.diameter/MU;
  const k=re<0.1?18*MU/(Math.max(1,p.density)*p.diameter*p.diameter):(3*(re<1000?24/re*(1+0.15*Math.pow(re,.687)):.44)*rho*rel)/(4*Math.max(1,p.density)*p.diameter);
  const decay=Math.exp(-Math.min(1e6,Math.max(0,k))*dt);
  const oldU=p.u,oldV=p.v,oldW=p.w;
  p.u=wind.u+(p.u-wind.u)*decay;p.v=wind.v+(p.v-wind.v)*decay;
  const terminalW=wind.w-G/Math.max(k,1e-9);p.w=terminalW+(p.w-terminalW)*decay;
  const hs=Math.sqrt(2*Math.max(0,c.turbulence)*dt),vs=Math.sqrt(2*Math.max(0,c.turbulence)*0.1*dt);
  const north=.5*(oldV+p.v)*dt+hs*gaussian(),east=.5*(oldU+p.u)*dt+hs*gaussian(),vertical=.5*(oldW+p.w)*dt+vs*gaussian();
  p.lat=Math.max(-89.999999,Math.min(89.999999,p.lat+north/R*180/Math.PI));
  p.lon=((p.lon+east/(R*Math.max(1e-6,Math.cos(rad(p.lat))))*180/Math.PI+540)%360)-180;
  p.z+=vertical;if(p.z<=0){p.z=0;p.alive=false;}if(p.z>45000){p.z=45000;p.w=Math.min(0,p.w);}
}
export function concentrationAt(lat:number,lon:number,particles:Particle[],radiusKm=35){
  // Ground-level city receptor: cylinder of radius 35 km and altitude 0–3 km.
  // kg -> mg is 1e6 (not 1e15); concentration is represented ash mass / receptor volume.
  const receptorHeight=3000,volume=Math.PI*(radiusKm*1000)**2*receptorHeight;let massKg=0;
  for(const p of particles){if(!p.alive||p.z<0||p.z>receptorHeight)continue;const dy=(p.lat-lat)*111.2,dx=(p.lon-lon)*111.2*Math.cos(rad(lat));if(dx*dx+dy*dy<radiusKm*radiusKm)massKg+=p.mass;}
  return massKg*1e6/volume;
}
export function alertLevel(v:number){return v>=10?'매우 높음':v>=5?'높음':v>=2?'중간':v>=.2?'낮음':'매우 낮음';}

export type Particle={id:number;lat:number;lon:number;z:number;u:number;v:number;w:number;diameter:number;density:number;mass:number;alive:boolean};
export type SimConfig={emissionRate:number;startHour:number;endHour:number;minDiameter:number;maxDiameter:number;particleDensity:number;turbulence:number;plumeTop:number;};
export type Sample={time:string;active:number;meanAltitude:number;maxDistance:number;area:number;concentrations:Record<string,number>};
export const CITIES=[{name:'런던',lat:51.5072,lon:-0.1276},{name:'파리',lat:48.8566,lon:2.3522},{name:'프랑크푸르트',lat:50.1109,lon:8.6821},{name:'오슬로',lat:59.9139,lon:10.7522},{name:'스톡홀름',lat:59.3293,lon:18.0686}];
export const DEFAULT_CONFIG:SimConfig={emissionRate:850,minDiameter:20,maxDiameter:250,particleDensity:2300,turbulence:35,plumeTop:8000,startHour:0,endHour:912};

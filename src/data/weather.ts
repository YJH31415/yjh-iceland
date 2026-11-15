/** Historical Open-Meteo downloader. It supplies surface/selected-level fields only;
 * do not treat it as a complete 3-D pressure-level atmospheric analysis. */
export async function fetchHistoricalWeather(lat:number,lon:number,start='2010-04-14',end='2010-05-25'){
 const url=new URL('https://archive-api.open-meteo.com/v1/archive');
 Object.entries({latitude:lat,longitude:lon,start_date:start,end_date:end,hourly:'temperature_2m,relative_humidity_2m,precipitation,pressure_msl,wind_speed_10m,wind_direction_10m,wind_speed_100m,wind_direction_100m',wind_speed_unit:'ms',timezone:'UTC'}).forEach(([k,v])=>url.searchParams.set(k,String(v)));
 const r=await fetch(url);if(!r.ok)throw new Error(`Open-Meteo 요청 실패: ${r.status}`);return r.json();
}
export type AtmosphereProvider='demo'|'era5';
export const ATMOSPHERE_STATUS={demo:'합성 3D 바람장 — 시각화·엔진 시험용',era5:'ERA5 pressure-level NetCDF/GRIB 어댑터 연결 필요'};

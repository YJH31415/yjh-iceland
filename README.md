# YJH's Iceland Volcano Simulator

React + TypeScript + Vite prototype for exploring Eyjafjallajökull ash dispersion.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Production build: `npm run build`.

## Current implementation

- Landing page with Replay and Experiment modes.
- MapLibre globe with monitoring locations and particle rendering.
- Shared Lagrangian particle engine for both modes; gravity, Reynolds-dependent drag approximation, altitude-dependent synthetic wind, stochastic turbulence, spherical-Earth horizontal displacement and longitude wrapping.
- Experiment controls lock while playback is running.
- 30-minute sample recording, city concentration estimates, threshold labels, chart, JSON/CSV exports.
- Optional Open-Meteo Archive API download cached in browser localStorage.

## Scientific limitations — read before interpreting output

This is a **software prototype, not a validated reconstruction of the 2010 event**. The live particle engine currently uses a synthetic 3-D wind field. Open-Meteo download is a surface/selected-height weather supplement; it does not provide the complete pressure-level 3-D atmospheric state needed for a defensible reconstruction. Its downloaded data are not yet wired into the particle integrator.

The demo emission rate and particle-size/source assumptions remain illustrative, and the concentration estimator is a coarse receptor-volume approximation. Super-particle weights conserve the configured emitted mass numerically, but do not make the source term historically validated. City concentration must not be used for aviation decisions. The particle integrator uses a spherical-Earth approximation rather than WGS84 ellipsoidal geodesy. The default source window spans 912 elapsed hours from 2010-04-14 as a provisional 38-day window; it is not a measured hourly eruption source series. The displayed 2010 start clock is a replay timeline, not proof of observed time-resolved source terms.

## ERA5 3-D grid import\n\nThe app accepts a preprocessed ERA5 grid JSON and interpolates U/V/W plus temperature and specific humidity in time, altitude, latitude and longitude. Import it with the ERA5 control in the footer. The grid is held in memory for the current page session and must be re-imported after reload. No ERA5 dataset is bundled.\n\nSchema: `schema: yjhiceland-era5-v1`; `units` must declare u/v/w in m/s, temperature in K, specificHumidity in kg/kg and altitude in m; `times` are ascending Unix UTC seconds; `levels` are ascending geometric altitude metres; arrays `u`, `v`, `w`, `temperature`, `specificHumidity` are flattened in `[time, level, latitude, longitude]` order. Convert ERA5 geopotential to geometric altitude and pressure vertical velocity omega (Pa/s) to geometric W (m/s) during preprocessing. Never place omega directly in the W field.\n\nThe synthetic wind field remains the fallback until a valid ERA5 grid is imported.\n\n## Required next scientific integration

1. Obtain ERA5 pressure-level data for 2010-04-14 through the required post-eruption transport period (U/V wind, vertical velocity, temperature, humidity, geopotential; surface precipitation/pressure as needed) from Copernicus CDS.
2. Convert GRIB/NetCDF to a documented local grid format and implement time/space/pressure-level interpolation. Do not interpolate wind direction angles; interpolate vector components.
3. Replace the synthetic field with the ERA5 provider and derive geometric altitude from geopotential.
4. Replace illustrative particle weights/source terms with cited, time-resolved eruption source parameters and particle-size distribution. Track uncertainty and provenance.
5. Implement validated dry/wet deposition, terrain interaction, mass-conserving concentration gridding and a documented city receptor-volume aggregation rule.
6. Replace spherical approximation with WGS84/ECEF or geodesic integration and test dateline/polar paths.
7. Validate against published ash-cloud observations and aviation-area records before describing the result as a historical reproduction.

## Data provenance

- Open-Meteo Historical Weather API: https://open-meteo.com/en/docs/historical-weather-api
- Copernicus Climate Data Store / ERA5: https://cds.climate.copernicus.eu/

## Safety

Not an operational aviation hazard product. Do not use for flight planning, air traffic control, or public warning decisions.

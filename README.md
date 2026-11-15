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
- One-click Open-Meteo Historical Weather API download for a regional 2.5° grid covering Iceland and Europe (2010-04-14 to 2010-05-25); hourly U/V components, temperature, humidity, precipitation, sea-level pressure and boundary-layer height are interpolated directly by the particle engine.

## Scientific limitations — read before interpreting output

This is a **software prototype, not a validated reconstruction of the 2010 event**. Click **대기장 불러오기** in the app footer to fetch the regional hourly grid directly from Open-Meteo. When loaded, the particle engine uses the interpolated historical 10 m and 100 m wind vectors. Between 10 m and 100 m, wind is interpolated logarithmically; above 100 m, a capped power-law profile is an explicitly approximate extrapolation. Vertical wind is set to zero. These are not observed pressure-level winds and do not constitute a true 3-D reanalysis atmosphere. If the API has not been loaded, the engine falls back to its synthetic demonstration wind.

The demo emission rate and particle-size/source assumptions remain illustrative, and the concentration estimator is a coarse receptor-volume approximation. Super-particle weights conserve the configured emitted mass numerically, but do not make the source term historically validated. City concentration must not be used for aviation decisions. The particle integrator uses a spherical-Earth approximation rather than WGS84 ellipsoidal geodesy. The default source window spans 912 elapsed hours from 2010-04-14 as a provisional 38-day window; it is not a measured hourly eruption source series. The displayed 2010 start clock is a replay timeline, not proof of observed time-resolved source terms.

## Open-Meteo API integration\n\nThe API client requests the region from 45°N–70°N and 30°W–30°E on a 2.5° grid, in small multi-location batches. The grid is kept in memory for the current browser session. It is downloaded again after a page reload. The API's hourly data are reanalysis products; the returned 10 m/100 m winds are converted from meteorological direction/speed to eastward U and northward V before interpolation. The UI reports download progress and failures.\n\n## Required next scientific integration

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

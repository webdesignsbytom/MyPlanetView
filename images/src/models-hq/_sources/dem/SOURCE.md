# Elevation tiles (real terrain)

Ground heights for the natural landmarks' dioramas, read by `elevation()` in `../../hq.py`: Mapzen's
Terrain Tiles (terrarium format, zoom 14, about 8 m a pixel, or zoom 12, about 30 m), from the Registry of Open Data on AWS,
https://registry.opendata.aws/terrain-tiles/ (`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`),
downloaded 26 Nov 2026, unchanged. Files are `<model>_<zoom>_<x>_<y>.png`.

The tiles are made from open sources, which their documentation asks to be credited:
https://github.com/tilezen/joerd/blob/master/docs/attribution.md. For these models: SRTM (NASA,
public domain) and, for Australia, Geoscience Australia's elevation data (© Commonwealth of Australia
(Geoscience Australia), CC BY 4.0). Credit wherever the model's picture is shown: "Terrain: Mapzen
Terrain Tiles; SRTM (NASA); © Commonwealth of Australia (Geoscience Australia), CC BY 4.0".

- `table_14_*`: Table Mountain, Cape Town (x 9028–9031, y 9834–9838).
- `uluru_14_*`: Uluru (x 14154–14156, y 9383–9386).
- `vesuvius_12_*`: Vesuvius, behind Pompeii (zoom 12, x 2210–2213, y 1538–1541).
- `sierra_12_*`: the Sierra Nevada, behind the Alhambra (zoom 12, x 2008–2012, y 1591–1594).

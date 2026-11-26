# Kilimanjaro in the high-quality look (hq.py), from the real ground (the open terrain tiles in
# _sources/dem/: SRTM): Africa's highest mountain seen from the north, as from the Kenyan side; Kibo's
# broad dome with the snow and ice on its flat top and its crater's rim, Mawenzi's jagged peak beside
# it, the saddle between; the mountain's bands from its foot up, the rainforest, the heath and moorland,
# the bare alpine desert, the snow; giant groundsels and heather on the moorland. Heights drawn at 3 times
# their real height (the mountain is very broad for its height).
# Run: blender -b --factory-startup -P kilimanjaro.py -- kilimanjaro-1024.png 1024 kilimanjaro.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1889)
M['forestKi'] = material('kiliForestFloor', '#3f6e2f', 0.9, vary='#4a7a36', vary_scale=14, bump=0.3, bump_scale=90)
M['heath'] = material('kiliHeath', '#8a8f52', 0.9, vary='#7d834a', vary_scale=14, bump=0.3, bump_scale=120)
M['alpine'] = material('kiliAlpineDesert', '#8f7f6c', 0.9, vary='#7f705f', vary_scale=14, bump=0.4, bump_scale=120)
M['scree'] = material('kiliScree', '#6f655c', 0.9, vary='#62594f', vary_scale=20, bump=0.4, bump_scale=200)
M['snowKi'] = material('kiliSnow', '#f3f6f8', 0.5, vary='#e2e9ee', vary_scale=20, bump=0.1, bump_scale=120)
M['canopy'] = material('kiliRainforest', '#2f6f30', 0.85, vary='#3c7f39', vary_scale=14, bump=0.3, bump_scale=90)
M['groundsel'] = material('giantGroundsel', '#4f6a35', 0.85, vary='#5c7a3d', vary_scale=14, bump=0.3, bump_scale=90)

LAT0, LON0 = -3.072, 37.376     # near Kibo, Mawenzi towards the edge
RADIUS_M = 11000.0
MPU = RADIUS_M / 1.45
BASE = 2700.0
EXAG = 3.0
elev = elevation('kilimanjaro', 11)
to = geo(LAT0, LON0, MPU, turn=148.0)       # seen from the north
RIM = 30.0 / MPU


def H(x, y):
    g = max(0.0, elev(*to(x, y)) - BASE) * EXAG
    fade = min(1.0, max(0.0, (1.47 - math.hypot(x, y)) / 0.2))
    fade = fade * fade * (3 - 2 * fade)
    return RIM + (g / MPU - RIM) * fade


def pick(z, nz, x, y):
    m = elev(*to(x, y)) + 60.0 * math.sin(x * 23.0 + y * 17.0)
    if m > 5300.0 and nz > 0.5:
        return 4                                    # the snow and ice on the top
    if m > 4300.0:
        return 3 if nz < 0.75 else 2                # scree on the steep faces, alpine desert
    if m > 2900.0:
        return 1                                    # heath and moorland
    return 0                                        # the rainforest's floor


land = terrain('kilimanjaro', H, [M['forestKi'], M['heath'], M['alpine'], M['scree'], M['snowKi']], pick, rings=400, segs=1000)
CANOPY = []
for p in scatter_on(land, 40000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: m == 0 and math.hypot(p.x, p.y) < 1.36, seed=4):
    CANOPY.append(((p.x, p.y, p.z + 0.006), rng.uniform(0.012, 0.02), 0.7))
    if len(CANOPY) >= 900:
        break
blob_cloud('rainforest', M['canopy'], CANOPY)
SHRUBS = []
for p in scatter_on(land, 20000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: m == 1 and math.hypot(p.x, p.y) < 1.36, seed=9):
    SHRUBS.append(((p.x, p.y, p.z + 0.004), rng.uniform(0.007, 0.013), 0.9))
    if len(SHRUBS) >= 700:
        break
blob_cloud('moorland', M['groundsel'], SHRUBS)
render('kilimanjaro')

# Table Mountain in the high-quality look (hq.py), from the real ground (the open terrain tiles in
# _sources/dem/: SRTM): Cape Town's flat-topped mountain seen from the city, its long level summit and
# the grey sandstone cliffs of its north face, Devil's Peak to the left and Lion's Head to the right,
# the fynbos on their slopes, the city bowl's parks at their feet; the aerial cableway up the face with
# its red rotating car between the two stations. Heights drawn 1.8 times their real height.
# Run: blender -b --factory-startup -P table-mountain.py -- table-mountain-1024.png 1024 table-mountain.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1929)
M['cliff'] = layered('tableSandstone', ['#a29a8f', '#b2aa9e', '#958d83', '#aaa296'], scale=30.0, distortion=1.0, rough=0.85, bump=0.4, bump_scale=60)
M['fynbos'] = material('fynbos', '#647b40', 0.9, vary='#566c37', vary_scale=14, bump=0.35, bump_scale=200)
M['summit'] = material('summitRock', '#a0a38f', 0.85, vary='#8f927e', vary_scale=10, bump=0.4, bump_scale=120)
M['parkland'] = material('parkland', '#8cb05a', 0.85, vary='#7ea24f', vary_scale=10, bump=0.2, bump_scale=200)
M['station'] = material('station', '#e9e4da', 0.6)
M['cabinRed'] = material('cabinRed', '#c8262b', 0.4, coat=0.4)
M['cable'] = material('cable', '#3c3f44', 0.5, metallic=0.6)

LAT0, LON0 = -33.944, 18.4188       # the disc's middle: Lion's Head, Devil's Peak and the table all on it
RADIUS_M = 3200.0                   # the disc's radius on the ground
MPU = RADIUS_M / 1.45               # metres to a tile unit
EXAG = 1.8                          # heights drawn this many times their real height
elev = elevation('table', 14)
to = geo(LAT0, LON0, MPU, turn=180.0)        # north towards the camera: the face Cape Town sees


def ground_m(x, y):
    return max(0.0, elev(*to(x, y)))


RIM = 25.0 * EXAG / MPU             # the land eased down to this by the base's edge


def H(x, y):
    g = ground_m(x, y)
    fade = min(1.0, max(0.0, (1.46 - math.hypot(x, y)) / 0.2))
    fade = fade * fade * (3 - 2 * fade)
    return RIM + (g * EXAG / MPU - RIM) * fade


def pick(z, nz, x, y):
    m = z * MPU / EXAG                  # back to metres
    if nz < 0.45 and m > 600:
        return 1                        # the sandstone cliffs
    if m > 950:
        return 2                        # the summit
    if m < 110 and nz > 0.8:
        return 3                        # the city bowl's parks and the shore
    return 4                            # fynbos


terrain('mountain', H, [M['fynbos'], M['cliff'], M['summit'], M['parkland'], M['fynbos']], pick, rings=260, segs=640)

# ------------------------------------------------------------------ the aerial cableway
def at(lat, lon):
    north = (lat - LAT0) * 111320.0
    east = (lon - LON0) * 111320.0 * math.cos(math.radians(LAT0))
    x, y = -east / MPU, -north / MPU
    return Vector((x, y, G + H(x, y)))


low, high = at(-33.94806, 18.40278), at(-33.95694, 18.40306)
box('lowerStation', M['station'], low + Vector((0, 0, 0.02)), (0.07, 0.05, 0.04), bevel=0.003)
box('upperStation', M['station'], high + Vector((0, 0, 0.02)), (0.08, 0.06, 0.04), bevel=0.003)
for s_ in (-1, 1):
    a, b = low + Vector((s_ * 0.006, 0, 0.04)), high + Vector((s_ * 0.006, 0, 0.04))
    tube(f'cable{s_}', M['cable'], [a.lerp(b, t) - Vector((0, 0, 0.06 * math.sin(math.pi * t))) for t in (k / 20 for k in range(21))], 0.0015)
car = low.lerp(high, 0.55) + Vector((0, 0, 0.04 - 0.06 * math.sin(math.pi * 0.55) - 0.028))
cylinder('cabin', M['cabinRed'], 0.016, 0.02, car, segs=24)
cylinder('cabinGlass', M['window'], 0.0165, 0.007, car + Vector((0, 0, 0.008)), segs=24)
lathe('cabinRoof', M['white'], [(0.017, 0), (0.012, 0.006), (0.0, 0.008)], car + Vector((0, 0, 0.02)), segs=24)
print('CABLEWAY', [round(v, 3) for v in low], [round(v, 3) for v in high])

render('table-mountain')

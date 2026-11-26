# The Matterhorn in the high-quality look (hq.py), from the real ground (the open terrain tiles in
# _sources/dem/: SRTM and EU-DEM): the great hooked pyramid seen from the Zermatt side, the Hörnli ridge
# coming towards us between the east face and the north face, snow and ice on its ledges and the
# glaciers at its feet, bare rock on its steep faces, scree and alpine meadow below. Heights drawn at
# 1.2 times their real height, the rock of the upper faces given its ribs and gullies (the open data
# is too smooth to keep them).
# Run: blender -b --factory-startup -P matterhorn.py -- matterhorn-1024.png 1024 matterhorn.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
M['rockMH'] = material('matterhornRock', '#6b5e52', 0.85, vary='#7a6c5f', vary_scale=10, bump=0.5, bump_scale=80)
M['snowMH'] = material('matterhornSnow', '#f3f5f7', 0.55, vary='#e6ebef', vary_scale=20, bump=0.1, bump_scale=120)
M['scree'] = material('scree', '#9a948c', 0.9, vary='#8a847c', vary_scale=40, bump=0.4, bump_scale=300)
M['alpineMeadow'] = material('alpineMeadow', '#7ea252', 0.85, vary='#8daf5e', vary_scale=12, bump=0.3, bump_scale=200)

SUMMIT = (45.9763, 7.6586)
NE = 300.0 / 111320.0 * math.sqrt(0.5)
LAT0, LON0 = SUMMIT[0] + NE, SUMMIT[1] + NE / math.cos(math.radians(SUMMIT[0]))   # the disc's middle a little towards Zermatt
RADIUS_M = 1700.0                   # the disc's radius on the ground: the pyramid and the glaciers at its feet
MPU = RADIUS_M / 1.45               # metres to a tile unit
BASE = 2650.0                       # the height drawn at the base's top
elev = elevation('matterhorn', 13)
to = geo(LAT0, LON0, MPU, turn=193.0)       # the north-east, Zermatt's side, towards the camera


def ground_m(x, y):
    return elev(*to(x, y))


EXAG = 1.2                          # heights drawn this many times their real height
RIM = 30.0 / MPU                    # the land eased down to this by the base's edge


def crags(x, y, m):
    """Ribs and gullies on the high faces (metres): ridged waves at a few scales, only above 3,100 m."""
    e, n = x * MPU, y * MPU
    k = 1.0 - abs(math.sin(e / 47.0 + 0.6 * math.sin(n / 61.0))) + 0.5 * (1.0 - abs(math.sin(n / 29.0 + e / 83.0))) + 0.25 * (1.0 - abs(math.sin((e + n) / 17.0)))
    return 22.0 * k * min(1.0, max(0.0, (m - 3100.0) / 500.0))


def H(x, y):
    m = ground_m(x, y)
    g = max(0.0, m + crags(x, y, m) - BASE) * EXAG
    fade = min(1.0, max(0.0, (1.46 - math.hypot(x, y)) / 0.2))
    fade = fade * fade * (3 - 2 * fade)
    return RIM + (g / MPU - RIM) * fade


def pick(z, nz, x, y):
    m = z * MPU / EXAG + BASE           # back to metres above the sea
    if (nz > 0.86 and m > 2900.0) or (nz > 0.72 and m > 3700.0):
        return 1                        # the glaciers at its feet, and snow streaking the high faces' ledges
    if nz < 0.86 and m > 3050.0:
        return 0                        # the faces: bare dark rock
    if m < 2850.0 and nz > 0.8:
        return 3                        # alpine meadow
    return 2                            # scree


terrain('matterhorn', H, [M['rockMH'], M['snowMH'], M['scree'], M['alpineMeadow']], pick, rings=440, segs=1100)
render('matterhorn')

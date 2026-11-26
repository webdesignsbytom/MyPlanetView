# The Grand Canyon in the high-quality look (hq.py), from the real ground (the open terrain tiles in
# _sources/dem/: SRTM): the canyon at Grand Canyon Village seen from the north-west, the Colorado River
# winding through the dark schist of the inner gorge, the green-grey Tonto Platform above it, red buttes
# in front, and behind, the South Rim's wall rising in its bands of rock: the red-stained Redwall
# cliffs, the red ledges of the Supai, the deep red Hermit shale, the pale Coconino cliff and the cream
# Kaibab limestone on top, with its forest of pinyon and juniper. Each band drawn at the heights it
# has here; heights drawn at 1.25 times their real height, the cliff-forming rocks steeper and the
# platforms flatter than the open data has them, as the canyon's stair is.
# Run: blender -b --factory-startup -P grand-canyon.py -- grand-canyon-1024.png 1024 grand-canyon.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1919)
M['river'] = material('colorado', '#4f7f6d', 0.15, vary='#5c8d78', vary_scale=20, bump=0.05, bump_scale=60, coat=0.5)
M['vishnu'] = material('vishnuSchist', '#5c4b4b', 0.9, vary='#6b5857', vary_scale=40, bump=0.4, bump_scale=200)
M['tapeats'] = material('tapeats', '#7b5b44', 0.9, vary='#86664d', vary_scale=40, bump=0.3, bump_scale=200)
M['tonto'] = material('tontoPlatform', '#8f9468', 0.9, vary='#9ca274', vary_scale=30, bump=0.3, bump_scale=200)
M['redwall'] = material('redwall', '#b55a3c', 0.85, vary='#c26a49', vary_scale=30, bump=0.3, bump_scale=200)
M['supai'] = material('supai', '#cc6640', 0.85, vary='#d87a52', vary_scale=40, bump=0.3, bump_scale=200)
M['hermit'] = material('hermitShale', '#a8432c', 0.9, vary='#b65136', vary_scale=40, bump=0.3, bump_scale=200)
M['coconino'] = material('coconino', '#e3d1a6', 0.8, vary='#eadbb5', vary_scale=40, bump=0.3, bump_scale=200)
M['kaibab'] = material('kaibab', '#ddd0b0', 0.85, vary='#e7dcc0', vary_scale=40, bump=0.3, bump_scale=200)
M['pinyon'] = material('pinyonJuniper', '#4c6a37', 0.85, vary='#587a40', vary_scale=14, bump=0.3, bump_scale=90)
M['scrub'] = material('canyonScrub', '#77804e', 0.9, vary='#848d58', vary_scale=14, bump=0.3, bump_scale=90)

LAT0, LON0 = 36.087, -112.112      # the disc's middle: the river below Grand Canyon Village, the South Rim behind
RADIUS_M = 4300.0
MPU = RADIUS_M / 1.45               # metres to a tile unit
BASE = 700.0                        # the height drawn at the base's top (the river is about 730 m)
EXAG = 1.25
elev = elevation('canyon', 13)
to = geo(LAT0, LON0, MPU, turn=78.0)       # seen from the west-north-west: the river winding away, the South Rim's wall beside it
RIM = 20.0 / MPU


# the canyon's stair: the cliff-forming rocks drawn steeper, the platforms flatter (the open data smooths
# both into one slope): each band's heights stretched or squeezed by its weight
STAIR = [(760.0, 1.0), (1110.0, 1.25), (1170.0, 1.6), (1290.0, 0.4), (1520.0, 1.7), (1740.0, 0.85),
         (1830.0, 0.7), (1960.0, 1.8), (9999.0, 1.1)]


def stair(m):
    out, lo = BASE, BASE
    for top, w in STAIR:
        if m <= top:
            return out + (max(m, lo) - lo) * w
        out += (top - lo) * w
        lo = top
    return out


def unstair(d):
    """The height above the sea of a drawn height d (metres above BASE, before EXAG)."""
    out, lo = BASE, BASE
    for top, w in STAIR:
        span = (top - lo) * w
        if d <= out - BASE + span:
            return lo + (d - (out - BASE)) / w
        out += span
        lo = top
    return lo


EDGE = 0.06                         # the land cut off at the base's edge, its bands of rock showing


def H(x, y):
    g = max(0.0, stair(elev(*to(x, y))) - BASE) * EXAG
    fade = min(1.0, max(0.0, (1.47 - math.hypot(x, y)) / EDGE))
    fade = fade * fade * (3 - 2 * fade)
    return RIM + (g / MPU - RIM) * fade


# the bands of rock (metres above the sea, as they lie here), lowest first
BANDS = [(772.0, 'river'), (1110.0, 'vishnu'), (1170.0, 'tapeats'), (1290.0, 'tonto'), (1520.0, 'redwall'),
         (1740.0, 'supai'), (1830.0, 'hermit'), (1960.0, 'coconino'), (9999.0, 'kaibab')]
NAMES = [b[1] for b in BANDS]


def pick(z, nz, x, y):
    m = elev(*to(x, y))                 # the band of the real ground here
    if math.hypot(x, y) > 1.47 - EDGE - 0.01 and nz < 0.5:
        m = unstair((z - RIM) * MPU / EXAG)     # the cut at the edge: the bands by their drawn height
    m += 12.0 * math.sin(x * 9.0 + y * 4.0) + 8.0 * math.sin(x * 23.0 - y * 17.0)
    for top, name in BANDS:
        if m < top:
            if name == 'tonto' and nz < 0.75:
                return NAMES.index('tapeats')
            if name == 'river' and nz < 0.8:
                return NAMES.index('vishnu')
            return NAMES.index(name)
    return len(NAMES) - 1


land = terrain('canyon', H, [M[n] for n in NAMES], pick, rings=420, segs=1200)

# ------------------------------------------------------------------ the Colorado: water along the gorge's floor, at the lowest ground near it
import numpy as np
STEP = 22.0 / MPU
N = int(2 * 1.45 / STEP) + 1
xs = np.linspace(-1.45, 1.45, N)
g = np.array([[elev(*to(x, y)) for x in xs] for y in xs])
low = g.copy()
for dy in range(-7, 8):
    for dx in range(-7, 8):
        if dx * dx + dy * dy <= 49:
            low = np.minimum(low, np.roll(np.roll(g, dy, 0), dx, 1))
level = low + 9.0
wet = (g < level) & (level < 840.0)
bm = bmesh.new()
vid = {}


def wv(i, j):
    if (i, j) not in vid:
        x, y = xs[j], xs[i]
        fade = min(1.0, max(0.0, (1.47 - math.hypot(x, y)) / EDGE))
        fade = fade * fade * (3 - 2 * fade)
        lv = (level[min(i, N - 1), min(j, N - 1)] + level[max(i - 1, 0), max(j - 1, 0)]) / 2.0
        vid[(i, j)] = bm.verts.new((x, y, G + RIM + ((stair(lv) - BASE) * EXAG / MPU - RIM) * fade + 0.001))
    return vid[(i, j)]


for i in range(N - 1):
    for j in range(N - 1):
        if wet[i, j] and math.hypot(xs[j], xs[i]) < 1.44:
            bm.faces.new((wv(i, j), wv(i, j + 1), wv(i + 1, j + 1), wv(i + 1, j)))
finish('colorado', bm, M['river'], smooth_all=True)

# ------------------------------------------------------------------ pinyon and juniper on the tops, scrub on the Tonto Platform
TREES, SCRUB = [], []
for p in scatter_on(land, 60000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: math.hypot(p.x, p.y) < 1.38, seed=11):
    m = elev(*to(p.x, p.y))
    if m > 1990.0 and len(TREES) < 1600:
        TREES.append(((p.x, p.y, p.z + 0.006), rng.uniform(0.011, 0.018), 0.75))
    elif 1180.0 < m < 1290.0 and len(SCRUB) < 400 and rng.random() < 0.25:
        SCRUB.append(((p.x, p.y, p.z + 0.002), rng.uniform(0.004, 0.007), 0.6))
blob_cloud('pinyon', M['pinyon'], TREES)
blob_cloud('scrub', M['scrub'], SCRUB)
render('grand-canyon')

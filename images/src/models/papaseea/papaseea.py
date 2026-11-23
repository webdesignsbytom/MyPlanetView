# Cartoon Papaseʻea Sliding Rocks for the country maps, built in the set's shared look (../toon.py):
# the smooth black lava rocks of Upolu's rainforest, with water sliding down their worn chutes into
# a pool on the ledge and the clear pool below, stone steps down beside them, someone sliding and
# someone swimming, and the tropical forest all round. Turned a little towards the camera.
# Run: blender -b --factory-startup -P papaseea.py -- papaseea-1024.png 1024 papaseea.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'floor': toon('floor', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'lava': toon('lava', '#4a4448', shadow_mul=(0.82, 0.82, 0.9), lift=0.25),
    'lavaLight': toon('lavaLight', '#6a6268', shadow_mul=(0.82, 0.82, 0.9), lift=0.25),
    'pool': toon('pool', '#3fb8c0', shadow_mul=(0.72, 0.84, 0.88), lift=0.35),
    'slide': toon('slide', '#cfeef0', shadow_mul=(0.8, 0.86, 0.92), lift=0.2),
    'foam': toon('foam', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'forest': toon('forest', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'forestLight': toon('forestLight', '#5aa652', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a6048'),
    'step': toon('step', '#9a948a', shadow_mul=(0.8, 0.8, 0.88)),
    'swimsuit': toon('swimsuit', '#e0453a'),
    'swimsuit2': toon('swimsuit2', '#f4c83c', shadow_mul=(0.8, 0.68, 0.55)),
    'skin': toon('skin', '#8a5a3c'),
})

G = tile(M['floor'])
before = set(bpy.data.objects)
rng = random.Random(569)

# ---------- two levels of lava rock: the high ledge at the back, the lower one in front of it ----------
LEVELS = [(0.0, 0.8, 1.2, 0.5, 0.42), (0.0, 0.25, 1.15, 0.65, 0.22)]     # centre x, y, width, depth, height


def outline_pts(cx, cy, w, d, k, scale=1.0):
    return [(cx + scale * w / 2 * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), cy + scale * d / 2 * math.sin(t) * (1 + 0.06 * math.cos(2 * t)))
            for t in (2 * math.pi * j / 20 for j in range(20))]


for k, (cx, cy, w, d, h) in enumerate(LEVELS):
    rock = loft(f'ledge{k}', M['lava'], [[(x, y, G - 0.01) for x, y in outline_pts(cx, cy, w, d, k)], [(x, y, G + h) for x, y in outline_pts(cx, cy, w, d, k, 0.95)]],
                outline=0.03, bevel=0.01)
    rock.visible_shadow = False
    top = loft(f'ledgetop{k}', M['lavaLight'], [[(x, y, G + h - 0.005) for x, y in outline_pts(cx, cy, w, d, k, 0.95)],
                                                [(x, y, G + h + 0.01) for x, y in outline_pts(cx, cy, w, d, k, 0.9)]], outline=0.012)
    top.visible_shadow = False


def ground(x, y):
    """The height of the rock (or the forest floor) under a point."""
    for cx, cy, w, d, h in LEVELS:
        if ((x - cx) / (w / 2 * 0.95)) ** 2 + ((y - cy) / (d / 2 * 0.95)) ** 2 < 1:
            return G + h + 0.01
    return G


# ---------- the slides: smooth tongues of rock from one level to the next, water sliding down them ----------
def slide_z(y0, z0, y1, z1, y):
    t = min(1.0, max(0.0, (y - y0) / (y1 - y0)))
    return z0 + (z1 - z0) * (t * t * (3 - 2 * t))


def slide(name, x, y0, z0, y1, z1, w):
    steps = 12
    ys = [y0 + (y1 - y0) * j / steps for j in range(steps + 1)]
    rings = []
    for y in ys:
        z = slide_z(y0, z0, y1, z1, y)
        rings.append([(x - w / 2, y, G - 0.01), (x + w / 2, y, G - 0.01), (x + w / 2, y, z - 0.02), (x + w / 2 - 0.03, y, z), (x - w / 2 + 0.03, y, z), (x - w / 2, y, z - 0.02)])
    tongue = loft(f'{name}rock', M['lava'], rings, outline=0.016)
    tongue.visible_shadow = False
    ww = w * 0.55
    bm = bmesh.new()
    vs = [(bm.verts.new((x - ww / 2, y, slide_z(y0, z0, y1, z1, y) + 0.006)), bm.verts.new((x + ww / 2, y, slide_z(y0, z0, y1, z1, y) + 0.006))) for y in ys]
    for (a0, a1), (b0, b1) in zip(vs, vs[1:]):
        bm.faces.new((a0, a1, b1, b0))
    finish(f'{name}water', bm, M['slide'], outline=0.008)


UPPER = (0.1, 0.72, G + 0.43, 0.28, G + 0.23)
LOWER = (0.1, 0.14, G + 0.23, -0.4, G + 0.03)
slide('upperslide', UPPER[0], *UPPER[1:], 0.22)
slide('lowerslide', LOWER[0], *LOWER[1:], 0.24)
slide('sideslide', -0.32, 0.0, G + 0.23, -0.4, G + 0.03, 0.16)

# ---------- the pools: one on the ledge between the slides, one at the foot ----------
cyl('ledgepool', M['pool'], 1.0, 0.012, segs=24, outline=0.008, matrix=Matrix.Translation((0.1, 0.21, G + 0.236)) @ Matrix.Scale(0.17, 4, (1, 0, 0)) @ Matrix.Scale(0.09, 4, (0, 1, 0)))
lowerpool = [(0.0 + 0.55 * math.cos(t), -0.62 + 0.3 * math.sin(t)) for t in (2 * math.pi * j / 24 for j in range(24))]
loft('lowerpoolrim', M['lava'], [[(x, y, G - 0.01) for x, y in lowerpool], [(x, y, G + 0.03) for x, y in lowerpool]], outline=0.014)
cyl('lowerpool', M['pool'], 1.0, 0.012, segs=24, outline=0, matrix=Matrix.Translation((0.0, -0.62, G + 0.028)) @ Matrix.Scale(0.5, 4, (1, 0, 0)) @ Matrix.Scale(0.26, 4, (0, 1, 0)))
for k, (x, y, r) in enumerate(((0.05, -0.42, 0.05), (0.16, -0.43, 0.04), (-0.32, -0.42, 0.04), (0.1, 0.3, 0.035))):
    ball(f'splash{k}', M['foam'], x, y, ground(x, y) + 0.02 if k == 3 else G + 0.05, r, outline=0.008)

# ---------- stone steps down beside them ----------
for k in range(8):
    y = 0.62 - k * 0.105
    box(f'step{k}', M['step'], 0.68, y, G - 0.005, 0.13, 0.11, 0.43 * (1 - k / 8) + 0.02, outline=0.006, bevel=0)

# ---------- someone sliding, someone swimming ----------
SY = -0.18
SZ = slide_z(*LOWER[1:], SY) + 0.03
SX = LOWER[0]
rod('slider', M['swimsuit'], (SX, SY + 0.04, SZ + 0.02), (SX, SY - 0.04, SZ - 0.01), 0.022, segs=8, outline=0.005)
ball('sliderhead', M['skin'], SX, SY + 0.07, SZ + 0.05, 0.02, outline=0.004)
for s in (-1, 1):
    rod(f'sliderarm{s}', M['skin'], (SX + s * 0.02, SY + 0.03, SZ + 0.03), (SX + s * 0.05, SY + 0.06, SZ + 0.08), 0.008, segs=6, outline=0.003)
ball('swimmerhead', M['skin'], -0.15, -0.72, G + 0.045, 0.02, outline=0.004)
rod('swimmerbody', M['swimsuit2'], (-0.15, -0.7, G + 0.03), (-0.15, -0.64, G + 0.03), 0.018, segs=8, outline=0.004)

# ---------- the forest all round ----------
for k in range(20):
    a = 2 * math.pi * k / 20 + rng.uniform(-0.08, 0.08)
    if 4.3 < a < 5.1:
        continue    # the pool's side, open to the camera
    r = rng.uniform(1.0, 1.18)
    x, y = r * math.cos(a), r * 0.95 * math.sin(a)
    z = ground(x, y)
    h = rng.uniform(0.15, 0.28)
    rod(f'trunk{k}', M['trunk'], (x, y, z), (x, y, z + h), 0.022, segs=8, outline=0.01)
    ball(f'crown{k}', M['forest' if k % 2 else 'forestLight'], x, y, z + h + 0.05, rng.uniform(0.11, 0.15), outline=0.018)

turn(before, -20)
render(G)

# A cartoon Three Towers of San Marino for the country maps, built in the set's shared look
# (../toon.py): the ridge of Monte Titano, the old town's white houses and red roofs climbing its green
# slope and its sheer limestone cliff falling away behind, and along the top the three towers: the Guaita with its
# crenellated walls, the Cesta on the summit, and the little Montale, each crowned with its iron
# feather. Turned a little towards the camera.
# Run: blender -b --factory-startup -P guaita-tower.py -- guaita-tower-1024.png 1024 guaita-tower.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'rock': toon('rock', '#d8d0c0', shadow_mul=(0.8, 0.8, 0.88), lift=0.2),
    'rockDark': toon('rockDark', '#b8ae9c', shadow_mul=(0.8, 0.8, 0.88)),
    'green': toon('green2', '#6aa452', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#c9bea6', shadow_mul=(0.8, 0.78, 0.86)),
    'roofTile': toon('roofTile', '#c4573a'),
    'house': toon('house', '#f3efe6', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'window': flat('window', '#3a3640'),
    'iron': toon('iron', '#4a4a52'),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(401)

# ---------- the ridge: a sheer cliff on its near side, a slope down the far side ----------
# its crest runs along x near the back; the town's gentle slope comes down towards the camera (-Y),
# the sheer cliff falls away behind (+Y), so the towers stand against the sky on its edge
CREST = [(-1.0, 0.42, 0.5), (-0.55, 0.38, 0.64), (-0.05, 0.4, 0.74), (0.45, 0.45, 0.66), (0.95, 0.5, 0.5)]
foot_front = [(x, y - 1.1, G - 0.01) for x, y, _ in CREST]
crest_front = [(x, y - 0.05, G + h - 0.02) for x, y, h in CREST]
crest_back = [(x, y + 0.05, G + h) for x, y, h in reversed(CREST)]
foot_back = [(x, y + 0.2, G - 0.01) for x, y, _ in reversed(CREST)]
cliff = loft('cliff', M['rock'], [foot_front + foot_back, crest_front + crest_back], outline=0.035)
cliff.visible_shadow = False


def slope_z(y, cy, h):
    """The front slope's height at y, under a crest point (cy, h): from its foot to its crest edge."""
    t = (y - (cy - 1.1)) / 1.05
    return -0.01 + t * (h - 0.01)


# green on the gentle front slope: a strip of quads lying just above the rock, section by section
# along the crest, the rock left showing near the top
bm = bmesh.new()
cols = []
for x, y, h in CREST:
    col = []
    for yy in (y - 1.06, y - 0.63, y - 0.2):
        col.append(bm.verts.new((x, yy, G + slope_z(yy, y, h) + 0.03)))
    cols.append(col)
for c0, c1 in zip(cols, cols[1:]):
    for r in range(2):
        bm.faces.new((c0[r], c1[r], c1[r + 1], c0[r + 1]))
slope = finish('slope', bm, M['green'], outline=0.012)
slope.visible_shadow = False


def crest_at(x):
    for (x0, y0, h0), (x1, y1, h1) in zip(CREST, CREST[1:]):
        if x <= x1:
            t = (x - x0) / (x1 - x0)
            return y0 + (y1 - y0) * t, h0 + (h1 - h0) * t
    return CREST[-1][1], CREST[-1][2]


def tower(name, x, w, h, crenels=True):
    y, z = crest_at(x)
    w, h = w * 1.5, h * 1.4
    box(f'{name}', M['stone'], x, y, G + z - 0.04, w, w, h, outline=0.018, bevel=0)
    if crenels:
        for sx in (-1, 0, 1):
            for sy in (-1, 1):
                box(f'{name}merlon{sx}{sy}', M['stone'], x + sx * w * 0.38, y + sy * w * 0.42, G + z - 0.04 + h, w * 0.18, w * 0.14, 0.035, outline=0.005, bevel=0)
    box(f'{name}win', M['window'], x, y - w / 2 - 0.004, G + z + h * 0.5, 0.03, 0.01, 0.06, outline=0, bevel=0)
    pyramid(f'{name}roof', M['roofTile'], x, y, G + z - 0.04 + h, w * 0.7, 0.08, outline=0.01)
    # the iron feather on top
    rod(f'{name}pole', M['iron'], (x, y, G + z - 0.04 + h + 0.07), (x, y, G + z - 0.04 + h + 0.2), 0.005, segs=6, outline=0)
    box(f'{name}feather', M['iron'], x + 0.025, y, G + z - 0.04 + h + 0.17, 0.05, 0.004, 0.03, outline=0.002, bevel=0)
    return y, z


# ---------- the Guaita, with its walls, the Cesta, the Montale ----------
gy, gz = tower('guaita', -0.6, 0.13, 0.24)
for k, (dx, dy, w, d) in enumerate(((0.0, -0.16, 0.5, 0.04), (0.0, 0.14, 0.5, 0.04), (-0.25, -0.01, 0.04, 0.3), (0.25, -0.01, 0.04, 0.3))):
    box(f'guaitawall{k}', M['stone'], -0.6 + dx, gy + dy, G + gz - 0.08, w, d, 0.15, outline=0.012, bevel=0)
    n = int(max(w, d) / 0.05)
    for m in range(n):
        t = (m + 0.5) / n
        mx = -0.6 + dx + (w * (t - 0.5) if w > d else 0)
        my = gy + dy + (d * (t - 0.5) if d > w else 0)
        box(f'guaitamerlon{k}{m}', M['stone'], mx, my, G + gz + 0.07, 0.026, 0.026, 0.035, outline=0.004, bevel=0)
tower('cesta', -0.08, 0.12, 0.26)
tower('montale', 0.55, 0.09, 0.2, crenels=False)
# the path along the crest between them
for k in range(16):
    x = -0.85 + k * 0.11
    y, z = crest_at(x)
    box(f'path{k}', M['rockDark'], x, y, G + z - 0.01, 0.1, 0.06, 0.015, outline=0, bevel=0)

# ---------- the old town down the slope in front ----------
for k in range(12):
    x = -0.85 + (k % 6) * 0.32 + rng.uniform(-0.04, 0.04)
    row = k // 6
    cy, cz = crest_at(x)
    y = cy - 0.45 - row * 0.28
    z = G + slope_z(y, cy, cz) + 0.03
    box(f'house{k}', M['house'], x, y, z - 0.02, 0.12, 0.1, 0.09, outline=0.01, bevel=0)
    loft(f'houseroof{k}', M['roofTile'], [[(x - 0.07, y - 0.06, z + 0.07), (x + 0.07, y - 0.06, z + 0.07), (x + 0.07, y + 0.06, z + 0.07), (x - 0.07, y + 0.06, z + 0.07)],
                                          [(x - 0.06, y - 0.004, z + 0.11), (x + 0.06, y - 0.004, z + 0.11), (x + 0.06, y + 0.004, z + 0.11),
                                           (x - 0.06, y + 0.004, z + 0.11)]], outline=0.008)

# ---------- trees on the lower slope, limestone showing higher up ----------
for k, x in enumerate((-0.95, -0.4, 0.2, 0.75, -0.7, 0.5)):
    y = -0.6 if k < 4 else -0.15
    cy, cz = crest_at(x)
    z = G + slope_z(y, cy, cz)
    ball(f'tree{k}', M['tree'], x, y, z + 0.06, 0.085, outline=0.016)
for k, x in enumerate((-0.25, 0.15, 0.7)):
    cy, cz = crest_at(x)
    r = ball(f'outcrop{k}', M['rockDark'], 0, 0, 0, 0.09, outline=0.014)
    r.scale = (1.4, 0.8, 0.6)
    r.location = (x, cy - 0.2, G + cz - 0.16)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

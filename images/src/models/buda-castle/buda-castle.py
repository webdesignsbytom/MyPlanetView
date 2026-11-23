# A cartoon Buda Castle for the country maps, built in the set's shared look (../toon.py): the Royal
# Palace along the top of Castle Hill with its green copper dome, the castle walls below it,
# Matthias Church's spire with its patterned roof and the white turrets of the Fisherman's Bastion
# along the hill, the Danube in front and the Chain Bridge striding across it on its two stone
# arches. Turned a little towards the camera.
# Run: blender -b --factory-startup -P buda-castle.py -- buda-castle-1024.png 1024 buda-castle.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'hill': toon('hill', '#6faa55', shadow_mul=(0.7, 0.78, 0.8)),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'wall': toon('wall', '#c9bea6', shadow_mul=(0.8, 0.78, 0.86)),
    'palace': toon('palace', '#e6dcc4', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'copper': toon('copper', '#6f9a8a', shadow_mul=(0.72, 0.82, 0.84)),
    'roof': toon('roof', '#6f7f7c', shadow_mul=(0.75, 0.78, 0.86)),
    'window': flat('window', '#3f4a5a'),
    'river': toon('river', '#4a9fc8', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'bridgeStone': toon('bridgeStone', '#d8cdb4', shadow_mul=(0.8, 0.78, 0.86)),
    'chain': toon('chain', '#5d6670'),
    'deck': toon('deck', '#8a8f96'),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'tileOrange': toon('tileOrange', '#e08a3a', shadow_mul=(0.8, 0.68, 0.55)),
    'tileGreen': toon('tileGreen', '#3f9a6a', shadow_mul=(0.7, 0.78, 0.8)),
    'embankment': toon('embankment', '#bdb6a8', shadow_mul=(0.8, 0.8, 0.88)),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(211)

# ---------- the Danube across the front ----------
RY0, RY1 = -0.82, -0.38
R = 1.42                                   # the river stops at the tile's edge


def edge_x(y):
    return math.sqrt(R * R - y * y)


left = [(-edge_x(RY0 + (RY1 - RY0) * t), RY0 + (RY1 - RY0) * t) for t in (k / 6 for k in range(7))]
right = [(edge_x(y), y) for _, y in reversed(left)]
bm = bmesh.new()
bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, G + 0.004)) for x, y in list(reversed(left)) + list(reversed(right))])])
finish('danube', bm, M['river'], outline=0)
for y in (RY0, RY1):
    box(f'embankment{y}', M['embankment'], 0, y, G - 0.005, 2 * edge_x(y) - 0.06, 0.04, 0.03, outline=0.01, bevel=0)

# ---------- Castle Hill ----------
SIDES = 24


def ring(cx, cy, rx, ry, z, jitter):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / SIDES),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / SIDES), G + z) for k in range(SIDES)]


hill = loft('hill', M['hill'], [ring(0.0, 0.45, 1.12, 0.62, -0.01, 0.02), ring(0.0, 0.48, 1.0, 0.5, 0.2, 0.04), ring(0.0, 0.5, 0.92, 0.4, 0.32, 0.02)],
            outline=0.035)
hill.visible_shadow = False
T = G + 0.32
for k in range(12):
    a = math.radians(rng.uniform(200, 340))
    x, y = 1.0 * math.cos(a), 0.45 + 0.55 * math.sin(a)
    ball(f'hilltree{k}', M['tree'], x, y, G + 0.1, rng.uniform(0.06, 0.08), outline=0.014)
# the castle walls along the hill's front
box('castlewall', M['wall'], -0.05, 0.18, G + 0.12, 1.4, 0.05, 0.2, outline=0.018, bevel=0)

# ---------- the Royal Palace and its dome ----------
PX, PY, PW, PD, PH = 0.15, 0.55, 1.05, 0.26, 0.2
box('palace', M['palace'], PX, PY, T - 0.005, PW, PD, PH, outline=0.026, bevel=0.003)
box('palaceroof', M['roof'], PX, PY, T + PH - 0.005, PW + 0.02, PD + 0.02, 0.04, outline=0.016, bevel=0)
for row, z in enumerate((0.05, 0.13)):
    for k in range(14):
        x = PX - PW / 2 + 0.05 + k * (PW - 0.1) / 13
        box(f'palacewin{row}{k}', M['window'], x, PY - PD / 2 - 0.004, T + z, 0.025, 0.01, 0.045, outline=0, bevel=0)
box('portico', M['palace'], PX, PY - PD / 2 - 0.03, T - 0.005, 0.24, 0.06, PH + 0.03, outline=0.018, bevel=0)
for k in range(4):
    rod(f'column{k}', M['white'], (PX - 0.09 + k * 0.06, PY - PD / 2 - 0.065, T), (PX - 0.09 + k * 0.06, PY - PD / 2 - 0.065, T + PH), 0.012, segs=8,
        outline=0.005)
pyramid('pediment', M['palace'], PX, PY - PD / 2 - 0.03, T + PH + 0.025, 0.26, 0.06, outline=0.012)
DX, DY = PX, PY + 0.02
lathe('drum', M['palace'], ((0.11, 0), (0.11, 0.12)), T + PH + 0.03, DX, DY, segs=20, outline=0.018)
for k in range(8):
    a = 2 * math.pi * k / 8
    rod(f'drumcol{k}', M['white'], (DX + 0.113 * math.cos(a), DY + 0.113 * math.sin(a), T + PH + 0.03),
        (DX + 0.113 * math.cos(a), DY + 0.113 * math.sin(a), T + PH + 0.15), 0.008, segs=6, outline=0)
lathe('dome', M['copper'], ((0.12, 0), (0.12, 0.04), (0.1, 0.12), (0.06, 0.18), (0.02, 0.2)), T + PH + 0.15, DX, DY, segs=20, outline=0.016)
lathe('lantern', M['copper'], ((0.025, 0), (0.025, 0.06), (0.004, 0.1)), T + PH + 0.35, DX, DY, segs=12, outline=0.008)
rod('domecross', M['gold'], (DX, DY, T + PH + 0.45), (DX, DY, T + PH + 0.5), 0.005, segs=6, outline=0)

# ---------- Matthias Church and the Fisherman's Bastion ----------
MX, MY = -0.68, 0.55
box('matthias', M['white'], MX, MY, T - 0.005, 0.18, 0.3, 0.24, outline=0.02, bevel=0)
loft('matthiasroof', M['tileOrange'], [[(MX - 0.1, MY - 0.16, T + 0.235), (MX + 0.1, MY - 0.16, T + 0.235), (MX + 0.1, MY + 0.16, T + 0.235),
                                        (MX - 0.1, MY + 0.16, T + 0.235)],
                                       [(MX - 0.004, MY - 0.15, T + 0.38), (MX + 0.004, MY - 0.15, T + 0.38), (MX + 0.004, MY + 0.15, T + 0.38),
                                        (MX - 0.004, MY + 0.15, T + 0.38)]], outline=0.016)
for k in range(4):
    box(f'roofdiamond{k}', M['tileGreen'], MX - 0.052, MY - 0.1 + k * 0.065, T + 0.29, 0.01, 0.03, 0.03, rot_z=0, outline=0, bevel=0)
SX, SY = MX + 0.13, MY - 0.12
box('matthiastower', M['white'], SX, SY, T - 0.005, 0.1, 0.1, 0.44, outline=0.018, bevel=0)
lathe('matthiasspire', M['white'], ((0.06, 0), (0.05, 0.08), (0.004, 0.3)), T + 0.43, SX, SY, segs=8, outline=0.012, smooth=False)
for k in range(5):
    bx = MX - 0.15 + k * 0.1
    lathe(f'bastion{k}', M['white'], ((0.035, 0), (0.035, 0.1)), T + 0.0, bx, MY - 0.27, segs=12, outline=0.01)
    lathe(f'bastionroof{k}', M['white'], ((0.042, 0), (0.004, 0.08)), T + 0.1, bx, MY - 0.27, segs=12, outline=0.01)
box('bastionwall', M['white'], MX + 0.05, MY - 0.27, T - 0.005, 0.46, 0.04, 0.06, outline=0.01, bevel=0)

# ---------- the Chain Bridge ----------
BX = 0.55
DECKZ = G + 0.08
box('deck', M['deck'], BX, (RY0 + RY1) / 2, DECKZ, 0.12, 0.95, 0.025, outline=0.012, bevel=0)
TOWERS = (RY1 - 0.08, RY0 + 0.08)


def pylon(name, y):
    for s in (-1, 1):
        box(f'{name}leg{s}', M['bridgeStone'], BX + s * 0.075, y, G - 0.005, 0.06, 0.09, 0.48, outline=0.016, bevel=0)
    box(f'{name}top', M['bridgeStone'], BX, y, G + 0.38, 0.21, 0.1, 0.1, outline=0.016, bevel=0)
    box(f'{name}cornice', M['bridgeStone'], BX, y, G + 0.475, 0.23, 0.11, 0.025, outline=0.012, bevel=0)
    box(f'{name}pier', M['bridgeStone'], BX, y, G - 0.005, 0.24, 0.12, 0.07, outline=0.014, bevel=0)


for k, y in enumerate(TOWERS):
    pylon(f'pylon{k}', y)


def chain(name, s, y0, z0, y1, z1, sag, n=10):
    pts = [Vector((BX + s * 0.075, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t - sag * math.sin(math.pi * t))) for t in (k / n for k in range(n + 1))]
    for k, (a, b) in enumerate(zip(pts, pts[1:])):
        rod(f'{name}{k}', M['chain'], a, b, 0.011, segs=6, outline=0.004)
    return pts


for s in (-1, 1):
    mid = chain(f'chainmid{s}', s, TOWERS[0], G + 0.44, TOWERS[1], G + 0.44, 0.3)
    for k, p in enumerate(mid[1:-1]):
        rod(f'hanger{s}{k}', M['chain'], p, (p.x, p.y, DECKZ + 0.02), 0.003, segs=4, outline=0)
    chain(f'chainback{s}', s, TOWERS[0], G + 0.44, RY1 + 0.12, DECKZ + 0.03, 0.03, n=3)
    chain(f'chainfront{s}', s, TOWERS[1], G + 0.44, RY0 - 0.12, DECKZ + 0.03, 0.03, n=3)
for k, y in enumerate((RY1 + 0.14, RY0 - 0.14)):
    box(f'anchor{k}', M['bridgeStone'], BX, y, G - 0.005, 0.2, 0.1, 0.1, outline=0.012, bevel=0)

turn(before, -20)
render(G)

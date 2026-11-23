# A cartoon Old Bridge of Mostar for the country maps, built in the set's shared look (../toon.py):
# the pale stone hump-backed arch leaping the green Neretva between its rocky banks, a diver on the
# parapet at its crown, the square Halebija and round Tara towers guarding its ends, the old town's
# white houses under grey stone-slab roofs, a domed mosque and its slender minaret, and trees.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P mostar.py -- mostar-1024.png 1024 mostar.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'rock': toon('rock', '#cdbd9c', shadow_mul=(0.8, 0.78, 0.84)),
    'bankTop': toon('bankTop', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'river': toon('river', '#3fb3a6', shadow_mul=(0.72, 0.84, 0.86), lift=0.35),
    'foam': toon('foam', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'stone': toon('stone', '#eee5d0', shadow_mul=(0.8, 0.8, 0.88), lift=0.2),
    'stoneDark': toon('stoneDark', '#cfc2a4', shadow_mul=(0.8, 0.8, 0.88)),
    'slate': toon('slate', '#8a8478', shadow_mul=(0.8, 0.8, 0.88)),
    'wall': toon('wall', '#f6f2ea', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'window': flat('window', '#3a3640'),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a6048'),
    'diver': toon('diver', '#e0453a'),
    'skin': toon('skin', '#e0b090', shadow_mul=(0.84, 0.74, 0.7)),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(571)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


R = 1.42
BANK = 0.36             # half the river's width
TOP = G + 0.26          # the banks' height

# ---------- the Neretva, front to back ----------
xs = [-BANK - 0.02 + (2 * BANK + 0.04) * k / 8 for k in range(9)]
flat_face('river', M['river'], [(x, -math.sqrt(R * R - x * x)) for x in xs] + [(x, math.sqrt(R * R - x * x)) for x in reversed(xs)], G + 0.003, outline=0.01)
for k in range(9):
    x, y = rng.uniform(-0.26, 0.26), rng.uniform(-1.2, 1.2)
    if abs(y) < 0.15:
        continue
    ball(f'riverrock{k}', M['rock'], x, y, G, rng.uniform(0.025, 0.04), outline=0.008)
    ball(f'foam{k}', M['foam'], x - 0.03, y + 0.02, G + 0.004, 0.022, outline=0.004)


# ---------- the rocky banks: each the part of the tile beyond a straight edge ----------
def bank_ring(side, edge, radius, z, n=24):
    a = math.acos(edge / radius)
    start = -a if side > 0 else math.pi - a
    return [(radius * math.cos(start + 2 * a * k / n), radius * math.sin(start + 2 * a * k / n), z) for k in range(n + 1)]


for side in (-1, 1):
    b = loft(f'bank{side}', M['rock'], [bank_ring(side, BANK, R, G - 0.01), bank_ring(side, BANK, R, TOP - 0.02)], outline=0.025)
    b.visible_shadow = False
    t = loft(f'banktop{side}', M['bankTop'], [bank_ring(side, BANK + 0.035, R - 0.015, TOP - 0.025), bank_ring(side, BANK + 0.035, R - 0.015, TOP)], outline=0.012)
    t.visible_shadow = False
    for k in range(6):
        y = rng.uniform(-1.1, 1.1)
        if abs(y) < 0.2:
            continue
        ball(f'boulder{side}{k}', M['rock'], side * (BANK + 0.01), y, G + 0.01, rng.uniform(0.04, 0.07), outline=0.012)

# ---------- the bridge: one pale stone arch, humped in the middle ----------
SPAN, W = 0.37, 0.065


def zu(x):
    return G + 0.07 + 0.33 * math.sqrt(max(0.0, 1 - (x / SPAN) ** 2))


def zt(x):
    return G + 0.47 - 0.2 * (x / 0.52) ** 2


XS = [-0.52 + 1.04 * k / 52 for k in range(53)]
loft('bridge', M['stone'], [[(x, -W, zu(x)), (x, W, zu(x)), (x, W, zt(x)), (x, -W, zt(x))] for x in XS], outline=0.02)
AX = [-SPAN + 2 * SPAN * k / 40 for k in range(41)]
for s in (-1, 1):
    y0, y1 = sorted((s * (W + 0.008), s * (W - 0.01)))
    loft(f'archring{s}', M['stoneDark'], [[(x, y0, zu(x) - 0.002), (x, y1, zu(x) - 0.002), (x, y1, zu(x) + 0.045), (x, y0, zu(x) + 0.045)] for x in AX], outline=0.006)
    lo, hi = sorted((s * (W - 0.014), s * W))
    loft(f'parapet{s}', M['stone'], [[(x, lo, zt(x) - 0.002), (x, hi, zt(x) - 0.002), (x, hi, zt(x) + 0.035), (x, lo, zt(x) + 0.035)] for x in XS], outline=0.006)

# a diver on the parapet at the crown, arms up
DY, DZ = -W + 0.007, zt(0) + 0.035
rod('diverlegs', M['skin'], (0, DY, DZ), (0, DY, DZ + 0.03), 0.007, segs=6, outline=0.002)
box('divertrunks', M['diver'], 0, DY, DZ + 0.024, 0.02, 0.016, 0.014, outline=0.002, bevel=0)
rod('diverbody', M['skin'], (0, DY, DZ + 0.036), (0, DY, DZ + 0.062), 0.009, segs=6, outline=0.002)
ball('diverhead', M['skin'], 0, DY, DZ + 0.073, 0.01, outline=0.002)
for s in (-1, 1):
    rod(f'diverarm{s}', M['skin'], (s * 0.006, DY, DZ + 0.058), (s * 0.02, DY, DZ + 0.092), 0.004, segs=6, outline=0.002)

# ---------- the towers at the bridge's ends ----------
TX, TY = -0.66, 0.14
box('halebija', M['stoneDark'], TX, TY, TOP - 0.005, 0.2, 0.2, 0.32, outline=0.016, bevel=0)
pyramid('halebijaroof', M['slate'], TX, TY, TOP + 0.31, 0.25, 0.16, outline=0.012)
for k, (dx, z) in enumerate(((0.0, 0.22), (-0.05, 0.11), (0.05, 0.11))):
    box(f'halebijawin{k}', M['window'], TX + dx, TY - 0.104, TOP + z, 0.026, 0.01, 0.045, outline=0, bevel=0)
RX, RY = 0.68, 0.15
lathe('tara', M['stoneDark'], ((0.12, 0), (0.115, 0.28)), TOP - 0.005, RX, RY, segs=20, outline=0.016)
lathe('tararoof', M['slate'], ((0.135, 0), (0.004, 0.15)), TOP + 0.27, RX, RY, segs=20, outline=0.012)
for k, z in enumerate((0.1, 0.2)):
    box(f'tarawin{k}', M['window'], RX, RY - 0.118, TOP + z, 0.024, 0.01, 0.04, outline=0, bevel=0)

# ---------- the mosque and its minaret ----------
MX, MY = 0.85, 0.58
box('mosque', M['wall'], MX, MY, TOP - 0.005, 0.24, 0.22, 0.15, outline=0.014, bevel=0)
lathe('mosquedrum', M['wall'], ((0.08, 0), (0.08, 0.03)), TOP + 0.14, MX, MY, segs=16, outline=0.008, smooth=False)
lathe('mosquedome', M['slate'], ((0.085, 0), (0.08, 0.04), (0.055, 0.075), (0.004, 0.095)), TOP + 0.165, MX, MY, segs=16, outline=0.01)
box('porch', M['wall'], MX, MY - 0.15, TOP - 0.005, 0.24, 0.08, 0.1, outline=0.01, bevel=0)
box('porchroof', M['slate'], MX, MY - 0.15, TOP + 0.095, 0.26, 0.1, 0.02, outline=0.006, bevel=0)
for k in range(3):
    box(f'porcharch{k}', M['window'], MX - 0.07 + 0.07 * k, MY - 0.194, TOP, 0.035, 0.01, 0.07, outline=0, bevel=0)
rod('minaret', M['wall'], (1.0, 0.38, TOP), (1.0, 0.38, TOP + 0.48), 0.024, segs=12, outline=0.008)
cyl('balcony', M['wall'], 0.036, 0.015, segs=12, outline=0.005, matrix=Matrix.Translation((1.0, 0.38, TOP + 0.38)))
lathe('minaretcap', M['slate'], ((0.026, 0), (0.004, 0.12)), TOP + 0.48, 1.0, 0.38, segs=12, outline=0.006)


# ---------- the old town's houses ----------
def house(name, x, y, w, d, h, mat):
    box(name, M[mat], x, y, TOP - 0.005, w, d, h, outline=0.01, bevel=0)
    loft(f'{name}roof', M['slate'], [[(x - w / 2 - 0.015, y - d / 2 - 0.015, TOP + h - 0.006), (x + w / 2 + 0.015, y - d / 2 - 0.015, TOP + h - 0.006),
                                      (x + w / 2 + 0.015, y + d / 2 + 0.015, TOP + h - 0.006), (x - w / 2 - 0.015, y + d / 2 + 0.015, TOP + h - 0.006)],
                                     [(x - w * 0.2, y - 0.004, TOP + h + 0.06), (x + w * 0.2, y - 0.004, TOP + h + 0.06), (x + w * 0.2, y + 0.004, TOP + h + 0.06),
                                      (x - w * 0.2, y + 0.004, TOP + h + 0.06)]], outline=0.008)
    for s in (-1, 1):
        box(f'{name}win{s}', M['window'], x + s * w * 0.22, y - d / 2 - 0.004, TOP + h * 0.45, 0.024, 0.01, 0.034, outline=0, bevel=0)


HOUSES = [(-0.6, -0.45), (-0.88, -0.2), (-0.95, 0.35), (-0.62, 0.6), (-0.72, -0.8), (-0.5, 0.95),
          (0.6, -0.45), (0.92, -0.25), (0.58, 0.62), (0.75, -0.8), (0.5, 0.98)]
for k, (x, y) in enumerate(HOUSES):
    house(f'house{k}', x, y, rng.uniform(0.14, 0.18), 0.12, rng.uniform(0.1, 0.14), 'wall' if k % 3 else 'stone')

for k, (x, y) in enumerate(((-1.12, 0.0), (-0.85, 0.82), (-1.0, -0.55), (0.82, 0.85), (1.15, 0.05), (1.0, -0.55), (-0.45, -1.05), (0.45, -1.08))):
    h = rng.uniform(0.07, 0.11)
    rod(f'trunk{k}', M['trunk'], (x, y, TOP), (x, y, TOP + h), 0.014, segs=8, outline=0.006)
    ball(f'tree{k}', M['tree'], x, y, TOP + h + 0.05, rng.uniform(0.08, 0.1), outline=0.014)

turn(before, -20)
render(G)

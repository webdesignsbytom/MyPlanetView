# Angkor Wat in the high-quality look (hq.py): the sandstone temple rising in three tiers of galleries
# with their roofs and windows, the quincunx of lotus-bud towers in their bands (the tallest in the
# middle), steep stairs up each tier, the causeway with its naga balustrades crossing to it past the
# reflecting pool with the temple's towers reflected, sugar palms, and visitors.
# Run: blender -b --factory-startup -P angkor-wat.py -- angkor-wat-1024.png 1024 angkor-wat.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1150)
M['khmer'] = material('khmer', '#a99c80', 0.85, vary='#94876c', vary_scale=20, bump=0.4, bump_scale=140)
M['khmerDark'] = material('khmerDark', '#857a63', 0.85, vary='#736953', vary_scale=20, bump=0.4, bump_scale=140)
M['laterite'] = material('laterite', '#9c6e54', 0.9, vary='#8a5f47', vary_scale=24, bump=0.45, bump_scale=120)
M['towerStone'] = banded(material('towerStone', '#a69a7e', 0.85, vary='#8f8369', vary_scale=20, bump=0.3, bump_scale=140), 'Z', 26.0, strength=0.6)
M['palm'] = material('palm', '#4f8f3c', 0.8, vary='#3f7d31', vary_scale=14, bump=0.4, bump_scale=90)
TX, TY = 0.08, 0.28
OPEN = []


def lotus(name, x, y, z0, h, r):
    """A lotus-bud tower: a square-cornered drum in horizontal bands swelling then closing to a point."""
    prof = [(r, 0), (r * 1.06, h * 0.08), (r * 1.02, h * 0.2), (r * 0.98, h * 0.35), (r * 0.86, h * 0.52), (r * 0.66, h * 0.68), (r * 0.42, h * 0.82), (r * 0.18, h * 0.94), (0.0, h)]
    lathe(name, M['towerStone'], prof, (x, y, z0), segs=12, smooth=False)
    for nx, ny in ((0, -1), (1, 0), (0, 1), (-1, 0)):
        OPEN.append((x + nx * r * 0.97, y + ny * r * 0.97, z0 + h * 0.03, r * 0.5, h * 0.17, (nx, ny), 'pointed'))


def gallery(name, hw, hd, z0, h, base_h):
    """A tier: its platform, the gallery round its edge with windows and a roof, and the corner towers."""
    box(name + 'Platform', M['laterite'], (TX, TY, z0 + base_h / 2), (2 * hw + 0.06, 2 * hd + 0.06, base_h), bevel=0.004)
    zb = z0 + base_h
    t = 0.07
    for (cx, cy, sx, sy) in ((TX, TY - hd + t / 2, 2 * hw, t), (TX, TY + hd - t / 2, 2 * hw, t), (TX - hw + t / 2, TY, t, 2 * hd), (TX + hw - t / 2, TY, t, 2 * hd)):
        box(f'{name}Wall{cx:.2f}{cy:.2f}', M['khmer'], (cx, cy, zb + h / 2), (sx, sy, h), bevel=0.002)
        if sx > sy:
            gable_roof(f'{name}Roof{cx:.2f}{cy:.2f}', M['khmerDark'], cx - sx / 2, cx + sx / 2, cy - t / 2, cy + t / 2, zb + h, 0.045, over=0.012)
        else:
            gable_roof(f'{name}Roof{cx:.2f}{cy:.2f}', M['khmerDark'], cx - t / 2, cx + t / 2, cy - sy / 2, cy + sy / 2, zb + h, 0.045, over=0.012, along='y')
    for nx, ny, L in ((0, -1, hw), (0, 1, hw), (1, 0, hd), (-1, 0, hd)):
        tx, ty = -ny, nx
        n = max(3, int(L * 2 / 0.06))
        for j in range(n):
            u = -L + (j + 0.5) * 2 * L / n
            if abs(u) < 0.06:
                continue
            OPEN.append((TX + nx * (hw if nx else 0) + tx * u, TY + ny * (hd if ny else 0) + ty * u, zb + h * 0.25, 0.024, h * 0.45, (nx, ny), 'rect'))
        OPEN.append((TX + nx * (hw if nx else 0), TY + ny * (hd if ny else 0), zb, 0.05, h * 0.8, (nx, ny), 'pointed'))
    return zb + h


# ------------------------------------------------------------------ the three tiers and the towers
temple_from = set(bpy.data.objects)
z = gallery('tier1', 0.62, 0.52, G, 0.11, 0.06)
z = gallery('tier2', 0.44, 0.36, z - 0.11 + 0.04, 0.1, 0.1)
z2 = z
z = gallery('tier3', 0.27, 0.24, z - 0.1 + 0.05, 0.12, 0.18)
for sx in (-1, 1):
    for sy in (-1, 1):
        lotus(f'cornerTower{sx}{sy}', TX + sx * 0.235, TY + sy * 0.205, z - 0.02, 0.45, 0.06)
        lotus(f'tier2Tower{sx}{sy}', TX + sx * 0.41, TY + sy * 0.33, z2 - 0.02, 0.24, 0.042)
lotus('centralTower', TX, TY, z - 0.02, 0.72, 0.085)
# the steep stairs up each tier, at the front
for k, (y0, z0, z1, w) in enumerate(((TY - 0.55, G, G + 0.17, 0.12), (TY - 0.39, G + 0.1, G + 0.33, 0.1), (TY - 0.27, G + 0.27, G + 0.58, 0.08))):
    bm = bmesh.new()
    NS = 12
    for j in range(NS):
        zt = z0 + (z1 - z0) * (j + 1) / NS
        y = y0 - 0.05 + 0.1 * j / NS
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((TX, y + 0.05, (z0 + zt) / 2)) @ Matrix.Diagonal((w, 0.1 - 0.1 * j / NS + 0.01, zt - z0, 1)))
    finish(f'stairs{k}', bm, M['khmer'], smooth_sides=False)

windows('openings', M['shadow'], OPEN, depth=0.01)
OPEN = []
S = Matrix.Translation((TX, TY, G)) @ Matrix.Scale(1.2, 4) @ Matrix.Translation((-TX, -TY, -G))
for ob in bpy.data.objects:
    if ob not in temple_from:
        ob.matrix_world = S @ ob.matrix_world

# ------------------------------------------------------------------ the causeway, the reflecting pool and the palms
CY0, CY1 = -1.38, TY - 0.68
slab('causeway', M['khmer'], rect(TX, (CY0 + CY1) / 2, 0.16, CY1 - CY0), G - 0.004, G + 0.03, bevel=0.003, margin=0.06)
for s in (-1, 1):
    pts = [(TX + s * 0.085, y, G + 0.05) for y in [CY0 + 0.12 + j * (CY1 - CY0 - 0.15) / 20 for j in range(21)]]
    tube(f'naga{s}', M['khmerDark'], pts, 0.012)
    for j in range(0, 21, 4):
        cylinder(f'nagaPost{s}{j}', M['khmerDark'], 0.008, 0.03, (pts[j][0], pts[j][1], G + 0.025), segs=8)
    lathe(f'nagaHead{s}', M['khmerDark'], [(0.0, 0), (0.035, 0.02), (0.04, 0.05), (0.0, 0.07)], (TX + s * 0.085, CY0 + 0.12, G + 0.03), segs=12, smooth=True, sy=0.4)
pool = [(-0.75 + 0.42 * math.cos(a), -0.72 + 0.26 * math.sin(a)) for a in [2 * math.pi * k / 48 for k in range(48)]]
slab('pool', M['water'], [(x, y) for x, y in pool], G - 0.004, G + 0.006)
pool2 = [(0.85 + 0.3 * math.cos(a), -0.72 + 0.22 * math.sin(a)) for a in [2 * math.pi * k / 48 for k in range(48)]]
slab('pool2', M['water'], pool2, G - 0.004, G + 0.006)


def palm(name, x, y, h=0.3):
    tube(name + 'Trunk', M['trunk'], [(x, y, G), (x + 0.01, y, G + h * 0.5), (x + 0.015, y, G + h)], 0.008)
    bm = bmesh.new()
    for j in range(12):
        a = 2 * math.pi * j / 12
        bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0, matrix=Matrix.Translation((x + 0.015 + 0.03 * math.cos(a), y + 0.03 * math.sin(a), G + h + 0.004)) @ Matrix.Rotation(a, 4, 'Z') @ Matrix.Diagonal((0.04, 0.011, 0.008, 1)))
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.03, matrix=Matrix.Translation((x + 0.015, y, G + h + 0.01)))
    finish(name, bm, M['palm'], smooth_all=True)


for k, (x, y) in enumerate(((-1.1, -0.35), (-0.95, -1.0), (-1.2, 0.2), (0.75, -1.05), (1.15, -0.35), (1.05, 0.4), (-0.4, -1.15), (0.45, -1.2), (-1.0, 0.7), (0.8, 0.85))):
    palm(f'palm{k}', x, y, h=0.24 + 0.06 * rng.random())
for k, (x, y) in enumerate(((-0.55, 1.05), (0.15, 1.2), (1.1, 0.0), (-1.25, -0.6))):
    tree(f'tree{k}', x, y, h=0.2, r=0.09)
for k, (x, y, shirt) in enumerate(((TX - 0.02, -1.0, 'red'), (TX + 0.03, -0.85, 'yellow'), (TX - 0.03, -0.6, 'blue'), (-0.4, -0.5, 'green'), (TX + 0.02, -0.4, 'red'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=G + (0.03 if abs(x - TX) < 0.08 else 0.0))

render('angkor-wat')

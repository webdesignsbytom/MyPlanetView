# A cartoon Tower Bridge for the country maps, built in the set's shared look (../toon.py): the two
# Gothic towers of grey stone on their piers in the Thames, each with four corner turrets under
# pointed caps, the two high blue walkways between them, the bascules raised for a ship, the side
# spans hanging from their blue chains, and the banks either side. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P tower-bridge.py -- tower-bridge-1024.png 1024 tower-bridge.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c0b0', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'river': toon('river', '#4a7a9a', shadow_mul=(0.78, 0.84, 0.92), lift=0.3),
    'stone': toon('stone', '#d8d2c4', shadow_mul=(0.84, 0.84, 0.9), lift=0.15),
    'stoneDark': toon('stoneDark', '#b4ac9c', shadow_mul=(0.84, 0.84, 0.9)),
    'blue': toon('blue', '#6a9ad0', shadow_mul=(0.8, 0.86, 0.94), lift=0.15),
    'white': toon('white', '#f2f2ee', lift=0.15),
    'slate': toon('slate', '#5e6a7a'),
    'gold': toon('gold', '#e0b040', lift=0.15),
    'window': flat('window', '#3a3a46'),
    'deck': toon('deck', '#8a8a90'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the river, from front to back ----------
RW = 1.0


def vstrip(x0, x1, r, z, n=8):
    """The band of the tile's disc between x0 and x1 (counter-clockwise from above)."""
    ya0, ya1 = math.sqrt(r * r - x0 * x0), math.sqrt(r * r - x1 * x1)
    b0, b1 = math.acos(x0 / r), math.acos(x1 / r)
    pts = [(x0, -ya0)]
    pts += [(r * math.cos(-b0 + (b0 - b1) * k / n), r * math.sin(-b0 + (b0 - b1) * k / n)) for k in range(1, n)]
    pts += [(x1, -ya1), (x1, ya1)]
    pts += [(r * math.cos(b1 + (b0 - b1) * k / n), r * math.sin(b1 + (b0 - b1) * k / n)) for k in range(1, n)]
    pts += [(x0, ya0)]
    return [(x, y, z) for x, y in pts]


loft('river', M['river'], [vstrip(-RW / 2, RW / 2, 1.42, G - 0.004), vstrip(-RW / 2, RW / 2, 1.42, G + 0.004)], outline=0)
for s in (-1, 1):
    box(f'embankment{s}', M['stoneDark'], s * (RW / 2 + 0.02), 0, G - 0.005, 0.04, 2.2, 0.03, outline=0.003, bevel=0)

DZ = G + 0.12   # the road deck's height
TX = 0.26       # the towers stand either side of the middle
TS = 0.16       # each tower's side
TH = 0.62       # each tower's height above the deck


def tower(s):
    x = s * TX
    box(f'pier{s}', M['stoneDark'], x, 0, G - 0.005, TS + 0.06, TS + 0.12, DZ - G + 0.005, outline=0.006, bevel=0)
    box(f'tower{s}', M['stone'], x, 0, DZ, TS, TS, TH, outline=0.008, bevel=0)
    # the road's archway through the tower
    for fy in (-1, 1):
        box(f'archway{s}{fy}', M['window'], x, fy * (TS / 2 + 0.003), DZ, 0.07, 0.006, 0.12, outline=0, bevel=0)
        cyl(f'archwaytop{s}{fy}', M['window'], 0.035, 0.006, segs=12, outline=0, matrix=Matrix.Translation((x, fy * (TS / 2 + 0.003), DZ + 0.12)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        for k in range(3):
            box(f'towerwin{s}{fy}{k}', M['window'], x, fy * (TS / 2 + 0.003), DZ + 0.22 + k * 0.12, 0.03, 0.006, 0.06, outline=0, bevel=0)
    # the turrets on the corners and their caps
    for sx in (-1, 1):
        for sy in (-1, 1):
            tx, ty = x + sx * TS / 2, sy * TS / 2
            lathe(f'turret{s}{sx}{sy}', M['stone'], ((0.03, 0), (0.03, TH + 0.05)), DZ, tx, ty, segs=8, outline=0.003, smooth=False)
            lathe(f'turretcap{s}{sx}{sy}', M['slate'], ((0.036, 0), (0.025, 0.04), (0.003, 0.1)), DZ + TH + 0.05, tx, ty, segs=8, outline=0.002, smooth=False)
            rod(f'finial{s}{sx}{sy}', M['gold'], (tx, ty, DZ + TH + 0.15), (tx, ty, DZ + TH + 0.17), 0.004, segs=4, outline=0)
    # the steep roof and its spire
    loft(f'towerroof{s}', M['slate'], [[(x - TS / 2, -TS / 2, DZ + TH), (x + TS / 2, -TS / 2, DZ + TH), (x + TS / 2, TS / 2, DZ + TH), (x - TS / 2, TS / 2, DZ + TH)],
                                        [(x - 0.01, -0.01, DZ + TH + 0.14), (x + 0.01, -0.01, DZ + TH + 0.14), (x + 0.01, 0.01, DZ + TH + 0.14), (x - 0.01, 0.01, DZ + TH + 0.14)]], outline=0.004)
    rod(f'spire{s}', M['gold'], (x, 0, DZ + TH + 0.14), (x, 0, DZ + TH + 0.2), 0.005, segs=4, outline=0)


for s in (-1, 1):
    tower(s)

# ---------- the high walkways ----------
WZ = DZ + TH - 0.12
for fy in (-1, 1):
    box(f'walkway{fy}', M['blue'], 0, fy * 0.055, WZ, 2 * TX - TS, 0.05, 0.07, outline=0.004, bevel=0)
    for k in range(7):
        x = -TX + TS / 2 + 0.03 + k * (2 * TX - TS - 0.06) / 6
        bar(f'truss{fy}{k}', M['white'], (x, fy * 0.08 + fy * 0.003, WZ + 0.005), (x + 0.04, fy * 0.08 + fy * 0.003, WZ + 0.065), 0.006, outline=0)

# ---------- the bascules, raised ----------
for s in (-1, 1):
    hinge = s * (TX - TS / 2)
    length = TX - TS / 2
    ang = math.radians(62)
    leaf = box(f'bascule{s}', M['deck'], 0, 0, -0.012, length, 0.13, 0.024, outline=0.004, bevel=0)
    rail = box(f'basculerail{s}', M['blue'], 0, 0, 0.012, length, 0.13, 0.012, outline=0.002, bevel=0)
    bpy.context.view_layer.update()
    m = Matrix.Translation((hinge, 0, DZ + 0.01)) @ Matrix.Rotation(s * ang, 4, 'Y') @ Matrix.Translation((-s * length / 2, 0, 0))
    for o in (leaf, rail):
        o.matrix_world = m @ o.matrix_world
    bpy.context.view_layer.update()

# ---------- the side spans to the banks ----------
for s in (-1, 1):
    x0, x1 = s * (TX + TS / 2), s * 0.95
    box(f'sidedeck{s}', M['deck'], (x0 + x1) / 2, 0, DZ - 0.02, abs(x1 - x0), 0.13, 0.03, outline=0.004, bevel=0)
    for fy in (-1, 1):
        pts = []
        for k in range(9):
            t = k / 8
            x = x0 + (x1 - x0) * t
            z = DZ + 0.02 + (TH - 0.15) * (1 - t) ** 2
            pts.append((x, fy * 0.072, z))
        for a, b in zip(pts, pts[1:]):
            bar(f'chain{s}{fy}{a[0]:.3f}', M['blue'], a, b, 0.014, outline=0.002)
        for a in pts[1:-1:2]:
            rod(f'hanger{s}{fy}{a[0]:.3f}', M['blue'], (a[0], a[1], DZ + 0.01), a, 0.003, segs=4, outline=0)
    # the abutment towers on the banks
    box(f'abutment{s}', M['stone'], s * 0.98, 0, G - 0.005, 0.1, 0.16, DZ - G + 0.1, outline=0.005, bevel=0)
    lathe(f'abutmentcap{s}', M['slate'], ((0.06, 0), (0.003, 0.06)), DZ + 0.095, s * 0.98, 0, segs=4, outline=0.002, smooth=False)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

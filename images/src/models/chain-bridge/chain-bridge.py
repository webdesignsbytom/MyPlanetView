# A cartoon Chain Bridge for the country maps, built in the set's shared look (../toon.py): Budapest's
# Széchenyi Chain Bridge over the Danube, its two stone towers shaped like triumphal arches on their
# piers in the river, the great iron chains swinging between them and down to the banks, the deck
# hung beneath, the stone lions guarding each end, and the banks of Buda and Pest. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P chain-bridge.py -- chain-bridge-1024.png 1024 chain-bridge.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c0b0', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'river': toon('river', '#4a8aa0', shadow_mul=(0.78, 0.86, 0.9), lift=0.3),
    'stone': toon('stone', '#d8ceb8', shadow_mul=(0.84, 0.84, 0.9), lift=0.15),
    'stoneDark': toon('stoneDark', '#b8ae98'),
    'iron': toon('iron', '#4a5a50', shadow_mul=(0.84, 0.88, 0.88), lift=0.1),
    'deck': toon('deck', '#7a7a80'),
    'dark': flat('dark', '#2e2a2a'),
    'lion': toon('lion', '#c8bea8'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


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


RW = 0.78   # half the Danube's width; it runs front to back
loft('river', M['river'], [vstrip(-RW, RW, 1.42, G - 0.004), vstrip(-RW, RW, 1.42, G + 0.004)], outline=0)

DZ = G + 0.14    # the deck
TX = 0.36        # the towers stand either side of the middle
BD = 0.13        # half the breadth


def tower(s):
    x = s * TX
    box(f'pier{s}', M['stoneDark'], x, 0, G - 0.005, 0.14, 2 * BD + 0.1, DZ - G, outline=0.006, bevel=0)
    for fy in (-1, 1):
        box(f'leg{s}{fy}', M['stone'], x, fy * (BD - 0.015), DZ - 0.01, 0.12, 0.07, 0.36, outline=0.007, bevel=0)
    box(f'towertop{s}', M['stone'], x, 0, DZ + 0.25, 0.12, 2 * BD + 0.04, 0.1, outline=0.007, bevel=0)
    box(f'towercornice{s}', M['stoneDark'], x, 0, DZ + 0.345, 0.14, 2 * BD + 0.06, 0.02, outline=0.003, bevel=0)
    # the arch's curve over the road through the tower
    cyl(f'towerarch{s}', M['dark'], 0.08, 0.13, segs=16, outline=0, matrix=Matrix.Translation((x, 0, DZ + 0.25)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))


for s in (-1, 1):
    tower(s)
box('deck', M['deck'], 0, 0, DZ - 0.02, 2.3, 2 * BD - 0.04, 0.03, outline=0.005, bevel=0)

# ---------- the chains ----------
TOP = DZ + 0.31


def chain(fy, x0, z0, x1, z1, sag, name):
    pts = []
    for k in range(13):
        t = k / 12
        pts.append((x0 + (x1 - x0) * t, fy * BD, z0 + (z1 - z0) * t - sag * 4 * t * (1 - t)))
    for k, (a, b) in enumerate(zip(pts, pts[1:])):
        bar(f'{name}{fy}{k}', M['iron'], a, b, 0.024, outline=0.002)
    for a in pts[1:-1]:
        if a[2] > DZ + 0.02:
            rod(f'{name}hanger{fy}{a[0]:.3f}', M['iron'], (a[0], a[1], DZ), a, 0.004, segs=4, outline=0)


for fy in (-1, 1):
    chain(fy, -TX, TOP, TX, TOP, TOP - DZ - 0.04, 'mainchain')
    for s in (-1, 1):
        chain(fy, s * TX, TOP, s * 1.0, DZ + 0.02, 0.06, f'sidechain{s}')

# ---------- the lions and the banks ----------
for s in (-1, 1):
    for fy in (-1, 1):
        x, y = s * 0.95, fy * (BD + 0.08)
        box(f'lionplinth{s}{fy}', M['stoneDark'], x, y, G - 0.005, 0.08, 0.08, 0.06, outline=0.003, bevel=0)
        body = ball(f'lion{s}{fy}', M['lion'], 0, 0, 0, 0.035, outline=0.003)
        body.scale = (1.6, 0.7, 0.7)
        body.location = (x, y, G + 0.08)
        ball(f'lionhead{s}{fy}', M['lion'], x - s * 0.05, y, G + 0.1, 0.022, outline=0.002)
    for k, y in enumerate((-0.6, 0.55)):
        rod(f'trunk{s}{k}', M['trunk'], (s * 1.05, y, G), (s * 1.05, y, G + 0.07), 0.013, segs=6, outline=0.002)
        ball(f'tree{s}{k}', M['tree'], s * 1.05, y, G + 0.14, 0.09, outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

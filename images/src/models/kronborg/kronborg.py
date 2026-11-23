# A cartoon Kronborg for the country maps, built in the set's shared look (../toon.py): Hamlet's
# castle at Helsingør, its four Renaissance wings round the courtyard in pale sandstone under green
# copper roofs, the tall spire and the towers, the star-shaped green ramparts and the moat round it,
# and a sailing ship on the Øresund. Turned a little towards the camera.
# Run: blender -b --factory-startup -P kronborg.py -- kronborg-1024.png 1024 kronborg.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#3a7aa0', shadow_mul=(0.74, 0.82, 0.9), lift=0.3),
    'rampart': toon('rampart', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'moat': toon('moat', '#4a8a9a', lift=0.3),
    'sandstone': toon('sandstone', '#e8dcc0', shadow_mul=(0.84, 0.82, 0.86), lift=0.15),
    'copper': toon('copper', '#4f9a80', shadow_mul=(0.78, 0.86, 0.84), lift=0.15),
    'window': flat('window', '#3a3640'),
    'ship': toon('ship', '#7a5236'),
    'sail': toon('sail', '#f8f4ea', lift=0.2),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1459)

# ---------- the star-shaped ramparts, the moat inside them ----------
STAR = []
for k in range(10):
    a = 2 * math.pi * k / 10 + 0.3
    r = 1.0 if k % 2 == 0 else 0.72
    STAR.append((r * math.cos(a), r * math.sin(a) * 0.85 + 0.05))
for k in range(10):
    (x0, y0), (x1, y1) = STAR[k], STAR[(k + 1) % 10]
    quad = [(x0, y0), (x1, y1), (x1 * 0.7, (y1 - 0.05) * 0.7 + 0.05), (x0 * 0.7, (y0 - 0.05) * 0.7 + 0.05)]
    loft(f'rampart{k}', M['rampart'], [[(x, y, G - 0.01) for x, y in quad], [(x, y, G + 0.12) for x, y in quad]], outline=0.012)
cyl('moat', M['moat'], 0.52, 0.12, segs=36, outline=0.004, matrix=Matrix.Translation((0.0, 0.05, G - 0.01)) @ Matrix.Scale(0.85, 4, Vector((0, 1, 0))))
cyl('isle', M['rampart'], 0.42, 0.13, segs=36, outline=0.006, matrix=Matrix.Translation((0.0, 0.05, G - 0.01)) @ Matrix.Scale(0.85, 4, Vector((0, 1, 0))))
T = G + 0.12

# ---------- the castle: four wings round the courtyard ----------
CX, CY = 0.0, 0.05
for k, (x, y, w, d) in enumerate(((CX, CY - 0.2, 0.5, 0.1), (CX, CY + 0.2, 0.5, 0.1), (CX - 0.2, CY, 0.1, 0.3), (CX + 0.2, CY, 0.1, 0.3))):
    box(f'wing{k}', M['sandstone'], x, y, T - 0.005, w, d, 0.17, outline=0.012, bevel=0)
    if w > d:
        rings = [[(x - w / 2, y - d / 2, T + 0.165), (x + w / 2, y - d / 2, T + 0.165), (x + w / 2, y + d / 2, T + 0.165), (x - w / 2, y + d / 2, T + 0.165)],
                 [(x - w / 2, y - 0.004, T + 0.25), (x + w / 2, y - 0.004, T + 0.25), (x + w / 2, y + 0.004, T + 0.25), (x - w / 2, y + 0.004, T + 0.25)]]
    else:
        rings = [[(x - w / 2, y - d / 2, T + 0.165), (x + w / 2, y - d / 2, T + 0.165), (x + w / 2, y + d / 2, T + 0.165), (x - w / 2, y + d / 2, T + 0.165)],
                 [(x - 0.004, y - d / 2, T + 0.25), (x + 0.004, y - d / 2, T + 0.25), (x + 0.004, y + d / 2, T + 0.25), (x - 0.004, y + d / 2, T + 0.25)]]
    loft(f'wingroof{k}', M['copper'], rings, outline=0.008)
for j in range(6):
    box(f'win{j}', M['window'], CX - 0.2 + j * 0.08, CY - 0.254, T + 0.06, 0.025, 0.006, 0.05, outline=0, bevel=0)
# the towers: the tall spire, the trumpeters' tower, two more
for k, (x, y, h, spire) in enumerate(((CX - 0.24, CY - 0.22, 0.3, 0.3), (CX + 0.24, CY - 0.22, 0.24, 0.16), (CX + 0.24, CY + 0.22, 0.26, 0.18), (CX - 0.24, CY + 0.22, 0.22, 0.14))):
    box(f'tower{k}', M['sandstone'], x, y, T - 0.005, 0.11, 0.11, h, outline=0.01, bevel=0)
    lathe(f'towercap{k}', M['copper'], ((0.07, 0), (0.05, spire * 0.2), (0.03, spire * 0.4), (0.04, spire * 0.5), (0.015, spire * 0.75), (0.003, spire)), T + h - 0.01, x, y,
          segs=8, outline=0.007)

# ---------- a sailing ship on the Øresund ----------
SX, SY = 0.75, -0.85
loft('shiphull', M['ship'], [[(SX - 0.16, SY, G), (SX + 0.1, SY - 0.04, G), (SX + 0.18, SY, G), (SX + 0.1, SY + 0.04, G)],
                             [(SX - 0.18, SY, G + 0.06), (SX + 0.1, SY - 0.05, G + 0.05), (SX + 0.22, SY, G + 0.07), (SX + 0.1, SY + 0.05, G + 0.05)]], outline=0.007)
for k, (dx, h) in enumerate(((-0.06, 0.28), (0.06, 0.32))):
    rod(f'mast{k}', M['ship'], (SX + dx, SY, G + 0.05), (SX + dx, SY, G + 0.05 + h), 0.005, segs=6, outline=0)
    for j in range(2):
        box(f'sail{k}{j}', M['sail'], SX + dx, SY, G + 0.09 + j * 0.11, 0.1, 0.008, 0.09, outline=0.003, bevel=0)

turn(before, -20)
render(G)

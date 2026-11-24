# A cartoon White Tower of Thessaloniki for the country maps, built in the set's shared look
# (../toon.py): the round Ottoman tower on the city's seafront, its pale stone drum with the arrow-slit
# windows climbing it, the battlemented gallery round its top and the little round turret on its
# roof flying the Greek flag, the promenade with its palms and the Thermaic Gulf in front. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P white-tower.py -- white-tower-1024.png 1024 white-tower.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8d0c0', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'sea': toon('sea', '#3a8ac0', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'stone': toon('stone', '#ece4d2', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'stoneDark': toon('stoneDark', '#cfc4ae'),
    'dark': flat('dark', '#2e2a2a'),
    'blue': toon('blue', '#2a6ac0'),
    'white': toon('white', '#f6f4ee'),
    'lawn': toon('lawn', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z, n=6):
    """The band of the tile's disc between y0 and y1 (counter-clockwise from above)."""
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('gulf', M['sea'], [strip(-1.41, -0.55, 1.42, -0.004), strip(-1.41, -0.55, 1.42, 0.004)], outline=0)
box('seawall', M['stoneDark'], 0, -0.55, G - 0.005, 2.3, 0.04, 0.03, outline=0.003, bevel=0)
lathe('lawn', M['lawn'], ((0.5, 0), (0.5, 0.012)), G - 0.004, 0, 0.12, segs=36, outline=0.002)

# ---------- the tower ----------
TX, TY = 0.0, 0.12
R, H = 0.24, 0.66
lathe('tower', M['stone'], ((R + 0.01, 0), (R, H)), G - 0.005, TX, TY, segs=32, outline=0.009)
for k in range(6):
    lathe(f'course{k}', M['stoneDark'], ((R + 0.004, 0), (R + 0.004, 0.006)), G + 0.1 + k * 0.1, TX, TY, segs=32, outline=0)
# the windows, small and spiralling up the drum as the ramp inside does
for k in range(14):
    a = -math.pi / 2 + (k * 0.9) % (2 * math.pi) - 0.9
    z = G + 0.08 + k * 0.038
    if math.sin(a) > 0.2:
        continue
    x, y = TX + (R + 0.002) * math.cos(a), TY + (R + 0.002) * math.sin(a)
    box(f'win{k}', M['dark'], x, y, z, 0.03, 0.028, 0.05, rot_z=a + math.pi / 2, outline=0, bevel=0)
box('door', M['dark'], TX, TY - R - 0.003, G - 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)
cyl('doortop', M['dark'], 0.03, 0.006, segs=10, outline=0, matrix=Matrix.Translation((TX, TY - R - 0.003, G + 0.095)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
# the battlemented gallery
lathe('gallery', M['stoneDark'], ((R + 0.03, 0), (R + 0.03, 0.02)), G + H - 0.01, TX, TY, segs=32, outline=0.004)
for k in range(20):
    a = 2 * math.pi * k / 20
    box(f'merlon{k}', M['stone'], TX + (R + 0.015) * math.cos(a), TY + (R + 0.015) * math.sin(a), G + H + 0.01, 0.04, 0.03, 0.04, rot_z=a + math.pi / 2, outline=0.002, bevel=0)
# the turret on the roof and the flag
lathe('turret', M['stone'], ((0.09, 0), (0.09, 0.14)), G + H + 0.005, TX, TY, segs=20, outline=0.005)
for k in range(8):
    a = 2 * math.pi * k / 8
    box(f'turretwin{k}', M['dark'], TX + 0.092 * math.cos(a), TY + 0.092 * math.sin(a), G + H + 0.06, 0.02, 0.02, 0.04, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('turretrim', M['stoneDark'], ((0.1, 0), (0.1, 0.015)), G + H + 0.14, TX, TY, segs=20, outline=0.002)
rod('flagpole', M['white'], (TX, TY, G + H + 0.15), (TX, TY, G + H + 0.36), 0.004, segs=4, outline=0)
for k in range(5):
    box(f'flagstripe{k}', M['blue'] if k % 2 == 0 else M['white'], TX + 0.045, TY, G + H + 0.32 - k * 0.012, 0.08, 0.004, 0.012, outline=0, bevel=0)
box('flagcanton', M['blue'], TX + 0.018, TY, G + H + 0.3, 0.026, 0.005, 0.034, outline=0, bevel=0)

# ---------- the promenade's palms ----------
for k, x in enumerate((-0.95, -0.65, 0.65, 0.95)):
    y = -0.4
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.3), 0.014, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.02, y, G + 0.3), (x + 0.02 + 0.1 * math.cos(a), y + 0.1 * math.sin(a), G + 0.25), 0.022, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

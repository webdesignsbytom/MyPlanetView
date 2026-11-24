# A cartoon Saint-Jacques Tower for the country maps, built in the set's shared look (../toon.py): the
# lone Flamboyant Gothic bell tower in Paris, all that is left of its church, its pale stone
# buttresses climbing in tiers of pinnacles and tracery, the gargoyles and the statue of St James on
# its top, in its little square garden with railings, lawns and plane trees. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P saint-jacques-tower.py -- saint-jacques-tower-1024.png 1024 saint-jacques-tower.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c0b0', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#ece2cc', shadow_mul=(0.84, 0.84, 0.88), lift=0.2),
    'stoneDark': toon('stoneDark', '#cfc2a4'),
    'dark': flat('dark', '#2e2a2a'),
    'iron': toon('iron', '#2a2e34'),
    'gold': toon('gold', '#e0b040', lift=0.2),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the square's garden ----------
box('garden', M['lawn'], 0, 0.0, G - 0.004, 1.2, 1.0, 0.012, outline=0.002, bevel=0)
for k, (x0, y0, x1, y1) in enumerate(((-0.6, -0.5, 0.6, -0.5), (-0.6, -0.5, -0.6, 0.5), (0.6, -0.5, 0.6, 0.5), (-0.6, 0.5, 0.6, 0.5))):
    n = int(math.hypot(x1 - x0, y1 - y0) / 0.05)
    for j in range(n + 1):
        t = j / n
        rod(f'railing{k}{j}', M['iron'], (x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, G), (x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, G + 0.06), 0.003, segs=4, outline=0)
    bar(f'railingtop{k}', M['iron'], (x0, y0, G + 0.055), (x1, y1, G + 0.055), 0.006, outline=0)
for k, (x, y) in enumerate(((-0.4, -0.3), (0.4, -0.3), (-0.4, 0.3), (0.4, 0.3), (-0.85, -0.75), (0.85, -0.75))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.09), 0.014, segs=6, outline=0.002)
    ball(f'tree{k}', M['tree'], x, y, G + 0.18, 0.12, outline=0.012)

# ---------- the tower ----------
TS, TH = 0.22, 0.9
box('tower', M['stone'], 0, 0, G - 0.005, TS, TS, TH, outline=0.008, bevel=0)
# the corner buttresses, stepping in, each tier ending in a pinnacle
for sx in (-1, 1):
    for sy in (-1, 1):
        for t, (off, z0, z1) in enumerate(((0.03, 0.0, 0.3), (0.02, 0.3, 0.62), (0.012, 0.62, 0.88))):
            x, y = sx * (TS / 2 + off * 0.5), sy * (TS / 2 + off * 0.5)
            box(f'buttress{sx}{sy}{t}', M['stone'], x, y, G - 0.005 + z0, 0.05, 0.05, z1 - z0, outline=0.003, bevel=0)
            lathe(f'pinnacle{sx}{sy}{t}', M['stoneDark'], ((0.018, 0), (0.003, 0.07)), G + z1 - 0.01, x + sx * 0.012, y + sy * 0.012, segs=6, outline=0.001, smooth=False)
# the tall traceried openings on the faces the camera sees
for face, (nx, ny) in enumerate(((0, -1), (-1, 0))):
    for k in range(3):
        z = G + 0.12 + k * 0.26
        for j in (-1, 1):
            ox, oy = (j * 0.04, 0) if ny else (0, j * 0.04)
            box(f'tracery{face}{k}{j}', M['dark'], nx * (TS / 2 + 0.003) + ox, ny * (TS / 2 + 0.003) + oy, z, 0.03 if ny else 0.006, 0.006 if ny else 0.03, 0.16, outline=0, bevel=0)
            pyramid(f'traceryarch{face}{k}{j}', M['dark'], nx * (TS / 2 + 0.003) + ox, ny * (TS / 2 + 0.003) + oy, z + 0.16, 0.03, 0.025, outline=0)
# the gargoyles under the top and the balustrade
for sx in (-1, 1):
    for sy in (-1, 1):
        bar(f'gargoyle{sx}{sy}', M['stoneDark'], (sx * TS / 2, sy * TS / 2, G + TH - 0.06), (sx * (TS / 2 + 0.06), sy * (TS / 2 + 0.06), G + TH - 0.05), 0.018, outline=0.001)
box('balustrade', M['stoneDark'], 0, 0, G + TH - 0.01, TS + 0.03, TS + 0.03, 0.03, outline=0.002, bevel=0)
# the stair turret and the statue of St James on its top
lathe('turret', M['stone'], ((0.035, 0), (0.035, 0.1)), G + TH + 0.02, 0.06, 0.06, segs=10, outline=0.002)
lathe('turretcap', M['stoneDark'], ((0.04, 0), (0.003, 0.06)), G + TH + 0.12, 0.06, 0.06, segs=10, outline=0.002, smooth=False)
lathe('statueplinth', M['stoneDark'], ((0.03, 0), (0.025, 0.03)), G + TH + 0.02, -0.04, -0.04, segs=8, outline=0.001, smooth=False)
rod('stjames', M['stone'], (-0.04, -0.04, G + TH + 0.05), (-0.04, -0.04, G + TH + 0.14), 0.016, r2=0.011, segs=8, outline=0.002)
ball('stjameshead', M['stone'], -0.04, -0.04, G + TH + 0.155, 0.011, outline=0.001)
rod('stjamesstaff', M['gold'], (-0.02, -0.05, G + TH + 0.06), (-0.015, -0.05, G + TH + 0.18), 0.003, segs=4, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

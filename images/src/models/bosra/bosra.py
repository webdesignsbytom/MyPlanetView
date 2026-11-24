# A cartoon Bosra for the country maps, built in the set's shared look (../toon.py): the Roman
# theatre of black basalt hidden inside the Arab citadel built round it, the citadel's dark walls and
# round towers, and within them the steep semicircle of seats facing the tall columned stage wall.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P bosra.py -- bosra-1024.png 1024 bosra.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#c8b890', shadow_mul=(0.84, 0.82, 0.8), lift=0.2),
    'basalt': toon('basalt', '#5a5652', shadow_mul=(0.84, 0.84, 0.9), lift=0.06),
    'basaltLight': toon('basaltLight', '#7a7470', lift=0.04),
    'seat': toon('seat', '#6a6662', shadow_mul=(0.84, 0.84, 0.9), lift=0.06),
    'column': toon('column', '#e0d8c8', lift=0.12),
    'dark': flat('dark', '#1e1c1a'),
    'olive': toon('olive', '#7a9a50', shadow_mul=(0.72, 0.8, 0.74)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)

# ---------- the citadel walls and towers ----------
CX, CY, R = 0.0, 0.08, 0.62
TOWERS = [math.radians(a) for a in (200, 240, 280, 320, 0, 40, 140, 180)]
for k in range(len(TOWERS)):
    a0, a1 = TOWERS[k], TOWERS[(k + 1) % len(TOWERS)]
    if a1 < a0:
        a1 += 2 * math.pi
    x0, y0 = CX + R * math.cos(a0), CY + R * 0.85 * math.sin(a0)
    x1, y1 = CX + R * math.cos(a1), CY + R * 0.85 * math.sin(a1)
    ang = math.atan2(y1 - y0, x1 - x0)
    box(f'wall{k}', M['basalt'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.005, math.hypot(x1 - x0, y1 - y0), 0.07, 0.2, rot_z=ang, outline=0.007, bevel=0)
    lathe(f'tower{k}', M['basalt'], ((0.09, 0), (0.08, 0.06), (0.08, 0.26)), G - 0.005, x0, y0, segs=16, outline=0.006)
    for j in range(6):
        b = 2 * math.pi * j / 6
        box(f'merlon{k}{j}', M['basaltLight'], x0 + 0.07 * math.cos(b), y0 + 0.07 * math.sin(b), G + 0.255, 0.03, 0.025, 0.03, rot_z=b, outline=0.001, bevel=0)
    if math.sin(a0) < -0.3:
        box(f'slit{k}', M['dark'], x0, y0 - 0.083, G + 0.15, 0.015, 0.006, 0.04, outline=0, bevel=0)
box('gate', M['dark'], CX + 0.0, CY - R * 0.85 - 0.04, G - 0.005, 0.05, 0.006, 0.08, outline=0, bevel=0)

# ---------- the theatre inside ----------
OX, OY = CX, CY + 0.12
rows, n = 9, 12
for j in range(rows):
    r0 = 0.1 + j * 0.045
    z = G + 0.02 + j * 0.025
    for k in range(n):
        a0 = math.pi * k / n
        a1 = math.pi * (k + 1) / n
        p = lambda r, a, zz: (OX + r * math.cos(a), OY + r * math.sin(a) * 0.85, zz)
        loft(f'seat{j}{k}', M['seat'], [[p(r0, a0, G - 0.005), p(r0 + 0.047, a0, G - 0.005), p(r0 + 0.047, a1, G - 0.005), p(r0, a1, G - 0.005)],
                                        [p(r0, a0, z), p(r0 + 0.047, a0, z), p(r0 + 0.047, a1, z), p(r0, a1, z)]], outline=0.001)
SY = OY - 0.12
box('stage', M['basaltLight'], OX, SY + 0.04, G - 0.005, 0.5, 0.08, 0.04, outline=0.003, bevel=0)
box('scaena', M['basalt'], OX, SY - 0.02, G - 0.005, 0.54, 0.05, 0.22, outline=0.005, bevel=0)
for r, z in enumerate((0.04, 0.13)):
    for j in range(9):
        x = OX - 0.24 + j * 0.06
        rod(f'col{r}{j}', M['column'], (x, SY + 0.015, G + z), (x, SY + 0.015, G + z + 0.08), 0.008, segs=8, outline=0.001)
    box(f'stageentab{r}', M['column'], OX, SY + 0.015, G + z + 0.08, 0.52, 0.02, 0.012, outline=0, bevel=0)
for k, (x, y) in enumerate(((-0.85, -0.4), (0.85, -0.42), (-0.85, 0.5), (0.85, 0.5))):
    ball(f'olive{k}', M['olive'], x, y, G + 0.07, 0.07, outline=0.005)

turn(before, -20)
render(G)

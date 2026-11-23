# A cartoon Stonehenge for the country maps, built in the set's shared look (../toon.py): the sarsen
# circle with its lintels, some fallen, the horseshoe of great trilithons inside, the smaller
# bluestones, the Heel Stone, the ditch and bank round it on Salisbury Plain, and visitors on the
# path. Turned a little towards the camera.
# Run: blender -b --factory-startup -P stonehenge.py -- stonehenge-1024.png 1024 stonehenge.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'plain': toon('plain', '#8ab860', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'bank': toon('bank', '#7aa84a', shadow_mul=(0.72, 0.8, 0.74)),
    'sarsen': toon('sarsen', '#a8a296', shadow_mul=(0.84, 0.84, 0.9)),
    'sarsenDark': toon('sarsenDark', '#8a8478', shadow_mul=(0.84, 0.84, 0.9)),
    'blue': toon('bluestone', '#7a8088', shadow_mul=(0.84, 0.84, 0.9)),
    'path': toon('path2', '#d9c9a8', lift=0.25),
    's0': toon('s0', '#e8402c'), 's1': toon('s1', '#2f6fc0'), 's2': toon('s2', '#f0c030'),
    'skin': toon('skin', '#e0a882'),
})

G = tile(M['plain'])
before = set(bpy.data.objects)
rng = random.Random(1549)

CX, CY = 0.0, 0.1
# ---------- the ditch and bank ----------
for k in range(36):
    a = 2 * math.pi * k / 36
    box(f'bank{k}', M['bank'], CX + 0.95 * math.cos(a), CY + 0.8 * math.sin(a), G - 0.005, 0.17, 0.06, 0.03, rot_z=a + math.pi / 2, outline=0.003, bevel=0)
box('path', M['path'], CX + 0.55, -0.8, G - 0.004, 0.12, 0.7, 0.008, rot_z=-0.5, outline=0.003, bevel=0)

# ---------- the sarsen circle and its lintels ----------
N = 22
R, RY = 0.52, 0.46
MISSING = {5, 6, 13, 17}
for k in range(N):
    if k in MISSING:
        continue
    a = 2 * math.pi * k / N
    x, y = CX + R * math.cos(a), CY + RY * math.sin(a)
    box(f'sarsen{k}', M['sarsen' if k % 2 else 'sarsenDark'], x, y, G - 0.005, 0.07, 0.045, 0.24, rot_z=a + math.pi / 2, outline=0.008, bevel=0)
for k in range(N):
    if k in MISSING or (k + 1) % N in MISSING or k in (10, 20):
        continue
    a0, a1 = 2 * math.pi * k / N, 2 * math.pi * (k + 1) / N
    x0, y0 = CX + R * math.cos(a0), CY + RY * math.sin(a0)
    x1, y1 = CX + R * math.cos(a1), CY + RY * math.sin(a1)
    box(f'lintel{k}', M['sarsenDark'], (x0 + x1) / 2, (y0 + y1) / 2, G + 0.235, math.hypot(x1 - x0, y1 - y0) + 0.05, 0.05, 0.04, rot_z=math.atan2(y1 - y0, x1 - x0),
        outline=0.006, bevel=0)
# fallen stones
box('fallen0', M['sarsen'], CX + 0.42, CY - 0.55, G - 0.005, 0.22, 0.07, 0.045, rot_z=0.4, outline=0.006, bevel=0)
box('fallen1', M['sarsenDark'], CX - 0.6, CY + 0.25, G - 0.005, 0.2, 0.07, 0.04, rot_z=1.2, outline=0.006, bevel=0)

# ---------- the horseshoe of trilithons ----------
for k, (a, h) in enumerate(((150, 0.3), (115, 0.34), (90, 0.38), (65, 0.34), (30, 0.3))):
    a = math.radians(a)
    x, y = CX + 0.28 * math.cos(a), CY + 0.24 * math.sin(a) - 0.04
    t = a + math.pi / 2
    for s in (-1, 1):
        box(f'trilithon{k}{s}', M['sarsen'], x + s * 0.045 * math.cos(t), y + s * 0.045 * math.sin(t), G - 0.005, 0.06, 0.05, h, rot_z=t, outline=0.008, bevel=0)
    if k != 3:
        box(f'trilithonlintel{k}', M['sarsenDark'], x, y, G + h - 0.008, 0.17, 0.05, 0.045, rot_z=t, outline=0.006, bevel=0)

# ---------- bluestones, the Heel Stone, visitors ----------
for k in range(12):
    a = 2 * math.pi * k / 12 + 0.2
    box(f'bluestone{k}', M['blue'], CX + 0.4 * math.cos(a), CY + 0.34 * math.sin(a), G - 0.005, 0.03, 0.025, 0.12, rot_z=a, outline=0.004, bevel=0)
box('heelstone', M['sarsenDark'], CX + 0.3, CY - 0.75, G - 0.005, 0.08, 0.06, 0.2, rot_z=0.3, outline=0.008, bevel=0)
for k, (x, y) in enumerate(((0.75, -0.9), (0.85, -0.75), (0.68, -0.65))):
    rod(f'visitor{k}', M[f's{k}'], (x, y, G), (x, y, G + 0.08), 0.016, segs=8, outline=0.003)
    ball(f'visitorhead{k}', M['skin'], x, y, G + 0.098, 0.016, outline=0.003)

turn(before, -20)
render(G)

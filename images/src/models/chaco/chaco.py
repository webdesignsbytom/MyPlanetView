# A cartoon Chaco Culture for the country maps, built in the set's shared look (../toon.py):
# Pueblo Bonito, the great house of the Ancestral Puebloans in Chaco Canyon, its D-shaped ruin of
# finely laid sandstone walls, highest along the curved back and low along the straight front, the
# grid of rooms inside and the round kivas sunk in its plaza, under the canyon's sandstone cliff.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P chaco.py -- chaco-1024.png 1024 chaco.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d0b888', shadow_mul=(0.84, 0.82, 0.8), lift=0.2),
    'cliff': toon('cliff', '#c8a070', shadow_mul=(0.86, 0.82, 0.76)),
    'wall': toon('wall', '#b8946a', shadow_mul=(0.86, 0.82, 0.76), lift=0.06),
    'wallDark': toon('wallDark', '#9a7a52'),
    'plaza': toon('plaza', '#c8b088'),
    'dark': flat('dark', '#3a2e24'),
    'shrub': toon('shrub', '#8a9a50'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(2617)

cl = loft('cliff', M['cliff'], [[(-1.0, 0.6, G - 0.01), (1.0, 0.6, G - 0.01), (1.0, 0.95, G - 0.01), (-1.0, 0.95, G - 0.01)],
                                [(-0.95, 0.66, G + 0.3), (0.95, 0.66, G + 0.3), (0.95, 0.93, G + 0.3), (-0.95, 0.93, G + 0.3)]], outline=0.01)
cl.visible_shadow = False
for k in range(3):
    box(f'stratum{k}', M['wallDark'], 0.0, 0.6 + 0.06 * (0.08 + k * 0.08) / 0.3 - 0.006, G + 0.08 + k * 0.08, 1.9, 0.008, 0.01, outline=0, bevel=0)

# ---------- the D-shaped great house ----------
CX, CY, R, SY = 0.0, -0.3, 0.62, 0.85
box('frontwall', M['wall'], CX, CY, G - 0.005, 2 * R, 0.04, 0.05, outline=0.004, bevel=0)
n = 20
for k in range(n):
    a0, a1 = math.pi * k / n, math.pi * (k + 1) / n
    p0 = (CX + R * math.cos(a0), CY + R * SY * math.sin(a0))
    p1 = (CX + R * math.cos(a1), CY + R * SY * math.sin(a1))
    h = 0.06 + 0.1 * math.sin((a0 + a1) / 2)
    bar(f'backwall{k}', M['wall'], (p0[0], p0[1], G + h / 2 - 0.005), (p1[0], p1[1], G + h / 2 - 0.005), h, outline=0.003)
    for r, rr in enumerate((R - 0.08, R - 0.16)):
        q0 = (CX + rr * math.cos(a0), CY + rr * SY * math.sin(a0))
        q1 = (CX + rr * math.cos(a1), CY + rr * SY * math.sin(a1))
        hh = (0.05 + 0.07 * math.sin((a0 + a1) / 2)) * (1 - 0.25 * r)
        bar(f'roomwall{k}{r}', M['wallDark'], (q0[0], q0[1], G + hh / 2 - 0.005), (q1[0], q1[1], G + hh / 2 - 0.005), 0.025, outline=0.001)
    if k % 2 == 0:
        for rr in (R - 0.04, R - 0.12):
            m = (a0 + a1) / 2
            x0, y0 = CX + (rr + 0.04) * math.cos(m), CY + (rr + 0.04) * SY * math.sin(m)
            x1, y1 = CX + (rr - 0.04) * math.cos(m), CY + (rr - 0.04) * SY * math.sin(m)
            bar(f'crosswall{k}{rr}', M['wallDark'], (x0, y0, G + 0.025), (x1, y1, G + 0.025), 0.02, outline=0)
    if math.sin(a0) > 0.4 and k % 3 == 0:
        box(f'door{k}', M['dark'], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, G + 0.02, 0.02, 0.006, 0.03, rot_z=(a0 + a1) / 2 + math.pi / 2, outline=0, bevel=0)
box('dividewall', M['wall'], CX, CY + 0.14, G - 0.005, 0.03, 0.28, 0.06, outline=0.002, bevel=0)

# ---------- the plaza and its kivas ----------
for k, (x, y, r) in enumerate(((-0.25, -0.12, 0.08), (0.22, -0.15, 0.08), (-0.05, 0.02, 0.06), (0.36, 0.02, 0.05), (-0.38, 0.05, 0.05), (0.08, -0.2, 0.05))):
    m = 16
    lathe(f'kivafloor{k}', M['plaza'], ((r, 0), (r, 0.006)), G - 0.004, x, y, segs=m, outline=0)
    for j in range(m):
        a0, a1 = 2 * math.pi * j / m, 2 * math.pi * (j + 1) / m
        bar(f'kiva{k}{j}', M['wall'], (x + r * math.cos(a0), y + r * math.sin(a0), G + 0.018), (x + r * math.cos(a1), y + r * math.sin(a1), G + 0.018), 0.036, outline=0)
for k in range(10):
    x, y = rng.uniform(-0.9, 0.9), rng.uniform(-0.85, -0.4)
    if math.hypot(x, y) > 1.05:
        continue
    ball(f'shrub{k}', M['shrub'], x, y, G + 0.015, 0.03, outline=0.002)

turn(before, -20)
render(G)

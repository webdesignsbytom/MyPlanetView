# A cartoon Ġgantija for the country maps, built in the set's shared look (../toon.py): the
# megalithic temples on Gozo in Malta, older than the pyramids, their great concave front wall
# of huge upright and laid stones round a forecourt, the trilithon doorway at its middle, and
# inside the lobed chambers, the clover-leaf plan of the two temples side by side, on the
# hilltop among the prickly pears. Turned a little towards the camera.
# Run: blender -b --factory-startup -P ggantija.py -- ggantija-1024.png 1024 ggantija.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#b0b868', shadow_mul=(0.74, 0.78, 0.8), lift=0.2),
    'stone': toon('stone', '#d8c49c', shadow_mul=(0.8, 0.78, 0.84), lift=0.16),
    'stoneDark': toon('stoneDark', '#b8a47c'),
    'floor': toon('floor', '#c8b088', lift=0.15),
    'dark': flat('dark', '#2e2620'),
    'cactus': toon('cactus', '#6a9a50', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(216862)

# ---------- the two temples' lobed outer walls ----------
for t, (cx, cy, s) in enumerate(((-0.25, 0.15, 1.0), (0.32, 0.1, 0.85))):
    lobes = ((0.0, -0.08, 0.2), (-0.14, 0.12, 0.17), (0.14, 0.12, 0.17), (0.0, 0.3, 0.16))
    for l, (lx, ly, r) in enumerate(lobes):
        r *= s
        x, y = cx + lx * s, cy + ly * s
        n = 12
        for k in range(n):
            a0, a1 = 2 * math.pi * k / n, 2 * math.pi * (k + 1) / n
            p0 = (x + r * math.cos(a0), y + r * math.sin(a0))
            p1 = (x + r * math.cos(a1), y + r * math.sin(a1))
            h = (0.18 + 0.08 * rng.random()) * s
            bar(f'wall{t}{l}{k}', M['stone'] if k % 2 else M['stoneDark'], (p0[0], p0[1], G + h / 2 - 0.01), (p1[0], p1[1], G + h / 2 - 0.01), 0.06 * s, outline=0.003)
        lathe(f'floor{t}{l}', M['floor'], ((r * 0.95, 0), (r * 0.95, 0.012)), G - 0.006, x, y, segs=16, outline=0.001)

# ---------- the concave front wall and the trilithon ----------
FY = -0.25
for k in range(13):
    a0, a1 = math.pi + 0.35 + k * 0.188, math.pi + 0.35 + (k + 1) * 0.188
    p0 = (0.0 + 0.9 * math.cos(a0), FY + 0.5 + 0.55 * math.sin(a0))
    p1 = (0.0 + 0.9 * math.cos(a1), FY + 0.5 + 0.55 * math.sin(a1))
    if k in (3, 9):
        continue
    h = 0.26 + 0.08 * rng.random()
    mx, my = (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2
    box(f'front{k}', M['stone'], mx, my, G - 0.005, 0.13, 0.08, h, rot_z=(a0 + a1) / 2 + math.pi / 2, outline=0.005, bevel=0)
    box(f'frontcourse{k}', M['stoneDark'], mx, my, G - 0.005 + h, 0.13, 0.08, 0.05, rot_z=(a0 + a1) / 2 + math.pi / 2 + 0.1, outline=0.003, bevel=0)
for t, (cx, a) in enumerate(((-0.25, math.pi + 0.35 + 3.5 * 0.188), (0.32, math.pi + 0.35 + 9.5 * 0.188))):
    x, y = 0.9 * math.cos(a), FY + 0.5 + 0.55 * math.sin(a)
    for s in (-1, 1):
        box(f'jamb{t}{s}', M['stoneDark'], x + s * 0.06, y, G - 0.005, 0.05, 0.08, 0.2, rot_z=a + math.pi / 2, outline=0.004, bevel=0)
    box(f'lintel{t}', M['stone'], x, y, G + 0.195, 0.18, 0.09, 0.05, rot_z=a + math.pi / 2, outline=0.004, bevel=0)
    box(f'doorway{t}', M['dark'], x, y - 0.02, G - 0.005, 0.07, 0.04, 0.19, rot_z=a + math.pi / 2, outline=0, bevel=0)
box('forecourt', M['floor'], 0.0, -0.55, G - 0.005, 1.0, 0.25, 0.01, outline=0.001, bevel=0)

# ---------- prickly pears ----------
for k, (x, y) in enumerate(((-0.95, -0.4), (0.95, -0.45), (-0.85, 0.65), (0.9, 0.55), (0.0, 0.95))):
    for j in range(4):
        b = ball(f'pad{k}{j}', M['cactus'], 0, 0, 0, 0.05, outline=0.004)
        b.scale = (1.0, 0.35, 1.25)
        b.rotation_euler = (0, 0, j * 0.8)
        b.location = (x + 0.04 * math.cos(j * 1.6), y + 0.04 * math.sin(j * 1.6), G + 0.05 + 0.04 * (j % 2))

bpy.context.view_layer.update()
turn(before, -20)
render(G)

# A cartoon Citadel of Aleppo for the country maps, built in the set's shared look (../toon.py):
# the great fortress on its mound over the old city, the steep stone-faced glacis rising from the
# moat, the walls and towers round the top with the mosque's square minaret inside, and the arched
# bridge climbing from the outer gate tower over the moat to the massive gatehouse. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P aleppo-citadel.py -- aleppo-citadel-1024.png 1024 aleppo-citadel.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8ccb0', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'moat': toon('moat', '#8a9a6a'),
    'glacis': toon('glacis', '#c8b088', shadow_mul=(0.86, 0.82, 0.76)),
    'stone': toon('stone', '#d4bc90', shadow_mul=(0.86, 0.82, 0.76), lift=0.06),
    'stoneDark': toon('stoneDark', '#b09868'),
    'dark': flat('dark', '#3a3028'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def oval(cx, cy, rx, ry, z, sides=32):
    return [(cx + rx * math.cos(2 * math.pi * j / sides), cy + ry * math.sin(2 * math.pi * j / sides), G + z) for j in range(sides)]


CX, CY = 0.05, 0.25
loft('moat', M['moat'], [oval(CX, CY, 0.92, 0.7, -0.004), oval(CX, CY, 0.92, 0.7, 0.004)], outline=0.003, smooth=True)
gl = loft('glacis', M['glacis'], [oval(CX, CY, 0.82, 0.6, -0.01), oval(CX, CY, 0.6, 0.42, 0.3)], outline=0.01, smooth=True)
gl.visible_shadow = False
T = G + 0.3

# ---------- the walls on top ----------
n = 22
for j in range(n):
    a0, a1 = 2 * math.pi * j / n, 2 * math.pi * (j + 1) / n
    p0 = (CX + 0.58 * math.cos(a0), CY + 0.4 * math.sin(a0))
    p1 = (CX + 0.58 * math.cos(a1), CY + 0.4 * math.sin(a1))
    bar(f'wall{j}', M['stone'], (p0[0], p0[1], T + 0.03), (p1[0], p1[1], T + 0.03), 0.07, outline=0.003)
    if j % 3 == 0:
        box(f'walltower{j}', M['stone'], p0[0], p0[1], T - 0.005, 0.09, 0.09, 0.12, rot_z=a0, outline=0.004, bevel=0)
box('mosque', M['stone'], CX + 0.15, CY + 0.08, T - 0.005, 0.2, 0.14, 0.1, outline=0.004, bevel=0)
box('minaret', M['stone'], CX + 0.28, CY + 0.12, T - 0.005, 0.07, 0.07, 0.3, outline=0.004, bevel=0)
box('minaretwin', M['dark'], CX + 0.28, CY + 0.083, T + 0.22, 0.025, 0.006, 0.04, outline=0, bevel=0)
box('minarettop', M['stoneDark'], CX + 0.28, CY + 0.12, T + 0.29, 0.08, 0.08, 0.02, outline=0.001, bevel=0)
box('palace', M['stone'], CX - 0.2, CY + 0.12, T - 0.005, 0.24, 0.16, 0.08, outline=0.004, bevel=0)

# ---------- the gatehouse, bridge and outer gate ----------
GX, GY = CX - 0.05, CY - 0.4
box('gatehouse', M['stone'], GX, GY, G + 0.12, 0.28, 0.16, 0.32, outline=0.008, bevel=0)
for j in range(5):
    box(f'gatemerlon{j}', M['stoneDark'], GX - 0.11 + j * 0.055, GY - 0.07, G + 0.435, 0.03, 0.025, 0.035, outline=0.001, bevel=0)
for j in range(3):
    box(f'gateslit{j}', M['dark'], GX - 0.08 + j * 0.08, GY - 0.083, G + 0.33, 0.02, 0.006, 0.05, outline=0, bevel=0)
box('gatedoor', M['dark'], GX, GY - 0.083, G + 0.16, 0.06, 0.006, 0.09, outline=0, bevel=0)
OX, OY = GX, -0.62
box('outergate', M['stone'], OX, OY, G - 0.005, 0.16, 0.12, 0.2, outline=0.006, bevel=0)
box('outerdoor', M['dark'], OX, OY - 0.063, G - 0.005, 0.05, 0.006, 0.09, outline=0, bevel=0)
for j in range(3):
    box(f'outermerlon{j}', M['stoneDark'], OX - 0.05 + j * 0.05, OY - 0.05, G + 0.195, 0.03, 0.025, 0.03, outline=0.001, bevel=0)
steps = 8
for i in range(steps):
    t0, t1 = i / steps, (i + 1) / steps
    y0, y1 = OY + 0.06 + (GY - 0.08 - OY - 0.06) * t0, OY + 0.06 + (GY - 0.08 - OY - 0.06) * t1
    z0, z1 = G + 0.12 + 0.05 * t0, G + 0.12 + 0.05 * t1
    bar(f'bridge{i}', M['stone'], (OX, y0, z0), (OX, y1, z1), 0.08, outline=0.002)
for k in range(3):
    y = OY + 0.12 + k * 0.1
    box(f'pier{k}', M['stone'], OX, y, G - 0.005, 0.07, 0.05, 0.13 + 0.02 * k, outline=0.003, bevel=0)

turn(before, -20)
render(G)

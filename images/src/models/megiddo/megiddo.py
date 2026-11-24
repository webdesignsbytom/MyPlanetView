# A cartoon Megiddo for the country maps, built in the set's shared look (../toon.py): the great tel
# in the Jezreel Valley of Israel, a flat-topped mound built up of twenty cities one on top of
# the other: the Solomonic six-chambered gate, the round Canaanite altar of stones with its
# steps, the rows of pillars of the stables, the low walls of the palaces, and the green valley
# below. Turned a little towards the camera.
# Run: blender -b --factory-startup -P megiddo.py -- megiddo-1024.png 1024 megiddo.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#94c060', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'tel': toon('tel', '#c8b484', shadow_mul=(0.8, 0.78, 0.82)),
    'stone': toon('stone', '#ddd0b0', shadow_mul=(0.8, 0.8, 0.86), lift=0.18),
    'stoneDark': toon('stoneDark', '#b0a080'),
    'dark': flat('dark', '#2e2a24'),
    'tree': toon('tree', '#6a9040', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(208379)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


TZ = G + 0.17
tel = lathe('tel', M['tel'], ((0.98, 0), (0.86, 0.12), (0.78, 0.18)), G - 0.01, 0.0, 0.05, segs=40, outline=0.006)
tel.visible_shadow = False

# ---------- the six-chambered gate ----------
GX, GY = -0.35, -0.5
for s in (-1, 1):
    for k in range(3):
        box(f'gatepier{s}{k}', M['stone'], GX + s * 0.09, GY - 0.08 + k * 0.08, TZ - 0.03, 0.1, 0.04, 0.09, outline=0.003, bevel=0)
    box(f'gatewall{s}', M['stone'], GX + s * 0.16, GY, TZ - 0.03, 0.04, 0.24, 0.07, outline=0.003, bevel=0)

# ---------- the round altar ----------
AX, AY = 0.15, 0.2
lathe('altar', M['stoneDark'], ((0.16, 0), (0.15, 0.06), (0.13, 0.11)), TZ - 0.005, AX, AY, segs=24, outline=0.005, smooth=False)
for k in range(5):
    box(f'altarstep{k}', M['stone'], AX, AY - 0.16 - 0.02 + k * 0.012, TZ - 0.005, 0.07, 0.03, 0.02 * (k + 1), outline=0.001, bevel=0)
for k in range(14):
    a = 2 * math.pi * k / 14
    ball(f'altarstone{k}', M['stone'], AX + 0.12 * math.cos(a), AY + 0.12 * math.sin(a), TZ + 0.11, 0.022, outline=0.002)

# ---------- the stables' rows of pillars ----------
for r in range(3):
    for k in range(7):
        x = 0.2 + k * 0.065
        lathe(f'pillar{r}{k}', M['stone'], ((0.017, 0), (0.017, 0.09)), TZ - 0.005, x, -0.3 + r * 0.1, segs=8, outline=0.002, smooth=False)
    box(f'trough{r}', M['stoneDark'], 0.395, -0.3 + r * 0.1 - 0.025, TZ - 0.005, 0.4, 0.02, 0.025, outline=0.001, bevel=0)

# ---------- the palaces' low walls ----------
for k in range(8):
    x, y = -0.6 + 0.5 * rng.random(), -0.15 + 0.6 * rng.random()
    w, d = 0.12 + 0.08 * rng.random(), 0.1 + 0.06 * rng.random()
    box(f'ruin{k}a', M['stone'], x, y - d / 2, TZ - 0.005, w, 0.025, 0.03 + 0.03 * rng.random(), outline=0.001, bevel=0)
    box(f'ruin{k}b', M['stone'], x - w / 2, y, TZ - 0.005, 0.025, d, 0.03 + 0.03 * rng.random(), outline=0.001, bevel=0)

for k, (x, y) in enumerate(((-1.1, 0.35), (1.05, -0.5), (1.1, 0.4), (-0.9, -0.85))):
    tree(f'tree{k}', x, y, r=0.08, h=0.1)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

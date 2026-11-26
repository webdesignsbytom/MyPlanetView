# A cartoon Thimlich Ohinga for the country maps, built in the set's shared look (../toon.py): the
# dry-stone enclosures in the hills above Lake Victoria in Migori, Kenya, five hundred years
# old: the great oval wall of fitted stones with no mortar, its low narrow gateways, the inner
# pens for cattle, a round thatched house rebuilt inside, and the euphorbia and acacia bush
# round it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P thimlich-ohinga.py -- thimlich-ohinga-1024.png 1024 thimlich-ohinga.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#a4bc66', shadow_mul=(0.72, 0.78, 0.8), lift=0.2),
    'stone': toon('stone', '#a8a090', shadow_mul=(0.8, 0.8, 0.86), lift=0.14),
    'stoneLight': toon('stoneLight', '#c0b8a6'),
    'mud': toon('mud', '#b8865a'),
    'thatch': toon('thatch', '#c8a458', shadow_mul=(0.8, 0.76, 0.76), lift=0.15),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#5a8a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'euphorbia': toon('euphorbia', '#4a8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(3524629)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)



def wall_ring(name, cx, cy, rx, ry, h, gaps=()):
    n = 36
    for k in range(n):
        a0, a1 = 2 * math.pi * k / n, 2 * math.pi * (k + 1) / n
        if any(abs(((a0 + a1) / 2 - g + math.pi) % (2 * math.pi) - math.pi) < 0.12 for g in gaps):
            continue
        p0 = (cx + rx * math.cos(a0), cy + ry * math.sin(a0))
        p1 = (cx + rx * math.cos(a1), cy + ry * math.sin(a1))
        hh = h * (0.85 + 0.3 * rng.random())
        bar(f'{name}{k}', M['stone'] if k % 2 else M['stoneLight'], (p0[0], p0[1], G + hh / 2 - 0.005), (p1[0], p1[1], G + hh / 2 - 0.005), 0.07, outline=0.003)
        if hh > 0.08:
            bar(f'{name}top{k}', M['stone'], (p0[0], p0[1], G + hh - 0.005), (p1[0], p1[1], G + hh - 0.005), 0.055, outline=0.002)


# ---------- the great enclosure ----------
wall_ring('outer', 0.0, 0.05, 0.85, 0.65, 0.16, gaps=(-math.pi / 2, 0.3))
for g in (-math.pi / 2, 0.3):
    x, y = 0.85 * math.cos(g), 0.65 * math.sin(g) + 0.05
    box(f'gatelintel{g}', M['stoneLight'], x, y, G + 0.1, 0.1, 0.1, 0.035, rot_z=g + math.pi / 2, outline=0.002, bevel=0)

# ---------- the inner cattle pens ----------
wall_ring('pen1', -0.35, 0.15, 0.25, 0.2, 0.09, gaps=(-1.2,))
wall_ring('pen2', 0.35, 0.25, 0.2, 0.17, 0.08, gaps=(-2.0,))

# ---------- a rebuilt house ----------
HX, HY = 0.15, -0.25
lathe('house', M['mud'], ((0.1, 0), (0.1, 0.09)), G - 0.005, HX, HY, segs=20, outline=0.004)
lathe('houseroof', M['thatch'], ((0.13, 0), (0.0, 0.16)), G + 0.085, HX, HY, segs=20, outline=0.004)
box('housedoor', M['dark'], HX, HY - 0.102, G - 0.005, 0.04, 0.008, 0.07, outline=0, bevel=0)

# ---------- the bush round it ----------
for k in range(10):
    a = 2 * math.pi * k / 10 + 0.25
    x, y = 1.18 * math.cos(a), 1.08 * math.sin(a)
    if k % 2:
        tree(f'acacia{k}', x, y, r=0.1, h=0.14)
    else:
        for j in range(4):
            rod(f'euph{k}{j}', M['euphorbia'], (x, y, G), (x + 0.04 * math.cos(j * 1.6), y + 0.04 * math.sin(j * 1.6), G + 0.16 + 0.04 * (j % 2)), 0.014, segs=8, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

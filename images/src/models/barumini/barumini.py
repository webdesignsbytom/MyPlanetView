# A cartoon Su Nuraxi di Barumini for the country maps, built in the set's shared look (../toon.py):
# the Bronze Age nuraghe of Sardinia, its tall central tower of rough basalt blocks ringed by the
# four-towered bastion, the outer wall with its seven towers, and round it the village of round stone
# huts (their roofs long gone), on the dry grassy plain with prickly pears and an olive tree. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P barumini.py -- barumini-1024.png 1024 barumini.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'plain': toon('plain', '#b8b878', shadow_mul=(0.8, 0.8, 0.8), lift=0.2),
    'basalt': toon('basalt', '#8a827a', shadow_mul=(0.84, 0.84, 0.88), lift=0.1),
    'basaltLight': toon('basaltLight', '#a8a094'),
    'dark': flat('dark', '#2a2622'),
    'cactus': toon('cactus', '#6a9a4a'),
    'olive': toon('olive', '#8aa060', shadow_mul=(0.72, 0.8, 0.76)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['plain'])
before = set(bpy.data.objects)
rng = random.Random(1500)


def tower(name, x, y, r, h, mat='basalt'):
    """A truncated cone of rough stone, its courses shown as rings."""
    lathe(name, M[mat], ((r, 0), (r * 0.78, h)), G - 0.005, x, y, segs=16, outline=0.005, smooth=False)
    for k in range(int(h / 0.05)):
        rr = r - (r * 0.22) * (k + 1) / int(h / 0.05)
        lathe(f'{name}course{k}', M['basaltLight'], ((rr + 0.004, 0), (rr + 0.004, 0.006)), G + (k + 1) * 0.05 - 0.01, x, y, segs=16, outline=0, smooth=False)


CX, CY = 0.0, 0.1
# ---------- the outer wall with its seven towers ----------
outer = [(CX + 0.48 * math.cos(2 * math.pi * k / 7 + 0.3), CY + 0.42 * math.sin(2 * math.pi * k / 7 + 0.3)) for k in range(7)]
for k in range(7):
    (x0, y0), (x1, y1) = outer[k], outer[(k + 1) % 7]
    bar(f'outerwall{k}', M['basalt'], (x0, y0, G + 0.06), (x1, y1, G + 0.06), 0.12, outline=0.004)
    tower(f'outertower{k}', x0, y0, 0.08, 0.16)
# ---------- the bastion with its four corner towers, and the keep ----------
for k in range(4):
    a = k * math.pi / 2 + math.pi / 4
    x, y = CX + 0.19 * math.cos(a), CY + 0.19 * math.sin(a)
    tower(f'bastiontower{k}', x, y, 0.1, 0.3)
lathe('bastionwall', M['basalt'], ((0.22, 0), (0.2, 0.26)), G - 0.005, CX, CY, segs=4, outline=0.006, smooth=False)
tower('keep', CX, CY, 0.15, 0.5)
box('keepdoor', M['dark'], CX, CY - 0.143, G + 0.26, 0.03, 0.006, 0.05, outline=0, bevel=0)
box('bastiondoor', M['dark'], CX, CY - 0.2, G - 0.005, 0.04, 0.006, 0.07, outline=0, bevel=0)

# ---------- the village of round huts round it ----------
for k in range(22):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.6, 1.05)
    x, y = CX + r * math.cos(a), CY + r * math.sin(a) * 0.9
    if math.hypot(x, y) > 1.15:
        continue
    hr = rng.uniform(0.06, 0.09)
    lathe(f'hut{k}', M['basalt'], ((hr, 0), (hr, 0.05), (hr - 0.02, 0.05), (hr - 0.02, 0.0)), G - 0.005, x, y, segs=12, outline=0.003, smooth=False)

# ---------- prickly pears and an olive ----------
for k, (x, y) in enumerate(((-0.95, -0.35), (0.9, -0.45), (-0.5, -0.9))):
    for j in range(4):
        pad = ball(f'cactus{k}{j}', M['cactus'], 0, 0, 0, 0.035, outline=0.003)
        pad.scale = (1.0, 0.35, 1.3)
        pad.rotation_euler = (0, 0.4 * (j - 1.5), 0)
        pad.location = (x + 0.03 * (j - 1.5), y, G + 0.04 + 0.03 * (j % 2))
rod('olivetrunk', M['trunk'], (0.85, 0.5, G), (0.87, 0.5, G + 0.08), 0.016, segs=6, outline=0.002)
ball('olive', M['olive'], 0.87, 0.5, G + 0.15, 0.1, outline=0.011)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

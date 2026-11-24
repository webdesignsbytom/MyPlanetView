# A cartoon Gordion for the country maps, built in the set's shared look (../toon.py): the capital of
# Phrygia, King Midas's city, on the Sakarya in central Turkey: the great Midas Mound, the
# biggest tumulus in Anatolia, rising smooth and round from the plain with the little entrance
# tunnel to its wooden tomb, smaller mounds round it, and across the plain the citadel's
# stone gate with its ramps. Turned a little towards the camera.
# Run: blender -b --factory-startup -P gordion.py -- gordion-1024.png 1024 gordion.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#b4bc70', shadow_mul=(0.74, 0.78, 0.8), lift=0.2),
    'mound': toon('mound', '#a4b06a', shadow_mul=(0.74, 0.78, 0.8)),
    'stone': toon('stone', '#d4c4a0', shadow_mul=(0.8, 0.8, 0.86), lift=0.16),
    'stoneDark': toon('stoneDark', '#b0a080'),
    'path': toon('path2', '#e0d0a8', lift=0.18),
    'dark': flat('dark', '#2e2622'),
})

G = tile()
before = set(bpy.data.objects)

# ---------- the Midas Mound ----------
MX, MY = -0.2, 0.25
m = lathe('midas', M['mound'], [(0.6 * math.cos(a), 0.42 * math.sin(a)) for a in [k * math.pi / 18 for k in range(10)]], G - 0.01, MX, MY, segs=40, outline=0.008)
m.visible_shadow = False
box('tunnel', M['stone'], MX + 0.05, MY - 0.58, G - 0.005, 0.1, 0.12, 0.08, outline=0.004, bevel=0)
box('tunneldoor', M['dark'], MX + 0.05, MY - 0.643, G - 0.005, 0.05, 0.006, 0.06, outline=0, bevel=0)
box('path', M['path'], MX + 0.05, MY - 0.85, G - 0.004, 0.08, 0.38, 0.008, outline=0.001, bevel=0)

# ---------- the smaller mounds ----------
for k, (x, y, r, h) in enumerate(((0.55, 0.55, 0.2, 0.12), (0.75, 0.15, 0.14, 0.09), (-0.85, -0.2, 0.16, 0.1), (-0.75, 0.65, 0.13, 0.08))):
    mm = lathe(f'mound{k}', M['mound'], [(r * math.cos(a), h * math.sin(a)) for a in [j * math.pi / 12 for j in range(7)]], G - 0.01, x, y, segs=24, outline=0.005)
    mm.visible_shadow = False

# ---------- the citadel gate ----------
GX, GY = 0.5, -0.45
for s in (-1, 1):
    box(f'gatewall{s}', M['stone'], GX + s * 0.12, GY, G - 0.005, 0.14, 0.24, 0.18, outline=0.005, bevel=0)
    for r in range(3):
        box(f'gatecourse{s}{r}', M['stoneDark'], GX + s * 0.12, GY - 0.122, G + 0.03 + r * 0.05, 0.14, 0.004, 0.008, outline=0, bevel=0)
box('gatepassage', M['path'], GX, GY, G - 0.004, 0.1, 0.3, 0.01, outline=0.001, bevel=0)
box('gatewallback', M['stone'], GX, GY + 0.2, G - 0.005, 0.5, 0.06, 0.12, outline=0.004, bevel=0)
for s in (-1, 1):
    box(f'ramp{s}', M['stoneDark'], GX + s * 0.35, GY + 0.05, G - 0.005, 0.2, 0.1, 0.05, outline=0.002, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

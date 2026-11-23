# A cartoon Hawa Mahal for the country maps, built in the set's shared look (../toon.py): Jaipur's
# Palace of the Winds, its five-storey pink sandstone façade rising to a point, honeycombed with
# little latticed bay windows under their domes, white trim, the street in front with an
# auto-rickshaw and a cow. Turned a little towards the camera.
# Run: blender -b --factory-startup -P hawa-mahal.py -- hawa-mahal-1024.png 1024 hawa-mahal.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'street': toon('street', '#c8bca4', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'pink': toon('hawaPink', '#e8907a', shadow_mul=(0.86, 0.76, 0.76), lift=0.15),
    'pinkDark': toon('hawaPinkDark', '#d07862', shadow_mul=(0.86, 0.76, 0.76)),
    'white': toon('white', '#f8f4ea', lift=0.2),
    'lattice': flat('lattice', '#5a3a34'),
    'shop': toon('shop', '#f0c040'),
    'rickshaw': toon('rickshaw', '#3a8a4a'),
    'rickshawTop': toon('rickshawTop', '#f0c030'),
    'tyre': toon('tyre', '#2e2a30'),
    'cow': toon('cow', '#f0ece2', lift=0.2),
})

G = tile(M['street'])
before = set(bpy.data.objects)

HX, HY = 0.0, 0.3
TIERS = [(1.3, 0.12), (1.1, 0.11), (0.9, 0.11), (0.62, 0.1), (0.36, 0.1)]
z = G - 0.005
for i, (w, h) in enumerate(TIERS):
    box(f'tier{i}', M['pink'], HX, HY - i * 0.015, z, w, 0.22 - i * 0.02, h, outline=0.012, bevel=0)
    box(f'tierband{i}', M['white'], HX, HY - i * 0.015, z + h - 0.008, w + 0.006, 0.226 - i * 0.02, 0.012, outline=0.003, bevel=0)
    n = int(w / 0.09)
    fy = HY - i * 0.015 - (0.11 - i * 0.01)
    for j in range(n):
        x = HX - w / 2 + (j + 0.5) * w / n
        box(f'bay{i}{j}', M['pinkDark'], x, fy - 0.02, z + 0.015, 0.06, 0.04, h - 0.03, outline=0.004, bevel=0)
        box(f'baylattice{i}{j}', M['lattice'], x, fy - 0.041, z + 0.03, 0.035, 0.006, h - 0.06, outline=0, bevel=0)
        lathe(f'baydome{i}{j}', M['white'], ((0.032, 0), (0.026, 0.015), (0.004, 0.03)), z + h - 0.016, x, fy - 0.02, segs=8, outline=0.003)
    z += h
lathe('crown', M['white'], ((0.06, 0), (0.05, 0.03), (0.004, 0.07)), z, HX, HY - 0.07, segs=10, outline=0.005)
for s in (-1, 1):
    lathe(f'sidedome{s}', M['white'], ((0.04, 0), (0.03, 0.025), (0.004, 0.05)), G + 0.335, HX + s * 0.38, HY - 0.03, segs=10, outline=0.004)
# the shops along the street front
for j in range(6):
    box(f'shop{j}', M['shop'], HX - 0.55 + j * 0.22, HY - 0.135, G - 0.005, 0.14, 0.02, 0.07, outline=0.003, bevel=0)

# ---------- an auto-rickshaw and a cow on the street ----------
RX, RY = -0.35, -0.45
box('rickshaw', M['rickshaw'], RX, RY, G + 0.025, 0.16, 0.1, 0.07, outline=0.006, bevel=0)
box('rickshawtop', M['rickshawTop'], RX - 0.01, RY, G + 0.095, 0.15, 0.11, 0.05, outline=0.005, bevel=0)
for k, (u, v) in enumerate(((0.06, 0.0), (-0.05, -0.05), (-0.05, 0.05))):
    cyl(f'wheel{k}', M['tyre'], 0.025, 0.02, segs=12, outline=0.003, matrix=Matrix.Translation((RX + u, RY + v, G + 0.025)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
CX, CY = 0.45, -0.5
for fx in (-0.045, 0.045):
    for side in (-1, 1):
        rod(f'cowleg{fx}{side}', M['cow'], (CX + fx, CY + side * 0.022, G), (CX + fx, CY + side * 0.022, G + 0.06), 0.01, segs=6, outline=0.003)
b = ball('cowbody', M['cow'], 0, 0, 0, 0.045, outline=0.006)
b.scale = (1.5, 0.85, 0.8)
b.location = (CX, CY, G + 0.08)
ball('cowhead', M['cow'], CX + 0.075, CY, G + 0.095, 0.024, outline=0.004)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

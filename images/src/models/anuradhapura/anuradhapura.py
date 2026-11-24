# A cartoon Anuradhapura for the country maps, built in the set's shared look (../toon.py): the
# Ruwanwelisaya, the great white bubble of a stupa on its square terrace, its square harmika and
# the tall ringed spire with its gilded top, the elephant wall all round the terrace with its row of
# elephants, the sandy court, and frangipani trees. Turned a little towards the camera.
# Run: blender -b --factory-startup -P anuradhapura.py -- anuradhapura-1024.png 1024 anuradhapura.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e8dcc0', shadow_mul=(0.86, 0.84, 0.8), lift=0.2),
    'grass': toon('grass2', '#7cb85a'),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.82, 0.84, 0.9), lift=0.18),
    'stone': toon('stone', '#d0c8b8', shadow_mul=(0.84, 0.84, 0.88)),
    'elephant': toon('elephant', '#a8a49c', shadow_mul=(0.84, 0.84, 0.9)),
    'gold': toon('gold', '#f0c030', lift=0.3),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'flower': toon('flower', '#f8f0d8', lift=0.3),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

CX, CY, S = 0.0, 0.08, 0.86
box('terrace', M['sand'], CX, CY, G - 0.005, S, S, 0.09, outline=0.007, bevel=0)
T = G + 0.085
# the elephant wall on the front and sides
for side in range(3):
    a = -math.pi / 2 + (side - 1) * math.pi / 2
    nx, ny = math.cos(a), math.sin(a)
    for j in range(9):
        u = -S / 2 + 0.05 + j * (S - 0.1) / 8
        x, y = CX + nx * (S / 2 + 0.03) - ny * u, CY + ny * (S / 2 + 0.03) + nx * u
        b = ball(f'elbody{side}{j}', M['elephant'], 0, 0, 0, 0.5, outline=0.002)
        b.scale = (0.06 if ny else 0.04, 0.04 if ny else 0.06, 0.045)
        b.location = (x - nx * 0.01, y - ny * 0.01, G + 0.04)
        ball(f'elhead{side}{j}', M['elephant'], x + nx * 0.02, y + ny * 0.02, G + 0.055, 0.02, outline=0.001)
        rod(f'eltrunk{side}{j}', M['elephant'], (x + nx * 0.035, y + ny * 0.035, G + 0.05), (x + nx * 0.04, y + ny * 0.04, G + 0.01), 0.007, segs=6, outline=0)
box('stair', M['stone'], CX, CY - S / 2 - 0.06, G - 0.005, 0.14, 0.12, 0.05, outline=0.003, bevel=0)

# ---------- the stupa ----------
lathe('basering1', M['white'], ((0.36, 0), (0.36, 0.03)), T - 0.005, CX, CY, segs=40, outline=0.004)
lathe('basering2', M['white'], ((0.34, 0), (0.34, 0.03)), T + 0.025, CX, CY, segs=40, outline=0.003)
lathe('dome', M['white'], ((0.33, 0), (0.33, 0.06), (0.31, 0.16), (0.25, 0.25), (0.15, 0.31), (0.004, 0.33)), T + 0.05, CX, CY, segs=40, outline=0.008)
box('harmika', M['white'], CX, CY, T + 0.37, 0.1, 0.1, 0.07, outline=0.004, bevel=0)
z = T + 0.435
for k in range(7):
    r = 0.04 - k * 0.004
    lathe(f'spirering{k}', M['white'], ((r, 0), (r - 0.003, 0.03)), z, CX, CY, segs=16, outline=0.002)
    z += 0.03
lathe('spiretop', M['gold'], ((0.014, 0), (0.008, 0.06), (0.004, 0.09)), z, CX, CY, segs=12, outline=0.002)
ball('crystal', M['gold'], CX, CY, z + 0.1, 0.014, outline=0)

for k, (x, y) in enumerate(((-0.75, -0.55), (0.75, -0.55), (-0.82, 0.45), (0.82, 0.5))):
    rod(f'trunk{k}', M['stone'], (x, y, G), (x, y, G + 0.12), 0.015, segs=6, outline=0.002)
    ball(f'tree{k}', M['tree'], x, y, G + 0.17, 0.1, outline=0.007)
    for j in range(3):
        ball(f'flower{k}{j}', M['flower'], x + 0.05 * math.cos(j * 2.1), y + 0.05 * math.sin(j * 2.1), G + 0.22, 0.015, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

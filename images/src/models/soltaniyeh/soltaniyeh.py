# A cartoon Soltaniyeh for the country maps, built in the set's shared look (../toon.py): the mausoleum
# of the Ilkhanid ruler Öljaitü on the plain of northern Iran, its great octagon of honey-coloured
# brick with the deep arched bays of the gallery round its top, the enormous turquoise-tiled dome,
# among the largest brick domes in the world, and the eight slender minarets standing round its
# base at the octagon's corners. Turned a little towards the camera.
# Run: blender -b --factory-startup -P soltaniyeh.py -- soltaniyeh-1024.png 1024 soltaniyeh.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d8c8a0', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'brick': toon('brick', '#c89a68', shadow_mul=(0.8, 0.74, 0.78), lift=0.15),
    'brickDark': toon('brickDark', '#a87c50'),
    'turquoise': toon('turquoise', '#3ab0b8', lift=0.2),
    'tileBlue': toon('tileBlue', '#2a6a9a', lift=0.15),
    'dark': flat('dark', '#3a2e26'),
    'grass': toon('grass', '#8ab862', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)

CX, CY = 0.0, 0.1
R = 0.38
# the octagon's corners, a flat face to the front
CORNER = [(CX + R * math.cos(math.pi / 8 + k * math.pi / 4), CY + R * math.sin(math.pi / 8 + k * math.pi / 4)) for k in range(8)]
box('plinth', M['brickDark'], CX, CY, G - 0.005, 0.84, 0.84, 0.03, outline=0.004, bevel=0)
H = 0.4
lathe('octagon', M['brick'], ((R / math.cos(math.pi / 8), 0), (R / math.cos(math.pi / 8), H)), G + 0.02, CX, CY, segs=8, outline=0.008, smooth=False)
# its faces: a tall arched bay below and the gallery's arched bays above
for k in range(8):
    a = k * math.pi / 4
    fx, fy = CX + R * math.cos(a), CY + R * math.sin(a)
    rz = a + math.pi / 2
    box(f'bay{k}', M['dark'], fx + 0.004 * math.cos(a), fy + 0.004 * math.sin(a), G + 0.04, 0.12, 0.006, 0.2, rot_z=rz, outline=0, bevel=0)
    m = Matrix.Translation((fx + 0.004 * math.cos(a), fy + 0.004 * math.sin(a), G + 0.24)) @ Matrix.Rotation(rz, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X')
    cyl(f'baytop{k}', M['dark'], 0.06, 0.006, segs=12, outline=0, matrix=m)
    for j in (-1, 1):
        gx, gy = fx + j * 0.07 * math.cos(rz) + 0.004 * math.cos(a), fy + j * 0.07 * math.sin(rz) + 0.004 * math.sin(a)
        box(f'gallery{k}{j}', M['dark'], gx, gy, G + 0.33, 0.05, 0.006, 0.05, rot_z=rz, outline=0, bevel=0)
    box(f'band{k}', M['tileBlue'], fx + 0.005 * math.cos(a), fy + 0.005 * math.sin(a), G + 0.405, 0.3, 0.008, 0.015, rot_z=rz, outline=0, bevel=0)

# ---------- the great dome ----------
DZ = G + 0.42
lathe('drum', M['brick'], ((0.3, 0), (0.3, 0.05)), DZ - 0.005, CX, CY, segs=32, outline=0.004)
lathe('dome', M['turquoise'], ((0.3, 0), (0.295, 0.08), (0.27, 0.17), (0.21, 0.26), (0.12, 0.33), (0.04, 0.36), (0.0, 0.365)), DZ + 0.04, CX, CY, segs=32, outline=0.007)
for k in range(16):
    a = 2 * math.pi * k / 16
    bar(f'domerib{k}', M['tileBlue'], (CX + 0.302 * math.cos(a), CY + 0.302 * math.sin(a), DZ + 0.045), (CX + 0.272 * math.cos(a), CY + 0.272 * math.sin(a), DZ + 0.21), 0.01, outline=0)

# ---------- the eight minarets at the corners ----------
for k, (x, y) in enumerate(CORNER):
    lathe(f'minaret{k}', M['brick'], ((0.035, 0), (0.028, 0.2)), DZ - 0.02, x * 0.94 + CX * 0.06, y * 0.94 + CY * 0.06, segs=10, outline=0.003)
    lathe(f'minaretband{k}', M['turquoise'], ((0.032, 0), (0.032, 0.025)), DZ + 0.12, x * 0.94 + CX * 0.06, y * 0.94 + CY * 0.06, segs=10, outline=0.001)
    lathe(f'minarettop{k}', M['brickDark'], ((0.03, 0), (0.025, 0.02), (0.003, 0.05)), DZ + 0.175, x * 0.94 + CX * 0.06, y * 0.94 + CY * 0.06, segs=10, outline=0.002)

# ---------- the southern hall and a little green on the plain ----------
box('hall', M['brick'], CX, CY + 0.52, G - 0.005, 0.32, 0.18, 0.2, outline=0.005, bevel=0)
for k, (x, y) in enumerate(((-0.75, -0.6), (0.8, -0.5), (-0.9, 0.3), (0.85, 0.5))):
    b = ball(f'shrub{k}', M['grass'], 0, 0, 0, 0.08, outline=0.008)
    b.scale = (1.0, 1.0, 0.6)
    b.location = (x, y, G + 0.03)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

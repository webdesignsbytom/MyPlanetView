# A cartoon Porta Nigra for the country maps, built in the set's shared look (../toon.py): Trier's
# Roman city gate of great sandstone blocks darkened almost black with age, its two gateways under
# rows of arched windows, the west tower standing four storeys high and the east tower stopping at
# three, on the square with trees. Turned a little towards the camera.
# Run: blender -b --factory-startup -P porta-nigra.py -- porta-nigra-1024.png 1024 porta-nigra.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'square': toon('square', '#d8d0c0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'black': toon('nigra', '#5a5250', shadow_mul=(0.84, 0.84, 0.9), lift=0.08),
    'blackDark': toon('nigraDark', '#433c3a', shadow_mul=(0.84, 0.84, 0.9)),
    'arch': flat('arch', '#1e1a1a'),
    'roof': toon('roof', '#6a6a70'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['square'])
before = set(bpy.data.objects)

GX, GY = 0.0, 0.15
STOREY = 0.14


def arches(name, x, y, w, z, n, h):
    for j in range(n):
        ax = x - w / 2 + (j + 0.5) * w / n
        box(f'{name}{j}', M['arch'], ax, y, z, w / n * 0.5, 0.006, h, outline=0, bevel=0)
        cyl(f'{name}top{j}', M['arch'], w / n * 0.25, 0.006, segs=14, outline=0, matrix=Matrix.Translation((ax, y, z + h)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))


# ---------- the middle with the two gateways ----------
box('middle', M['black'], GX, GY, G - 0.005, 0.5, 0.3, STOREY * 3, outline=0.012, bevel=0)
for s in (-1, 1):
    box(f'gateway{s}', M['arch'], GX + s * 0.11, GY - 0.152, G - 0.005, 0.12, 0.006, 0.12, outline=0, bevel=0)
    cyl(f'gatewaytop{s}', M['arch'], 0.06, 0.006, segs=16, outline=0, matrix=Matrix.Translation((GX + s * 0.11, GY - 0.152, G + 0.115)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for f in range(1, 3):
    arches(f'middlewin{f}', GX, GY - 0.152, 0.48, G + f * STOREY + 0.02, 6, 0.06)
    box(f'middleledge{f}', M['blackDark'], GX, GY - 0.155, G + f * STOREY - 0.005, 0.5, 0.012, 0.012, outline=0, bevel=0)

# ---------- the two towers ----------
for s, floors in ((-1, 4), (1, 3)):
    TX = GX + s * 0.38
    box(f'tower{s}', M['black'], TX, GY + 0.02, G - 0.005, 0.28, 0.36, STOREY * floors, outline=0.011, bevel=0)
    for f in range(floors):
        arches(f'towerwin{s}{f}', TX, GY - 0.162, 0.26, G + f * STOREY + 0.03, 3, 0.06)
        box(f'towerledge{s}{f}', M['blackDark'], TX, GY - 0.165, G + (f + 1) * STOREY - 0.01, 0.28, 0.012, 0.012, outline=0, bevel=0)
    # the round end towards the field side, behind
    lathe(f'towerapse{s}', M['black'], ((0.13, 0), (0.13, STOREY * floors)), G - 0.005, TX, GY + 0.2, segs=14, outline=0.008)
    if s < 0:
        loft('westroof', M['roof'], [[(TX - 0.15, GY - 0.17, G + STOREY * floors - 0.005), (TX + 0.15, GY - 0.17, G + STOREY * floors - 0.005), (TX + 0.15, GY + 0.2, G + STOREY * floors - 0.005), (TX - 0.15, GY + 0.2, G + STOREY * floors - 0.005)],
                                     [(TX - 0.004, GY - 0.17, G + STOREY * floors + 0.08), (TX + 0.004, GY - 0.17, G + STOREY * floors + 0.08), (TX + 0.004, GY + 0.2, G + STOREY * floors + 0.08), (TX - 0.004, GY + 0.2, G + STOREY * floors + 0.08)]], outline=0.005)

for k, (x, y) in enumerate(((-0.9, -0.4), (0.9, -0.4), (-0.55, -0.75), (0.55, -0.75))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.11, 0.1, outline=0.009)

m = Matrix.Translation((0, 0.1, G)) @ Matrix.Scale(1.2, 4) @ Matrix.Translation((0, -0.1, -G))
for o in [o for o in bpy.data.objects if o not in before]:
    o.matrix_world = m @ o.matrix_world
bpy.context.view_layer.update()
turn(before, -20)
render(G)

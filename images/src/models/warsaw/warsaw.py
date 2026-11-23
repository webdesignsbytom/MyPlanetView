# A cartoon Warsaw Old Town for the country maps, built in the set's shared look (../toon.py): the
# Market Square ringed by its tall narrow burghers' houses in ochre, red, green, cream and pink
# under steep red roofs, the Mermaid of Warsaw with her sword and shield on her fountain in the
# middle, and the Royal Castle's salmon front behind with its clock tower and green spire. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P warsaw.py -- warsaw-1024.png 1024 warsaw.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c0b0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'ochre': toon('ochre', '#e8b860', lift=0.1),
    'red': toon('red', '#c8604a', lift=0.08),
    'green': toon('green', '#8ab87a', lift=0.1),
    'cream': toon('cream', '#f0e4c4', lift=0.12),
    'pink': toon('pink', '#e8a8a0', lift=0.1),
    'blue': toon('blue', '#8ab0d0', lift=0.1),
    'roof': toon('roof', '#b8503e'),
    'window': flat('window', '#3a3a42'),
    'castle': toon('castle', '#e8a080', shadow_mul=(0.88, 0.82, 0.8), lift=0.1),
    'copper': toon('copper', '#4a7a6a'),
    'white': toon('white', '#f6f2ea', lift=0.15),
    'bronze': toon('bronze', '#4a5a50'),
    'water': toon('water', '#5aa8d0', lift=0.3),
    'gold': toon('gold', '#f0c030', lift=0.3),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(2393)
COLOURS = ('ochre', 'red', 'green', 'cream', 'pink', 'blue')


def house(name, x, y, rot, w, h, k):
    mark = set(bpy.data.objects)
    box(f'{name}', M[COLOURS[k % len(COLOURS)]], 0, 0, G - 0.005, w, 0.14, h, outline=0.005, bevel=0)
    for r in range(3):
        for c in range(2):
            box(f'{name}win{r}{c}', M['window'], -w / 4 + c * w / 2, -0.073, G + 0.04 + r * 0.055, w * 0.22, 0.006, 0.03, outline=0, bevel=0)
    box(f'{name}door', M['window'], 0, -0.073, G - 0.005, w * 0.3, 0.006, 0.035, outline=0, bevel=0)
    loft(f'{name}roof', M['roof'], [[(-w / 2, -0.07, G + h - 0.005), (w / 2, -0.07, G + h - 0.005), (w / 2, 0.07, G + h - 0.005), (-w / 2, 0.07, G + h - 0.005)],
                                    [(-w / 2, -0.004, G + h + 0.08), (w / 2, -0.004, G + h + 0.08), (w / 2, 0.004, G + h + 0.08), (-w / 2, 0.004, G + h + 0.08)]], outline=0.004)
    if k % 3 == 0:
        box(f'{name}attic', M[COLOURS[(k + 2) % len(COLOURS)]], 0, -0.065, G + h - 0.005, w, 0.012, 0.05, outline=0.002, bevel=0)
    bpy.context.view_layer.update()
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(rot, 4, 'Z')
    for o in [o for o in bpy.data.objects if o not in mark]:
        o.matrix_world = m @ o.matrix_world


SX, SY = 0.42, 0.3
k = 0
for j in range(7):
    x = -0.39 + j * 0.13
    house(f'back{j}', x, 0.0 + SY + 0.07, 0.0, 0.13, rng.uniform(0.2, 0.26), k)
    k += 1
for j in range(4):
    y = 0.15 - j * 0.15
    house(f'left{j}', -SX - 0.07, y, -math.pi / 2, 0.15, rng.uniform(0.2, 0.25), k)
    k += 1
    house(f'right{j}', SX + 0.07, y, math.pi / 2, 0.15, rng.uniform(0.2, 0.25), k)
    k += 1

# ---------- the Mermaid on her fountain ----------
MX, MY = 0.0, -0.05
lathe('basin', M['cream'], ((0.11, 0), (0.11, 0.035)), G - 0.005, MX, MY, segs=16, outline=0.003)
lathe('basinwater', M['water'], ((0.1, 0), (0.1, 0.038)), G - 0.005, MX, MY, segs=16, outline=0)
lathe('plinth', M['cream'], ((0.035, 0), (0.03, 0.08)), G + 0.03, MX, MY, segs=10, outline=0.002)
lathe('tail', M['bronze'], ((0.03, 0), (0.025, 0.04), (0.02, 0.08)), G + 0.105, MX, MY, segs=10, outline=0.002)
lathe('mermaidbody', M['bronze'], ((0.02, 0), (0.018, 0.06)), G + 0.18, MX, MY, segs=10, outline=0.002)
ball('mermaidhead', M['bronze'], MX, MY, G + 0.255, 0.015, outline=0.001)
bar('sword', M['bronze'], (MX - 0.02, MY, G + 0.22), (MX - 0.04, MY - 0.01, G + 0.32), 0.008, outline=0.001)
cyl('shield', M['bronze'], 0.025, 0.008, segs=12, outline=0.001, matrix=Matrix.Translation((MX + 0.03, MY - 0.015, G + 0.21)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))

# ---------- the Royal Castle ----------
CX, CY = 0.1, 0.78
box('castle', M['castle'], CX, CY, G - 0.005, 0.9, 0.2, 0.2, outline=0.008, bevel=0)
for r in range(2):
    for j in range(9):
        box(f'castlewin{r}{j}', M['window'], CX - 0.4 + j * 0.1, CY - 0.102, G + 0.05 + r * 0.07, 0.03, 0.006, 0.04, outline=0, bevel=0)
loft('castleroof', M['copper'], [[(CX - 0.45, CY - 0.1, G + 0.195), (CX + 0.45, CY - 0.1, G + 0.195), (CX + 0.45, CY + 0.1, G + 0.195), (CX - 0.45, CY + 0.1, G + 0.195)],
                                 [(CX - 0.42, CY - 0.02, G + 0.25), (CX + 0.42, CY - 0.02, G + 0.25), (CX + 0.42, CY + 0.02, G + 0.25), (CX - 0.42, CY + 0.02, G + 0.25)]], outline=0.005)
box('clocktower', M['castle'], CX, CY - 0.04, G - 0.005, 0.13, 0.13, 0.44, outline=0.007, bevel=0)
cyl('clockface', M['white'], 0.035, 0.006, segs=16, outline=0.001, matrix=Matrix.Translation((CX, CY - 0.108, G + 0.36)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
lathe('spire', M['copper'], ((0.07, 0), (0.05, 0.04), (0.06, 0.07), (0.025, 0.12), (0.03, 0.15), (0.004, 0.26)), G + 0.435, CX, CY - 0.04, segs=8, outline=0.004, smooth=False)
ball('spireball', M['gold'], CX, CY - 0.04, G + 0.7, 0.01, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

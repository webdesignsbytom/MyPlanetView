# A cartoon Historic Jeddah for the country maps, built in the set's shared look (../toon.py): the
# old town of Al-Balad, its tall coral-stone tower houses banded with timber, the great wooden
# rawasheen, the latticed bay windows painted green and brown, stacked up their fronts, the narrow
# lanes between them, and a palm. Turned a little towards the camera.
# Run: blender -b --factory-startup -P historic-jeddah.py -- historic-jeddah-1024.png 1024 historic-jeddah.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lane': toon('lane', '#d8ccb0', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'coral': toon('coral', '#ece2cc', shadow_mul=(0.84, 0.84, 0.88), lift=0.12),
    'timber': toon('timber', '#8a6a4a'),
    'green': toon('green', '#3a7a5a', lift=0.08),
    'brown': toon('brown', '#7a4a2e'),
    'dark': flat('dark', '#2e2a28'),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
})

G = tile(M['lane'])
before = set(bpy.data.objects)
rng = random.Random(2593)


def tower(name, x, y, w, d, h, rot):
    mark = set(bpy.data.objects)
    box(f'{name}', M['coral'], 0, 0, G - 0.005, w, d, h, outline=0.007, bevel=0)
    for k in range(int(h / 0.08)):
        box(f'{name}band{k}', M['timber'], 0, -d / 2 - 0.002, G + 0.06 + k * 0.08, w, 0.004, 0.008, outline=0, bevel=0)
    box(f'{name}parapet', M['coral'], 0, 0, G + h - 0.005, w + 0.01, d + 0.01, 0.03, outline=0.002, bevel=0)
    for j in range(4):
        box(f'{name}crenel{j}', M['coral'], -w / 2 + 0.02 + j * (w - 0.04) / 3, -d / 2, G + h + 0.02, 0.02, 0.012, 0.02, outline=0, bevel=0)
    mat = M[rng.choice(('green', 'brown'))]
    rw = w * 0.55
    for k in range(int((h - 0.08) / 0.09)):
        z = G + 0.08 + k * 0.09
        box(f'{name}roshan{k}', mat, 0, -d / 2 - 0.025, z, rw, 0.05, 0.075, outline=0.003, bevel=0)
        for j in range(4):
            box(f'{name}lattice{k}{j}', M['dark'], -rw / 2 + 0.012 + j * (rw - 0.024) / 3, -d / 2 - 0.052, z + 0.012, 0.008, 0.004, 0.05, outline=0, bevel=0)
        box(f'{name}roshantop{k}', mat, 0, -d / 2 - 0.028, z + 0.075, rw + 0.012, 0.058, 0.01, outline=0.001, bevel=0)
    box(f'{name}door', M['brown'], w * 0.3 if w > 0.15 else 0, -d / 2 - 0.003, G - 0.005, 0.04, 0.006, 0.07, outline=0, bevel=0)
    bpy.context.view_layer.update()
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(rot, 4, 'Z')
    for o in [o for o in bpy.data.objects if o not in mark]:
        o.matrix_world = m @ o.matrix_world


for k, (x, y, w, h, rot) in enumerate(((-0.42, 0.25, 0.2, 0.5, 0.0), (-0.12, 0.3, 0.18, 0.42, 0.0), (0.18, 0.28, 0.2, 0.56, 0.0), (0.48, 0.22, 0.18, 0.4, 0.0),
                                      (-0.55, -0.15, 0.18, 0.36, math.pi / 2), (0.55, -0.2, 0.18, 0.38, -math.pi / 2), (-0.2, -0.45, 0.2, 0.3, 0.0), (0.22, -0.48, 0.18, 0.28, 0.0))):
    tower(f'tower{k}', x, y, w, 0.18, h, rot)
rod('palmtrunk', M['trunk'], (0.0, -0.1, G), (0.03, -0.1, G + 0.32), 0.016, segs=6, outline=0.002)
for j in range(7):
    a = 2 * math.pi * j / 7
    bar(f'palmleaf{j}', M['palm'], (0.03, -0.1, G + 0.32), (0.03 + 0.11 * math.cos(a), -0.1 + 0.11 * math.sin(a), G + 0.26), 0.025, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

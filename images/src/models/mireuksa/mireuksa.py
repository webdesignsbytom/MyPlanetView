# A cartoon Mireuksa for the country maps, built in the set's shared look (../toon.py): the great
# temple of the Baekje kingdom at Iksan, Korea, and its stone pagoda, the oldest and largest
# in Korea: six storeys of granite built like a timber pagoda, with thin wide roof slabs
# turning up at the corners, the doorways through its base, its rebuilt twin beside it, the
# temple's flagpole supports, and the ponds before it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P mireuksa.py -- mireuksa-1024.png 1024 mireuksa.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'granite': toon('granite', '#d4cebe', shadow_mul=(0.8, 0.8, 0.86), lift=0.2),
    'graniteDark': toon('graniteDark', '#a8a294'),
    'graniteNew': toon('graniteNew', '#ece8de', lift=0.25),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'path': toon('path2', '#e2d6bc', lift=0.18),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)



def pagoda(name, x, y, w, storeys, mat):
    box(name + 'plinth', M['graniteDark'], x, y, G - 0.005, w + 0.1, w + 0.1, 0.04, outline=0.004, bevel=0)
    z = G + 0.035
    ww = w
    for k in range(storeys):
        h = 0.12 if k == 0 else 0.07
        box(f'{name}body{k}', mat, x, y, z, ww, ww, h, outline=0.005, bevel=0)
        for (ex, ey) in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            box(f'{name}pillar{k}{ex}{ey}', M['graniteDark'], x + ex * (ww / 2 - 0.006), y + ey * (ww / 2 - 0.006), z, 0.014, 0.014, h, outline=0, bevel=0)
        if k == 0:
            box(f'{name}door', M['dark'], x, y - ww / 2 - 0.003, z, ww * 0.3, 0.006, h * 0.75, outline=0, bevel=0)
        z += h
        rw = ww + 0.12
        loft(f'{name}roof{k}', mat, [[(x - rw / 2, y - rw / 2, z + 0.012), (x + rw / 2, y - rw / 2, z + 0.012), (x + rw / 2, y + rw / 2, z + 0.012), (x - rw / 2, y + rw / 2, z + 0.012)],
                                      [(x - rw / 2 + 0.02, y - rw / 2 + 0.02, z + 0.03), (x + rw / 2 - 0.02, y - rw / 2 + 0.02, z + 0.03), (x + rw / 2 - 0.02, y + rw / 2 - 0.02, z + 0.03), (x - rw / 2 + 0.02, y + rw / 2 - 0.02, z + 0.03)]], outline=0.004)
        box(f'{name}roofbase{k}', M['graniteDark'], x, y, z, ww + 0.02, ww + 0.02, 0.014, outline=0.001, bevel=0)
        z += 0.03
        ww *= 0.88
    lathe(name + 'finial', mat, ((0.02, 0), (0.02, 0.03), (0.01, 0.06), (0.0, 0.08)), z, x, y, segs=8, outline=0.002, smooth=False)


box('court', M['path'], 0.0, 0.0, G - 0.004, 1.3, 0.7, 0.008, outline=0.001, bevel=0)
# the old west pagoda, six storeys
pagoda('west', -0.3, 0.1, 0.3, 6, M['granite'])
# the rebuilt east pagoda beside it, nine storeys and new-white
pagoda('east', 0.4, 0.15, 0.24, 9, M['graniteNew'])
# the flagpole supports
for s in (-1, 1):
    box(f'flagsupport{s}', M['granite'], 0.0 + s * 0.04, -0.3, G - 0.005, 0.03, 0.06, 0.2, outline=0.002, bevel=0)
# the ponds before the temple
for k, x in enumerate((-0.45, 0.45)):
    box(f'pond{k}', M['water'], x, -0.65, G - 0.004, 0.36, 0.2, 0.012, outline=0.002, bevel=0)
for k, (x, y) in enumerate(((-0.95, 0.2), (0.95, 0.3), (-0.6, 0.75), (0.2, 0.8), (0.75, 0.7))):
    tree(f'tree{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

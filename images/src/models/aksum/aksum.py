# A cartoon Aksum for the country maps, built in the set's shared look (../toon.py): the Northern
# Stelae Park, King Ezana's tall granite stela and the Obelisk of Axum carved as many-storeyed
# towers with false doors and windows under their rounded tops, the Great Stele lying broken on the
# ground beside them, smaller stelae, and acacias on the highland grass. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P aksum.py -- aksum-1024.png 1024 aksum.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#b8b070', shadow_mul=(0.8, 0.8, 0.82), lift=0.2),
    'granite': toon('granite', '#8a8680', shadow_mul=(0.84, 0.84, 0.9), lift=0.06),
    'graniteDark': toon('graniteDark', '#5a5652'),
    'path': toon('path', '#d0c4a8'),
    'acacia': toon('acacia', '#6a9a4a', shadow_mul=(0.72, 0.8, 0.74)),
    'trunk': toon('trunk', '#5a4a40'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(2437)
box('path', M['path'], 0.0, -0.5, G - 0.003, 0.9, 0.18, 0.008, outline=0, bevel=0)


def stela(name, x, y, w, d, h, storeys):
    loft(name, M['granite'], [[(x - w / 2, y - d / 2, G - 0.005), (x + w / 2, y - d / 2, G - 0.005), (x + w / 2, y + d / 2, G - 0.005), (x - w / 2, y + d / 2, G - 0.005)],
                              [(x - w * 0.42, y - d * 0.42, G + h), (x + w * 0.42, y - d * 0.42, G + h), (x + w * 0.42, y + d * 0.42, G + h), (x - w * 0.42, y + d * 0.42, G + h)]], outline=0.006)
    cyl(f'{name}top', M['granite'], w * 0.42, d * 0.84, segs=16, outline=0.005, matrix=Matrix.Translation((x, y, G + h)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    box(f'{name}door', M['graniteDark'], x, y - d / 2 - 0.002, G + 0.01, w * 0.35, 0.006, h * 0.1, outline=0, bevel=0)
    for i in range(storeys):
        z = G + h * 0.16 + i * (h * 0.78 / storeys)
        f = 1 - 0.16 * (z - G) / h
        box(f'{name}band{i}', M['graniteDark'], x, y - d * f / 2 - 0.002, z, w * f, 0.006, 0.006, outline=0, bevel=0)
        for j in (-1, 1):
            box(f'{name}win{i}{j}', M['graniteDark'], x + j * w * f * 0.22, y - d * f / 2 - 0.002, z + 0.015, w * f * 0.18, 0.006, h * 0.78 / storeys * 0.45, outline=0, bevel=0)


stela('ezana', -0.12, 0.15, 0.12, 0.07, 0.72, 9)
stela('obelisk', 0.22, 0.25, 0.13, 0.08, 0.8, 10)
for k, (x, y, h) in enumerate(((-0.45, 0.35, 0.3), (0.5, 0.45, 0.22), (-0.6, 0.0, 0.18), (0.6, 0.05, 0.25), (0.0, 0.55, 0.2))):
    stela(f'small{k}', x, y, 0.07, 0.045, h, 3)
# the Great Stele, fallen and broken
for k, (x0, x1) in enumerate(((-0.75, -0.42), (-0.4, -0.05), (-0.03, 0.32), (0.34, 0.6))):
    a = 0.06 * (k - 1.5)
    box(f'fallen{k}', M['granite'], (x0 + x1) / 2, -0.25 + a * 0.3, G - 0.005, x1 - x0 - 0.02, 0.14, 0.08, rot_z=a, outline=0.006, bevel=0)
    for j in range(2):
        box(f'fallenwin{k}{j}', M['graniteDark'], (x0 + x1) / 2 - 0.06 + j * 0.12, -0.25 + a * 0.3 - 0.071, G + 0.02, 0.05, 0.006, 0.035, rot_z=a, outline=0, bevel=0)

for k, (x, y) in enumerate(((-0.85, -0.45), (0.85, -0.4), (-0.8, 0.5), (0.75, 0.6))):
    rod(f'acaciatrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.16), 0.014, segs=6, outline=0.002)
    b = ball(f'acacia{k}', M['acacia'], 0, 0, 0, 0.12, outline=0.007)
    b.scale = (1.3, 1.3, 0.4)
    b.location = (x, y, G + 0.18)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

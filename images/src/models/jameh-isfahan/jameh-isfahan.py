# A cartoon Jameh Mosque of Isfahan for the country maps, built in the set's shared look
# (../toon.py): the great courtyard with its pool, the four iwans facing each other across it, tall
# portals faced in blue tiles round deep pointed arches, the south iwan the tallest with its two
# minarets and the brick dome rising behind, two storeys of arcades between them and the little
# domes of the prayer halls on the roofs. Turned a little towards the camera.
# Run: blender -b --factory-startup -P jameh-isfahan.py -- jameh-isfahan-1024.png 1024 jameh-isfahan.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#e0d4b8', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'brick': toon('brick', '#c8a87a', shadow_mul=(0.86, 0.82, 0.76), lift=0.08),
    'brickDark': toon('brickDark', '#a8885a'),
    'tile': toon('tile', '#2a8ab0', lift=0.12),
    'tileLight': toon('tileLight', '#5fc0d0', lift=0.2),
    'tileDark': flat('tileDark', '#1e3a6a'),
    'water': toon('water', '#4aa0c0', lift=0.3),
    'window': flat('window', '#4a3a2a'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

S = 0.68
for name, (x, y, sx, sy, h) in {'south': (0.0, S + 0.06, 2 * S + 0.24, 0.12, 0.2), 'north': (0.0, -S - 0.06, 2 * S + 0.24, 0.12, 0.1),
                                'east': (S + 0.06, 0.0, 0.12, 2 * S, 0.2), 'west': (-S - 0.06, 0.0, 0.12, 2 * S, 0.2)}.items():
    box(f'arcade{name}', M['brick'], x, y, G - 0.005, sx, sy, h, outline=0.008, bevel=0)

# two storeys of arches on the inner faces
for j in range(9):
    t = -0.62 + j * 0.155
    if abs(t) < 0.24:
        continue
    for r in range(2):
        z = G + 0.02 + r * 0.09
        box(f'archS{j}{r}', M['tileDark'], t, S - 0.003, z, 0.07, 0.006, 0.05, outline=0, bevel=0)
        cyl(f'archStop{j}{r}', M['tileDark'], 0.035, 0.006, segs=12, outline=0, matrix=Matrix.Translation((t, S - 0.003, z + 0.05)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        for s in (-1, 1):
            box(f'arch{s}{j}{r}', M['tileDark'], s * (S - 0.003), t, z, 0.006, 0.07, 0.05, outline=0, bevel=0)
            cyl(f'archtop{s}{j}{r}', M['tileDark'], 0.035, 0.006, segs=12, outline=0, matrix=Matrix.Translation((s * (S - 0.003), t, z + 0.05)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
# the little domes of the prayer halls
for j in range(6):
    t = -0.55 + j * 0.22
    for s in (-1, 1):
        lathe(f'roofdome{s}{j}', M['brickDark'], ((0.045, 0), (0.035, 0.025), (0.004, 0.045)), G + 0.195, s * (S + 0.06), t, segs=12, outline=0.003)


def place(objs, px, py, rot):
    bpy.context.view_layer.update()
    m = Matrix.Translation((px, py, 0)) @ Matrix.Rotation(rot, 4, 'Z')
    for o in objs:
        o.matrix_world = m @ o.matrix_world


def iwan(name, px, py, rot, w, h, d, minarets=False):
    mark = set(bpy.data.objects)
    box(f'{name}block', M['brick'], 0, 0, G - 0.005, w, d, h, outline=0.009, bevel=0)
    box(f'{name}panel', M['tile'], 0, -d / 2 - 0.003, G + 0.015, w * 0.84, 0.006, h * 0.86, outline=0, bevel=0)
    box(f'{name}band', M['tileLight'], 0, -d / 2 - 0.006, G + h * 0.82, w * 0.84, 0.006, h * 0.06, outline=0, bevel=0)
    box(f'{name}recess', M['tileDark'], 0, -d / 2 - 0.006, G - 0.005, w * 0.5, 0.006, h * 0.55, outline=0, bevel=0)
    cyl(f'{name}recesstop', M['tileDark'], w * 0.25, 0.006, segs=18, outline=0, matrix=Matrix.Translation((0, -d / 2 - 0.006, G + h * 0.55 - 0.005)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    box(f'{name}inner', M['tileLight'], 0, -d / 2 - 0.008, G + h * 0.25, w * 0.3, 0.004, h * 0.2, outline=0, bevel=0)
    if minarets:
        for s in (-1, 1):
            lathe(f'{name}minaret{s}', M['tile'], ((0.032, 0), (0.03, 0.2)), G + h - 0.005, s * (w / 2 - 0.04), 0, segs=12, outline=0.003)
            lathe(f'{name}balcony{s}', M['brickDark'], ((0.045, 0), (0.045, 0.015)), G + h + 0.16, s * (w / 2 - 0.04), 0, segs=12, outline=0.002)
            lathe(f'{name}cap{s}', M['tileLight'], ((0.03, 0), (0.025, 0.04), (0.004, 0.07)), G + h + 0.19, s * (w / 2 - 0.04), 0, segs=12, outline=0.002)
    place([o for o in bpy.data.objects if o not in mark], px, py, rot)


# the brick dome behind the south iwan
lathe('domedrum', M['brickDark'], ((0.2, 0), (0.2, 0.32)), G - 0.005, 0.0, 0.94, segs=20, outline=0.008)
lathe('dome', M['brickDark'], ((0.2, 0), (0.17, 0.1), (0.1, 0.17), (0.004, 0.2)), G + 0.315, 0.0, 0.94, segs=20, outline=0.008)
iwan('south', 0.0, S + 0.04, 0.0, 0.42, 0.44, 0.2, minarets=True)
iwan('north', 0.0, -S - 0.04, math.pi, 0.34, 0.26, 0.2)
iwan('east', S + 0.04, 0.0, -math.pi / 2, 0.34, 0.32, 0.2)
iwan('west', -S - 0.04, 0.0, math.pi / 2, 0.34, 0.32, 0.2)

# ---------- the pool ----------
box('poolrim', M['brickDark'], 0.0, 0.0, G - 0.005, 0.36, 0.28, 0.02, outline=0.003, bevel=0)
box('pool', M['water'], 0.0, 0.0, G - 0.002, 0.3, 0.22, 0.026, outline=0.001, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

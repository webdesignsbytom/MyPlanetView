# A cartoon Persian caravanserai for the country maps, built in the set's shared look (../toon.py):
# Deyr-e Gachin in the desert south of Tehran, one of the great caravan inns of the Silk Road, its
# high square walls of mud brick with round towers at the corners and in the middle of each side,
# the tall gateway with its deep pointed arch, the courtyard inside ringed with the arched rooms of
# the travellers, and a pair of camels resting at its gate. Turned a little towards the camera.
# Run: blender -b --factory-startup -P deyr-e-gachin.py -- deyr-e-gachin-1024.png 1024 deyr-e-gachin.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e4cc9c', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'brick': toon('brick', '#c89c6c', shadow_mul=(0.8, 0.74, 0.78), lift=0.15),
    'brickDark': toon('brickDark', '#a8805a'),
    'court': toon('court', '#d8bc8c', lift=0.15),
    'camel': toon('camel', '#c8985c', lift=0.15),
    'dark': flat('dark', '#3a2e26'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)


def pointed_arch(name, x, y, z, w, h, face='y', mat=None):
    """A dark pointed opening on a wall facing -y ('y'), +y ('-y') or the x sides."""
    mat = mat or M['dark']
    rz = {'y': 0.0, '-y': math.pi, 'x': -math.pi / 2, '-x': math.pi / 2}[face]
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(rz, 4, 'Z')
    objs = set(bpy.data.objects)
    box(name, mat, 0, 0, z, w, 0.006, h, outline=0, bevel=0)
    loft(f'{name}point', mat, [[(-w / 2, -0.003, z + h), (w / 2, -0.003, z + h), (0.001, -0.003, z + h + w * 0.7), (-0.001, -0.003, z + h + w * 0.7)],
                               [(-w / 2, 0.003, z + h), (w / 2, 0.003, z + h), (0.001, 0.003, z + h + w * 0.7), (-0.001, 0.003, z + h + w * 0.7)]], outline=0)
    bpy.context.view_layer.update()
    for o in set(bpy.data.objects) - objs:
        o.matrix_world = m @ o.matrix_world


# ---------- the walls ----------
S, WH, T = 0.62, 0.17, 0.08
loft('court', M['court'], [[(-S, -S, G - 0.004), (S, -S, G - 0.004), (S, S, G - 0.004), (-S, S, G - 0.004)],
                           [(-S, -S, G + 0.006), (S, -S, G + 0.006), (S, S, G + 0.006), (-S, S, G + 0.006)]], outline=0.001)
for k, (x, y, sx, sy) in enumerate(((0, S, 2 * S, T), (-S, 0, T, 2 * S), (S, 0, T, 2 * S))):
    box(f'wall{k}', M['brick'], x, y, G - 0.005, sx, sy, WH, outline=0.006, bevel=0)
for s in (-1, 1):
    box(f'frontwall{s}', M['brick'], s * (S / 2 + 0.07), -S, G - 0.005, S - 0.14, T, WH, outline=0.006, bevel=0)
# the rooms round the courtyard: arches on the inner faces
for j in range(7):
    t = -S + 0.16 + j * (2 * S - 0.32) / 6
    pointed_arch(f'backroom{j}', t, S - T / 2 - 0.004, G + 0.02, 0.06, 0.07, 'y')
    pointed_arch(f'leftroom{j}', -S + T / 2 + 0.004, t, G + 0.02, 0.06, 0.07, '-x')
    pointed_arch(f'rightroom{j}', S - T / 2 - 0.004, t, G + 0.02, 0.06, 0.07, 'x')
# the round towers at the corners and in the middle of each side
for k, (x, y) in enumerate(((-S, -S), (S, -S), (S, S), (-S, S), (-S, 0), (S, 0), (0, S))):
    lathe(f'tower{k}', M['brick'], ((0.075, 0), (0.07, WH + 0.02)), G - 0.005, x, y, segs=16, outline=0.005)
    lathe(f'towertop{k}', M['brickDark'], ((0.078, 0), (0.078, 0.015)), G + WH + 0.01, x, y, segs=16, outline=0.002)
# the gateway
box('gateway', M['brick'], 0.0, -S - 0.02, G - 0.005, 0.28, 0.14, WH + 0.13, outline=0.007, bevel=0)
box('gatewaytop', M['brickDark'], 0.0, -S - 0.02, G + WH + 0.12, 0.3, 0.16, 0.02, outline=0.002, bevel=0)
pointed_arch('iwan', 0.0, -S - 0.094, G - 0.005, 0.13, 0.15, 'y')
pointed_arch('iwandoor', 0.0, -S - 0.098, G - 0.005, 0.05, 0.07, 'y', mat=M['brickDark'])
for s in (-1, 1):
    pointed_arch(f'gatewin{s}', s * 0.1, -S - 0.094, G + 0.14, 0.025, 0.04, 'y')


def camel(name, x, y, rot, lying):
    objs = set(bpy.data.objects)
    bz = 0.05 if lying else 0.11
    b = ball(f'{name}body', M['camel'], 0, 0, 0, 1.0, outline=0.003)
    b.scale = (0.07, 0.035, 0.035)
    b.location = (0, 0, bz)
    ball(f'{name}hump', M['camel'], -0.01, 0, bz + 0.035, 0.028, outline=0.002)
    bar(f'{name}neck', M['camel'], (0.05, 0, bz + 0.01), (0.09, 0, bz + 0.07), 0.018, outline=0.002)
    h = ball(f'{name}head', M['camel'], 0, 0, 0, 1.0, outline=0.002)
    h.scale = (0.025, 0.013, 0.013)
    h.location = (0.105, 0, bz + 0.075)
    if not lying:
        for lx in (-0.045, 0.045):
            for ly in (-0.018, 0.018):
                bar(f'{name}leg{lx}{ly}', M['camel'], (lx, ly, bz - 0.02), (lx, ly, 0.0), 0.012, outline=0.001)
    bpy.context.view_layer.update()
    m = Matrix.Translation((x, y, G)) @ Matrix.Rotation(rot, 4, 'Z')
    for o in set(bpy.data.objects) - objs:
        o.matrix_world = m @ o.matrix_world


camel('camel1', -0.32, -0.88, 0.3, False)
camel('camel2', 0.3, -0.85, 2.6, True)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

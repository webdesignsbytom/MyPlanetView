# A cartoon San Agustín for the country maps, built in the set's shared look (../toon.py): the great
# field of carved stone statues in Colombia's Andes, the grey monoliths with their huge heads,
# wide noses, round eyes and jaguar fangs, arms carved across their bodies, standing in the grass,
# one guarding its dolmen tomb between two upright slabs under a great capstone, moss on the stone
# and the green hills and forest round them. Turned a little towards the camera.
# Run: blender -b --factory-startup -P san-agustin.py -- san-agustin-1024.png 1024 san-agustin.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#78b456', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'stone': toon('stone', '#9a988c', shadow_mul=(0.8, 0.8, 0.86), lift=0.15),
    'stoneLight': toon('stoneLight', '#b8b6aa', lift=0.15),
    'fang': toon('fang', '#eeeae0', lift=0.25),
    'moss': toon('moss', '#6a9a4a'),
    'dark': flat('dark', '#2e2a2a'),
    'jungle': toon('jungle', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'path': toon('path', '#c8b48a', lift=0.15),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(1913)


def statue(name, x, y, h, w, rot=0.0):
    """A carved monolith facing -y: a body with crossed arms and a big head with eyes, a nose and fangs."""
    objs = set(bpy.data.objects)
    box(f'{name}body', M['stone'], 0, 0, G - 0.005, w * 0.85, 0.08, h * 0.5, outline=0.004, bevel=0)
    for s in (-1, 1):
        bar(f'{name}arm{s}', M['stoneLight'], (s * w * 0.35, -0.042, G + h * 0.42), (-s * w * 0.1, -0.042, G + h * 0.2), 0.018, outline=0.001)
    HZ = G + h * 0.5 - 0.005
    box(f'{name}head', M['stone'], 0, 0, HZ, w, 0.09, h * 0.5, outline=0.004, bevel=0)
    box(f'{name}headdress', M['stoneLight'], 0, 0, HZ + h * 0.46, w + 0.01, 0.095, h * 0.06, outline=0.002, bevel=0)
    for s in (-1, 1):
        cyl(f'{name}eye{s}', M['dark'], w * 0.12, 0.006, segs=12, outline=0, matrix=Matrix.Translation((s * w * 0.24, -0.047, HZ + h * 0.33)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        cyl(f'{name}eyering{s}', M['stoneLight'], w * 0.17, 0.004, segs=12, outline=0, matrix=Matrix.Translation((s * w * 0.24, -0.045, HZ + h * 0.33)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    box(f'{name}nose', M['stoneLight'], 0, -0.05, HZ + h * 0.19, w * 0.28, 0.02, h * 0.12, outline=0.001, bevel=0)
    box(f'{name}mouth', M['dark'], 0, -0.047, HZ + h * 0.06, w * 0.7, 0.006, h * 0.09, outline=0, bevel=0)
    for s in (-1, 1):
        for f in (0.12, 0.3):
            fx = s * w * f
            loft(f'{name}fang{s}{f}', M['fang'], [[(fx - w * 0.04, -0.052, HZ + h * 0.15), (fx + w * 0.04, -0.052, HZ + h * 0.15), (fx + w * 0.04, -0.048, HZ + h * 0.15), (fx - w * 0.04, -0.048, HZ + h * 0.15)],
                                                  [(fx - 0.002, -0.052, HZ + h * 0.05), (fx + 0.002, -0.052, HZ + h * 0.05), (fx + 0.002, -0.048, HZ + h * 0.05), (fx - 0.002, -0.048, HZ + h * 0.05)]], outline=0)
    m = ball(f'{name}moss', M['moss'], 0, 0, 0, 1.0, outline=0.002)
    m.scale = (w * 0.35, 0.05, 0.02)
    m.location = (w * 0.2, 0.0, HZ + h * 0.5)
    bpy.context.view_layer.update()
    mm = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(rot, 4, 'Z')
    for o in set(bpy.data.objects) - objs:
        o.matrix_world = mm @ o.matrix_world


# ---------- the path among the statues ----------
box('path', M['path'], 0.0, -0.35, G - 0.004, 0.12, 1.1, 0.01, outline=0.001, bevel=0)

# ---------- the dolmen tomb and its guardian ----------
DX, DY = 0.0, 0.35
for s in (-1, 1):
    box(f'slab{s}', M['stone'], DX + s * 0.17, DY, G - 0.005, 0.05, 0.16, 0.34, outline=0.005, bevel=0)
box('capstone', M['stone'], DX, DY, G + 0.33, 0.48, 0.2, 0.06, outline=0.006, bevel=0)
cap_moss = ball('capmoss', M['moss'], 0, 0, 0, 1.0, outline=0.002)
cap_moss.scale = (0.12, 0.06, 0.02)
cap_moss.location = (DX - 0.08, DY, G + 0.39)
statue('guardian', DX, DY - 0.02, 0.3, 0.2)

# ---------- statues standing in the grass ----------
for k, (x, y, h, w, rot) in enumerate(((-0.5, -0.1, 0.34, 0.18, 0.2), (0.48, -0.05, 0.3, 0.17, -0.25), (-0.3, -0.6, 0.24, 0.15, 0.1), (0.35, -0.62, 0.26, 0.16, -0.1))):
    statue(f'statue{k}', x, y, h, w, rot)

# ---------- the forest round the clearing ----------
for k in range(12):
    a = math.radians(15 + k * 13.5)
    x, y = 1.0 * math.cos(a), 0.15 + 0.95 * math.sin(a)
    if math.hypot(x, y) > 1.22:
        continue
    ball(f'jungle{k}', M['jungle'], x, y, G + 0.13, 0.12 + 0.03 * rng.random(), outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

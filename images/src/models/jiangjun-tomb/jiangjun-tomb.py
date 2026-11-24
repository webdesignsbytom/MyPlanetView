# A cartoon Jiangjun Tomb for the country maps, built in the set's shared look (../toon.py): the
# "General's Tomb" of a Koguryo king at Ji'an in Jilin, China, the "pyramid of the East": seven
# stepped tiers of dressed granite blocks, the great boulders leaning against each side to hold
# it up, the burial chamber's opening high in the fifth tier, and the hills along the Yalu
# behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P jiangjun-tomb.py -- jiangjun-tomb-1024.png 1024 jiangjun-tomb.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'hill': toon('hill', '#6a9a48', shadow_mul=(0.7, 0.78, 0.8)),
    'granite': toon('granite', '#c8c0b0', shadow_mul=(0.8, 0.8, 0.86), lift=0.18),
    'graniteDark': toon('graniteDark', '#a8a092'),
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


for k, (x, y, r, h) in enumerate(((-0.6, 1.0, 0.4, 0.34), (0.3, 1.05, 0.38, 0.4))):
    hl = lathe(f'hill{k}', M['hill'], ((r, 0), (r * 0.7, h * 0.6), (r * 0.3, h * 0.95), (0.0, h)), G - 0.01, x, y, segs=20, outline=0.006)
    hl.visible_shadow = False

# ---------- the seven stepped tiers ----------
TX, TY = 0.0, 0.05
z = G - 0.005
w = 0.7
for k in range(7):
    h = 0.07 if k < 3 else 0.055
    box(f'tier{k}', M['granite'], TX, TY, z, w, w, h, outline=0.006, bevel=0)
    box(f'tierjoint{k}', M['graniteDark'], TX, TY - w / 2 - 0.002, z + h * 0.5, w, 0.004, 0.006, outline=0, bevel=0)
    for j in range(int(w / 0.07)):
        box(f'tierblock{k}{j}', M['graniteDark'], TX - w / 2 + 0.035 + j * 0.07, TY - w / 2 - 0.002, z, 0.004, 0.004, h, outline=0, bevel=0)
    z += h
    w -= 0.08
box('cap', M['granite'], TX, TY, z, w + 0.02, w + 0.02, 0.025, outline=0.003, bevel=0)
box('chamber', M['dark'], TX, TY - (0.7 - 4 * 0.08) / 2 - 0.003, G + 0.21 + 0.055, 0.06, 0.006, 0.045, outline=0, bevel=0)

# ---------- the great boulders leaning on each side ----------
for side in range(4):
    a = side * math.pi / 2
    for j in (-1, 0, 1):
        t = j * 0.22
        x = TX + (0.37 * math.cos(a - math.pi / 2)) + t * math.cos(a)
        y = TY + (0.37 * math.sin(a - math.pi / 2)) + t * math.sin(a)
        b = box(f'boulder{side}{j}', M['graniteDark'], 0, 0, 0, 0.12, 0.06, 0.16, outline=0.004, bevel=0)
        b.matrix_world = Matrix.Translation((x, y, G - 0.01)) @ Matrix.Rotation(a, 4, 'Z') @ Matrix.Rotation(-0.25, 4, 'X') @ b.matrix_world

box('path', M['path'], TX, TY - 0.7, G - 0.004, 0.12, 0.5, 0.008, outline=0.001, bevel=0)
for k, (x, y) in enumerate(((-0.8, -0.4), (0.8, -0.4), (-0.85, 0.3), (0.85, 0.35), (-0.45, -0.85), (0.45, -0.85))):
    tree(f'tree{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

# A cartoon Sambor Prei Kuk for the country maps, built in the set's shared look (../toon.py): the
# temple city of the Chenla kings in the forest of Kampong Thom, Cambodia, older than Angkor:
# the brick sanctuary towers, square and octagonal, with their shallow carved "flying palaces"
# on the walls, rising in tiers to their tops, the strangler figs gripping one of them, and
# the forest all round. Turned a little towards the camera.
# Run: blender -b --factory-startup -P sambor-prei-kuk.py -- sambor-prei-kuk-1024.png 1024 sambor-prei-kuk.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'brick': toon('brick', '#b86a4a', shadow_mul=(0.78, 0.7, 0.74), lift=0.12),
    'brickLight': toon('brickLight', '#cc8464', lift=0.15),
    'sandstone': toon('sandstone', '#c8b088'),
    'root': toon('root', '#b0a490'),
    'path': toon('path2', '#d8c8a4', lift=0.18),
    'dark': flat('dark', '#2e2420'),
    'tree': toon('tree', '#2e7a38', shadow_mul=(0.7, 0.78, 0.8)),
    'treeLight': toon('treeLight', '#4e9a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(1818746)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


box('path', M['path'], 0.0, -0.5, G - 0.004, 0.14, 0.7, 0.008, outline=0.001, bevel=0)


def tower(name, x, y, w, h, octagonal=False):
    segs = 8 if octagonal else 4
    r = w / 2 / (math.cos(math.pi / segs))
    rot = math.pi / segs
    m = Matrix.Translation((x, y, G - 0.005 + h / 2)) @ Matrix.Rotation(rot, 4, 'Z')
    cyl(name, M['brick'], r, h, segs=segs, outline=0.006, matrix=m)
    z, rr = G - 0.005 + h, r
    for k in range(3):
        cyl(f'{name}tier{k}', M['brickLight'] if k % 2 == 0 else M['brick'], rr * 0.85, 0.06, segs=segs, outline=0.003, matrix=Matrix.Translation((x, y, z + 0.03)) @ Matrix.Rotation(rot, 4, 'Z'))
        z += 0.06
        rr *= 0.78
    cyl(name + 'top', M['brickLight'], rr, 0.05, segs=segs, r2=0.0, outline=0.002, matrix=Matrix.Translation((x, y, z + 0.025)) @ Matrix.Rotation(rot, 4, 'Z'))
    box(name + 'door', M['sandstone'], x, y - w / 2 - 0.004, G - 0.005, w * 0.35, 0.01, h * 0.55, outline=0.001, bevel=0)
    box(name + 'doorin', M['dark'], x, y - w / 2 - 0.008, G - 0.005, w * 0.22, 0.006, h * 0.45, outline=0, bevel=0)
    for s in (-1, 1):
        box(f'{name}palace{s}', M['brickLight'], x + s * w * 0.32, y - w / 2 - 0.003, G + h * 0.3, w * 0.16, 0.006, h * 0.3, outline=0, bevel=0)


# ---------- the sanctuary towers ----------
tower('main', 0.0, 0.2, 0.28, 0.32)
tower('oct1', -0.5, -0.05, 0.2, 0.24, octagonal=True)
tower('oct2', 0.5, -0.05, 0.2, 0.24, octagonal=True)
tower('small', -0.35, 0.55, 0.16, 0.18)
tower('fig', 0.45, 0.5, 0.18, 0.2)
# the strangler fig gripping the last
for k in range(6):
    a = 2 * math.pi * k / 6
    bar(f'figroot{k}', M['root'], (0.45 + 0.1 * math.cos(a), 0.5 + 0.1 * math.sin(a), G + 0.25), (0.45 + 0.14 * math.cos(a), 0.5 + 0.14 * math.sin(a), G), 0.018, outline=0.001)
b = ball('figcrown', M['treeLight'], 0, 0, 0, 0.17, outline=0.008)
b.scale = (1.2, 1.2, 0.7)
b.location = (0.45, 0.5, G + 0.4)

for k in range(12):
    a = 2 * math.pi * k / 12 + 0.1
    x, y = 1.1 * math.cos(a), 1.02 * math.sin(a)
    if abs(x) < 0.3 and y < 0:
        continue
    tree(f'tree{k}', x, y, r=0.11 + 0.03 * rng.random(), h=0.16 + 0.06 * rng.random(), mat='tree' if k % 2 else 'treeLight')

bpy.context.view_layer.update()
turn(before, -20)
render(G)

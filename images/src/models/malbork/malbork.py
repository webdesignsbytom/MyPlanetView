# A cartoon Malbork Castle for the country maps, built in the set's shared look (../toon.py): the
# Teutonic Order's great red-brick fortress on the Nogat, its High Castle's steep roofs and the main
# tower, the crenellated walls and round towers along the riverbank, the wooden footbridge, and the
# trees of the bank. Turned a little towards the camera.
# Run: blender -b --factory-startup -P malbork.py -- malbork-1024.png 1024 malbork.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'river': toon('river', '#4a7a9a', lift=0.3),
    'brick': toon('brick', '#a8503a', shadow_mul=(0.86, 0.76, 0.72)),
    'brickDark': toon('brickDark', '#8a3e2e', shadow_mul=(0.86, 0.76, 0.72)),
    'roof': toon('roof', '#c4573a'),
    'roofDark': toon('roofDark', '#7a3428'),
    'window': flat('window', '#2e2a28'),
    'wood': toon('wood', '#8a6448'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


flat_face('river', M['river'], [(1.42 * math.cos(math.radians(a)), 1.42 * math.sin(math.radians(a))) for a in range(206, 335, 4)], G + 0.004, outline=0.01)
box('footbridge', M['wood'], -0.65, -0.75, G + 0.02, 0.08, 0.5, 0.02, outline=0.004, bevel=0)


def range_block(name, x, y, w, d, h, mat='brick', roofmat='roof'):
    box(name, M[mat], x, y, G - 0.005, w, d, h, outline=0.012, bevel=0)
    for j in range(int(w / 0.06)):
        box(f'{name}win{j}', M['window'], x - w / 2 + 0.03 + j * 0.06, y - d / 2 - 0.004, G + h * 0.55, 0.02, 0.006, 0.05, outline=0, bevel=0)
    rings = [[(x - w / 2, y - d / 2, G + h - 0.005), (x + w / 2, y - d / 2, G + h - 0.005), (x + w / 2, y + d / 2, G + h - 0.005), (x - w / 2, y + d / 2, G + h - 0.005)]]
    if w >= d:
        rings.append([(x - w / 2, y - 0.004, G + h + d * 0.8), (x + w / 2, y - 0.004, G + h + d * 0.8), (x + w / 2, y + 0.004, G + h + d * 0.8), (x - w / 2, y + 0.004, G + h + d * 0.8)])
    else:
        rings.append([(x - 0.004, y - d / 2, G + h + w * 0.8), (x + 0.004, y - d / 2, G + h + w * 0.8), (x + 0.004, y + d / 2, G + h + w * 0.8), (x - 0.004, y + d / 2, G + h + w * 0.8)])
    loft(f'{name}roof', M[roofmat], rings, outline=0.01)


# ---------- the High Castle, the Middle Castle ----------
range_block('highnorth', -0.15, 0.5, 0.55, 0.16, 0.24, roofmat='roofDark')
range_block('highsouth', -0.15, 0.1, 0.55, 0.16, 0.22)
range_block('highwest', -0.42, 0.3, 0.14, 0.38, 0.22)
range_block('higheast', 0.12, 0.3, 0.14, 0.38, 0.22)
TX, TY = 0.2, 0.55
box('maintower', M['brickDark'], TX, TY, G - 0.005, 0.13, 0.13, 0.52, outline=0.012, bevel=0)
for j in range(6):
    box(f'maintowermerlon{j}', M['brickDark'], TX - 0.055 + (j % 3) * 0.055, TY - 0.06 + (j // 3) * 0.12, G + 0.515, 0.03, 0.02, 0.03, outline=0.003, bevel=0)
pyramid('maintowerroof', M['roofDark'], TX, TY, G + 0.545, 0.12, 0.12, outline=0.007)
range_block('middle', 0.6, 0.15, 0.4, 0.18, 0.18)

# ---------- the walls and round towers along the bank ----------
box('riverwall', M['brick'], 0.0, -0.18, G - 0.005, 2.2, 0.06, 0.12, outline=0.01, bevel=0)
for j in range(22):
    box(f'wallmerlon{j}', M['brick'], -1.05 + j * 0.1, -0.21, G + 0.115, 0.04, 0.03, 0.03, outline=0.002, bevel=0)
for k, x in enumerate((-0.95, -0.45, 0.25, 0.85)):
    lathe(f'walltower{k}', M['brick'], ((0.06, 0), (0.06, 0.2)), G - 0.005, x, -0.18, segs=14, outline=0.008)
    lathe(f'walltowerroof{k}', M['roof'], ((0.07, 0), (0.004, 0.12)), G + 0.195, x, -0.18, segs=14, outline=0.006)
for k, (x, y) in enumerate(((-1.0, 0.4), (0.95, 0.5), (-0.85, 0.75), (0.75, 0.8))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.08, 0.08, outline=0.011)

turn(before, -20)
render(G)

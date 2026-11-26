# A cartoon Khami for the country maps, built in the set's shared look (../toon.py): the capital of
# the Torwa kingdom near Bulawayo, Zimbabwe, after Great Zimbabwe: its hill built up in curving
# terraces of dry-stone walling, the walls decorated with chequered and herringbone bands of
# granite blocks, the royal enclosure on top, and the msasa trees and the river beside it.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P khami.py -- khami-1024.png 1024 khami.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#a4bc66', shadow_mul=(0.72, 0.78, 0.8), lift=0.2),
    'earth': toon('earth', '#b89a6e', shadow_mul=(0.8, 0.76, 0.8)),
    'stone': toon('stone', '#c8b898', shadow_mul=(0.8, 0.8, 0.86), lift=0.15),
    'stoneDark': toon('stoneDark', '#8a7c66'),
    'water': toon('water', '#4a8ac0', lift=0.3),
    'thatch': toon('thatch', '#c8a458', lift=0.15),
    'mud': toon('mud', '#b8865a'),
    'tree': toon('tree', '#5a8a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(938685)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)

def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


loft('river', M['water'], [strip(-1.31, -0.85, 1.32, G - 0.004), strip(-1.31, -0.85, 1.32, G + 0.008)], outline=0.002)

# ---------- the terraced hill ----------
HX, HY = 0.0, 0.15
TIERS = ((0.85, 0.65, 0.1), (0.65, 0.5, 0.1), (0.45, 0.35, 0.1))
z = G - 0.005
for k, (rx, ry, h) in enumerate(TIERS):
    ring = lambda sx, sy, zz: [(HX + sx * math.cos(2 * math.pi * j / 32), HY + sy * math.sin(2 * math.pi * j / 32), zz) for j in range(32)]
    t = loft(f'terrace{k}', M['stone'], [ring(rx, ry, z), ring(rx, ry, z + h)], outline=0.005)
    loft(f'terracetop{k}', M['earth'], [ring(rx - 0.01, ry - 0.01, z + h - 0.002), ring(rx - 0.01, ry - 0.01, z + h + 0.004)], outline=0)
    # the decorated bands: chequers along the front of each wall
    for j in range(18):
        a = math.pi + 0.3 + j * (math.pi - 0.6) / 17
        if j % 2:
            continue
        x, y = HX + (rx + 0.002) * math.cos(a), HY + (ry + 0.002) * math.sin(a)
        b = box(f'cheq{k}{j}', M['stoneDark'], 0, 0, 0, 0.03, 0.006, 0.02, outline=0, bevel=0)
        b.matrix_world = Matrix.Translation((x, y, z + h * 0.55)) @ Matrix.Rotation(a + math.pi / 2, 4, 'Z') @ b.matrix_world
    z += h

# ---------- the royal enclosure on top ----------
for k in range(3):
    x, y = HX - 0.12 + k * 0.12, HY + 0.05 * (k % 2)
    lathe(f'hut{k}', M['mud'], ((0.06, 0), (0.06, 0.06)), z, x, y, segs=16, outline=0.003)
    lathe(f'hutroof{k}', M['thatch'], ((0.08, 0), (0.0, 0.09)), z + 0.055, x, y, segs=16, outline=0.003)
for k, (x, y) in enumerate(((-0.95, -0.35), (0.95, -0.45), (1.0, 0.35), (-1.0, 0.4), (-0.4, 0.95), (0.45, 0.95))):
    tree(f'msasa{k}', x, y, r=0.1, h=0.12)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

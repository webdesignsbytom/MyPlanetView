# A cartoon Dazu Rock Carvings for the country maps, built in the set's shared look (../toon.py):
# the Buddhist cliff carvings in the hills of Chongqing, China: Baodingshan's horseshoe of
# sandstone cliff carved with painted figures, the great reclining Buddha's head and shoulders
# along the rock with his disciples rising from the ground before him, the thousand-armed
# Guanyin under her eaves, and the green hills on top. Turned a little towards the camera.
# Run: blender -b --factory-startup -P dazu.py -- dazu-1024.png 1024 dazu.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'cliff': toon('cliff', '#c49a74', shadow_mul=(0.8, 0.74, 0.78), lift=0.12),
    'carve': toon('carve', '#d8b08a', lift=0.16),
    'gold': toon('gold2', '#e8b848', shadow_mul=(0.78, 0.66, 0.6), lift=0.35),
    'robe': toon('robe', '#b86a4a'),
    'blue': toon('blue', '#5a8ab0'),
    'roof': toon('roof', '#4a5a52'),
    'wood': toon('wood', '#8a3a2a'),
    'path': toon('path2', '#d8cab0', lift=0.18),
    'dark': flat('dark', '#2e2420'),
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


# ---------- the horseshoe cliff ----------
CR = 0.75
rings = []
for z in (G - 0.01, G + 0.42):
    outer = [((CR + 0.25) * math.cos(a), (CR + 0.25) * math.sin(a) - 0.05, z) for a in [0.15 + k * (math.pi - 0.3) / 16 for k in range(17)]]
    inner = [(CR * math.cos(a), CR * math.sin(a) - 0.05, z) for a in [math.pi - 0.15 - k * (math.pi - 0.3) / 16 for k in range(17)]]
    rings.append(outer + inner)
cliff = loft('cliff', M['cliff'], rings, outline=0.007)
cliff.visible_shadow = False
for k, (x, y) in enumerate(((-0.7, 0.75), (-0.2, 0.92), (0.35, 0.9), (0.75, 0.6))):
    b = ball(f'topbush{k}', M['tree'], 0, 0, 0, 0.12, outline=0.008)
    b.scale = (1.3, 1.1, 0.7)
    b.location = (x, y, G + 0.45)

# ---------- the reclining Buddha along the back of the cliff ----------
head = ball('buddhahead', M['carve'], 0, 0, 0, 0.11, outline=0.006)
head.scale = (0.9, 0.8, 1.0)
head.location = (-0.45, 0.55, G + 0.2)
ball('buddhahair', M['dark'], -0.45, 0.58, G + 0.29, 0.06, outline=0.003)
body = ball('buddhabody', M['robe'], 0, 0, 0, 0.16, outline=0.007)
body.scale = (2.0, 0.6, 0.8)
body.location = (-0.02, 0.62, G + 0.14)
for k in range(5):
    x = -0.3 + k * 0.13
    rod(f'disciple{k}', M['robe'] if k % 2 else M['blue'], (x, 0.48, G), (x, 0.48, G + 0.12), 0.03, segs=10, outline=0.003)
    ball(f'disciplehead{k}', M['carve'], x, 0.48, G + 0.15, 0.03, outline=0.002)

# ---------- the thousand-armed Guanyin under her eaves ----------
GX, GY = 0.62, 0.12
box('guanyinhall', M['wood'], GX, GY + 0.06, G - 0.005, 0.26, 0.04, 0.26, outline=0.004, bevel=0)
for s in (-1, 1):
    rod(f'guanyinpost{s}', M['wood'], (GX + s * 0.12, GY - 0.2, G), (GX + s * 0.12, GY - 0.2, G + 0.26), 0.01, segs=6, outline=0.001)
hip('guanyinroof', M['roof'], GX, GY - 0.07, G + 0.255, 0.32, 0.3, 0.08, outline=0.004)
lathe('guanyin', M['gold'], ((0.07, 0), (0.06, 0.08), (0.03, 0.14), (0.0, 0.16)), G + 0.02, GX, GY - 0.12, segs=12, outline=0.003)
for k in range(9):
    a = math.pi * k / 8
    bar(f'arm{k}', M['gold'], (GX, GY - 0.12, G + 0.1), (GX + 0.09 * math.cos(a), GY - 0.13, G + 0.1 + 0.09 * math.sin(a)), 0.01, outline=0)

# ---------- the path through the horseshoe ----------
box('path', M['path'], 0.0, -0.45, G - 0.004, 0.14, 0.9, 0.008, outline=0.001, bevel=0)
for k, (x, y) in enumerate(((-0.75, -0.55), (0.7, -0.6), (-0.3, -0.95), (0.35, -0.95))):
    tree(f'tree{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

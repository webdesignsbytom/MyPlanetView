# A cartoon Humayun's Tomb for the country maps, built in the set's shared look (../toon.py): Delhi's
# great Mughal garden tomb, its red sandstone body framed in white marble on a high arcaded
# platform, the tall white marble dome on its drum and the little domed kiosks round it, in the
# four-part garden cut by water channels. Turned a little towards the camera.
# Run: blender -b --factory-startup -P humayuns-tomb.py -- humayuns-tomb-1024.png 1024 humayuns-tomb.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'path': toon('path', '#d8c4a4'),
    'channel': toon('channel', '#5a9ac0', lift=0.3),
    'sandstone': toon('sandstone', '#c0583a', shadow_mul=(0.86, 0.74, 0.72)),
    'marble': toon('marble', '#f8f6f0', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'door': flat('door', '#2e2420'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'brass': toon('brass', '#d8a030', lift=0.3),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

# ---------- the four-part garden ----------
for a in (0, math.pi / 2):
    box(f'path{a}', M['path'], 0.0, 0.0, G - 0.004, 2.2 if a == 0 else 0.14, 0.14 if a == 0 else 2.2, 0.01, outline=0.003, bevel=0)
    box(f'channel{a}', M['channel'], 0.0, 0.0, G - 0.003, 2.1 if a == 0 else 0.05, 0.05 if a == 0 else 2.1, 0.014, outline=0.002, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        ball(f'tree{sx}{sy}', M['tree'], sx * 0.75, sy * 0.7, G + 0.08, 0.08, outline=0.008)

# ---------- the platform ----------
box('platform', M['sandstone'], 0.0, 0.15, G - 0.005, 0.95, 0.75, 0.12, outline=0.01, bevel=0)
for j in range(9):
    x = -0.42 + j * 0.105
    box(f'arcade{j}', M['marble'], x, -0.226, G + 0.02, 0.055, 0.006, 0.07, outline=0, bevel=0)
    box(f'arcadedoor{j}', M['door'], x, -0.229, G + 0.025, 0.035, 0.006, 0.05, outline=0, bevel=0)
P = G + 0.115

# ---------- the tomb ----------
TX, TY = 0.0, 0.18
box('tomb', M['sandstone'], TX, TY, P - 0.005, 0.56, 0.48, 0.24, outline=0.011, bevel=0)
for s in (-1, 0, 1):
    w = 0.15 if s == 0 else 0.09
    h = 0.2 if s == 0 else 0.13
    box(f'iwanframe{s}', M['marble'], TX + s * 0.18, TY - 0.242, P + 0.01, w + 0.03, 0.006, h + 0.02, outline=0, bevel=0)
    box(f'iwan{s}', M['door'], TX + s * 0.18, TY - 0.245, P + 0.02, w * 0.6, 0.006, h * 0.7, outline=0, bevel=0)
box('tombcornice', M['marble'], TX, TY, P + 0.23, 0.58, 0.5, 0.02, outline=0.004, bevel=0)
lathe('drum', M['sandstone'], ((0.16, 0), (0.16, 0.09)), P + 0.245, TX, TY, segs=24, outline=0.007)
lathe('drumband', M['marble'], ((0.162, 0), (0.162, 0.02)), P + 0.305, TX, TY, segs=24, outline=0)
lathe('dome', M['marble'], ((0.17, 0), (0.18, 0.06), (0.16, 0.13), (0.1, 0.2), (0.03, 0.24), (0.004, 0.25)), P + 0.33, TX, TY, segs=28, outline=0.009)
lathe('finial', M['brass'], ((0.014, 0), (0.008, 0.04), (0.003, 0.08)), P + 0.57, TX, TY, segs=8, outline=0.002)
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = TX + sx * 0.2, TY + sy * 0.16
        for j in range(4):
            a = math.pi / 4 + j * math.pi / 2
            rod(f'kioskcol{sx}{sy}{j}', M['marble'], (x + 0.03 * math.cos(a), y + 0.03 * math.sin(a), P + 0.24), (x + 0.03 * math.cos(a), y + 0.03 * math.sin(a), P + 0.3), 0.005, segs=4, outline=0.001)
        lathe(f'kioskdome{sx}{sy}', M['marble'], ((0.045, 0), (0.04, 0.025), (0.02, 0.045), (0.004, 0.055)), P + 0.3, x, y, segs=12, outline=0.004)

turn(before, -20)
render(G)

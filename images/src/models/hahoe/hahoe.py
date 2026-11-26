# A cartoon Hahoe Folk Village for the country maps, built in the set's shared look (../toon.py):
# the clan village of the Ryu family in a loop of the Nakdong river, Korea: the yangban houses
# with their curved grey tile roofs and white walls, the commoners' thatched houses round them,
# the low stone walls of the lanes, the old zelkova tree, and across the river the cliff of
# Buyongdae. Turned a little towards the camera.
# Run: blender -b --factory-startup -P hahoe.py -- hahoe-1024.png 1024 hahoe.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#a4c064', shadow_mul=(0.72, 0.78, 0.8), lift=0.2),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'cliff': toon('cliff', '#b8a88a', shadow_mul=(0.8, 0.78, 0.84)),
    'white': toon('white', '#f2eee4', lift=0.22),
    'wood': toon('wood', '#7a5236'),
    'tiles': toon('tiles', '#4a4e58'),
    'thatch': toon('thatch', '#c8a458', shadow_mul=(0.8, 0.76, 0.76), lift=0.15),
    'stone': toon('stone', '#b8b0a0'),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


loft('river', M['water'], [strip(0.6, 0.9, 1.32, G - 0.004), strip(0.6, 0.9, 1.32, G + 0.008)], outline=0.002)
cl = loft('buyongdae', M['cliff'], [strip(0.92, 1.31, 1.32, G - 0.01), strip(0.95, 1.31, 1.32, G + 0.32)], outline=0.007)
cl.visible_shadow = False
for k, x in enumerate((-0.6, -0.2, 0.25, 0.65)):
    b = ball(f'clifftree{k}', M['tree'], 0, 0, 0, 0.1, outline=0.007)
    b.scale = (1.3, 1.0, 0.6)
    b.location = (x, 1.08, G + 0.35)


def tile_roof(name, x, y, z, w, d, h):
    rr = [[(x - w / 2 - 0.03, y - d / 2 - 0.03, z + 0.025), (x + w / 2 + 0.03, y - d / 2 - 0.03, z + 0.025), (x + w / 2 + 0.03, y + d / 2 + 0.03, z + 0.025), (x - w / 2 - 0.03, y + d / 2 + 0.03, z + 0.025)],
          [(x - w / 2, y - d / 2, z + h * 0.35), (x + w / 2, y - d / 2, z + h * 0.35), (x + w / 2, y + d / 2, z + h * 0.35), (x - w / 2, y + d / 2, z + h * 0.35)],
          [(x - w * 0.35, y - 0.004, z + h), (x + w * 0.35, y - 0.004, z + h), (x + w * 0.35, y + 0.004, z + h), (x - w * 0.35, y + 0.004, z + h)]]
    loft(name, M['tiles'], rr, outline=0.004)


# ---------- the yangban houses ----------
for k, (x, y, w) in enumerate(((-0.25, 0.2, 0.36), (0.3, 0.15, 0.3), (-0.05, -0.2, 0.3))):
    box(f'yangbanbase{k}', M['stone'], x, y, G - 0.005, w + 0.04, 0.2, 0.03, outline=0.002, bevel=0)
    box(f'yangban{k}', M['white'], x, y, G + 0.025, w, 0.16, 0.1, outline=0.004, bevel=0)
    for j in range(int(w / 0.06) + 1):
        box(f'yangbanpost{k}{j}', M['wood'], x - w / 2 + j * w / int(w / 0.06), y - 0.083, G + 0.025, 0.012, 0.006, 0.1, outline=0, bevel=0)
    tile_roof(f'yangbanroof{k}', x, y, G + 0.12, w, 0.16, 0.12)
    box(f'yangbandoor{k}', M['wood'], x, y - 0.083, G + 0.03, 0.05, 0.006, 0.07, outline=0, bevel=0)

# ---------- the thatched houses ----------
for k, (x, y) in enumerate(((-0.7, -0.15), (-0.6, -0.5), (0.6, -0.3), (0.35, -0.6), (-0.3, -0.6), (0.75, 0.25))):
    box(f'thatchhouse{k}', M['white'], x, y, G - 0.005, 0.2, 0.13, 0.08, outline=0.004, bevel=0)
    loft(f'thatchroof{k}', M['thatch'], [[(x - 0.12, y - 0.085, G + 0.07), (x + 0.12, y - 0.085, G + 0.07), (x + 0.12, y + 0.085, G + 0.07), (x - 0.12, y + 0.085, G + 0.07)],
                                          [(x - 0.1, y - 0.06, G + 0.11), (x + 0.1, y - 0.06, G + 0.11), (x + 0.1, y + 0.06, G + 0.11), (x - 0.1, y + 0.06, G + 0.11)],
                                          [(x - 0.06, y - 0.01, G + 0.14), (x + 0.06, y - 0.01, G + 0.14), (x + 0.06, y + 0.01, G + 0.14), (x - 0.06, y + 0.01, G + 0.14)]], outline=0.004, smooth=True)
    box(f'thatchdoor{k}', M['wood'], x, y - 0.068, G - 0.005, 0.035, 0.006, 0.06, outline=0, bevel=0)

# ---------- the lane walls and the zelkova ----------
for k, (x0, y0, x1, y1) in enumerate(((-0.95, 0.0, -0.45, 0.0), (0.1, -0.02, 0.55, -0.05), (-0.45, -0.38, 0.15, -0.42))):
    bar(f'lanewall{k}', M['stone'], (x0, y0, G + 0.02), (x1, y1, G + 0.02), 0.04, outline=0.002)
rod('zelkovatrunk', M['trunk'], (0.05, 0.45, G), (0.05, 0.45, G + 0.16), 0.03, segs=8, outline=0.003)
b = ball('zelkova', M['tree'], 0, 0, 0, 0.17, outline=0.008)
b.scale = (1.3, 1.3, 0.85)
b.location = (0.05, 0.45, G + 0.3)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

# A cartoon Lednice-Valtice for the country maps, built in the set's shared look (../toon.py): Lednice
# Castle's romantic neo-Gothic front of pale stone with its pinnacles, battlements and oriel windows,
# the tall round corner tower, and across the park's lake the slender Lednice minaret with its
# galleries, with the trees and lawns of the English landscape park. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P lednice.py -- lednice-1024.png 1024 lednice.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'water': toon('water', '#4a9ab0', lift=0.3),
    'stone': toon('stone', '#ece0c8', shadow_mul=(0.84, 0.84, 0.88), lift=0.2),
    'stoneDark': toon('stoneDark', '#cfc2a4'),
    'roof': toon('roof', '#6a7280'),
    'copper': toon('copper', '#4a8a6a', lift=0.12),
    'window': flat('window', '#3a3a46'),
    'red': toon('red', '#c4704a'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

# ---------- the lake in front ----------
lake = [(-0.1 + 0.55 * math.cos(2 * math.pi * k / 20), -0.6 + 0.3 * math.sin(2 * math.pi * k / 20)) for k in range(20)]
loft('lake', M['water'], [[(x, y, G - 0.004) for x, y in lake], [(x, y, G + 0.006) for x, y in lake]], outline=0.002)

# ---------- the castle ----------
CX, CY = -0.2, 0.3
W, D, H = 0.78, 0.28, 0.28
box('castle', M['stone'], CX, CY, G - 0.005, W, D, H, outline=0.009, bevel=0)
for j in range(16):
    box(f'battlement{j}', M['stoneDark'], CX - W / 2 + 0.02 + j * (W - 0.04) / 15, CY - D / 2 + 0.01, G + H - 0.005, 0.025, 0.02, 0.03, outline=0.001, bevel=0)
for row in range(2):
    for j in range(8):
        x = CX - W / 2 + 0.06 + j * (W - 0.12) / 7
        box(f'win{row}{j}', M['window'], x, CY - D / 2 - 0.003, G + 0.05 + row * 0.11, 0.03, 0.006, 0.07, outline=0, bevel=0)
        pyramid(f'wintop{row}{j}', M['window'], x, CY - D / 2 - 0.003, G + 0.12 + row * 0.11, 0.03, 0.025, outline=0)
# the gabled oriels and their pinnacles along the front
for j in range(4):
    x = CX - W / 2 + 0.12 + j * (W - 0.24) / 3
    box(f'oriel{j}', M['stone'], x, CY - D / 2 - 0.03, G + 0.08, 0.1, 0.06, H, outline=0.004, bevel=0)
    loft(f'orielgable{j}', M['stone'], [[(x - 0.05, CY - D / 2 - 0.06, G + H + 0.075), (x + 0.05, CY - D / 2 - 0.06, G + H + 0.075), (x + 0.05, CY - D / 2, G + H + 0.075), (x - 0.05, CY - D / 2, G + H + 0.075)],
                                        [(x - 0.004, CY - D / 2 - 0.06, G + H + 0.15), (x + 0.004, CY - D / 2 - 0.06, G + H + 0.15), (x + 0.004, CY - D / 2, G + H + 0.15), (x - 0.004, CY - D / 2, G + H + 0.15)]], outline=0.003)
    for s in (-1, 1):
        lathe(f'orielpinnacle{j}{s}', M['stoneDark'], ((0.012, 0), (0.002, 0.08)), G + H + 0.07, x + s * 0.05, CY - D / 2 - 0.06, segs=6, outline=0.001, smooth=False)
loft('castleroof', M['roof'], [[(CX - W / 2, CY - D / 2 + 0.03, G + H - 0.005), (CX + W / 2, CY - D / 2 + 0.03, G + H - 0.005), (CX + W / 2, CY + D / 2, G + H - 0.005), (CX - W / 2, CY + D / 2, G + H - 0.005)],
                               [(CX - W / 2, CY + 0.03, G + H + 0.1), (CX + W / 2, CY + 0.03, G + H + 0.1), (CX + W / 2, CY + 0.04, G + H + 0.1), (CX - W / 2, CY + 0.04, G + H + 0.1)]], outline=0.004)
# the round tower at the corner
TX, TY = CX + W / 2, CY - D / 2
lathe('tower', M['stone'], ((0.08, 0), (0.08, 0.46)), G - 0.005, TX, TY, segs=16, outline=0.006)
for k in range(12):
    a = 2 * math.pi * k / 12
    box(f'towermerlon{k}', M['stoneDark'], TX + 0.075 * math.cos(a), TY + 0.075 * math.sin(a), G + 0.455, 0.025, 0.02, 0.03, rot_z=a + math.pi / 2, outline=0.001, bevel=0)
lathe('towerturret', M['stone'], ((0.035, 0), (0.035, 0.08)), G + 0.455, TX + 0.03, TY + 0.03, segs=10, outline=0.002)
lathe('towerturretcap', M['roof'], ((0.04, 0), (0.003, 0.07)), G + 0.53, TX + 0.03, TY + 0.03, segs=10, outline=0.002, smooth=False)

# ---------- the minaret across the lake ----------
MX, MY = 0.65, -0.3
box('minaretbase', M['red'], MX, MY, G - 0.005, 0.2, 0.2, 0.1, outline=0.004, bevel=0)
Z = G + 0.095
for k, (r, h) in enumerate(((0.06, 0.24), (0.05, 0.2), (0.04, 0.16))):
    lathe(f'minaret{k}', M['red'] if k % 2 else M['stone'], ((r, 0), (r, h)), Z, MX, MY, segs=12, outline=0.004, smooth=False)
    lathe(f'gallery{k}', M['stoneDark'], ((r, 0), (r + 0.03, 0.015), (r + 0.03, 0.025)), Z + h, MX, MY, segs=12, outline=0.002)
    Z += h + 0.025
lathe('minaretcap', M['copper'], ((0.04, 0), (0.035, 0.04), (0.015, 0.07), (0.003, 0.1)), Z, MX, MY, segs=12, outline=0.003)

for k, (x, y) in enumerate(((-0.85, -0.25), (0.35, -0.85), (0.85, 0.3), (0.45, 0.75), (-0.75, 0.75), (-0.75, -0.65))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.15, 0.12, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

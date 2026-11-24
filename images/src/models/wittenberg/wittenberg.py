# A cartoon All Saints' Church, Wittenberg, for the country maps, built in the set's shared look
# (../toon.py): the Castle Church where Luther posted his 95 theses, its tall round tower with the
# words of "A Mighty Fortress" in a mosaic band round its top under the copper dome and lantern, the
# Gothic nave with its tall windows, the bronze Theses Door, and the castle wing beside it. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P wittenberg.py -- wittenberg-1024.png 1024 wittenberg.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d0c8b8', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'stone': toon('stone', '#e4d8c0', shadow_mul=(0.86, 0.84, 0.86), lift=0.15),
    'stoneDark': toon('stoneDark', '#c4b696'),
    'brick': toon('brick', '#c4704a', lift=0.08),
    'copper': toon('copper', '#4a9a7a', lift=0.12),
    'mosaic': toon('mosaic', '#2a4a8a', lift=0.12),
    'gold': toon('gold', '#e0b040', lift=0.2),
    'bronze': toon('bronze', '#6a5a3a', lift=0.1),
    'roof': toon('roof', '#b8603e'),
    'dark': flat('dark', '#2e2e3a'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the nave ----------
NX, NY = 0.1, 0.15
L, W, H = 0.8, 0.3, 0.32
box('nave', M['stone'], NX, NY, G - 0.005, L, W, H, outline=0.009, bevel=0)
loft('naveroof', M['roof'], [[(NX - L / 2, NY - W / 2, G + H - 0.005), (NX + L / 2, NY - W / 2, G + H - 0.005), (NX + L / 2, NY + W / 2, G + H - 0.005), (NX - L / 2, NY + W / 2, G + H - 0.005)],
                             [(NX - L / 2, NY - 0.004, G + H + 0.14), (NX + L / 2, NY - 0.004, G + H + 0.14), (NX + L / 2, NY + 0.004, G + H + 0.14), (NX - L / 2, NY + 0.004, G + H + 0.14)]], outline=0.005)
for j in range(6):
    x = NX - L / 2 + 0.1 + j * (L - 0.2) / 5
    box(f'navewin{j}', M['dark'], x, NY - W / 2 - 0.003, G + 0.08, 0.045, 0.006, 0.18, outline=0, bevel=0)
    pyramid(f'navewintop{j}', M['dark'], x, NY - W / 2 - 0.003, G + 0.26, 0.045, 0.035, outline=0)
    box(f'buttress{j}', M['stoneDark'], x + 0.065, NY - W / 2 - 0.015, G - 0.005, 0.03, 0.03, 0.26, outline=0.002, bevel=0)
# the Theses Door with its bronze panels
DX = NX - 0.1
box('thesesdoorframe', M['stoneDark'], DX, NY - W / 2 - 0.006, G - 0.005, 0.12, 0.008, 0.18, outline=0, bevel=0)
box('thesesdoor', M['bronze'], DX, NY - W / 2 - 0.01, G - 0.005, 0.08, 0.006, 0.12, outline=0, bevel=0)
for k in range(3):
    box(f'thesesline{k}', M['gold'], DX, NY - W / 2 - 0.014, G + 0.02 + k * 0.035, 0.06, 0.004, 0.006, outline=0, bevel=0)
pyramid('thesesgable', M['stoneDark'], DX, NY - W / 2 - 0.006, G + 0.175, 0.12, 0.06, outline=0.001)

# ---------- the round tower ----------
TX, TY = NX - L / 2 - 0.05, NY
lathe('tower', M['stone'], ((0.13, 0), (0.12, 0.62)), G - 0.005, TX, TY, segs=24, outline=0.008)
for k in range(4):
    a = -math.pi / 2 + (k - 1.5) * 0.4
    box(f'towerwin{k}', M['dark'], TX + 0.122 * math.cos(a), TY + 0.122 * math.sin(a), G + 0.22 + (k % 2) * 0.16, 0.03, 0.02, 0.07, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('mosaicband', M['mosaic'], ((0.122, 0), (0.122, 0.07)), G + 0.55, TX, TY, segs=24, outline=0.002)
for k in range(14):
    a = 2 * math.pi * k / 14
    if math.sin(a) > 0.3:
        continue
    box(f'letters{k}', M['gold'], TX + 0.124 * math.cos(a), TY + 0.124 * math.sin(a), G + 0.575, 0.025, 0.006, 0.02, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('gallery', M['stoneDark'], ((0.14, 0), (0.14, 0.02)), G + 0.615, TX, TY, segs=24, outline=0.003)
lathe('dome', M['copper'], ((0.12, 0), (0.11, 0.05), (0.07, 0.1), (0.03, 0.12)), G + 0.63, TX, TY, segs=24, outline=0.005)
lathe('lantern', M['copper'], ((0.03, 0), (0.03, 0.05), (0.015, 0.08), (0.003, 0.14)), G + 0.745, TX, TY, segs=12, outline=0.002)
rod('cross', M['gold'], (TX, TY, G + 0.88), (TX, TY, G + 0.93), 0.004, segs=4, outline=0)

# ---------- the castle wing ----------
box('castlewing', M['stone'], NX + L / 2 + 0.05, NY + 0.25, G - 0.005, 0.26, 0.5, 0.26, outline=0.007, bevel=0)
for row in range(2):
    for j in range(3):
        box(f'castlewin{row}{j}', M['dark'], NX + L / 2 - 0.08 + 0.0 + j * 0.08, NY + 0.0 - 0.003, G + 0.06 + row * 0.09, 0.03, 0.006, 0.05, outline=0, bevel=0)
loft('castleroof', M['roof'], [[(NX + L / 2 - 0.08, NY, G + 0.255), (NX + L / 2 + 0.18, NY, G + 0.255), (NX + L / 2 + 0.18, NY + 0.5, G + 0.255), (NX + L / 2 - 0.08, NY + 0.5, G + 0.255)],
                               [(NX + L / 2 + 0.046, NY, G + 0.34), (NX + L / 2 + 0.054, NY, G + 0.34), (NX + L / 2 + 0.054, NY + 0.5, G + 0.34), (NX + L / 2 + 0.046, NY + 0.5, G + 0.34)]], outline=0.004)
for k, (x, y) in enumerate(((-0.6, -0.5), (0.4, -0.55), (0.85, -0.25), (-0.85, 0.45))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.13, 0.11, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

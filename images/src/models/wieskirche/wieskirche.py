# A cartoon Wieskirche for the country maps, built in the set's shared look (../toon.py): the rococo
# pilgrimage church alone in its Bavarian meadow, its white oval nave under the steep red roof with
# its little lantern, the long choir behind, the slender bell tower with its onion cap, the priests'
# house beside it, and the Alpine foothills behind with a few firs. Turned a little towards the camera.
# Run: blender -b --factory-startup -P wieskirche.py -- wieskirche-1024.png 1024 wieskirche.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'meadow': toon('meadow', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'white': toon('white', '#f6f2ea', shadow_mul=(0.82, 0.84, 0.9), lift=0.2),
    'yellow': toon('yellow', '#f0d890', lift=0.15),
    'roof': toon('roof', '#c4503e'),
    'copper': toon('copper', '#4a8a6a', lift=0.12),
    'dark': flat('dark', '#2e2a2a'),
    'path': toon('path', '#d8c8a8'),
    'hill': toon('hill', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'snow': toon('snow', '#f4f6fa', lift=0.3),
    'mountain': toon('mountain', '#8a96a8', shadow_mul=(0.8, 0.84, 0.92)),
    'fir': toon('fir', '#3f7a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['meadow'])
before = set(bpy.data.objects)

# ---------- the Alps and foothills behind ----------
for k, (x, y, r, h) in enumerate(((-0.5, 0.82, 0.34, 0.5), (0.25, 0.9, 0.34, 0.62))):
    mt = lathe(f'mountain{k}', M['mountain'], ((r, 0), (r * 0.6, h * 0.55), (r * 0.25, h * 0.88), (0.004, h)), G - 0.01, x, y, segs=12, outline=0.008, smooth=False)
    mt.visible_shadow = False
    lathe(f'snow{k}', M['snow'], ((r * 0.25 + 0.006, 0), (0.004, h * 0.12 + 0.004)), G - 0.01 + h * 0.88, x, y, segs=12, outline=0.003, smooth=False)
for k, (x, y, r) in enumerate(((-0.8, 0.45, 0.32), (0.8, 0.55, 0.36))):
    hl = lathe(f'foothill{k}', M['hill'], ((r, 0), (r * 0.7, 0.1), (0.004, 0.16)), G - 0.01, x, y, segs=20, outline=0.006)
    hl.visible_shadow = False
box('path', M['path'], 0, -0.6, G - 0.004, 0.12, 0.7, 0.01, outline=0.001, bevel=0)

# ---------- the church ----------
CX, CY = -0.05, 0.05
# the oval nave
oval = lambda rx, ry, z: [(CX + rx * math.cos(2 * math.pi * k / 24), CY + ry * math.sin(2 * math.pi * k / 24), z) for k in range(24)]
loft('nave', M['white'], [oval(0.22, 0.28, G - 0.005), oval(0.22, 0.28, G + 0.25)], outline=0.008, smooth=True)
for k in range(10):
    a = -math.pi / 2 + (k - 4.5) * 0.3
    if math.sin(a) > 0.3:
        continue
    box(f'navewin{k}', M['dark'], CX + 0.222 * math.cos(a), CY + 0.282 * math.sin(a), G + 0.12, 0.03, 0.03, 0.08, rot_z=a + math.pi / 2, outline=0, bevel=0)
loft('naveroof', M['roof'], [oval(0.24, 0.3, G + 0.245), oval(0.17, 0.22, G + 0.34), oval(0.07, 0.1, G + 0.42)], outline=0.007, smooth=False)
lathe('lantern', M['white'], ((0.05, 0), (0.05, 0.06)), G + 0.41, CX, CY, segs=12, outline=0.003)
lathe('lanterncap', M['copper'], ((0.055, 0), (0.03, 0.04), (0.004, 0.08)), G + 0.47, CX, CY, segs=12, outline=0.002)
# the porch on the front and the long choir behind
box('porch', M['yellow'], CX, CY - 0.3, G - 0.005, 0.18, 0.08, 0.2, outline=0.005, bevel=0)
box('porchdoor', M['dark'], CX, CY - 0.343, G - 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)
loft('porchgable', M['yellow'], [[(CX - 0.09, CY - 0.34, G + 0.195), (CX + 0.09, CY - 0.34, G + 0.195), (CX + 0.09, CY - 0.26, G + 0.195), (CX - 0.09, CY - 0.26, G + 0.195)],
                                 [(CX - 0.02, CY - 0.34, G + 0.27), (CX + 0.02, CY - 0.34, G + 0.27), (CX + 0.02, CY - 0.26, G + 0.27), (CX - 0.02, CY - 0.26, G + 0.27)]], outline=0.003)
box('choir', M['white'], CX, CY + 0.4, G - 0.005, 0.22, 0.34, 0.22, outline=0.007, bevel=0)
loft('choirroof', M['roof'], [[(CX - 0.12, CY + 0.23, G + 0.215), (CX + 0.12, CY + 0.23, G + 0.215), (CX + 0.12, CY + 0.57, G + 0.215), (CX - 0.12, CY + 0.57, G + 0.215)],
                              [(CX - 0.004, CY + 0.23, G + 0.32), (CX + 0.004, CY + 0.23, G + 0.32), (CX + 0.004, CY + 0.57, G + 0.32), (CX - 0.004, CY + 0.57, G + 0.32)]], outline=0.004)
# the bell tower behind the choir, with its onion cap
TX, TY = CX + 0.15, CY + 0.55
box('tower', M['white'], TX, TY, G - 0.005, 0.1, 0.1, 0.5, outline=0.006, bevel=0)
for fy in (-1, 1):
    box(f'belfry{fy}', M['dark'], TX, TY + fy * 0.052, G + 0.38, 0.03, 0.006, 0.06, outline=0, bevel=0)
lathe('onion', M['copper'], ((0.055, 0), (0.06, 0.03), (0.045, 0.07), (0.015, 0.1), (0.02, 0.12), (0.003, 0.18)), G + 0.495, TX, TY, segs=12, outline=0.003)
# the priests' house beside the church
box('priesthouse', M['yellow'], CX + 0.45, CY + 0.25, G - 0.005, 0.24, 0.3, 0.2, outline=0.006, bevel=0)
for j in range(3):
    box(f'priestwin{j}', M['dark'], CX + 0.37 + j * 0.08, CY + 0.098, G + 0.08, 0.03, 0.006, 0.05, outline=0, bevel=0)
loft('priestroof', M['roof'], [[(CX + 0.33, CY + 0.1, G + 0.195), (CX + 0.57, CY + 0.1, G + 0.195), (CX + 0.57, CY + 0.4, G + 0.195), (CX + 0.33, CY + 0.4, G + 0.195)],
                               [(CX + 0.33, CY + 0.246, G + 0.3), (CX + 0.57, CY + 0.246, G + 0.3), (CX + 0.57, CY + 0.254, G + 0.3), (CX + 0.33, CY + 0.254, G + 0.3)]], outline=0.004)

# ---------- firs ----------
for k, (x, y) in enumerate(((-0.6, -0.35), (0.65, -0.35), (-0.8, -0.05), (0.55, -0.75))):
    rod(f'firtrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.05), 0.012, segs=6, outline=0.002)
    lathe(f'fir{k}', M['fir'], ((0.08, 0), (0.05, 0.1), (0.06, 0.1), (0.003, 0.28)), G + 0.04, x, y, segs=10, outline=0.006, smooth=False)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

# A cartoon Modena Cathedral for the country maps, built in the set's shared look (../toon.py): the
# Romanesque cathedral of pale stone on the Piazza Grande, its gabled front with the great rose window,
# the porch on its two lions, the blind arcade galleries along its sides, and the Ghirlandina, the tall
# square bell tower beside it, crowned by its octagonal Gothic spire; the square's arcaded town hall.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P modena.py -- modena-1024.png 1024 modena.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8ccb4', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'stone': toon('stone', '#ece0c4', shadow_mul=(0.86, 0.84, 0.86), lift=0.15),
    'stoneDark': toon('stoneDark', '#cfc0a0'),
    'roof': toon('roof', '#b8603e'),
    'ochre': toon('ochre', '#e0a868', lift=0.1),
    'dark': flat('dark', '#2e2622'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the cathedral, its front to the camera ----------
CX, CY = -0.15, 0.2
W, L, H = 0.4, 0.8, 0.3
box('nave', M['stone'], CX, CY + L / 2 - 0.1, G - 0.005, W, L, H, outline=0.009, bevel=0)
loft('naveroof', M['roof'], [[(CX - W / 2 - 0.01, CY - 0.1, G + H - 0.005), (CX + W / 2 + 0.01, CY - 0.1, G + H - 0.005), (CX + W / 2 + 0.01, CY + L - 0.1, G + H - 0.005), (CX - W / 2 - 0.01, CY + L - 0.1, G + H - 0.005)],
                             [(CX - 0.004, CY - 0.1, G + H + 0.12), (CX + 0.004, CY - 0.1, G + H + 0.12), (CX + 0.004, CY + L - 0.1, G + H + 0.12), (CX - 0.004, CY + L - 0.1, G + H + 0.12)]], outline=0.005)
loft('frontgable', M['stone'], [[(CX - W / 2, CY - 0.1, G + H - 0.005), (CX + W / 2, CY - 0.1, G + H - 0.005), (CX + W / 2, CY - 0.08, G + H - 0.005), (CX - W / 2, CY - 0.08, G + H - 0.005)],
                                [(CX - 0.004, CY - 0.1, G + H + 0.12), (CX + 0.004, CY - 0.1, G + H + 0.12), (CX + 0.004, CY - 0.08, G + H + 0.12), (CX - 0.004, CY - 0.08, G + H + 0.12)]], outline=0.004)
FY = CY - 0.1
cyl('rose', M['dark'], 0.06, 0.006, segs=20, outline=0, matrix=Matrix.Translation((CX, FY - 0.003, G + 0.25)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for j in range(7):
    x = CX - 0.15 + j * 0.05
    box(f'frontgallery{j}', M['dark'], x, FY - 0.003, G + 0.15, 0.03, 0.006, 0.05, outline=0, bevel=0)
# the porch carried on two crouching lions
box('porch', M['stone'], CX, FY - 0.06, G + 0.08, 0.12, 0.1, 0.1, outline=0.004, bevel=0)
loft('porchroof', M['stone'], [[(CX - 0.065, FY - 0.11, G + 0.175), (CX + 0.065, FY - 0.11, G + 0.175), (CX + 0.065, FY, G + 0.175), (CX - 0.065, FY, G + 0.175)],
                               [(CX - 0.004, FY - 0.11, G + 0.22), (CX + 0.004, FY - 0.11, G + 0.22), (CX + 0.004, FY, G + 0.22), (CX - 0.004, FY, G + 0.22)]], outline=0.003)
box('door', M['dark'], CX, FY - 0.003, G - 0.005, 0.06, 0.006, 0.12, outline=0, bevel=0)
for s in (-1, 1):
    rod(f'porchcol{s}', M['stone'], (CX + s * 0.05, FY - 0.1, G + 0.04), (CX + s * 0.05, FY - 0.1, G + 0.09), 0.01, segs=6, outline=0.001)
    lion = ball(f'lion{s}', M['stoneDark'], 0, 0, 0, 0.025, outline=0.003)
    lion.scale = (0.8, 1.4, 0.8)
    lion.location = (CX + s * 0.05, FY - 0.1, G + 0.02)
# the side wall's blind arcade gallery (seen on the left side)
for j in range(10):
    y = CY - 0.05 + j * 0.07
    box(f'sidegallery{j}', M['dark'], CX - W / 2 - 0.003, y, G + 0.18, 0.006, 0.04, 0.05, outline=0, bevel=0)
    box(f'sidearch{j}', M['stoneDark'], CX - W / 2 - 0.004, y, G + 0.05, 0.006, 0.05, 0.08, outline=0, bevel=0)
lathe('apse', M['stone'], ((0.13, 0), (0.13, 0.22)), G - 0.005, CX, CY + L - 0.1, segs=12, outline=0.005, smooth=False)

# ---------- the Ghirlandina ----------
GX, GY = CX + 0.38, CY + 0.35
box('ghirlandina', M['stone'], GX, GY, G - 0.005, 0.16, 0.16, 0.68, outline=0.008, bevel=0)
for k in range(5):
    box(f'ghirband{k}', M['stoneDark'], GX, GY, G + 0.12 + k * 0.12, 0.165, 0.165, 0.012, outline=0, bevel=0)
    if k >= 2:
        for j in (-1, 1):
            box(f'ghirwin{k}{j}', M['dark'], GX + j * 0.03, GY - 0.083, G + 0.14 + k * 0.12, 0.025, 0.006, 0.06, outline=0, bevel=0)
lathe('ghiroctagon', M['stone'], ((0.07, 0), (0.07, 0.1)), G + 0.675, GX, GY, segs=8, outline=0.004, smooth=False)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'ghirpinnacle{sx}{sy}', M['stoneDark'], ((0.016, 0), (0.003, 0.08)), G + 0.675, GX + sx * 0.07, GY + sy * 0.07, segs=6, outline=0.001, smooth=False)
lathe('ghirspire', M['stone'], ((0.072, 0), (0.003, 0.3)), G + 0.775, GX, GY, segs=8, outline=0.004, smooth=False)

# ---------- the town hall's arcade on the Piazza Grande ----------
TX, TY = 0.55, -0.45
box('townhall', M['ochre'], TX, TY, G - 0.005, 0.5, 0.2, 0.22, outline=0.006, bevel=0)
for j in range(6):
    x = TX - 0.2 + j * 0.08
    box(f'arcade{j}', M['dark'], x, TY - 0.103, G - 0.005, 0.05, 0.006, 0.09, outline=0, bevel=0)
    box(f'thwin{j}', M['dark'], x, TY - 0.103, G + 0.13, 0.03, 0.006, 0.05, outline=0, bevel=0)
loft('townhallroof', M['roof'], [[(TX - 0.25, TY - 0.1, G + 0.215), (TX + 0.25, TY - 0.1, G + 0.215), (TX + 0.25, TY + 0.1, G + 0.215), (TX - 0.25, TY + 0.1, G + 0.215)],
                                 [(TX - 0.25, TY - 0.004, G + 0.27), (TX + 0.25, TY - 0.004, G + 0.27), (TX + 0.25, TY + 0.004, G + 0.27), (TX - 0.25, TY + 0.004, G + 0.27)]], outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

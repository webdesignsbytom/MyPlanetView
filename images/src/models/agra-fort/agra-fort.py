# A cartoon Agra Fort for the country maps, built in the set's shared look (../toon.py): the great
# red sandstone walls with their battlements and round bastions, the Amar Singh Gate between its two
# towers crowned with chhatris, the moat in front, and the white marble palaces inside with their
# golden domes. Turned a little towards the camera.
# Run: blender -b --factory-startup -P agra-fort.py -- agra-fort-1024.png 1024 agra-fort.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#9ab860', shadow_mul=(0.74, 0.8, 0.74), lift=0.2),
    'sandstone': toon('sandstone', '#c0583a', shadow_mul=(0.86, 0.74, 0.72)),
    'sandstoneLight': toon('sandstoneLight', '#d0704a', shadow_mul=(0.86, 0.74, 0.72)),
    'marble': toon('marble', '#f8f6f0', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'moat': toon('moat', '#6a9a8a', lift=0.25),
    'door': flat('door', '#2e2420'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)


def chhatri(name, x, y, z, r, mat='sandstoneLight', dome='marble'):
    for j in range(4):
        a = math.pi / 4 + j * math.pi / 2
        rod(f'{name}col{j}', M[mat], (x + r * 0.7 * math.cos(a), y + r * 0.7 * math.sin(a), z), (x + r * 0.7 * math.cos(a), y + r * 0.7 * math.sin(a), z + r * 1.1), r * 0.12, segs=5, outline=0.002)
    lathe(f'{name}eave', M[mat], ((r * 1.05, 0), (r * 1.05, r * 0.15)), z + r * 1.1, x, y, segs=8, outline=0.003, smooth=False)
    lathe(f'{name}dome', M[dome], ((r * 0.9, 0), (r * 0.85, r * 0.45), (r * 0.45, r * 0.85), (0.004, r * 1.05)), z + r * 1.25, x, y, segs=12, outline=0.004)


# ---------- the moat ----------
box('moat', M['moat'], 0.0, -0.62, G - 0.004, 2.5, 0.18, 0.01, outline=0.004, bevel=0)
box('moatbridge', M['sandstone'], 0.0, -0.62, G - 0.003, 0.14, 0.22, 0.03, outline=0.004, bevel=0)

# ---------- the walls and bastions ----------
for k in range(7):
    x0 = -1.05 + k * 0.3
    if abs(x0 + 0.15) < 0.2:
        continue
    box(f'wall{k}', M['sandstone'], x0 + 0.15, -0.38, G - 0.005, 0.31, 0.12, 0.26, outline=0.008, bevel=0)
    for j in range(4):
        lathe(f'merlon{k}{j}', M['sandstoneLight'], ((0.018, 0), (0.018, 0.025), (0.004, 0.045)), G + 0.255, x0 + 0.04 + j * 0.075, -0.44, segs=6, outline=0.002)
for k, x in enumerate((-0.95, -0.55, 0.55, 0.95)):
    lathe(f'bastion{k}', M['sandstone'], ((0.1, 0), (0.09, 0.3)), G - 0.005, x, -0.36, segs=16, outline=0.008)
    chhatri(f'bastionchhatri{k}', x, -0.36, G + 0.295, 0.045)
for s in (-1, 1):
    box(f'sidewall{s}', M['sandstone'], s * 1.0, 0.15, G - 0.005, 0.1, 1.0, 0.24, outline=0.008, bevel=0)

# ---------- the Amar Singh Gate ----------
GX, GY = 0.0, -0.4
box('gate', M['sandstoneLight'], GX, GY, G - 0.005, 0.3, 0.16, 0.36, outline=0.009, bevel=0)
box('gatearch', M['door'], GX, GY - 0.082, G - 0.005, 0.11, 0.006, 0.2, outline=0, bevel=0)
lathe('gatearchtop', M['door'], ((0.055, 0), (0.004, 0.06)), G + 0.19, GX, GY - 0.082, segs=4, outline=0, smooth=False)
for s in (-1, 1):
    lathe(f'gatetower{s}', M['sandstone'], ((0.08, 0), (0.075, 0.42)), G - 0.005, GX + s * 0.19, GY, segs=8, outline=0.008, smooth=False)
    for j in range(3):
        box(f'gatetile{s}{j}', M['marble'], GX + s * 0.19, GY - 0.078, G + 0.08 + j * 0.11, 0.06, 0.006, 0.02, outline=0, bevel=0)
    chhatri(f'gatechhatri{s}', GX + s * 0.19, GY, G + 0.415, 0.06)
chhatri('gatemiddle', GX, GY, G + 0.355, 0.05)

# ---------- the white palaces inside ----------
box('khasmahal', M['marble'], -0.15, 0.4, G - 0.005, 0.5, 0.22, 0.2, outline=0.008, bevel=0)
for j in range(5):
    box(f'khasarch{j}', M['door'], -0.35 + j * 0.1, 0.288, G + 0.03, 0.05, 0.006, 0.1, outline=0, bevel=0)
for s in (-1, 1):
    chhatri(f'palacepavilion{s}', -0.15 + s * 0.2, 0.4, G + 0.195, 0.06, mat='marble', dome='gold')
lathe('palacedome', M['marble'], ((0.09, 0), (0.085, 0.05), (0.05, 0.1), (0.004, 0.13)), G + 0.195, -0.15, 0.4, segs=16, outline=0.006)
box('jahangirimahal', M['sandstoneLight'], 0.5, 0.45, G - 0.005, 0.34, 0.26, 0.22, outline=0.008, bevel=0)
for s in (-1, 1):
    chhatri(f'jahangirichhatri{s}', 0.5 + s * 0.13, 0.36, G + 0.215, 0.04)
for k, (x, y) in enumerate(((-0.75, 0.6), (0.8, -0.0), (-0.7, 0.05))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.1, 0.09, outline=0.008)

turn(before, -20)
render(G)

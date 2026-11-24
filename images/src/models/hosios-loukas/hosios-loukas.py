# A cartoon Hosios Loukas for the country maps, built in the set's shared look (../toon.py): the
# Byzantine monastery on the slopes of Mount Helicon, its two churches joined side by side with walls
# of stone banded with rows of red brick (cloisonné), the big dome of the Katholikon and the smaller
# one of the Theotokos church, their red-tiled roofs, the bell tower and the monks' cells round the
# court, with cypresses and the green valley falling away in front. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P hosios-loukas.py -- hosios-loukas-1024.png 1024 hosios-loukas.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'hill': toon('hill', '#8aa860', shadow_mul=(0.74, 0.8, 0.76)),
    'court': toon('court', '#d8ccb4', lift=0.15),
    'stone': toon('stone', '#d8c4a0', shadow_mul=(0.86, 0.82, 0.8), lift=0.12),
    'brick': toon('brick', '#c4603e', lift=0.08),
    'roof': toon('roof', '#c4603e'),
    'dark': flat('dark', '#2e2622'),
    'white': toon('white', '#f0ece2', lift=0.15),
    'cypress': toon('cypress', '#2f5a34', shadow_mul=(0.7, 0.78, 0.8)),
    'mountain': toon('mountain', '#8a9a7a', shadow_mul=(0.8, 0.84, 0.86)),
})

G = tile(M['hill'])
before = set(bpy.data.objects)

# ---------- Mount Helicon's slope behind ----------
for k, (x, y, r, h) in enumerate(((-0.45, 0.85, 0.38, 0.42), (0.4, 0.9, 0.36, 0.34))):
    mt = lathe(f'mountain{k}', M['mountain'], ((r, 0), (r * 0.7, h * 0.6), (r * 0.3, h * 0.92), (0.004, h)), G - 0.01, x, y, segs=16, outline=0.008)
    mt.visible_shadow = False
box('court', M['court'], 0, 0.05, G - 0.004, 1.2, 0.9, 0.01, outline=0.002, bevel=0)


def banded(name, x, y, w, d, h):
    """A wall block of stone banded with courses of brick."""
    box(name, M['stone'], x, y, G - 0.005, w, d, h, outline=0.007, bevel=0)
    for k in range(int(h / 0.05)):
        z = G + 0.03 + k * 0.05
        box(f'{name}band{k}', M['brick'], x, y - d / 2 - 0.003, z, w, 0.006, 0.01, outline=0, bevel=0)
        box(f'{name}bandside{k}', M['brick'], x - w / 2 - 0.003, y, z, 0.006, d, 0.01, outline=0, bevel=0)


def dome(name, x, y, z, r, drum_h):
    lathe(f'{name}drum', M['stone'], ((r, 0), (r, drum_h)), z, x, y, segs=8, outline=0.004, smooth=False)
    for k in range(8):
        a = 2 * math.pi * (k + 0.5) / 8
        box(f'{name}drumwin{k}', M['dark'], x + (r * 0.93 + 0.003) * math.cos(a), y + (r * 0.93 + 0.003) * math.sin(a), z + drum_h * 0.3, 0.004, r * 0.35, drum_h * 0.5, rot_z=a, outline=0, bevel=0)
    lathe(f'{name}dome', M['roof'], ((r + 0.01, 0), (r * 0.9, r * 0.35), (r * 0.5, r * 0.7), (0.004, r * 0.82)), z + drum_h, x, y, segs=16, outline=0.004)
    rod(f'{name}cross', M['white'], (x, y, z + drum_h + r * 0.82), (x, y, z + drum_h + r * 0.82 + 0.05), 0.004, segs=4, outline=0)


# ---------- the Katholikon (the bigger church, on the left) ----------
KX, KY = -0.15, 0.2
banded('katholikon', KX, KY, 0.44, 0.44, 0.3)
loft('katholikonroof', M['roof'], [[(KX - 0.23, KY - 0.23, G + 0.295), (KX + 0.23, KY - 0.23, G + 0.295), (KX + 0.23, KY + 0.23, G + 0.295), (KX - 0.23, KY + 0.23, G + 0.295)],
                                   [(KX - 0.15, KY - 0.15, G + 0.33), (KX + 0.15, KY - 0.15, G + 0.33), (KX + 0.15, KY + 0.15, G + 0.33), (KX - 0.15, KY + 0.15, G + 0.33)]], outline=0.004)
dome('katholikon', KX, KY, G + 0.325, 0.13, 0.1)
for j in range(3):
    box(f'katholikonwin{j}', M['dark'], KX - 0.1 + j * 0.1, KY - 0.223, G + 0.16, 0.035, 0.006, 0.08, outline=0, bevel=0)
box('narthexdoor', M['dark'], KX, KY - 0.223, G - 0.005, 0.06, 0.006, 0.11, outline=0, bevel=0)

# ---------- the church of the Theotokos (the smaller, joined on the right) ----------
TX, TY = 0.2, 0.25
banded('theotokos', TX, TY, 0.26, 0.34, 0.24)
loft('theotokosroof', M['roof'], [[(TX - 0.14, TY - 0.18, G + 0.235), (TX + 0.14, TY - 0.18, G + 0.235), (TX + 0.14, TY + 0.18, G + 0.235), (TX - 0.14, TY + 0.18, G + 0.235)],
                                  [(TX - 0.08, TY - 0.1, G + 0.27), (TX + 0.08, TY - 0.1, G + 0.27), (TX + 0.08, TY + 0.1, G + 0.27), (TX - 0.08, TY + 0.1, G + 0.27)]], outline=0.004)
dome('theotokos', TX, TY, G + 0.265, 0.08, 0.1)

# ---------- the bell tower and the monks' cells round the court ----------
box('belltower', M['stone'], 0.5, -0.05, G - 0.005, 0.1, 0.1, 0.38, outline=0.005, bevel=0)
box('belfry', M['dark'], 0.5, -0.103, G + 0.28, 0.04, 0.006, 0.06, outline=0, bevel=0)
lathe('belltowercap', M['roof'], ((0.065, 0), (0.003, 0.08)), G + 0.375, 0.5, -0.05, segs=4, outline=0.002, smooth=False)
for k, (x, y, w, d) in enumerate(((-0.6, 0.0, 0.14, 0.7), (0.62, 0.35, 0.14, 0.5), (0.0, 0.62, 0.9, 0.14))):
    box(f'cells{k}', M['white'], x, y, G - 0.005, w, d, 0.13, outline=0.005, bevel=0)
    box(f'cellsroof{k}', M['roof'], x, y, G + 0.125, w + 0.02, d + 0.02, 0.025, outline=0.002, bevel=0)

# ---------- cypresses on the slope in front ----------
for k, (x, y) in enumerate(((-0.45, -0.55), (-0.2, -0.7), (0.3, -0.6), (0.6, -0.45), (-0.75, -0.4), (0.85, 0.0))):
    lathe(f'cypress{k}', M['cypress'], ((0.04, 0), (0.05, 0.06), (0.035, 0.2), (0.004, 0.32)), G - 0.005, x, y, segs=10, outline=0.006)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

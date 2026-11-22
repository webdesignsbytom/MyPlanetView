# A cartoon Tallinn Old Town for the country maps, built in the set's shared look (../toon.py): the
# medieval wall round the front with its round towers under red cone roofs, the gabled merchants'
# houses in their pastels inside, the Town Hall with its slender spire, Saint Olaf's tall green
# spire, and Toompea hill behind with its walls and Tall Hermann flying the Estonian flag.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P tallinn.py -- tallinn-1024.png 1024 tallinn.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'cobble': toon('cobble', '#d3cab8', lift=0.25),
    'wall': toon('wall', '#cfc8b8', shadow_mul=(0.8, 0.8, 0.88)),
    'redroof': toon('redroof', '#c4503a'),
    'copper': toon('copper', '#6f9a8a', shadow_mul=(0.72, 0.82, 0.84)),
    'slate': toon('slate', '#4f5560', shadow_mul=(0.75, 0.75, 0.85)),
    'window': flat('window', '#33303d'),
    'yellow': toon('hyellow', '#f2d27a', shadow_mul=(0.84, 0.74, 0.62)),
    'pink': toon('hpink', '#eeb3a8', shadow_mul=(0.84, 0.74, 0.8)),
    'mint': toon('hmint', '#b8dcc4', shadow_mul=(0.74, 0.82, 0.82)),
    'ochre': toon('hochre', '#d9a55a', shadow_mul=(0.84, 0.74, 0.62)),
    'white': toon('hwhite', '#f3efe6', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'blue': toon('hblue', '#a8c4e0', shadow_mul=(0.74, 0.76, 0.86)),
    'hill': toon('hill', '#6faa55', shadow_mul=(0.7, 0.78, 0.8)),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'flagBlue': flat('flagBlue', '#0072ce'),
    'flagBlack': flat('flagBlack', '#222222'),
    'flagWhite': flat('flagWhite', '#ffffff'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(179)


def ridge_roof(name, mat, x, y, z, w, d, h):
    loft(name, M[mat], [[(x - w / 2, y - d / 2, z), (x + w / 2, y - d / 2, z), (x + w / 2, y + d / 2, z), (x - w / 2, y + d / 2, z)],
                        [(x - 0.004, y - d / 2 + 0.004, z + h), (x + 0.004, y - d / 2 + 0.004, z + h), (x + 0.004, y + d / 2 - 0.004, z + h),
                         (x - 0.004, y + d / 2 - 0.004, z + h)]], outline=0.014)


# ---------- the cobbled town inside the wall ----------
cyl('town', M['cobble'], 1.0, 0.01, segs=40, outline=0.01, matrix=Matrix.Translation((0, 0.02, G + 0.003)) @ Matrix.Scale(0.82, 4, (0, 1, 0)))

# ---------- Toompea hill behind, its walls and Tall Hermann with the flag ----------
hill = loft('toompea', M['hill'], [[(0.45 + 0.5 * math.cos(t), 0.9 + 0.3 * math.sin(t), G - 0.01) for t in (2 * math.pi * k / 20 for k in range(20))],
                                   [(0.45 + 0.38 * math.cos(t), 0.92 + 0.2 * math.sin(t), G + 0.3) for t in (2 * math.pi * k / 20 for k in range(20))]],
            outline=0.03)
hill.visible_shadow = False
box('castlewall', M['wall'], 0.42, 0.93, G + 0.29, 0.56, 0.18, 0.12, outline=0.02, bevel=0)
ridge_roof('castleroof', 'redroof', 0.42, 0.93, G + 0.41, 0.56, 0.18, 0.08)
HX, HY = 0.72, 0.86
box('hermann', M['wall'], HX, HY, G + 0.29, 0.12, 0.12, 0.42, outline=0.02, bevel=0)
box('hermanntop', M['wall'], HX, HY, G + 0.71, 0.14, 0.14, 0.04, outline=0.014, bevel=0)
rod('flagpole', M['flagWhite'], (HX, HY, G + 0.75), (HX, HY, G + 0.98), 0.006, segs=6, outline=0.003)
for k, mat in enumerate(('flagBlue', 'flagBlack', 'flagWhite')):
    box(f'flag{k}', M[mat], HX + 0.065, HY, G + 0.94 - k * 0.03, 0.12, 0.006, 0.03, outline=0, bevel=0)

# ---------- Saint Olaf's church and its tall spire ----------
OX, OY = -0.55, 0.45
box('olafnave', M['wall'], OX + 0.18, OY, G - 0.005, 0.32, 0.16, 0.22, outline=0.02, bevel=0)
ridge_roof('olafroof', 'slate', OX + 0.18, OY, G + 0.215, 0.34, 0.18, 0.12)
box('olaftower', M['wall'], OX, OY, G - 0.005, 0.15, 0.15, 0.55, outline=0.022, bevel=0)
for k, z in enumerate((0.3, 0.45)):
    box(f'olafwin{k}', M['window'], OX, OY - 0.078, G + z, 0.035, 0.01, 0.07, outline=0, bevel=0)
lathe('olafspire', M['copper'], ((0.085, 0), (0.06, 0.08), (0.05, 0.12), (0.03, 0.14), (0.004, 0.72)), G + 0.54, OX, OY, segs=8, outline=0.016,
      smooth=False)

# ---------- the Town Hall and its slender spire ----------
TX, TY = 0.05, 0.12
box('townhall', M['wall'], TX, TY, G - 0.005, 0.42, 0.16, 0.24, outline=0.02, bevel=0)
ridge_roof('townhallroof', 'slate', TX, TY, G + 0.235, 0.44, 0.18, 0.13)
for k in range(5):
    box(f'arcade{k}', M['window'], TX - 0.16 + k * 0.08, TY - 0.082, G, 0.045, 0.01, 0.08, outline=0, bevel=0)
    box(f'thwin{k}', M['window'], TX - 0.16 + k * 0.08, TY - 0.082, G + 0.13, 0.03, 0.01, 0.06, outline=0, bevel=0)
SX = TX + 0.14
box('thtower', M['wall'], SX, TY, G + 0.2, 0.08, 0.08, 0.2, outline=0.014, bevel=0)
lathe('thspire', M['slate'], ((0.045, 0), (0.035, 0.06), (0.05, 0.1), (0.022, 0.16), (0.03, 0.2), (0.004, 0.42)), G + 0.4, SX, TY, segs=8, outline=0.012,
      smooth=False)
rod('oldthomas', M['gold'], (SX, TY, G + 0.82), (SX, TY, G + 0.88), 0.006, segs=6, outline=0)

# ---------- merchants' houses in pastels ----------
COLOURS = ('yellow', 'pink', 'mint', 'ochre', 'white', 'blue')
HOUSES = [(-0.62, 0.05), (-0.45, 0.02), (-0.3, -0.05), (0.38, -0.02), (0.55, 0.05), (0.72, 0.15), (-0.2, 0.32), (0.3, 0.42), (-0.12, -0.3),
          (0.22, -0.32)]
for k, (x, y) in enumerate(HOUSES):
    w, h = rng.uniform(0.12, 0.16), rng.uniform(0.18, 0.26)
    box(f'house{k}', M[COLOURS[k % 6]], x, y, G - 0.005, w, 0.14, h, outline=0.016, bevel=0)
    ridge_roof(f'houseroof{k}', 'redroof', x, y, G + h - 0.005, w + 0.02, 0.16, 0.13)
    for r in range(2):
        box(f'housewin{k}{r}', M['window'], x, y - 0.072, G + 0.05 + r * (h - 0.1), 0.03, 0.01, 0.045, outline=0, bevel=0)

# ---------- the town wall round the front, its round towers under red cones ----------
TOWERS = [math.radians(a) for a in (185, 210, 240, 270, 300, 330, 355)]
RW = 0.98


def on_wall(a):
    return RW * math.cos(a), 0.02 + RW * 0.82 * math.sin(a)


for k, (a0, a1) in enumerate(zip(TOWERS, TOWERS[1:])):
    (x0, y0), (x1, y1) = on_wall(a0), on_wall(a1)
    box(f'wall{k}', M['wall'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.005, math.hypot(x1 - x0, y1 - y0), 0.05, 0.2,
        rot_z=math.atan2(y1 - y0, x1 - x0), outline=0.016, bevel=0)
    box(f'wallwalk{k}', M['redroof'], (x0 + x1) / 2, (y0 + y1) / 2, G + 0.195, math.hypot(x1 - x0, y1 - y0), 0.07, 0.025,
                rot_z=math.atan2(y1 - y0, x1 - x0), outline=0.01, bevel=0)
for k, a in enumerate(TOWERS):
    x, y = on_wall(a)
    r = 0.09 if k in (0, 6) else 0.075
    lathe(f'tower{k}', M['wall'], ((r, 0), (r, 0.34)), G - 0.005, x, y, segs=18, outline=0.018)
    lathe(f'towerroof{k}', M['redroof'], ((r + 0.02, 0), (0.004, 0.26)), G + 0.335, x, y, segs=18, outline=0.016)
    box(f'towerslit{k}', M['window'], x + (r + 0.002) * math.cos(a), y + (r + 0.002) * math.sin(a), G + 0.2, 0.02, 0.02, 0.05, rot_z=a, outline=0,
        bevel=0)

# ---------- trees outside the wall ----------
for k, (x, y) in enumerate(((-1.15, 0.5), (1.15, 0.45), (-0.95, 0.9), (1.0, -0.75))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.13, 0.12, outline=0.02)

turn(before, -20)
render(G)

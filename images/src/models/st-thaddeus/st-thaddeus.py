# A cartoon Monastery of St Thaddeus for the country maps, built in the set's shared look (../toon.py):
# the Black Church, Qara Kelisa, in the hills of north-western Iran, the old eastern church of dark
# stone with its tall drum and pointed cone and the larger western church of pale stone with its own
# drum striped in black and white, inside the monastery's fortified wall with its round corner
# towers, the bare hills round it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P st-thaddeus.py -- st-thaddeus-1024.png 1024 st-thaddeus.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#c8b88a', shadow_mul=(0.8, 0.8, 0.84), lift=0.18),
    'hill': toon('hill', '#b8a878', shadow_mul=(0.78, 0.78, 0.82)),
    'court': toon('court', '#d8ccae', lift=0.15),
    'black': toon('black', '#4a4648', shadow_mul=(0.8, 0.8, 0.86)),
    'white': toon('white', '#ece6d8', shadow_mul=(0.82, 0.84, 0.9), lift=0.2),
    'wall': toon('wall', '#a8906a', shadow_mul=(0.8, 0.78, 0.82)),
    'dark': flat('dark', '#2e2a2a'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)

# ---------- the bare hills behind ----------
for k, (x, y, r, h) in enumerate(((-0.55, 0.85, 0.45, 0.22), (0.35, 0.92, 0.38, 0.28))):
    hl = lathe(f'hill{k}', M['hill'], ((r, 0), (r * 0.7, h * 0.6), (r * 0.3, h * 0.95), (0.0, h)), G - 0.01, x, y, segs=28, outline=0.006)
    hl.visible_shadow = False

# ---------- the fortified wall and its round towers ----------
C = [(-0.62, -0.5), (0.62, -0.5), (0.62, 0.42), (-0.62, 0.42)]
loft('court', M['court'], [[(x, y, G - 0.004) for x, y in C], [(x, y, G + 0.006) for x, y in C]], outline=0.001)
for k in range(4):
    (x0, y0), (x1, y1) = C[k], C[(k + 1) % 4]
    d = math.hypot(x1 - x0, y1 - y0)
    box(f'wall{k}', M['wall'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.005, 0.04, d, 0.12, rot_z=math.atan2(-(x1 - x0), y1 - y0), outline=0.004, bevel=0)
for k, (x, y) in enumerate(C):
    lathe(f'tower{k}', M['wall'], ((0.07, 0), (0.07, 0.17)), G - 0.005, x, y, segs=14, outline=0.004)
box('gate', M['wall'], 0.0, -0.5, G - 0.005, 0.14, 0.08, 0.17, outline=0.004, bevel=0)
box('gatedoor', M['dark'], 0.0, -0.543, G - 0.005, 0.05, 0.006, 0.09, outline=0, bevel=0)
cyl('gatearch', M['dark'], 0.025, 0.006, segs=10, outline=0, matrix=Matrix.Translation((0.0, -0.543, G + 0.085)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))


def gable(name, mat, cx, cy, z0, hx, hy, z1):
    loft(name, mat, [[(cx - hx, cy - hy, z0), (cx + hx, cy - hy, z0), (cx + hx, cy + hy, z0), (cx - hx, cy + hy, z0)],
                     [(cx - hx, cy - 0.004, z1), (cx + hx, cy - 0.004, z1), (cx + hx, cy + 0.004, z1), (cx - hx, cy + 0.004, z1)]], outline=0.004)


# ---------- the western church in pale stone ----------
WX, CY = -0.15, 0.0
box('westchurch', M['white'], WX, CY, G - 0.005, 0.38, 0.28, 0.24, outline=0.007, bevel=0)
box('westdoor', M['dark'], WX, CY - 0.143, G - 0.005, 0.05, 0.006, 0.1, outline=0, bevel=0)
for s in (-1, 1):
    box(f'westwin{s}', M['dark'], WX + s * 0.11, CY - 0.143, G + 0.13, 0.02, 0.006, 0.06, outline=0, bevel=0)
gable('westroof', M['white'], WX, CY, G + 0.235, 0.19, 0.15, G + 0.32)
lathe('westdrum', M['white'], ((0.08, 0), (0.08, 0.14)), G + 0.28, WX, CY, segs=12, outline=0.004, smooth=False)
for k in range(4):
    lathe(f'westdrumstripe{k}', M['black'], ((0.083, 0), (0.083, 0.015)), G + 0.3 + k * 0.03, WX, CY, segs=12, outline=0.001, smooth=False)
lathe('westcone', M['white'], ((0.095, 0), (0.003, 0.18)), G + 0.415, WX, CY, segs=12, outline=0.004, smooth=False)

# ---------- the old eastern church in dark stone ----------
EX = 0.18
box('eastchurch', M['black'], EX, CY, G - 0.005, 0.26, 0.24, 0.22, outline=0.006, bevel=0)
for k in range(3):
    box(f'eaststripe{k}', M['white'], EX, CY, G + 0.04 + k * 0.06, 0.264, 0.244, 0.012, outline=0.001, bevel=0)
gable('eastroof', M['black'], EX, CY, G + 0.215, 0.13, 0.125, G + 0.29)
lathe('eastdrum', M['black'], ((0.065, 0), (0.065, 0.2)), G + 0.25, EX, CY, segs=12, outline=0.004, smooth=False)
for k in range(12):
    a = 2 * math.pi * k / 12
    if math.sin(a) < -0.3:
        box(f'eastdrumwin{k}', M['dark'], EX + 0.064 * math.cos(a), CY + 0.064 * math.sin(a), G + 0.37, 0.012, 0.006, 0.04, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('eastcone', M['black'], ((0.078, 0), (0.003, 0.2)), G + 0.445, EX, CY, segs=12, outline=0.004, smooth=False)
box('apse', M['black'], EX + 0.16, CY, G - 0.005, 0.06, 0.14, 0.18, outline=0.004, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

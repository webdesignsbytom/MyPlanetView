# A cartoon Xochicalco for the country maps, built in the set's shared look (../toon.py): the
# hilltop city in Morelos, Mexico, its Pyramid of the Feathered Serpent, a low platform whose
# sloping walls are carved all round with great plumed serpents and seated lords, the stair
# up its front and the remains of the temple on top, the ball court and the terraces down the
# hill. Turned a little towards the camera.
# Run: blender -b --factory-startup -P xochicalco.py -- xochicalco-1024.png 1024 xochicalco.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#a4bc66', shadow_mul=(0.72, 0.78, 0.8), lift=0.2),
    'hill': toon('hill', '#94ac5c', shadow_mul=(0.72, 0.78, 0.8)),
    'stone': toon('stone', '#c8b498', shadow_mul=(0.8, 0.78, 0.84), lift=0.15),
    'carve': toon('carve', '#9a8668'),
    'paving': toon('paving', '#ddd0b4', lift=0.18),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#6a9040', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


# ---------- the hilltop terraces ----------
for k, (r, h) in enumerate(((1.15, 0.05), (0.95, 0.1))):
    t = lathe(f'terrace{k}', M['hill'], ((r, 0), (r - 0.04, h)), G - 0.01, 0.0, 0.0, segs=40, outline=0.004, smooth=False)
    t.visible_shadow = False
TZ = G + 0.09
box('plaza', M['paving'], 0.0, 0.0, TZ - 0.004, 1.2, 0.9, 0.008, outline=0.001, bevel=0)

# ---------- the Pyramid of the Feathered Serpent ----------
PX, PY = 0.0, 0.15
W, D = 0.56, 0.5
loft('talud', M['stone'], [[(PX - W / 2, PY - D / 2, TZ - 0.005), (PX + W / 2, PY - D / 2, TZ - 0.005), (PX + W / 2, PY + D / 2, TZ - 0.005), (PX - W / 2, PY + D / 2, TZ - 0.005)],
                           [(PX - W / 2 + 0.04, PY - D / 2 + 0.04, TZ + 0.14), (PX + W / 2 - 0.04, PY - D / 2 + 0.04, TZ + 0.14), (PX + W / 2 - 0.04, PY + D / 2 - 0.04, TZ + 0.14), (PX - W / 2 + 0.04, PY + D / 2 - 0.04, TZ + 0.14)]], outline=0.006)
# the serpents' wavy bodies along the front slope
for k in range(16):
    t = k / 15
    x = PX - W / 2 + 0.06 + (W - 0.12) * t
    z = TZ + 0.05 + 0.03 * math.sin(t * 4 * math.pi)
    y = PY - D / 2 + 0.04 * (z - TZ + 0.005) / 0.145 - 0.004
    ball(f'serpent{k}', M['carve'], x, y, z, 0.018, outline=0.001)
for k in range(3):
    x = PX - 0.18 + k * 0.18
    box(f'lord{k}', M['carve'], x, PY - D / 2 + 0.025, TZ + 0.09, 0.04, 0.006, 0.04, rot_z=0.0, outline=0, bevel=0)
box('tablero', M['stone'], PX, PY, TZ + 0.135, W - 0.06, D - 0.06, 0.06, outline=0.004, bevel=0)
box('cornice', M['carve'], PX, PY, TZ + 0.19, W - 0.04, D - 0.04, 0.02, outline=0.002, bevel=0)
for k in range(10):
    box(f'stair{k}', M['stone'], PX, PY - D / 2 - 0.06 + k * 0.012, TZ - 0.005, 0.14, 0.03, 0.02 * (k + 1), outline=0.001, bevel=0)
# the temple walls on top
for k, (x, y, sx, sy) in enumerate(((PX, PY + 0.12, 0.3, 0.03), (PX - 0.15, PY, 0.03, 0.27), (PX + 0.15, PY, 0.03, 0.27))):
    box(f'templewall{k}', M['stone'], x, y, TZ + 0.205, sx, sy, 0.06, outline=0.002, bevel=0)

# ---------- the ball court ----------
BX, BY = -0.55, -0.35
for s in (-1, 1):
    y0, y1 = (BY + 0.08, BY + 0.16) if s > 0 else (BY - 0.16, BY - 0.08)
    t0, t1 = (BY + 0.11, BY + 0.16) if s > 0 else (BY - 0.16, BY - 0.11)
    loft(f'courtwall{s}', M['stone'], [[(BX - 0.07, y0, TZ - 0.005), (BX + 0.07, y0, TZ - 0.005), (BX + 0.07, y1, TZ - 0.005), (BX - 0.07, y1, TZ - 0.005)],
                                       [(BX - 0.07, t0, TZ + 0.07), (BX + 0.07, t0, TZ + 0.07), (BX + 0.07, t1, TZ + 0.07), (BX - 0.07, t1, TZ + 0.07)]], outline=0.003)
    cyl(f'ring{s}', M['stone'], 0.02, 0.012, segs=12, outline=0.001, matrix=Matrix.Translation((BX, BY + s * 0.095, TZ + 0.06)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))

for k in range(9):
    a = 2 * math.pi * k / 9 + 0.3
    tree(f'tree{k}', 1.24 * math.cos(a), 1.2 * math.sin(a), r=0.08, h=0.1)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

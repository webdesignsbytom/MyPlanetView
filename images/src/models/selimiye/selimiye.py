# A cartoon Selimiye Mosque for the country maps, built in the set's shared look (../toon.py):
# Sinan's masterpiece in Edirne, its single great lead dome on an octagon of buttress turrets, the
# four very slender pencil minarets with their three balconies and pointed lead caps at the hall's
# corners, and the arcaded courtyard in front with its little domes and fountain. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P selimiye.py -- selimiye-1024.png 1024 selimiye.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8d0c0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'lawn': toon('lawn', '#7cb85a'),
    'stone': toon('stone', '#e8dcc0', shadow_mul=(0.86, 0.84, 0.82), lift=0.12),
    'stoneDark': toon('stoneDark', '#c8b898'),
    'lead': toon('lead', '#8a96a0', shadow_mul=(0.84, 0.86, 0.92), lift=0.1),
    'gold': toon('gold', '#f0c030', lift=0.3),
    'window': flat('window', '#3a4050'),
    'water': toon('water', '#5aa8d0', lift=0.3),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

for s in (-1, 1):
    box(f'lawn{s}', M['lawn'], s * 0.75, -0.2, G - 0.003, 0.35, 0.8, 0.008, outline=0.002, bevel=0)

# ---------- the prayer hall and its dome ----------
HX, HY = 0.0, 0.28
box('hall', M['stone'], HX, HY, G - 0.005, 0.62, 0.56, 0.2, outline=0.009, bevel=0)
for r in range(2):
    for j in range(6):
        box(f'hallwin{r}{j}', M['window'], HX - 0.25 + j * 0.1, HY - 0.282, G + 0.04 + r * 0.08, 0.03, 0.006, 0.045, outline=0, bevel=0)
lathe('drum', M['stone'], ((0.3, 0), (0.3, 0.08)), G + 0.195, HX, HY, segs=8, outline=0.007, smooth=False)
for k in range(8):
    a = 2 * math.pi * k / 8
    tx, ty = HX + 0.3 * math.cos(a), HY + 0.3 * math.sin(a)
    lathe(f'turret{k}', M['stone'], ((0.04, 0), (0.035, 0.14)), G + 0.195, tx, ty, segs=8, outline=0.003, smooth=False)
    lathe(f'turretcap{k}', M['lead'], ((0.04, 0), (0.025, 0.025), (0.004, 0.05)), G + 0.33, tx, ty, segs=12, outline=0.002)
for k in range(16):
    a = 2 * math.pi * (k + 0.5) / 16
    box(f'drumwin{k}', M['window'], HX + 0.282 * math.cos(a), HY + 0.282 * math.sin(a), G + 0.215, 0.025, 0.006, 0.04, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('dome', M['lead'], ((0.29, 0), (0.27, 0.08), (0.2, 0.17), (0.1, 0.22), (0.004, 0.24)), G + 0.27, HX, HY, segs=32, outline=0.008)
rod('domefinial', M['gold'], (HX, HY, G + 0.5), (HX, HY, G + 0.58), 0.009, segs=6, outline=0.001)
ball('domefinialball', M['gold'], HX, HY, G + 0.535, 0.015, outline=0.001)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'halfdome{sx}{sy}', M['lead'], ((0.08, 0), (0.06, 0.04), (0.004, 0.07)), G + 0.195, HX + sx * 0.2, HY + sy * 0.18, segs=16, outline=0.004)

# ---------- the four pencil minarets ----------
for sx in (-1, 1):
    for sy in (-1, 1):
        mx, my = HX + sx * 0.32, HY + sy * 0.29
        lathe(f'minaret{sx}{sy}', M['stone'], ((0.034, 0), (0.03, 0.78)), G - 0.005, mx, my, segs=12, outline=0.004)
        for z in (0.44, 0.59, 0.72):
            lathe(f'balcony{sx}{sy}{z}', M['stoneDark'], ((0.03, 0), (0.05, 0.02), (0.05, 0.03)), G + z, mx, my, segs=12, outline=0.002)
        lathe(f'minaretcap{sx}{sy}', M['lead'], ((0.033, 0), (0.004, 0.15)), G + 0.77, mx, my, segs=12, outline=0.003)
        rod(f'minaretfinial{sx}{sy}', M['gold'], (mx, my, G + 0.91), (mx, my, G + 0.95), 0.005, segs=6, outline=0)

# ---------- the courtyard ----------
CY = -0.3
for name, (x, y, sx, sy) in {'front': (0.0, CY - 0.24, 0.62, 0.08), 'left': (-0.27, CY, 0.08, 0.48), 'right': (0.27, CY, 0.08, 0.48)}.items():
    box(f'arcade{name}', M['stone'], x, y, G - 0.005, sx, sy, 0.1, outline=0.005, bevel=0)
for j in range(5):
    x = -0.22 + j * 0.11
    lathe(f'frontdome{j}', M['lead'], ((0.04, 0), (0.03, 0.025), (0.004, 0.045)), G + 0.095, x, CY - 0.24, segs=12, outline=0.002)
    box(f'frontarch{j}', M['window'], x, CY - 0.198, G - 0.005, 0.045, 0.006, 0.07, outline=0, bevel=0)
for j in range(4):
    y = CY - 0.15 + j * 0.1
    for s in (-1, 1):
        lathe(f'sidedome{s}{j}', M['lead'], ((0.04, 0), (0.03, 0.025), (0.004, 0.045)), G + 0.095, s * 0.27, y, segs=12, outline=0.002)
box('gate', M['stone'], 0.0, CY - 0.26, G - 0.005, 0.16, 0.1, 0.16, outline=0.004, bevel=0)
box('gatearch', M['window'], 0.0, CY - 0.312, G - 0.005, 0.06, 0.006, 0.11, outline=0, bevel=0)
lathe('fountain', M['stoneDark'], ((0.07, 0), (0.07, 0.04)), G - 0.005, 0.0, CY, segs=8, outline=0.003, smooth=False)
lathe('fountainwater', M['water'], ((0.06, 0), (0.06, 0.044)), G - 0.005, 0.0, CY, segs=8, outline=0, smooth=False)
lathe('fountainroof', M['lead'], ((0.08, 0), (0.05, 0.04), (0.004, 0.07)), G + 0.1, 0.0, CY, segs=16, outline=0.003)
for sx in (-1, 1):
    for sy in (-1, 1):
        rod(f'fountainpost{sx}{sy}', M['stone'], (sx * 0.06, CY + sy * 0.06, G + 0.035), (sx * 0.06, CY + sy * 0.06, G + 0.1), 0.007, segs=6, outline=0)

turn(before, -20)
render(G)

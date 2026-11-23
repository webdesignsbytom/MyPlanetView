# A cartoon Lahore Fort for the country maps, built in the set's shared look (../toon.py): the
# Alamgiri Gate, its great arch between two massive rounded bastions of red sandstone topped with
# white marble domed pavilions, the fort walls either side, the lawns of the Hazuri Bagh in front,
# and the Badshahi Mosque's white domes and red minarets beyond. Turned a little towards the camera.
# Run: blender -b --factory-startup -P lahore-fort.py -- lahore-fort-1024.png 1024 lahore-fort.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'red': toon('redSandstone', '#b8604a', shadow_mul=(0.86, 0.76, 0.72)),
    'redDark': toon('redSandstoneDark', '#9a4a36', shadow_mul=(0.86, 0.76, 0.72)),
    'marble': toon('marble', '#f6f3ea', lift=0.2),
    'window': flat('window', '#2e2a28'),
    'path': toon('path2', '#d9c9a8', lift=0.25),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)


def chhatri(name, x, y, z, r):
    for k in range(6):
        a = 2 * math.pi * k / 6
        rod(f'{name}post{k}', M['marble'], (x + r * 0.8 * math.cos(a), y + r * 0.8 * math.sin(a), z), (x + r * 0.8 * math.cos(a), y + r * 0.8 * math.sin(a), z + r * 0.9), 0.007,
            segs=5, outline=0.002)
    lathe(f'{name}dome', M['marble'], ((r, 0), (r * 0.9, r * 0.4), (r * 0.5, r * 0.9), (0.004, r * 1.3)), z + r * 0.9, x, y, segs=12, outline=0.005)


# ---------- the Badshahi Mosque beyond ----------
BX, BY = 0.2, 0.95
box('badshahi', M['red'], BX, BY, G - 0.005, 0.7, 0.16, 0.14, outline=0.01, bevel=0)
for k, (dx, r) in enumerate(((-0.2, 0.08), (0.0, 0.11), (0.2, 0.08))):
    lathe(f'badshahidome{k}', M['marble'], ((r, 0), (r * 1.08, r * 0.6), (r * 0.7, r * 1.3), (0.004, r * 1.7)), G + 0.135, BX + dx, BY, segs=14, outline=0.008)
for s in (-1, 1):
    lathe(f'badshahiminaret{s}', M['red'], ((0.03, 0), (0.026, 0.42)), G - 0.005, BX + s * 0.4, BY, segs=8, outline=0.006)
    chhatri(f'minaretkiosk{s}', BX + s * 0.4, BY, G + 0.415, 0.035)

# ---------- the walls and the Alamgiri Gate ----------
GX, GY = 0.0, 0.2
for s in (-1, 1):
    box(f'wall{s}', M['red'], s * 0.72, GY + 0.05, G - 0.005, 0.7, 0.14, 0.24, outline=0.012, bevel=0)
    for j in range(10):
        box(f'merlon{s}{j}', M['red'], s * 0.72 - 0.33 + j * 0.073, GY - 0.02, G + 0.235, 0.035, 0.03, 0.035, outline=0.003, bevel=0)
box('gatehall', M['red'], GX, GY + 0.06, G - 0.005, 0.32, 0.22, 0.3, outline=0.012, bevel=0)
box('gatearch', M['window'], GX, GY - 0.053, G - 0.005, 0.1, 0.006, 0.2, outline=0, bevel=0)
box('gatearchframe', M['marble'], GX, GY - 0.052, G + 0.19, 0.14, 0.006, 0.03, outline=0, bevel=0)
for s in (-1, 1):
    bx = GX + s * 0.22
    lathe(f'bastion{s}', M['redDark'], ((0.13, 0), (0.12, 0.34)), G - 0.005, bx, GY - 0.02, segs=16, outline=0.012)
    for j in range(3):
        a = -math.pi / 2 + (j - 1) * 0.6
        box(f'bastionwin{s}{j}', M['window'], bx + 0.12 * math.cos(a), GY - 0.02 + 0.12 * math.sin(a), G + 0.2, 0.03, 0.006, 0.05, rot_z=a + math.pi / 2, outline=0, bevel=0)
    chhatri(f'bastionkiosk{s}', bx, GY - 0.02, G + 0.335, 0.075)
for j in range(5):
    chhatri(f'gatekiosk{j}', GX - 0.12 + j * 0.06, GY + 0.06, G + 0.295, 0.025)

# ---------- the Hazuri Bagh ----------
box('path', M['path'], GX, -0.45, G - 0.004, 0.18, 0.9, 0.008, outline=0.003, bevel=0)
lathe('baradari', M['marble'], ((0.12, 0), (0.12, 0.08)), G - 0.005, 0.0, -0.5, segs=8, outline=0.008, smooth=False)
lathe('baradariroof', M['marble'], ((0.13, 0), (0.08, 0.04), (0.004, 0.07)), G + 0.075, 0.0, -0.5, segs=8, outline=0.006, smooth=False)
for k, (x, y) in enumerate(((-0.6, -0.4), (0.6, -0.4), (-0.4, -0.75), (0.4, -0.75), (-0.9, -0.1), (0.9, -0.1))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.08, 0.075, outline=0.011)

turn(before, -20)
render(G)

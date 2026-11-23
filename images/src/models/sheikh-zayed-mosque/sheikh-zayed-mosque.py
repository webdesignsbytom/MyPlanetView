# A cartoon Sheikh Zayed Grand Mosque for the country maps, built in the set's shared look
# (../toon.py): Abu Dhabi's white marble mosque, its great central dome and the smaller domes
# round it, the long colonnades capped with rows of little domes, the four tall minarets at its
# corners, all with gold finials, and the blue reflecting pools in front with palms. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P sheikh-zayed-mosque.py -- sheikh-zayed-mosque-1024.png 1024 sheikh-zayed-mosque.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e8d8b8', shadow_mul=(0.86, 0.82, 0.78), lift=0.2),
    'marble': toon('marble', '#fbfbf8', shadow_mul=(0.8, 0.84, 0.92), lift=0.12),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'pool': toon('pool', '#3a8ad0', lift=0.3),
    'tileBlue': toon('tileBlue', '#1f4a8a'),
    'arch': flat('arch', '#c8d0dc'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)


def dome(name, x, y, z, r, drum=0.4):
    lathe(f'{name}drum', M['marble'], ((r * 0.88, 0), (r * 0.88, r * drum)), z, x, y, segs=20, outline=0.006)
    lathe(name, M['marble'], ((r, 0), (r * 0.98, r * 0.4), (r * 0.8, r * 0.85), (r * 0.45, r * 1.15), (0.004, r * 1.3)), z + r * drum, x, y, segs=24, outline=0.008)
    rod(f'{name}finial', M['gold'], (x, y, z + r * drum + r * 1.28), (x, y, z + r * drum + r * 1.28 + max(0.05, r * 0.35)), 0.008, segs=6, outline=0)
    ball(f'{name}crescent', M['gold'], x, y, z + r * drum + r * 1.28 + max(0.05, r * 0.35) + 0.01, 0.014, outline=0)


# ---------- the platform and the prayer hall ----------
box('platform', M['marble'], 0.0, 0.3, G - 0.005, 1.7, 1.0, 0.05, outline=0.008, bevel=0)
P = G + 0.045
box('hall', M['marble'], 0.0, 0.45, P - 0.005, 0.8, 0.5, 0.2, outline=0.01, bevel=0)
for j in range(7):
    box(f'hallarch{j}', M['arch'], -0.33 + j * 0.11, 0.198, P + 0.02, 0.06, 0.006, 0.13, outline=0, bevel=0)
dome('maindome', 0.0, 0.45, P + 0.195, 0.24, drum=0.45)
for k, (dx, dy) in enumerate(((-0.28, 0.0), (0.28, 0.0), (-0.28, 0.2), (0.28, 0.2))):
    dome(f'sidedome{k}', dx, 0.45 + dy - 0.1, P + 0.195, 0.1)

# ---------- the colonnades and their little domes ----------
for s in (-1, 1):
    box(f'colonnade{s}', M['marble'], s * 0.72, 0.15, P - 0.005, 0.14, 0.75, 0.14, outline=0.008, bevel=0)
    for j in range(6):
        y = -0.15 + j * 0.12
        box(f'colarch{s}{j}', M['arch'], s * 0.72 - s * 0.071, y, P + 0.015, 0.006, 0.06, 0.09, outline=0, bevel=0)
        dome(f'coldome{s}{j}', s * 0.72, y, P + 0.135, 0.045, drum=0.2)
box('frontcolonnade', M['marble'], 0.0, -0.18, P - 0.005, 1.3, 0.1, 0.12, outline=0.008, bevel=0)
for j in range(11):
    box(f'frontarch{j}', M['arch'], -0.55 + j * 0.11, -0.231, P + 0.01, 0.06, 0.006, 0.08, outline=0, bevel=0)

# ---------- the four minarets ----------
for sx in (-1, 1):
    for sy, yy in ((-1, -0.18), (1, 0.75)):
        x = sx * 0.8
        lathe(f'minaret{sx}{sy}', M['marble'], ((0.045, 0), (0.042, 0.3), (0.038, 0.55), (0.034, 0.75)), P - 0.005, x, yy, segs=12, outline=0.006)
        for z in (0.3, 0.55):
            lathe(f'balcony{sx}{sy}{z}', M['marble'], ((0.065, 0), (0.065, 0.025)), P + z, x, yy, segs=12, outline=0.004)
        lathe(f'minarettop{sx}{sy}', M['marble'], ((0.04, 0), (0.035, 0.03), (0.004, 0.08)), P + 0.745, x, yy, segs=12, outline=0.004)
        rod(f'minaretfinial{sx}{sy}', M['gold'], (x, yy, P + 0.82), (x, yy, P + 0.88), 0.006, segs=5, outline=0)

# ---------- the reflecting pools and palms ----------
for s in (-1, 1):
    box(f'pooledge{s}', M['tileBlue'], s * 0.38, -0.65, G - 0.005, 0.6, 0.32, 0.015, outline=0.004, bevel=0)
    box(f'pool{s}', M['pool'], s * 0.38, -0.65, G - 0.004, 0.54, 0.26, 0.02, outline=0.002, bevel=0)
for k, x in enumerate((-1.05, -0.0, 1.05)):
    y = -0.55 if k != 1 else -0.95
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.3), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + 0.3), (x + 0.02 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + 0.25), 0.019, outline=0.005)

turn(before, -20)
render(G)

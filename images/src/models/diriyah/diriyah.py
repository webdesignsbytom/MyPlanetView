# A cartoon Diriyah for the country maps, built in the set's shared look (../toon.py): At-Turaif,
# the first Saudi capital, its mud-brick palaces and tapering towers in the Najdi style with their
# triangular crenellations and little triangular openings, the walls round them, and the date palms
# of Wadi Hanifa below. Turned a little towards the camera.
# Run: blender -b --factory-startup -P diriyah.py -- diriyah-1024.png 1024 diriyah.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e0c08a', shadow_mul=(0.86, 0.78, 0.72), lift=0.25),
    'mud': toon('mud', '#c89a6a', shadow_mul=(0.86, 0.78, 0.74)),
    'mudLight': toon('mudLight', '#d8b080', shadow_mul=(0.86, 0.78, 0.74)),
    'window': flat('window', '#3a2a24'),
    'door': toon('door', '#7a4a2e'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'wadi': toon('wadi', '#8ab860', shadow_mul=(0.72, 0.8, 0.74)),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(2017)


def crenels(name, x, y, z, w, d, mat):
    n = max(2, int(w / 0.04))
    for j in range(n):
        lathe(f'{name}c{j}', M[mat], ((0.014, 0), (0.004, 0.035)), z, x - w / 2 + (j + 0.5) * w / n, y - d / 2 + 0.008, segs=4, outline=0.002, smooth=False)


def palace(name, x, y, w, d, h, mat):
    box(name, M[mat], x, y, G - 0.005, w, d, h, outline=0.01, bevel=0)
    crenels(name, x, y, G + h - 0.005, w, d, mat)
    for j in range(int(w / 0.07)):
        lathe(f'{name}tri{j}', M['window'], ((0.012, 0), (0.004, 0.025)), G + h * 0.6, x - w / 2 + 0.035 + j * 0.07, y - d / 2 - 0.004, segs=3, outline=0, smooth=False)
    box(f'{name}door', M['door'], x, y - d / 2 - 0.004, G, 0.04, 0.006, 0.08, outline=0, bevel=0)


def tower(name, x, y, h, mat):
    loft(name, M[mat], [[(x - 0.06, y - 0.06, G - 0.005), (x + 0.06, y - 0.06, G - 0.005), (x + 0.06, y + 0.06, G - 0.005), (x - 0.06, y + 0.06, G - 0.005)],
                        [(x - 0.04, y - 0.04, G + h), (x + 0.04, y - 0.04, G + h), (x + 0.04, y + 0.04, G + h), (x - 0.04, y + 0.04, G + h)]], outline=0.009)
    crenels(name, x, y, G + h - 0.005, 0.08, 0.08, mat)
    for j in range(3):
        lathe(f'{name}tri{j}', M['window'], ((0.01, 0), (0.004, 0.02)), G + 0.1 + j * 0.1, x, y - 0.058 + j * 0.006, segs=3, outline=0, smooth=False)


# ---------- the palaces of At-Turaif ----------
palace('salwa', -0.1, 0.35, 0.55, 0.32, 0.22, 'mud')
palace('salwaupper', -0.15, 0.4, 0.3, 0.2, 0.32, 'mudLight')
palace('east', 0.45, 0.2, 0.34, 0.26, 0.18, 'mudLight')
palace('west', -0.62, 0.1, 0.3, 0.24, 0.16, 'mud')
palace('south', 0.05, -0.12, 0.36, 0.2, 0.14, 'mud')
for k, (x, y, h) in enumerate(((-0.42, 0.52, 0.42), (0.25, 0.52, 0.38), (0.7, 0.05, 0.32), (-0.82, 0.32, 0.3), (0.32, -0.15, 0.26))):
    tower(f'tower{k}', x, y, h, 'mud' if k % 2 else 'mudLight')
for k in range(12):
    a = math.radians(195 + k * 13)
    x, y = 0.95 * math.cos(a), 0.15 + 0.7 * math.sin(a)
    box(f'outerwall{k}', M['mud'], x, y, G - 0.005, 0.13, 0.04, 0.08, rot_z=a + math.pi / 2, outline=0.004, bevel=0)

# ---------- Wadi Hanifa's palms ----------
box('wadi', M['wadi'], 0.0, -0.75, G - 0.004, 2.4, 0.3, 0.01, outline=0.003, bevel=0)
for k in range(8):
    x = -1.0 + k * 0.28
    y = -0.75 + 0.06 * math.sin(k * 1.7)
    if math.hypot(x, y) > 1.2:
        continue
    h = rng.uniform(0.26, 0.34)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + h), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + h), (x + 0.02 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + h - 0.05), 0.019, outline=0.005)

turn(before, -20)
render(G)

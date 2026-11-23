# A cartoon Edinburgh Castle for the country maps, built in the set's shared look (../toon.py):
# Scotland's castle on its black volcanic crag, the curving Half Moon Battery, the palace and the
# Great Hall under grey slate, little St Margaret's Chapel at the top, the gatehouse and the
# Saltire, Princes Street Gardens' green below with trees, and the Gothic spire of the Scott
# Monument. Turned a little towards the camera.
# Run: blender -b --factory-startup -P edinburgh-castle.py -- edinburgh-castle-1024.png 1024 edinburgh-castle.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'crag': toon('crag', '#5a524e', shadow_mul=(0.84, 0.84, 0.9)),
    'cragGreen': toon('cragGreen', '#5f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#a8a090', shadow_mul=(0.8, 0.8, 0.88)),
    'stoneDark': toon('stoneDark', '#8a8274', shadow_mul=(0.8, 0.8, 0.88)),
    'slate': toon('slate', '#4a5058', shadow_mul=(0.78, 0.8, 0.88)),
    'window': flat('window', '#2e2a30'),
    'lawn': toon('lawn', '#7cc061', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'tree': toon('tree', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6b5040'),
    'monument': toon('monument', '#6a6460', shadow_mul=(0.82, 0.82, 0.88)),
    'path': toon('path2', '#d9c9a8', lift=0.25),
    'flagBlue': flat('flagBlue', '#005eb8'), 'flagWhite': flat('flagWhite', '#ffffff'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(1021)


def ring(cx, cy, rx, ry, z, k, sides=20):
    return [(cx + rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the crag ----------
CX, CY = 0.0, 0.3
crag = loft('crag', M['crag'], [ring(CX, CY, 0.82, 0.5, -0.01, 1), ring(CX, CY, 0.72, 0.42, 0.22, 1), ring(CX, CY, 0.62, 0.36, 0.32, 1)], outline=0.025)
crag.visible_shadow = False
green = loft('craggreen', M['cragGreen'], [ring(CX, CY, 0.86, 0.54, -0.008, 1), ring(CX, CY, 0.83, 0.51, 0.06, 1)], outline=0.01)
green.visible_shadow = False
TOP = G + 0.32

# ---------- the castle on top ----------
pts = [(CX - 0.55, CY - 0.18), (CX + 0.5, CY - 0.22), (CX + 0.55, CY + 0.15), (CX - 0.5, CY + 0.25)]
loft('curtain', M['stone'], [[(x, y, TOP - 0.01) for x, y in pts], [(x, y, TOP + 0.08) for x, y in pts]], outline=0.014)
# the Half Moon Battery, curving round the front
for k in range(10):
    t0, t1 = math.radians(200 + k * 14), math.radians(214 + k * 14)
    x0, y0 = CX + 0.15 + 0.22 * math.cos(t0), CY - 0.05 + 0.16 * math.sin(t0)
    x1, y1 = CX + 0.15 + 0.22 * math.cos(t1), CY - 0.05 + 0.16 * math.sin(t1)
    box(f'halfmoon{k}', M['stoneDark'], (x0 + x1) / 2, (y0 + y1) / 2, TOP - 0.01, math.hypot(x1 - x0, y1 - y0) + 0.01, 0.05, 0.16, rot_z=math.atan2(y1 - y0, x1 - x0),
        outline=0.008, bevel=0)
# the palace and the Great Hall
for k, (x, y, w, d, h) in enumerate(((CX + 0.2, CY + 0.05, 0.3, 0.16, 0.2), (CX - 0.12, CY + 0.08, 0.32, 0.14, 0.17))):
    box(f'hall{k}', M['stone'], x, y, TOP + 0.075, w, d, h, outline=0.012, bevel=0)
    loft(f'hallroof{k}', M['slate'], [[(x - w / 2 - 0.01, y - d / 2 - 0.01, TOP + 0.07 + h), (x + w / 2 + 0.01, y - d / 2 - 0.01, TOP + 0.07 + h),
                                       (x + w / 2 + 0.01, y + d / 2 + 0.01, TOP + 0.07 + h), (x - w / 2 - 0.01, y + d / 2 + 0.01, TOP + 0.07 + h)],
                                      [(x - w / 2 + 0.02, y - 0.004, TOP + 0.14 + h), (x + w / 2 - 0.02, y - 0.004, TOP + 0.14 + h),
                                       (x + w / 2 - 0.02, y + 0.004, TOP + 0.14 + h), (x - w / 2 + 0.02, y + 0.004, TOP + 0.14 + h)]], outline=0.008)
    for j in range(4):
        box(f'hallwin{k}{j}', M['window'], x - w / 2 + 0.05 + j * (w - 0.1) / 3, y - d / 2 - 0.004, TOP + 0.12 + (h - 0.08) * 0.5, 0.025, 0.01, 0.045, outline=0, bevel=0)
box('palacetower', M['stone'], CX + 0.32, CY + 0.02, TOP + 0.075, 0.08, 0.08, 0.28, outline=0.008, bevel=0)
pyramid('palacetowertop', M['slate'], CX + 0.32, CY + 0.02, TOP + 0.355, 0.09, 0.08, outline=0.006)
# St Margaret's Chapel, the gatehouse, the Saltire
box('chapel', M['stoneDark'], CX - 0.38, CY + 0.12, TOP + 0.075, 0.1, 0.07, 0.08, outline=0.008, bevel=0)
GX, GY = CX - 0.4, CY - 0.2
box('gatehouse', M['stone'], GX, GY, TOP - 0.01, 0.18, 0.1, 0.18, outline=0.01, bevel=0)
for s in (-1, 1):
    lathe(f'gateturret{s}', M['stone'], ((0.03, 0), (0.03, 0.05)), TOP + 0.165, GX + s * 0.07, GY - 0.03, segs=10, outline=0.004)
box('gateway', M['window'], GX, GY - 0.052, TOP, 0.05, 0.01, 0.09, outline=0, bevel=0)
FX, FY = CX + 0.32, CY + 0.02
rod('flagpole', M['stone'], (FX, FY, TOP + 0.4), (FX, FY, TOP + 0.55), 0.005, segs=6, outline=0)
box('flag', M['flagBlue'], FX + 0.05, FY, TOP + 0.5, 0.1, 0.006, 0.05, outline=0, bevel=0)
bar('saltire1', M['flagWhite'], (FX + 0.005, FY - 0.004, TOP + 0.503), (FX + 0.095, FY - 0.004, TOP + 0.547), 0.008, outline=0)
bar('saltire2', M['flagWhite'], (FX + 0.005, FY - 0.004, TOP + 0.547), (FX + 0.095, FY - 0.004, TOP + 0.503), 0.008, outline=0)

# ---------- Princes Street Gardens below: paths, trees, the Scott Monument ----------
box('gardenpath', M['path'], 0.0, -0.62, G - 0.004, 1.6, 0.08, 0.008, outline=0.004, bevel=0)
for k, (x, y) in enumerate(((-0.85, -0.45), (-0.5, -0.75), (-0.15, -0.5), (0.35, -0.48), (0.95, -0.35), (-1.0, 0.1), (1.05, 0.2))):
    h = rng.uniform(0.1, 0.14)
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + h), 0.015, segs=6, outline=0.005)
    ball(f'tree{k}', M['tree'], x, y, G + h + 0.06, rng.uniform(0.08, 0.1), outline=0.012)
SX, SY = 0.6, -0.8
box('scottbase', M['monument'], SX, SY, G - 0.005, 0.14, 0.14, 0.12, outline=0.008, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'scottpinnacle{sx}{sy}', M['monument'], ((0.012, 0), (0.008, 0.18), (0.002, 0.24)), G + 0.1, SX + sx * 0.06, SY + sy * 0.06, segs=4, outline=0.003, smooth=False)
loft('scottspire', M['monument'], [[(SX - 0.05, SY - 0.05, G + 0.115), (SX + 0.05, SY - 0.05, G + 0.115), (SX + 0.05, SY + 0.05, G + 0.115), (SX - 0.05, SY + 0.05, G + 0.115)],
                                   [(SX - 0.03, SY - 0.03, G + 0.3), (SX + 0.03, SY - 0.03, G + 0.3), (SX + 0.03, SY + 0.03, G + 0.3), (SX - 0.03, SY + 0.03, G + 0.3)],
                                   [(SX - 0.003, SY - 0.003, G + 0.44), (SX + 0.003, SY - 0.003, G + 0.44), (SX + 0.003, SY + 0.003, G + 0.44), (SX - 0.003, SY + 0.003, G + 0.44)]],
     outline=0.008)
box('scottarch', M['window'], SX, SY - 0.071, G, 0.05, 0.01, 0.08, outline=0, bevel=0)

turn(before, -20)
render(G)

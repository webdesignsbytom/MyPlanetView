# A cartoon Trinity Lavra of St Sergius for the country maps, built in the set's shared look
# (../toon.py): the white Assumption Cathedral with its arched gables, its great gold dome in the
# middle and four blue onion domes scattered with gold stars, the tall baroque bell tower rising in
# turquoise and white tiers to its gold crown, and the monastery's white walls with their corner
# towers. Turned a little towards the camera.
# Run: blender -b --factory-startup -P sergiev-posad.py -- sergiev-posad-1024.png 1024 sergiev-posad.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8d4c8', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'lawn': toon('lawn', '#7cb85a'),
    'white': toon('white', '#f6f2ea', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'blue': toon('blue', '#2f5ab8', lift=0.12),
    'gold': toon('gold', '#f0c030', lift=0.3),
    'turquoise': toon('turquoise', '#5ab0b0', lift=0.12),
    'red': toon('red', '#b8503e'),
    'window': flat('window', '#3a4050'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(2381)

PROFILE = ((1.0, 0.0), (1.25, 0.55), (1.15, 1.0), (0.6, 1.5), (0.004, 2.1))


def onion(name, mat, x, y, z, r, stars=0):
    lathe(name, mat, tuple((a * r, b * r) for a, b in PROFILE), z, x, y, segs=18, outline=0.004)
    rod(f'{name}cross', M['gold'], (x, y, z + r * 2.05), (x, y, z + r * 2.05 + r * 0.9), max(0.004, r * 0.06), segs=6, outline=0.001)
    bar(f'{name}crossbar', M['gold'], (x - r * 0.25, y, z + r * 2.6), (x + r * 0.25, y, z + r * 2.6), max(0.006, r * 0.1), outline=0.001)
    for k in range(stars):
        t = rng.uniform(0.25, 1.3)
        for (r0, h0), (r1, h1) in zip(PROFILE, PROFILE[1:]):
            if h0 <= t <= h1:
                rad = (r0 + (r1 - r0) * (t - h0) / (h1 - h0)) * r
                break
        a = rng.uniform(math.pi * 0.95, math.pi * 2.05)
        ball(f'{name}star{k}', M['gold'], x + rad * math.cos(a), y + rad * math.sin(a), z + t * r, r * 0.1, outline=0)


# ---------- the Assumption Cathedral ----------
CX, CY = -0.25, 0.25
box('cathedral', M['white'], CX, CY, G - 0.005, 0.46, 0.4, 0.3, outline=0.009, bevel=0)
for x in (-0.18, -0.06, 0.06, 0.18):
    cyl(f'zakomara{x}', M['white'], 0.06, 0.4, segs=18, outline=0.004, matrix=Matrix.Translation((CX + x, CY, G + 0.295)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    box(f'cathwin{x}', M['window'], CX + x, CY - 0.202, G + 0.12, 0.03, 0.006, 0.08, outline=0, bevel=0)
box('cathdoor', M['window'], CX, CY - 0.202, G - 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)
lathe('centraldrum', M['white'], ((0.075, 0), (0.075, 0.14)), G + 0.32, CX, CY, segs=18, outline=0.005)
onion('centraldome', M['gold'], CX, CY, G + 0.455, 0.075)
for sx in (-1, 1):
    for sy in (-1, 1):
        dx, dy = CX + sx * 0.15, CY + sy * 0.12
        lathe(f'drum{sx}{sy}', M['white'], ((0.045, 0), (0.045, 0.09)), G + 0.32, dx, dy, segs=16, outline=0.004)
        onion(f'dome{sx}{sy}', M['blue'], dx, dy, G + 0.405, 0.045, stars=9)

# ---------- the bell tower ----------
BX, BY = 0.42, 0.0
z = G - 0.005
for i, (w, h, mat) in enumerate(((0.24, 0.2, 'turquoise'), (0.2, 0.15, 'white'), (0.17, 0.14, 'turquoise'), (0.14, 0.12, 'white'))):
    box(f'tier{i}', M[mat], BX, BY, z, w, w, h, outline=0.006, bevel=0)
    box(f'tiercornice{i}', M['white'], BX, BY, z + h - 0.012, w + 0.02, w + 0.02, 0.018, outline=0.002, bevel=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            rod(f'tiercol{i}{sx}{sy}', M['white'], (BX + sx * w / 2, BY + sy * w / 2, z), (BX + sx * w / 2, BY + sy * w / 2, z + h - 0.012), 0.01, segs=6, outline=0.001)
    box(f'tierarch{i}', M['window'], BX, BY - w / 2 - 0.003, z + h * 0.2, w * 0.3, 0.006, h * 0.5, outline=0, bevel=0)
    cyl(f'tierarchtop{i}', M['window'], w * 0.15, 0.006, segs=12, outline=0, matrix=Matrix.Translation((BX, BY - w / 2 - 0.003, z + h * 0.7)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    z += h
lathe('towerrotunda', M['turquoise'], ((0.06, 0), (0.06, 0.08)), z, BX, BY, segs=16, outline=0.004)
lathe('towercrown', M['gold'], ((0.07, 0), (0.06, 0.05), (0.03, 0.09), (0.004, 0.12)), z + 0.075, BX, BY, segs=16, outline=0.004)
rod('towercross', M['gold'], (BX, BY, z + 0.19), (BX, BY, z + 0.26), 0.006, segs=6, outline=0.001)
bar('towercrossbar', M['gold'], (BX - 0.02, BY, z + 0.235), (BX + 0.02, BY, z + 0.235), 0.01, outline=0.001)

# ---------- the walls ----------
box('frontwall', M['white'], 0.0, -0.62, G - 0.005, 1.6, 0.06, 0.12, outline=0.006, bevel=0)
box('frontcoping', M['red'], 0.0, -0.62, G + 0.115, 1.62, 0.08, 0.02, outline=0.002, bevel=0)
for s in (-1, 1):
    lathe(f'cornertower{s}', M['white'], ((0.08, 0), (0.08, 0.2)), G - 0.005, s * 0.8, -0.62, segs=16, outline=0.005)
    lathe(f'cornercap{s}', M['red'], ((0.09, 0), (0.004, 0.14)), G + 0.195, s * 0.8, -0.62, segs=16, outline=0.004)
box('gatetower', M['white'], 0.0, -0.62, G - 0.005, 0.16, 0.1, 0.22, outline=0.005, bevel=0)
box('gatearch', M['window'], 0.0, -0.672, G - 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)
onion('gatedome', M['gold'], 0.0, -0.62, G + 0.215, 0.035)
for s in (-1, 1):
    box(f'lawn{s}', M['lawn'], s * 0.4, -0.3, G - 0.003, 0.42, 0.3, 0.008, outline=0.002, bevel=0)

turn(before, -20)
render(G)

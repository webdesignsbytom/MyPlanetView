# A cartoon Amphitheatre of El Jem for the country maps, built in the set's shared look (../toon.py):
# the great honey-coloured Roman amphitheatre rising over the little town, three storeys of arches
# round its oval, one side broken open, the tiers of seats and the arena inside with the passages
# beneath its floor, the town's white flat-roofed houses round it, and date palms.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P el-jem.py -- el-jem-1024.png 1024 el-jem.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#e2cf9e', shadow_mul=(0.84, 0.76, 0.64), lift=0.25),
    'stone': toon('stone', '#d9b072', shadow_mul=(0.84, 0.74, 0.66)),
    'stoneDark': toon('stoneDark', '#b88e52', shadow_mul=(0.84, 0.74, 0.66)),
    'arch': flat('arch', '#6b4a33'),
    'sand': toon('sand', '#ead2a0', lift=0.25),
    'pit': flat('pit', '#7a5a3e'),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'palm': toon('palm', '#5a9e4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(449)

AX, AY, A, B = 0.0, 0.1, 0.78, 0.6     # the amphitheatre's middle and its outer half-axes
H = 0.42                                # the outer wall's height
THICK = 0.1
SIDES = 48
BREACH = (math.radians(55), math.radians(95))   # the side broken open, at the back right


def broken(t):
    t = t % (2 * math.pi)
    return BREACH[0] <= t <= BREACH[1]


# ---------- the outer wall, in segments, low where it is broken ----------
for k in range(SIDES):
    t0, t1 = 2 * math.pi * k / SIDES, 2 * math.pi * (k + 1) / SIDES
    tm = (t0 + t1) / 2
    h = 0.12 + 0.04 * math.sin(k * 2.3) if broken(tm) else H
    pts = [(AX + A * math.cos(t0), AY + B * math.sin(t0)), (AX + A * math.cos(t1), AY + B * math.sin(t1)),
           (AX + (A - THICK) * math.cos(t1), AY + (B - THICK) * math.sin(t1)), (AX + (A - THICK) * math.cos(t0), AY + (B - THICK) * math.sin(t0))]
    loft(f'wall{k}', M['stone'], [[(x, y, G - 0.005) for x, y in pts], [(x, y, G + h) for x, y in pts]], outline=0.012)
    # three storeys of arches on the outside
    if not broken(tm):
        nx, ny = math.cos(tm) * B, math.sin(tm) * A
        norm = math.hypot(nx, ny)
        x, y = AX + (A + 0.003) * math.cos(tm), AY + (B + 0.003) * math.sin(tm)
        rot = math.atan2(ny / norm, nx / norm) + math.pi / 2
        for row, (z, ah) in enumerate(((0.03, 0.09), (0.17, 0.08), (0.3, 0.07))):
            box(f'arch{k}{row}', M['arch'], x, y, G + z, 0.045, 0.01, ah, rot_z=rot, outline=0, bevel=0)
# cornices between the storeys, round all but the broken side
for k, z in enumerate((0.135, 0.27)):
    pts_out = [(AX + (A + 0.008) * math.cos(t), AY + (B + 0.008) * math.sin(t)) for t in (BREACH[1] + (2 * math.pi - (BREACH[1] - BREACH[0])) * j / 40 for j in range(41))]
    for j, ((x0, y0), (x1, y1)) in enumerate(zip(pts_out, pts_out[1:])):
        bar(f'cornice{k}{j}', M['stoneDark'], (x0, y0, G + z), (x1, y1, G + z), 0.018, outline=0)

# ---------- the seats inside, and the arena ----------
for k in range(4):
    s = 1 - (THICK + 0.02 + k * 0.07) / A
    sb = 1 - (THICK + 0.02 + k * 0.07) / B
    ring = [(AX + A * s * math.cos(t), AY + B * sb * math.sin(t)) for t in (2 * math.pi * j / 40 for j in range(40))]
    loft(f'tier{k}', M['stoneDark' if k % 2 else 'stone'], [[(x, y, G - 0.005) for x, y in ring], [(x, y, G + 0.3 - k * 0.07) for x, y in ring]], outline=0.01)
arena = [(AX + 0.36 * math.cos(t), AY + 0.2 * math.sin(t)) for t in (2 * math.pi * j / 32 for j in range(32))]
loft('arena', M['sand'], [[(x, y, G - 0.005) for x, y in arena], [(x, y, G + 0.025) for x, y in arena]], outline=0.008)
# the passages beneath the arena floor, open in a cross
box('pitlong', M['pit'], AX, AY, G + 0.026, 0.48, 0.05, 0.004, outline=0, bevel=0)
box('pitcross', M['pit'], AX, AY, G + 0.026, 0.05, 0.26, 0.004, outline=0, bevel=0)

# ---------- the town's white houses round it ----------
for k in range(14):
    t = 2 * math.pi * k / 14 + rng.uniform(-0.1, 0.1)
    r = rng.uniform(1.0, 1.2)
    x, y = r * math.cos(t), AY * 0.3 + r * 0.92 * math.sin(t)
    if math.hypot(x, y) > 1.3:
        continue
    w, h = rng.uniform(0.12, 0.18), rng.uniform(0.08, 0.13)
    box(f'house{k}', M['white'], x, y, G - 0.005, w, w * 0.9, h, rot_z=t, outline=0.012, bevel=0)

# ---------- date palms ----------
for k, (x, y) in enumerate(((-1.05, -0.45), (1.0, -0.5), (-0.85, 0.85), (0.9, 0.75), (-0.3, -0.85), (0.35, -0.9))):
    h = rng.uniform(0.3, 0.38)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + h), 0.016, r2=0.012, segs=8, outline=0.007)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + h), (x + 0.02 + 0.12 * math.cos(b), y + 0.12 * math.sin(b), G + h - 0.06), 0.024, outline=0.006)

turn(before, -20)
render(G)

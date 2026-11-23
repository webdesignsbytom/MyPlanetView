# A cartoon Ciudad Perdida (the Lost City, Teyuna) for the country maps, built in the set's shared
# look (../toon.py): the round terraces of the Tairona city stepping up a ridge in the Sierra
# Nevada de Santa Marta, each a grassy platform ringed by its stone wall, stone stairways climbing
# between them, a couple of round thatched huts, and the dense jungle and mist all round. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P ciudad-perdida.py -- ciudad-perdida-1024.png 1024 ciudad-perdida.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'jungle': toon('jungle', '#3a7f43', shadow_mul=(0.7, 0.78, 0.8)),
    'jungleLight': toon('jungleLight', '#5aa652', shadow_mul=(0.7, 0.78, 0.8)),
    'ridge': toon('ridge', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#a8a090', shadow_mul=(0.78, 0.78, 0.86)),
    'lawn': toon('lawn', '#8cc65a', shadow_mul=(0.7, 0.8, 0.75), lift=0.3),
    'thatch': toon('thatch', '#b08a4a', shadow_mul=(0.84, 0.74, 0.62)),
    'hutWall': toon('hutWall', '#c9a678', shadow_mul=(0.84, 0.74, 0.66)),
    'mist': toon('mist', '#f4f6f8', shadow_mul=(0.82, 0.85, 0.95), lift=0.1),
    'trunk': toon('trunk', '#6b4a33'),
})

G = tile(M['jungle'])
before = set(bpy.data.objects)
rng = random.Random(241)


def ring(cx, cy, rx, ry, z, jitter, sides=16):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- the ridge the city climbs ----------
ridge = loft('ridge', M['ridge'], [ring(0.05, 0.25, 1.15, 0.85, -0.01, 0.03), ring(0.1, 0.35, 0.85, 0.6, 0.15, 0.05), ring(0.15, 0.45, 0.5, 0.36, 0.35, 0.05),
                                   ring(0.18, 0.5, 0.2, 0.15, 0.5, 0.05)], outline=0.035)
ridge.visible_shadow = False


def terrace(name, x, y, r, z):
    """A round platform: a stone wall ringing a grassy top, its foot well down in the slope."""
    lathe(name, M['stone'], ((r, 0), (r, z - G + 0.03)), G - 0.01, x, y, segs=28, outline=0.016)
    cyl(name + 'lawn', M['lawn'], r * 0.95, 0.012, segs=28, outline=0, matrix=Matrix.Translation((x, y, z + 0.026)))
    return z + 0.03


# ---------- the round terraces, from the lowest to the main platform on the ridge ----------
TERRACES = [(-0.55, -0.55, 0.2, 0.08), (-0.1, -0.7, 0.22, 0.06), (0.4, -0.55, 0.19, 0.1), (-0.5, -0.05, 0.22, 0.24), (0.05, -0.2, 0.25, 0.22),
            (0.55, -0.05, 0.2, 0.26), (-0.2, 0.32, 0.22, 0.42), (0.3, 0.35, 0.2, 0.52), (0.15, 0.62, 0.24, 0.66)]
tops = []
for k, (x, y, r, z) in enumerate(TERRACES):
    tops.append((x, y, r, terrace(f'terrace{k}', x, y, r, G + z)))

# ---------- stone stairways between them ----------
for k, (a, b) in enumerate(((1, 4), (4, 6), (6, 8), (0, 3), (2, 5), (5, 7))):
    (x0, y0, r0, z0), (x1, y1, r1, z1) = tops[a], tops[b]
    d = math.hypot(x1 - x0, y1 - y0)
    ux, uy = (x1 - x0) / d, (y1 - y0) / d
    sx, sy = x0 + ux * r0 * 0.9, y0 + uy * r0 * 0.9
    ex, ey = x1 - ux * r1 * 0.9, y1 - uy * r1 * 0.9
    steps = 6
    for j in range(steps):
        t = (j + 0.5) / steps
        box(f'stair{k}{j}', M['stone'], sx + (ex - sx) * t, sy + (ey - sy) * t, G - 0.01, 0.07, 0.05, (z0 + (z1 - z0) * t) - G + 0.01,
            rot_z=math.atan2(uy, ux) + math.pi / 2, outline=0.006, bevel=0)

# ---------- round thatched huts on two of the terraces ----------
for k in (4, 8):
    x, y, r, z = tops[k]
    lathe(f'hut{k}', M['hutWall'], ((0.08, 0), (0.08, 0.08)), z, x + 0.04, y, segs=16, outline=0.01)
    lathe(f'hutroof{k}', M['thatch'], ((0.11, 0), (0.06, 0.08), (0.004, 0.17)), z + 0.075, x + 0.04, y, segs=16, outline=0.012)

# ---------- the jungle all round, and mist ----------
for k in range(20):
    a = 2 * math.pi * k / 20 + rng.uniform(-0.1, 0.1)
    rr = rng.uniform(1.05, 1.3)
    if 3.6 < a < 5.6:
        continue                      # none in front, so the terraces show
    x, y = rr * math.cos(a), 0.1 + rr * 0.92 * math.sin(a)
    if math.hypot(x, y) > 1.34:
        x, y = x * 1.3 / math.hypot(x, y), y * 1.3 / math.hypot(x, y)
    h = rng.uniform(0.15, 0.35)
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + h), 0.025, segs=8, outline=0.01)
    ball(f'crown{k}', M['jungle' if k % 2 else 'jungleLight'], x, y, G + h + 0.06, rng.uniform(0.12, 0.17), outline=0.02)
for k, (x, y, z, r) in enumerate(((-0.65, 0.65, 0.55, 0.12), (-0.48, 0.7, 0.58, 0.1), (0.75, 0.6, 0.5, 0.11), (0.88, 0.55, 0.52, 0.09))):
    ball(f'mist{k}', M['mist'], x, y, G + z, r, outline=0.018)

turn(before, -20)
render(G)

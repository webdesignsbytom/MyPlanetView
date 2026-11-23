# A cartoon Baalbek for the country maps, built in the set's shared look (../toon.py): the six
# giant columns still standing from the Temple of Jupiter on its massive podium, their entablature
# on top and fallen drums at their feet; the Temple of Bacchus beside it, ringed by its colonnade
# round the walls of its cella, its stairs in front; cypresses, and the mountains of the Beqaa
# Valley behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P baalbek.py -- baalbek-1024.png 1024 baalbek.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d8c79a', lift=0.25),
    'stone': toon('stone', '#e3c38a', shadow_mul=(0.84, 0.74, 0.66)),
    'stoneDark': toon('stoneDark', '#c9a46a', shadow_mul=(0.84, 0.74, 0.66)),
    'block': toon('block', '#d4b47c', shadow_mul=(0.84, 0.74, 0.66)),
    'door': flat('door', '#5a4030'),
    'cypress': toon('cypress', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'mountain': toon('mountain', '#a48a6a', shadow_mul=(0.8, 0.74, 0.8)),
    'snow': toon('snow', '#f7f8fb', shadow_mul=(0.80, 0.84, 0.95), lift=0.15),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(173)


def ring(cx, cy, rx, ry, z, jitter, sides=12):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


def column(name, x, y, z0, h, r):
    lathe(f'{name}base', M['stoneDark'], ((r * 1.4, 0), (r * 1.4, 0.025), (r * 1.15, 0.04)), z0, x, y, segs=12, outline=0.008)
    rod(name, M['stone'], (x, y, z0 + 0.04), (x, y, z0 + h - 0.06), r, r2=r * 0.88, segs=14, outline=0.014)
    lathe(f'{name}capital', M['stoneDark'], ((r * 0.9, 0), (r * 1.35, 0.045), (r * 1.5, 0.06)), z0 + h - 0.06, x, y, segs=12, outline=0.01)


# ---------- the mountains behind ----------
for k, (cx, cy, r, h) in enumerate(((-0.45, 0.98, 0.38, 0.75), (0.35, 1.0, 0.36, 0.62))):
    body = loft(f'mountain{k}', M['mountain'], [ring(cx, cy, r, r * 0.55, -0.01, 0.0), ring(cx, cy, r * 0.62, r * 0.36, h * 0.55, 0.12),
                                                ring(cx, cy, r * 0.25, r * 0.15, h * 0.88, 0.12), ring(cx, cy, 0.02, 0.02, h, 0.0)], outline=0.035)
    cap = loft(f'snow{k}', M['snow'], [ring(cx, cy, r * 0.3, r * 0.18, h * 0.82, 0.14), ring(cx, cy, 0.02, 0.02, h + 0.01, 0.0)], outline=0.02)
    body.visible_shadow = cap.visible_shadow = False

# ---------- the Temple of Jupiter: its podium of huge blocks and the six columns ----------
JX, JY, JW, JD, JH = -0.28, 0.42, 1.0, 0.5, 0.2
box('jupiterpodium', M['block'], JX, JY, G - 0.005, JW, JD, JH, outline=0.028, bevel=0.004)
for k in range(4):
    box(f'course{k}', M['stoneDark'], JX, JY - JD / 2 - 0.003, G + 0.045 + k * 0.045, JW, 0.008, 0.006, outline=0, bevel=0)
for k in range(5):
    box(f'joint{k}', M['stoneDark'], JX - JW / 2 + 0.1 + k * 0.2 + (0.05 if k % 2 else 0), JY - JD / 2 - 0.003, G + 0.01, 0.006, 0.008, 0.18,
        outline=0, bevel=0)
CH = 1.0
for k in range(6):
    column(f'jcol{k}', JX - 0.35 + k * 0.13, JY - 0.12, G + JH, CH, 0.045)
EZ = G + JH + CH
box('architrave', M['stone'], JX - 0.025, JY - 0.12, EZ, 0.78, 0.11, 0.06, outline=0.018, bevel=0)
box('frieze', M['stoneDark'], JX - 0.025, JY - 0.12, EZ + 0.06, 0.78, 0.1, 0.05, outline=0.014, bevel=0)
box('cornice', M['stone'], JX - 0.025, JY - 0.12, EZ + 0.11, 0.84, 0.14, 0.04, outline=0.016, bevel=0)
for k in range(6):
    ball(f'lionhead{k}', M['stoneDark'], JX - 0.35 + k * 0.13, JY - 0.12 - 0.072, EZ + 0.125, 0.012, outline=0.003)
# fallen drums on the podium
for k, (x, y, a) in enumerate(((0.0, 0.52, 0.2), (0.08, 0.36, -0.4), (-0.6, 0.55, 1.2))):
    p0 = Vector((x, y, G + JH + 0.045))
    d = Vector((math.cos(a), math.sin(a), 0)) * 0.08
    rod(f'drum{k}', M['stone'], p0 - d, p0 + d, 0.045, segs=14, outline=0.012)

# ---------- the Temple of Bacchus beside it ----------
BX, BY, BW, BD = 0.55, -0.25, 0.5, 0.78
box('bacchuspodium', M['block'], BX, BY, G - 0.005, BW, BD, 0.1, outline=0.022, bevel=0.003)
for k in range(6):
    box(f'stair{k}', M['stone'], BX, BY - BD / 2 - 0.02 - k * 0.025, G - 0.005, 0.3, 0.05, 0.1 - k * 0.016, outline=0.006, bevel=0)
box('cella', M['stone'], BX, BY + 0.03, G + 0.095, BW - 0.16, BD - 0.2, 0.38, outline=0.02, bevel=0.003)
box('celladoor', M['door'], BX, BY + 0.03 - (BD - 0.2) / 2 - 0.004, G + 0.095, 0.1, 0.01, 0.24, outline=0, bevel=0)
box('cellalintel', M['stoneDark'], BX, BY + 0.03 - (BD - 0.2) / 2 - 0.008, G + 0.335, 0.16, 0.012, 0.04, outline=0, bevel=0)
CH2 = 0.42
xs = [BX - BW / 2 + 0.04 + i * (BW - 0.08) / 3 for i in range(4)]
ys = [BY - BD / 2 + 0.04 + j * (BD - 0.08) / 6 for j in range(7)]
for i, x in enumerate(xs):
    for j, y in enumerate(ys):
        if 0 < i < 3 and 0 < j < 6:
            continue
        column(f'bcol{i}{j}', x, y, G + 0.095, CH2, 0.024)
EZ2 = G + 0.095 + CH2
for k, (x, y, w, d) in enumerate(((BX, ys[0], BW - 0.04, 0.06), (BX, ys[-1], BW - 0.04, 0.06), (xs[0], BY, 0.06, BD - 0.04), (xs[-1], BY, 0.06, BD - 0.04))):
    box(f'bentab{k}', M['stone'], x, y, EZ2, w, d, 0.05, outline=0.012, bevel=0)

# ---------- cypresses ----------
for k, (x, y) in enumerate(((-1.05, -0.2), (-0.85, -0.55), (-1.1, 0.3), (1.05, 0.45), (0.95, 0.75), (-0.45, -0.8))):
    rod(f'cypress{k}', M['cypress'], (x, y, G), (x, y, G + rng.uniform(0.38, 0.5)), 0.065, r2=0.0, segs=10, outline=0.016)

turn(before, -20)
render(G)

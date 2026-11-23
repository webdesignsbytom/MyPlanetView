# A cartoon Pig Beach for the country maps, built in the set's shared look (../toon.py): Big Major
# Cay in the Exumas, its white sand and palms, the pigs on the beach and swimming out through the
# turquoise water to a boat. Turned a little towards the camera.
# Run: blender -b --factory-startup -P pig-beach.py -- pig-beach-1024.png 1024 pig-beach.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#3ec4cc', shadow_mul=(0.74, 0.84, 0.88), lift=0.35),
    'sand': toon('sand', '#f6eedc', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'bush': toon('bush', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'pig': toon('pig', '#f2b0a4', shadow_mul=(0.86, 0.76, 0.8), lift=0.25),
    'snout': toon('snout', '#e4909a', lift=0.2),
    'spot': toon('spot', '#6a4a3e'),
    'eye': flat('eye', '#2e2a30'),
    'foam': toon('foam', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'hull': toon('hull', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'stripe': toon('stripe', '#2f6fb0'),
    'console': toon('console', '#c8ccd2', shadow_mul=(0.8, 0.8, 0.88)),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1091)


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


def ring(cx, cy, rx, ry, z, k, sides=20):
    return [(cx + rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the cay: white sand, then bush and palms at the back ----------
isle = loft('cay', M['sand'], [ring(0.0, 0.5, 1.0, 0.55, -0.01, 1), ring(0.0, 0.52, 0.96, 0.52, 0.04, 1)], outline=0.014, smooth=True)
isle.visible_shadow = False
scrub = loft('scrub', M['bush'], [ring(0.0, 0.78, 0.78, 0.3, 0.035, 2), ring(0.0, 0.8, 0.66, 0.22, 0.12, 2)], outline=0.012, smooth=True)
scrub.visible_shadow = False
for k in range(8):
    t = math.radians(15 + k * 21)
    ball(f'bush{k}', M['bush'], 0.66 * math.cos(t), 0.8 + 0.22 * math.sin(t), G + 0.13, rng.uniform(0.07, 0.09), outline=0.012)
for k, (x, y) in enumerate(((-0.75, 0.55), (0.62, 0.62), (0.15, 0.95), (-0.3, 0.82))):
    h = rng.uniform(0.3, 0.36)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G + 0.04), (x + 0.04, y, G + h), 0.015, r2=0.011, segs=8, outline=0.005)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.04, y, G + h), (x + 0.04 + 0.12 * math.cos(b), y + 0.12 * math.sin(b), G + h - 0.06), 0.022, outline=0.005)


# ---------- the pigs ----------
def pig(name, x, y, z, a, swim=False, spots=False, S=1.35):
    c, s = math.cos(a), math.sin(a)
    bz = z + (0.0 if swim else 0.075 * S)
    if not swim:
        for fx, side in ((0.05, -1), (0.05, 1), (-0.05, -1), (-0.05, 1)):
            lx, ly = x + fx * S * c - side * 0.03 * S * s, y + fx * S * s + side * 0.03 * S * c
            rod(f'{name}leg{fx}{side}', M['pig'], (lx, ly, z), (lx, ly, bz), 0.016 * S, segs=6, outline=0.004)
    body = squashed(f'{name}body', M['pig'], x, y, bz, 0.07 * S, 1.4, 0.95, 0.85, outline=0.012)
    body.rotation_euler = (0, 0, a)
    if spots:
        squashed(f'{name}spot', M['spot'], x - 0.03 * S * c, y - 0.03 * S * s, bz + 0.045 * S, 0.03 * S, 1.2, 1.0, 0.5, outline=0)
    hx, hy, hz = x + 0.105 * S * c, y + 0.105 * S * s, bz + 0.025 * S
    ball(f'{name}head', M['pig'], hx, hy, hz, 0.048 * S, outline=0.01)
    rod(f'{name}snout', M['snout'], (hx + 0.035 * S * c, hy + 0.035 * S * s, hz - 0.008 * S), (hx + 0.065 * S * c, hy + 0.065 * S * s, hz - 0.01 * S), 0.022 * S, segs=12,
        outline=0.004)
    for side in (-1, 1):
        ex, ey = hx - side * 0.028 * S * s, hy + side * 0.028 * S * c
        bar(f'{name}ear{side}', M['snout'], (ex, ey, hz + 0.035 * S), (ex + 0.02 * S * c - side * 0.01 * S * s, ey + 0.02 * S * s + side * 0.01 * S * c, hz + 0.065 * S), 0.02 * S,
            outline=0.003)
        ball(f'{name}eye{side}', M['eye'], hx + 0.035 * S * c - side * 0.02 * S * s, hy + 0.035 * S * s + side * 0.02 * S * c, hz + 0.018 * S, 0.007 * S, outline=0)
    if swim:
        for j in range(6):
            b = 2 * math.pi * j / 6
            ball(f'{name}foam{j}', M['foam'], x + 0.12 * S * math.cos(b), y + 0.09 * S * math.sin(b), G, 0.022 * S, outline=0.003)


pig('pig0', -0.45, 0.22, G + 0.04, -1.9, spots=True)
pig('pig1', 0.12, 0.18, G + 0.04, -1.3)
pig('pig2', 0.55, 0.36, G + 0.04, -2.4, spots=True)
pig('pig3', -0.2, -0.4, G, -1.0, swim=True)
pig('pig4', 0.3, -0.22, G, -0.7, swim=True)

# ---------- the boat they swim out to ----------
BX, BY = 0.62, -0.62
loft('hull', M['hull'], [[(BX - 0.16, BY - 0.02, G - 0.002), (BX + 0.12, BY - 0.04, G - 0.002), (BX + 0.2, BY + 0.03, G - 0.002), (BX - 0.14, BY + 0.06, G - 0.002)],
                         [(BX - 0.18, BY - 0.03, G + 0.05), (BX + 0.12, BY - 0.06, G + 0.05), (BX + 0.25, BY + 0.04, G + 0.06), (BX - 0.16, BY + 0.08, G + 0.05)]], outline=0.008)
loft('stripe', M['stripe'], [[(BX - 0.181, BY - 0.031, G + 0.02), (BX + 0.121, BY - 0.061, G + 0.02), (BX + 0.251, BY + 0.04, G + 0.025), (BX - 0.161, BY + 0.081, G + 0.02)],
                             [(BX - 0.181, BY - 0.031, G + 0.032), (BX + 0.121, BY - 0.061, G + 0.032), (BX + 0.251, BY + 0.04, G + 0.037), (BX - 0.161, BY + 0.081, G + 0.032)]],
     outline=0)
box('console', M['console'], BX - 0.02, BY + 0.02, G + 0.05, 0.07, 0.06, 0.06, rot_z=0.15, outline=0.005, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

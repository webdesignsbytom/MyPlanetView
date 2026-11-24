# A cartoon Medina Azahara for the country maps, built in the set's shared look (../toon.py): the
# ruined palace city of the Caliphs of Córdoba on its terraced hillside, the restored Hall of Abd
# al-Rahman III with its rows of horseshoe arches striped in red brick and cream stone, the low ruined
# walls and foundations of the city on the terraces below, cypresses, and the Sierra Morena behind.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P medina-azahara.py -- medina-azahara-1024.png 1024 medina-azahara.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#c8b888', shadow_mul=(0.84, 0.82, 0.78), lift=0.2),
    'terrace': toon('terrace', '#d8c898', lift=0.15),
    'stone': toon('stone', '#ecdcb8', shadow_mul=(0.86, 0.82, 0.8), lift=0.15),
    'brick': toon('brick', '#c4603e', lift=0.1),
    'ruin': toon('ruin', '#c8b48c'),
    'roof': toon('roof', '#b8603e'),
    'dark': flat('dark', '#2e2622'),
    'mountain': toon('mountain', '#7a8a5a', shadow_mul=(0.78, 0.82, 0.8)),
    'cypress': toon('cypress', '#2f5a34', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(936)

# ---------- the Sierra behind ----------
for k, (x, y, r, h) in enumerate(((-0.5, 0.85, 0.42, 0.36), (0.35, 0.92, 0.4, 0.3))):
    if math.hypot(x, y) + r > 1.36:
        r = 1.36 - math.hypot(x, y)
    mt = lathe(f'sierra{k}', M['mountain'], ((r, 0), (r * 0.72, h * 0.55), (r * 0.3, h * 0.9), (0.004, h)), G - 0.01, x, y, segs=16, outline=0.008)
    mt.visible_shadow = False

# ---------- the terraces stepping up the hillside ----------
T = [G]
TERRACES = []
for k, (y0, y1, h) in enumerate(((-0.9, 0.6, 0.06), (-0.4, 0.6, 0.06), (0.05, 0.6, 0.06))):
    xa = math.sqrt(max(0.0, 1.3 ** 2 - y0 * y0))
    w = min(1.8, 2 * xa - 0.1) - k * 0.2
    box(f'terrace{k}', M['terrace'], 0, (y0 + y1) / 2, G - 0.005 + k * 0.06, w, y1 - y0, h, outline=0.005, bevel=0)
    T.append(G + (k + 1) * 0.06 - 0.005)
    TERRACES.append((w / 2, y0, y1, T[-1]))


def terrace_top(x, y):
    """The height of the highest terrace under (x, y), else the ground."""
    for hw, y0, y1, z in reversed(TERRACES):
        if abs(x) <= hw and y0 <= y <= y1:
            return z
    return G


# the ruined walls and foundations on the lower terraces
for k in range(22):
    tier = rng.choice((0, 1))
    x = rng.uniform(-0.75, 0.75)
    y = rng.uniform(-0.85, -0.45) if tier == 0 else rng.uniform(-0.35, 0.0)
    if math.hypot(x, y) > 1.1:
        continue
    z = T[tier + 1]
    box(f'ruinwall{k}', M['ruin'], x, y, z, rng.uniform(0.1, 0.25), 0.03, rng.uniform(0.02, 0.06), rot_z=rng.choice((0.0, math.pi / 2)), outline=0.002, bevel=0)

# ---------- the Hall of Abd al-Rahman III on the top terrace ----------
HZ = T[3]
HX, HY = 0.0, 0.3
box('hallback', M['stone'], HX, HY + 0.14, HZ, 0.7, 0.2, 0.24, outline=0.007, bevel=0)
loft('hallroof', M['roof'], [[(HX - 0.36, HY - 0.2, HZ + 0.235), (HX + 0.36, HY - 0.2, HZ + 0.235), (HX + 0.36, HY + 0.25, HZ + 0.235), (HX - 0.36, HY + 0.25, HZ + 0.235)],
                             [(HX - 0.36, HY + 0.02, HZ + 0.31), (HX + 0.36, HY + 0.02, HZ + 0.31), (HX + 0.36, HY + 0.04, HZ + 0.31), (HX - 0.36, HY + 0.04, HZ + 0.31)]], outline=0.005)
# the row of horseshoe arches on its front, striped red and cream
AY = HY - 0.18
for j in range(7):
    x = HX - 0.3 + j * 0.1
    rod(f'column{j}', M['stone'], (x, AY, HZ), (x, AY, HZ + 0.13), 0.012, segs=8, outline=0.002)
for j in range(6):
    x = HX - 0.25 + j * 0.1
    box(f'archdark{j}', M['dark'], x, AY + 0.02, HZ, 0.08, 0.006, 0.14, outline=0, bevel=0)
    for k in range(7):
        a = math.pi * (-0.15 + 1.3 * k / 6)
        b = math.pi * (-0.15 + 1.3 * (k + 1) / 6)
        p0 = (x + 0.05 * math.cos(a), AY - 0.004, HZ + 0.17 + 0.05 * math.sin(a))
        p1 = (x + 0.05 * math.cos(b), AY - 0.004, HZ + 0.17 + 0.05 * math.sin(b))
        bar(f'voussoir{j}{k}', M['brick'] if k % 2 else M['stone'], p0, p1, 0.026, outline=0.001)
box('archtop', M['stone'], HX, AY, HZ + 0.22, 0.66, 0.04, 0.03, outline=0.003, bevel=0)
for s in (-1, 1):
    box(f'archwall{s}', M['stone'], HX + s * 0.33, AY + 0.08, HZ, 0.04, 0.2, 0.24, outline=0.003, bevel=0)

# ---------- cypresses ----------
for k, (x, y) in enumerate(((-0.75, 0.3), (0.75, 0.3), (-0.6, -0.2), (0.62, -0.25), (-0.3, -0.95), (0.35, -0.95))):
    lathe(f'cypress{k}', M['cypress'], ((0.035, 0), (0.045, 0.06), (0.03, 0.2), (0.004, 0.3)), terrace_top(x, y), x, y, segs=10, outline=0.006)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

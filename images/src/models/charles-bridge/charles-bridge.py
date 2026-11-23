# A cartoon Charles Bridge for the country maps, built in the set's shared look (../toon.py):
# Prague's Gothic stone bridge striding across the Vltava on its arches and cutwaters, its parapets
# lined with dark baroque statues, the Old Town Bridge Tower at one end with its steep roof and
# corner turrets, the Lesser Town's two towers at the other, and the houses of the banks. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P charles-bridge.py -- charles-bridge-1024.png 1024 charles-bridge.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'bank': toon('bank', '#d0c8b8', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'river': toon('river', '#4a8ab0', lift=0.3),
    'stone': toon('stone', '#b8a888', shadow_mul=(0.84, 0.84, 0.88), lift=0.06),
    'stoneDark': toon('stoneDark', '#8a7a64'),
    'statue': toon('statue', '#3a3632'),
    'roof': toon('roof', '#4a4a52'),
    'redroof': toon('redroof', '#c4603e'),
    'dark': flat('dark', '#2e2a28'),
    'ochre': toon('ochre', '#ecc888', lift=0.1),
    'cream': toon('cream', '#f0e6cc', lift=0.12),
    'pink': toon('pink', '#e8b0a0', lift=0.1),
    'window': flat('window', '#3a3a42'),
})

G = tile(M['bank'])
before = set(bpy.data.objects)


def vstrip(x0, x1, r, z, n=8):
    """The part of the tile between x0 and x1, counter-clockwise seen from above."""
    ya0, ya1 = math.sqrt(r * r - x0 * x0), math.sqrt(r * r - x1 * x1)
    b0, b1 = math.acos(x0 / r), math.acos(x1 / r)
    pts = [(x0, -ya0)]
    pts += [(r * math.cos(-b0 + (b0 - b1) * k / n), r * math.sin(-b0 + (b0 - b1) * k / n)) for k in range(1, n)]
    pts += [(x1, -ya1), (x1, ya1)]
    pts += [(r * math.cos(b1 + (b0 - b1) * k / n), r * math.sin(b1 + (b0 - b1) * k / n)) for k in range(1, n)]
    pts += [(x0, ya0)]
    return [(x, y, G + z) for x, y in pts]


loft('river', M['river'], [vstrip(-0.5, 0.5, 1.33, -0.004), vstrip(-0.5, 0.5, 1.33, 0.006)], outline=0.004)

# ---------- the bridge ----------
BY, D, H = 0.0, 0.11, 0.13
box('deck', M['stone'], 0.0, BY, G - 0.005, 1.36, D, H, outline=0.009, bevel=0)
for k in range(5):
    x = -0.4 + k * 0.2
    box(f'arch{k}', M['dark'], x, BY - D / 2 - 0.003, G - 0.005, 0.14, 0.006, 0.05, outline=0, bevel=0)
    cyl(f'archtop{k}', M['dark'], 0.07, 0.006, segs=18, outline=0, matrix=Matrix.Translation((x, BY - D / 2 - 0.003, G + 0.045)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for k in range(4):
    x = -0.3 + k * 0.2
    pyramid(f'cutwater{k}', M['stoneDark'], x, BY - D / 2 - 0.02, G - 0.005, 0.05, 0.07, outline=0.002)
for s in (-1, 1):
    box(f'parapet{s}', M['stone'], 0.0, BY + s * (D / 2 - 0.008), G + H - 0.005, 1.36, 0.016, 0.03, outline=0.002, bevel=0)
    for k in range(10):
        x = -0.54 + k * 0.12
        y = BY + s * (D / 2 - 0.008)
        box(f'plinth{s}{k}', M['stoneDark'], x, y, G + H + 0.02, 0.03, 0.03, 0.025, outline=0.001, bevel=0)
        lathe(f'statue{s}{k}', M['statue'], ((0.014, 0), (0.012, 0.045), (0.006, 0.06)), G + H + 0.044, x, y, segs=8, outline=0.001)
        ball(f'statuehead{s}{k}', M['statue'], x, y, G + H + 0.112, 0.009, outline=0)

# ---------- the Old Town Bridge Tower ----------
TX = 0.74
box('oldtower', M['stone'], TX, BY, G - 0.005, 0.15, 0.15, 0.4, outline=0.008, bevel=0)
box('oldgate', M['dark'], TX, BY - 0.078, G - 0.005, 0.07, 0.006, 0.12, outline=0, bevel=0)
cyl('oldgatetop', M['dark'], 0.035, 0.006, segs=12, outline=0, matrix=Matrix.Translation((TX, BY - 0.078, G + 0.115)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('oldtowerwin', M['window'], TX, BY - 0.078, G + 0.28, 0.035, 0.006, 0.06, outline=0, bevel=0)
pyramid('oldtowerroof', M['roof'], TX, BY, G + 0.395, 0.17, 0.26, outline=0.005)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'turret{sx}{sy}', M['roof'], ((0.016, 0), (0.004, 0.09)), G + 0.395, TX + sx * 0.075, BY + sy * 0.075, segs=8, outline=0.002, smooth=False)
# ---------- the Lesser Town towers ----------
for k, (x, h) in enumerate(((-0.74, 0.34), (-0.86, 0.26))):
    box(f'lesstower{k}', M['stone'], x, BY + (0.0 if k == 0 else 0.1), G - 0.005, 0.12, 0.12, h, outline=0.007, bevel=0)
    pyramid(f'lesstowerroof{k}', M['roof'], x, BY + (0.0 if k == 0 else 0.1), G + h - 0.005, 0.14, 0.18, outline=0.004)
box('lessgate', M['dark'], -0.74, BY - 0.063, G - 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)

# ---------- houses on the banks ----------
rng = random.Random(2411)
for s in (-1, 1):
    for k, y in enumerate((-0.55, -0.32, 0.3, 0.52)):
        x = s * rng.uniform(0.68, 0.8)
        if math.hypot(x, y) > 1.1:
            continue
        mat = ('ochre', 'cream', 'pink')[(k + (s > 0)) % 3]
        h = rng.uniform(0.14, 0.2)
        box(f'house{s}{k}', M[mat], x, y, G - 0.005, 0.2, 0.16, h, outline=0.005, bevel=0)
        for r in range(2):
            box(f'housewin{s}{k}{r}', M['window'], x, y - 0.083, G + 0.04 + r * 0.06, 0.12, 0.006, 0.025, outline=0, bevel=0)
        loft(f'houseroof{s}{k}', M['redroof'], [[(x - 0.1, y - 0.08, G + h - 0.005), (x + 0.1, y - 0.08, G + h - 0.005), (x + 0.1, y + 0.08, G + h - 0.005), (x - 0.1, y + 0.08, G + h - 0.005)],
                                                [(x - 0.1, y - 0.004, G + h + 0.07), (x + 0.1, y - 0.004, G + h + 0.07), (x + 0.1, y + 0.004, G + h + 0.07), (x - 0.1, y + 0.004, G + h + 0.07)]], outline=0.004)

turn(before, -20)
render(G)

# A cartoon Peleș Castle for the country maps, built in the set's shared look (../toon.py): the
# royal castle in the Carpathian forest, its stone ground floor and half-timbered upper storey,
# steep slate roofs, the tall main tower narrowing to its pointed spire, a round tower and corner
# turrets under their own spires, the terrace with its balustrade and statues in front, fir trees
# round it and the Bucegi mountains behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P peles-castle.py -- peles-castle-1024.png 1024 peles-castle.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'stone': toon('stone', '#d6c9ad', shadow_mul=(0.8, 0.78, 0.86)),
    'plaster': toon('plaster', '#efe6cf', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'timber': flat('timber', '#5a3d2b'),
    'slate': toon('slate', '#4f5560', shadow_mul=(0.75, 0.75, 0.85)),
    'window': flat('window', '#33303d'),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'fir': toon('fir', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'mountain': toon('mountain', '#7f8a96', shadow_mul=(0.75, 0.76, 0.86)),
    'snow': toon('snow', '#f7f8fb', shadow_mul=(0.80, 0.84, 0.95), lift=0.15),
    'lawn': toon('lawn', '#7cc061', lift=0.25),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(157)


def ring(cx, cy, rx, ry, z, jitter, sides=12):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


def ridge_roof(name, x, y, z, w, d, h):
    loft(name, M['slate'], [[(x - w / 2, y - d / 2, z), (x + w / 2, y - d / 2, z), (x + w / 2, y + d / 2, z), (x - w / 2, y + d / 2, z)],
                            [(x - w / 2 + 0.02, y - 0.004, z + h), (x + w / 2 - 0.02, y - 0.004, z + h), (x + w / 2 - 0.02, y + 0.004, z + h),
                             (x - w / 2 + 0.02, y + 0.004, z + h)]], outline=0.02)


def timbering(name, x0, x1, y, z0, z1, bay=0.09):
    """Half-timbering on a front face (y): posts, rails and a brace in every other bay."""
    n = max(1, round((x1 - x0) / bay))
    for k in range(n + 1):
        x = x0 + (x1 - x0) * k / n
        box(f'{name}post{k}', M['timber'], x, y, z0, 0.014, 0.008, z1 - z0, outline=0, bevel=0)
    for k, z in enumerate((z0, (z0 + z1) / 2, z1 - 0.012)):
        box(f'{name}rail{k}', M['timber'], (x0 + x1) / 2, y, z, x1 - x0, 0.008, 0.012, outline=0, bevel=0)
    for k in range(0, n, 2):
        xa, xb = x0 + (x1 - x0) * k / n, x0 + (x1 - x0) * (k + 1) / n
        bar(f'{name}brace{k}', M['timber'], (xa + 0.006, y, z0 + 0.008), (xb - 0.006, y, (z0 + z1) / 2), 0.011, outline=0)


# ---------- the Bucegi mountains and the fir forest behind ----------
for k, (cx, cy, r, h) in enumerate(((-0.5, 1.02, 0.42, 1.2), (0.35, 1.08, 0.4, 1.0))):
    body = loft(f'mountain{k}', M['mountain'], [ring(cx, cy, r, r * 0.6, 0.0, 0.0), ring(cx, cy, r * 0.6, r * 0.38, h * 0.5, 0.12),
                                                ring(cx, cy, r * 0.28, r * 0.18, h * 0.82, 0.12), ring(cx, cy, 0.02, 0.02, h, 0.0)], outline=0.035)
    cap = loft(f'snow{k}', M['snow'], [ring(cx, cy, r * 0.32, r * 0.2, h * 0.78, 0.14), ring(cx, cy, 0.02, 0.02, h + 0.01, 0.0)], outline=0.02)
    body.visible_shadow = cap.visible_shadow = False
for k in range(16):
    a = math.radians(rng.uniform(15, 165)) if k < 11 else math.radians(rng.choice((rng.uniform(195, 230), rng.uniform(310, 345))))
    r = rng.uniform(0.95, 1.25)
    x, y = r * math.cos(a), r * math.sin(a) * (0.95 if k < 11 else 0.9)
    h = rng.uniform(0.3, 0.45)
    rod(f'fir{k}', M['fir'], (x, y, G), (x, y, G + h), rng.uniform(0.08, 0.11), r2=0.0, segs=8, outline=0.018)

# ---------- the castle ----------
CX, CY, W, D = 0.0, 0.22, 0.92, 0.46
H1, H2 = 0.2, 0.2
FY = CY - D / 2
box('ground', M['stone'], CX, CY, G - 0.005, W, D, H1, outline=0.026, bevel=0.003)
box('upper', M['plaster'], CX, CY, G + H1, W - 0.02, D - 0.02, H2, outline=0.024, bevel=0.003)
ridge_roof('roof', CX, CY, G + H1 + H2, W + 0.04, D + 0.06, 0.3)
timbering('front', CX - W / 2 + 0.04, CX + W / 2 - 0.04, FY + 0.006, G + H1, G + H1 + H2)
for k in range(8):
    x = CX - 0.38 + k * 0.108
    if abs(x - 0.05) < 0.1:
        continue
    box(f'groundwin{k}', M['window'], x, FY - 0.004, G + 0.06, 0.04, 0.01, 0.08, outline=0, bevel=0)
    box(f'upperwin{k}', M['window'], x + 0.045, FY + 0.001, G + H1 + 0.05, 0.03, 0.01, 0.06, outline=0, bevel=0)
# two front gables, half-timbered
for k, gx in enumerate((-0.28, 0.36)):
    gy = FY + 0.08
    box(f'gable{k}', M['plaster'], gx, gy, G + H1 + H2 - 0.01, 0.2, 0.16, 0.14, outline=0.018, bevel=0)
    timbering(f'gable{k}', gx - 0.09, gx + 0.09, gy - 0.084, G + H1 + H2, G + H1 + H2 + 0.12, bay=0.06)
    loft(f'gableroof{k}', M['slate'], [[(gx - 0.12, gy - 0.1, G + H1 + H2 + 0.12), (gx + 0.12, gy - 0.1, G + H1 + H2 + 0.12),
                                        (gx + 0.12, gy + 0.1, G + H1 + H2 + 0.12), (gx - 0.12, gy + 0.1, G + H1 + H2 + 0.12)],
                                       [(gx - 0.004, gy - 0.09, G + H1 + H2 + 0.3), (gx + 0.004, gy - 0.09, G + H1 + H2 + 0.3),
                                        (gx + 0.004, gy + 0.09, G + H1 + H2 + 0.3), (gx - 0.004, gy + 0.09, G + H1 + H2 + 0.3)]], outline=0.016)
# the main tower, standing forward: stone, then half-timbered, then the tall spire
TX, TY = 0.05, FY - 0.02
box('tower', M['stone'], TX, TY, G - 0.005, 0.22, 0.22, 0.56, outline=0.024, bevel=0.003)
box('towerupper', M['plaster'], TX, TY, G + 0.55, 0.23, 0.23, 0.2, outline=0.022, bevel=0.003)
timbering('tower', TX - 0.1, TX + 0.1, TY - 0.119, G + 0.55, G + 0.75, bay=0.05)
box('towerdoor', M['window'], TX, TY - 0.112, G, 0.07, 0.01, 0.13, outline=0, bevel=0)
for k, z in enumerate((0.25, 0.4)):
    box(f'towerwin{k}', M['window'], TX, TY - 0.112, G + z, 0.035, 0.01, 0.07, outline=0, bevel=0)
pyramid('spire', M['slate'], TX, TY, G + 0.75, 0.27, 0.62, outline=0.02)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'pinnacle{sx}{sy}', M['slate'], ((0.025, 0), (0.002, 0.14)), G + 0.75, TX + sx * 0.12, TY + sy * 0.12, segs=8, outline=0.008,
              smooth=False)
rod('spiretip', M['gold'], (TX, TY, G + 1.36), (TX, TY, G + 1.45), 0.006, segs=6, outline=0)
# a round tower on the left and turrets at the corners
lathe('roundtower', M['stone'], ((0.1, 0), (0.1, 0.62)), G - 0.005, CX - W / 2 + 0.02, CY - 0.05, segs=20, outline=0.022)
lathe('roundtowerroof', M['slate'], ((0.12, 0), (0.06, 0.12), (0.004, 0.36)), G + 0.615, CX - W / 2 + 0.02, CY - 0.05, segs=20, outline=0.018)
for k in range(2):
    box(f'roundwin{k}', M['window'], CX - W / 2 + 0.02 - 0.03, CY - 0.05 - 0.098, G + 0.2 + k * 0.2, 0.035, 0.01, 0.07, outline=0, bevel=0)
for k, (x, y) in enumerate(((CX + W / 2 - 0.02, FY + 0.02), (CX + W / 2 - 0.02, CY + D / 2 - 0.02))):
    lathe(f'turret{k}', M['plaster'], ((0.05, 0), (0.05, 0.16)), G + H1 + H2 - 0.04, x, y, segs=8, outline=0.014, smooth=False)
    lathe(f'turretroof{k}', M['slate'], ((0.06, 0), (0.004, 0.24)), G + H1 + H2 + 0.12, x, y, segs=8, outline=0.012, smooth=False)

# ---------- the terrace in front: lawn, balustrade, statues ----------
box('terrace', M['lawn'], 0, -0.5, G - 0.005, 1.2, 0.5, 0.02, outline=0.012, bevel=0)
box('balustrade', M['white'], 0, -0.76, G + 0.015, 1.2, 0.03, 0.05, outline=0.01, bevel=0)
for k in range(13):
    rod(f'baluster{k}', M['white'], (-0.58 + k * 0.0967, -0.76, G + 0.015), (-0.58 + k * 0.0967, -0.76, G + 0.065), 0.008, segs=6, outline=0)
for k, x in enumerate((-0.45, -0.15, 0.25, 0.55)):
    box(f'plinth{k}', M['white'], x, -0.6, G + 0.015, 0.05, 0.05, 0.05, outline=0.008, bevel=0)
    rod(f'statue{k}', M['white'], (x, -0.6, G + 0.065), (x, -0.6, G + 0.13), 0.016, r2=0.012, segs=8, outline=0.006)
    ball(f'statuehead{k}', M['white'], x, -0.6, G + 0.145, 0.014, outline=0.004)

turn(before, -20)
render(G)

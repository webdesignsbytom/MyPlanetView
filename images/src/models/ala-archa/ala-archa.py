# A cartoon Tien Shan at Ala-Archa for the country maps, built in the set's shared look
# (../toon.py): Kyrgyzstan's gorge under snowy peaks, the glacial river running down between slopes
# of tall dark spruces, a white felt yurt with its red pattern in the meadow, and horses grazing.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P ala-archa.py -- ala-archa-1024.png 1024 ala-archa.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'slope': toon('slope', '#6a9a55', shadow_mul=(0.7, 0.78, 0.8)),
    'rock': toon('rock', '#8a8890', shadow_mul=(0.8, 0.8, 0.88)),
    'snow': toon('snow', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'river': toon('river', '#8ac0d8', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'spruce': toon('spruce', '#2a5a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6b5040'),
    'felt': toon('felt', '#f4efe2', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'feltRed': toon('feltRed', '#c8402f'),
    'window': flat('window', '#3a3640'),
    'horse': toon('horse', '#8a5a3a'),
    'horse2': toon('horse2', '#3a3230'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(809)


def ridge(name, cx, cy, rx, ry, h, k):
    rings = []
    for s, z in ((1.0, -0.01), (0.72, 0.3 * h), (0.48, 0.6 * h), (0.28, 0.82 * h), (0.06, h)):
        rings.append([(cx + s * rx * math.cos(t) * (1 + 0.07 * math.sin(3 * t + k)), cy + s * ry * math.sin(t) * (1 + 0.07 * math.cos(2 * t + k)), G + z)
                      for t in (2 * math.pi * j / 20 for j in range(20))])
    for part, mat, a, b in (('slope', 'slope', 0, 2), ('rock', 'rock', 1, 4), ('snow', 'snow', 3, 5)):
        piece = loft(f'{name}{part}', M[mat], rings[a:b], outline=0.025)
        piece.visible_shadow = False


ridge('left', -0.72, 0.25, 0.45, 0.72, 0.78, 1)
ridge('right', 0.72, 0.3, 0.42, 0.68, 0.7, 2)
ridge('back', 0.0, 0.98, 0.4, 0.22, 0.85, 3)

# ---------- the glacial river ----------
PATH = [(0.0, 0.78), (0.08, 0.5), (-0.05, 0.2), (0.05, -0.1), (-0.05, -0.4), (0.08, -0.7), (0.0, -1.0), (0.05, -1.25)]
bm = bmesh.new()
verts = []
for i, (x, y) in enumerate(PATH):
    (x0, y0), (x1, y1) = PATH[max(0, i - 1)], PATH[min(len(PATH) - 1, i + 1)]
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy)
    w = 0.03 + 0.03 * i / len(PATH)
    verts.append((bm.verts.new((x - dy / n * w, y + dx / n * w, G + 0.006)), bm.verts.new((x + dy / n * w, y - dx / n * w, G + 0.006))))
for (a0, a1), (b0, b1) in zip(verts, verts[1:]):
    bm.faces.new((a0, a1, b1, b0))
finish('river', bm, M['river'], outline=0.006)

# ---------- tall dark spruces on the lower slopes ----------
for k in range(18):
    side = -1 if k % 2 else 1
    x = side * rng.uniform(0.15, 0.28)
    y = rng.uniform(-0.75, 0.55)
    h = rng.uniform(0.2, 0.3)
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.04), 0.012, segs=6, outline=0.004)
    lathe(f'spruce{k}', M['spruce'], ((0.05, 0), (0.035, h * 0.4), (0.04, h * 0.4 + 0.01), (0.022, h * 0.75), (0.003, h)), G + 0.03, x, y, segs=10, outline=0.008,
          smooth=False)

# ---------- a yurt in the meadow ----------
YX, YY = -0.2, -0.55
lathe('yurt', M['felt'], ((0.13, 0), (0.13, 0.07), (0.1, 0.1), (0.04, 0.14), (0.02, 0.15)), G - 0.005, YX, YY, segs=18, outline=0.012)
lathe('yurtband', M['feltRed'], ((0.133, 0), (0.133, 0.02)), G + 0.045, YX, YY, segs=18, outline=0.003)
lathe('yurtcrown', M['feltRed'], ((0.025, 0), (0.025, 0.015)), G + 0.14, YX, YY, segs=12, outline=0.003)
box('yurtdoor', M['feltRed'], YX, YY - 0.128, G, 0.045, 0.01, 0.07, outline=0, bevel=0)


# ---------- horses grazing ----------
def horse(name, x, y, deg, mat):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    at = lambda dx, dy, z: (x + dx * c - dy * s, y + dx * s + dy * c, z)
    for k, (dx, dy) in enumerate(((-0.04, -0.015), (-0.04, 0.015), (0.04, -0.015), (0.04, 0.015))):
        rod(f'{name}leg{k}', M[mat], at(dx, dy, G), at(dx, dy, G + 0.07), 0.007, segs=6, outline=0.002)
    bx, by, _ = at(0, 0, 0)
    box(f'{name}body', M[mat], bx, by, G + 0.065, 0.11, 0.04, 0.045, rot_z=a, outline=0.006, bevel=0.014)
    rod(f'{name}neck', M[mat], at(0.045, 0, G + 0.09), at(0.075, 0, G + 0.05), 0.014, segs=6, outline=0.003)
    hx, hy, _ = at(0.085, 0, 0)
    box(f'{name}head', M[mat], hx, hy, G + 0.03, 0.04, 0.022, 0.025, rot_z=a, outline=0.003, bevel=0.006)


horse('horse1', 0.18, -0.4, 150, 'horse')
horse('horse2', 0.25, -0.7, 200, 'horse2')

turn(before, -20)
render(G)

# A cartoon Burj Khalifa for the country maps, built in the set's shared look (../toon.py):
# the silver-blue tower on its Y-shaped plan, three wings stepping back one after another in a
# spiral up the hexagonal core, then the long spire; at its foot the Dubai Fountain's lake,
# with palms.
# Run: blender -b --factory-startup -P burj-khalifa.py -- burj-khalifa-1024.png 1024 burj-khalifa.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'glass': toon('glass', '#b4cbdd', shadow_mul=(0.74, 0.78, 0.88), lift=0.35),
    'glassDark': toon('glassDark', '#8fa9bf', shadow_mul=(0.74, 0.78, 0.88), lift=0.3),
    'spire': toon('spire', '#d5dbe2', shadow_mul=(0.78, 0.8, 0.9), lift=0.3),
    'podium': toon('podium', '#d9cdb5'),
    'water': toon('water', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'palm': toon('palm', '#5fa04a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#9b6b43'),
})

G = tile()

# ---------- the lake in front, and the podium ----------
box('lake', M['water'], 0, -0.95, G - 0.004, 1.5, 0.5, 0.02, outline=0.012, bevel=0)
lathe('podium', M['podium'], ((0.55, 0), (0.55, 0.06)), G - 0.005, 0, 0.12, segs=6, outline=0.025, smooth=False)
B = G + 0.055
CX, CY = 0, 0.12

# ---------- the three wings, stepping back in a spiral ----------
TIER_H = 0.55
LENGTHS = (0.5, 0.43, 0.36, 0.3, 0.24, 0.18, 0.12)
WING_W = 0.17
for i in range(3):
    a = math.radians(90 + 120 * i)
    d = Vector((math.cos(a), math.sin(a), 0))
    z = B
    for k, length in enumerate(LENGTHS):
        h = TIER_H + (i * 0.18 if k == 0 else 0)   # each wing steps back a little higher than the last
        c = Vector((CX, CY, 0)) + d * (length / 2)
        box(f'wing{i}{k}', M['glass'] if k % 2 == 0 else M['glassDark'], c.x, c.y, z, length, WING_W, h, rot_z=a,
            outline=0.025, bevel=0.004)
        z += h
CORE_TOP = B + TIER_H * len(LENGTHS) + 0.5
lathe('core', M['glass'], ((0.11, 0), (0.1, CORE_TOP - B - 0.3), (0.06, CORE_TOP - B)), B, CX, CY, segs=6, outline=0.025,
      smooth=False)
rod('spire', M['spire'], (CX, CY, CORE_TOP - 0.02), (CX, CY, CORE_TOP + 1.2), 0.05, r2=0.006, segs=10, outline=0.016)

# ---------- palms round the lake ----------
for k, (x, y, lean) in enumerate(((-0.98, -0.62, -0.05), (0.98, -0.6, 0.05), (-0.95, 0.5, -0.04))):
    top = Vector((x + lean, y, G + 0.42))
    rod(f'trunk{k}', M['trunk'], (x, y, G), top, 0.03, r2=0.024, segs=8, outline=0.016)
    for j in range(6):
        a = 2 * math.pi * j / 6 + k
        rod(f'leaf{k}{j}', M['palm'], top, top + Vector((0.19 * math.cos(a), 0.19 * math.sin(a), -0.08)), 0.045, r2=0.0,
            segs=6, outline=0.015)
    ball(f'crown{k}', M['palm'], *top, 0.045, outline=0.015)

render(G)

# A cartoon Lumbini for the country maps, built in the set's shared look (../toon.py): the Buddha's
# birthplace, the white Maya Devi Temple over the ruins with its little gilded spire, the stepped
# sacred pool where his mother bathed, the Ashoka pillar behind its railing, and the Bodhi tree
# with strings of prayer flags running out from it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P lumbini.py -- lumbini-1024.png 1024 lumbini.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'brick': toon('brick', '#b8704a', shadow_mul=(0.86, 0.78, 0.76)),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'water': toon('water', '#4a9ab0', lift=0.3),
    'step': toon('step', '#c8b8a0'),
    'pillar': toon('pillar', '#a8a098', shadow_mul=(0.84, 0.84, 0.88)),
    'rail': toon('rail', '#6a6a70'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a5a4a'),
    'window': flat('window', '#3a3a44'),
    'f0': toon('f0', '#2f6fc0'), 'f1': toon('f1', '#f8f6f0', lift=0.2), 'f2': toon('f2', '#d83a2c'), 'f3': toon('f3', '#3f9a4a'), 'f4': toon('f4', '#f0c030', lift=0.2),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

# ---------- the Maya Devi Temple ----------
TX, TY = -0.15, 0.3
box('ruins', M['brick'], TX, TY, G - 0.005, 0.7, 0.5, 0.04, outline=0.006, bevel=0)
box('temple', M['white'], TX, TY, G + 0.035, 0.5, 0.36, 0.2, outline=0.01, bevel=0)
for j in range(5):
    box(f'templewin{j}', M['window'], TX - 0.2 + j * 0.1, TY - 0.182, G + 0.09, 0.04, 0.006, 0.06, outline=0, bevel=0)
box('templeband', M['white'], TX, TY, G + 0.23, 0.54, 0.4, 0.02, outline=0.004, bevel=0)
box('templeupper', M['white'], TX, TY, G + 0.25, 0.26, 0.2, 0.08, outline=0.006, bevel=0)
lathe('stupa', M['white'], ((0.08, 0), (0.08, 0.02), (0.06, 0.06), (0.03, 0.08)), G + 0.33, TX, TY, segs=16, outline=0.005)
lathe('spire', M['gold'], ((0.025, 0), (0.012, 0.08), (0.004, 0.14)), G + 0.41, TX, TY, segs=10, outline=0.003)
for s in (-1, 1):
    box(f'stairs{s}', M['step'], TX + s * 0.12, TY - 0.23, G - 0.005, 0.1, 0.1, 0.06, outline=0.003, bevel=0)

# ---------- the sacred pool ----------
PX, PY = -0.25, -0.4
for t in range(3):
    box(f'poolstep{t}', M['step'], PX, PY, G - 0.004 - t * 0.0, 0.7 - t * 0.08, 0.4 - t * 0.08, 0.02 - t * 0.004, outline=0.003, bevel=0)
box('poolwater', M['water'], PX, PY, G - 0.003, 0.5, 0.22, 0.032, outline=0.003, bevel=0)

# ---------- the Ashoka pillar ----------
AX, AY = 0.35, 0.15
rod('ashoka', M['pillar'], (AX, AY, G), (AX, AY, G + 0.42), 0.03, r2=0.024, segs=12, outline=0.005)
lathe('ashokatop', M['pillar'], ((0.03, 0), (0.035, 0.02), (0.02, 0.04)), G + 0.42, AX, AY, segs=12, outline=0.003)
for j in range(12):
    a = 2 * math.pi * j / 12
    rod(f'railpost{j}', M['rail'], (AX + 0.08 * math.cos(a), AY + 0.08 * math.sin(a), G), (AX + 0.08 * math.cos(a), AY + 0.08 * math.sin(a), G + 0.07), 0.005, segs=4, outline=0)
lathe('railtop', M['rail'], ((0.085, 0), (0.085, 0.01)), G + 0.065, AX, AY, segs=16, outline=0)

# ---------- the Bodhi tree and prayer flags ----------
BX, BY = 0.55, -0.35
rod('bodhitrunk', M['trunk'], (BX, BY, G), (BX, BY, G + 0.18), 0.035, r2=0.026, segs=8, outline=0.005)
for j, (dx, dy, dz, r) in enumerate(((0, 0, 0.28, 0.16), (0.1, 0.04, 0.24, 0.11), (-0.1, 0.02, 0.24, 0.11))):
    ball(f'bodhi{j}', M['tree'], BX + dx, BY + dy, G + dz, r, outline=0.009)
for line, (ex, ey) in enumerate(((-0.1, 0.0), (0.1, 0.7), (1.05, 0.2))):
    for k in range(8):
        t = (k + 0.5) / 8
        x = BX + (ex - BX) * t
        y = BY + (ey - BY) * t
        z = G + 0.2 - 0.07 * math.sin(math.pi * t)
        box(f'flag{line}{k}', M[f'f{(k + line) % 5}'], x, y, z - 0.035, 0.03, 0.006, 0.035, rot_z=math.atan2(ey - BY, ex - BX), outline=0, bevel=0)

turn(before, -20)
render(G)

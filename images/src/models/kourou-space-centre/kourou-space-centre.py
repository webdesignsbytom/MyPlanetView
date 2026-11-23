# A cartoon Guiana Space Centre for the country maps, built in the set's shared look (../toon.py):
# an Ariane rocket on its launch pad at Kourou, its white core stage and two boosters beside the
# grey umbilical mast, the lightning towers round the pad, the flame trench, a control building, and
# the rainforest all round. Turned a little towards the camera.
# Run: blender -b --factory-startup -P kourou-space-centre.py -- kourou-space-centre-1024.png 1024 kourou-space-centre.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'concrete': toon('concrete', '#c8c4bc', shadow_mul=(0.8, 0.8, 0.88), lift=0.2),
    'trench': flat('trench', '#4a4650'),
    'rocket': toon('rocket', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'booster': toon('booster', '#e8e4dc', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'band': toon('band', '#2a4a8a'),
    'nozzle': toon('nozzle', '#5a5e66', shadow_mul=(0.8, 0.8, 0.9)),
    'mast': toon('mast', '#8a8e96', shadow_mul=(0.8, 0.8, 0.88)),
    'red': toon('red', '#c8382c'),
    'forest': toon('forest', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'forestLight': toon('forestLight', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'building': toon('building', '#f2efe8', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'window': flat('window', '#3a3640'),
    'road': toon('road', '#8a8a86', lift=0.15),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(1117)

# ---------- the pad ----------
PX, PY = -0.05, 0.1
cyl('pad', M['concrete'], 0.55, 0.04, segs=24, outline=0.012, matrix=Matrix.Translation((PX, PY, G - 0.005)))
box('trench', M['trench'], PX - 0.05, PY - 0.35, G + 0.03, 0.18, 0.3, 0.008, outline=0, bevel=0)
box('road', M['road'], 0.75, -0.25, G - 0.004, 0.12, 0.9, 0.008, rot_z=0.5, outline=0.003, bevel=0)
Z = G + 0.035
box('table', M['nozzle'], PX, PY, Z - 0.005, 0.34, 0.24, 0.06, outline=0.01, bevel=0)
Z += 0.055

# ---------- the rocket: core stage and two boosters ----------
lathe('core', M['rocket'], ((0.075, 0), (0.075, 0.62)), Z, PX, PY, segs=20, outline=0.012)
lathe('fairing', M['rocket'], ((0.082, 0), (0.082, 0.14), (0.07, 0.2), (0.04, 0.25), (0.004, 0.28)), Z + 0.62, PX, PY, segs=20, outline=0.012)
for k, z in enumerate((0.4, 0.6)):
    lathe(f'coreband{k}', M['band'], ((0.077, 0), (0.077, 0.03)), Z + z, PX, PY, segs=20, outline=0.003)
lathe('corenozzle', M['nozzle'], ((0.03, 0), (0.05, -0.04)), Z, PX, PY, segs=12, outline=0.004)
for s in (-1, 1):
    bx = PX + s * 0.125
    lathe(f'booster{s}', M['booster'], ((0.048, 0), (0.048, 0.42), (0.036, 0.47), (0.004, 0.52)), Z, bx, PY, segs=16, outline=0.01)
    lathe(f'boosterband{s}', M['band'], ((0.05, 0), (0.05, 0.025)), Z + 0.3, bx, PY, segs=16, outline=0.003)
    lathe(f'boosternozzle{s}', M['nozzle'], ((0.03, 0), (0.045, -0.04)), Z, bx, PY, segs=12, outline=0.004)

# ---------- the umbilical mast and the lightning towers ----------
MX, MY = PX + 0.32, PY + 0.12
box('mast', M['mast'], MX, MY, Z - 0.005, 0.1, 0.1, 0.82, outline=0.01, bevel=0)
for k in range(8):
    box(f'mastfloor{k}', M['red'], MX, MY, Z + 0.08 + k * 0.095, 0.11, 0.11, 0.012, outline=0.003, bevel=0)
for k, z in enumerate((0.3, 0.55)):
    bar(f'arm{k}', M['mast'], (MX - 0.05, MY - 0.03, Z + z), (PX + 0.08, PY, Z + z), 0.025, outline=0.004)
for k in range(4):
    a = math.radians(45 + 90 * k)
    x, y = PX + 0.55 * math.cos(a), PY + 0.5 * math.sin(a)
    rod(f'lightning{k}', M['mast'], (x, y, G), (x, y, G + 0.7 if k < 2 else G + 0.62), 0.014, r2=0.008, segs=8, outline=0.004)
    ball(f'lightningtop{k}', M['red'], x, y, G + (0.7 if k < 2 else 0.62), 0.014, outline=0.003)

# ---------- the control building ----------
box('control', M['building'], 0.82, 0.62, G - 0.005, 0.3, 0.18, 0.1, rot_z=-0.4, outline=0.01, bevel=0)
for j in range(4):
    box(f'controlwin{j}', M['window'], 0.71 + j * 0.065, 0.585 - j * 0.028, G + 0.035, 0.035, 0.008, 0.03, rot_z=-0.4, outline=0, bevel=0)

# ---------- the rainforest round it ----------
for k in range(34):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.82, 1.28)
    x, y = r * math.cos(a), r * math.sin(a)
    if math.hypot(x - 0.82, y - 0.62) < 0.25 or (0.5 < x < 1.0 and -0.7 < y < 0.2):
        continue
    ball(f'tree{k}', M['forest' if k % 3 else 'forestLight'], x, y, G + 0.05, rng.uniform(0.08, 0.11), outline=0.012)

turn(before, -20)
render(G)

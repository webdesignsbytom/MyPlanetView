# A cartoon Phoenix Islands Protected Area for the country maps, built in the set's shared look
# (../toon.py): Kiribati's ring atoll in the open Pacific, a ring of white sand and palms round a
# turquoise lagoon, coral in the shallows, seabirds wheeling overhead, a reef shark's fin and a pod
# of dolphins in the deep blue. Turned a little towards the camera.
# Run: blender -b --factory-startup -P phoenix-islands.py -- phoenix-islands-1024.png 1024 phoenix-islands.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ocean': toon('ocean', '#1f6fa8', shadow_mul=(0.76, 0.82, 0.9), lift=0.35),
    'reef': toon('reef', '#5fc8d0', shadow_mul=(0.76, 0.86, 0.9), lift=0.3),
    'lagoon': toon('lagoon', '#7fdcd8', shadow_mul=(0.76, 0.86, 0.9), lift=0.3),
    'sand': toon('sand', '#f6ecd0', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'green': toon('green2', '#6aaa4a', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'bird': toon('bird', '#fbfbfd', shadow_mul=(0.84, 0.86, 0.94), lift=0.1),
    'shark': toon('shark', '#6a7480', shadow_mul=(0.8, 0.82, 0.9)),
    'dolphin': toon('dolphin', '#8a98a8', shadow_mul=(0.8, 0.82, 0.9)),
    'coral': toon('coral', '#f08a8a'),
})

G = tile(M['ocean'])
before = set(bpy.data.objects)
rng = random.Random(811)

AX, AY = 0.0, 0.15
ANGLES = [2 * math.pi * k / 28 for k in range(29)]


def band(name, mat, rin, rout, z0, z1):
    """A ring round the atoll, in four-sided pieces so no face folds."""
    for k, (t0, t1) in enumerate(zip(ANGLES, ANGLES[1:])):
        quad = [(AX + rin[0] * math.cos(t0), AY + rin[1] * math.sin(t0)), (AX + rout[0] * math.cos(t0), AY + rout[1] * math.sin(t0)),
                (AX + rout[0] * math.cos(t1), AY + rout[1] * math.sin(t1)), (AX + rin[0] * math.cos(t1), AY + rin[1] * math.sin(t1))]
        piece = loft(f'{name}{k}', M[mat], [[(x, y, z0) for x, y in quad], [(x, y, z1) for x, y in quad]], outline=0.008)
        piece.visible_shadow = False


# ---------- the reef, the lagoon inside it, and the ring of land ----------
cyl('reefflat', M['reef'], 1.0, 0.004, segs=40, outline=0.006, matrix=Matrix.Translation((AX, AY, G + 0.001)) @ Matrix.Scale(1.0, 4, (1, 0, 0)) @ Matrix.Scale(0.78, 4, (0, 1, 0)))
cyl('lagoon', M['lagoon'], 1.0, 0.004, segs=40, outline=0, matrix=Matrix.Translation((AX, AY, G + 0.004)) @ Matrix.Scale(0.62, 4, (1, 0, 0)) @ Matrix.Scale(0.46, 4, (0, 1, 0)))
band('sand', 'sand', (0.6, 0.44), (0.86, 0.66), G - 0.005, G + 0.03)
band('green', 'green', (0.66, 0.49), (0.8, 0.61), G + 0.02, G + 0.045)
for k in range(10):
    a = 2 * math.pi * k / 10 + 0.2
    x, y = AX + 0.73 * math.cos(a), AY + 0.55 * math.sin(a)
    h = rng.uniform(0.2, 0.27)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G + 0.04), (x + 0.03, y, G + 0.04 + h), 0.012, r2=0.009, segs=8, outline=0.005)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + 0.04 + h), (x + 0.03 + 0.085 * math.cos(b), y + 0.085 * math.sin(b), G + h - 0.01), 0.018, outline=0.004)
for k in range(10):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.15, 0.5)
    ball(f'coral{k}', M['coral'], AX + r * math.cos(a), AY + r * 0.72 * math.sin(a), G - 0.008, rng.uniform(0.02, 0.035), outline=0.004)

# ---------- seabirds wheeling overhead ----------
for k, (x, y, z, a) in enumerate(((-0.3, 0.2, 0.55, 0.3), (0.05, 0.35, 0.65, -0.2), (0.35, 0.1, 0.5, 0.6), (-0.1, -0.05, 0.45, 1.0))):
    for s in (-1, 1):
        bar(f'birdwing{k}{s}', M['bird'], (x, y, G + z), (x + s * 0.06 * math.cos(a), y + s * 0.06 * math.sin(a), G + z + 0.025), 0.014, outline=0.004)

# ---------- a reef shark's fin and dolphins in the deep blue ----------
SX, SY = 0.65, -0.85
loft('sharkfin', M['shark'], [[(SX - 0.05, SY - 0.006, G), (SX + 0.03, SY - 0.006, G), (SX - 0.03, SY - 0.006, G + 0.09)],
                              [(SX - 0.05, SY + 0.006, G), (SX + 0.03, SY + 0.006, G), (SX - 0.03, SY + 0.006, G + 0.09)]], outline=0.005)
for k, (x, y) in enumerate(((-0.6, -0.85), (-0.42, -0.95))):
    rings = []
    for j in range(7):
        t = j / 6
        z = 0.06 * math.sin(math.pi * t)
        r = 0.02 * math.sin(math.pi * min(1, t * 1.2)) + 0.004
        rings.append([(x - 0.1 + 0.2 * t, y + r * math.cos(u), G + z + r * math.sin(u)) for u in (2 * math.pi * i / 8 for i in range(8))])
    loft(f'dolphin{k}', M['dolphin'], rings, outline=0.005, smooth=True)

turn(before, -20)
render(G)

# A cartoon Bamiyan for the country maps, built in the set's shared look (../toon.py): the long
# sandstone cliff of the Bamiyan Valley with the two great empty niches where the giant Buddhas
# stood, the honeycomb of monks' caves cut round them, the green and golden fields and poplars of
# the valley floor, and the snowy Hindu Kush behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P bamiyan.py -- bamiyan-1024.png 1024 bamiyan.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#c8b888', shadow_mul=(0.84, 0.82, 0.8), lift=0.2),
    'cliff': toon('cliff', '#c8a878', shadow_mul=(0.86, 0.82, 0.76), lift=0.06),
    'cliffDark': toon('cliffDark', '#a8885a'),
    'dark': flat('dark', '#4a3828'),
    'field': toon('field', '#7cb85a'),
    'wheat': toon('wheat', '#e0c070'),
    'mountain': toon('mountain', '#8a8a96', shadow_mul=(0.8, 0.84, 0.92)),
    'snow': toon('snow', '#f6f8fa', lift=0.3),
    'poplar': toon('poplar', '#5a9a40', shadow_mul=(0.72, 0.8, 0.74)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(2563)

for k, (x, y, r, h) in enumerate(((-0.5, 0.8, 0.3, 0.62), (0.15, 0.95, 0.3, 0.72), (0.68, 0.7, 0.28, 0.58))):
    mt = lathe(f'mountain{k}', M['mountain'], ((r, 0), (r * 0.6, h * 0.55), (r * 0.28, h * 0.85), (0.004, h)), G - 0.01, x, y, segs=9, outline=0.008, smooth=False)
    mt.visible_shadow = False
    lathe(f'snow{k}', M['snow'], ((r * 0.47, 0), (r * 0.31, h * 0.15), (0.004, h * 0.3 + 0.012)), G - 0.01 + h * 0.7, x, y, segs=9, outline=0.004, smooth=False)

# ---------- the cliff ----------
CY, CH = 0.32, 0.5
cl = loft('cliff', M['cliff'], [[(-1.0, CY - 0.18, G - 0.01), (1.0, CY - 0.18, G - 0.01), (1.0, CY + 0.25, G - 0.01), (-1.0, CY + 0.25, G - 0.01)],
                                [(-0.95, CY - 0.12, G + CH), (0.95, CY - 0.12, G + CH), (0.95, CY + 0.22, G + CH), (-0.95, CY + 0.22, G + CH)]], outline=0.01)
cl.visible_shadow = False
for k in range(4):
    z = 0.1 + k * 0.11
    y = CY - 0.18 + 0.06 * (z / CH) - 0.004
    box(f'stratum{k}', M['cliffDark'], 0.0, y, G + z, 1.9, 0.008, 0.01, outline=0, bevel=0)


def face_y(z):
    return CY - 0.18 + 0.06 * (z / CH) - 0.006


# the two great niches
for k, (x, w, h) in enumerate(((-0.35, 0.16, 0.42), (0.38, 0.12, 0.3))):
    box(f'niche{k}', M['dark'], x, face_y(0.15), G - 0.005, w, 0.02, h, outline=0, bevel=0)
    cyl(f'nichetop{k}', M['dark'], w / 2, 0.02, segs=16, outline=0, matrix=Matrix.Translation((x, face_y(h), G + h - 0.005)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    box(f'nichefloor{k}', M['cliffDark'], x, face_y(0.0) - 0.03, G - 0.005, w + 0.04, 0.06, 0.02, outline=0.002, bevel=0)
# the caves
for k in range(40):
    x = rng.uniform(-0.85, 0.85)
    z = rng.uniform(0.05, 0.44)
    if abs(x + 0.35) < 0.12 or abs(x - 0.38) < 0.1:
        continue
    box(f'cave{k}', M['dark'], x, face_y(z), G + z, 0.025, 0.008, 0.03, outline=0, bevel=0)

# ---------- the valley floor ----------
for k in range(10):
    x = -0.85 + (k % 5) * 0.36 + rng.uniform(-0.03, 0.03)
    y = -0.65 + (k // 5) * 0.28
    if math.hypot(x, y) > 1.0:
        continue
    box(f'field{k}', M['field' if k % 3 else 'wheat'], x, y, G - 0.003, 0.3, 0.22, 0.01, outline=0.002, bevel=0)
for k in range(12):
    x = -0.9 + k * 0.16 + rng.uniform(-0.02, 0.02)
    y = -0.18 + rng.uniform(-0.04, 0.04)
    if math.hypot(x, y) > 1.0:
        continue
    lathe(f'poplar{k}', M['poplar'], ((0.03, 0), (0.035, 0.08), (0.004, 0.24)), G - 0.005, x, y, segs=8, outline=0.003)

turn(before, -20)
render(G)

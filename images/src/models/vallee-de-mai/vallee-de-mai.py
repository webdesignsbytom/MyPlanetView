# A cartoon Vallée de Mai for the country maps, built in the set's shared look (../toon.py): the
# palm forest of Praslin, tall coco de mer palms with their huge fan leaves, the famous double
# coconut lying on the ground, rounded granite boulders, a stream with a little footbridge, and a
# black parrot. Turned a little towards the camera.
# Run: blender -b --factory-startup -P vallee-de-mai.py -- vallee-de-mai-1024.png 1024 vallee-de-mai.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'floor': toon('floor', '#6aa452', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'trunk': toon('trunk', '#8a7a68', shadow_mul=(0.8, 0.78, 0.84)),
    'frond': toon('frond', '#3f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'frondLight': toon('frondLight', '#6ab85a', shadow_mul=(0.7, 0.78, 0.8)),
    'nut': toon('nut', '#5a4a32', shadow_mul=(0.82, 0.8, 0.86), lift=0.3),
    'granite': toon('granite', '#c9b8a8', shadow_mul=(0.8, 0.78, 0.86)),
    'water': toon('water', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'wood': toon('wood', '#9a6b43'),
    'parrot': toon('parrot', '#3a3238', lift=0.25),
    'beak': toon('beak', '#c9b8a8'),
})

G = tile(M['floor'])
before = set(bpy.data.objects)
rng = random.Random(317)


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


def fan(name, mat, x, y, z, a, size):
    """A great fan leaf: a pleated half-disc on its stalk, tilted out from the crown."""
    ca, sa = math.cos(a), math.sin(a)
    sx, sy, sz = x + ca * size * 0.55, y + sa * size * 0.55, z + size * 0.25
    rod(f'{name}stalk', M['trunk'], (x, y, z), (sx, sy, sz), 0.008, segs=6, outline=0.003)
    n = 9
    pts = [(0.0, 0.0)] + [(size * math.cos(t), size * math.sin(t)) for t in (math.pi * (0.1 + 0.8 * k / (n - 1)) for k in range(n))]
    # the fan stands up and leans outwards, its middle along the direction a
    world = []
    for u, v in pts:
        lean = 0.6
        dx = ca * (v * math.sin(lean)) - sa * (u - 0.0)
        dy = sa * (v * math.sin(lean)) + ca * (u - 0.0)
        dz = v * math.cos(lean)
        world.append((sx + dx, sy + dy, sz + dz))
    thick = [(p[0] + ca * 0.006, p[1] + sa * 0.006, p[2] - 0.004) for p in world]
    loft(f'{name}', M[mat], [world, thick], outline=0.008)


def coco_de_mer(name, x, y, h):
    rod(f'{name}trunk', M['trunk'], (x, y, G), (x + rng.uniform(-0.03, 0.03), y, G + h), 0.025, r2=0.02, segs=10, outline=0.01)
    for k in range(7):
        fan(f'{name}fan{k}', 'frondLight' if k % 3 == 0 else 'frond', x, y, G + h, 2 * math.pi * k / 7 + rng.uniform(-0.2, 0.2), rng.uniform(0.15, 0.2))


# ---------- the palms ----------
PALMS = [(-0.55, 0.55, 1.0), (0.2, 0.75, 1.1), (0.75, 0.35, 0.85), (-0.9, 0.0, 0.75), (-0.15, 0.15, 0.9), (0.55, -0.35, 0.65), (-0.6, -0.55, 0.6),
         (0.95, -0.05, 0.55)]
for k, (x, y, h) in enumerate(PALMS):
    coco_de_mer(f'palm{k}', x, y, h)

# ---------- the double coconut on the ground ----------
NX, NY = 0.08, -0.62
for s in (-1, 1):
    squashed(f'nut{s}', M['nut'], NX + s * 0.1, NY, G + 0.11, 0.13, 1.0, 0.85, 0.9, outline=0.018)

# ---------- granite boulders ----------
for k, (x, y, r) in enumerate(((-1.05, 0.55, 0.2), (1.1, 0.5, 0.16), (-0.3, -0.95, 0.13), (0.95, -0.7, 0.14), (-1.1, -0.4, 0.12))):
    b = squashed(f'boulder{k}', M['granite'], x, y, G + r * 0.45, r, 1.15, 1.0, 0.8, outline=0.02)
    b.visible_shadow = False

# ---------- a stream and its footbridge ----------
STREAM = [(-1.3, -0.15), (-0.75, -0.25), (-0.3, -0.25), (0.25, -0.15), (0.8, 0.05), (1.3, 0.2)]
for k, ((x0, y0), (x1, y1)) in enumerate(zip(STREAM, STREAM[1:])):
    box(f'stream{k}', M['water'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.002, math.hypot(x1 - x0, y1 - y0) + 0.08, 0.1, 0.008, rot_z=math.atan2(y1 - y0, x1 - x0),
        outline=0.008, bevel=0)
box('bridge', M['wood'], -0.45, -0.25, G + 0.02, 0.1, 0.22, 0.02, rot_z=0.1, outline=0.008, bevel=0)
for s in (-1, 1):
    box(f'bridgerail{s}', M['wood'], -0.45 + s * 0.045, -0.25, G + 0.04, 0.008, 0.22, 0.04, rot_z=0.1, outline=0, bevel=0)

# ---------- a black parrot on a stalk ----------
PX, PY, PZ = -0.15 + 0.1, 0.15 - 0.12, G + 0.9 + 0.06
squashed('parrot', M['parrot'], PX, PY, PZ, 0.035, 0.9, 0.9, 1.3, outline=0.008)
ball('parrothead', M['parrot'], PX + 0.012, PY - 0.012, PZ + 0.045, 0.022, outline=0.006)
rod('parrotbeak', M['beak'], (PX + 0.02, PY - 0.03, PZ + 0.045), (PX + 0.025, PY - 0.045, PZ + 0.03), 0.008, r2=0.002, segs=6, outline=0)
bar('parrottail', M['parrot'], (PX - 0.01, PY + 0.01, PZ - 0.03), (PX - 0.025, PY + 0.03, PZ - 0.08), 0.018, outline=0.004)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

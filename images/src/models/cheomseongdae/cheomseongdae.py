# A cartoon Cheomseongdae for the country maps, built in the set's shared look (../toon.py): Silla's
# bottle-shaped stone observatory in Gyeongju, its courses of granite blocks swelling and narrowing as
# they rise, the square window half-way up, the two-tiered square frame on its top, on its square
# base in the meadow, with the grassy royal tomb mounds of Daereungwon rising behind it and pines.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P cheomseongdae.py -- cheomseongdae-1024.png 1024 cheomseongdae.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'granite': toon('granite', '#d4ccbc', shadow_mul=(0.84, 0.84, 0.9), lift=0.15),
    'graniteDark': toon('graniteDark', '#b0a898'),
    'dark': flat('dark', '#2e2a2a'),
    'mound': toon('mound', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8)),
    'path': toon('path', '#d8c8a8'),
    'pine': toon('pine', '#3f7a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a4a36'),
    'flowers': toon('flowers', '#f0c840', lift=0.12),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(633)

# ---------- the tomb mounds behind ----------
for k, (x, y, r, h) in enumerate(((-0.6, 0.7, 0.42, 0.3), (0.25, 0.85, 0.36, 0.26), (0.85, 0.35, 0.3, 0.2))):
    mo = lathe(f'mound{k}', M['mound'], ((r, 0), (r * 0.9, h * 0.4), (r * 0.6, h * 0.82), (r * 0.25, h * 0.98), (0.004, h)), G - 0.01, x, y, segs=28, outline=0.008)
    mo.visible_shadow = False
box('path', M['path'], 0, -0.55, G - 0.004, 0.18, 0.7, 0.01, outline=0.001, bevel=0)
for k in range(10):
    x, y = rng.uniform(-0.95, 0.95), rng.uniform(-0.9, -0.2)
    if abs(x) < 0.25 or math.hypot(x, y) > 1.15:
        continue
    ball(f'flowers{k}', M['flowers'], x, y, G + 0.005, 0.03, outline=0.002)

# ---------- the observatory ----------
CX, CY = 0.0, 0.0
box('base2', M['graniteDark'], CX, CY, G - 0.005, 0.5, 0.5, 0.04, outline=0.005, bevel=0)
box('base1', M['granite'], CX, CY, G + 0.035, 0.42, 0.42, 0.04, outline=0.005, bevel=0)
Z0 = G + 0.075
COURSES = 27
H = 0.8


def radius(t):
    # wide at the foot, narrowing in a gentle curve to the neck
    return 0.18 - 0.09 * t ** 1.4 + 0.02 * math.sin(t * math.pi) * (1 - t)


for k in range(COURSES):
    t0, t1 = k / COURSES, (k + 1) / COURSES
    lathe(f'course{k}', M['granite'] if k % 2 else M['graniteDark'], ((radius(t0), 0), (radius(t1), H / COURSES)), Z0 + H * t0, CX, CY, segs=28, outline=0.004 if k in (0, COURSES - 1) else 0.0015, smooth=False)
# the square window half-way up, facing south (the camera)
box('window', M['dark'], CX, CY - radius(0.45) - 0.002, Z0 + H * 0.4, 0.09, 0.03, 0.09, outline=0, bevel=0)
# the two-tiered frame on the top, like the Chinese character for "well"
TZ = Z0 + H
for k, (w, z) in enumerate(((0.2, 0.0), (0.2, 0.04))):
    for s in (-1, 1):
        box(f'frameA{k}{s}', M['granite'], CX + s * (w / 2 - 0.015), CY, TZ + z, 0.03, w, 0.04, outline=0.003, bevel=0)
        box(f'frameB{k}{s}', M['granite'], CX, CY + s * (w / 2 - 0.015), TZ + z + (0.02 if k == 0 else 0.0), w, 0.03, 0.04 if k else 0.02, outline=0.003, bevel=0)

# ---------- pines ----------
for k, (x, y) in enumerate(((-0.85, -0.25), (0.85, -0.35), (-0.55, -0.8), (0.6, -0.8))):
    rod(f'pinetrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.16), 0.014, segs=6, outline=0.002)
    pn = ball(f'pine{k}', M['pine'], 0, 0, 0, 0.09, outline=0.01)
    pn.scale = (1.4, 1.3, 0.6)
    pn.location = (x + 0.02, y, G + 0.2)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

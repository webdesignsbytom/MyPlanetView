# A cartoon Skogskyrkogården for the country maps, built in the set's shared look (../toon.py): Stockholm's
# Woodland Cemetery, the stone Way of the Cross running up across the open grass to the great dark
# granite cross on its gentle rise, the Chapel of the Holy Cross with its long open portico of
# square columns beside the path, the Meditation Grove's mound with its square of elms on top, and
# the tall pine woods behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P skogskyrkogarden.py -- skogskyrkogarden-1024.png 1024 skogskyrkogarden.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#84bc5e', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'path': toon('path', '#d6cfc0', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'granite': toon('granite', '#4a4a50'),
    'stone': toon('stone', '#e2ddd2', shadow_mul=(0.82, 0.84, 0.9), lift=0.2),
    'roof': toon('roof', '#8a8e94'),
    'dark': flat('dark', '#2e2a2a'),
    'elm': toon('elm', '#5a9a44', shadow_mul=(0.7, 0.78, 0.8)),
    'pine': toon('pine', '#2f5e34', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a5a3e'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(1940)

# ---------- the gentle rise with the cross ----------
rise = lathe('rise', M['grass'], ((0.62, 0), (0.45, 0.04), (0.25, 0.075), (0.0, 0.09)), G - 0.01, -0.25, 0.05, segs=32, outline=0.005)
rise.visible_shadow = False
CXX, CYY, CZ = -0.25, 0.05, G + 0.075
bar('crossupright', M['granite'], (CXX, CYY, CZ), (CXX, CYY, CZ + 0.5), 0.05, outline=0.005)
bar('crossarm', M['granite'], (CXX - 0.13, CYY, CZ + 0.37), (CXX + 0.13, CYY, CZ + 0.37), 0.045, outline=0.005)
# the Way of the Cross: a stone path from the gate up past the cross
pts = [(0.15, -1.05), (0.05, -0.6), (-0.1, -0.25), (-0.18, -0.08)]
for k, ((x0, y0), (x1, y1)) in enumerate(zip(pts, pts[1:])):
    d = math.hypot(x1 - x0, y1 - y0)
    box(f'path{k}', M['path'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.004, 0.09, d + 0.02, 0.012, rot_z=math.atan2(-(x1 - x0), y1 - y0), outline=0.001, bevel=0)

# ---------- the Chapel of the Holy Cross and its portico ----------
PX, PY = 0.5, -0.1
box('chapel', M['stone'], PX + 0.05, PY + 0.12, G - 0.005, 0.32, 0.16, 0.18, outline=0.006, bevel=0)
box('chapelroof', M['roof'], PX + 0.05, PY + 0.12, G + 0.175, 0.34, 0.18, 0.02, outline=0.003, bevel=0)
box('porticoroof', M['stone'], PX - 0.02, PY - 0.05, G + 0.13, 0.5, 0.18, 0.03, outline=0.004, bevel=0)
box('porticofloor', M['stone'], PX - 0.02, PY - 0.05, G - 0.005, 0.5, 0.18, 0.015, outline=0.002, bevel=0)
for j in range(8):
    for row, y in enumerate((PY - 0.13, PY + 0.03)):
        box(f'portcol{j}{row}', M['stone'], PX - 0.25 + j * 0.066, y, G + 0.01, 0.018, 0.018, 0.12, outline=0.002, bevel=0)
box('impluvium', M['dark'], PX - 0.02, PY - 0.05, G + 0.155, 0.12, 0.06, 0.008, outline=0, bevel=0)
box('chapeldoor', M['dark'], PX + 0.05, PY + 0.039, G - 0.005, 0.06, 0.006, 0.11, outline=0, bevel=0)

# ---------- the Meditation Grove ----------
GX, GY = -0.45, 0.72
grove = lathe('grove', M['grass'], ((0.4, 0), (0.3, 0.08), (0.2, 0.15), (0.0, 0.16)), G - 0.01, GX, GY, segs=32, outline=0.005)
grove.visible_shadow = False
for i in range(3):
    for j in range(3):
        x, y = GX - 0.1 + i * 0.1, GY - 0.1 + j * 0.1
        rod(f'elmtrunk{i}{j}', M['trunk'], (x, y, G + 0.14), (x, y, G + 0.2), 0.01, segs=6, outline=0.001)
        ball(f'elm{i}{j}', M['elm'], x, y, G + 0.24, 0.055, outline=0.006)

# ---------- the pine woods behind ----------
for k in range(16):
    a = math.pi * (0.0 + k / 15)
    r = 1.05 + 0.15 * rng.random()
    x, y = r * math.cos(a), 0.1 + r * math.sin(a) * 0.95
    if math.hypot(x, y) > 1.22 or math.hypot(x - GX, y - GY) < 0.4:
        continue
    h = 0.4 + 0.15 * rng.random()
    rod(f'pinetrunk{k}', M['trunk'], (x, y, G), (x, y, G + h), 0.014, segs=6, outline=0.002)
    b = ball(f'pine{k}', M['pine'], 0, 0, 0, 0.09, outline=0.008)
    b.scale = (1.0, 1.0, 0.8)
    b.location = (x, y, G + h)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

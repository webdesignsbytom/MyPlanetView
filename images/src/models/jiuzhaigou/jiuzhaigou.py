# A cartoon Jiuzhaigou for the country maps, built in the set's shared look (../toon.py): the
# valley's lakes in turquoise and blue stepping down one below another over their travertine rims,
# the white curtains of the Nuorilang falls, autumn trees in red, orange and gold, and snowy peaks
# behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P jiuzhaigou.py -- jiuzhaigou-1024.png 1024 jiuzhaigou.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'forest': toon('forest', '#5a8a48', shadow_mul=(0.72, 0.8, 0.76), lift=0.2),
    'rim': toon('rim', '#e0d8b8', shadow_mul=(0.84, 0.84, 0.86), lift=0.1),
    'turq': toon('turq', '#3ac8c0', lift=0.3),
    'blue': toon('lakeBlue', '#2f8ad0', lift=0.3),
    'falls': toon('falls', '#ffffff', shadow_mul=(0.86, 0.9, 0.97), lift=0.15),
    'peak': toon('peak', '#7a7480', shadow_mul=(0.84, 0.84, 0.9)),
    'snow': toon('snow', '#fbfbfd', shadow_mul=(0.8, 0.86, 0.96), lift=0.15),
    't0': toon('t0', '#e8802c'), 't1': toon('t1', '#d8402c'), 't2': toon('t2', '#f0c030', lift=0.2), 't3': toon('t3', '#3f7a3a'),
    'trunk': toon('trunk', '#5a4a40'),
})

G = tile(M['forest'])
before = set(bpy.data.objects)
rng = random.Random(2251)

# ---------- snowy peaks behind ----------
for k, (x, y, r, h) in enumerate(((-0.6, 0.85, 0.38, 0.75), (0.15, 0.95, 0.42, 0.85), (0.8, 0.65, 0.34, 0.65))):
    lathe(f'peak{k}', M['peak'], ((r, 0), (r * 0.5, h * 0.55), (r * 0.12, h)), G - 0.01, x, y, segs=7, outline=0.012, smooth=False)
    lathe(f'peaksnow{k}', M['snow'], ((r * 0.52, 0), (r * 0.28, h * 0.25), (r * 0.125, h * 0.45 + 0.005)), G - 0.01 + h * 0.55, x, y, segs=7, outline=0.008, smooth=False)

# ---------- the stepped lakes ----------
LAKES = ((-0.45, 0.25, 0.32, 0.18, 0.3, 'turq'), (0.25, 0.15, 0.36, 0.2, 0.2, 'blue'), (-0.15, -0.3, 0.42, 0.22, 0.1, 'turq'), (0.55, -0.45, 0.3, 0.17, 0.02, 'blue'))
for k, (x, y, rx, ry, z, mat) in enumerate(LAKES):
    ring_lo = [(x + (rx + 0.04) * math.cos(t), y + (ry + 0.04) * math.sin(t), G - 0.01) for t in (2 * math.pi * j / 24 for j in range(24))]
    ring_hi = [(x + (rx + 0.03) * math.cos(t), y + (ry + 0.03) * math.sin(t), G + z) for t in (2 * math.pi * j / 24 for j in range(24))]
    loft(f'terrace{k}', M['rim'], [ring_lo, ring_hi], outline=0.008, smooth=True)
    lathe(f'lake{k}', M[mat], ((1.0, 0), (1.0, 0.012)), G + z - 0.004, 0, 0, segs=24, outline=0.002)
    lk = bpy.data.objects[f'lake{k}']
    lk.scale = (rx, ry, 1.0)
    lk.location = (x, y, 0)
    if k < 3:
        # a fall over the lower rim towards the next lake
        nx, ny = LAKES[k + 1][0], LAKES[k + 1][1]
        a = math.atan2(ny - y, nx - x)
        fx, fy = x + (rx + 0.03) * math.cos(a) * 0.9, y + (ry + 0.03) * math.sin(a) * 0.9
        for j in range(3):
            off = (j - 1) * 0.05
            bar(f'fall{k}{j}', M['falls'], (fx - off * math.sin(a), fy + off * math.cos(a), G + z), (fx - off * math.sin(a) + 0.02 * math.cos(a), fy + off * math.cos(a) + 0.02 * math.sin(a), G + LAKES[k + 1][4]), 0.035, outline=0.003)

# ---------- autumn trees ----------
for k in range(30):
    x, y = rng.uniform(-1.1, 1.1), rng.uniform(-1.0, 0.6)
    if math.hypot(x, y) > 1.18 or any(((x - lx) / (rx + 0.08)) ** 2 + ((y - ly) / (ry + 0.08)) ** 2 < 1 for lx, ly, rx, ry, _, _ in LAKES):
        continue
    rod(f'treetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.05), 0.01, segs=5, outline=0.002)
    if k % 4 == 3:
        lathe(f'tree{k}', M['t3'], ((0.05, 0), (0.004, 0.16)), G + 0.04, x, y, segs=7, outline=0.005)
    else:
        ball(f'tree{k}', M[f't{k % 3}'], x, y, G + 0.1, rng.uniform(0.05, 0.07), outline=0.006)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

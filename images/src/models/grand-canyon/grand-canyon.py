# A cartoon Grand Canyon for the country maps, built in the set's shared look (../toon.py): the far
# North Rim's cliffs stepping down in bands of red, orange and cream rock, two stepped buttes rising
# from the canyon, the green Colorado River winding along the bottom, and the South Rim's ledge in
# front with its pines and a lookout. Turned a little towards the camera.
# Run: blender -b --factory-startup -P grand-canyon.py -- grand-canyon-1024.png 1024 grand-canyon.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'floor': toon('floor', '#c88a5a', shadow_mul=(0.86, 0.76, 0.72), lift=0.15),
    'red': toon('red', '#c4573a', shadow_mul=(0.86, 0.74, 0.72)),
    'orange': toon('orange', '#e0904a', shadow_mul=(0.86, 0.76, 0.72)),
    'cream': toon('cream', '#ecd4a8', shadow_mul=(0.86, 0.8, 0.76), lift=0.1),
    'rust': toon('rust', '#a8503a', shadow_mul=(0.86, 0.74, 0.72)),
    'river': toon('river', '#3fa08a', lift=0.25),
    'pine': toon('pine', '#3f6a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'rail': toon('rail', '#6a5a50'),
})

G = tile(M['floor'])
before = set(bpy.data.objects)
rng = random.Random(2071)


def segment(c, r, z, n=30):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


def front(c, r, z, n=30):
    return [(x, -y, zz) for x, y, zz in reversed(segment(c, r, z, n))]


# ---------- the North Rim's bands ----------
R = 1.36
BANDS = ((0.05, 0.14, 'red'), (0.2, 0.28, 'orange'), (0.35, 0.4, 'cream'), (0.5, 0.52, 'rust'), (0.62, 0.62, 'red'))
for i, (c, h, mat) in enumerate(BANDS):
    b = loft(f'band{i}', M[mat], [segment(c, R, -0.01), segment(c, R, h)], outline=0.01)
    b.visible_shadow = False
    half = math.sqrt(R * R - c * c)
    for j in range(7):
        x = -half * 0.85 + j * half * 0.28 + rng.uniform(-0.04, 0.04)
        bar(f'gully{i}{j}', M['rust' if mat != 'rust' else 'red'], (x, c - 0.004, G + h - 0.02), (x, c - 0.004, G + h - 0.11 if h > 0.12 else G + 0.02), 0.035, outline=0)
for k in range(9):
    x = -0.9 + k * 0.22
    y = 0.85 + 0.15 * math.sin(k * 1.3)
    if math.hypot(x, y) > 1.28:
        continue
    lathe(f'rimpine{k}', M['pine'], ((0.05, 0), (0.004, 0.16)), G + 0.62, x, y, segs=8, outline=0.005)

# ---------- the buttes ----------
for k, (x, y, s) in enumerate(((-0.55, -0.15, 1.0), (0.5, -0.1, 0.85))):
    for j, (r, h, mat) in enumerate(((0.26, 0.1, 'red'), (0.2, 0.2, 'orange'), (0.15, 0.3, 'cream'), (0.1, 0.4, 'rust'))):
        lathe(f'butte{k}{j}', M[mat], ((r * s, 0), (r * s * 0.95, h * s)), G - 0.01, x, y, segs=7, outline=0.008, smooth=False)

# ---------- the Colorado River ----------
RIV = [(-1.3, -0.1), (-0.85, -0.38), (-0.2, -0.45), (0.15, -0.3), (0.75, -0.42), (1.3, -0.2)]
for k in range(len(RIV) - 1):
    (x0, y0), (x1, y1) = RIV[k], RIV[k + 1]
    a = math.atan2(y1 - y0, x1 - x0) + math.pi / 2
    w = 0.07
    quad = [(x0 - w * math.cos(a), y0 - w * math.sin(a)), (x1 - w * math.cos(a), y1 - w * math.sin(a)), (x1 + w * math.cos(a), y1 + w * math.sin(a)), (x0 + w * math.cos(a), y0 + w * math.sin(a))]
    loft(f'river{k}', M['river'], [[(x, y, G - 0.004) for x, y in quad], [(x, y, G + 0.004) for x, y in quad]], outline=0.003)
    if k:
        lathe(f'riverjoin{k}', M['river'], ((w, 0), (w, 0.008)), G - 0.004, x0, y0, segs=12, outline=0)

# ---------- the South Rim's ledge, its pines and the lookout ----------
ledge = loft('ledge', M['red'], [front(0.85, R, -0.01), front(0.85, R, 0.12)], outline=0.01)
ledge.visible_shadow = False
for k, x in enumerate((-0.45, -0.25, 0.35)):
    lathe(f'ledgepine{k}', M['pine'], ((0.06, 0), (0.004, 0.2)), G + 0.12, x, -1.05, segs=8, outline=0.005)
for j in range(5):
    x = -0.05 + j * 0.06
    rod(f'railpost{j}', M['rail'], (x, -0.88, G + 0.12), (x, -0.88, G + 0.18), 0.006, segs=4, outline=0)
bar('rail', M['rail'], (-0.05, -0.88, G + 0.18), (0.19, -0.88, G + 0.18), 0.008, outline=0)

turn(before, -20)
render(G)

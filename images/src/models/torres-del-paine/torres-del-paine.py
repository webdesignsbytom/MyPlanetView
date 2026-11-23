# A cartoon Torres del Paine for the country maps, built in the set's shared look (../toon.py): the
# three granite towers standing over their moraine, snow on their shoulders and a little glacier at
# their feet, the milky turquoise lake below, the golden Patagonian steppe in front, and a pair of
# guanacos. Turned a little towards the camera.
# Run: blender -b --factory-startup -P torres-del-paine.py -- torres-del-paine-1024.png 1024 torres-del-paine.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'steppe': toon('steppe', '#c8b070', shadow_mul=(0.86, 0.82, 0.72), lift=0.2),
    'tuft': toon('tuft', '#b8983a'),
    'moraine': toon('moraine', '#8a8278', shadow_mul=(0.84, 0.84, 0.9)),
    'granite': toon('granite', '#c8c0b8', shadow_mul=(0.82, 0.84, 0.9), lift=0.1),
    'capRock': toon('capRock', '#4a4044', shadow_mul=(0.84, 0.84, 0.9)),
    'snow': toon('snow', '#fbfbfd', shadow_mul=(0.8, 0.86, 0.96), lift=0.15),
    'ice': toon('ice', '#b8e8f0', lift=0.25),
    'lake': toon('lake', '#4ac8c0', shadow_mul=(0.78, 0.88, 0.9), lift=0.3),
    'guanaco': toon('guanaco', '#c88a50'),
    'belly': toon('belly', '#f2e6d0'),
})

G = tile(M['steppe'])
before = set(bpy.data.objects)
rng = random.Random(2143)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the moraine and the massif ----------
mor = loft('moraine', M['moraine'], [segment(0.1, 1.4, -0.01), segment(0.2, 1.36, 0.22), segment(0.35, 1.28, 0.3)], outline=0.014, smooth=True)
mor.visible_shadow = False
loft('glacier', M['ice'], [segment(0.36, 1.27, 0.295), segment(0.42, 1.23, 0.33)], outline=0.008, smooth=True)
T = G + 0.3

# ---------- the three towers ----------
for k, (x, h, lean) in enumerate(((-0.35, 0.78, -0.04), (0.0, 0.92, 0.0), (0.32, 0.82, 0.05))):
    y = 0.78
    rings = []
    for j, (r, z) in enumerate(((0.17, -0.02), (0.15, 0.25), (0.12, 0.5), (0.09, 0.72), (0.05, 0.85), (0.02, 0.92))):
        zz = z * h / 0.92
        rings.append([(x + lean * zz + r * math.cos(t + 0.3) * (1.0 + 0.15 * math.cos(3 * t)), y + r * math.sin(t + 0.3) * 0.8, T + zz) for t in (2 * math.pi * i / 7 for i in range(7))])
    tw = loft(f'tower{k}', M['granite'], rings[:4], outline=0.014)
    tw.visible_shadow = False
    cap = loft(f'towercap{k}', M['capRock'], rings[3:], outline=0.01)
    cap.visible_shadow = False
    b = ball(f'snowshoulder{k}', M['snow'], 0, 0, 0, 0.07, outline=0.006)
    b.scale = (1.4, 1.0, 0.5)
    b.location = (x + lean * h * 0.45 - 0.06, y - 0.08, T + h * 0.42)
lathe('glacierfoot', M['snow'], ((0.5, 0), (0.42, 0.03)), T - 0.01, 0.0, 0.78, segs=20, outline=0.006)

# ---------- the lake ----------


def ring(cx, cy, rx, ry, z, k, sides=24):
    return [(cx + rx * math.cos(t) * (1 + 0.05 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.05 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


loft('lake', M['lake'], [ring(0.0, -0.15, 0.8, 0.22, -0.004, 1), ring(0.0, -0.15, 0.8, 0.22, 0.004, 1)], outline=0.005, smooth=True)

# ---------- the steppe, tufts and guanacos ----------
for k in range(16):
    x, y = rng.uniform(-1.1, 1.1), rng.uniform(-1.05, -0.4)
    if math.hypot(x, y) > 1.2:
        continue
    lathe(f'tuft{k}', M['tuft'], ((0.04, 0), (0.004, 0.06)), G - 0.005, x, y, segs=5, outline=0.003, smooth=False)


def guanaco(name, x, y, a):
    ca, sa = math.cos(a), math.sin(a)
    for fx in (-0.04, 0.04):
        for s in (-1, 1):
            px, py = x + fx * ca - s * 0.02 * sa, y + fx * sa + s * 0.02 * ca
            rod(f'{name}leg{fx}{s}', M['guanaco'], (px, py, G), (px, py, G + 0.09), 0.009, segs=5, outline=0.002)
    b = ball(f'{name}body', M['guanaco'], 0, 0, 0, 0.045, outline=0.005)
    b.scale = (1.5, 0.75, 0.7)
    b.rotation_euler = (0, 0, a)
    b.location = (x, y, G + 0.115)
    b = ball(f'{name}belly', M['belly'], 0, 0, 0, 0.035, outline=0)
    b.scale = (1.5, 0.75, 0.5)
    b.rotation_euler = (0, 0, a)
    b.location = (x, y, G + 0.1)
    nx, ny = x + 0.06 * ca, y + 0.06 * sa
    rod(f'{name}neck', M['guanaco'], (nx, ny, G + 0.12), (nx + 0.015 * ca, ny + 0.015 * sa, G + 0.22), 0.015, segs=6, outline=0.003)
    b = ball(f'{name}head', M['guanaco'], 0, 0, 0, 0.022, outline=0.003)
    b.scale = (1.5, 0.8, 0.8)
    b.rotation_euler = (0, 0, a)
    b.location = (nx + 0.03 * ca, ny + 0.03 * sa, G + 0.225)
    for s in (-1, 1):
        rod(f'{name}ear{s}', M['guanaco'], (nx + 0.01 * ca - s * 0.01 * sa, ny + 0.01 * sa + s * 0.01 * ca, G + 0.235), (nx + 0.005 * ca - s * 0.012 * sa, ny + 0.005 * sa + s * 0.012 * ca, G + 0.26), 0.004, segs=4, outline=0)


guanaco('guanaco0', -0.3, -0.65, 0.3)
guanaco('guanaco1', 0.25, -0.75, math.pi - 0.2)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

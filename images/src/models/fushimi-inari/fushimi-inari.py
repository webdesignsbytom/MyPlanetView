# A cartoon Fushimi Inari for the country maps, built in the set's shared look (../toon.py): the
# Kyoto shrine's tunnel of vermilion torii gates winding up the wooded hill of Inari, the main hall
# under its sweeping roof at the foot, and the stone foxes guarding the way.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P fushimi-inari.py -- fushimi-inari-1024.png 1024 fushimi-inari.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'hill': toon('hill', '#3f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'tree': toon('tree', '#2f6a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'vermilion': toon('vermilion', '#e04a2a', shadow_mul=(0.86, 0.74, 0.72), lift=0.15),
    'black': toon('toriiBlack', '#2e2a30'),
    'path': toon('path2', '#d9c9a8', lift=0.25),
    'roof': toon('roof', '#4a4650'),
    'stone': toon('stone', '#b8b4ac', shadow_mul=(0.82, 0.82, 0.9)),
    'white': toon('white', '#f8f6f0', lift=0.2),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(1693)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- Mount Inari, wooded ----------
hill = loft('hill', M['hill'], [segment(0.0, 1.4, -0.01), segment(0.3, 1.32, 0.2), segment(0.6, 1.16, 0.38), segment(0.85, 0.95, 0.46)], outline=0.016, smooth=True)
hill.visible_shadow = False
for k in range(16):
    a = rng.uniform(math.radians(25), math.radians(155))
    f = rng.uniform(0.15, 0.9)
    r = 1.38 - f * 0.4
    x, y = r * math.cos(a), r * math.sin(a)
    z = 0.46 * f
    if abs(x) < 0.25:
        continue
    ball(f'tree{k}', M['tree'], x, y, G + z + 0.04, rng.uniform(0.07, 0.09), outline=0.011)


# ---------- the tunnel of torii, winding up the hill ----------
def torii(name, x, y, z, a, s=1.0):
    c, sn = math.cos(a + math.pi / 2), math.sin(a + math.pi / 2)
    w, h = 0.07 * s, 0.15 * s
    for side in (-1, 1):
        px, py = x + side * w * c, y + side * w * sn
        rod(f'{name}post{side}', M['vermilion'], (px, py, z), (px, py, z + h), 0.008 * s, segs=6, outline=0.002)
        rod(f'{name}foot{side}', M['black'], (px, py, z), (px, py, z + 0.02 * s), 0.009 * s, segs=6, outline=0)
    bar(f'{name}nuki', M['vermilion'], (x - w * c, y - w * sn, z + h * 0.78), (x + w * c, y + w * sn, z + h * 0.78), 0.01 * s, outline=0.002)
    bar(f'{name}kasagi', M['vermilion'], (x - w * 1.35 * c, y - w * 1.35 * sn, z + h), (x + w * 1.35 * c, y + w * 1.35 * sn, z + h), 0.016 * s, outline=0.002)
    bar(f'{name}kasagitop', M['black'], (x - w * 1.38 * c, y - w * 1.38 * sn, z + h + 0.012 * s), (x + w * 1.38 * c, y + w * 1.38 * sn, z + h + 0.012 * s), 0.007 * s, outline=0)


PATH = [(0.0, -0.55, 0.0), (0.05, -0.2, 0.0), (0.0, 0.1, 0.12), (0.12, 0.35, 0.22), (0.02, 0.6, 0.32), (-0.08, 0.85, 0.42)]
for k in range(len(PATH) - 1):
    (x0, y0, z0), (x1, y1, z1) = PATH[k], PATH[k + 1]
    bar(f'path{k}', M['path'], (x0, y0, G + z0 + 0.005), (x1, y1, G + z1 + 0.005), 0.2, outline=0.002)
    a = math.atan2(y1 - y0, x1 - x0)
    n = 6
    for j in range(n):
        f = j / n
        torii(f'torii{k}_{j}', x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, G + z0 + (z1 - z0) * f, a, s=1.5)

# ---------- the main hall at the foot, the stone foxes ----------
HX, HY = 0.0, -0.75
box('hall', M['vermilion'], HX, HY, G - 0.005, 0.36, 0.2, 0.1, outline=0.01, bevel=0)
box('hallwhite', M['white'], HX, HY - 0.102, G + 0.02, 0.3, 0.006, 0.05, outline=0, bevel=0)
loft('hallroof', M['roof'], [[(HX - 0.24, HY - 0.16, G + 0.09), (HX + 0.24, HY - 0.16, G + 0.09), (HX + 0.24, HY + 0.14, G + 0.09), (HX - 0.24, HY + 0.14, G + 0.09)],
                             [(HX - 0.18, HY - 0.006, G + 0.18), (HX + 0.18, HY - 0.006, G + 0.18), (HX + 0.18, HY + 0.006, G + 0.18), (HX - 0.18, HY + 0.006, G + 0.18)]],
     outline=0.009)
for s in (-1, 1):
    x = s * 0.25
    box(f'foxplinth{s}', M['stone'], x, -0.45, G - 0.005, 0.06, 0.06, 0.06, outline=0.004, bevel=0)
    lathe(f'fox{s}', M['stone'], ((0.022, 0), (0.018, 0.04), (0.012, 0.06)), G + 0.055, x, -0.45, segs=8, outline=0.003)
    ball(f'foxhead{s}', M['stone'], x, -0.455, G + 0.125, 0.014, outline=0.002)
    for e in (-1, 1):
        bar(f'foxear{s}{e}', M['stone'], (x + e * 0.006, -0.455, G + 0.13), (x + e * 0.008, -0.455, G + 0.15), 0.006, outline=0)

turn(before, -20)
render(G)

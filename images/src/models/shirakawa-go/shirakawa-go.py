# A cartoon Shirakawa-go for the country maps, built in the set's shared look (../toon.py): the
# village's gassho-zukuri farmhouses under their steep thatched roofs like hands joined in prayer,
# their dark timber walls, the rice paddies between them, and the forested mountains of the valley
# round them. Turned a little towards the camera.
# Run: blender -b --factory-startup -P shirakawa-go.py -- shirakawa-go-1024.png 1024 shirakawa-go.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paddy': toon('paddy', '#8ac850', shadow_mul=(0.72, 0.8, 0.72), lift=0.2),
    'paddyWater': toon('paddyWater', '#9ac8c8', lift=0.3),
    'mountain': toon('mountain', '#3f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'forest': toon('forest', '#2f6a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'thatch': toon('thatch', '#9a8462', shadow_mul=(0.86, 0.8, 0.74)),
    'thatchDark': toon('thatchDark', '#7a6648', shadow_mul=(0.86, 0.8, 0.74)),
    'timber': toon('timber', '#4a3a30'),
    'plaster': toon('plaster', '#ece6d8', lift=0.2),
    'window': flat('window', '#2e2a28'),
    'path': toon('path2', '#d9c9a8', lift=0.25),
})

G = tile(M['paddy'])
before = set(bpy.data.objects)
rng = random.Random(1709)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


mt = loft('mountains', M['mountain'], [segment(0.5, 1.38, -0.01), segment(0.68, 1.26, 0.38), segment(0.88, 1.06, 0.5)], outline=0.016, smooth=True)
mt.visible_shadow = False
for k in range(10):
    x = -0.95 + k * 0.21
    y = math.sqrt(max(0.0, 1.22 ** 2 - x * x)) * 0.82
    if y < 0.6:
        continue
    lathe(f'cedar{k}', M['forest'], ((0.06, 0), (0.004, 0.2)), G + 0.36, x, y, segs=10, outline=0.006)
box('path', M['path'], 0.0, -0.1, G - 0.004, 2.4, 0.08, 0.008, rot_z=0.12, outline=0.003, bevel=0)
for k, (x, y) in enumerate(((-0.6, -0.6), (0.0, -0.65), (0.55, -0.55), (-0.85, 0.2), (0.8, 0.15))):
    box(f'paddywater{k}', M['paddyWater'], x, y, G - 0.003, 0.4, 0.26, 0.008, outline=0.004, bevel=0)


def gassho(name, x, y, a, s=1.0):
    c, sn = math.cos(a), math.sin(a)
    w, d, h = 0.16 * s, 0.3 * s, 0.07 * s

    def p(u, v, z):
        return (x + u * c - v * sn, y + u * sn + v * c, G + z)

    box(name, M['timber'], x, y, G - 0.005, w, d, h, rot_z=a, outline=0.008, bevel=0)
    for j in range(3):
        box(f'{name}panel{j}', M['plaster'], *p(w / 2 + 0.004, -d / 3 + j * d / 3, 0)[:2], G + 0.015, 0.006, d / 4, h * 0.5, rot_z=a, outline=0, bevel=0)
    roof = loft(f'{name}roof', M['thatch'], [[p(-w / 2 - 0.03, -d / 2 - 0.03, h - 0.01), p(w / 2 + 0.03, -d / 2 - 0.03, h - 0.01), p(w / 2 + 0.03, d / 2 + 0.03, h - 0.01),
                                              p(-w / 2 - 0.03, d / 2 + 0.03, h - 0.01)],
                                             [p(-0.006, -d / 2 - 0.03, h + 0.28 * s), p(0.006, -d / 2 - 0.03, h + 0.28 * s), p(0.006, d / 2 + 0.03, h + 0.28 * s),
                                              p(-0.006, d / 2 + 0.03, h + 0.28 * s)]], outline=0.01)
    bar(f'{name}ridge', M['thatchDark'], p(0, -d / 2 - 0.03, h + 0.285 * s), p(0, d / 2 + 0.03, h + 0.285 * s), 0.025 * s, outline=0.003)
    for j in range(2):
        box(f'{name}gablewin{j}', M['window'], *p(0, -d / 2 - 0.034, 0)[:2], G + h + 0.06 * s + j * 0.08 * s, 0.03 * s, 0.006, 0.03 * s, rot_z=a, outline=0, bevel=0)


for k, (x, y, a, s) in enumerate(((-0.45, 0.25, 0.1, 1.2), (0.05, 0.35, 0.05, 1.3), (0.5, 0.3, -0.1, 1.15), (-0.25, -0.35, 0.15, 1.0), (0.3, -0.3, -0.05, 1.0))):
    gassho(f'gassho{k}', x, y, a, s)

turn(before, -20)
render(G)

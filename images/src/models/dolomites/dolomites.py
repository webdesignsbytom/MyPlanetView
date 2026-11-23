# A cartoon Dolomites for the country maps, built in the set's shared look (../toon.py): the Tre Cime
# di Lavaredo, three great blocky towers of pale rock rising from their scree, the green alpine
# meadow in front with a mountain hut under its red roof, the path winding to it, and larches.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P dolomites.py -- dolomites-1024.png 1024 dolomites.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'meadow': toon('meadow', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'scree': toon('scree', '#b8b0a2', shadow_mul=(0.84, 0.84, 0.9)),
    'rock': toon('dolomite', '#d8cfbc', shadow_mul=(0.84, 0.82, 0.88), lift=0.1),
    'rockDark': toon('dolomiteDark', '#b8ae98', shadow_mul=(0.84, 0.82, 0.88)),
    'hut': toon('hut', '#e8dcc0', lift=0.15),
    'roof': toon('roof', '#c4402c'),
    'wood': toon('wood', '#8a5a3a'),
    'path': toon('path2', '#d9c9a8', lift=0.25),
    'larch': toon('larch', '#3f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'window': flat('window', '#3a3640'),
})

G = tile(M['meadow'])
before = set(bpy.data.objects)
rng = random.Random(1667)


def ring(cx, cy, rx, ry, z, k, sides=22):
    return [(cx + rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the scree base ----------
sc = loft('scree', M['scree'], [ring(0.0, 0.5, 1.0, 0.55, -0.01, 1), ring(0.0, 0.55, 0.7, 0.36, 0.18, 1)], outline=0.016, smooth=True)
sc.visible_shadow = False


# ---------- the three towers: blocky, slightly tapering, crisp faces ----------
def tower(name, x, y, w, d, h, mat):
    loft(name, M[mat], [[(x - w / 2, y - d / 2, G + 0.12), (x + w / 2, y - d / 2, G + 0.12), (x + w / 2, y + d / 2, G + 0.12), (x - w / 2, y + d / 2, G + 0.12)],
                        [(x - w * 0.42, y - d * 0.4, G + h * 0.7), (x + w * 0.45, y - d * 0.42, G + h * 0.7), (x + w * 0.45, y + d * 0.42, G + h * 0.7),
                         (x - w * 0.42, y + d * 0.4, G + h * 0.7)],
                        [(x - w * 0.25, y - d * 0.22, G + h), (x + w * 0.3, y - d * 0.26, G + h), (x + w * 0.28, y + d * 0.24, G + h), (x - w * 0.24, y + d * 0.2, G + h)]],
         outline=0.016)
    for k in range(3):
        u = -w * 0.3 + k * w * 0.3
        bar(f'{name}crack{k}', M['rockDark'], (x + u, y - d * 0.5 + 0.004, G + 0.16), (x + u * 0.8, y - d * 0.4 + 0.004, G + h * 0.68), 0.022, outline=0)


tower('cimapiccola', 0.42, 0.5, 0.26, 0.22, 0.62, 'rock')
tower('cimagrande', 0.0, 0.58, 0.34, 0.28, 0.86, 'rock')
tower('cimaovest', -0.42, 0.52, 0.3, 0.26, 0.78, 'rockDark')

# ---------- the meadow: a path to the hut, larches ----------
PATH = [(-0.95, -0.75), (-0.5, -0.5), (-0.1, -0.45), (0.25, -0.25), (0.45, -0.05)]
for k in range(len(PATH) - 1):
    bar(f'path{k}', M['path'], (PATH[k][0], PATH[k][1], G - 0.004), (PATH[k + 1][0], PATH[k + 1][1], G - 0.004), 0.05, outline=0.002)
HX, HY = 0.55, -0.3
box('hut', M['hut'], HX, HY, G - 0.005, 0.2, 0.14, 0.09, outline=0.009, bevel=0)
box('hutupper', M['wood'], HX, HY, G + 0.085, 0.2, 0.14, 0.04, outline=0.005, bevel=0)
loft('hutroof', M['roof'], [[(HX - 0.12, HY - 0.085, G + 0.12), (HX + 0.12, HY - 0.085, G + 0.12), (HX + 0.12, HY + 0.085, G + 0.12), (HX - 0.12, HY + 0.085, G + 0.12)],
                            [(HX - 0.12, HY - 0.004, G + 0.18), (HX + 0.12, HY - 0.004, G + 0.18), (HX + 0.12, HY + 0.004, G + 0.18), (HX - 0.12, HY + 0.004, G + 0.18)]],
     outline=0.007)
for j in range(3):
    box(f'hutwin{j}', M['window'], HX - 0.06 + j * 0.06, HY - 0.074, G + 0.04, 0.025, 0.006, 0.03, outline=0, bevel=0)
for k in range(10):
    a = rng.uniform(math.radians(190), math.radians(350))
    r = rng.uniform(0.7, 1.22)
    x, y = r * math.cos(a), r * math.sin(a)
    lathe(f'larch{k}', M['larch'], ((0.05, 0), (0.004, 0.18)), G, x, y, segs=10, outline=0.006)

turn(before, -20)
render(G)

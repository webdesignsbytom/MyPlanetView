# A cartoon Kunta Kinteh Island for the country maps, built in the set's shared look (../toon.py):
# the little island in the wide Gambia river, the ruined fort's broken stone walls and a cannon,
# its baobabs, the river all round with a pirogue, and the mangrove shore of the mainland behind.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P kunta-kinteh-island.py -- kunta-kinteh-island-1024.png 1024 kunta-kinteh-island.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'river': toon('river', '#5a9ab8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'sand': toon('sand', '#e0cfa0', shadow_mul=(0.82, 0.8, 0.84), lift=0.2),
    'shore': toon('shore', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'stone': toon('stone', '#a88a6a', shadow_mul=(0.82, 0.78, 0.8)),
    'stoneDark': toon('stoneDark', '#8a6e54', shadow_mul=(0.82, 0.78, 0.8)),
    'baobab': toon('baobab', '#9a8270', shadow_mul=(0.8, 0.76, 0.8)),
    'leaf': toon('leaf', '#5f9e45', shadow_mul=(0.7, 0.78, 0.8)),
    'mangrove': toon('mangrove', '#3f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'gun': toon('gun', '#2e2e34'),
    'pirogue': toon('pirogue', '#c8402f'), 'pirogueIn': toon('pirogueIn', '#f2c84a'),
})

G = tile(M['river'])
before = set(bpy.data.objects)
rng = random.Random(757)


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- the mainland's mangrove shore at the back ----------
R = 1.42
back = [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(30, 151, 6)]
loft('mainland', M['shore'], [[(x, y, G - 0.01) for x, y in back], [(x, y, G + 0.03) for x, y in back]], outline=0.01).visible_shadow = False
for k in range(12):
    a = math.radians(38 + k * 9.5)
    x, y = 1.22 * math.cos(a), 1.22 * math.sin(a)
    ball(f'mangrove{k}', M['mangrove'], x, y, G + 0.1, rng.uniform(0.08, 0.1), outline=0.012)

# ---------- the island ----------
IX, IY = 0.0, -0.05
isl = loft('island', M['sand'], [[(IX + 0.62 * math.cos(t) * (1 + 0.06 * math.sin(3 * t)), IY + 0.42 * math.sin(t), G - 0.01) for t in (2 * math.pi * j / 22 for j in range(22))],
                                 [(IX + 0.56 * math.cos(t) * (1 + 0.06 * math.sin(3 * t)), IY + 0.37 * math.sin(t), G + 0.05) for t in (2 * math.pi * j / 22 for j in range(22))]],
           outline=0.014)
isl.visible_shadow = False
IZ = G + 0.05


# ---------- the fort's broken walls ----------
def broken_wall(name, p0, p1, hmin, hmax):
    (x0, y0), (x1, y1) = p0, p1
    length = math.hypot(x1 - x0, y1 - y0)
    a = math.atan2(y1 - y0, x1 - x0)
    n = max(2, int(length / 0.08))
    for k in range(n):
        t = (k + 0.5) / n
        box(f'{name}{k}', M['stone' if k % 3 else 'stoneDark'], x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, IZ - 0.005, length / n + 0.004, 0.06, rng.uniform(hmin, hmax), rot_z=a,
            outline=0.008, bevel=0)


F = [(-0.3, -0.25), (0.25, -0.22), (0.3, 0.15), (-0.25, 0.2)]
broken_wall('fortfront', F[0], F[1], 0.05, 0.16)
broken_wall('fortright', F[1], F[2], 0.08, 0.2)
broken_wall('fortback', F[2], F[3], 0.1, 0.22)
broken_wall('fortleft', F[3], F[0], 0.06, 0.18)
for k, (x, y) in enumerate(F):
    box(f'bastion{k}', M['stoneDark'], x, y, IZ - 0.005, 0.1, 0.1, 0.18 + 0.04 * (k % 2), rot_z=math.pi / 4, outline=0.008, bevel=0)
box('carriage', M['stoneDark'], -0.02, -0.32, IZ, 0.06, 0.05, 0.03, outline=0.004, bevel=0)
rod('cannon', M['gun'], (-0.02, -0.28, IZ + 0.04), (-0.02, -0.4, IZ + 0.045), 0.014, r2=0.011, segs=8, outline=0.003)

# ---------- baobabs on the island ----------
for k, (x, y, s) in enumerate(((0.42, 0.05, 1.0), (-0.45, 0.0, 0.8))):
    lathe(f'baobabtrunk{k}', M['baobab'], ((0.08 * s, 0), (0.1 * s, 0.06 * s), (0.09 * s, 0.16 * s), (0.06 * s, 0.24 * s)), IZ - 0.005, x, y, segs=12, outline=0.012)
    for j in range(5):
        a = 2 * math.pi * j / 5 + k
        end = (x + 0.14 * s * math.cos(a), y + 0.12 * s * math.sin(a), IZ + 0.33 * s)
        rod(f'branch{k}{j}', M['baobab'], (x, y, IZ + 0.23 * s), end, 0.022 * s, r2=0.012 * s, segs=6, outline=0.005)
        squashed(f'leaves{k}{j}', M['leaf'], end[0], end[1], end[2] + 0.015, 0.05 * s, 1.3, 1.3, 0.6, outline=0.008)

# ---------- a pirogue on the river ----------
PX, PY, PA = 0.55, -0.75, 0.3
c, s = math.cos(PA), math.sin(PA)
at = lambda dx, dy, z: (PX + dx * c - dy * s, PY + dx * s + dy * c, z)
loft('pirogue', M['pirogue'], [[at(-0.16, 0, G + 0.0), at(0, -0.03, G + 0.0), at(0.16, 0, G + 0.0), at(0, 0.03, G + 0.0)],
                               [at(-0.18, 0, G + 0.04), at(0, -0.04, G + 0.035), at(0.18, 0, G + 0.04), at(0, 0.04, G + 0.035)]], outline=0.006)
ix, iy, _ = at(0, 0, 0)
box('pirogueband', M['pirogueIn'], ix, iy, G + 0.03, 0.2, 0.05, 0.008, rot_z=PA, outline=0, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

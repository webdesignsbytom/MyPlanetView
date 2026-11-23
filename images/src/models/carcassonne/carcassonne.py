# A cartoon Carcassonne for the country maps, built in the set's shared look (../toon.py): the walled
# Cité on its hill, the low outer wall and the high inner wall ringed with round towers under
# pointed slate roofs, the Château Comtal and the basilica inside, and the vineyards round the hill.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P carcassonne.py -- carcassonne-1024.png 1024 carcassonne.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#8ab860', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'hill': toon('hill', '#7aa84a', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#d8ccb0', shadow_mul=(0.84, 0.82, 0.86), lift=0.1),
    'stoneDark': toon('stoneDark', '#b8aa90', shadow_mul=(0.84, 0.82, 0.86)),
    'slate': toon('slate', '#4a5264', shadow_mul=(0.8, 0.82, 0.9)),
    'roof': toon('roof', '#c4573a'),
    'vine': toon('vine', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'window': flat('window', '#3a3640'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(1543)

CX, CY = 0.0, 0.15
hill = loft('hill', M['hill'], [[(CX + 1.0 * math.cos(t), CY + 0.72 * math.sin(t), G - 0.01) for t in (2 * math.pi * j / 32 for j in range(32))],
                                [(CX + 0.82 * math.cos(t), CY + 0.6 * math.sin(t), G + 0.08) for t in (2 * math.pi * j / 32 for j in range(32))]], outline=0.014, smooth=True)
hill.visible_shadow = False
T = G + 0.08


def ring_wall(name, rx, ry, h, ntowers, th, tr, mat):
    n = 28
    pts = [(CX + rx * math.cos(2 * math.pi * j / n), CY + ry * math.sin(2 * math.pi * j / n)) for j in range(n)]
    for j in range(n):
        (x0, y0), (x1, y1) = pts[j], pts[(j + 1) % n]
        box(f'{name}wall{j}', M[mat], (x0 + x1) / 2, (y0 + y1) / 2, T - 0.01, math.hypot(x1 - x0, y1 - y0) + 0.01, 0.04, h, rot_z=math.atan2(y1 - y0, x1 - x0), outline=0.006,
            bevel=0)
    for k in range(ntowers):
        a = 2 * math.pi * k / ntowers + 0.2
        x, y = CX + rx * math.cos(a), CY + ry * math.sin(a)
        lathe(f'{name}tower{k}', M[mat], ((tr, 0), (tr, th)), T - 0.01, x, y, segs=14, outline=0.008)
        lathe(f'{name}cone{k}', M['slate'], ((tr * 1.1, 0), (0.004, tr * 2.2)), T - 0.01 + th, x, y, segs=14, outline=0.006)


ring_wall('outer', 0.78, 0.56, 0.08, 12, 0.13, 0.045, 'stoneDark')
ring_wall('inner', 0.58, 0.4, 0.15, 10, 0.22, 0.055, 'stone')

# ---------- inside: the Château Comtal and the basilica ----------
box('comtal', M['stone'], CX + 0.15, CY + 0.1, T - 0.01, 0.28, 0.2, 0.2, outline=0.01, bevel=0)
for k, (x, y) in enumerate(((CX + 0.02, CY + 0.0), (CX + 0.28, CY + 0.0), (CX + 0.28, CY + 0.2))):
    lathe(f'comtaltower{k}', M['stone'], ((0.045, 0), (0.045, 0.28)), T - 0.01, x, y, segs=14, outline=0.006)
    lathe(f'comtalcone{k}', M['slate'], ((0.05, 0), (0.004, 0.11)), T + 0.27, x, y, segs=14, outline=0.005)
box('basilica', M['stoneDark'], CX - 0.22, CY + 0.08, T - 0.01, 0.12, 0.28, 0.16, outline=0.009, bevel=0)
loft('basilicaroof', M['roof'], [[(CX - 0.28, CY - 0.06, T + 0.15), (CX - 0.16, CY - 0.06, T + 0.15), (CX - 0.16, CY + 0.22, T + 0.15), (CX - 0.28, CY + 0.22, T + 0.15)],
                                 [(CX - 0.222, CY - 0.06, T + 0.21), (CX - 0.218, CY - 0.06, T + 0.21), (CX - 0.218, CY + 0.22, T + 0.21), (CX - 0.222, CY + 0.22, T + 0.21)]],
     outline=0.006)
for k, (x, y) in enumerate(((CX - 0.05, CY - 0.18), (CX + 0.4, CY - 0.12), (CX - 0.4, CY - 0.1), (CX - 0.1, CY + 0.3))):
    box(f'house{k}', M['stone'], x, y, T - 0.01, 0.08, 0.07, 0.07, outline=0.005, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, T + 0.06, 0.09, 0.05, outline=0.004)

# ---------- vineyards round the hill ----------
for r in range(4):
    y = -0.75 - r * 0.1
    half = math.sqrt(max(0.0, 1.25 ** 2 - y ** 2)) - 0.05
    box(f'vinerow{r}', M['vine'], 0.0, y, G - 0.005, 2 * half, 0.04, 0.04, outline=0.004, bevel=0)

turn(before, -20)
render(G)

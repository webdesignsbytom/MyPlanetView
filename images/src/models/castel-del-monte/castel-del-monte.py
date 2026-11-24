# A cartoon Castel del Monte for the country maps, built in the set's shared look (../toon.py):
# Frederick II's mysterious castle on its hilltop in Apulia, a perfect octagon of pale honey stone
# with an octagonal tower at each of its eight corners, the marble Gothic portal with its gable on
# the front, the paired windows, and the olive groves on the slopes. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P castel-del-monte.py -- castel-del-monte-1024.png 1024 castel-del-monte.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#b8b878', shadow_mul=(0.8, 0.8, 0.82), lift=0.2),
    'hill': toon('hill', '#9aaa60', shadow_mul=(0.76, 0.8, 0.78)),
    'stone': toon('stone', '#e4d4ae', shadow_mul=(0.86, 0.84, 0.8), lift=0.1),
    'stoneDark': toon('stoneDark', '#c4b088'),
    'marble': toon('marble', '#d89878', lift=0.08),
    'dark': flat('dark', '#3a3028'),
    'olive': toon('olive', '#7a9a50', shadow_mul=(0.72, 0.8, 0.74)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(2503)

hl = lathe('hill', M['hill'], ((0.95, 0), (0.75, 0.08), (0.52, 0.13), (0.42, 0.14)), G - 0.01, 0.0, 0.1, segs=32, outline=0.01)
hl.visible_shadow = False
T = G + 0.13
CX, CY, R, H = 0.0, 0.12, 0.32, 0.27
ring = lambda r, z: [(CX + r * math.cos(math.radians(22.5 + 45 * k)), CY + r * math.sin(math.radians(22.5 + 45 * k)), z) for k in range(8)]
loft('octagon', M['stone'], [ring(R, T - 0.005), ring(R, T + H)], outline=0.009)
loft('octagontop', M['stoneDark'], [ring(R + 0.006, T + H - 0.01), ring(R + 0.006, T + H + 0.005)], outline=0.002)
for k in range(8):
    a = math.radians(22.5 + 45 * k)
    tx, ty = CX + R * math.cos(a), CY + R * math.sin(a)
    lathe(f'tower{k}', M['stone'], ((0.07, 0), (0.07, H + 0.03)), T - 0.005, tx, ty, segs=8, outline=0.005, smooth=False)
    lathe(f'towertop{k}', M['stoneDark'], ((0.074, 0), (0.074, 0.012)), T + H + 0.02, tx, ty, segs=8, outline=0.001, smooth=False)
    mid = math.radians(45 * k)
    fx, fy = CX + R * math.cos(math.radians(22.5)) * math.cos(mid), CY + R * math.cos(math.radians(22.5)) * math.sin(mid)
    if math.sin(mid) < 0.5:
        for j in (-1, 1):
            box(f'window{k}{j}', M['dark'], fx - 0.012 * j * math.sin(mid), fy + 0.012 * j * math.cos(mid), T + 0.19, 0.016, 0.006, 0.04, rot_z=mid + math.pi / 2, outline=0, bevel=0)
# the portal on the front face
PY = CY - R * math.cos(math.radians(22.5))
box('portal', M['marble'], CX, PY - 0.01, T - 0.005, 0.12, 0.03, 0.16, outline=0.004, bevel=0)
box('portaldoor', M['dark'], CX, PY - 0.027, T - 0.005, 0.05, 0.006, 0.1, outline=0, bevel=0)
for s in (-1, 1):
    rod(f'portalcol{s}', M['marble'], (CX + s * 0.045, PY - 0.03, T), (CX + s * 0.045, PY - 0.03, T + 0.14), 0.009, segs=8, outline=0.001)
loft('portalgable', M['marble'], [[(CX - 0.07, PY - 0.035, T + 0.155), (CX + 0.07, PY - 0.035, T + 0.155), (CX + 0.07, PY + 0.005, T + 0.155), (CX - 0.07, PY + 0.005, T + 0.155)],
                                  [(CX - 0.004, PY - 0.035, T + 0.21), (CX + 0.004, PY - 0.035, T + 0.21), (CX + 0.004, PY + 0.005, T + 0.21), (CX - 0.004, PY + 0.005, T + 0.21)]], outline=0.003)
for s in (-1, 1):
    for k in range(3):
        box(f'step{s}{k}', M['stoneDark'], CX + s * 0.06, PY - 0.06 - k * 0.025, T - 0.005 - k * 0.02, 0.08, 0.03, 0.02, outline=0.001, bevel=0)

for k in range(14):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.58, 0.95)
    x, y = r * math.cos(a), 0.1 + r * math.sin(a)
    if math.hypot(x, y) > 1.1:
        continue
    z = G + 0.13 * max(0.0, min(1.0, (0.95 - r) / 0.45))
    ball(f'olive{k}', M['olive'], x, y, z + 0.04, 0.055, outline=0.005)

turn(before, -20)
render(G)

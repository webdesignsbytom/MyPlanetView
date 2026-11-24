# A cartoon El Tajín for the country maps, built in the set's shared look (../toon.py): the Pyramid
# of the Niches in the Veracruz jungle, its six tiers each lined with rows of deep square niches
# under jutting cornices, the steep stairway up its front with its little altars, the shrine on top,
# and the trees of the rainforest round the clearing. Turned a little towards the camera.
# Run: blender -b --factory-startup -P el-tajin.py -- el-tajin-1024.png 1024 el-tajin.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'jungle': toon('jungle', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'clearing': toon('clearing', '#9ab860'),
    'stone': toon('stone', '#b8ac98', shadow_mul=(0.84, 0.84, 0.88), lift=0.06),
    'stoneDark': toon('stoneDark', '#948a76'),
    'red': toon('red', '#a84a3a'),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'treeDark': toon('treeDark', '#2f6a34', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['jungle'])
before = set(bpy.data.objects)
rng = random.Random(2627)
lathe('clearing', M['clearing'], ((0.72, 0), (0.72, 0.008)), G - 0.004, 0.0, 0.0, segs=32, outline=0.002)

PX, PY = 0.0, 0.08
w, z, th = 0.62, G - 0.005, 0.075
for i in range(6):
    box(f'tier{i}', M['stone'], PX, PY, z, w, w, th, outline=0.006, bevel=0)
    box(f'cornice{i}', M['stoneDark'], PX, PY, z + th - 0.01, w + 0.035, w + 0.035, 0.014, outline=0.002, bevel=0)
    n = max(3, int(w / 0.05))
    for side in range(3):
        a = -math.pi / 2 + (side - 1) * math.pi / 2
        nx, ny = math.cos(a), math.sin(a)
        for j in range(n):
            u = -w / 2 + (j + 0.5) * w / n
            if side == 1 and abs(u) < 0.08:
                continue
            box(f'niche{i}{side}{j}', M['dark'], PX + nx * (w / 2 + 0.003) - ny * u, PY + ny * (w / 2 + 0.003) + nx * u, z + 0.015, w / n * 0.55, 0.006, th * 0.55, rot_z=a + math.pi / 2, outline=0, bevel=0)
    z += th
    w -= 0.08
box('shrine', M['stone'], PX, PY, z - 0.005, w * 0.9, w * 0.9, 0.08, outline=0.005, bevel=0)
box('shrinedoor', M['dark'], PX, PY - w * 0.45 - 0.003, z, 0.04, 0.006, 0.05, outline=0, bevel=0)
box('shrinetop', M['red'], PX, PY, z + 0.07, w * 0.95, w * 0.95, 0.015, outline=0.002, bevel=0)
# the stairway with its altars
TOPZ = z
for i in range(14):
    t = (i + 1) / 14
    box(f'stair{i}', M['stoneDark'], PX, PY - 0.31 + t * 0.12 - 0.02, G - 0.005, 0.12, 0.03, (TOPZ - G) * t, outline=0.001, bevel=0)
for k in range(5):
    t = (k + 0.5) / 5
    box(f'altar{k}', M['stone'], PX, PY - 0.31 + t * 0.12 - 0.035, G + (TOPZ - G) * t, 0.05, 0.03, 0.03, outline=0.001, bevel=0)

# ---------- the rainforest ----------
n = 0
for k in range(200):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.76, 1.12)
    x, y = r * math.cos(a), r * math.sin(a)
    rr = rng.uniform(0.08, 0.13)
    ball(f'tree{k}', M['tree' if k % 2 else 'treeDark'], x, y, G + rr * 1.1, rr, outline=0.008)
    n += 1
    if n >= 22:
        break

turn(before, -20)
render(G)

# A cartoon Mount Kinabalu for the country maps, built in the set's shared look (../toon.py): the
# great bare granite summit plateau of Borneo's highest mountain with its jagged spires (Low's Peak,
# the Donkey's Ears), the cloud forest and rainforest climbing its flanks, a ring of cloud, and the
# climbers' hut on the trail. Turned a little towards the camera.
# Run: blender -b --factory-startup -P kinabalu.py -- kinabalu-1024.png 1024 kinabalu.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'forest': toon('forest', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'slope': toon('slope', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'granite': toon('granite', '#8a8682', shadow_mul=(0.84, 0.84, 0.9)),
    'graniteLight': toon('graniteLight', '#a8a49e', shadow_mul=(0.84, 0.84, 0.9)),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'treeDark': toon('treeDark', '#2f6a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'cloud': toon('cloud', '#ffffff', shadow_mul=(0.86, 0.9, 0.97), lift=0.1),
    'hut': toon('hut', '#c8402c'),
})

G = tile(M['forest'])
before = set(bpy.data.objects)
rng = random.Random(1861)


def ring(cx, cy, rx, ry, z, k, sides=24):
    return [(cx + rx * math.cos(t) * (1 + 0.07 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.07 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the mountain: forested flanks, then the bare granite ----------
MX, MY = 0.0, 0.3
fl = loft('flanks', M['slope'], [ring(MX, MY, 1.05, 0.75, -0.01, 1), ring(MX, MY + 0.05, 0.75, 0.52, 0.25, 1), ring(MX, MY + 0.08, 0.5, 0.35, 0.42, 1)], outline=0.018, smooth=True)
fl.visible_shadow = False
gr = loft('granite', M['granite'], [ring(MX, MY + 0.08, 0.5, 0.35, 0.415, 2), ring(MX, MY + 0.1, 0.42, 0.28, 0.55, 2), ring(MX, MY + 0.12, 0.34, 0.22, 0.58, 2)], outline=0.016)
gr.visible_shadow = False
for k, (dx, dy, h, r) in enumerate(((-0.25, 0.05, 0.2, 0.06), (-0.12, 0.12, 0.26, 0.07), (0.02, 0.08, 0.3, 0.07), (0.15, 0.14, 0.22, 0.06), (0.25, 0.05, 0.16, 0.05),
                                    (0.06, 0.2, 0.18, 0.05))):
    lathe(f'spire{k}', M['graniteLight' if k % 2 else 'granite'], ((r, 0), (r * 0.6, h * 0.6), (0.004, h)), G + 0.57, MX + dx, MY + 0.12 + dy, segs=5, outline=0.008,
          smooth=False)
for k in range(18):
    a = rng.uniform(math.radians(195), math.radians(345))
    f = rng.uniform(0.05, 0.85)
    rx, ry = 1.05 - f * 0.55, 0.75 - f * 0.4
    x, y = MX + rx * math.cos(a), MY + ry * math.sin(a)
    ball(f'flanktree{k}', M['tree' if k % 2 else 'treeDark'], x, y, G + 0.02 + f * 0.4, rng.uniform(0.06, 0.08), outline=0.01)
for k in range(10):
    a = rng.uniform(math.radians(200), math.radians(340))
    r = rng.uniform(1.05, 1.25)
    ball(f'lowtree{k}', M['treeDark'], r * math.cos(a), r * math.sin(a) * 0.8, G + 0.06, 0.08, outline=0.011)

# ---------- a ring of cloud, the climbers' hut ----------
for k in range(7):
    a = math.radians(200 + k * 22)
    b = ball(f'cloud{k}', M['cloud'], 0, 0, 0, 0.08, outline=0.01)
    b.scale = (1.6, 1.0, 0.6)
    b.location = (MX + 0.7 * math.cos(a), MY + 0.48 * math.sin(a), G + 0.32)
HX, HY = MX + 0.35, MY - 0.32
box('hut', M['hut'], HX, HY, G + 0.27, 0.08, 0.06, 0.05, outline=0.005, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

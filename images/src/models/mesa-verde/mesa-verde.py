# A cartoon Mesa Verde for the country maps, built in the set's shared look (../toon.py): Cliff
# Palace, the Ancestral Puebloans' village of sandstone rooms and round and square towers built into
# a great alcove under the overhanging rim of the mesa, its kivas sunk in front, juniper and pinyon
# on the mesa top and the canyon below. Turned a little towards the camera.
# Run: blender -b --factory-startup -P mesa-verde.py -- mesa-verde-1024.png 1024 mesa-verde.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'canyon': toon('canyon', '#b8986a', shadow_mul=(0.86, 0.8, 0.74), lift=0.2),
    'rock': toon('rock', '#d8a878', shadow_mul=(0.86, 0.78, 0.74)),
    'rockDark': toon('rockDark', '#a87850', shadow_mul=(0.86, 0.78, 0.74)),
    'alcove': toon('alcove', '#6a4a38'),
    'adobe': toon('adobe', '#e8c8a0', shadow_mul=(0.86, 0.82, 0.78), lift=0.1),
    'adobeDark': toon('adobeDark', '#c8a07a', shadow_mul=(0.86, 0.82, 0.78)),
    'window': flat('window', '#2e2420'),
    'juniper': toon('juniper', '#5a7a48', shadow_mul=(0.74, 0.8, 0.76)),
    'scrub': toon('scrub', '#8a9a58'),
})

G = tile(M['canyon'])
before = set(bpy.data.objects)
rng = random.Random(2257)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the cliff: a ledge, the alcove's back wall, and the overhanging rim ----------
ledge = loft('ledge', M['rockDark'], [segment(-0.05, 1.38, -0.01), segment(-0.02, 1.37, 0.16)], outline=0.012)
ledge.visible_shadow = False
back = loft('backwall', M['alcove'], [segment(0.32, 1.33, 0.14), segment(0.34, 1.32, 0.42)], outline=0.008)
back.visible_shadow = False
for s in (-1, 1):
    side = loft(f'cliffside{s}', M['rock'], [[(s * 0.75, -0.02, G + 0.14), (s * 1.2, -0.02, G + 0.14), (s * 1.15, 0.45, G + 0.14), (s * 0.75, 0.45, G + 0.14)],
                                              [(s * 0.78, 0.0, G + 0.62), (s * 1.18, 0.0, G + 0.62), (s * 1.12, 0.45, G + 0.62), (s * 0.8, 0.45, G + 0.62)]], outline=0.01)
    side.visible_shadow = False
rim = loft('overhang', M['rock'], [segment(0.08, 1.3, 0.48), segment(0.1, 1.28, 0.64)], outline=0.012)
rim.visible_shadow = False
for k in range(10):
    x, y = rng.uniform(-1.0, 1.0), rng.uniform(0.25, 1.05)
    if math.hypot(x, y) > 1.15:
        continue
    b = ball(f'juniper{k}', M['juniper'], 0, 0, 0, rng.uniform(0.05, 0.07), outline=0.006)
    b.scale = (1.2, 1.0, 0.8)
    b.location = (x, y, G + 0.68)

# ---------- the village in the alcove ----------
L = G + 0.155
for k, (x, y, w, h, mat) in enumerate(((-0.55, 0.22, 0.14, 0.12, 'adobe'), (-0.38, 0.24, 0.12, 0.18, 'adobeDark'), (-0.2, 0.2, 0.16, 0.1, 'adobe'), (0.05, 0.26, 0.12, 0.2, 'adobe'),
                                       (0.2, 0.2, 0.14, 0.13, 'adobeDark'), (0.38, 0.24, 0.12, 0.16, 'adobe'), (0.55, 0.2, 0.14, 0.1, 'adobeDark'))):
    box(f'room{k}', M[mat], x, y, L - 0.005, w, 0.12, h, outline=0.005, bevel=0)
    box(f'roomwin{k}', M['window'], x, y - 0.062, L + h * 0.5, 0.025, 0.006, 0.03, outline=0, bevel=0)
lathe('roundtower', M['adobe'], ((0.05, 0), (0.05, 0.3)), L - 0.005, -0.08, 0.18, segs=14, outline=0.005)
box('squaretower', M['adobeDark'], 0.3, 0.28, L - 0.005, 0.08, 0.08, 0.26, outline=0.005, bevel=0)
box('squaretowerwin', M['window'], 0.3, 0.239, L + 0.18, 0.025, 0.006, 0.03, outline=0, bevel=0)
for k, x in enumerate((-0.35, 0.0, 0.35)):
    lathe(f'kiva{k}', M['adobeDark'], ((0.07, 0), (0.07, 0.02)), L - 0.005, x, 0.04, segs=14, outline=0.003)
    lathe(f'kivapit{k}', M['window'], ((0.055, 0), (0.055, 0.022)), L - 0.004, x, 0.04, segs=14, outline=0)
for k in range(8):
    x, y = rng.uniform(-1.0, 1.0), rng.uniform(-0.9, -0.2)
    if math.hypot(x, y) > 1.15:
        continue
    ball(f'scrub{k}', M['scrub'], x, y, G + 0.03, 0.05, outline=0.005)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

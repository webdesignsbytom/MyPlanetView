# A cartoon Western Xia Imperial Tombs for the country maps, built in the set's shared look
# (../toon.py): the burial ground of the Tangut emperors at the foot of the Helan Mountains in
# Ningxia, China: the great earthen tomb towers, rammed-earth mounds rising in worn tiers like
# beehives, the low walls of their enclosures, the gate towers' stumps, and the bare blue-grey
# mountains behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P xixia-tombs.py -- xixia-tombs-1024.png 1024 xixia-tombs.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d6c296', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'mountain': toon('mountain', '#8a8c96', shadow_mul=(0.78, 0.78, 0.86)),
    'earth': toon('earth', '#c8a070', shadow_mul=(0.8, 0.74, 0.78), lift=0.12),
    'earthLight': toon('earthLight', '#d8b484', lift=0.15),
    'path': toon('path2', '#e2d4b4', lift=0.18),
    'shrub': toon('shrub', '#9aa860', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(1069411)

mt = loft('helan', M['mountain'], [[(-1.2, 0.6, G - 0.01), (1.2, 0.5, G - 0.01), (0.9, 1.0, G - 0.01), (-0.9, 1.05, G - 0.01)],
                                   [(-0.9, 0.8, G + 0.36), (0.85, 0.72, G + 0.34), (0.6, 0.9, G + 0.48), (-0.6, 0.94, G + 0.4)]], outline=0.007)
mt.visible_shadow = False


def tomb(name, x, y, r, h):
    """A rammed-earth tomb tower: worn tiers narrowing up to a rounded top."""
    prof = [(r, 0)]
    for k in range(5):
        z = h * (k + 1) / 6
        rr = r * (1 - 0.15 * (k + 1))
        prof += [(rr + 0.012, z - 0.012), (rr, z)]
    prof += [(r * 0.15, h * 0.97), (0.0, h)]
    lathe(name, M['earth'], prof, G - 0.005, x, y, segs=10, outline=0.006, smooth=False)


# ---------- the tomb towers and their enclosures ----------
for k, (x, y, r, h) in enumerate(((-0.25, 0.15, 0.2, 0.42), (0.45, 0.2, 0.15, 0.32), (-0.7, -0.15, 0.12, 0.24))):
    tomb(f'tomb{k}', x, y, r, h)
    W = r * 3.2
    for j, (dx, dy, sx, sy) in enumerate(((0, -W / 2, W, 0.04), (-W / 2, 0, 0.04, W), (W / 2, 0, 0.04, W))):
        if k == 0 or j != 1:
            box(f'encl{k}{j}', M['earthLight'], x + dx, y - 0.1 + dy, G - 0.005, sx, sy, 0.05 + 0.02 * rng.random(), outline=0.003, bevel=0)
    for s in (-1, 1):
        lathe(f'gatestump{k}{s}', M['earthLight'], ((0.04, 0), (0.03, 0.1)), G - 0.005, x + s * 0.08, y - 0.1 - W / 2 - 0.1, segs=8, outline=0.003, smooth=False)
box('path', M['path'], -0.25, -0.75, G - 0.004, 0.12, 0.5, 0.008, outline=0.001, bevel=0)
for k, (x, y) in enumerate(((0.75, -0.45), (0.35, -0.7), (-0.95, -0.55), (0.95, 0.0))):
    b = ball(f'shrub{k}', M['shrub'], 0, 0, 0, 0.05, outline=0.004)
    b.scale = (1.2, 1.0, 0.6)
    b.location = (x, y, G + 0.015)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

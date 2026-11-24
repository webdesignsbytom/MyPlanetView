# A cartoon Ring of Brodgar for the country maps, built in the set's shared look (../toon.py): the
# great Neolithic stone circle on Orkney, its thin tall slabs of grey sandstone standing round the
# heathery circle (some fallen, some broken stumps), the ditch round it, on the narrow neck of land
# between the lochs of Harray and Stenness, with the Comet Stone and the Stones of Stenness beyond.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P ring-of-brodgar.py -- ring-of-brodgar-1024.png 1024 ring-of-brodgar.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'heath': toon('heath', '#8a9a5a', shadow_mul=(0.76, 0.8, 0.78), lift=0.2),
    'heather': toon('heather', '#8a6a8a', lift=0.08),
    'loch': toon('loch', '#5a8aa8', lift=0.3),
    'ditch': toon('ditch', '#6a7a4a'),
    'stone': toon('stone', '#8a8a86', shadow_mul=(0.84, 0.84, 0.9), lift=0.12),
    'stoneDark': toon('stoneDark', '#6a6a68'),
    'lichen': toon('lichen', '#c8c070'),
})

G = tile(M['heath'])
before = set(bpy.data.objects)
rng = random.Random(2500)


def vstrip(x0, x1, r, z, n=8):
    """The band of the tile's disc between x0 and x1 (counter-clockwise from above)."""
    ya0, ya1 = math.sqrt(r * r - x0 * x0), math.sqrt(r * r - x1 * x1)
    b0, b1 = math.acos(x0 / r), math.acos(x1 / r)
    pts = [(x0, -ya0)]
    pts += [(r * math.cos(-b0 + (b0 - b1) * k / n), r * math.sin(-b0 + (b0 - b1) * k / n)) for k in range(1, n)]
    pts += [(x1, -ya1), (x1, ya1)]
    pts += [(r * math.cos(b1 + (b0 - b1) * k / n), r * math.sin(b1 + (b0 - b1) * k / n)) for k in range(1, n)]
    pts += [(x0, ya0)]
    return [(x, y, z) for x, y in pts]


# the two lochs either side of the neck of land
loft('harray', M['loch'], [vstrip(-1.41, -0.85, 1.42, G - 0.004), vstrip(-1.41, -0.85, 1.42, G + 0.004)], outline=0)
loft('stenness', M['loch'], [vstrip(0.85, 1.41, 1.42, G - 0.004), vstrip(0.85, 1.41, 1.42, G + 0.004)], outline=0)

# ---------- the ditch and the circle ----------
CX, CY = 0.0, 0.0
R = 0.6
lathe('ditch', M['ditch'], ((R + 0.12, 0), (R + 0.12, 0.006), (R + 0.06, 0.006), (R + 0.06, 0.0)), G - 0.002, CX, CY, segs=48, outline=0.002, smooth=False)
for k in range(14):
    ball(f'heather{k}', M['heather'], CX + rng.uniform(-0.4, 0.4), CY + rng.uniform(-0.4, 0.4), G, rng.uniform(0.04, 0.07), outline=0.002)
N = 27
for k in range(N):
    a = 2 * math.pi * k / N + rng.uniform(-0.03, 0.03)
    x, y = CX + R * math.cos(a), CY + R * math.sin(a)
    kind = rng.random()
    if kind < 0.15:
        continue   # a gap where a stone has gone
    if kind < 0.3:
        # a broken stump
        h = rng.uniform(0.04, 0.08)
    else:
        h = rng.uniform(0.2, 0.36)
    tilt = rng.uniform(-0.12, 0.12)
    st = box(f'stone{k}', M['stone'] if k % 3 else M['stoneDark'], 0, 0, 0, 0.06, 0.022, h, rot_z=0, outline=0.004, bevel=0)
    lich = box(f'lichen{k}', M['lichen'], 0, -0.012, h * 0.4, 0.03, 0.004, 0.03, outline=0, bevel=0)
    bpy.context.view_layer.update()
    m = Matrix.Translation((x, y, G - 0.01)) @ Matrix.Rotation(a + math.pi / 2, 4, 'Z') @ Matrix.Rotation(tilt, 4, 'X')
    for o in (st, lich):
        o.matrix_world = m @ o.matrix_world
bpy.context.view_layer.update()

# ---------- the Comet Stone and two of the Stones of Stenness beyond ----------
box('cometstone', M['stone'], 0.55, -0.85, G - 0.005, 0.07, 0.03, 0.22, rot_z=0.3, outline=0.004, bevel=0)
for k, (x, y, h) in enumerate(((0.2, 0.95, 0.42), (-0.15, 1.0, 0.36))):
    box(f'stenness{k}', M['stone'], x, y, G - 0.005, 0.1, 0.03, h, rot_z=0.2 * (k - 0.5), outline=0.005, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

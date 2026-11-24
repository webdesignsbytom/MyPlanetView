# A cartoon SGang Gwaay for the country maps, built in the set's shared look (../toon.py): the old Haida
# village on its island off Haida Gwaii, the weathered grey cedar totem and mortuary poles still
# standing in a row along the edge of the forest, carved with stacked faces and leaning a little,
# moss on their heads, the fallen beams of the longhouses in the grass, the dark spruce forest
# behind and the beach and the sea in front. Turned a little towards the camera.
# Run: blender -b --factory-startup -P sgang-gwaay.py -- sgang-gwaay-1024.png 1024 sgang-gwaay.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#78aa58', shadow_mul=(0.7, 0.78, 0.8), lift=0.18),
    'beach': toon('beach', '#d8ccb0', lift=0.18),
    'water': toon('water', '#3a7a9a', lift=0.3),
    'cedar': toon('cedar', '#9a9080', shadow_mul=(0.8, 0.8, 0.86), lift=0.12),
    'cedarDark': toon('cedarDark', '#6a6258'),
    'moss': toon('moss', '#6a9a4a'),
    'spruce': toon('spruce', '#2a5a34', shadow_mul=(0.7, 0.78, 0.8)),
    'dark': flat('dark', '#2e2a2a'),
    'rock': toon('rock', '#7a7a74'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(1880)


def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


# ---------- the sea and the beach ----------
loft('sea', M['water'], [strip(-1.31, -0.62, 1.32, G - 0.004), strip(-1.31, -0.62, 1.32, G + 0.008)], outline=0.002)
loft('beach', M['beach'], [strip(-0.62, -0.38, 1.32, G - 0.004), strip(-0.62, -0.38, 1.32, G + 0.006)], outline=0.001)
for k in range(5):
    b = ball(f'rock{k}', M['rock'], 0, 0, 0, 0.04, outline=0.004)
    b.scale = (1.3, 1.0, 0.6)
    b.location = (-0.8 + k * 0.4 + 0.1 * rng.random(), -0.55 + 0.1 * rng.random(), G + 0.01)

# ---------- the forest behind ----------
for k in range(14):
    x = -1.0 + k * 0.155 + 0.04 * rng.random()
    y = 0.55 + 0.25 * rng.random()
    if math.hypot(x, y) > 1.2:
        continue
    h = 0.45 + 0.2 * rng.random()
    lathe(f'spruce{k}', M['spruce'], ((0.1, 0), (0.07, h * 0.35), (0.045, h * 0.65), (0.003, h)), G - 0.005, x, y, segs=10, outline=0.006, smooth=False)

# ---------- the fallen longhouse beams ----------
for k in range(6):
    x = -0.7 + k * 0.28
    bar(f'beam{k}', M['cedarDark'], (x - 0.12, 0.1 + 0.05 * rng.random(), G + 0.015), (x + 0.1, 0.25 + 0.05 * rng.random(), G + 0.015), 0.03, outline=0.002)

# ---------- the row of poles ----------
for k in range(8):
    x = -0.84 + k * 0.24
    y = -0.12 + 0.06 * rng.random()
    h = 0.42 + 0.22 * rng.random()
    lean = (rng.random() - 0.5) * 0.12
    objs = set(bpy.data.objects)
    rod(f'pole{k}', M['cedar'], (0, 0, 0), (0, 0, h), 0.028, segs=10, outline=0.004)
    # the carved figures: stacked faces with their brows, eyes and beaks
    n = int(h / 0.1)
    for j in range(n):
        z = 0.05 + j * 0.1
        box(f'brow{k}{j}', M['cedarDark'], 0, -0.026, z + 0.04, 0.05, 0.012, 0.012, outline=0, bevel=0)
        for s in (-1, 1):
            ball(f'eye{k}{j}{s}', M['dark'], s * 0.012, -0.027, z + 0.025, 0.007, outline=0)
        if j % 2 == 0:
            rod(f'beak{k}{j}', M['cedar'], (0, -0.025, z + 0.01), (0, -0.055, z - 0.005), 0.01, r2=0.003, segs=6, outline=0.001)
        else:
            for s in (-1, 1):
                ball(f'ear{k}{j}{s}', M['cedar'], s * 0.03, 0, z + 0.04, 0.012, outline=0.001)
    b = ball(f'moss{k}', M['moss'], 0, 0, 0, 0.035, outline=0.003)
    b.scale = (1.0, 1.0, 0.5)
    b.location = (0, 0, h)
    if k % 3 == 1:
        box(f'mortuary{k}', M['cedarDark'], 0, 0, h - 0.02, 0.1, 0.08, 0.06, outline=0.002, bevel=0)
    bpy.context.view_layer.update()
    m = Matrix.Translation((x, y, G - 0.005)) @ Matrix.Rotation(lean, 4, 'X') @ Matrix.Rotation(lean * 0.6, 4, 'Y')
    for o in set(bpy.data.objects) - objs:
        o.matrix_world = m @ o.matrix_world

bpy.context.view_layer.update()
turn(before, -20)
render(G)

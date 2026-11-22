# A cartoon Bryggen (Bergen's old wharf) for the country maps, built in the set's shared look
# (../toon.py): a row of tall wooden wharf houses in red, yellow, white and ochre, their steep
# gables to the harbour and white windows on their fronts, the wooden quay before them, the
# green mountain behind, and a little white boat in the harbour. Turned a little to the camera.
# Run: blender -b --factory-startup -P bryggen.py -- bryggen-1024.png 1024 bryggen.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'red': toon('red', '#c0392b'),
    'darkred': toon('darkred', '#9c2f28'),
    'yellow': toon('yellow', '#f2c14e', shadow_mul=(0.8, 0.7, 0.6)),
    'white': toon('white', '#f1ece0', shadow_mul=(0.82, 0.8, 0.9)),
    'ochre': toon('ochre', '#d4893a'),
    'roof': toon('roof', '#4f4a48', shadow_mul=(0.76, 0.74, 0.82)),
    'trim': toon('trim', '#faf7f0', shadow_mul=(0.85, 0.85, 0.92)),
    'quay': toon('quay', '#8a6448'),
    'water': toon('water', '#3f8fc4', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'mountain': toon('mountain', '#5f9e55', shadow_mul=(0.7, 0.78, 0.8)),
    'hull': toon('hull', '#f6f3ec', shadow_mul=(0.82, 0.82, 0.92)),
    'mast': toon('mast', '#7a5238'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(31)

# ---------- the harbour along the front ----------
EDGE, R = -0.5, 1.43
a0 = math.asin(-EDGE / R)
arc = [(R * math.cos(a), R * math.sin(a)) for a in (math.pi + a0 + (math.pi - 2 * a0) * k / 40 for k in range(41))]
bm = bmesh.new()
bm.faces.new([bm.verts.new((x, y, G + 0.003)) for x, y in arc])
finish('harbour', bm, M['water'], outline=0)
box('quay', M['quay'], 0, -0.38, G - 0.006, 2.5, 0.22, 0.05, outline=0.016, bevel=0)


# ---------- the mountain behind ----------
def ring(cx, cy, rx, ry, z, jitter, sides=12):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


hill = loft('floyen', M['mountain'], [ring(0, 0.85, 1.25, 0.55, -0.01, 0.0), ring(0, 0.9, 1.0, 0.42, 0.35, 0.06),
                                      ring(0.1, 0.92, 0.6, 0.28, 0.7, 0.08), ring(0.15, 0.95, 0.1, 0.06, 0.85, 0.0)], outline=0.035)
hill.visible_shadow = False

# ---------- the wharf houses: steep gables to the harbour ----------
HOUSES = (('red', 0.24, 0.42), ('yellow', 0.22, 0.48), ('white', 0.24, 0.4), ('ochre', 0.22, 0.46), ('darkred', 0.24, 0.44),
          ('yellow', 0.22, 0.4), ('red', 0.24, 0.47))
x = -0.82
DEPTH, Y = 0.5, 0.0
for k, (colour, w, h) in enumerate(HOUSES):
    cx = x + w / 2
    box(f'house{k}', M[colour], cx, Y, G, w - 0.008, DEPTH, h, outline=0.02, bevel=0.003)
    # the steep gable roof, its ridge running back from the front
    loft(f'roof{k}', M['roof'], [[(cx - w / 2 - 0.01, y, G + h), (cx + w / 2 + 0.01, y, G + h), (cx, y, G + h + w * 0.75)]
                                 for y in (Y - DEPTH / 2 - 0.02, Y + DEPTH / 2)], outline=0.018)
    # the front gable's white face and windows
    bm = bmesh.new()
    face = bm.faces.new([bm.verts.new((cx - w / 2 + 0.02, Y - DEPTH / 2 - 0.022, G + h + 0.01)),
                         bm.verts.new((cx + w / 2 - 0.02, Y - DEPTH / 2 - 0.022, G + h + 0.01)),
                         bm.verts.new((cx, Y - DEPTH / 2 - 0.022, G + h + w * 0.62))])
    finish(f'gable{k}', bm, M[colour], outline=0)
    front = Y - DEPTH / 2 - 0.006
    for row in range(3):
        for c in (-1, 1):
            box(f'win{k}{row}{c}', M['trim'], cx + c * w * 0.22, front, G + 0.07 + row * 0.12, 0.045, 0.02, 0.06, outline=0, bevel=0)
    box(f'gablewin{k}', M['trim'], cx, front, G + h + 0.04, 0.04, 0.02, 0.05, outline=0, bevel=0)
    x += w

# ---------- a little boat in the harbour ----------
BX, BY = 0.3, -0.85
hull = [(-0.16, 0), (-0.11, -0.05), (0.12, -0.05), (0.18, 0), (0.12, 0.05), (-0.11, 0.05)]
loft('hull', M['hull'], [[(BX + x * 0.8, BY + y * 0.8, G - 0.005) for x, y in hull], [(BX + x, BY + y, G + 0.05) for x, y in hull]],
     outline=0.016)
rod('mast', M['mast'], (BX, BY, G + 0.05), (BX, BY, G + 0.32), 0.008, segs=6, outline=0.006)

turn(before, -20)
render(G)

# A cartoon Þingvellir for the country maps, built in the set's shared look (../toon.py): the rift
# where two continents pull apart, the dark basalt cliffs of Almannagjá along it, the Öxarárfoss
# waterfall dropping over them into the river, the little white church with its red roof and the
# farmhouse with its five white gables beside it, the Icelandic flag at the Law Rock, the mossy lava
# plain and the lake. Turned a little towards the camera.
# Run: blender -b --factory-startup -P thingvellir.py -- thingvellir-1024.png 1024 thingvellir.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'moss': toon('moss', '#9ab85a', shadow_mul=(0.74, 0.8, 0.76), lift=0.25),
    'basalt': toon('basalt', '#6a6670', shadow_mul=(0.8, 0.8, 0.88), lift=0.25),
    'basaltTop': toon('basaltTop', '#7a9a52', shadow_mul=(0.74, 0.8, 0.76)),
    'water': toon('water', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'foam': toon('foam', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'red': toon('red', '#c8402f'),
    'turf': toon('turf', '#5f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'window': flat('window', '#33303d'),
    'flagBlue': flat('flagBlue', '#02529c'),
    'flagWhite': flat('flagWhite', '#ffffff'),
    'flagRed': flat('flagRed', '#dc1e35'),
    'pole': toon('pole', '#e8e4da'),
})

G = tile(M['moss'])
before = set(bpy.data.objects)
rng = random.Random(257)

# ---------- the lake in the front corner ----------
R = 1.42
LAKE = [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(-75, 6, 8)] + [(0.95, -0.1), (0.5, -0.75)]
bm = bmesh.new()
bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, G + 0.004)) for x, y in LAKE])])
finish('lake', bm, M['water'], outline=0.012)


# ---------- the rift: two long basalt cliffs with the gorge between ----------
def cliff(name, pts, h):
    """A cliff along a line of (x, y) points, its face to the front (-Y side), thickness behind."""
    front = [(x, y, G - 0.01) for x, y in pts]
    back = [(x, y + 0.22, G - 0.01) for x, y in reversed(pts)]
    base = front + back
    top = [(x, y, G + h + rng.uniform(-0.02, 0.02)) for x, y, _ in front] + [(x, y, G + h * 0.85) for x, y, _ in back]
    ob = loft(name, M['basalt'], [base, top], outline=0.03)
    ob.visible_shadow = False
    t = loft(name + 'top', M['basaltTop'], [[(x, y, z - 0.005) for x, y, z in top], [(x, y, z + 0.02) for x, y, z in top]], outline=0.015)
    t.visible_shadow = False


LINE = [(-1.1 + k * 0.24, 0.42 + 0.05 * math.sin(k * 1.7)) for k in range(9)]


def face_y(x):
    """Where the high cliff's face is at x."""
    for (x0, y0), (x1, y1) in zip(LINE, LINE[1:]):
        if x <= x1:
            return 0.2 + y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    return 0.2 + LINE[-1][1]


cliff('almannagja', [(x, y + 0.2) for x, y in LINE], 0.55)
# the lower east wall, with a gap where the river runs out of the rift
cliff('eastwallW', [(x, y - 0.18) for x, y in LINE[:4]], 0.28)
cliff('eastwallE', [(x, y - 0.18) for x, y in LINE[5:8]], 0.28)
# columns of basalt marked on the high cliff's face
for k in range(13):
    x = -1.02 + k * 0.15
    box(f'column{k}', M['basaltTop'] if k % 5 == 0 else M['basalt'], x, face_y(x) - 0.005, G + 0.05, 0.02, 0.01, 0.4, outline=0, bevel=0)

# ---------- Öxarárfoss, over the cliff into the rift and the river out ----------
WX = -0.2
WY = face_y(WX) - 0.04
for k in range(5):
    t = k / 5
    z1 = 0.56 - t * 0.55
    z0 = 0.56 - (t + 0.2) * 0.55
    w = 0.06 + 0.04 * t
    loft(f'fall{k}', M['foam'], [[(WX - w / 2, WY - 0.02, G + z0), (WX + w / 2, WY - 0.02, G + z0), (WX + w / 2, WY, G + z0), (WX - w / 2, WY, G + z0)],
                                 [(WX - w / 2, WY - 0.02, G + z1), (WX + w / 2, WY - 0.02, G + z1), (WX + w / 2, WY, G + z1), (WX - w / 2, WY, G + z1)]],
         outline=0.006 if k == 0 else 0)
for k, (dx, r) in enumerate(((-0.04, 0.05), (0.04, 0.045), (0.0, 0.06))):
    ball(f'spray{k}', M['foam'], WX + dx, WY - 0.08, G + 0.03, r, outline=0.01)
RIVER = [(WX, WY - 0.1), (-0.18, 0.3), (-0.14, 0.12), (0.1, -0.05), (0.3, -0.3), (0.55, -0.6)]
for k, ((x0, y0), (x1, y1)) in enumerate(zip(RIVER, RIVER[1:])):
    box(f'river{k}', M['water'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.002, math.hypot(x1 - x0, y1 - y0) + 0.09, 0.09, 0.008, rot_z=math.atan2(y1 - y0, x1 - x0),
        outline=0.008, bevel=0)

# ---------- the church and the five-gabled farmhouse ----------
CX, CY = -0.55, -0.35
box('church', M['white'], CX, CY, G - 0.005, 0.24, 0.13, 0.12, outline=0.016, bevel=0)
loft('churchroof', M['red'], [[(CX - 0.13, CY - 0.075, G + 0.115), (CX + 0.13, CY - 0.075, G + 0.115), (CX + 0.13, CY + 0.075, G + 0.115),
                               (CX - 0.13, CY + 0.075, G + 0.115)],
                              [(CX - 0.13, CY - 0.004, G + 0.19), (CX + 0.13, CY - 0.004, G + 0.19), (CX + 0.13, CY + 0.004, G + 0.19), (CX - 0.13, CY + 0.004, G + 0.19)]],
     outline=0.012)
box('churchtower', M['white'], CX - 0.15, CY, G - 0.005, 0.07, 0.07, 0.2, outline=0.012, bevel=0)
pyramid('churchspire', M['red'], CX - 0.15, CY, G + 0.195, 0.085, 0.1, outline=0.01)
for k in range(3):
    box(f'churchwin{k}', M['window'], CX - 0.06 + k * 0.06, CY - 0.068, G + 0.05, 0.022, 0.01, 0.04, outline=0, bevel=0)
for k in range(5):
    x = -0.2 + k * 0.085
    y = -0.5
    box(f'farm{k}', M['white'], x, y, G - 0.005, 0.075, 0.2, 0.09, outline=0.012, bevel=0)
    loft(f'farmgable{k}', M['white'], [[(x - 0.0375, y - 0.1, G + 0.085), (x + 0.0375, y - 0.1, G + 0.085), (x, y - 0.1, G + 0.14)],
                                       [(x - 0.0375, y - 0.096, G + 0.085), (x + 0.0375, y - 0.096, G + 0.085), (x, y - 0.096, G + 0.14)]], outline=0.008)
    loft(f'farmroof{k}', M['turf'], [[(x - 0.042, y - 0.095, G + 0.083), (x + 0.042, y - 0.095, G + 0.083), (x + 0.042, y + 0.105, G + 0.083),
                                      (x - 0.042, y + 0.105, G + 0.083)],
                                     [(x - 0.003, y - 0.095, G + 0.145), (x + 0.003, y - 0.095, G + 0.145), (x + 0.003, y + 0.105, G + 0.145),
                                      (x - 0.003, y + 0.105, G + 0.145)]], outline=0.01)
    box(f'farmwin{k}', M['window'], x, y - 0.102, G + 0.03, 0.022, 0.01, 0.04, outline=0, bevel=0)

# ---------- the flag at the Law Rock ----------
PX, PY = -0.95, 0.12
rod('flagpole', M['pole'], (PX, PY, G), (PX, PY, G + 0.5), 0.007, segs=6, outline=0.003)
FW, FH = 0.16, 0.11
box('flag', M['flagBlue'], PX + FW / 2, PY, G + 0.5 - FH, FW, 0.006, FH, outline=0, bevel=0)
box('flagwhiteh', M['flagWhite'], PX + FW / 2, PY - 0.001, G + 0.5 - FH / 2 - 0.013, FW, 0.006, 0.026, outline=0, bevel=0)
box('flagwhitev', M['flagWhite'], PX + 0.055, PY - 0.001, G + 0.5 - FH, 0.026, 0.006, FH, outline=0, bevel=0)
box('flagredh', M['flagRed'], PX + FW / 2, PY - 0.002, G + 0.5 - FH / 2 - 0.007, FW, 0.006, 0.014, outline=0, bevel=0)
box('flagredv', M['flagRed'], PX + 0.055, PY - 0.002, G + 0.5 - FH, 0.014, 0.006, FH, outline=0, bevel=0)

# ---------- mossy lava hummocks ----------
for k in range(12):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.4, 1.25)
    x, y = r * math.cos(a), r * math.sin(a)
    if y > 0.1 or (x > 0.2 and y < -0.1):
        continue
    h = ball(f'hummock{k}', M['basaltTop'], 0, 0, 0, rng.uniform(0.05, 0.08), outline=0.01)
    h.scale = (1.3, 1.1, 0.5)
    h.location = (x, y, G)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

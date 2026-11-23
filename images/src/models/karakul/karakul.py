# A cartoon Lake Karakul for the country maps, built in the set's shared look (../toon.py): the
# deep-blue lake high in the Pamirs, the bare brown valley round it, a ring of snow-capped peaks
# behind, a Kyrgyz yurt, and shaggy yaks grazing in front. Turned a little towards the camera.
# Run: blender -b --factory-startup -P karakul.py -- karakul-1024.png 1024 karakul.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'valley': toon('valley', '#c9ae86', shadow_mul=(0.84, 0.76, 0.7), lift=0.25),
    'tuft': toon('tuft', '#a8a070', shadow_mul=(0.8, 0.78, 0.74)),
    'lake': toon('lake', '#2f6fc0', shadow_mul=(0.72, 0.76, 0.9), lift=0.35),
    'shore': toon('shore', '#7fb8d8', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'mountain': toon('mountain', '#8f7a6a', shadow_mul=(0.8, 0.76, 0.84)),
    'snow': toon('snow', '#f7f8fb', shadow_mul=(0.80, 0.84, 0.95), lift=0.15),
    'felt': toon('felt', '#ece6d6', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'band': flat('band', '#c8402f'),
    'door': toon('door', '#3c6fc4', shadow_mul=(0.72, 0.72, 0.82)),
    'yak': toon('yak', '#3f3530', lift=0.3),
    'yakWhite': toon('yakWhite', '#ece6d6', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'horn': toon('horn', '#e8dfc8', lift=0.2),
})

G = tile(M['valley'])
before = set(bpy.data.objects)
rng = random.Random(349)


def ring(cx, cy, rx, ry, z, jitter, sides=14):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- the snow-capped peaks behind ----------
for k, (cx, cy, r, h) in enumerate(((-0.75, 0.82, 0.38, 0.95), (-0.15, 1.02, 0.4, 1.2), (0.5, 0.95, 0.38, 1.0), (1.0, 0.55, 0.3, 0.75))):
    body = loft(f'mountain{k}', M['mountain'], [ring(cx, cy, r, r * 0.55, -0.01, 0.0), ring(cx, cy, r * 0.62, r * 0.34, h * 0.5, 0.12),
                                                ring(cx, cy, r * 0.28, r * 0.16, h * 0.82, 0.12), ring(cx, cy, 0.02, 0.02, h, 0.0)], outline=0.035)
    cap = loft(f'snow{k}', M['snow'], [ring(cx, cy, r * 0.42, r * 0.24, h * 0.66, 0.14), ring(cx, cy, 0.02, 0.02, h + 0.01, 0.0)], outline=0.02)
    body.visible_shadow = cap.visible_shadow = False

# ---------- the lake ----------
LX, LY = -0.15, 0.1
LAKE = ring(LX, LY, 0.85, 0.48, 0.004, 0.06, sides=24)
bm = bmesh.new()
bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x * 1.08 + LX * -0.08, (y - LY) * 1.12 + LY, z)) for x, y, z in LAKE])])
finish('shallows', bm, M['shore'], outline=0.01)
bm = bmesh.new()
bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z + 0.003)) for x, y, z in LAKE])])
finish('lake', bm, M['lake'], outline=0)
squashed('island', M['valley'], LX + 0.25, LY + 0.05, G + 0.01, 0.1, 1.6, 1.0, 0.25, outline=0.012).visible_shadow = False

# ---------- tufts of grass on the valley floor ----------
for k in range(22):
    a = rng.uniform(math.radians(190), math.radians(350))
    r = rng.uniform(0.65, 1.3)
    x, y = r * math.cos(a), r * math.sin(a)
    rod(f'tuft{k}', M['tuft'], (x, y, G), (x, y, G + 0.04), 0.018, r2=0.0, segs=6, outline=0.004)

# ---------- a Kyrgyz yurt ----------
YX, YY = 0.85, -0.2
lathe('yurt', M['felt'], ((0.13, 0), (0.13, 0.08)), G - 0.005, YX, YY, segs=24, outline=0.014)
lathe('yurtband', M['band'], ((0.133, 0), (0.133, 0.014)), G + 0.05, YX, YY, segs=24, outline=0)
lathe('yurtroof', M['felt'], ((0.14, 0), (0.06, 0.04), (0.015, 0.06)), G + 0.075, YX, YY, segs=24, outline=0.012)
box('yurtdoor', M['door'], YX - 0.13, YY, G, 0.012, 0.05, 0.06, outline=0, bevel=0)


# ---------- shaggy yaks, each built facing +X at the origin, then turned into place ----------
def place(made_before, degrees, x, y):
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(math.radians(degrees), 4, 'Z')
    bpy.context.view_layer.update()
    for ob in set(bpy.data.objects) - made_before:
        ob.matrix_world = m @ ob.matrix_world


def yak(name, x, y, deg, grazing, white_face=False):
    made = set(bpy.data.objects)
    squashed(f'{name}body', M['yak'], 0, 0, G + 0.11, 0.1, 1.45, 0.9, 0.85, outline=0.016)
    # the long shaggy skirt of hair hanging nearly to the ground
    skirt = lathe(f'{name}skirt', M['yak'], ((0.09, 0), (0.1, 0.08)), G + 0.015, 0, 0, segs=16, outline=0.012, smooth=False)
    skirt.scale = (1.4, 0.9, 1)
    squashed(f'{name}hump', M['yak'], 0.03, 0, G + 0.18, 0.06, 1.0, 1.0, 0.8, outline=0.01)
    hz = G + (0.06 if grazing else 0.14)
    ball(f'{name}head', M['yakWhite' if white_face else 'yak'], 0.16, 0, hz, 0.045, outline=0.01)
    for side in (-1, 1):
        rod(f'{name}horn{side}', M['horn'], (0.16, side * 0.03, hz + 0.02), (0.17, side * 0.075, hz + 0.065), 0.009, r2=0.003, segs=6, outline=0.003)
    bar(f'{name}tail', M['yakWhite'], (-0.14, 0, G + 0.14), (-0.17, 0, G + 0.05), 0.018, outline=0.004)
    place(made, deg, x, y)


for k, (x, y, deg, grazing) in enumerate(((-0.35, -0.75, -20, True), (0.15, -0.85, -150, False), (0.45, -0.6, -60, True), (-0.75, -0.45, 10, True))):
    yak(f'yak{k}', x, y, deg, grazing, white_face=(k == 1))

bpy.context.view_layer.update()
turn(before, -20)
render(G)

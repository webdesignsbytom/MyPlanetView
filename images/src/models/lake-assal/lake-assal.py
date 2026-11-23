# A cartoon Lake Assal for the country maps, built in the set's shared look (../toon.py) on a tile of
# dark volcanic ground: the turquoise salt lake below sea level, ringed by its glaring white salt
# flats heaped with salt crystals, black lava boulders and the bare brown mountains of the Afar rift
# round it, and an Afar caravan of camels carrying slabs of salt. Turned a little towards the camera.
# Run: blender -b --factory-startup -P lake-assal.py -- lake-assal-1024.png 1024 lake-assal.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#8a6a50', shadow_mul=(0.82, 0.76, 0.78), lift=0.25),
    'salt': toon('salt', '#f7f6f0', shadow_mul=(0.82, 0.84, 0.92), lift=0.2),
    'lake': toon('lake', '#2fc0c4', shadow_mul=(0.72, 0.84, 0.88), lift=0.35),
    'lakeDeep': toon('lakeDeep', '#1f8fb0', shadow_mul=(0.72, 0.8, 0.88), lift=0.35),
    'lava': toon('lava', '#3a3438', shadow_mul=(0.82, 0.82, 0.9), lift=0.25),
    'mountain': toon('mountain', '#7a5a46', shadow_mul=(0.8, 0.74, 0.8)),
    'camel': toon('camel', '#c9a06a', shadow_mul=(0.84, 0.74, 0.66)),
    'robe': toon('robe', '#f6f3ec', lift=0.2),
    'sash': toon('sash', '#c8402f'),
    'skin': toon('skin', '#6b4a33'),
    'rope': toon('rope', '#8a6448'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(383)


def ring(cx, cy, rx, ry, z, jitter, sides=20):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


def flat_face(name, mat, pts, z, outline=0.01):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y, _ in pts])])
    return finish(name, bm, mat, outline=outline)


def place(made_before, degrees, x, y):
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(math.radians(degrees), 4, 'Z')
    bpy.context.view_layer.update()
    for ob in set(bpy.data.objects) - made_before:
        ob.matrix_world = m @ ob.matrix_world


# ---------- the mountains of the rift behind ----------
for k, (cx, cy, r, h) in enumerate(((-0.5, 0.95, 0.4, 0.6), (0.3, 1.02, 0.4, 0.48), (0.88, 0.58, 0.28, 0.38))):
    m = loft(f'mountain{k}', M['mountain'], [ring(cx, cy, r, r * 0.5, -0.01, 0.03, 14), ring(cx, cy, r * 0.62, r * 0.32, h * 0.55, 0.12, 14),
                                             ring(cx, cy, r * 0.25, r * 0.14, h * 0.88, 0.14, 14), ring(cx, cy, 0.02, 0.02, h, 0.0, 14)], outline=0.035)
    m.visible_shadow = False

# ---------- the salt flats, the lake in them ----------
SX, SY = -0.1, -0.05
loft('saltflat', M['salt'], [ring(SX, SY, 1.05, 0.78, -0.005, 0.06), ring(SX, SY, 1.02, 0.75, 0.02, 0.06)], outline=0.016)
flat_face('lake', M['lake'], ring(SX + 0.15, SY + 0.12, 0.62, 0.42, 0, 0.08), G + 0.024, outline=0.012)
flat_face('lakedeep', M['lakeDeep'], ring(SX + 0.22, SY + 0.18, 0.34, 0.22, 0, 0.1), G + 0.027, outline=0)
# heaps of salt crystals along the shore
for k in range(18):
    a = rng.uniform(0, 2 * math.pi)
    d = rng.uniform(0.66, 0.9)
    x, y = SX + 0.15 + d * 0.95 * math.cos(a), SY + 0.12 + d * 0.62 * math.sin(a)
    rod(f'crystal{k}', M['salt'], (x, y, G + 0.02), (x + rng.uniform(-0.01, 0.01), y, G + rng.uniform(0.05, 0.1)), rng.uniform(0.02, 0.035), r2=0.0, segs=5,
        outline=0.006)
for k in range(6):
    a = rng.uniform(0, 2 * math.pi)
    b = ball(f'saltheap{k}', M['salt'], 0, 0, 0, rng.uniform(0.05, 0.08), outline=0.01)
    b.scale = (1.3, 1.1, 0.5)
    b.location = (SX + 0.15 + 0.78 * math.cos(a), SY + 0.12 + 0.52 * math.sin(a), G + 0.02)

# ---------- black lava boulders round the edge ----------
for k in range(12):
    a = math.radians(rng.uniform(150, 390))
    d = rng.uniform(1.08, 1.25)
    b = ball(f'lava{k}', M['lava'], 0, 0, 0, rng.uniform(0.06, 0.1), outline=0.014)
    b.scale = (1.2, 1.0, 0.7)
    b.location = (d * math.cos(a), d * math.sin(a), G + 0.03)
    b.visible_shadow = False


# ---------- an Afar salt caravan ----------
def camel(name, x, y, deg, load=True):
    made = set(bpy.data.objects)
    for dx in (-0.06, 0.06):
        for s in (-1, 1):
            rod(f'{name}leg{dx}{s}', M['camel'], (dx, s * 0.025, G), (dx, s * 0.025, G + 0.15), 0.01, segs=6, outline=0.005)
    box(f'{name}body', M['camel'], 0, 0, G + 0.13, 0.19, 0.07, 0.07, outline=0.009, bevel=0.018)
    ball(f'{name}hump', M['camel'], -0.01, 0, G + 0.2, 0.045, outline=0.008)
    bar(f'{name}neck', M['camel'], (0.08, 0, G + 0.17), (0.14, 0, G + 0.25), 0.032, outline=0.006)
    box(f'{name}head', M['camel'], 0.16, 0, G + 0.23, 0.07, 0.035, 0.035, outline=0.006, bevel=0.008)
    if load:
        for s in (-1, 1):
            for k in range(2):
                box(f'{name}salt{s}{k}', M['salt'], -0.03 + k * 0.06, s * 0.055, G + 0.13, 0.05, 0.025, 0.07, outline=0.005, bevel=0)
        box(f'{name}strap', M['rope'], 0, 0, G + 0.2, 0.012, 0.12, 0.012, outline=0, bevel=0)
    place(made, deg, x, y)


for k, (x, y) in enumerate(((-0.7, -0.8), (-0.42, -0.9), (-0.14, -0.98))):
    camel(f'camel{k}', x, y, -15)
HX, HY = 0.1, -1.03
rod('herder', M['robe'], (HX, HY, G), (HX, HY, G + 0.09), 0.022, r2=0.016, segs=8, outline=0.005)
box('herdersash', M['sash'], HX, HY, G + 0.06, 0.04, 0.04, 0.012, outline=0, bevel=0)
ball('herderhead', M['skin'], HX, HY, G + 0.11, 0.018, outline=0.004)
bar('herderstick', M['rope'], (HX + 0.02, HY, G), (HX + 0.03, HY, G + 0.14), 0.006, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

# A cartoon Etosha for the country maps, built in the set's shared look (../toon.py) on a tile of dry
# savanna: the great white salt pan stretching away behind, a waterhole in front, and the animals
# come to drink: two elephants, zebras in their stripes, a giraffe and springbok, among mopane
# trees and bushes. Turned a little towards the camera.
# Run: blender -b --factory-startup -P etosha.py -- etosha-1024.png 1024 etosha.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'savanna': toon('savanna', '#d8c48a', shadow_mul=(0.82, 0.74, 0.62), lift=0.25),
    'pan': toon('pan', '#f2efe6', shadow_mul=(0.82, 0.82, 0.9), lift=0.2),
    'water': toon('water', '#5fa8c8', shadow_mul=(0.75, 0.84, 0.88), lift=0.3),
    'mud': toon('mud', '#a88660'),
    'mopane': toon('mopane', '#7a9e4e', shadow_mul=(0.72, 0.8, 0.78)),
    'trunk': toon('trunk', '#6b4a33'),
    'elephant': toon('elephant', '#a8a49e', shadow_mul=(0.78, 0.78, 0.86)),
    'tusk': toon('tusk', '#f4efe2', lift=0.2),
    'zebra': toon('zebra', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'stripe': flat('stripe', '#2a262c'),
    'giraffe': toon('giraffe', '#e8b65c', shadow_mul=(0.84, 0.72, 0.6)),
    'spot': flat('spot', '#8a5a2e'),
    'springbok': toon('springbok', '#c9945a', shadow_mul=(0.84, 0.74, 0.66)),
    'belly': toon('belly', '#f6f3ec', lift=0.2),
})

G = tile(M['savanna'])
before = set(bpy.data.objects)
rng = random.Random(269)


def place(made_before, degrees, x, y):
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(math.radians(degrees), 4, 'Z')
    bpy.context.view_layer.update()
    for ob in set(bpy.data.objects) - made_before:
        ob.matrix_world = m @ ob.matrix_world


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- the salt pan behind, and the waterhole ----------
R = 1.42
PAN = [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(14, 167, 9)] + [(-0.9, 0.2), (-0.2, 0.12), (0.6, 0.18), (1.25, 0.3)]
bm = bmesh.new()
bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, G + 0.004)) for x, y in PAN])])
finish('pan', bm, M['pan'], outline=0.01)
WX, WY = -0.05, -0.38
cyl('mudring', M['mud'], 0.42, 0.01, segs=32, outline=0.01, matrix=Matrix.Translation((WX, WY, G + 0.004)) @ Matrix.Scale(0.6, 4, (0, 1, 0)))
cyl('waterhole', M['water'], 0.34, 0.012, segs=32, outline=0.008, matrix=Matrix.Translation((WX, WY, G + 0.008)) @ Matrix.Scale(0.6, 4, (0, 1, 0)))


# ---------- elephants at the water ----------
def elephant(name, x, y, deg, s=1.0):
    made = set(bpy.data.objects)
    for dx in (-0.1, 0.1):
        for sy in (-1, 1):
            cyl(f'{name}leg{dx}{sy}', M['elephant'], 0.045 * s, 0.22 * s, segs=12, outline=0.012, matrix=Matrix.Translation((dx * s, sy * 0.07 * s, G + 0.11 * s)))
    squashed(f'{name}body', M['elephant'], 0, 0, G + 0.3 * s, 0.19 * s, 1.25, 0.85, 0.85, outline=0.022)
    ball(f'{name}head', M['elephant'], 0.23 * s, 0, G + 0.36 * s, 0.1 * s, outline=0.018)
    for sy in (-1, 1):
        squashed(f'{name}ear{sy}', M['elephant'], 0.2 * s, sy * 0.1 * s, G + 0.36 * s, 0.1 * s, 0.35, 0.6, 1.0, outline=0.014)
        bar(f'{name}tusk{sy}', M['tusk'], (0.29 * s, sy * 0.035 * s, G + 0.3 * s), (0.35 * s, sy * 0.04 * s, G + 0.25 * s), 0.014 * s, outline=0.004)
    rod(f'{name}trunk1', M['elephant'], (0.3 * s, 0, G + 0.34 * s), (0.36 * s, 0, G + 0.2 * s), 0.03 * s, r2=0.024 * s, segs=10, outline=0.01)
    rod(f'{name}trunk2', M['elephant'], (0.36 * s, 0, G + 0.2 * s), (0.4 * s, 0, G + 0.06 * s), 0.024 * s, r2=0.018 * s, segs=10, outline=0.01)
    place(made, deg, x, y)


elephant('elephant1', 0.35, -0.12, -140)
elephant('elephant2', 0.62, 0.05, -160, 0.8)


# ---------- zebras in their stripes ----------
def zebra(name, x, y, deg, drinking=False):
    made = set(bpy.data.objects)
    for dx in (-0.06, 0.06):
        for sy in (-1, 1):
            rod(f'{name}leg{dx}{sy}', M['zebra'], (dx, sy * 0.025, G), (dx, sy * 0.025, G + 0.13), 0.011, segs=8, outline=0.005)
    box(f'{name}body', M['zebra'], 0, 0, G + 0.12, 0.18, 0.075, 0.08, outline=0.01, bevel=0.015)
    for k in range(5):
        box(f'{name}stripe{k}', M['stripe'], -0.07 + k * 0.035, 0, G + 0.122, 0.012, 0.078, 0.078, outline=0, bevel=0)
    head_z = G + 0.07 if drinking else G + 0.25
    bar(f'{name}neck', M['zebra'], (0.07, 0, G + 0.17), (0.12, 0, head_z + 0.03), 0.04, outline=0.008)
    box(f'{name}head', M['zebra'], 0.14, 0, head_z - 0.02, 0.07, 0.035, 0.035, outline=0.008, bevel=0.008)
    bar(f'{name}mane', M['stripe'], (0.065, 0, G + 0.205), (0.11, 0, head_z + 0.06), 0.012, outline=0)
    bar(f'{name}tail', M['stripe'], (-0.09, 0, G + 0.18), (-0.11, 0, G + 0.1), 0.008, outline=0)
    place(made, deg, x, y)


zebra('zebra1', -0.45, -0.05, -60, drinking=True)
zebra('zebra2', -0.62, 0.02, -40)
zebra('zebra3', -0.7, -0.25, -80)

# ---------- a giraffe ----------
made = set(bpy.data.objects)
for dx in (-0.06, 0.06):
    for sy in (-1, 1):
        rod(f'giraffeleg{dx}{sy}', M['giraffe'], (dx, sy * 0.03, G), (dx, sy * 0.03, G + 0.3), 0.014, segs=8, outline=0.008)
box('giraffebody', M['giraffe'], 0, 0, G + 0.28, 0.2, 0.09, 0.1, outline=0.014, bevel=0.02)
bar('giraffeneck', M['giraffe'], (0.07, 0, G + 0.34), (0.15, 0, G + 0.72), 0.045, outline=0.01)
box('giraffehead', M['giraffe'], 0.18, 0, G + 0.7, 0.09, 0.045, 0.045, outline=0.01, bevel=0.012)
for sy in (-1, 1):
    for k in range(4):
        squashed(f'gspot{sy}{k}', M['spot'], -0.07 + k * 0.045, sy * 0.046, G + 0.32 + (k % 2) * 0.025, 0.018, 1, 0.3, 1, outline=0)
place(made, 170, -0.95, 0.35)

# ---------- springbok ----------
for k, (x, y, deg) in enumerate(((0.2, -0.85, -100), (0.4, -0.78, -70), (0.05, -0.95, -120))):
    made = set(bpy.data.objects)
    for dx in (-0.035, 0.035):
        for sy in (-1, 1):
            rod(f'sbleg{k}{dx}{sy}', M['springbok'], (dx, sy * 0.015, G), (dx, sy * 0.015, G + 0.08), 0.007, segs=6, outline=0.003)
    box(f'sbbody{k}', M['springbok'], 0, 0, G + 0.075, 0.11, 0.045, 0.045, outline=0.007, bevel=0.01)
    box(f'sbbelly{k}', M['belly'], 0, 0, G + 0.072, 0.1, 0.047, 0.015, outline=0, bevel=0)
    bar(f'sbneck{k}', M['springbok'], (0.045, 0, G + 0.1), (0.07, 0, G + 0.15), 0.022, outline=0.005)
    box(f'sbhead{k}', M['springbok'], 0.08, 0, G + 0.14, 0.04, 0.022, 0.022, outline=0.005, bevel=0.005)
    for sy in (-1, 1):
        bar(f'sbhorn{k}{sy}', M['stripe'], (0.075, sy * 0.006, G + 0.16), (0.068, sy * 0.01, G + 0.2), 0.005, outline=0)
    place(made, deg, x, y)

# ---------- mopane trees and bushes ----------
for k, (x, y, h, r) in enumerate(((1.05, -0.45, 0.28, 0.2), (-1.1, -0.45, 0.24, 0.18), (0.95, 0.4, 0.22, 0.16))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + h), 0.025, r2=0.018, segs=8, outline=0.01)
    squashed(f'crown{k}', M['mopane'], x + 0.02, y, G + h + 0.06, r, 1, 1, 0.5, outline=0.02)
for k, (x, y) in enumerate(((-0.4, -0.95), (0.75, -0.8), (-0.85, -0.7))):
    squashed(f'bush{k}', M['mopane'], x, y, G + 0.04, 0.08, 1.2, 1.0, 0.6, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

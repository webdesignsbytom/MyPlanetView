# A cartoon Manovo-Gounda St Floris National Park for the country maps, built in the set's shared
# look (../toon.py): the Central African Republic's savanna and floodplains under the sandstone
# Bongo massif, a river winding through green floodplain grass, a black rhino, giraffes and a
# buffalo, and flat-topped acacias. Turned a little towards the camera.
# Run: blender -b --factory-startup -P manovo-gounda.py -- manovo-gounda-1024.png 1024 manovo-gounda.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'savanna': toon('savanna', '#c9bd68', shadow_mul=(0.8, 0.76, 0.66), lift=0.25),
    'floodplain': toon('floodplain', '#8cc35b', shadow_mul=(0.72, 0.78, 0.78), lift=0.25),
    'river': toon('river', '#4a9ec8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'sandstone': toon('sandstone', '#c48a5a', shadow_mul=(0.84, 0.74, 0.72)),
    'sandstoneTop': toon('sandstoneTop', '#7aa04a', shadow_mul=(0.72, 0.78, 0.78)),
    'acacia': toon('acacia', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6b5040'),
    'rhino': toon('rhino', '#7a7478', shadow_mul=(0.8, 0.8, 0.88)),
    'horn': toon('horn', '#d8ccb4'),
    'giraffe': toon('giraffe', '#e2b25a', shadow_mul=(0.84, 0.72, 0.6)),
    'spots': toon('spots', '#8a5a30'),
    'buffalo': toon('buffalo', '#3a3230'),
    'tuft': toon('tuft', '#b0a24e', shadow_mul=(0.8, 0.76, 0.66)),
})

G = tile(M['savanna'])
before = set(bpy.data.objects)
rng = random.Random(677)


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


def ribbon(name, mat, path, w0, w1, z):
    bm = bmesh.new()
    verts = []
    for i, (x, y) in enumerate(path):
        (x0, y0), (x1, y1) = path[max(0, i - 1)], path[min(len(path) - 1, i + 1)]
        dx, dy = x1 - x0, y1 - y0
        n = math.hypot(dx, dy)
        w = w0 + (w1 - w0) * i / (len(path) - 1)
        verts.append((bm.verts.new((x - dy / n * w, y + dx / n * w, z)), bm.verts.new((x + dy / n * w, y - dx / n * w, z))))
    for (a0, a1), (b0, b1) in zip(verts, verts[1:]):
        bm.faces.new((a0, a1, b1, b0))
    return finish(name, bm, mat, outline=0.006)


# ---------- the Bongo massif's sandstone escarpment at the back ----------
for k, (x, y, w, d, h) in enumerate(((-0.45, 0.9, 0.55, 0.3, 0.3), (0.15, 0.98, 0.5, 0.26, 0.36), (0.68, 0.82, 0.42, 0.28, 0.26))):
    ring = lambda s, z: [(x + s * w / 2 * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), y + s * d / 2 * math.sin(t), G + z) for t in (2 * math.pi * j / 18 for j in range(18))]
    m = loft(f'mesa{k}', M['sandstone'], [ring(1.0, -0.01), ring(0.9, h)], outline=0.02)
    m.visible_shadow = False
    loft(f'mesatop{k}', M['sandstoneTop'], [ring(0.9, h - 0.005), ring(0.85, h + 0.012)], outline=0.008).visible_shadow = False

# ---------- the river and its floodplain ----------
PATH = [(-1.15, 0.35), (-0.8, 0.2), (-0.45, 0.3), (-0.1, 0.12), (0.2, 0.25), (0.55, 0.1), (0.9, 0.2), (1.2, 0.1)]
ribbon('floodplain', M['floodplain'], PATH, 0.18, 0.2, G + 0.003)
ribbon('river', M['river'], PATH, 0.05, 0.06, G + 0.006)

# ---------- acacias and grass ----------
for k, (x, y) in enumerate(((-0.75, -0.35), (0.85, -0.45), (-0.25, 0.6), (0.5, 0.55), (-1.0, 0.65))):
    h = rng.uniform(0.2, 0.26)
    rod(f'acaciatrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + h), 0.014, segs=6, outline=0.005)
    squashed(f'acacia{k}', M['acacia'], x + 0.02, y, G + h + 0.02, 0.11, 1.5, 1.2, 0.35, outline=0.012)
for k in range(26):
    x, y = rng.uniform(-1.2, 1.2), rng.uniform(-1.2, 0.6)
    if math.hypot(x, y) > 1.27 or abs(y - 0.2) < 0.22:
        continue
    lathe(f'tuft{k}', M['tuft'], ((0.03, 0), (0.004, 0.05)), G, x, y, segs=6, outline=0.004, smooth=False)

# ---------- a black rhino ----------
made = set(bpy.data.objects)
for dx in (-0.07, 0.07):
    for sy in (-1, 1):
        rod(f'rleg{dx}{sy}', M['rhino'], (dx, sy * 0.045, G), (dx, sy * 0.045, G + 0.08), 0.02, segs=8, outline=0.005)
squashed('rbody', M['rhino'], 0, 0, G + 0.13, 0.1, 1.45, 0.85, 0.75, outline=0.012)
squashed('rhead', M['rhino'], 0.16, 0, G + 0.12, 0.055, 1.4, 0.9, 0.85, outline=0.008)
lathe('rhorn1', M['horn'], ((0.018, 0), (0.002, 0.07)), G + 0.14, 0.22, 0, segs=8, outline=0.004, smooth=False)
lathe('rhorn2', M['horn'], ((0.013, 0), (0.002, 0.04)), G + 0.15, 0.18, 0, segs=8, outline=0.003, smooth=False)
for sy in (-1, 1):
    lathe(f'rear{sy}', M['rhino'], ((0.012, 0), (0.003, 0.03)), G + 0.16, 0.12, sy * 0.03, segs=6, outline=0.002, smooth=False)
place(made, -150, -0.2, -0.45)


# ---------- giraffes and a buffalo ----------
def giraffe(name, x, y, deg, s):
    made = set(bpy.data.objects)
    for dx in (-0.05, 0.05):
        for sy in (-1, 1):
            rod(f'{name}leg{dx}{sy}', M['giraffe'], (dx * s, sy * 0.025 * s, G), (dx * 0.8 * s, sy * 0.022 * s, G + 0.22 * s), 0.01 * s, segs=6, outline=0.003)
    squashed(f'{name}body', M['giraffe'], 0, 0, G + 0.25 * s, 0.07 * s, 1.4, 0.8, 0.8, outline=0.01)
    rod(f'{name}neck', M['giraffe'], (0.07 * s, 0, G + 0.27 * s), (0.13 * s, 0, G + 0.5 * s), 0.022 * s, r2=0.014 * s, segs=8, outline=0.005)
    squashed(f'{name}head', M['giraffe'], 0.16 * s, 0, G + 0.51 * s, 0.03 * s, 1.5, 0.8, 0.8, outline=0.004)
    for k, (dx, dz) in enumerate(((-0.03, 0.27), (0.02, 0.28), (0.0, 0.23), (-0.05, 0.24))):
        for sy in (-1, 1):
            ball(f'{name}spot{k}{sy}', M['spots'], dx * s, sy * 0.05 * s, G + dz * s, 0.014 * s, outline=0)
    place(made, deg, x, y)


giraffe('giraffe1', 0.45, -0.3, -130, 1.0)
giraffe('giraffe2', 0.7, -0.15, -100, 0.8)
made = set(bpy.data.objects)
for dx in (-0.06, 0.06):
    for sy in (-1, 1):
        rod(f'bleg{dx}{sy}', M['buffalo'], (dx, sy * 0.03, G), (dx, sy * 0.03, G + 0.09), 0.013, segs=6, outline=0.004)
box('bbody', M['buffalo'], 0, 0, G + 0.08, 0.2, 0.09, 0.09, outline=0.01, bevel=0.02)
box('bhead', M['buffalo'], 0.12, 0, G + 0.09, 0.07, 0.06, 0.06, outline=0.008, bevel=0.01)
for sy in (-1, 1):
    bar(f'bhorn{sy}', M['horn'], (0.13, sy * 0.025, G + 0.15), (0.12, sy * 0.07, G + 0.17), 0.012, outline=0.003)
place(made, -40, -0.75, 0.0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

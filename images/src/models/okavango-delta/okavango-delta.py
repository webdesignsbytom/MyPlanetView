# A cartoon Okavango Delta for the country maps, built in the set's shared look (../toon.py):
# Botswana's inland delta, clear channels winding between grassy islands with fan palms, a lagoon
# where an elephant wades, papyrus beds, a mokoro canoe poled along a channel, and water lilies.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P okavango-delta.py -- okavango-delta-1024.png 1024 okavango-delta.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'marsh': toon('marsh', '#8cbf5a', shadow_mul=(0.72, 0.78, 0.78), lift=0.25),
    'water': toon('water', '#3f9ec8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'island': toon('island', '#c9bd78', shadow_mul=(0.8, 0.76, 0.68)),
    'palm': toon('palm', '#5a9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'tree': toon('tree', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'papyrus': toon('papyrus', '#6aa84a', shadow_mul=(0.7, 0.78, 0.8)),
    'lily': toon('lily', '#4f9a4a'), 'flower': toon('flower', '#f4f0fa', lift=0.2),
    'elephant': toon('elephant', '#8a8680', shadow_mul=(0.78, 0.78, 0.86)),
    'tusk': toon('tusk', '#f4efe2', lift=0.2),
    'canoe': toon('canoe', '#8a5a3a'),
    'shirt': toon('shirt', '#e0453a'), 'skin': toon('skin', '#6b4430'),
    'pole': toon('pole', '#b89a6a'),
})

G = tile(M['marsh'])
before = set(bpy.data.objects)
rng = random.Random(659)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


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


# ---------- the channels and the lagoon ----------
ribbon('channel1', M['water'], [(-1.2, 0.5), (-0.8, 0.35), (-0.45, 0.45), (-0.1, 0.25), (0.15, -0.05), (0.1, -0.4), (-0.1, -0.75), (-0.05, -1.15)], 0.06, 0.09, G + 0.005)
ribbon('channel2', M['water'], [(1.1, 0.6), (0.8, 0.45), (0.5, 0.5), (0.25, 0.3), (0.15, -0.05)], 0.05, 0.07, G + 0.005)
flat_face('lagoon', M['water'], [(0.55 + 0.32 * math.cos(t), -0.45 + 0.2 * math.sin(t)) for t in (2 * math.pi * j / 20 for j in range(20))], G + 0.005, outline=0.008)
for k in range(9):
    a = 2 * math.pi * k / 9
    x, y = 0.55 + 0.24 * math.cos(a) * rng.uniform(0.6, 1.0), -0.45 + 0.13 * math.sin(a) * rng.uniform(0.6, 1.0)
    cyl(f'lilypad{k}', M['lily'], 0.025, 0.004, segs=10, outline=0, matrix=Matrix.Translation((x, y, G + 0.009)))
    if k % 3 == 0:
        ball(f'lilyflower{k}', M['flower'], x, y, G + 0.015, 0.01, outline=0.002)

# ---------- islands with fan palms and trees ----------
for k, (x, y, rx, ry) in enumerate(((-0.55, 0.85, 0.3, 0.18), (0.55, 0.15, 0.22, 0.14), (-0.6, -0.3, 0.28, 0.18))):
    loft(f'island{k}', M['island'], [[(x + rx * math.cos(t), y + ry * math.sin(t), G - 0.01) for t in (2 * math.pi * j / 16 for j in range(16))],
                                     [(x + rx * 0.85 * math.cos(t), y + ry * 0.85 * math.sin(t), G + 0.03) for t in (2 * math.pi * j / 16 for j in range(16))]],
         outline=0.01).visible_shadow = False
    for j in range(2):
        px, py = x + (j - 0.5) * rx * 0.8, y + rng.uniform(-0.03, 0.03)
        h = rng.uniform(0.24, 0.3)
        rod(f'palmtrunk{k}{j}', M['trunk'], (px, py, G + 0.03), (px + 0.02, py, G + 0.03 + h), 0.012, r2=0.009, segs=8, outline=0.005)
        for f in range(8):
            b = 2 * math.pi * f / 8
            bar(f'fan{k}{j}{f}', M['palm'], (px + 0.02, py, G + 0.03 + h), (px + 0.02 + 0.08 * math.cos(b), py + 0.08 * math.sin(b), G + h + 0.01), 0.024, outline=0.004)
ball('islandtree', M['tree'], -0.45, 0.85, G + 0.15, 0.1, outline=0.014)
rod('islandtreetrunk', M['trunk'], (-0.45, 0.85, G + 0.03), (-0.45, 0.85, G + 0.1), 0.016, segs=6, outline=0.004)

# ---------- papyrus beds along the channels ----------
for k in range(30):
    x, y = rng.uniform(-1.1, 1.1), rng.uniform(-1.1, 1.1)
    if math.hypot(x, y) > 1.25:
        continue
    h = rng.uniform(0.08, 0.14)
    rod(f'papyrusstem{k}', M['papyrus'], (x, y, G), (x, y, G + h), 0.004, segs=5, outline=0.001)
    squashed(f'papyrushead{k}', M['papyrus'], x, y, G + h, 0.025, 1.0, 1.0, 0.5, outline=0.003)

# ---------- an elephant wading in the lagoon ----------
made = set(bpy.data.objects)
for dx in (-0.1, 0.1):
    for sy in (-1, 1):
        cyl(f'eleg{dx}{sy}', M['elephant'], 0.045, 0.2, segs=12, outline=0.012, matrix=Matrix.Translation((dx, sy * 0.07, G + 0.1)))
squashed('ebody', M['elephant'], 0, 0, G + 0.27, 0.19, 1.25, 0.85, 0.85, outline=0.02)
ball('ehead', M['elephant'], 0.23, 0, G + 0.33, 0.1, outline=0.016)
for sy in (-1, 1):
    squashed(f'eear{sy}', M['elephant'], 0.2, sy * 0.09, G + 0.34, 0.08, 0.35, 0.6, 1.0, outline=0.012)
    bar(f'etusk{sy}', M['tusk'], (0.29, sy * 0.035, G + 0.27), (0.34, sy * 0.035, G + 0.21), 0.012, outline=0.004)
rod('etrunk1', M['elephant'], (0.3, 0, G + 0.31), (0.37, 0, G + 0.17), 0.03, r2=0.024, segs=10, outline=0.01)
rod('etrunk2', M['elephant'], (0.37, 0, G + 0.17), (0.4, 0, G + 0.03), 0.024, r2=0.018, segs=10, outline=0.01)
place(made, -160, 0.62, -0.42)

# ---------- a mokoro poled along the channel ----------
made = set(bpy.data.objects)
loft('mokoro', M['canoe'], [[(-0.16, 0, G + 0.002), (0, -0.03, G + 0.002), (0.16, 0, G + 0.002), (0, 0.03, G + 0.002)],
                            [(-0.18, 0, G + 0.03), (0, -0.04, G + 0.03), (0.18, 0, G + 0.03), (0, 0.04, G + 0.03)]], outline=0.006)
rod('polerlegs', M['skin'], (-0.1, 0, G + 0.03), (-0.1, 0, G + 0.08), 0.01, segs=6, outline=0.002)
rod('polerbody', M['shirt'], (-0.1, 0, G + 0.08), (-0.1, 0, G + 0.13), 0.016, segs=8, outline=0.003)
ball('polerhead', M['skin'], -0.1, 0, G + 0.15, 0.016, outline=0.003)
rod('pole', M['pole'], (-0.14, 0.02, G - 0.02), (-0.05, -0.02, G + 0.26), 0.004, segs=5, outline=0.001)
place(made, 75, 0.12, -0.55)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

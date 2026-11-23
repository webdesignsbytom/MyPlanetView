# A cartoon Loango National Park for the country maps, built in the set's shared look (../toon.py):
# Gabon's wild Atlantic shore, where forest elephants walk out of the rainforest onto the beach and
# hippos wade in the surf; the long white beach, the waves rolling in, the forest's edge, a lagoon
# behind it, and a forest buffalo. Turned a little towards the camera.
# Run: blender -b --factory-startup -P loango.py -- loango-1024.png 1024 loango.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'forestFloor': toon('forestFloor', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'ocean': toon('ocean', '#2f8fc8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'surf': toon('surf', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'beach': toon('beach', '#f2e6c8', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'lagoon': toon('lagoon', '#5aa8a0', shadow_mul=(0.74, 0.84, 0.86), lift=0.35),
    'forest': toon('forest', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'forestLight': toon('forestLight', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a6048'),
    'elephant': toon('elephant', '#8a8680', shadow_mul=(0.78, 0.78, 0.86)),
    'tusk': toon('tusk', '#f4efe2', lift=0.2),
    'hippo': toon('hippo', '#8a7a82', shadow_mul=(0.8, 0.78, 0.86)),
    'hippoPink': toon('hippoPink', '#d8a0a0'),
    'buffalo': toon('buffalo', '#a8582e'),
    'horn': toon('horn', '#3a3030'),
})

G = tile(M['forestFloor'])
before = set(bpy.data.objects)
rng = random.Random(563)


def place(made_before, degrees, x, y, z=0.0):
    m = Matrix.Translation((x, y, z)) @ Matrix.Rotation(math.radians(degrees), 4, 'Z')
    bpy.context.view_layer.update()
    for ob in set(bpy.data.objects) - made_before:
        ob.matrix_world = m @ ob.matrix_world


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the ocean across the front, the beach behind it: two segments of the circle ----------
R = 1.42


def segment(a0, a1):
    """The part of the tile cut off by the chord between angles a0 and a1."""
    return [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(a0, a1 + 1, 6)]


flat_face('beach', M['beach'], segment(192, 348), G + 0.003, outline=0.01)
flat_face('ocean', M['ocean'], segment(210, 330), G + 0.006, outline=0.01)
for k in range(3):
    y = -0.72 - k * 0.18
    half = math.sqrt(max(0.0, (R - 0.05) ** 2 - y * y))
    bar(f'surf{k}', M['surf'], (-half + 0.05, y + 0.06, G + 0.012), (half - 0.05, y - 0.06, G + 0.012), 0.03, outline=0.003)

# ---------- the lagoon behind the forest edge ----------
flat_face('lagoon', M['lagoon'], [(0.55 + 0.35 * math.cos(t), 0.85 + 0.18 * math.sin(t)) for t in (2 * math.pi * k / 18 for k in range(18))], G + 0.004, outline=0.01)

# ---------- the rainforest's edge ----------
for k in range(30):
    x = rng.uniform(-1.2, 1.2)
    y = rng.uniform(0.0, 1.2)
    if math.hypot(x, y) > 1.18 or (abs(x - 0.55) < 0.4 and abs(y - 0.85) < 0.22):
        continue
    h = rng.uniform(0.18, 0.32)
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + h), 0.025, segs=8, outline=0.01)
    ball(f'crown{k}', M['forest' if k % 2 else 'forestLight'], x, y, G + h + 0.06, rng.uniform(0.12, 0.17), outline=0.02)


# ---------- forest elephants on the beach ----------
def elephant(name, x, y, deg, s):
    made = set(bpy.data.objects)
    for dx in (-0.1, 0.1):
        for sy in (-1, 1):
            cyl(f'{name}leg{dx}{sy}', M['elephant'], 0.045 * s, 0.22 * s, segs=12, outline=0.012, matrix=Matrix.Translation((dx * s, sy * 0.07 * s, G + 0.11 * s)))
    squashed(f'{name}body', M['elephant'], 0, 0, G + 0.3 * s, 0.19 * s, 1.25, 0.85, 0.85, outline=0.02)
    ball(f'{name}head', M['elephant'], 0.23 * s, 0, G + 0.36 * s, 0.1 * s, outline=0.016)
    for sy in (-1, 1):
        squashed(f'{name}ear{sy}', M['elephant'], 0.2 * s, sy * 0.09 * s, G + 0.37 * s, 0.08 * s, 0.35, 0.6, 1.0, outline=0.012)
        bar(f'{name}tusk{sy}', M['tusk'], (0.29 * s, sy * 0.035 * s, G + 0.3 * s), (0.34 * s, sy * 0.035 * s, G + 0.24 * s), 0.012 * s, outline=0.004)
    rod(f'{name}trunk1', M['elephant'], (0.3 * s, 0, G + 0.34 * s), (0.36 * s, 0, G + 0.2 * s), 0.03 * s, r2=0.024 * s, segs=10, outline=0.01)
    rod(f'{name}trunk2', M['elephant'], (0.36 * s, 0, G + 0.2 * s), (0.38 * s, 0, G + 0.07 * s), 0.024 * s, r2=0.018 * s, segs=10, outline=0.01)
    place(made, deg, x, y)


elephant('elephant1', -0.45, -0.4, -150, 1.2)
elephant('elephant2', 0.08, -0.48, -175, 0.8)


# ---------- a hippo wading in the surf ----------
made = set(bpy.data.objects)
squashed('hippobody', M['hippo'], 0, 0, G + 0.05, 0.13, 1.5, 1.0, 0.7, outline=0.016)
squashed('hippohead', M['hippo'], 0.2, 0, G + 0.07, 0.08, 1.3, 1.0, 0.75, outline=0.012)
squashed('hipposnout', M['hippoPink'], 0.29, 0, G + 0.06, 0.05, 0.8, 1.3, 0.7, outline=0.008)
for sy in (-1, 1):
    ball(f'hippoear{sy}', M['hippo'], 0.16, sy * 0.05, G + 0.13, 0.018, outline=0.004)
    ball(f'hippoeye{sy}', M['horn'], 0.24, sy * 0.04, G + 0.115, 0.01, outline=0)
place(made, -120, 0.55, -0.85)

# ---------- a forest buffalo by the trees ----------
made = set(bpy.data.objects)
for dx in (-0.06, 0.06):
    for sy in (-1, 1):
        rod(f'buffleg{dx}{sy}', M['buffalo'], (dx, sy * 0.03, G), (dx, sy * 0.03, G + 0.09), 0.013, segs=6, outline=0.004)
box('buffbody', M['buffalo'], 0, 0, G + 0.08, 0.2, 0.09, 0.09, outline=0.01, bevel=0.02)
box('buffhead', M['buffalo'], 0.12, 0, G + 0.09, 0.07, 0.06, 0.06, outline=0.008, bevel=0.01)
for sy in (-1, 1):
    bar(f'buffhorn{sy}', M['horn'], (0.13, sy * 0.025, G + 0.15), (0.12, sy * 0.06, G + 0.17), 0.012, outline=0.003)
place(made, -60, 0.85, -0.05)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

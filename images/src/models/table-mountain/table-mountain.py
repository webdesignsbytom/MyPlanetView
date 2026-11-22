# A cartoon Table Mountain for the country maps, built in the set's shared look (../toon.py):
# the long flat-topped massif (grey cliffs above green slopes) with its "tablecloth" of cloud
# spilling over the edge, Lion's Head and Devil's Peak either side, Bo-Kaap's bright little
# houses at its foot and Table Bay in front. Its long side turned to the camera.
# Run: blender -b --factory-startup -P table-mountain.py -- table-mountain-1024.png 1024 table-mountain.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'slope': toon('slope', '#7a9a55', shadow_mul=(0.7, 0.78, 0.8)),
    'cliff': toon('cliff', '#93897a', shadow_mul=(0.75, 0.74, 0.84)),
    'cloud': toon('cloud', '#fbfbfd', shadow_mul=(0.82, 0.85, 0.95), lift=0.1),
    'water': toon('water', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'pink': toon('pink', '#ef8fb6', shadow_mul=(0.85, 0.75, 0.85)),
    'yellow': toon('yellow', '#f4c83c', shadow_mul=(0.8, 0.68, 0.55)),
    'green': toon('green', '#5cc08a', shadow_mul=(0.7, 0.78, 0.8)),
    'blue': toon('blue', '#5b9be0', shadow_mul=(0.72, 0.72, 0.82)),
    'roof': toon('roof', '#8f4a3a'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(21)

# ---------- Table Bay along the front ----------
EDGE, R = -0.62, 1.43
a0 = math.asin(-EDGE / R)
arc = [(R * math.cos(a), R * math.sin(a)) for a in (math.pi + a0 + (math.pi - 2 * a0) * k / 40 for k in range(41))]
bm = bmesh.new()
bm.faces.new([bm.verts.new((x, y, G + 0.003)) for x, y in arc])
finish('bay', bm, M['water'], outline=0)


def ring(cx, cy, rx, ry, z, jitter, sides=14):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


def peak(name, cx, cy, r, h):
    a = loft(name, M['slope'], [ring(cx, cy, r, r, -0.01, 0.0, 10), ring(cx, cy, r * 0.75, r * 0.75, h * 0.4, 0.12, 10),
                                ring(cx, cy, r * 0.5, r * 0.5, h * 0.62, 0.12, 10)], outline=0.035)
    b = loft(name + 'rock', M['cliff'], [ring(cx, cy, r * 0.52, r * 0.52, h * 0.56, 0.1, 10), ring(cx, cy, r * 0.3, r * 0.3, h * 0.85, 0.12, 10),
                                         ring(cx, cy, 0.03, 0.03, h, 0.0, 10)], outline=0.035)
    a.visible_shadow = b.visible_shadow = False


# ---------- the massif: green slopes, grey cliffs, the flat top ----------
MX, MY, TOP = -0.05, 0.42, 0.92
slopes = loft('slopes', M['slope'], [ring(MX, MY, 1.1, 0.5, -0.01, 0.02), ring(MX, MY, 0.98, 0.42, 0.25, 0.04),
                                    ring(MX, MY, 0.86, 0.36, 0.45, 0.04)], outline=0.04)
cliffs = loft('cliffs', M['cliff'], [ring(MX, MY, 0.88, 0.37, 0.4, 0.03), ring(MX, MY, 0.82, 0.33, 0.75, 0.03),
                                    ring(MX, MY, 0.8, 0.32, TOP, 0.0)], outline=0.04)
slopes.visible_shadow = cliffs.visible_shadow = False
peak('lionshead', 0.98, -0.05, 0.3, 0.62)
peak('devilspeak', -0.98, 0.3, 0.3, 0.8)

# ---------- the tablecloth: cloud on the top, spilling over the front edge ----------
for k in range(11):
    t = -1 + 2 * k / 10
    x = MX + t * 0.74
    ball(f'cloud{k}', M['cloud'], x, MY - 0.24 * math.sqrt(1 - 0.8 * t * t), G + TOP + 0.02, 0.1 + 0.03 * (k % 2), outline=0.025)
    if k % 2 == 0 and abs(t) < 0.9:
        ball(f'drip{k}', M['cloud'], x + 0.04, MY - 0.33 * math.sqrt(1 - 0.8 * t * t), G + TOP - 0.1, 0.07, outline=0.02)

# ---------- Bo-Kaap's bright houses on the shore ----------
for k, (x, colour) in enumerate(((-0.62, 'pink'), (-0.42, 'yellow'), (-0.22, 'green'), (-0.02, 'blue'), (0.18, 'pink'),
                                 (0.38, 'yellow'), (0.58, 'green'))):
    y = -0.42 + 0.03 * (k % 2)
    box(f'house{k}', M[colour], x, y, G, 0.14, 0.12, 0.11 + 0.02 * (k % 3), outline=0.018, bevel=0.004)
    pyramid(f'houseroof{k}', M['roof'], x, y, G + 0.11 + 0.02 * (k % 3), 0.15, 0.05, outline=0.014)

turn(before, -32)
render(G)

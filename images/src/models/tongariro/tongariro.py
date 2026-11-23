# A cartoon Tongariro for the country maps, built in the set's shared look (../toon.py): Ngauruhoe's
# perfect dark cone, the Red Crater's rusty rim steaming, the three Emerald Lakes shining green in the
# volcanic ground below it, Blue Lake beyond, and hikers on the crossing's track.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P tongariro.py -- tongariro-1024.png 1024 tongariro.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#9a8270', shadow_mul=(0.86, 0.8, 0.8), lift=0.2),
    'cone': toon('cone', '#5a4a44', shadow_mul=(0.84, 0.82, 0.86)),
    'scree': toon('scree', '#7a6458', shadow_mul=(0.84, 0.82, 0.86)),
    'red': toon('redCrater', '#a84a32', shadow_mul=(0.86, 0.74, 0.72)),
    'emerald': toon('emerald', '#2ec0a0', shadow_mul=(0.74, 0.86, 0.84), lift=0.35),
    'blue': toon('blueLake', '#3a8ad0', lift=0.3),
    'steam': toon('steam', '#f2f2f0', shadow_mul=(0.86, 0.88, 0.94), lift=0.1),
    'tussock': toon('tussock', '#b8a860', shadow_mul=(0.82, 0.8, 0.72)),
    'track': toon('track', '#c8b8a0', lift=0.2),
    's0': toon('s0', '#e8402c'), 's1': toon('s1', '#f0c030'), 's2': toon('s2', '#2f6fc0'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(1907)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- Ngauruhoe's cone ----------
lathe('ngauruhoe', M['cone'], ((0.62, 0), (0.42, 0.3), (0.2, 0.66), (0.12, 0.74)), G - 0.01, -0.35, 0.65, segs=28, outline=0.018)
lathe('ngauruhoetop', M['scree'], ((0.125, 0), (0.1, 0.02), (0.07, 0.01)), G + 0.73, -0.35, 0.65, segs=28, outline=0.008)
for k in range(6):
    a = math.radians(220 + k * 18)
    bar(f'screestreak{k}', M['scree'], (-0.35 + 0.6 * math.cos(a), 0.65 + 0.6 * math.sin(a), G + 0.01), (-0.35 + 0.14 * math.cos(a), 0.65 + 0.14 * math.sin(a), G + 0.72), 0.035,
        outline=0)

# ---------- the Red Crater ----------
RX, RY = 0.55, 0.45
lathe('redcrater', M['red'], ((0.32, 0), (0.24, 0.18), (0.16, 0.24), (0.1, 0.18)), G - 0.01, RX, RY, segs=18, outline=0.014)
for k, (dx, dz, r) in enumerate(((0.0, 0.0, 0.05), (0.04, 0.05, 0.045), (-0.03, 0.09, 0.04))):
    ball(f'steam{k}', M['steam'], RX + dx, RY + 0.05, G + 0.28 + dz, r, outline=0.006)

# ---------- the Emerald Lakes and Blue Lake ----------
for k, (x, y, rx, ry) in enumerate(((0.25, -0.15, 0.16, 0.1), (0.5, -0.05, 0.12, 0.08), (0.42, -0.32, 0.1, 0.07))):
    flat_face(f'emerald{k}', M['emerald'], [(x + rx * math.cos(t), y + ry * math.sin(t)) for t in (2 * math.pi * j / 20 for j in range(20))], G + 0.004, outline=0.006)
flat_face('bluelake', M['blue'], [(0.95 + 0.2 * math.cos(t), 0.0 + 0.14 * math.sin(t)) for t in (2 * math.pi * j / 20 for j in range(20))], G + 0.004, outline=0.006)

# ---------- the track, hikers, tussock ----------
TRACK = [(-1.0, -0.6), (-0.5, -0.4), (0.0, -0.3), (0.3, 0.1), (0.55, 0.2)]
for k in range(len(TRACK) - 1):
    bar(f'track{k}', M['track'], (TRACK[k][0], TRACK[k][1], G - 0.002), (TRACK[k + 1][0], TRACK[k + 1][1], G - 0.002), 0.04, outline=0.002)
for k, (x, y) in enumerate(((-0.55, -0.42), (-0.45, -0.38), (-0.08, -0.32))):
    rod(f'hiker{k}', M[f's{k}'], (x, y, G), (x, y, G + 0.07), 0.014, segs=6, outline=0.003)
    ball(f'hikerhead{k}', M['s1'] if k != 1 else M['s0'], x, y, G + 0.085, 0.013, outline=0.002)
for k in range(12):
    a = rng.uniform(math.radians(190), math.radians(350))
    r = rng.uniform(0.6, 1.2)
    x, y = r * math.cos(a), r * math.sin(a)
    for j in range(4):
        b = 2 * math.pi * j / 4 + k
        bar(f'tussock{k}{j}', M['tussock'], (x, y, G), (x + 0.03 * math.cos(b), y + 0.03 * math.sin(b), G + 0.05), 0.012, outline=0.002)

turn(before, -20)
render(G)

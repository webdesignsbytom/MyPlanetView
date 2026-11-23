# A cartoon Madriu-Perafita-Claror Valley for the country maps, built in the set's shared look
# (../toon.py): Andorra's high glacial valley, green slopes rising to grey rock and snow on either
# side, a stream winding down from a tarn under the far ridge, stone shepherds' huts under slate
# roofs, dry-stone walls, pines and grazing cows. Turned a little towards the camera.
# Run: blender -b --factory-startup -P madriu-valley.py -- madriu-valley-1024.png 1024 madriu-valley.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'slope': toon('slope', '#5f9e55', shadow_mul=(0.7, 0.78, 0.8)),
    'rock': toon('rock', '#8f8a84', shadow_mul=(0.8, 0.8, 0.88)),
    'snow': toon('snow', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'stream': toon('stream', '#5ab0dc', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'stone': toon('stone', '#a89c8a', shadow_mul=(0.8, 0.8, 0.86)),
    'slate': toon('slate', '#5a5c64', shadow_mul=(0.8, 0.8, 0.88)),
    'pine': toon('pine', '#2f6e45', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a6048'),
    'cow': toon('cow', '#a8683e'),
    'cowWhite': toon('cowWhite', '#f4efe2', lift=0.2),
    'window': flat('window', '#3a3640'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(601)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the mountains on either side and at the back: green, then rock, then snow ----------
def ridge(name, cx, cy, rx, ry, h, k):
    rings = []
    for s, z in ((1.0, -0.01), (0.72, 0.3 * h), (0.48, 0.6 * h), (0.28, 0.85 * h), (0.07, h)):
        rings.append([(cx + s * rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), cy + s * ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k)), G + z)
                      for t in (2 * math.pi * j / 20 for j in range(20))])
    for part, mat, a, b in (('slope', 'slope', 0, 3), ('rock', 'rock', 2, 4), ('snow', 'snow', 3, 5)):
        piece = loft(f'{name}{part}', M[mat], rings[a:b], outline=0.025)
        piece.visible_shadow = False


ridge('left', -0.75, 0.2, 0.45, 0.75, 0.72, 1)
ridge('right', 0.78, 0.25, 0.42, 0.72, 0.62, 2)
ridge('back', 0.0, 0.98, 0.42, 0.24, 0.58, 3)

# ---------- the tarn under the far ridge, and the stream winding down from it ----------
flat_face('tarn', M['stream'], [(0.02 + 0.2 * math.cos(t), 0.7 + 0.09 * math.sin(t)) for t in (2 * math.pi * j / 18 for j in range(18))], G + 0.004, outline=0.008)
PATH = [(0.02, 0.62), (0.1, 0.45), (0.0, 0.25), (-0.12, 0.05), (-0.05, -0.15), (0.1, -0.35), (0.06, -0.6), (-0.08, -0.85), (-0.05, -1.1), (0.05, -1.3)]
bm = bmesh.new()
verts = []
for i, (x, y) in enumerate(PATH):
    (x0, y0), (x1, y1) = PATH[max(0, i - 1)], PATH[min(len(PATH) - 1, i + 1)]
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy)
    w = 0.03 + 0.015 * i / len(PATH)
    verts.append((bm.verts.new((x - dy / n * w, y + dx / n * w, G + 0.006)), bm.verts.new((x + dy / n * w, y - dx / n * w, G + 0.006))))
for (a0, a1), (b0, b1) in zip(verts, verts[1:]):
    bm.faces.new((a0, a1, b1, b0))
finish('stream', bm, M['stream'], outline=0.006)


# ---------- stone shepherds' huts, dry-stone walls ----------
def hut(name, x, y, w, d, rot):
    box(name, M['stone'], x, y, G - 0.005, w, d, 0.09, rot_z=rot, outline=0.01, bevel=0)
    c, s = math.cos(rot), math.sin(rot)
    at = lambda dx, dy, z: (x + dx * c - dy * s, y + dx * s + dy * c, z)
    loft(f'{name}roof', M['slate'], [[at(-w / 2 - 0.015, -d / 2 - 0.015, G + 0.085), at(w / 2 + 0.015, -d / 2 - 0.015, G + 0.085), at(w / 2 + 0.015, d / 2 + 0.015, G + 0.085),
                                      at(-w / 2 - 0.015, d / 2 + 0.015, G + 0.085)],
                                     [at(-w / 2 - 0.015, -0.004, G + 0.135), at(w / 2 + 0.015, -0.004, G + 0.135), at(w / 2 + 0.015, 0.004, G + 0.135),
                                      at(-w / 2 - 0.015, 0.004, G + 0.135)]], outline=0.008)
    ox, oy, _ = at(0, -d / 2 - 0.004, 0)
    box(f'{name}door', M['window'], ox, oy, G, 0.03, 0.01, 0.055, rot_z=rot, outline=0, bevel=0)


hut('hut1', -0.28, -0.25, 0.16, 0.11, 0.2)
hut('hut2', 0.32, 0.1, 0.14, 0.1, -0.3)
hut('hut3', -0.22, 0.42, 0.13, 0.1, 0.5)
for k, ((x0, y0), (x1, y1)) in enumerate((((-0.45, -0.45), (-0.15, -0.5)), ((-0.15, -0.5), (0.0, -0.4)), ((0.25, -0.1), (0.45, -0.2)), ((0.4, 0.3), (0.5, 0.0)))):
    bar(f'drywall{k}', M['stone'], (x0, y0, G + 0.02), (x1, y1, G + 0.02), 0.035, outline=0.006)

# ---------- pines along the slopes' feet ----------
for k, (x, y) in enumerate(((-0.5, -0.7), (-0.42, 0.75), (-0.55, 0.1), (0.5, -0.55), (0.55, 0.6), (0.48, -0.25), (-0.62, -0.35), (0.3, -0.85), (-0.3, -0.95))):
    h = rng.uniform(0.18, 0.26)
    rod(f'pinetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.05), 0.014, segs=6, outline=0.004)
    lathe(f'pine{k}', M['pine'], ((0.07, 0), (0.05, h * 0.45), (0.055, h * 0.45 + 0.01), (0.03, h * 0.8), (0.004, h)), G + 0.04, x, y, segs=10, outline=0.008,
          smooth=False)


# ---------- cows grazing ----------
def cow(name, x, y, deg):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    at = lambda dx, dy, z: (x + dx * c - dy * s, y + dx * s + dy * c, z)
    for k, (dx, dy) in enumerate(((-0.035, -0.018), (-0.035, 0.018), (0.035, -0.018), (0.035, 0.018))):
        rod(f'{name}leg{k}', M['cow'], at(dx, dy, G), at(dx, dy, G + 0.045), 0.007, segs=6, outline=0.002)
    bx, by, _ = at(0, 0, 0)
    box(f'{name}body', M['cow'], bx, by, G + 0.04, 0.1, 0.05, 0.045, rot_z=a, outline=0.006, bevel=0.012)
    px, py, _ = at(0.01, -0.026, 0)
    box(f'{name}patch', M['cowWhite'], px, py, G + 0.05, 0.035, 0.004, 0.025, rot_z=a, outline=0, bevel=0)
    hx, hy, _ = at(0.065, 0, 0)
    box(f'{name}head', M['cow'], hx, hy, G + 0.06, 0.035, 0.032, 0.032, rot_z=a, outline=0.004, bevel=0.008)


cow('cow1', 0.18, -0.65, 150)
cow('cow2', -0.3, 0.05, 30)

turn(before, -20)
render(G)

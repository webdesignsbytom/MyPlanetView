# A cartoon Landwasser Viaduct for the country maps, built in the set's shared look (../toon.py):
# the Rhaetian Railway's curved stone viaduct striding on its tall slender piers over the gorge of
# the Landwasser, running straight into a tunnel in the cliff face, a red train on it, and the
# pines in the valley. Turned a little towards the camera.
# Run: blender -b --factory-startup -P landwasser-viaduct.py -- landwasser-viaduct-1024.png 1024 landwasser-viaduct.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'valley': toon('valley', '#7aa84a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'stone': toon('stone', '#b8aa94', shadow_mul=(0.82, 0.8, 0.86)),
    'stoneDark': toon('stoneDark', '#968a76', shadow_mul=(0.82, 0.8, 0.86)),
    'cliff': toon('cliff', '#8a847c', shadow_mul=(0.84, 0.84, 0.9)),
    'tunnel': flat('tunnel', '#2e2a30'),
    'train': toon('train', '#c8302a'),
    'trainWindow': flat('trainWindow', '#3a4a64'),
    'river': toon('river', '#4a9ab8', lift=0.3),
    'pine': toon('pine', '#2f6a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'cliffTop': toon('cliffTop', '#5a8a48', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['valley'])
before = set(bpy.data.objects)
rng = random.Random(1367)

# ---------- the river in the gorge ----------
riv = [(-0.4, 1.2), (-0.2, 0.6), (0.05, 0.1), (0.0, -0.4), (-0.25, -0.9), (-0.35, -1.25)]
for k in range(len(riv) - 1):
    bar(f'river{k}', M['river'], (riv[k][0], riv[k][1], G - 0.002), (riv[k + 1][0], riv[k + 1][1], G - 0.002), 0.1, outline=0.003)

# ---------- the cliff the tunnel goes into ----------
FOOT = [(0.72, -0.55), (1.15, -0.65), (1.32, -0.2), (1.25, 0.45), (0.9, 0.75), (0.68, 0.35)]
cl = loft('cliff', M['cliff'], [[(x, y, G - 0.01) for x, y in FOOT], [(x + 0.02, y, G + 0.62) for x, y in FOOT]], outline=0.018)
cl.visible_shadow = False
ct = loft('clifftop', M['cliffTop'], [[(x + 0.02, y, G + 0.615) for x, y in FOOT], [(0.98 + (x - 0.98) * 0.9, 0.05 + (y - 0.05) * 0.9, G + 0.66) for x, y in FOOT]], outline=0.01,
          smooth=True)
ct.visible_shadow = False
for k in range(6):
    a = 2 * math.pi * k / 6
    lathe(f'cliffpine{k}', M['pine'], ((0.05, 0), (0.004, 0.14)), G + 0.65, 0.98 + 0.2 * math.cos(a), 0.05 + 0.3 * math.sin(a), segs=10, outline=0.006)

# ---------- the viaduct: a curve of piers and arches into the cliff ----------
C, R = (0.55, -1.2), 1.32
A0, A1 = math.radians(148), math.radians(83)
NP = 7
DECK = G + 0.42


def on_arc(t, r=R):
    a = A0 + (A1 - A0) * t
    return (C[0] + r * math.cos(a), C[1] + r * math.sin(a)), a


for k in range(NP):
    (x, y), a = on_arc(k / (NP - 1))
    rot = a + math.pi / 2
    bottom = [(-0.05, -0.05), (0.05, -0.05), (0.05, 0.05), (-0.05, 0.05)]
    top = [(-0.032, -0.045), (0.032, -0.045), (0.032, 0.045), (-0.032, 0.045)]

    def place(pts, z):
        return [(x + u * math.cos(rot) - v * math.sin(rot), y + u * math.sin(rot) + v * math.cos(rot), z) for u, v in pts]

    loft(f'pier{k}', M['stone'], [place(bottom, G - 0.01), place(top, DECK - 0.01)], outline=0.008)
for k in range(NP - 1):
    for j in range(7):
        t0 = (k + 0.15 + 0.7 * (j / 7)) / (NP - 1)
        t1 = (k + 0.15 + 0.7 * ((j + 1) / 7)) / (NP - 1)
        um = (j + 0.5) / 7
        z = DECK - 0.14 + 0.1 * math.sqrt(max(0.0, 1 - (2 * um - 1) ** 2))
        (x0, y0), _ = on_arc(t0)
        (x1, y1), a = on_arc(t1)
        L = math.hypot(x1 - x0, y1 - y0) + 0.004
        box(f'spandrel{k}_{j}', M['stoneDark'], (x0 + x1) / 2, (y0 + y1) / 2, z, L, 0.08, DECK - z, rot_z=math.atan2(y1 - y0, x1 - x0), outline=0.003, bevel=0)
for k in range(12):
    (x0, y0), _ = on_arc(k / 12)
    (x1, y1), _ = on_arc((k + 1) / 12)
    box(f'deck{k}', M['stone'], (x0 + x1) / 2, (y0 + y1) / 2, DECK - 0.012, math.hypot(x1 - x0, y1 - y0) + 0.01, 0.1, 0.03, rot_z=math.atan2(y1 - y0, x1 - x0), outline=0.006,
        bevel=0)
(ex, ey), ea = on_arc(1.0)
box('tunnel', M['tunnel'], 0.675, ey, DECK - 0.012, 0.02, 0.13, 0.13, outline=0, bevel=0)

# ---------- the red train going into the tunnel ----------
for k, (t0, t1) in enumerate(((0.62, 0.74), (0.75, 0.87), (0.88, 0.99))):
    (x0, y0), _ = on_arc(t0)
    (x1, y1), _ = on_arc(t1)
    ang = math.atan2(y1 - y0, x1 - x0)
    box(f'car{k}', M['train'], (x0 + x1) / 2, (y0 + y1) / 2, DECK + 0.02, math.hypot(x1 - x0, y1 - y0), 0.07, 0.07, rot_z=ang, outline=0.006, bevel=0)
    box(f'carwin{k}', M['trainWindow'], (x0 + x1) / 2 + 0.036 * math.sin(ang), (y0 + y1) / 2 - 0.036 * math.cos(ang), DECK + 0.055, math.hypot(x1 - x0, y1 - y0) * 0.75,
        0.004, 0.022, rot_z=ang, outline=0, bevel=0)

# ---------- pines in the valley ----------
for k in range(18):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.4, 1.25)
    x, y = r * math.cos(a), r * math.sin(a)
    if x > 0.6 and -0.7 < y < 0.8:
        continue
    lathe(f'pine{k}', M['pine'], ((0.055, 0), (0.004, 0.17)), G, x, y, segs=10, outline=0.006)

turn(before, -20)
render(G)

# A cartoon Citadelle Laferrière for the country maps, built in the set's shared look (../toon.py):
# Haiti's huge fortress on the summit of its green mountain, its sheer walls coming to a point like
# a ship's prow, rows of gun ports, the higher inner block behind, cannon on the terraces and the
# flag of Haiti, the forest up the mountain's sides and a cloud drifting past. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P citadelle.py -- citadelle-1024.png 1024 citadelle.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'slope': toon('slope', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'forest': toon('forest', '#3a7f43', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#b2a084', shadow_mul=(0.8, 0.76, 0.82)),
    'stoneDark': toon('stoneDark', '#968468', shadow_mul=(0.8, 0.76, 0.82)),
    'port': flat('port', '#3a3230'),
    'cannon': toon('cannon', '#3f3f46'),
    'cloud': toon('cloud', '#fbfbfd', shadow_mul=(0.82, 0.85, 0.95), lift=0.1),
    'flagBlue': flat('flagBlue', '#00209f'),
    'flagRed': flat('flagRed', '#d21034'),
    'pole': toon('pole', '#e8e4da'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(193)

# ---------- the mountain ----------
SIDES = 18


def ring(cx, cy, r, z, jitter, squash=0.85):
    return [(cx + r * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / SIDES),
             cy + r * squash * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / SIDES), G + z) for k in range(SIDES)]


TOP = 0.4
mountain = loft('mountain', M['slope'], [ring(0.0, 0.08, 1.3, -0.01, 0.02), ring(0.0, 0.08, 1.12, TOP * 0.45, 0.05), ring(0.0, 0.1, 0.96, TOP * 0.85, 0.04),
                                         ring(0.0, 0.12, 0.88, TOP, 0.02)], outline=0.035)
mountain.visible_shadow = False
for k in range(16):
    a = 2 * math.pi * k / 16 + rng.uniform(-0.1, 0.1)
    t = rng.uniform(0.15, 0.7)
    r = 1.3 - (1.3 - 0.96) * t
    ball(f'forest{k}', M['forest'], r * math.cos(a), 0.08 + r * 0.85 * math.sin(a), G + TOP * 0.85 * t + 0.03, rng.uniform(0.09, 0.13), outline=0.018)

# ---------- the fortress: its footprint comes to a prow ----------
PROW = math.radians(-120)                 # the way the prow points, round from +X
FOOT = [(0.0, -0.58), (0.2, -0.2), (0.34, 0.05), (0.32, 0.4), (-0.32, 0.4), (-0.34, 0.05), (-0.2, -0.2)]   # built pointing -Y


S = 1.45                                  # the fortress's size against its footprint above


def turned(pts, cx=0.0, cy=0.12):
    a = PROW + math.pi / 2
    return [(cx + S * (x * math.cos(a) - y * math.sin(a)), cy + S * (x * math.sin(a) + y * math.cos(a))) for x, y in pts]


Z0, WH = G + TOP - 0.02, 0.5
outer = turned(FOOT)
inner = turned([(x * 0.94, y * 0.94) for x, y in FOOT])
loft('walls', M['stone'], [[(x, y, Z0) for x, y in outer], [(x, y, Z0 + WH) for x, y in inner]], outline=0.03)
box_top = turned([(x * 0.94, y * 0.94) for x, y in FOOT])
loft('parapet', M['stoneDark'], [[(x, y, Z0 + WH - 0.005) for x, y in box_top], [(x, y, Z0 + WH + 0.03) for x, y in box_top]], outline=0.018)
# the higher inner block at the back
back = turned([(-0.26, 0.05), (0.26, 0.05), (0.26, 0.36), (-0.26, 0.36)])
loft('keep', M['stone'], [[(x, y, Z0 + WH) for x, y in back], [(x, y, Z0 + WH + 0.16) for x, y in back]], outline=0.024)
# gun ports along each face, two rows
for i, ((x0, y0), (x1, y1)) in enumerate(zip(outer, outer[1:] + outer[:1])):
    length = math.hypot(x1 - x0, y1 - y0)
    a = math.atan2(y1 - y0, x1 - x0)
    nx, ny = math.sin(a), -math.cos(a)   # out of the face (the footprint runs anticlockwise)
    count = int(length / 0.09)
    for row, zt in enumerate((0.45, 0.75)):
        inset = 0.022 * zt                # the walls lean in a little towards the top
        for k in range(count):
            t = (k + 0.5) / count
            px, py = x0 + (x1 - x0) * t - nx * inset, y0 + (y1 - y0) * t - ny * inset
            box(f'port{i}{row}{k}', M['port'], px + nx * 0.004, py + ny * 0.004, Z0 + WH * zt, 0.035, 0.012, 0.035, rot_z=a, outline=0,
                bevel=0)
# cannon on the terraces, and the flag
for k, (x, y) in enumerate(turned([(-0.15, -0.15), (0.15, -0.15), (0.0, -0.35)])):
    rod(f'cannon{k}', M['cannon'], (x, y, Z0 + WH + 0.03), (x + 0.08 * math.cos(PROW), y + 0.08 * math.sin(PROW), Z0 + WH + 0.05), 0.016,
        r2=0.012, segs=10, outline=0.006)
fx, fy = turned([(0.0, 0.2)])[0]
rod('flagpole', M['pole'], (fx, fy, Z0 + WH + 0.16), (fx, fy, Z0 + WH + 0.46), 0.006, segs=6, outline=0.003)
box('flagblue', M['flagBlue'], fx + 0.065, fy, Z0 + WH + 0.41, 0.12, 0.006, 0.035, outline=0, bevel=0)
box('flagred', M['flagRed'], fx + 0.065, fy, Z0 + WH + 0.375, 0.12, 0.006, 0.035, outline=0, bevel=0)

# ---------- a cloud drifting past ----------
for k, (x, y, z, r) in enumerate(((0.78, 0.45, 1.05, 0.13), (0.94, 0.4, 1.08, 0.11), (0.66, 0.4, 1.02, 0.1))):
    ball(f'cloud{k}', M['cloud'], x, y, G + z, r, outline=0.02)

turn(before, -20)
render(G)

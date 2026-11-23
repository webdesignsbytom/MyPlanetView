# A cartoon Malabo Cathedral for the country maps, built in the set's shared look (../toon.py): the
# neo-Gothic Cathedral of Saint Elizabeth on Bioko, its cream front between two tall towers with
# their spires, the rose window and pointed doorways, buttresses along the nave, palms in the
# square, the bay beside it, and Pico Basilé's green volcano behind. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P malabo-cathedral.py -- malabo-cathedral-1024.png 1024 malabo-cathedral.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#ddd3c0', lift=0.25),
    'sea': toon('sea', '#3fa3d6', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'cream': toon('cream', '#f0e4c8', shadow_mul=(0.84, 0.8, 0.82), lift=0.2),
    'trim': toon('trim', '#c88a5a', shadow_mul=(0.84, 0.74, 0.72)),
    'spire': toon('spire', '#8a5a48', shadow_mul=(0.82, 0.74, 0.76)),
    'window': flat('window', '#3a3a52'),
    'rose': flat('rose', '#3f6fb8'),
    'slate': toon('slate', '#6a6470', shadow_mul=(0.78, 0.78, 0.86)),
    'volcano': toon('volcano', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'volcanoTop': toon('volcanoTop', '#7a8a72', shadow_mul=(0.76, 0.8, 0.82)),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'lawn': toon('lawn', '#7cc061', lift=0.25),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(479)


def ring(cx, cy, rx, ry, z, jitter, sides=16):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


def slab(name, mat, pts, y0, y1):
    loft(name, mat, [[(px, y0, pz) for px, pz in pts], [(px, y1, pz) for px, pz in pts]], outline=0)


def pointed_arch(name, mat, x, z0, a, h1, y):
    left = [(x + a + 2 * a * math.cos(t), z0 + h1 + 2 * a * math.sin(t)) for t in (math.pi - (math.pi / 3) * k / 6 for k in range(7))]
    pts = [(x - a, z0), (x + a, z0)] + [(2 * x - px, pz) for px, pz in left] + list(reversed(left))[1:]
    slab(name, mat, pts, y - 0.004, y + 0.002)


# ---------- Pico Basilé behind, the bay to one side ----------
v = loft('volcano', M['volcano'], [ring(-0.3, 0.98, 0.5, 0.25, -0.01, 0.02), ring(-0.3, 1.0, 0.32, 0.15, 0.45, 0.06), ring(-0.3, 1.01, 0.13, 0.07, 0.78, 0.05)],
         outline=0.035)
vt = loft('volcanotop', M['volcanoTop'], [ring(-0.3, 1.01, 0.135, 0.072, 0.775, 0.0), ring(-0.3, 1.01, 0.05, 0.035, 0.85, 0.04)], outline=0.02)
v.visible_shadow = vt.visible_shadow = False
R = 1.42
BAY = [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(-50, 41, 8)] + [(1.0, 0.75), (0.8, 0.2), (0.75, -0.4), (0.9, -1.05)]
bm = bmesh.new()
bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, G + 0.003)) for x, y in BAY])])
finish('bay', bm, M['sea'], outline=0.01)

# ---------- the cathedral ----------
CX, CY, W, L, H = -0.1, 0.3, 0.36, 0.72, 0.36
FY = CY - L / 2
box('nave', M['cream'], CX, CY, G - 0.005, W, L, H, outline=0.022, bevel=0)
loft('naveroof', M['slate'], [[(CX - W / 2 - 0.01, CY - L / 2, G + H - 0.005), (CX + W / 2 + 0.01, CY - L / 2, G + H - 0.005), (CX + W / 2 + 0.01, CY + L / 2, G + H - 0.005),
                               (CX - W / 2 - 0.01, CY + L / 2, G + H - 0.005)],
                              [(CX - 0.004, CY - L / 2, G + H + 0.14), (CX + 0.004, CY - L / 2, G + H + 0.14), (CX + 0.004, CY + L / 2, G + H + 0.14),
                               (CX - 0.004, CY + L / 2, G + H + 0.14)]], outline=0.016)
for s in (-1, 1):
    for k in range(5):
        y = FY + 0.18 + k * 0.12
        box(f'buttress{s}{k}', M['trim'], CX + s * (W / 2 + 0.015), y, G - 0.005, 0.03, 0.035, H * 0.8, outline=0.008, bevel=0)
for s in (-1, 1):
    for k in range(4):
        y = FY + 0.24 + k * 0.12
        x = CX + s * (W / 2 + 0.003)
        loft(f'navewin{s}{k}', M['window'], [[(x - 0.004, y - 0.02, G + 0.12), (x - 0.004, y + 0.02, G + 0.12), (x - 0.004, y + 0.02, G + 0.24), (x - 0.004, y, G + 0.27),
                                              (x - 0.004, y - 0.02, G + 0.24)],
                                             [(x + 0.004, y - 0.02, G + 0.12), (x + 0.004, y + 0.02, G + 0.12), (x + 0.004, y + 0.02, G + 0.24), (x + 0.004, y, G + 0.27),
                                              (x + 0.004, y - 0.02, G + 0.24)]], outline=0)
# the front: its gable, the rose window, the doorways
box('front', M['cream'], CX, FY - 0.02, G - 0.005, W + 0.02, 0.06, H + 0.02, outline=0.02, bevel=0)
loft('frontgable', M['cream'], [[(CX - W / 2, FY - 0.05, G + H + 0.01), (CX + W / 2, FY - 0.05, G + H + 0.01), (CX, FY - 0.05, G + H + 0.15)],
                                [(CX - W / 2, FY + 0.01, G + H + 0.01), (CX + W / 2, FY + 0.01, G + H + 0.01), (CX, FY + 0.01, G + H + 0.15)]], outline=0.016)
cyl('rosewindow', M['trim'], 0.07, 0.01, segs=24, outline=0.006, matrix=Matrix.Translation((CX, FY - 0.052, G + 0.27)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('roseglass', M['rose'], 0.055, 0.01, segs=24, outline=0, matrix=Matrix.Translation((CX, FY - 0.056, G + 0.27)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
pointed_arch('door', M['window'], CX, G, 0.045, 0.09, FY - 0.052)
# the two towers and their spires
for s in (-1, 1):
    tx = CX + s * (W / 2 + 0.05)
    box(f'tower{s}', M['cream'], tx, FY - 0.01, G - 0.005, 0.13, 0.13, 0.62, outline=0.02, bevel=0)
    for k, z in enumerate((0.15, 0.32, 0.48)):
        pointed_arch(f'towerwin{s}{k}', M['window'], tx, G + z, 0.018, 0.05, FY - 0.077)
    box(f'towerband{s}', M['trim'], tx, FY - 0.01, G + 0.44, 0.14, 0.14, 0.02, outline=0.006, bevel=0)
    for cx in (-1, 1):
        for cy in (-1, 1):
            lathe(f'pinnacle{s}{cx}{cy}', M['trim'], ((0.012, 0), (0.002, 0.07)), G + 0.615, tx + cx * 0.055, FY - 0.01 + cy * 0.055, segs=6, outline=0.004,
                  smooth=False)
    lathe(f'spire{s}', M['spire'], ((0.06, 0), (0.004, 0.3)), G + 0.615, tx, FY - 0.01, segs=8, outline=0.012, smooth=False)
    rod(f'cross{s}', M['gold'], (tx, FY - 0.01, G + 0.91), (tx, FY - 0.01, G + 0.96), 0.005, segs=6, outline=0)

# ---------- the square's lawns and palms ----------
for s in (-1, 1):
    box(f'lawn{s}', M['lawn'], CX + s * 0.4, -0.55, G - 0.005, 0.3, 0.4, 0.015, outline=0.008, bevel=0)
for k, (x, y) in enumerate(((-0.55, -0.45), (-0.45, -0.7), (0.25, -0.45), (0.35, -0.72), (-0.85, 0.2), (-0.9, -0.2))):
    h = rng.uniform(0.32, 0.4)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + h), 0.016, r2=0.012, segs=8, outline=0.007)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + h), (x + 0.02 + 0.12 * math.cos(b), y + 0.12 * math.sin(b), G + h - 0.06), 0.024, outline=0.006)

turn(before, -20)
render(G)

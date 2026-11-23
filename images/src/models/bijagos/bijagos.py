# A cartoon Bijagós Archipelago for the country maps, built in the set's shared look (../toon.py):
# Guinea-Bissau's islands in the warm shallows, sandy beaches and palm-and-mangrove green, the
# saltwater hippos of Orango in the shallows, a village's thatched huts, and a sailing pirogue.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P bijagos.py -- bijagos-1024.png 1024 bijagos.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#3fa8b8', shadow_mul=(0.74, 0.84, 0.88), lift=0.35),
    'shallows': toon('shallows', '#7fd0c8', shadow_mul=(0.76, 0.86, 0.9), lift=0.3),
    'sand': toon('sand', '#f2e6c8', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'green': toon('green2', '#6aaa4a', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'mangrove': toon('mangrove', '#3f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'mud': toon('mud', '#c48a5a'),
    'thatch': toon('thatch', '#c9a85a', shadow_mul=(0.84, 0.76, 0.62)),
    'window': flat('window', '#3a3640'),
    'hippo': toon('hippo', '#8a7a82', shadow_mul=(0.8, 0.78, 0.86)),
    'hippoPink': toon('hippoPink', '#d8a0a0'),
    'pirogue': toon('pirogue', '#c8402f'),
    'sail': toon('sail', '#f4efe2', lift=0.15),
    'mast': toon('mast', '#8a6448'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(769)


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


def island(name, x, y, rx, ry, k):
    def ring(s, z):
        return [(x + s * rx * math.cos(t) * (1 + 0.08 * math.sin(3 * t + k)), y + s * ry * math.sin(t) * (1 + 0.08 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / 20 for j in range(20))]
    cyl(f'{name}shallows', M['shallows'], 1.0, 0.004, segs=24, outline=0, matrix=Matrix.Translation((x, y, G + 0.001)) @ Matrix.Scale(rx * 1.3, 4, (1, 0, 0)) @ Matrix.Scale(ry * 1.3, 4, (0, 1, 0)))
    loft(f'{name}sand', M['sand'], [ring(1.0, -0.01), ring(0.95, 0.03)], outline=0.012).visible_shadow = False
    loft(f'{name}green', M['green'], [ring(0.75, 0.025), ring(0.72, 0.05)], outline=0.01).visible_shadow = False


island('orango', -0.3, 0.3, 0.62, 0.42, 1)
island('east', 0.75, 0.55, 0.3, 0.22, 2)
island('south', 0.55, -0.55, 0.28, 0.18, 3)

# ---------- palms, mangroves and a village on the big island ----------
for k, (x, y) in enumerate(((-0.65, 0.4), (-0.45, 0.6), (-0.05, 0.55), (0.1, 0.25), (0.75, 0.6), (0.6, -0.52), (-0.7, 0.1))):
    h = rng.uniform(0.22, 0.3)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G + 0.05), (x + 0.03, y, G + 0.05 + h), 0.013, r2=0.01, segs=8, outline=0.006)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + 0.05 + h), (x + 0.03 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + h), 0.02, outline=0.005)
for k in range(8):
    a = math.radians(200 + k * 18)
    x, y = -0.3 + 0.55 * math.cos(a), 0.3 + 0.36 * math.sin(a)
    ball(f'mangrove{k}', M['mangrove'], x, y, G + 0.08, rng.uniform(0.06, 0.08), outline=0.01)
for k, (x, y, r) in enumerate(((-0.35, 0.35, 0.08), (-0.18, 0.42, 0.07), (-0.28, 0.12, 0.075))):
    lathe(f'hutwall{k}', M['mud'], ((r, 0), (r, 0.07)), G + 0.045, x, y, segs=14, outline=0.01)
    lathe(f'hutroof{k}', M['thatch'], ((r + 0.035, 0), (r * 0.5, 0.05), (0.004, 0.13)), G + 0.11, x, y, segs=14, outline=0.01)
    box(f'hutdoor{k}', M['window'], x, y - r - 0.002, G + 0.05, 0.03, 0.01, 0.05, outline=0, bevel=0)

# ---------- saltwater hippos in the shallows ----------
for k, (x, y, deg, s) in enumerate(((-0.1, -0.25, -60, 1.0), (-0.35, -0.3, -100, 0.75))):
    made = set(bpy.data.objects)
    squashed(f'hippobody{k}', M['hippo'], 0, 0, G + 0.02, 0.09 * s, 1.5, 1.0, 0.6, outline=0.012)
    squashed(f'hippohead{k}', M['hippo'], 0.14 * s, 0, G + 0.04, 0.055 * s, 1.3, 1.0, 0.75, outline=0.009)
    squashed(f'hipposnout{k}', M['hippoPink'], 0.2 * s, 0, G + 0.035, 0.035 * s, 0.8, 1.3, 0.7, outline=0.006)
    for sy in (-1, 1):
        ball(f'hippoear{k}{sy}', M['hippo'], 0.11 * s, sy * 0.035 * s, G + 0.08 * s, 0.012 * s, outline=0.003)
    place(made, deg, x, y)

# ---------- a sailing pirogue ----------
PX, PY = 0.2, -0.85
loft('pirogue', M['pirogue'], [[(PX - 0.15, PY, G + 0.0), (PX, PY - 0.03, G + 0.0), (PX + 0.15, PY, G + 0.0), (PX, PY + 0.03, G + 0.0)],
                               [(PX - 0.17, PY, G + 0.04), (PX, PY - 0.04, G + 0.035), (PX + 0.17, PY, G + 0.04), (PX, PY + 0.04, G + 0.035)]], outline=0.006)
rod('pmast', M['mast'], (PX, PY, G + 0.03), (PX, PY, G + 0.28), 0.005, segs=6, outline=0.002)
loft('psail', M['sail'], [[(PX - 0.1, PY - 0.002, G + 0.06), (PX + 0.06, PY - 0.002, G + 0.07), (PX - 0.005, PY - 0.002, G + 0.27)],
                          [(PX - 0.1, PY + 0.002, G + 0.06), (PX + 0.06, PY + 0.002, G + 0.07), (PX - 0.005, PY + 0.002, G + 0.27)]], outline=0.006)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

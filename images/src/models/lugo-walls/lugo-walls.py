# A cartoon Roman Walls of Lugo for the country maps, built in the set's shared look (../toon.py):
# the only Roman town walls left whole all the way round, in Galicia, Spain: the thick
# slate-grey wall with its walkway on top that people stroll along, the dozens of round
# towers bulging from it, a gate, the old town's houses and the cathedral's towers inside.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P lugo-walls.py -- lugo-walls-1024.png 1024 lugo-walls.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'slate': toon('slate', '#8a8680', shadow_mul=(0.8, 0.8, 0.86), lift=0.14),
    'walk': toon('walk', '#b8b0a2', lift=0.16),
    'white': toon('white', '#f2eee4', lift=0.22),
    'granite': toon('granite', '#c8c0b0', lift=0.18),
    'roof': toon('roof', '#b8603e'),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(2733427)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


# ---------- the wall all round ----------
RX, RY = 0.85, 0.7
WH = 0.16
ring = lambda sx, sy, z, n=48: [(sx * math.cos(2 * math.pi * k / n), sy * math.sin(2 * math.pi * k / n), z) for k in range(n)]
outer = loft('wallouter', M['slate'], [ring(RX + 0.05, RY + 0.05, G - 0.005), ring(RX + 0.04, RY + 0.04, G + WH)], outline=0.006)
loft('walltop', M['walk'], [ring(RX + 0.04, RY + 0.04, G + WH - 0.002), ring(RX + 0.04, RY + 0.04, G + WH + 0.004)], outline=0.002)
loft('wallinner', M['grass'], [ring(RX - 0.06, RY - 0.06, G + WH + 0.001), ring(RX - 0.06, RY - 0.06, G + WH + 0.007)], outline=0.002)
for k in range(22):
    a = 2 * math.pi * k / 22 + 0.1
    x, y = (RX + 0.06) * math.cos(a), (RY + 0.06) * math.sin(a)
    lathe(f'tower{k}', M['slate'], ((0.07, 0), (0.07, WH + 0.01)), G - 0.005, x, y, segs=16, outline=0.004)
    lathe(f'towertop{k}', M['walk'], ((0.072, 0), (0.072, 0.006)), G + WH + 0.005, x, y, segs=16, outline=0.001)
# a gate on the front
a = -math.pi / 2
gx, gy = (RX + 0.04) * math.cos(a), (RY + 0.04) * math.sin(a)
arch('gate', M['dark'], gx, gy - 0.012, G - 0.005, 0.08, 0.12)
box('gatearchstone', M['granite'], gx, gy - 0.01, G + 0.1, 0.12, 0.006, 0.025, outline=0, bevel=0)
# strollers on the walkway
for k in range(4):
    a = -math.pi / 2 + 0.6 + k * 0.35
    x, y = (RX + 0.02) * math.cos(a), (RY + 0.02) * math.sin(a)
    rod(f'stroller{k}', M['roof'] if k % 2 else M['granite'], (x, y, G + WH + 0.005), (x, y, G + WH + 0.04), 0.008, segs=6, outline=0.001)

# ---------- the old town inside, as high as the wall ----------
IZ = G + WH + 0.007
for k in range(9):
    x, y = -0.5 + 1.0 * rng.random(), -0.35 + 0.7 * rng.random()
    if abs(x - 0.0) < 0.2 and abs(y - 0.15) < 0.2:
        continue
    box(f'house{k}', M['white'], x, y, IZ - 0.005, 0.16, 0.12, 0.08, outline=0.004, bevel=0)
    hip(f'houseroof{k}', M['roof'], x, y, IZ + 0.075, 0.16, 0.12, 0.05, over=0.01)
# the cathedral's towers
CX, CY = 0.0, 0.15
box('cathedral', M['granite'], CX, CY + 0.08, IZ - 0.005, 0.2, 0.3, 0.16, outline=0.005, bevel=0)
gable('cathedralroof', M['roof'], CX, CY + 0.08, IZ + 0.155, 0.2, 0.3, 0.07, over=0.01)
for s in (-1, 1):
    box(f'cathtower{s}', M['granite'], CX + s * 0.08, CY - 0.08, IZ - 0.005, 0.07, 0.07, 0.3, outline=0.004, bevel=0)
    lathe(f'cathcupola{s}', M['granite'], ((0.035, 0), (0.035, 0.03), (0.02, 0.06), (0.0, 0.09)), IZ + 0.295, CX + s * 0.08, CY - 0.08, segs=8, outline=0.002, smooth=False)
arch('cathdoor', M['dark'], CX, CY - 0.073, IZ - 0.005, 0.05, 0.1)

for k, (x, y) in enumerate(((-1.1, -0.5), (1.1, -0.5), (-1.15, 0.35), (1.15, 0.4), (0.0, -1.0))):
    tree(f'tree{k}', x, y, r=0.08, h=0.1)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

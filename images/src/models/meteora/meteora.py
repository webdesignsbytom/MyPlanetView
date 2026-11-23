# A cartoon Meteora for the country maps, built in the set's shared look (../toon.py): the sheer
# sandstone pillars over the Thessaly plain, the monasteries perched on their tops with red roofs
# and stone walls, the stairs cut up one of them, and the green valley at their feet.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P meteora.py -- meteora-1024.png 1024 meteora.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'valley': toon('valley', '#8ab860', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'pillar': toon('pillar', '#a8927a', shadow_mul=(0.84, 0.8, 0.82)),
    'pillarDark': toon('pillarDark', '#8a7864', shadow_mul=(0.84, 0.8, 0.82)),
    'green': toon('green', '#5a9a48', shadow_mul=(0.7, 0.78, 0.8)),
    'wall': toon('wall', '#e2d6bc', shadow_mul=(0.84, 0.82, 0.86), lift=0.15),
    'roof': toon('roof', '#c4573a'),
    'window': flat('window', '#3a3640'),
    'stairs': toon('stairs', '#d8ccb0', lift=0.2),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['valley'])
before = set(bpy.data.objects)
rng = random.Random(1571)


def pillar(name, x, y, r, h, k):
    prof = ((r, 0), (r * 1.02, h * 0.3), (r * 0.96, h * 0.7), (r * 0.9, h * 0.94), (r * 0.6, h))
    lathe(name, M['pillar' if k % 2 else 'pillarDark'], prof, G - 0.01, x, y, segs=12, outline=0.014, smooth=False)
    ball(f'{name}cap', M['green'], x, y, G + h - 0.01, r * 0.62, outline=0.008)
    return G + h + 0.02


PILLARS = [(-0.45, 0.35, 0.24, 0.62), (0.25, 0.45, 0.26, 0.72), (0.75, 0.05, 0.2, 0.5), (-0.85, -0.05, 0.18, 0.44), (-0.1, 0.85, 0.2, 0.5), (0.0, -0.2, 0.14, 0.3)]
TOPS = [pillar(f'pillar{k}', x, y, r, h, k) for k, (x, y, r, h) in enumerate(PILLARS)]


def monastery(name, x, y, z, w):
    box(name, M['wall'], x, y, z - 0.02, w, w * 0.7, 0.08, outline=0.008, bevel=0)
    loft(f'{name}roof', M['roof'], [[(x - w / 2, y - w * 0.36, z + 0.055), (x + w / 2, y - w * 0.36, z + 0.055), (x + w / 2, y + w * 0.36, z + 0.055), (x - w / 2, y + w * 0.36, z + 0.055)],
                                    [(x - w / 2, y - 0.004, z + 0.1), (x + w / 2, y - 0.004, z + 0.1), (x + w / 2, y + 0.004, z + 0.1), (x - w / 2, y + 0.004, z + 0.1)]], outline=0.006)
    lathe(f'{name}dome', M['roof'], ((0.03, 0), (0.025, 0.02), (0.004, 0.045)), z + 0.06, x + w * 0.3, y, segs=10, outline=0.004)
    for j in range(3):
        box(f'{name}win{j}', M['window'], x - w / 3 + j * w / 3, y - w * 0.355, z + 0.01, 0.018, 0.006, 0.025, outline=0, bevel=0)


monastery('greatmeteoron', 0.25, 0.45, TOPS[1], 0.3)
monastery('varlaam', -0.45, 0.35, TOPS[0], 0.26)
monastery('rousanou', 0.75, 0.05, TOPS[2], 0.2)
monastery('trinity', -0.85, -0.05, TOPS[3], 0.17)
# stairs zigzag up the front of the tallest pillar
for k in range(5):
    z0, z1 = G + 0.05 + k * 0.13, G + 0.05 + (k + 1) * 0.13
    x0, x1 = 0.25 + (0.1 if k % 2 else -0.1), 0.25 + (-0.1 if k % 2 else 0.1)
    bar(f'stairs{k}', M['stairs'], (x0, 0.45 - 0.255, z0), (x1, 0.45 - 0.255, z1), 0.022, outline=0.003)
for k in range(10):
    a = rng.uniform(math.radians(200), math.radians(340))
    r = rng.uniform(0.5, 1.2)
    ball(f'tree{k}', M['tree'], r * math.cos(a), r * math.sin(a), G + 0.06, rng.uniform(0.06, 0.08), outline=0.01)

turn(before, -20)
render(G)

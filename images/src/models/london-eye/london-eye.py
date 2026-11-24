# A cartoon London Eye for the country maps, built in the set's shared look (../toon.py): the giant
# white wheel on the South Bank of the Thames, its rim braced by a ring of spokes to the hub, the glass
# capsules round the outside, the A-frame legs leaning out from the bank that hold it, the boarding
# pier over the river, and plane trees along the embankment. Turned a little towards the camera.
# Run: blender -b --factory-startup -P london-eye.py -- london-eye-1024.png 1024 london-eye.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c0b0', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'river': toon('river', '#4a7a9a', shadow_mul=(0.78, 0.84, 0.92), lift=0.3),
    'white': toon('white', '#f2f2ee', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'steel': toon('steel', '#c8ccd2', shadow_mul=(0.82, 0.84, 0.9)),
    'glass': toon('glass', '#9cc8de', shadow_mul=(0.8, 0.88, 0.94), lift=0.35),
    'stoneDark': toon('stoneDark', '#b4ac9c'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z, n=6):
    """The band of the tile's disc between y0 and y1 (counter-clockwise from above)."""
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


# the Thames in front, the South Bank behind
loft('river', M['river'], [strip(-1.41, -0.2, 1.42, -0.004), strip(-1.41, -0.2, 1.42, 0.004)], outline=0)
box('embankment', M['stoneDark'], 0, -0.2, G - 0.005, 2.7, 0.04, 0.03, outline=0.003, bevel=0)

# ---------- the wheel ----------
WY = -0.32                 # the wheel stands just out over the river
R = 0.68                   # the rim's radius
CZ = G + R + 0.1           # the hub's height
N = 32
rim = [(R * math.sin(2 * math.pi * k / N), WY, CZ + R * math.cos(2 * math.pi * k / N)) for k in range(N)]
for k in range(N):
    a, b = rim[k], rim[(k + 1) % N]
    bar(f'rim{k}', M['white'], a, b, 0.024, outline=0.003)
    inner = (a[0] * 0.92, WY, CZ + (a[2] - CZ) * 0.92)
    inner2 = (b[0] * 0.92, WY, CZ + (b[2] - CZ) * 0.92)
    bar(f'rimin{k}', M['white'], inner, inner2, 0.012, outline=0.002)
    bar(f'rimbrace{k}', M['white'], a, inner2, 0.008, outline=0)
for k in range(0, N, 2):
    a = rim[k]
    for fy in (-0.03, 0.03):
        rod(f'spoke{k}{fy}', M['steel'], (0, WY + fy, CZ), (a[0] * 0.92, WY, CZ + (a[2] - CZ) * 0.92), 0.0025, segs=4, outline=0)
cyl('hub', M['white'], 0.05, 0.1, segs=16, outline=0.004, matrix=Matrix.Translation((0, WY, CZ)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
# the capsules, on the outside of the rim
for k in range(N):
    a = 2 * math.pi * k / N
    x, z = (R + 0.045) * math.sin(a), CZ + (R + 0.045) * math.cos(a)
    cap = ball(f'capsule{k}', M['glass'], 0, 0, 0, 0.03, outline=0.004)
    cap.scale = (1.0, 1.7, 0.8)
    cap.location = (x, WY, z)
# the A-frame leaning out from the bank
for s in (-1, 1):
    bar(f'leg{s}', M['white'], (s * 0.24, 0.3, G), (0, WY + 0.06, CZ), 0.04, outline=0.004)
bar('legtie', M['white'], (-0.24, 0.3, G + 0.02), (0.24, 0.3, G + 0.02), 0.03, outline=0.003)
for k in range(2):
    rod(f'backstay{k}', M['steel'], (0, WY + 0.06, CZ), ((-1) ** k * 0.08, 0.85, G), 0.006, segs=5, outline=0)
# the boarding pier
box('pier', M['paving'], 0, WY, G - 0.004, 0.5, 0.12, 0.03, outline=0.003, bevel=0)

# ---------- plane trees along the embankment ----------
for k, x in enumerate((-1.05, -0.8, -0.55, 0.55, 0.8, 1.05)):
    y = 0.02
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.08), 0.014, segs=6, outline=0.002)
    ball(f'tree{k}', M['tree'], x, y, G + 0.15, 0.1, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

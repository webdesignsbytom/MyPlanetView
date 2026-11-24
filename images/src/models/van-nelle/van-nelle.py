# A cartoon Van Nelle Factory for the country maps, built in the set's shared look (../toon.py): the
# great "daylight factory" in Rotterdam, its long stepped blocks wrapped in glass curtain walls with
# thin frames, the slanting glass conveyor bridges crossing to the dispatch building, the round glass
# tea room perched on the roof, and the big VAN NELLE sign, by the Schie canal. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P van-nelle.py -- van-nelle-1024.png 1024 van-nelle.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c4bc', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'canal': toon('canal', '#4a7a8a', lift=0.3),
    'white': toon('white', '#f6f4ee', shadow_mul=(0.82, 0.84, 0.9), lift=0.2),
    'glass': toon('glass', '#7aa8c8', shadow_mul=(0.8, 0.88, 0.94), lift=0.3),
    'frame': flat('frame', '#2a3038'),
    'red': toon('red', '#c83a30', lift=0.12),
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8)),
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


loft('schie', M['canal'], [strip(-1.41, -0.85, 1.42, -0.004), strip(-1.41, -0.85, 1.42, 0.004)], outline=0)
box('lawn', M['lawn'], 0, -0.62, G - 0.004, 1.6, 0.3, 0.01, outline=0.001, bevel=0)


def glassblock(name, x, y, w, d, h):
    """A block wrapped in glass, its floors marked by white bands and thin frames."""
    box(name, M['glass'], x, y, G - 0.005, w, d, h, outline=0.007, bevel=0)
    floors = int(h / 0.08)
    for k in range(floors + 1):
        z = G + k * h / floors
        box(f'{name}floor{k}', M['white'], x, y, z - 0.008, w + 0.006, d + 0.006, 0.014, outline=0, bevel=0)
    n = int(w / 0.05)
    for j in range(n + 1):
        bar(f'{name}mullion{j}', M['frame'], (x - w / 2 + j * w / n, y - d / 2 - 0.004, G), (x - w / 2 + j * w / n, y - d / 2 - 0.004, G + h), 0.004, outline=0)
    for j in range(int(d / 0.05) + 1):
        yy = y - d / 2 + j * d / int(d / 0.05)
        bar(f'{name}sidemullion{j}', M['frame'], (x - w / 2 - 0.004, yy, G), (x - w / 2 - 0.004, yy, G + h), 0.004, outline=0)
    box(f'{name}roof', M['white'], x, y, G + h - 0.006, w + 0.012, d + 0.012, 0.014, outline=0.002, bevel=0)


# ---------- the factory blocks, stepping down from left to right ----------
glassblock('tobacco', -0.42, 0.25, 0.46, 0.3, 0.56)
glassblock('coffee', 0.06, 0.25, 0.46, 0.3, 0.44)
glassblock('tea', 0.5, 0.25, 0.36, 0.3, 0.32)
# the round glass tea room on the roof of the tallest block
lathe('tearoom', M['glass'], ((0.1, 0), (0.1, 0.08)), G + 0.55, -0.42, 0.25, segs=24, outline=0.004)
lathe('tearoomroof', M['white'], ((0.11, 0), (0.11, 0.015)), G + 0.63, -0.42, 0.25, segs=24, outline=0.002)
for k in range(12):
    a = 2 * math.pi * k / 12
    bar(f'tearoomframe{k}', M['frame'], (-0.42 + 0.102 * math.cos(a), 0.25 + 0.102 * math.sin(a), G + 0.55), (-0.42 + 0.102 * math.cos(a), 0.25 + 0.102 * math.sin(a), G + 0.63), 0.004, outline=0)
# the sign on the roof
for k in range(8):
    box(f'signletter{k}', M['red'], -0.2 + k * 0.05, 0.12, G + 0.46, 0.035, 0.008, 0.05, outline=0.001, bevel=0)
bar('signframe', M['frame'], (-0.22, 0.12, G + 0.445), (0.17, 0.12, G + 0.445), 0.008, outline=0)

# ---------- the dispatch building and the slanting conveyor bridges ----------
glassblock('dispatch', 0.0, -0.35, 0.7, 0.14, 0.2)
for k, x in enumerate((-0.32, -0.02, 0.28)):
    loft(f'bridge{k}', M['glass'], [[(x - 0.035, 0.1, G + 0.26 - 0.02 * k), (x + 0.035, 0.1, G + 0.26 - 0.02 * k), (x + 0.035, 0.1, G + 0.32 - 0.02 * k), (x - 0.035, 0.1, G + 0.32 - 0.02 * k)],
                                    [(x - 0.035, -0.28, G + 0.12), (x + 0.035, -0.28, G + 0.12), (x + 0.035, -0.28, G + 0.18), (x - 0.035, -0.28, G + 0.18)]], outline=0.003)
    bar(f'bridgeband{k}', M['white'], (x, 0.1, G + 0.32 - 0.02 * k), (x, -0.28, G + 0.18), 0.02, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

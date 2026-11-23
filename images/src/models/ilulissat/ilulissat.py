# A cartoon Ilulissat Icefjord for the country maps, built in the set's shared look (../toon.py):
# Greenland's fjord crowded with great icebergs, flat-topped and pointed, white above the deep blue
# water and pale turquoise below it, the glacier's ice front across the back, the rocky shore with
# Ilulissat's red, yellow, blue and green wooden houses, a fishing boat and a whale's tail.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P ilulissat.py -- ilulissat-1024.png 1024 ilulissat.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'fjord': toon('fjord', '#2a78a8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'ice': toon('ice', '#f4f9fc', shadow_mul=(0.78, 0.86, 0.96), lift=0.15),
    'iceBlue': toon('iceBlue', '#bfe3f2', shadow_mul=(0.78, 0.86, 0.96), lift=0.2),
    'underwater': toon('underwater', '#5fb4d4', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'rock': toon('rock', '#7a6f66', shadow_mul=(0.8, 0.8, 0.88)),
    'tundra': toon('tundra', '#8aa86a', shadow_mul=(0.72, 0.8, 0.8), lift=0.25),
    'red': toon('red', '#c8402f'), 'yellow': toon('yellow', '#f2c84a', shadow_mul=(0.84, 0.72, 0.6)),
    'blue': toon('blue', '#3f7fc0', shadow_mul=(0.74, 0.8, 0.9)), 'green': toon('green', '#4f9a5a', shadow_mul=(0.7, 0.78, 0.8)),
    'roofDark': toon('roofDark', '#3a3a40'),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'whale': toon('whale', '#3a3f48', shadow_mul=(0.8, 0.8, 0.88)),
    'boatRed': toon('boatRed', '#d0402f'),
})

G = tile(M['fjord'])
before = set(bpy.data.objects)
rng = random.Random(599)


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


def seg(radius, a0, a1, z, n=20):
    """The part of the tile cut off by the chord between angles a0 and a1 (degrees), as a ring at z."""
    return [(radius * math.cos(math.radians(a0 + (a1 - a0) * k / n)), radius * math.sin(math.radians(a0 + (a1 - a0) * k / n)), z) for k in range(n + 1)]


# ---------- the glacier's ice front across the back ----------
glacier = loft('glacier', M['ice'], [seg(1.42, 35, 145, G - 0.01), seg(1.4, 42, 138, G + 0.17)], outline=0.025)
glacier.visible_shadow = False
for k in range(7):
    x = -0.75 + k * 0.25
    bar(f'icestreak{k}', M['iceBlue'], (x, 0.81, G + 0.02), (x * 0.98, 0.9, G + 0.15), 0.022, outline=0.004)
for k in range(5):
    x = -0.4 + k * 0.2
    bar(f'crevasse{k}', M['iceBlue'], (x, 1.06, G + 0.175), (x + 0.06, 1.22, G + 0.175), 0.016, outline=0.003)
for k in range(11):
    x = -0.85 + k * 0.17 + rng.uniform(-0.03, 0.03)
    pyramid(f'serac{k}', M['ice'], x, 0.99 + rng.uniform(-0.02, 0.03), G + 0.165, rng.uniform(0.07, 0.1), rng.uniform(0.05, 0.09), outline=0.008)

# ---------- the rocky shore and Ilulissat's houses at the front left ----------
shore = loft('shore', M['rock'], [seg(1.42, 170, 280, G - 0.01), seg(1.38, 174, 276, G + 0.15)], outline=0.025)
shore.visible_shadow = False
tundra = loft('tundra', M['tundra'], [seg(1.34, 178, 272, G + 0.145), seg(1.34, 178, 272, G + 0.165)], outline=0.008)
tundra.visible_shadow = False
SZ = G + 0.165
for k, (x, y, mat) in enumerate(((-0.95, -0.6, 'red'), (-0.7, -0.86, 'yellow'), (-1.12, -0.33, 'blue'), (-0.45, -1.06, 'green'), (-0.92, -0.86, 'yellow'))):
    w, d, h = 0.13, 0.1, 0.08
    box(f'house{k}', M[mat], x, y, SZ - 0.005, w, d, h, outline=0.01, bevel=0)
    loft(f'house{k}roof', M['roofDark'], [[(x - w / 2 - 0.012, y - d / 2 - 0.012, SZ + h - 0.006), (x + w / 2 + 0.012, y - d / 2 - 0.012, SZ + h - 0.006),
                                          (x + w / 2 + 0.012, y + d / 2 + 0.012, SZ + h - 0.006), (x - w / 2 - 0.012, y + d / 2 + 0.012, SZ + h - 0.006)],
                                         [(x - w / 2 - 0.012, y - 0.004, SZ + h + 0.05), (x + w / 2 + 0.012, y - 0.004, SZ + h + 0.05),
                                          (x + w / 2 + 0.012, y + 0.004, SZ + h + 0.05), (x - w / 2 - 0.012, y + 0.004, SZ + h + 0.05)]], outline=0.008)
    for s in (-1, 1):
        box(f'house{k}win{s}', M['white'], x + s * 0.03, y - d / 2 - 0.004, SZ + 0.03, 0.024, 0.01, 0.03, outline=0, bevel=0)
for k, (x, y) in enumerate(((-0.62, -0.55), (-1.15, -0.05), (-0.25, -1.12))):
    ball(f'shorerock{k}', M['rock'], x, y, G + 0.02, rng.uniform(0.05, 0.07), outline=0.012)


# ---------- the icebergs ----------
def berg(name, x, y, r, h, peak=False, sides=9):
    a0 = rng.uniform(0, 2 * math.pi)
    radii = [r * rng.uniform(0.9, 1.08) for _ in range(sides)]

    def ring(scale, z, dx=0.0, dy=0.0):
        return [(x + dx + scale * radii[k] * math.cos(a0 + 2 * math.pi * k / sides), y + dy + scale * radii[k] * math.sin(a0 + 2 * math.pi * k / sides), z)
                for k in range(sides)]
    loft(f'{name}skirt', M['underwater'], [ring(1.3, G - 0.004), ring(1.3, G + 0.002)], outline=0)
    loft(f'{name}waterline', M['iceBlue'], [ring(1.02, G - 0.005), ring(1.02, G + min(0.03, h * 0.3))], outline=0.01)
    rings = [ring(1.0, G - 0.005), ring(0.97, G + h * 0.55), ring(0.82, G + h * 0.85)]
    rings.append(ring(0.3, G + h * 1.5, r * 0.2, r * 0.1) if peak else ring(0.72, G + h))
    loft(name, M['ice'], rings, outline=0.02)


berg('bigberg', 0.15, 0.35, 0.32, 0.22)
berg('peakberg', 0.7, 0.05, 0.22, 0.22, peak=True)
berg('leftberg', -0.4, 0.42, 0.2, 0.16, peak=True)
berg('frontberg', 0.85, -0.45, 0.15, 0.1)
berg('smallpeak', -0.15, -0.2, 0.13, 0.09, peak=True)
berg('backberg', 0.48, 0.62, 0.11, 0.09)
berg('sideberg', -0.75, 0.3, 0.12, 0.1)
for k, (x, y) in enumerate(((0.32, -0.3), (-0.45, -0.05), (1.0, 0.18), (-0.2, 0.78), (0.65, 0.78), (0.3, -1.0))):
    berg(f'bit{k}', x, y, rng.uniform(0.04, 0.06), rng.uniform(0.03, 0.05), sides=7)

# ---------- a fishing boat and a whale's tail ----------
BX, BY = 0.0, -0.62
loft('boathull', M['boatRed'], [[(BX - 0.08, BY, G - 0.002), (BX + 0.05, BY - 0.03, G - 0.002), (BX + 0.09, BY, G - 0.002), (BX + 0.05, BY + 0.03, G - 0.002)],
                                [(BX - 0.09, BY, G + 0.035), (BX + 0.05, BY - 0.04, G + 0.035), (BX + 0.11, BY, G + 0.035), (BX + 0.05, BY + 0.04, G + 0.035)]], outline=0.008)
box('boatcabin', M['white'], BX - 0.03, BY, G + 0.03, 0.06, 0.05, 0.05, outline=0.006, bevel=0)
box('boatcabinroof', M['roofDark'], BX - 0.03, BY, G + 0.078, 0.07, 0.06, 0.012, outline=0.004, bevel=0)
WX, WY = 0.55, -0.82
rod('whalestock', M['whale'], (WX, WY, G - 0.01), (WX, WY, G + 0.12), 0.028, r2=0.018, segs=10, outline=0.006)
for s in (-1, 1):
    squashed(f'fluke{s}', M['whale'], WX + s * 0.055, WY, G + 0.145, 0.05, 1.2, 0.28, 0.5, outline=0.006)
for k in range(6):
    a = 2 * math.pi * k / 6
    ball(f'splash{k}', M['white'], WX + 0.06 * math.cos(a), WY + 0.04 * math.sin(a), G + 0.005, 0.018, outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

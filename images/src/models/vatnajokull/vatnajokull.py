# A cartoon Vatnajökull for the country maps, built in the set's shared look (../toon.py): a tongue
# of Europe's biggest ice cap spilling down between dark mountains into Jökulsárlón, the lagoon
# full of white and blue icebergs drifting towards the sea, and the black sand of Diamond Beach with
# ice glittering on it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P vatnajokull.py -- vatnajokull-1024.png 1024 vatnajokull.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('blackSand', '#3a3a40', shadow_mul=(0.84, 0.84, 0.9), lift=0.15),
    'lagoon': toon('lagoon', '#4a8aa0', shadow_mul=(0.74, 0.82, 0.9), lift=0.3),
    'mountain': toon('mountain', '#5a5654', shadow_mul=(0.84, 0.84, 0.9)),
    'moss': toon('moss', '#6a8a4a', shadow_mul=(0.72, 0.8, 0.74)),
    'ice': toon('ice', '#f2f8fc', shadow_mul=(0.8, 0.88, 0.96), lift=0.2),
    'iceBlue': toon('iceBlue', '#8ad0e8', shadow_mul=(0.78, 0.88, 0.96), lift=0.25),
    'snow': toon('snow', '#fbfbfd', shadow_mul=(0.8, 0.86, 0.96), lift=0.15),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(1619)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


def ring(cx, cy, rx, ry, z, k, sides=22):
    return [(cx + rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the lagoon ----------
lag = loft('lagoon', M['lagoon'], [ring(0.0, 0.05, 1.05, 0.5, -0.004, 1), ring(0.0, 0.05, 1.04, 0.49, 0.006, 1)], outline=0.006)
lag.visible_shadow = False

# ---------- the mountains and the glacier tongue behind ----------
for s in (-1, 1):
    mt = loft(f'mountain{s}', M['mountain'], [ring(s * 0.75, 0.85, 0.5, 0.35, -0.01, s + 3), ring(s * 0.72, 0.9, 0.32, 0.22, 0.38, s + 3), ring(s * 0.7, 0.92, 0.12, 0.08, 0.55, s + 3)],
              outline=0.016)
    mt.visible_shadow = False
    lathe(f'mountaincap{s}', M['snow'], ((0.13, 0), (0.004, 0.12)), G + 0.5, s * 0.7, 0.92, segs=8, outline=0.006, smooth=False)
    ball(f'moss{s}', M['moss'], s * 0.95, 0.55, G + 0.05, 0.12, outline=0.01)
gl = loft('glacier', M['ice'], [[(-0.45, 0.42, G - 0.005), (0.45, 0.42, G - 0.005), (0.4, 1.2, G - 0.005), (-0.4, 1.2, G - 0.005)],
                                [(-0.42, 0.45, G + 0.12), (0.42, 0.45, G + 0.12), (0.35, 1.15, G + 0.45), (-0.35, 1.15, G + 0.45)]], outline=0.016)
gl.visible_shadow = False
for k in range(6):
    x = -0.35 + k * 0.14
    bar(f'crevasse{k}', M['iceBlue'], (x, 0.47, G + 0.125), (x * 0.85, 1.1, G + 0.43), 0.025, outline=0)

# ---------- icebergs in the lagoon and on the beach ----------
for k in range(14):
    x = rng.uniform(-0.9, 0.9)
    y = rng.uniform(-0.3, 0.35)
    if ((x / 1.0) ** 2 + ((y - 0.05) / 0.45) ** 2) > 1:
        continue
    r = rng.uniform(0.04, 0.09)
    lathe(f'iceberg{k}', M['ice' if k % 3 else 'iceBlue'], ((r, 0), (r * 0.8, r * 0.7), (r * 0.3, r * 1.2), (0.004, r * 1.3)), G - 0.005, x, y, segs=6, outline=0.008, smooth=False)
for k in range(10):
    x = -1.0 + k * 0.22
    y = -0.65 + rng.uniform(-0.15, 0.1)
    if math.hypot(x, y) > 1.25:
        continue
    b = ball(f'diamond{k}', M['ice' if k % 2 else 'iceBlue'], 0, 0, 0, rng.uniform(0.025, 0.04), outline=0.004)
    b.scale = (1.3, 1.0, 0.7)
    b.location = (x, y, G + 0.015)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

# A cartoon Mont Choungui for the country maps, built in the set's shared look (../toon.py):
# Mayotte's steep green volcanic peak rising over the island's lagoon, its forested flanks and rocky
# top, ylang-ylang and palms at its foot, a green sea turtle swimming in the lagoon, and a galawa,
# the island's outrigger canoe. Turned a little towards the camera.
# Run: blender -b --factory-startup -P mont-choungui.py -- mont-choungui-1024.png 1024 mont-choungui.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lagoon': toon('lagoon', '#3ec4cc', shadow_mul=(0.74, 0.84, 0.88), lift=0.35),
    'sand': toon('sand', '#e8d8b8', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'land': toon('land', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'mountain': toon('mountain', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'forest': toon('forest', '#3f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'rock': toon('rock', '#6a6460', shadow_mul=(0.84, 0.84, 0.9)),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'shell': toon('shell', '#7a6a3a', shadow_mul=(0.84, 0.8, 0.74)),
    'scute': toon('scute', '#a8944a'),
    'turtle': toon('turtle', '#8aa860', shadow_mul=(0.78, 0.82, 0.74)),
    'canoe': toon('canoe', '#8a5a3a'),
    'eye': flat('eye', '#2e2a30'),
})

G = tile(M['lagoon'])
before = set(bpy.data.objects)
rng = random.Random(1223)


def segment(c, r, z, n=24):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


def ring(cx, cy, rx, ry, z, k, sides=20):
    return [(cx + rx * math.cos(t) * (1 + 0.07 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.07 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- the shore and the land at the back ----------
beach = loft('beach', M['sand'], [segment(0.0, 1.41, -0.01), segment(0.03, 1.4, 0.025)], outline=0.012)
beach.visible_shadow = False
land = loft('land', M['land'], [segment(0.15, 1.38, 0.02), segment(0.2, 1.36, 0.06)], outline=0.012)
land.visible_shadow = False

# ---------- Mont Choungui: a steep green cone, rocky at the top ----------
MX, MY = -0.1, 0.62
mt = loft('mountain', M['mountain'], [ring(MX, MY, 0.62, 0.42, 0.05, 1), ring(MX + 0.02, MY + 0.02, 0.36, 0.25, 0.32, 1), ring(MX + 0.04, MY + 0.03, 0.19, 0.14, 0.62, 1),
                                      ring(MX + 0.05, MY + 0.04, 0.1, 0.08, 0.8, 1)], outline=0.018, smooth=True)
mt.visible_shadow = False
top = loft('summit', M['rock'], [ring(MX + 0.05, MY + 0.04, 0.1, 0.08, 0.79, 2), ring(MX + 0.06, MY + 0.04, 0.05, 0.04, 0.9, 2), ring(MX + 0.06, MY + 0.04, 0.012, 0.01, 0.94, 2)],
          outline=0.012)
top.visible_shadow = False
for k in range(16):
    a = rng.uniform(math.radians(195), math.radians(345))
    f = rng.uniform(0.05, 0.7)
    rx, ry = 0.62 - f * 0.55, 0.42 - f * 0.36
    x, y = MX + rx * math.cos(a), MY + ry * math.sin(a)
    ball(f'flanktree{k}', M['forest'], x, y - 0.03, G + 0.07 + f * 0.75, rng.uniform(0.05, 0.07) * (1 - 0.4 * f), outline=0.01)
for k, (x, y) in enumerate(((-0.95, 0.38), (0.7, 0.4), (1.0, 0.55), (-0.75, 0.85), (0.5, 0.9))):
    hgt = rng.uniform(0.24, 0.3)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G + 0.05), (x + 0.03, y, G + hgt), 0.012, r2=0.009, segs=8, outline=0.004)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + hgt), (x + 0.03 + 0.09 * math.cos(b), y + 0.09 * math.sin(b), G + hgt - 0.045), 0.017, outline=0.004)

# ---------- a green sea turtle in the lagoon ----------
TX, TY, TA, K = -0.35, -0.5, 0.5, 1.6
c, s = math.cos(TA), math.sin(TA)
for k, (u, v, a) in enumerate(((0.06, 0.09, 0.9), (0.06, -0.09, -0.9), (-0.08, 0.06, 2.4), (-0.08, -0.06, -2.4))):
    px, py = TX + (u * c - v * s) * K, TY + (u * s + v * c) * K
    L = (0.1 if k < 2 else 0.05) * K
    bar(f'flipper{k}', M['turtle'], (px, py, G + 0.012), (px + L * math.cos(TA + a), py + L * math.sin(TA + a), G + 0.008), (0.035 if k < 2 else 0.025) * K, outline=0.005)
sh = squashed('shell', M['shell'], TX, TY, G + 0.02, 0.11 * K, 1.3, 1.0, 0.4, outline=0.014)
sh.rotation_euler = (0, 0, TA)
for k, (u, v) in enumerate(((0.0, 0.0), (0.06, 0.0), (-0.06, 0.0), (0.0, 0.05), (0.0, -0.05))):
    squashed(f'scute{k}', M['scute'], TX + (u * c - v * s) * K, TY + (u * s + v * c) * K, G + 0.02 + 0.035 * K, 0.025 * K, 1.2, 1.0, 0.35, outline=0.003)
hx, hy = TX + 0.17 * K * c, TY + 0.17 * K * s
squashed('turtlehead', M['turtle'], hx, hy, G + 0.03, 0.035 * K, 1.3, 1.0, 0.8, outline=0.006)
for side in (-1, 1):
    ball(f'turtleeye{side}', M['eye'], hx + 0.012 * K * c - side * 0.018 * K * s, hy + 0.012 * K * s + side * 0.018 * K * c, G + 0.03 + 0.015 * K, 0.006 * K, outline=0)

# ---------- a galawa: the outrigger canoe ----------
CX, CY, K = 0.5, -0.55, 1.35


def cp(u, v, z):
    return (CX + u * K, CY + v * K, G + z * K)


loft('galawa', M['canoe'], [[cp(-0.16, 0, 0.002), cp(0, -0.024, 0.002), cp(0.16, 0, 0.002), cp(0, 0.024, 0.002)],
                            [cp(-0.19, 0, 0.04), cp(0, -0.034, 0.035), cp(0.19, 0, 0.04), cp(0, 0.034, 0.035)]], outline=0.007)
for k, dx in enumerate((-0.05, 0.05)):
    bar(f'boom{k}', M['canoe'], cp(dx, -0.13, 0.01), cp(dx, 0.13, 0.01), 0.008 * K, outline=0.002)
for side in (-1, 1):
    rod(f'float{side}', M['canoe'], cp(-0.09, side * 0.13, 0.006), cp(0.09, side * 0.13, 0.006), 0.011 * K, segs=6, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

# A cartoon Pola Island for the country maps, built in the set's shared look (../toon.py): the sheer
# sea stack off Tutuila in the National Park of American Samoa, rising green-topped from the Pacific
# in front of the island's steep rainforest cliffs, a smaller stack beside it, the beach of Vatia's
# bay with a fale, its thatched roof on posts, frigatebirds overhead, and an outrigger canoe.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P pola-island.py -- pola-island-1024.png 1024 pola-island.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2a8ac0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'surf': toon('surf', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'sand': toon('sand', '#e8dcc0', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'cliff': toon('cliff', '#5a5450', shadow_mul=(0.84, 0.84, 0.9)),
    'rainforest': toon('rainforest', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'forest': toon('forest', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'thatch': toon('thatch', '#c9a85a', shadow_mul=(0.84, 0.76, 0.62)),
    'post': toon('post', '#7a5a40'),
    'bird': toon('bird', '#2e2a30'),
    'canoe': toon('canoe', '#8a5a3a'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1051)


def ring(cx, cy, rx, ry, z, k, sides=18):
    return [(cx + rx * math.cos(t) * (1 + 0.07 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.07 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- Tutuila's steep, forested slopes at the back: a rock foot, then rainforest ----------
def segment(c, r, z, n=20):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


cl = loft('cliffs', M['cliff'], [segment(0.42, 1.4, -0.01), segment(0.46, 1.39, 0.1)], outline=0.02)
cl.visible_shadow = False
top = loft('cliffsforest', M['rainforest'], [segment(0.46, 1.39, 0.09), segment(0.7, 1.3, 0.34), segment(0.85, 1.2, 0.4)], outline=0.014, smooth=True)
top.visible_shadow = False
for f, (c, z) in enumerate(((0.55, 0.19), (0.64, 0.28))):
    half = math.sqrt(1.34 ** 2 - c ** 2) - 0.12
    for j in range(9 - f):
        x = -half + (j + 0.5) * 2 * half / (9 - f) + rng.uniform(-0.03, 0.03)
        ball(f'slopetree{f}_{j}', M['forest'], x, c, G + z, rng.uniform(0.065, 0.085), outline=0.01)
for j in range(7):
    a = math.radians(48 + j * 14)
    ball(f'ridgetree{j}', M['forest'], 1.15 * math.cos(a), 1.15 * math.sin(a), G + 0.42, rng.uniform(0.07, 0.09), outline=0.012)

# ---------- the beach and a fale ----------
loft('beach', M['sand'], [[(0.35, 0.42, G - 0.01), (1.05, 0.42, G - 0.01), (1.05, 0.2, G - 0.01), (0.4, 0.25, G - 0.01)],
                          [(0.35, 0.42, G + 0.02), (1.05, 0.42, G + 0.02), (1.02, 0.22, G + 0.02), (0.42, 0.27, G + 0.02)]], outline=0.008)
FX, FY = 0.72, 0.33
for k in range(6):
    a = 2 * math.pi * k / 6
    rod(f'falepost{k}', M['post'], (FX + 0.1 * math.cos(a), FY + 0.06 * math.sin(a), G + 0.02), (FX + 0.1 * math.cos(a), FY + 0.06 * math.sin(a), G + 0.09), 0.006, segs=5,
        outline=0.002)
lathe('faleroof', M['thatch'], ((0.13, 0), (0.1, 0.04), (0.05, 0.08), (0.004, 0.1)), G + 0.085, FX, FY, segs=14, outline=0.008)

# ---------- Pola Island, and a smaller stack beside it ----------
for k, (x, y, r, h) in enumerate(((-0.35, -0.05, 0.2, 0.7), (0.05, 0.05, 0.1, 0.38))):
    stack = loft(f'stack{k}', M['cliff'], [ring(x, y, r, r * 0.8, -0.01, k), ring(x, y, r * 0.9, r * 0.75, h * 0.6, k), ring(x, y, r * 0.72, r * 0.6, h, k)], outline=0.02)
    stack.visible_shadow = False
    cap = loft(f'stackforest{k}', M['rainforest'], [ring(x, y, r * 0.72, r * 0.6, h - 0.01, k), ring(x, y, r * 0.5, r * 0.4, h + 0.08, k)], outline=0.012, smooth=True)
    cap.visible_shadow = False
    for j in range(5):
        a = 2 * math.pi * j / 5
        ball(f'stacktree{k}{j}', M['forest'], x + r * 0.45 * math.cos(a), y + r * 0.35 * math.sin(a), G + h + 0.07, r * 0.25, outline=0.008)
    for j in range(5):
        a = math.radians(200 + j * 35)
        ball(f'stackfoam{k}{j}', M['surf'], x + r * math.cos(a), y + r * 0.8 * math.sin(a), G + 0.005, 0.03, outline=0.004)

# ---------- frigatebirds and a canoe ----------
for k, (x, y, z) in enumerate(((-0.1, 0.0, 0.85), (-0.55, 0.15, 0.78), (0.25, 0.2, 0.7))):
    for s in (-1, 1):
        bar(f'birdwing{k}{s}', M['bird'], (x, y, G + z), (x + s * 0.06, y, G + z + 0.025), 0.012, outline=0.002)
CX, CY = 0.4, -0.65
loft('canoe', M['canoe'], [[(CX - 0.13, CY, G + 0.002), (CX, CY - 0.022, G + 0.002), (CX + 0.13, CY, G + 0.002), (CX, CY + 0.022, G + 0.002)],
                           [(CX - 0.15, CY, G + 0.03), (CX, CY - 0.03, G + 0.03), (CX + 0.15, CY, G + 0.03), (CX, CY + 0.03, G + 0.03)]], outline=0.006)
rod('outrigger', M['canoe'], (CX - 0.07, CY + 0.1, G + 0.008), (CX + 0.07, CY + 0.1, G + 0.008), 0.01, segs=6, outline=0.002)
for k, dx in enumerate((-0.04, 0.04)):
    bar(f'boom{k}', M['canoe'], (CX + dx, CY, G + 0.03), (CX + dx, CY + 0.1, G + 0.01), 0.007, outline=0.002)

turn(before, -20)
render(G)

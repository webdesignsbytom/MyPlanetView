# A cartoon Virunga National Park for the country maps, built in the set's shared look (../toon.py):
# the Congo's oldest park, Nyiragongo's dark cone over the rainforest with its glowing lava lake
# and plume of smoke, the forest at its foot, a mountain gorilla among the bamboo, and hippos in the
# Rutshuru river. Turned a little towards the camera.
# Run: blender -b --factory-startup -P virunga.py -- virunga-1024.png 1024 virunga.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'forestFloor': toon('forestFloor', '#5a9a4a', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'volcano': toon('volcano', '#4e4a4c', shadow_mul=(0.84, 0.84, 0.9)),
    'volcanoGreen': toon('volcanoGreen', '#3f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'lava': flat('lava', '#ff6a2a'),
    'lavaGlow': flat('lavaGlow', '#ffc040'),
    'smoke': toon('smoke', '#e8e4ea', shadow_mul=(0.82, 0.82, 0.9), lift=0.15),
    'forest': toon('forest', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'forestLight': toon('forestLight', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'bamboo': toon('bamboo', '#9ac65a', shadow_mul=(0.72, 0.8, 0.76)),
    'trunk': toon('trunk', '#6b5040'),
    'river': toon('river', '#5a9ec0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'gorilla': toon('gorilla', '#2e2a2c', shadow_mul=(0.85, 0.85, 0.9)),
    'silver': toon('silver', '#8a8a90'),
    'hippo': toon('hippo', '#8a7a82', shadow_mul=(0.8, 0.78, 0.86)),
    'hippoPink': toon('hippoPink', '#d8a0a0'),
})

G = tile(M['forestFloor'])
before = set(bpy.data.objects)
rng = random.Random(673)


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


# ---------- Nyiragongo: forested at its foot, bare dark rock above, the lava lake in its crater ----------
VX, VY = 0.0, 0.5
low = loft('volcanolow', M['volcanoGreen'], [[(VX + 0.8 * math.cos(t), VY + 0.6 * math.sin(t), G - 0.01) for t in (2 * math.pi * j / 24 for j in range(24))],
                                             [(VX + 0.55 * math.cos(t), VY + 0.4 * math.sin(t), G + 0.2) for t in (2 * math.pi * j / 24 for j in range(24))]], outline=0.025)
low.visible_shadow = False
high = loft('volcanohigh', M['volcano'], [[(VX + 0.55 * math.cos(t), VY + 0.4 * math.sin(t), G + 0.2) for t in (2 * math.pi * j / 24 for j in range(24))],
                                          [(VX + 0.26 * math.cos(t), VY + 0.2 * math.sin(t), G + 0.62) for t in (2 * math.pi * j / 24 for j in range(24))],
                                          [(VX + 0.2 * math.cos(t), VY + 0.16 * math.sin(t), G + 0.6) for t in (2 * math.pi * j / 24 for j in range(24))]], outline=0.025)
high.visible_shadow = False
cyl('lavalake', M['lava'], 1.0, 0.01, segs=24, outline=0, matrix=Matrix.Translation((VX, VY, G + 0.6)) @ Matrix.Scale(0.17, 4, (1, 0, 0)) @ Matrix.Scale(0.13, 4, (0, 1, 0)))
cyl('lavaglow', M['lavaGlow'], 1.0, 0.012, segs=24, outline=0, matrix=Matrix.Translation((VX + 0.02, VY, G + 0.601)) @ Matrix.Scale(0.08, 4, (1, 0, 0)) @ Matrix.Scale(0.06, 4, (0, 1, 0)))
for k, (dx, dz, r) in enumerate(((0.0, 0.72, 0.09), (0.06, 0.82, 0.11), (0.14, 0.92, 0.12), (0.24, 0.98, 0.1))):
    ball(f'smoke{k}', M['smoke'], VX + dx, VY + 0.05, G + dz, r, outline=0.012)

# ---------- rainforest round the volcano's foot ----------
for k in range(28):
    a = 2 * math.pi * k / 28 + rng.uniform(-0.08, 0.08)
    r = rng.uniform(1.0, 1.22)
    x, y = r * math.cos(a), r * 0.95 * math.sin(a)
    if -0.6 < x < 0.4 and y < -0.6:
        continue
    h = rng.uniform(0.12, 0.22)
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + h), 0.018, segs=6, outline=0.006)
    ball(f'tree{k}', M['forest' if k % 2 else 'forestLight'], x, y, G + h + 0.05, rng.uniform(0.1, 0.13), outline=0.016)

# ---------- the Rutshuru river, with hippos ----------
PATH = [(0.6, -0.05), (0.55, -0.3), (0.65, -0.55), (0.55, -0.8), (0.6, -1.1)]
bm = bmesh.new()
verts = []
for i, (x, y) in enumerate(PATH):
    (x0, y0), (x1, y1) = PATH[max(0, i - 1)], PATH[min(len(PATH) - 1, i + 1)]
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy)
    w = 0.08 + 0.03 * i / len(PATH)
    verts.append((bm.verts.new((x - dy / n * w, y + dx / n * w, G + 0.005)), bm.verts.new((x + dy / n * w, y - dx / n * w, G + 0.005))))
for (a0, a1), (b0, b1) in zip(verts, verts[1:]):
    bm.faces.new((a0, a1, b1, b0))
finish('river', bm, M['river'], outline=0.006)
for k, (x, y, deg) in enumerate(((0.6, -0.5, -100), (0.58, -0.75, -70))):
    made = set(bpy.data.objects)
    squashed(f'hippobody{k}', M['hippo'], 0, 0, G + 0.02, 0.07, 1.5, 1.0, 0.6, outline=0.01)
    squashed(f'hippohead{k}', M['hippo'], 0.11, 0, G + 0.035, 0.045, 1.3, 1.0, 0.75, outline=0.008)
    squashed(f'hipposnout{k}', M['hippoPink'], 0.16, 0, G + 0.03, 0.028, 0.8, 1.3, 0.7, outline=0.005)
    place(made, deg, x, y)

# ---------- a silverback among the bamboo ----------
for k in range(14):
    x, y = -0.55 + rng.uniform(-0.3, 0.3), -0.55 + rng.uniform(-0.25, 0.2)
    rod(f'bamboo{k}', M['bamboo'], (x, y, G), (x + rng.uniform(-0.02, 0.02), y, G + rng.uniform(0.2, 0.3)), 0.009, segs=6, outline=0.003)
made = set(bpy.data.objects)
squashed('gbody', M['gorilla'], 0, 0, G + 0.13, 0.11, 1.0, 0.9, 1.0, outline=0.012)
squashed('gback', M['silver'], -0.02, 0.0, G + 0.17, 0.08, 0.9, 0.95, 0.5, outline=0.006)
ball('ghead', M['gorilla'], 0.07, 0, G + 0.24, 0.055, outline=0.008)
lathe('gcrest', M['gorilla'], ((0.03, 0), (0.004, 0.04)), G + 0.27, 0.06, 0, segs=8, outline=0.004)
for sy in (-1, 1):
    rod(f'garm{sy}', M['gorilla'], (0.04, sy * 0.08, G + 0.18), (0.12, sy * 0.1, G), 0.03, r2=0.024, segs=8, outline=0.006)
    rod(f'gleg{sy}', M['gorilla'], (-0.06, sy * 0.06, G + 0.08), (-0.06, sy * 0.06, G), 0.03, segs=8, outline=0.006)
place(made, -110, -0.25, -0.7)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

# A cartoon Kibira National Park for the country maps, built in the set's shared look (../toon.py):
# Burundi's montane rainforest on the Congo-Nile ridge, round hills thick with trees, a tea estate's
# neat rows of bushes on the slope below, a stream and a little waterfall, a ranger's hut, and a
# family of chimpanzees in a clearing. Turned a little towards the camera.
# Run: blender -b --factory-startup -P kibira.py -- kibira-1024.png 1024 kibira.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'hill': toon('hill', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'forest': toon('forest', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'forestLight': toon('forestLight', '#5aa652', shadow_mul=(0.7, 0.78, 0.8)),
    'tea': toon('tea', '#7cc061', shadow_mul=(0.7, 0.78, 0.8)),
    'earth': toon('earth', '#b8875a', lift=0.2),
    'water': toon('water', '#5ab0dc', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'foam': toon('foam', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'trunk': toon('trunk', '#6b5040'),
    'chimp': toon('chimp', '#3a3230', shadow_mul=(0.85, 0.85, 0.9)),
    'face': toon('face', '#c8a088'),
    'mud': toon('mud', '#b87a50'),
    'roof': toon('roof', '#8a8478'),
    'window': flat('window', '#3a3640'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(641)


def place(made_before, degrees, x, y, z=0.0):
    m = Matrix.Translation((x, y, z)) @ Matrix.Rotation(math.radians(degrees), 4, 'Z')
    bpy.context.view_layer.update()
    for ob in set(bpy.data.objects) - made_before:
        ob.matrix_world = m @ ob.matrix_world


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


def ring(cx, cy, rx, ry, z, k):
    return [(cx + rx * math.cos(t) * (1 + 0.05 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.05 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / 20 for j in range(20))]


# ---------- the forested hills at the back ----------
HILLS = ((-0.45, 0.6, 0.55, 0.45, 0.42), (0.45, 0.65, 0.5, 0.4, 0.36))
for k, (cx, cy, rx, ry, h) in enumerate(HILLS):
    hl = loft(f'hill{k}', M['hill'], [ring(cx, cy, rx, ry, -0.01, k), ring(cx, cy, rx * 0.65, ry * 0.65, h * 0.6, k), ring(cx, cy, rx * 0.25, ry * 0.25, h, k)],
              outline=0.025, smooth=True)
    hl.visible_shadow = False
    for j in range(14):
        a = 2 * math.pi * j / 14
        for s, z in ((0.82, 0.18), (0.5, 0.65)):
            x, y = cx + s * rx * math.cos(a), cy + s * ry * math.sin(a)
            if math.hypot(x, y) > 1.25:
                continue
            ball(f'canopy{k}{j}{s}', M['forest' if (j + k) % 2 else 'forestLight'], x, y, G + h * z + 0.04, rng.uniform(0.08, 0.11), outline=0.014)
    ball(f'crown{k}', M['forest'], cx, cy, G + h + 0.05, 0.1, outline=0.014)

# ---------- the tea estate's rows on the slope in front ----------
for r in range(6):
    y = -0.1 - r * 0.12
    for j in range(5):
        x0 = -0.95 + j * 0.2
        if math.hypot(x0, y) > 1.2:
            continue
        squashed(f'tea{r}{j}', M['tea'], x0 + 0.08, y, G + 0.03, 0.06, 1.5, 0.7, 0.6, outline=0.008)

# ---------- a stream with a little waterfall off the hill ----------
PATH = [(0.05, 0.45), (0.15, 0.2), (0.3, 0.0), (0.45, -0.25), (0.55, -0.55), (0.6, -0.9), (0.65, -1.15)]
bm = bmesh.new()
verts = []
for i, (x, y) in enumerate(PATH):
    (x0, y0), (x1, y1) = PATH[max(0, i - 1)], PATH[min(len(PATH) - 1, i + 1)]
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy)
    w = 0.035 + 0.015 * i / len(PATH)
    verts.append((bm.verts.new((x - dy / n * w, y + dx / n * w, G + 0.006)), bm.verts.new((x + dy / n * w, y - dx / n * w, G + 0.006))))
for (a0, a1), (b0, b1) in zip(verts, verts[1:]):
    bm.faces.new((a0, a1, b1, b0))
finish('stream', bm, M['water'], outline=0.006)
bar('fall', M['foam'], (-0.05, 0.55, G + 0.15), (0.05, 0.45, G + 0.01), 0.04, outline=0.004)

# ---------- a ranger's hut ----------
HX, HY = 0.85, 0.05
lathe('hutwall', M['mud'], ((0.09, 0), (0.09, 0.09)), G - 0.005, HX, HY, segs=14, outline=0.01)
lathe('hutroof', M['roof'], ((0.12, 0), (0.004, 0.1)), G + 0.085, HX, HY, segs=14, outline=0.01)
box('hutdoor', M['window'], HX, HY - 0.088, G, 0.035, 0.01, 0.06, outline=0, bevel=0)


# ---------- chimpanzees in the clearing ----------
def chimp(name, x, y, deg, s):
    made = set(bpy.data.objects)
    squashed(f'{name}body', M['chimp'], 0, 0, G + 0.07 * s, 0.05 * s, 1.0, 0.85, 1.2, outline=0.006)
    ball(f'{name}head', M['chimp'], 0.0, -0.01 * s, G + 0.14 * s, 0.032 * s, outline=0.005)
    squashed(f'{name}face', M['face'], 0.0, -0.035 * s, G + 0.135 * s, 0.02 * s, 1.0, 0.5, 0.9, outline=0.002)
    for sx in (-1, 1):
        ball(f'{name}ear{sx}', M['face'], sx * 0.032 * s, -0.01 * s, G + 0.145 * s, 0.01 * s, outline=0.002)
        rod(f'{name}arm{sx}', M['chimp'], (sx * 0.04 * s, 0, G + 0.1 * s), (sx * 0.05 * s, -0.02 * s, G + 0.01), 0.012 * s, segs=6, outline=0.003)
        rod(f'{name}leg{sx}', M['chimp'], (sx * 0.025 * s, 0.01 * s, G + 0.04 * s), (sx * 0.03 * s, 0.0, G), 0.013 * s, segs=6, outline=0.003)
    place(made, deg, x, y)


chimp('chimp1', -0.3, -0.85, 15, 1.4)
chimp('chimp2', -0.12, -0.92, -10, 1.0)
chimp('chimp3', -0.42, -0.98, 25, 0.75)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

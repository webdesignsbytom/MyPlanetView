# A cartoon Uluru for the country maps, built in the set's shared look (../toon.py): the great red
# rock rising from the desert of central Australia, its rounded flanks scored with gullies, Kata
# Tjuta's domes behind, the red sand with spinifex and desert oaks, and a kangaroo.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P uluru.py -- uluru-1024.png 1024 uluru.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#d8884a', shadow_mul=(0.86, 0.76, 0.72), lift=0.25),
    'rock': toon('rock', '#d4643a', shadow_mul=(0.84, 0.7, 0.68), lift=0.2),
    'gully': toon('gully', '#a84a2e', shadow_mul=(0.84, 0.7, 0.68)),
    'kata': toon('kata', '#c8603e', shadow_mul=(0.84, 0.7, 0.68)),
    'spinifex': toon('spinifex', '#b8b05a', shadow_mul=(0.8, 0.8, 0.72)),
    'oak': toon('oak', '#6a7a4a', shadow_mul=(0.74, 0.8, 0.76)),
    'trunk': toon('trunk', '#4a3a30'),
    'roo': toon('roo', '#b07a50', shadow_mul=(0.86, 0.76, 0.72)),
    'eye': flat('eye', '#2e2a30'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(1277)


def ellipse(cx, cy, rx, ry, z, sides=28, wob=0.0):
    return [(cx + rx * math.cos(t) * (1 + wob * math.sin(5 * t)), cy + ry * math.sin(t) * (1 + wob * math.cos(3 * t)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- Kata Tjuta's domes behind ----------
for k, (x, y, r, sz) in enumerate(((-0.75, 0.95, 0.17, 1.1), (-0.52, 1.02, 0.14, 1.25), (-0.95, 0.72, 0.12, 1.0), (-0.32, 1.05, 0.1, 1.0), (-0.62, 0.78, 0.1, 0.9))):
    d = squashed(f'kata{k}', M['kata'], x, y, G + r * sz * 0.35, r, 1.0, 0.9, sz, outline=0.012)
    d.visible_shadow = False

# ---------- Uluru: a long rock with steep rounded flanks and a flattish top ----------
UX, UY = 0.05, 0.2
rings = [ellipse(UX, UY, 0.8, 0.4, -0.01, wob=0.03), ellipse(UX, UY, 0.79, 0.39, 0.12, wob=0.03), ellipse(UX, UY, 0.74, 0.36, 0.24, wob=0.025),
         ellipse(UX, UY, 0.64, 0.3, 0.32, wob=0.02), ellipse(UX + 0.02, UY, 0.48, 0.22, 0.37, wob=0.015), ellipse(UX + 0.03, UY, 0.22, 0.1, 0.395)]
rock = loft('uluru', M['rock'], rings, outline=0.02, smooth=True)
rock.visible_shadow = False
# the gullies scored down its front
for k in range(9):
    t = math.radians(205 + k * 16)
    x0, y0 = UX + 0.78 * math.cos(t), UY + 0.385 * math.sin(t)
    x1, y1 = UX + 0.66 * math.cos(t), UY + 0.31 * math.sin(t)
    bar(f'gully{k}', M['gully'], (x0, y0 - 0.005, G + 0.03), (x1, y1 - 0.008, G + 0.3), 0.018, outline=0)

# ---------- spinifex, desert oaks and a kangaroo ----------
for k in range(14):
    a = rng.uniform(math.radians(190), math.radians(350))
    r = rng.uniform(0.6, 1.22)
    x, y = r * math.cos(a), r * math.sin(a) + 0.05
    for j in range(5):
        b = 2 * math.pi * j / 5 + k
        bar(f'spinifex{k}{j}', M['spinifex'], (x, y, G), (x + 0.04 * math.cos(b), y + 0.04 * math.sin(b), G + 0.05), 0.012, outline=0.002)
for k, (x, y) in enumerate(((0.95, 0.55), (-1.05, -0.1), (1.05, -0.35))):
    rod(f'oaktrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.14), 0.012, segs=6, outline=0.004)
    lathe(f'oak{k}', M['oak'], ((0.05, 0), (0.06, 0.06), (0.035, 0.14), (0.004, 0.2)), G + 0.1, x, y, segs=10, outline=0.006)
KX, KY = 0.4, -0.7
squashed('roobody', M['roo'], KX, KY, G + 0.08, 0.05, 0.85, 0.85, 1.45, outline=0.008)
squashed('roohead', M['roo'], KX + 0.025, KY - 0.015, G + 0.175, 0.024, 1.4, 0.9, 1.0, outline=0.005)
for side in (-1, 1):
    bar(f'rooear{side}', M['roo'], (KX + 0.015, KY + side * 0.012, G + 0.19), (KX + 0.01, KY + side * 0.016, G + 0.225), 0.012, outline=0.002)
    bar(f'rooleg{side}', M['roo'], (KX - 0.01, KY + side * 0.03, G + 0.05), (KX + 0.05, KY + side * 0.03, G + 0.005), 0.018, outline=0.003)
bar('rootail', M['roo'], (KX - 0.04, KY, G + 0.05), (KX - 0.15, KY, G + 0.005), 0.022, outline=0.003)
ball('rooeye', M['eye'], KX + 0.045, KY - 0.03, G + 0.18, 0.005, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

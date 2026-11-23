# A cartoon Gobustan for the country maps, built in the set's shared look (../toon.py) on a tile of
# dry semi-desert: the great boulders of Boyukdash with their ancient rock carvings, dancing figures,
# a horned goat and a reed boat full of rowers cut into the stone; the grey mud volcanoes nearby,
# their craters bubbling and mud running down their sides; and the Caspian Sea behind.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P gobustan.py -- gobustan-1024.png 1024 gobustan.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#cdb88e', shadow_mul=(0.84, 0.76, 0.66), lift=0.25),
    'scrub': toon('scrub', '#9aa06a', shadow_mul=(0.76, 0.8, 0.78)),
    'rock': toon('rock', '#b89a78', shadow_mul=(0.82, 0.74, 0.74)),
    'rockDark': toon('rockDark', '#9a7e60', shadow_mul=(0.82, 0.74, 0.74)),
    'carving': flat('carving', '#5a4030'),
    'mud': toon('mud', '#8f8a84', shadow_mul=(0.8, 0.8, 0.88)),
    'mudWet': toon('mudWet', '#6a6660', shadow_mul=(0.8, 0.8, 0.88), lift=0.3),
    'sea': toon('sea', '#3f8fc0', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(359)


def ring(cx, cy, rx, ry, z, jitter, sides=14):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- the Caspian along the back ----------
R = 1.42
SEA = [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(40, 141, 8)] + [(-1.0, 0.95), (-0.3, 1.1), (0.4, 1.08), (1.05, 0.9)]
bm = bmesh.new()
bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, G + 0.004)) for x, y in SEA])])
finish('sea', bm, M['sea'], outline=0.01)


# ---------- mud volcanoes, bubbling ----------
def mud_volcano(name, x, y, r, h):
    cone = loft(name, M['mud'], [ring(x, y, r, r * 0.8, -0.01, 0.04), ring(x, y, r * 0.55, r * 0.45, h * 0.7, 0.06), ring(x, y, r * 0.3, r * 0.25, h, 0.03)],
                outline=0.025)
    cone.visible_shadow = False
    cyl(f'{name}pool', M['mudWet'], r * 0.26, 0.012, segs=16, outline=0.006, matrix=Matrix.Translation((x, y, G + h - 0.003)) @ Matrix.Scale(0.85, 4, (0, 1, 0)))
    for k in range(3):
        a = rng.uniform(0, 2 * math.pi)
        ball(f'{name}bubble{k}', M['mudWet'], x + r * 0.12 * math.cos(a), y + r * 0.1 * math.sin(a), G + h + 0.008, rng.uniform(0.015, 0.025), outline=0.004)
    # mud running down its sides
    for k in range(3):
        a = math.radians(-90 + rng.uniform(-50, 50))
        p0 = (x + r * 0.28 * math.cos(a), y + r * 0.24 * math.sin(a), G + h - 0.01)
        p1 = (x + r * 0.95 * math.cos(a), y + r * 0.78 * math.sin(a), G + 0.0)
        bar(f'{name}flow{k}', M['mudWet'], p0, p1, 0.03, outline=0.004)


mud_volcano('volcano1', 0.55, 0.5, 0.42, 0.34)
mud_volcano('volcano2', 0.95, 0.05, 0.28, 0.22)
mud_volcano('volcano3', 0.15, 0.78, 0.22, 0.16)

# ---------- the boulders of Boyukdash and their carvings ----------
for k, (x, y, sx, sy, h) in enumerate(((-0.85, 0.35, 0.32, 0.22, 0.4), (-0.35, 0.45, 0.22, 0.16, 0.3), (-1.05, -0.2, 0.18, 0.15, 0.22))):
    b = loft(f'boulder{k}', M['rock'], [ring(x, y, sx, sy, -0.01, 0.06), ring(x, y, sx * 0.95, sy * 0.92, h * 0.7, 0.06), ring(x, y, sx * 0.7, sy * 0.7, h, 0.08)],
             outline=0.025)
    b.visible_shadow = False
# the big flat-faced rock with the carvings, standing facing the front
RX_, RY_, RW, RH = -0.4, -0.05, 0.7, 0.42
loft('carvedrock', M['rock'], [[(RX_ - RW / 2, RY_, G - 0.01), (RX_ + RW / 2, RY_, G - 0.01), (RX_ + RW / 2 - 0.04, RY_ + 0.22, G - 0.01), (RX_ - RW / 2 + 0.05, RY_ + 0.24, G - 0.01)],
                               [(RX_ - RW / 2 + 0.03, RY_ + 0.01, G + RH * 0.8), (RX_ + RW / 2 - 0.05, RY_ + 0.01, G + RH), (RX_ + RW / 2 - 0.08, RY_ + 0.18, G + RH * 0.95),
                                (RX_ - RW / 2 + 0.07, RY_ + 0.2, G + RH * 0.75)]], outline=0.025).visible_shadow = False
FY = RY_ - 0.004


def stroke(name, x0, z0, x1, z1, w=0.012):
    """One line of a carving on the rock's face, from (x0, z0) to (x1, z1)."""
    bar(name, M['carving'], (x0, FY, G + z0), (x1, FY, G + z1), w, outline=0)


def figure(name, x, z, s=1.0):
    """A dancing figure: head, body, arms up, legs apart."""
    cyl(f'{name}head', M['carving'], 0.014 * s, 0.006, segs=10, outline=0, matrix=Matrix.Translation((x, FY, G + z + 0.1 * s)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    stroke(f'{name}body', x, z + 0.04 * s, x, z + 0.085 * s)
    stroke(f'{name}armL', x, z + 0.075 * s, x - 0.03 * s, z + 0.1 * s)
    stroke(f'{name}armR', x, z + 0.075 * s, x + 0.03 * s, z + 0.1 * s)
    stroke(f'{name}legL', x, z + 0.045 * s, x - 0.025 * s, z)
    stroke(f'{name}legR', x, z + 0.045 * s, x + 0.025 * s, z)


for k, x in enumerate((-0.62, -0.54, -0.46)):
    figure(f'dancer{k}', x, 0.2)
# a horned goat
stroke('goatbody', -0.3, 0.28, -0.2, 0.28, 0.02)
for k, dx in enumerate((-0.29, -0.21)):
    stroke(f'goatleg{k}', dx, 0.28, dx, 0.22)
stroke('goatneck', -0.2, 0.28, -0.18, 0.32)
stroke('goathorn', -0.18, 0.32, -0.21, 0.37)
# a reed boat with its rowers
stroke('boat', -0.62, 0.08, -0.38, 0.08, 0.016)
stroke('boatbow', -0.38, 0.08, -0.35, 0.13)
stroke('boatstern', -0.62, 0.08, -0.65, 0.13)
for k in range(5):
    stroke(f'rower{k}', -0.58 + k * 0.045, 0.09, -0.58 + k * 0.045, 0.13)

# ---------- scrub ----------
for k in range(14):
    a = rng.uniform(math.radians(200), math.radians(340))
    r = rng.uniform(0.5, 1.25)
    x, y = r * math.cos(a), r * math.sin(a)
    s = ball(f'scrub{k}', M['scrub'], 0, 0, 0, rng.uniform(0.035, 0.05), outline=0.008)
    s.scale = (1.3, 1.3, 0.7)
    s.location = (x, y, G + 0.02)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

# A cartoon Fouta Djallon for the country maps, built in the set's shared look (../toon.py):
# Guinea's highlands, a sandstone plateau with sheer red cliffs and a green top, a waterfall leaping
# from its edge into a pool and a stream, a Fula village of round thatched huts below, mango trees,
# and a zebu. Turned a little towards the camera.
# Run: blender -b --factory-startup -P fouta-djallon.py -- fouta-djallon-1024.png 1024 fouta-djallon.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'cliff': toon('cliff', '#b8704a', shadow_mul=(0.84, 0.72, 0.72)),
    'cliffDark': toon('cliffDark', '#9a5a3a', shadow_mul=(0.84, 0.72, 0.72)),
    'top': toon('top', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'falls': toon('falls', '#eaf6fa', shadow_mul=(0.8, 0.86, 0.94), lift=0.15),
    'water': toon('water', '#4aa6c8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'mud': toon('mud', '#c48a5a'),
    'thatch': toon('thatch', '#c9a85a', shadow_mul=(0.84, 0.76, 0.62)),
    'window': flat('window', '#3a3640'),
    'mango': toon('mango', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6b5040'),
    'zebu': toon('zebu', '#f0e8d8', lift=0.2),
    'horn': toon('horn', '#3a3030'),
    'path': toon('path2', '#d9b88a', lift=0.25),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(761)


def ring(cx, cy, rx, ry, z, k, sides=20):
    return [(cx + rx * math.cos(t) * (1 + 0.07 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the plateau: red cliffs, banded, under a green top ----------
PX, PY = -0.1, 0.45
cliff = loft('plateau', M['cliff'], [ring(PX, PY, 0.95, 0.55, -0.01, 1), ring(PX, PY, 0.9, 0.52, 0.22, 1), ring(PX, PY, 0.86, 0.5, 0.42, 1)], outline=0.025)
cliff.visible_shadow = False
band = loft('cliffband', M['cliffDark'], [ring(PX, PY, 0.915, 0.525, 0.18, 1), ring(PX, PY, 0.91, 0.522, 0.24, 1)], outline=0.006)
band.visible_shadow = False
top = loft('plateautop', M['top'], [ring(PX, PY, 0.86, 0.5, 0.415, 1), ring(PX, PY, 0.82, 0.47, 0.44, 1)], outline=0.012)
top.visible_shadow = False
for k in range(10):
    a = 2 * math.pi * k / 10
    x, y = PX + 0.6 * math.cos(a), PY + 0.32 * math.sin(a)
    ball(f'topbush{k}', M['mango'], x, y, G + 0.5, rng.uniform(0.06, 0.08), outline=0.012)

# ---------- the waterfall from the plateau's edge, its pool and the stream ----------
FX = 0.05
FY = PY - 0.52          # just in front of the cliff face where the water leaves the top
bar('fall', M['falls'], (FX, FY + 0.02, G + 0.44), (FX, FY - 0.06, G + 0.02), 0.09, outline=0.005)
cyl('fallpool', M['water'], 1.0, 0.01, segs=20, outline=0.006, matrix=Matrix.Translation((FX, FY - 0.16, G + 0.004)) @ Matrix.Scale(0.2, 4, (1, 0, 0)) @ Matrix.Scale(0.1, 4, (0, 1, 0)))
PATH = [(FX, FY - 0.2), (0.1, -0.45), (0.25, -0.65), (0.2, -0.9), (0.3, -1.15)]
bm = bmesh.new()
verts = []
for i, (x, y) in enumerate(PATH):
    (x0, y0), (x1, y1) = PATH[max(0, i - 1)], PATH[min(len(PATH) - 1, i + 1)]
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy)
    w = 0.04 + 0.02 * i / len(PATH)
    verts.append((bm.verts.new((x - dy / n * w, y + dx / n * w, G + 0.005)), bm.verts.new((x + dy / n * w, y - dx / n * w, G + 0.005))))
for (a0, a1), (b0, b1) in zip(verts, verts[1:]):
    bm.faces.new((a0, a1, b1, b0))
finish('stream', bm, M['water'], outline=0.006)
for k in range(4):
    ball(f'spray{k}', M['falls'], FX - 0.06 + k * 0.04, FY - 0.1, G + 0.03, 0.025, outline=0.003)

# ---------- the Fula village below ----------
for k, (x, y, r) in enumerate(((-0.55, -0.35, 0.09), (-0.3, -0.55, 0.08), (-0.72, -0.62, 0.085), (0.6, -0.4, 0.09), (0.8, -0.15, 0.08))):
    lathe(f'hutwall{k}', M['mud'], ((r, 0), (r, 0.08)), G - 0.005, x, y, segs=14, outline=0.01)
    lathe(f'hutroof{k}', M['thatch'], ((r + 0.04, 0), (r * 0.5, 0.06), (0.004, 0.15)), G + 0.075, x, y, segs=14, outline=0.01)
    box(f'hutdoor{k}', M['window'], x, y - r - 0.002, G, 0.035, 0.01, 0.055, outline=0, bevel=0)
box('villagepath', M['path'], -0.45, -0.55, G - 0.004, 0.55, 0.08, 0.008, rot_z=-0.3, outline=0.003, bevel=0)
for k, (x, y) in enumerate(((-0.95, -0.2), (-0.15, -0.85), (0.95, -0.55), (-0.5, -0.95))):
    h = rng.uniform(0.1, 0.14)
    rod(f'mangotrunk{k}', M['trunk'], (x, y, G), (x, y, G + h), 0.02, segs=8, outline=0.006)
    ball(f'mango{k}', M['mango'], x, y, G + h + 0.08, rng.uniform(0.12, 0.14), outline=0.016)

# ---------- a zebu ----------
ZX, ZY = 0.48, -0.75
for k, (dx, dy) in enumerate(((-0.045, -0.02), (-0.045, 0.02), (0.045, -0.02), (0.045, 0.02))):
    rod(f'zebuleg{k}', M['zebu'], (ZX + dx, ZY + dy, G), (ZX + dx, ZY + dy, G + 0.06), 0.009, segs=6, outline=0.002)
box('zebubody', M['zebu'], ZX, ZY, G + 0.055, 0.13, 0.06, 0.055, outline=0.006, bevel=0.015)
ball('zebuhump', M['zebu'], ZX + 0.035, ZY, G + 0.115, 0.025, outline=0.004)
box('zebuhead', M['zebu'], ZX + 0.085, ZY, G + 0.075, 0.04, 0.035, 0.035, outline=0.004, bevel=0.008)
for sy in (-1, 1):
    bar(f'zebuhorn{sy}', M['horn'], (ZX + 0.09, ZY + sy * 0.015, G + 0.11), (ZX + 0.095, ZY + sy * 0.04, G + 0.15), 0.008, outline=0.002)

turn(before, -20)
render(G)

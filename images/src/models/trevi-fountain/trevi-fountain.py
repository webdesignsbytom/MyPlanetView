# A cartoon Trevi Fountain for the country maps, built in the set's shared look (../toon.py): the
# Palazzo Poli's front made into a triumphal arch, its tall Corinthian columns and the attic with the
# papal arms, Oceanus standing in his niche on the shell chariot drawn by two sea horses and tritons,
# the white travertine rocks with the water spilling over them into the wide turquoise pool, and the
# steps where people sit. Turned a little towards the camera.
# Run: blender -b --factory-startup -P trevi-fountain.py -- trevi-fountain-1024.png 1024 trevi-fountain.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8bca8', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'travertine': toon('travertine', '#efe6d0', shadow_mul=(0.86, 0.82, 0.84), lift=0.2),
    'stoneDark': toon('stoneDark', '#d2c4a4', shadow_mul=(0.86, 0.82, 0.84)),
    'ochre': toon('ochre', '#e8c890', shadow_mul=(0.86, 0.8, 0.78), lift=0.1),
    'marble': toon('marble', '#fbf9f2', shadow_mul=(0.82, 0.84, 0.9), lift=0.25),
    'water': toon('water', '#3ab8c8', shadow_mul=(0.78, 0.88, 0.92), lift=0.35),
    'foam': toon('foam', '#e8fbff', lift=0.4),
    'window': flat('window', '#3a3a42'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(1762)

# ---------- the palace front ----------
FY = 0.45            # the facade's face
FW, FH = 1.2, 0.62
box('palace', M['ochre'], 0, FY + 0.15, G - 0.005, FW + 0.3, 0.3, FH - 0.06, outline=0.009, bevel=0)
box('facade', M['travertine'], 0, FY + 0.03, G - 0.005, FW, 0.06, FH, outline=0.01, bevel=0)
for row in range(3):
    for j in range(8):
        x = -0.55 + j * 0.157
        if abs(x) < 0.2:
            continue
        box(f'win{row}{j}', M['window'], x, FY - 0.003, G + 0.2 + row * 0.13, 0.04, 0.006, 0.07, outline=0, bevel=0)
        box(f'winhood{row}{j}', M['stoneDark'], x, FY - 0.006, G + 0.275 + row * 0.13, 0.055, 0.008, 0.012, outline=0, bevel=0)
# the arch in the middle: four giant columns round the niche
for x in (-0.22, -0.12, 0.12, 0.22):
    rod(f'column{x}', M['travertine'], (x, FY - 0.03, G + 0.12), (x, FY - 0.03, G + FH - 0.1), 0.022, segs=12, outline=0.004)
    lathe(f'capital{x}', M['stoneDark'], ((0.022, 0), (0.032, 0.025)), G + FH - 0.1, x, FY - 0.03, segs=10, outline=0.002)
box('entablature', M['stoneDark'], 0, FY - 0.02, G + FH - 0.08, 0.56, 0.06, 0.05, outline=0.004, bevel=0)
box('attic', M['travertine'], 0, FY, G + FH - 0.035, 0.5, 0.06, 0.12, outline=0.005, bevel=0)
box('inscription', M['stoneDark'], 0, FY - 0.032, G + FH + 0.0, 0.36, 0.006, 0.04, outline=0, bevel=0)
box('arms', M['travertine'], 0, FY - 0.01, G + FH + 0.08, 0.14, 0.04, 0.08, outline=0.003, bevel=0)
for s in (-1, 1):
    ball(f'armsfigure{s}', M['marble'], s * 0.1, FY - 0.02, G + FH + 0.1, 0.025, outline=0.002)
for j in range(4):
    rod(f'atticstatue{j}', M['marble'], (-0.19 + j * 0.127, FY - 0.035, G + FH + 0.085), (-0.19 + j * 0.127, FY - 0.035, G + FH + 0.14), 0.012, segs=6, outline=0.002)
    ball(f'atticstatuehead{j}', M['marble'], -0.19 + j * 0.127, FY - 0.035, G + FH + 0.15, 0.01, outline=0.001)
box('balustrade', M['travertine'], 0, FY + 0.02, G + FH - 0.01, FW, 0.04, 0.03, outline=0.003, bevel=0)
# the niche, half round, with Oceanus in it
box('niche', M['stoneDark'], 0, FY - 0.005, G + 0.12, 0.17, 0.006, 0.24, outline=0, bevel=0)
cyl('nichetop', M['stoneDark'], 0.085, 0.006, segs=16, outline=0, matrix=Matrix.Translation((0, FY - 0.005, G + 0.36)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for s in (-1, 1):
    box(f'sideniche{s}', M['stoneDark'], s * 0.17, FY - 0.005, G + 0.18, 0.06, 0.006, 0.12, outline=0, bevel=0)
    rod(f'sidestatue{s}', M['marble'], (s * 0.17, FY - 0.025, G + 0.18), (s * 0.17, FY - 0.025, G + 0.28), 0.018, r2=0.012, segs=8, outline=0.002)
    ball(f'sidestatuehead{s}', M['marble'], s * 0.17, FY - 0.025, G + 0.292, 0.011, outline=0.001)

# ---------- the rocks, the chariot and the sea horses ----------
for k in range(30):
    x = rng.uniform(-0.55, 0.55)
    y = FY - 0.06 - rng.uniform(0, 0.22) * (1 - abs(x) / 0.7)
    r = rng.uniform(0.05, 0.1)
    b = ball(f'rock{k}', M['travertine'], 0, 0, 0, r, outline=0.006)
    b.scale = (1.3, 0.9, 0.7)
    b.location = (x, y, G + 0.02 + rng.uniform(0, 0.06) * (1 - abs(x)))
# the shell chariot and Oceanus
shell = ball('shell', M['marble'], 0, 0, 0, 0.07, outline=0.005)
shell.scale = (1.2, 0.8, 0.5)
shell.location = (0, FY - 0.14, G + 0.14)
rod('oceanus', M['marble'], (0, FY - 0.12, G + 0.16), (0, FY - 0.12, G + 0.3), 0.03, r2=0.02, segs=10, outline=0.004)
ball('oceanushead', M['marble'], 0, FY - 0.12, G + 0.32, 0.02, outline=0.002)
for s in (-1, 1):
    bar(f'oceanusarm{s}', M['marble'], (s * 0.02, FY - 0.12, G + 0.27), (s * 0.06, FY - 0.13, G + 0.24), 0.012, outline=0.002)
    # the sea horses, one wild, one calm, each led by a triton
    hx = s * 0.17
    horse = ball(f'seahorse{s}', M['marble'], 0, 0, 0, 0.045, outline=0.004)
    horse.scale = (0.8, 1.5, 0.9)
    horse.location = (hx, FY - 0.25, G + 0.1)
    rod(f'seahorseneck{s}', M['marble'], (hx, FY - 0.3, G + 0.11), (hx, FY - 0.33, G + 0.17 + 0.03 * (s > 0)), 0.018, segs=8, outline=0.003)
    ball(f'seahorsehead{s}', M['marble'], hx, FY - 0.34, G + 0.18 + 0.03 * (s > 0), 0.018, outline=0.002)
    for fx in (-0.015, 0.015):
        bar(f'seahorseleg{s}{fx}', M['marble'], (hx + fx, FY - 0.3, G + 0.1), (hx + fx, FY - 0.34, G + 0.06), 0.01, outline=0.001)
    rod(f'triton{s}', M['marble'], (hx + s * 0.08, FY - 0.24, G + 0.08), (hx + s * 0.08, FY - 0.26, G + 0.2), 0.02, segs=8, outline=0.003)
    ball(f'tritonhead{s}', M['marble'], hx + s * 0.08, FY - 0.26, G + 0.215, 0.014, outline=0.002)

# ---------- the pool, the falling water and the steps ----------
PY0 = FY - 0.05   # the pool's straight back edge, along the facade


def half(rx, ry):
    """A half ellipse in front of the facade, from its right end round to its left."""
    return [(rx * math.cos(math.pi * k / 20), PY0 - ry * math.sin(math.pi * k / 20)) for k in range(21)]


def band(name, mat, outer, inner, z0, z1):
    """The strip between two half ellipses, as a row of blocks."""
    for k in range(20):
        quad = [outer[k], outer[k + 1], inner[k + 1], inner[k]]
        loft(f'{name}{k}', mat, [[(x, y, z0) for x, y in quad], [(x, y, z1) for x, y in quad]], outline=0.001)


loft('poolfloor', M['travertine'], [[(x, y, G - 0.004) for x, y in half(0.8, 0.42)], [(x, y, G + 0.012) for x, y in half(0.8, 0.42)]], outline=0.002)
loft('pool', M['water'], [[(x, y, G + 0.008) for x, y in half(0.76, 0.38)], [(x, y, G + 0.026) for x, y in half(0.76, 0.38)]], outline=0)
band('poolrim', M['travertine'], half(0.8, 0.42), half(0.75, 0.37), G - 0.004, G + 0.04)
for i in range(3):
    band(f'step{i}', M['stoneDark'], half(0.88 + 0.08 * i, 0.5 + 0.08 * i), half(0.8 + 0.08 * i, 0.42 + 0.08 * i), G - 0.004, G + 0.03 - 0.01 * i)
for k, x in enumerate((-0.32, -0.15, 0.0, 0.15, 0.32)):
    bar(f'fall{k}', M['foam'], (x, FY - 0.16, G + 0.1 - 0.04 * (abs(x) > 0.2)), (x * 1.05, FY - 0.24, G + 0.03), 0.05, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

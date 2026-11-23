# A cartoon Teatro Amazonas for the country maps, built in the set's shared look (../toon.py):
# Manaus's rubber-boom opera house, rose-pink with white columns and its dome tiled in the
# Brazilian flag's green, yellow and blue, the wave-patterned pavement of São Sebastião square in
# front, palms and mango trees, and the Rio Negro behind with a riverboat.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P teatro-amazonas.py -- teatro-amazonas-1024.png 1024 teatro-amazonas.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'river': toon('river', '#5a6a5a', shadow_mul=(0.8, 0.84, 0.86), lift=0.25),
    'paving': toon('paving', '#f2eee6', shadow_mul=(0.82, 0.82, 0.9), lift=0.2),
    'wave': toon('wave', '#3a3640'),
    'pink': toon('pink', '#e8a4a0', shadow_mul=(0.86, 0.76, 0.8), lift=0.15),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'yellow': toon('domeYellow', '#f0c030', lift=0.35),
    'green': toon('domeGreen', '#2f9a5a'),
    'blue': toon('domeBlue', '#2f5ab0'),
    'roof': toon('roof', '#8a8e96', shadow_mul=(0.8, 0.8, 0.88)),
    'window': flat('window', '#3a3640'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'tree': toon('tree', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'boat': toon('boat', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'boatBlue': toon('boatBlue', '#2f6fc0'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(1301)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the Rio Negro behind, a riverboat on it ----------
flat_face('river', M['river'], [(x, y) for x, y, _ in segment(0.78, 1.41, 0)], G + 0.004, outline=0.008)
RX, RY = 0.45, 1.0
loft('riverboat', M['boat'], [[(RX - 0.18, RY, G), (RX + 0.12, RY - 0.05, G), (RX + 0.2, RY, G), (RX + 0.12, RY + 0.05, G)],
                              [(RX - 0.2, RY, G + 0.05), (RX + 0.12, RY - 0.06, G + 0.05), (RX + 0.24, RY, G + 0.05), (RX + 0.12, RY + 0.06, G + 0.05)]], outline=0.007)
box('riverboatdeck', M['boat'], RX, RY, G + 0.05, 0.26, 0.08, 0.05, outline=0.005, bevel=0)
box('riverboatroof', M['boatBlue'], RX, RY, G + 0.1, 0.28, 0.09, 0.012, outline=0.004, bevel=0)

# ---------- the square's wave pavement ----------
for k in range(4):
    y0 = -0.45 - k * 0.13
    pts = [(-0.9 + j * 0.15, y0 + 0.035 * math.sin(j * 1.6)) for j in range(13)]
    for j in range(12):
        (x0, ya), (x1, yb) = pts[j], pts[j + 1]
        if math.hypot(x1, yb) > 1.3 or math.hypot(x0, ya) > 1.3:
            continue
        bar(f'wave{k}{j}', M['wave'], (x0, ya, G - 0.002), (x1, yb, G - 0.002), 0.03, outline=0)

# ---------- the opera house ----------
OX, OY = 0.0, 0.25
box('house', M['pink'], OX, OY, G - 0.005, 0.7, 0.5, 0.24, outline=0.016, bevel=0)
box('cornice', M['white'], OX, OY, G + 0.235, 0.72, 0.52, 0.025, outline=0.006, bevel=0)
box('roof', M['roof'], OX, OY + 0.05, G + 0.255, 0.6, 0.32, 0.04, outline=0.008, bevel=0)
for row in range(2):
    for j in range(6):
        x = OX - 0.3 + j * 0.12
        if abs(x) < 0.1:
            continue
        box(f'win{row}{j}', M['window'], x, OY - 0.253, G + 0.05 + row * 0.1, 0.035, 0.006, 0.06, outline=0, bevel=0)
# the portico: steps, columns, pediment
box('steps', M['white'], OX, OY - 0.31, G - 0.005, 0.34, 0.12, 0.03, outline=0.006, bevel=0)
box('porch', M['white'], OX, OY - 0.3, G + 0.025, 0.3, 0.1, 0.012, outline=0.004, bevel=0)
for j in range(6):
    x = OX - 0.125 + j * 0.05
    rod(f'column{j}', M['white'], (x, OY - 0.33, G + 0.035), (x, OY - 0.33, G + 0.19), 0.011, segs=10, outline=0.003)
box('entablature', M['white'], OX, OY - 0.3, G + 0.19, 0.32, 0.12, 0.03, outline=0.006, bevel=0)
loft('pediment', M['white'], [[(OX - 0.16, OY - 0.36, G + 0.22), (OX + 0.16, OY - 0.36, G + 0.22), (OX + 0.16, OY - 0.24, G + 0.22), (OX - 0.16, OY - 0.24, G + 0.22)],
                              [(OX - 0.004, OY - 0.36, G + 0.28), (OX + 0.004, OY - 0.36, G + 0.28), (OX + 0.004, OY - 0.24, G + 0.28), (OX - 0.004, OY - 0.24, G + 0.28)]],
     outline=0.008)
# the dome on its drum, tiled in green, yellow and blue
DX, DY = OX, OY + 0.08
lathe('drum', M['pink'], ((0.13, 0), (0.13, 0.06)), G + 0.29, DX, DY, segs=20, outline=0.01)
lathe('drumcornice', M['white'], ((0.14, 0), (0.14, 0.015)), G + 0.35, DX, DY, segs=20, outline=0.004)
DOME = [(0.14, 0.0), (0.135, 0.04), (0.12, 0.08), (0.095, 0.115), (0.06, 0.14), (0.004, 0.155)]
for i in range(len(DOME) - 1):
    (r0, h0), (r1, h1) = DOME[i], DOME[i + 1]
    lathe(f'dome{i}', M[('green', 'yellow', 'blue', 'yellow', 'green')[i]], ((r0, 0), (r1, h1 - h0)), G + 0.365 + h0, DX, DY, segs=24, outline=0.01 if i == 0 else 0.004)
lathe('lantern', M['white'], ((0.025, 0), (0.025, 0.04), (0.004, 0.07)), G + 0.52, DX, DY, segs=10, outline=0.004)

# ---------- palms and mango trees ----------
for k, (x, y) in enumerate(((-0.6, -0.2), (0.6, -0.2), (-0.85, 0.3), (0.85, 0.35))):
    h = 0.32
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + h), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + h), (x + 0.02 + 0.11 * math.cos(b), y + 0.11 * math.sin(b), G + h - 0.05), 0.02, outline=0.005)
for k, (x, y) in enumerate(((-0.45, 0.65), (0.5, 0.65), (-1.05, -0.2), (1.05, -0.15))):
    rod(f'mangotrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.08), 0.014, segs=6, outline=0.004)
    ball(f'mango{k}', M['tree'], x, y, G + 0.14, rng.uniform(0.09, 0.11), outline=0.012)

turn(before, -20)
render(G)

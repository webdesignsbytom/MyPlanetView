# A cartoon Cape Coast Castle for the country maps, built in the set's shared look (../toon.py):
# the whitewashed castle on its rocks above the Atlantic, its battlemented walls, the tower in the
# middle and the two bastions pushing out towards the sea with their row of cannon; the beach beside
# it with the fishermen's brightly painted canoes, and palms along the shore. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P cape-coast-castle.py -- cape-coast-castle-1024.png 1024 cape-coast-castle.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#3fa3d6', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'land': toon('land', '#c9a46a', lift=0.25),
    'beach': toon('beach', '#f0e2be', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'rock': toon('rock', '#7f776e', shadow_mul=(0.8, 0.8, 0.88)),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'window': flat('window', '#33303d'),
    'cannon': toon('cannon', '#3a3a40'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'red': toon('red', '#d9483b'), 'yellow': toon('yellow', '#f4c83c', shadow_mul=(0.8, 0.68, 0.55)),
    'green': toon('green', '#2f9a5a', shadow_mul=(0.7, 0.78, 0.8)), 'blue': toon('blue', '#3c6fc4', shadow_mul=(0.72, 0.72, 0.82)),
    'flagRed': flat('flagRed', '#ce1126'), 'flagGold': flat('flagGold', '#fcd116'), 'flagGreen': flat('flagGreen', '#006b3f'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(239)

# ---------- the land behind and the beach ----------
R = 1.42
LAND = [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(-8, 189, 14)] + [(-1.3, -0.15), (-0.4, -0.25), (0.6, -0.2), (1.35, -0.05)]
loft('land', M['land'], [[(x, y, G - 0.01) for x, y in LAND], [(x, y, G + 0.05) for x, y in LAND]], outline=0.025)
BEACH = [(-1.32, -0.15), (-0.45, -0.25), (-0.55, -0.45), (-1.2, -0.45)]
loft('beach', M['beach'], [[(x, y, G - 0.005) for x, y in BEACH], [(x, y, G + 0.035) for x, y in BEACH]], outline=0.012)

# ---------- the rocks the castle stands on ----------
for k, (x, y, r) in enumerate(((0.05, -0.45, 0.2), (0.45, -0.5, 0.22), (0.8, -0.35, 0.17), (-0.25, -0.4, 0.14), (0.6, -0.68, 0.12), (0.2, -0.7, 0.13))):
    b = ball(f'rock{k}', M['rock'], 0, 0, 0, r, outline=0.02)
    b.scale = (1.3, 1.0, 0.55)
    b.location = (x, y, G + 0.02)
    b.visible_shadow = False


def battlements(name, x0, y0, x1, y1, z):
    length = math.hypot(x1 - x0, y1 - y0)
    a = math.atan2(y1 - y0, x1 - x0)
    n = max(1, int(length / 0.07))
    for k in range(n):
        t = (k + 0.5) / n
        box(f'{name}{k}', M['white'], x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z, 0.035, 0.04, 0.035, rot_z=a, outline=0.006, bevel=0)


# ---------- the castle: its walls round the courtyard ----------
CX, CY = 0.3, 0.05
WALLS = [(-0.25, -0.35), (0.85, -0.35), (0.85, 0.42), (-0.25, 0.42)]
H = 0.32
for k, ((x0, y0), (x1, y1)) in enumerate(zip(WALLS, WALLS[1:] + WALLS[:1])):
    length = math.hypot(x1 - x0, y1 - y0)
    a = math.atan2(y1 - y0, x1 - x0)
    box(f'wall{k}', M['white'], (x0 + x1) / 2, (y0 + y1) / 2, G + 0.03, length + 0.06, 0.1 if k != 0 else 0.16, H, rot_z=a, outline=0.022, bevel=0)
    battlements(f'merlon{k}', x0, y0, x1, y1, G + 0.03 + H)
# the sea front: three storeys of windows
for row, z in enumerate((0.1, 0.2)):
    for k in range(10):
        box(f'seawin{row}{k}', M['window'], -0.18 + k * 0.105, -0.35 - 0.084, G + 0.03 + z, 0.035, 0.01, 0.055, outline=0, bevel=0)
# the tower in the middle
box('tower', M['white'], CX, CY + 0.1, G + 0.03, 0.26, 0.24, 0.62, outline=0.024, bevel=0)
battlements('towermerlonf', CX - 0.13, CY - 0.02, CX + 0.13, CY - 0.02, G + 0.65)
battlements('towermerlonb', CX - 0.13, CY + 0.22, CX + 0.13, CY + 0.22, G + 0.65)
for k, z in enumerate((0.38, 0.5)):
    for j in range(2):
        box(f'towerwin{k}{j}', M['window'], CX - 0.05 + j * 0.1, CY - 0.022, G + z, 0.03, 0.01, 0.05, outline=0, bevel=0)
rod('flagpole', M['white'], (CX, CY + 0.1, G + 0.65), (CX, CY + 0.1, G + 0.95), 0.006, segs=6, outline=0.003)
for k, mat in enumerate(('flagRed', 'flagGold', 'flagGreen')):
    box(f'flag{k}', M[mat], CX + 0.065, CY + 0.1, G + 0.92 - k * 0.028, 0.12, 0.006, 0.028, outline=0, bevel=0)
# the two bastions pushing out to sea, with their cannon
for k, (bx, by) in enumerate(((-0.25, -0.35), (0.85, -0.35))):
    pts = [(bx - 0.18, by + 0.05), (bx, by - 0.22), (bx + 0.18, by + 0.05), (bx, by + 0.14)]
    loft(f'bastion{k}', M['white'], [[(x, y, G + 0.02) for x, y in pts], [(x, y, G + 0.26) for x, y in pts]], outline=0.022)
    for j in range(3):
        t = (j + 1) / 4
        for (x0, y0), (x1, y1) in ((pts[0], pts[1]), (pts[1], pts[2])):
            x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            a = math.atan2(y1 - y0, x1 - x0) - math.pi / 2
            rod(f'cannon{k}{j}{x0}', M['cannon'], (x, y, G + 0.27), (x + 0.07 * math.cos(a), y + 0.07 * math.sin(a), G + 0.28), 0.014, r2=0.011,
                segs=8, outline=0.005)

# ---------- the fishermen's painted canoes on the beach, and palms ----------
for k, (x, y, a, c1, c2) in enumerate(((-1.0, -0.3, 0.3, 'red', 'yellow'), (-0.75, -0.35, 0.2, 'green', 'red'), (-0.55, -0.55, -0.2, 'blue', 'yellow'))):
    box(f'canoe{k}', M[c1], x, y, G + 0.03, 0.34, 0.07, 0.045, rot_z=a, outline=0.01, bevel=0.012)
    box(f'canoestripe{k}', M[c2], x, y, G + 0.06, 0.345, 0.075, 0.012, rot_z=a, outline=0, bevel=0)
for k, (x, y) in enumerate(((-1.05, 0.2), (-0.7, 0.35), (-0.95, 0.7), (1.05, 0.65), (-0.45, 0.9))):
    h = rng.uniform(0.25, 0.32)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G + 0.05), (x + 0.03, y, G + 0.05 + h), 0.016, r2=0.012, segs=8, outline=0.008)
    for f in range(6):
        a = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + 0.05 + h), (x + 0.03 + 0.11 * math.cos(a), y + 0.11 * math.sin(a), G + h), 0.022, outline=0.006)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

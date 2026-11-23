# A cartoon Soufrière Hills for the country maps, built in the set's shared look (../toon.py):
# Montserrat's volcano, its grey dome smoking and its ash plume rising, the grey flows down its front
# that buried Plymouth, the old town's roofs and its clock tower sticking out of the ash, the green
# hills either side, and the sea. Turned a little towards the camera.
# Run: blender -b --factory-startup -P soufriere-hills.py -- soufriere-hills-1024.png 1024 soufriere-hills.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2a8ac0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'green': toon('green', '#5a9a48', shadow_mul=(0.7, 0.78, 0.8)),
    'forest': toon('forest', '#3f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'volcano': toon('volcano', '#7a726a', shadow_mul=(0.84, 0.82, 0.88)),
    'ash': toon('ash', '#b0aaa2', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'dome': toon('dome', '#5a5450', shadow_mul=(0.84, 0.84, 0.9)),
    'glow': flat('glow', '#f08a2a'),
    'plume': toon('plume', '#c8c4be', shadow_mul=(0.84, 0.86, 0.92), lift=0.15),
    'plumeDark': toon('plumeDark', '#9a948e', shadow_mul=(0.84, 0.86, 0.92)),
    'roof': toon('roof', '#c4573a'), 'roof2': toon('roof2', '#5a7a8a'),
    'tower': toon('tower', '#e8e2d4', shadow_mul=(0.8, 0.82, 0.9), lift=0.2),
    'clock': flat('clock', '#3a3640'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1171)


def segment(c, r, z, n=24):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


def ring(cx, cy, rx, ry, z, k, sides=22):
    return [(cx + rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- the island's land, green at the sides ----------
land = loft('land', M['green'], [segment(-0.45, 1.41, -0.01), segment(-0.4, 1.39, 0.06)], outline=0.016)
land.visible_shadow = False
for k, (x, y) in enumerate(((-0.95, 0.3), (-1.05, -0.05), (0.95, 0.25), (1.05, -0.1), (-0.75, 0.75), (0.75, 0.8), (-1.1, 0.5), (1.1, 0.5))):
    ball(f'forest{k}', M['forest'], x, y, G + 0.1, rng.uniform(0.08, 0.1), outline=0.012)

# ---------- the volcano: a grey cone, the lava dome on top ----------
VX, VY = 0.0, 0.5
v = loft('volcano', M['volcano'], [ring(VX, VY, 0.82, 0.62, 0.05, 1), ring(VX, VY + 0.04, 0.42, 0.3, 0.42, 1), ring(VX, VY + 0.06, 0.2, 0.15, 0.58, 1)], outline=0.018, smooth=True)
v.visible_shadow = False
d = loft('dome', M['dome'], [ring(VX, VY + 0.06, 0.2, 0.15, 0.57, 3), ring(VX, VY + 0.06, 0.12, 0.09, 0.66, 3), ring(VX, VY + 0.06, 0.04, 0.03, 0.69, 3)], outline=0.012, smooth=True)
d.visible_shadow = False
for k, (dx, dz) in enumerate(((-0.06, 0.63), (0.07, 0.62))):
    ball(f'glow{k}', M['glow'], VX + dx, VY - 0.04, G + dz, 0.018, outline=0)

# ---------- the grey flows down the front, over Plymouth ----------
for k, (x0, x1) in enumerate(((-0.12, -0.35), (0.1, 0.2), (0.0, -0.05))):
    loft(f'flow{k}', M['ash'], [[(x0 - 0.07, VY - 0.22, G + 0.4), (x0 + 0.07, VY - 0.22, G + 0.4), (x0 + 0.07, VY - 0.12, G + 0.45), (x0 - 0.07, VY - 0.12, G + 0.45)],
                                [(x1 - 0.2, -0.75, G + 0.04), (x1 + 0.2, -0.75, G + 0.04), (x1 + 0.17, -0.45, G + 0.07), (x1 - 0.17, -0.45, G + 0.07)]], outline=0.01, smooth=True)
ashfield = loft('ashfield', M['ash'], [ring(-0.05, -0.55, 0.62, 0.28, -0.005, 5), ring(-0.05, -0.53, 0.56, 0.24, 0.06, 5)], outline=0.012, smooth=True)
ashfield.visible_shadow = False
A = G + 0.06

# ---------- Plymouth's roofs and clock tower in the ash ----------
for k, (x, y, a) in enumerate(((-0.45, -0.6, 0.2), (-0.25, -0.72, -0.1), (0.25, -0.62, 0.15), (0.4, -0.5, -0.2), (-0.05, -0.75, 0.3), (0.1, -0.45, 0.0))):
    loft(f'buriedroof{k}', M['roof' if k % 2 else 'roof2'], [[(x - 0.07, y - 0.05, A - 0.02), (x + 0.07, y - 0.05, A - 0.02), (x + 0.07, y + 0.05, A - 0.02), (x - 0.07, y + 0.05, A - 0.02)],
                                                            [(x - 0.07, y - 0.002, A + 0.04), (x + 0.07, y - 0.002, A + 0.04), (x + 0.07, y + 0.002, A + 0.04),
                                                             (x - 0.07, y + 0.002, A + 0.04)]], outline=0.006)
TX, TY = -0.1, -0.55
box('clocktower', M['tower'], TX, TY, A - 0.03, 0.08, 0.08, 0.2, outline=0.008, bevel=0)
pyramid('clocktowerroof', M['roof2'], TX, TY, A + 0.17, 0.1, 0.07, outline=0.006)
cyl('clockface', M['tower'], 0.025, 0.006, segs=14, outline=0.003, matrix=Matrix.Translation((TX, TY - 0.042, A + 0.12)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('clockhands', M['clock'], 0.012, 0.004, segs=8, outline=0, matrix=Matrix.Translation((TX, TY - 0.046, A + 0.12)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))

# ---------- the ash plume ----------
for k, (dx, dy, dz, r) in enumerate(((0.0, 0.0, 0.78, 0.1), (0.08, 0.02, 0.88, 0.11), (-0.05, 0.03, 0.95, 0.1), (0.14, 0.04, 1.0, 0.09), (0.04, 0.05, 1.06, 0.12),
                                     (0.2, 0.05, 1.1, 0.08), (-0.1, 0.04, 1.08, 0.08))):
    squashed(f'plume{k}', M['plumeDark' if k in (0, 3) else 'plume'], VX + dx, VY + 0.06 + dy, G + dz, r, 1.2, 1.0, 0.85, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

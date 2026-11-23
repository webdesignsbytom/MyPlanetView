# A cartoon Bab Mansour for the country maps, built in the set's shared look (../toon.py): Meknes'
# monumental gate, its great horseshoe arch framed by panels of green and white zellij tiles and
# carved bands, the two square bastions on either side with their marble columns, the stepped
# merlons along the top, the ochre city walls running away, and the square in front. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P bab-mansour.py -- bab-mansour-1024.png 1024 bab-mansour.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'square': toon('square', '#e0d0b0', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'ochre': toon('ochre', '#d0a070', shadow_mul=(0.86, 0.82, 0.76), lift=0.06),
    'ochreDark': toon('ochreDark', '#b08050'),
    'green': toon('green', '#2a8a5a', lift=0.12),
    'cream': toon('cream', '#f0e6cc', lift=0.15),
    'marble': toon('marble', '#f6f4ee', lift=0.15),
    'dark': flat('dark', '#2a2420'),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
})

G = tile(M['square'])
before = set(bpy.data.objects)


def merlons(name, x0, x1, y, z):
    n = max(2, int(abs(x1 - x0) / 0.05))
    for j in range(n):
        x = x0 + (j + 0.5) * (x1 - x0) / n
        box(f'{name}{j}', M['ochreDark'], x, y, z - 0.005, 0.03, 0.03, 0.03, outline=0.001, bevel=0)
        box(f'{name}cap{j}', M['ochreDark'], x, y, z + 0.024, 0.015, 0.03, 0.015, outline=0, bevel=0)


# ---------- the city walls ----------
WY = 0.25
for s in (-1, 1):
    box(f'citywall{s}', M['ochre'], s * 0.65, WY, G - 0.005, 0.6, 0.08, 0.2, outline=0.007, bevel=0)
    merlons(f'citymerlon{s}', s * 0.36, s * 0.95, WY - 0.03, G + 0.2)

# ---------- the gate ----------
GY = 0.15
box('gate', M['ochre'], 0.0, GY, G - 0.005, 0.46, 0.16, 0.42, outline=0.009, bevel=0)
F = GY - 0.083
box('tileframe', M['green'], 0.0, F, G + 0.02, 0.36, 0.006, 0.36, outline=0, bevel=0)
for i in range(6):
    for j in range(7):
        x = -0.15 + j * 0.05
        z = G + 0.06 + i * 0.055
        if abs(x) < 0.1 and z < G + 0.27:
            continue
        cyl(f'zellij{i}{j}', M['cream'], 0.016, 0.004, segs=4, outline=0, matrix=Matrix.Translation((x, F - 0.004, z)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('band', M['cream'], 0.0, F - 0.004, G + 0.34, 0.36, 0.004, 0.02, outline=0, bevel=0)
cyl('archframe', M['cream'], 0.105, 0.006, segs=24, outline=0, matrix=Matrix.Translation((0.0, F - 0.004, G + 0.19)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('arch', M['dark'], 0.09, 0.006, segs=24, outline=0, matrix=Matrix.Translation((0.0, F - 0.008, G + 0.19)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('archbottom', M['dark'], 0.0, F - 0.008, G - 0.005, 0.15, 0.006, 0.2, outline=0, bevel=0)
merlons('gatemerlon', -0.22, 0.22, GY - 0.05, G + 0.415)

# ---------- the bastions ----------
for s in (-1, 1):
    bx = s * 0.32
    box(f'bastion{s}', M['ochre'], bx, GY - 0.02, G - 0.005, 0.18, 0.2, 0.36, outline=0.008, bevel=0)
    box(f'bastiontile{s}', M['green'], bx, GY - 0.123, G + 0.18, 0.12, 0.006, 0.12, outline=0, bevel=0)
    for i in range(2):
        for j in range(2):
            cyl(f'bastionzellij{s}{i}{j}', M['cream'], 0.016, 0.004, segs=4, outline=0, matrix=Matrix.Translation((bx - 0.03 + j * 0.06, GY - 0.127, G + 0.21 + i * 0.06)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    box(f'loggia{s}', M['dark'], bx, GY - 0.123, G + 0.04, 0.1, 0.006, 0.1, outline=0, bevel=0)
    for j in (-1, 1):
        rod(f'column{s}{j}', M['marble'], (bx + j * 0.06, GY - 0.13, G - 0.005), (bx + j * 0.06, GY - 0.13, G + 0.15), 0.014, segs=10, outline=0.002)
    merlons(f'bastionmerlon{s}', bx - 0.09, bx + 0.09, GY - 0.11, G + 0.355)

for k, (x, y) in enumerate(((-0.75, -0.35), (0.75, -0.4), (-0.4, -0.7))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + 0.3), 0.016, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.03, y, G + 0.3), (x + 0.03 + 0.11 * math.cos(a), y + 0.11 * math.sin(a), G + 0.24), 0.025, outline=0.002)

turn(before, -20)
render(G)

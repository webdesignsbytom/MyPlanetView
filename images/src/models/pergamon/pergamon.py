# A cartoon Pergamon for the country maps, built in the set's shared look (../toon.py): the
# ancient acropolis on its steep hill, the theatre's rows of seats falling in a steep fan down the
# slope to the stage terrace, and on the top the Temple of Trajan's white marble columns and
# pediment above its arched terrace walls. Turned a little towards the camera.
# Run: blender -b --factory-startup -P pergamon.py -- pergamon-1024.png 1024 pergamon.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#b8b078', shadow_mul=(0.8, 0.8, 0.82), lift=0.2),
    'hill': toon('hill', '#a8a070', shadow_mul=(0.8, 0.8, 0.82)),
    'seat': toon('seat', '#d8ccb0', shadow_mul=(0.84, 0.84, 0.88), lift=0.08),
    'marble': toon('marble', '#f2ece0', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'stone': toon('stone', '#c0b090'),
    'dark': flat('dark', '#4a4038'),
    'olive': toon('olive', '#7a9a50', shadow_mul=(0.72, 0.8, 0.74)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)

HX, HY = 0.22, 0.52
hl = lathe('acropolis', M['hill'], ((0.66, 0), (0.55, 0.18), (0.42, 0.34), (0.34, 0.4)), G - 0.01, HX, HY, segs=32, outline=0.01)
hl.visible_shadow = False
T = G + 0.39

# ---------- the theatre ----------
OX, OY = -0.12, -0.3
rows, n = 11, 9
for j in range(rows):
    r0 = 0.1 + j * 0.05
    z = G + 0.015 + j * 0.034
    for k in range(n):
        a0 = math.radians(52 + 76 * k / n)
        a1 = math.radians(52 + 76 * (k + 1) / n)
        p = lambda r, a, zz: (OX + r * math.cos(a), OY + r * math.sin(a), zz)
        loft(f'seat{j}{k}', M['seat'], [[p(r0, a0, G - 0.005), p(r0 + 0.052, a0, G - 0.005), p(r0 + 0.052, a1, G - 0.005), p(r0, a1, G - 0.005)],
                                        [p(r0, a0, z), p(r0 + 0.052, a0, z), p(r0 + 0.052, a1, z), p(r0, a1, z)]], outline=0.002)
for j in (4, 8):
    for s in (-1, 1):
        a = math.radians(90 + s * 13)
        bar(f'aisle{j}{s}', M['stone'], (OX + 0.1 * math.cos(a), OY + 0.1 * math.sin(a), G + 0.02), (OX + 0.62 * math.cos(a), OY + 0.62 * math.sin(a), G + 0.39), 0.012, outline=0)
lathe('orchestra', M['stone'], ((0.09, 0), (0.09, 0.012)), G - 0.004, OX, OY, segs=16, outline=0.002)
box('stageterrace', M['stone'], OX, OY - 0.14, G - 0.005, 0.7, 0.1, 0.03, outline=0.003, bevel=0)

# ---------- the Temple of Trajan ----------
TX, TY = HX + 0.05, HY + 0.08
box('terrace', M['stone'], TX, TY - 0.2, G - 0.005, 0.5, 0.06, T - G + 0.02, outline=0.006, bevel=0)
for j in range(6):
    x = TX - 0.21 + j * 0.084
    box(f'terracearch{j}', M['dark'], x, TY - 0.232, G + 0.18, 0.04, 0.006, 0.1, outline=0, bevel=0)
    cyl(f'terracearchtop{j}', M['dark'], 0.02, 0.006, segs=10, outline=0, matrix=Matrix.Translation((x, TY - 0.232, G + 0.28)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('podium', M['marble'], TX, TY, T, 0.36, 0.42, 0.04, outline=0.005, bevel=0)
Z = T + 0.035
for j in range(6):
    x = TX - 0.15 + j * 0.06
    for y in (TY - 0.18, TY + 0.18):
        rod(f'col{j}{y}', M['marble'], (x, y, Z), (x, y, Z + 0.2), 0.014, segs=10, outline=0.002)
for j in range(1, 6):
    y = TY - 0.18 + j * 0.06
    for x in (TX - 0.15, TX + 0.15):
        rod(f'sidecol{j}{x}', M['marble'], (x, y, Z), (x, y, Z + 0.2), 0.014, segs=10, outline=0.002)
box('cella', M['marble'], TX, TY + 0.02, Z, 0.18, 0.24, 0.17, outline=0.004, bevel=0)
box('entablature', M['marble'], TX, TY, Z + 0.2, 0.34, 0.4, 0.035, outline=0.004, bevel=0)
loft('pediment', M['marble'], [[(TX - 0.17, TY - 0.2, Z + 0.23), (TX + 0.17, TY - 0.2, Z + 0.23), (TX + 0.17, TY + 0.2, Z + 0.23), (TX - 0.17, TY + 0.2, Z + 0.23)],
                               [(TX - 0.004, TY - 0.2, Z + 0.3), (TX + 0.004, TY - 0.2, Z + 0.3), (TX + 0.004, TY + 0.2, Z + 0.3), (TX - 0.004, TY + 0.2, Z + 0.3)]], outline=0.004)

for k, (x, y, r) in enumerate(((-0.85, -0.2, 0.09), (0.75, -0.45, 0.09), (-0.7, 0.45, 0.09), (0.45, -0.7, 0.08), (-0.55, -0.75, 0.08))):
    ball(f'olive{k}', M['olive'], x, y, G + r * 1.0, r, outline=0.007)

turn(before, -20)
render(G)

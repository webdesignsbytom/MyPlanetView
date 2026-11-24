# A cartoon Church of Saint Simeon Stylites for the country maps, built in the set's shared look
# (../toon.py): the great ruined church in the Dead Cities of northern Syria, built round the pillar
# on which the saint lived for 37 years: the octagon of tall arches standing round the worn stump of
# his pillar on its stepped base, the four basilicas reaching out from it in a cross, roofless, the
# south one's front with its triple arched portal and the east one's three apses. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P saint-simeon.py -- saint-simeon-1024.png 1024 saint-simeon.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#c8c09a', shadow_mul=(0.8, 0.8, 0.84), lift=0.18),
    'paving': toon('paving', '#ddd4bc', lift=0.18),
    'stone': toon('stone', '#e2d6bc', shadow_mul=(0.82, 0.82, 0.88), lift=0.18),
    'stoneDark': toon('stoneDark', '#b8ac92'),
    'dark': flat('dark', '#3a322a'),
    'olive': toon('olive', '#7a9a5a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(459)


def in_frame(name, x, y, rot, build):
    """Builds with build() around the origin facing -y, then turns it by rot and sets it at (x, y)."""
    objs = set(bpy.data.objects)
    build(name)
    bpy.context.view_layer.update()
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(rot, 4, 'Z')
    for o in set(bpy.data.objects) - objs:
        o.matrix_world = m @ o.matrix_world


def arch_span(name, span, spring, top, depth):
    for j in range(6):
        um = (j + 0.5) / 6
        z = spring + span / 2 * 0.85 * math.sqrt(max(0.0, 1 - (2 * um - 1) ** 2))
        box(f'{name}{j}', M['stone'], -span / 2 + span * um, 0, z, span / 6 + 0.002, depth, top - z, outline=0.002, bevel=0)


# ---------- the octagon of arches round the pillar ----------
OX, OY, R = 0.0, 0.05, 0.22
box('octagonfloor', M['paving'], OX, OY, G - 0.004, 0.5, 0.5, 0.012, outline=0.001, bevel=0)
PIER = 0.05
for k in range(8):
    a0 = math.pi / 8 + k * math.pi / 4
    vx, vy = OX + R * math.cos(a0), OY + R * math.sin(a0)
    box(f'pier{k}', M['stone'], vx, vy, G - 0.005, PIER, PIER, 0.3, rot_z=a0, outline=0.004, bevel=0)
    mx, my = OX + R * math.cos(a0 + math.pi / 8) * math.cos(math.pi / 8), OY + R * math.sin(a0 + math.pi / 8) * math.cos(math.pi / 8)
    chord = 2 * R * math.sin(math.pi / 8) - PIER
    if k in (1, 4):
        continue
    in_frame(f'octarch{k}', mx, my, a0 + math.pi / 8 - math.pi / 2, lambda n: arch_span(n, chord, G + 0.2, G + 0.3, 0.045))
# the stump of the pillar on its stepped base
for i, w in enumerate((0.14, 0.11)):
    box(f'pillarbase{i}', M['stoneDark'], OX, OY, G - 0.005 + i * 0.03, w, w, 0.035, outline=0.003, bevel=0)
stump = ball('stump', M['stoneDark'], 0, 0, 0, 1.0, outline=0.004)
stump.scale = (0.05, 0.045, 0.06)
stump.location = (OX, OY, G + 0.1)

# ---------- the four basilicas reaching out in a cross ----------


def basilica(name):
    L, W = 0.55, 0.26
    for s in (-1, 1):
        for j in range(5):
            y = -0.24 - j * L / 5 - L / 10
            h = 0.12 + 0.1 * rng.random()
            box(f'{name}wall{s}{j}', M['stone'], s * W / 2, y, G - 0.005, 0.03, L / 5 + 0.002, h, outline=0.003, bevel=0)
            if h > 0.15:
                box(f'{name}win{s}{j}', M['dark'], s * (W / 2 + 0.016), y, G + 0.07, 0.006, 0.03, 0.05, outline=0, bevel=0)
        for j in range(4):
            y = -0.3 - j * 0.12
            rod(f'{name}col{s}{j}', M['stone'], (s * 0.07, y, G - 0.005), (s * 0.07, y, G + 0.05 + 0.1 * rng.random()), 0.015, segs=8, outline=0.002)


def south_front(name):
    box(f'{name}', M['stone'], 0, 0, G - 0.005, 0.3, 0.04, 0.26, outline=0.005, bevel=0)
    for j, w in enumerate((0.05, 0.07, 0.05)):
        x = -0.09 + j * 0.09
        box(f'{name}door{j}', M['dark'], x, -0.023, G - 0.005, w, 0.006, 0.11 + w * 0.4, outline=0, bevel=0)
        cyl(f'{name}doortop{j}', M['dark'], w / 2, 0.006, segs=10, outline=0, matrix=Matrix.Translation((x, -0.023, G + 0.105 + w * 0.4)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    loft(f'{name}gable', M['stone'], [[(-0.15, -0.02, G + 0.255), (0.15, -0.02, G + 0.255), (0.15, 0.02, G + 0.255), (-0.15, 0.02, G + 0.255)],
                                      [(-0.004, -0.02, G + 0.33), (0.004, -0.02, G + 0.33), (0.004, 0.02, G + 0.33), (-0.004, 0.02, G + 0.33)]], outline=0.003)


def east_apses(name):
    for j, (dx, r) in enumerate(((0.0, 0.1), (-0.12, 0.05), (0.12, 0.05))):
        lathe(f'{name}{j}', M['stone'], ((r, 0), (r, 0.2 if j == 0 else 0.14)), G - 0.005, dx, 0, segs=16, outline=0.004)
        lathe(f'{name}cap{j}', M['stoneDark'], ((r, 0), (r * 0.7, r * 0.5), (0.0, r * 0.7)), G + (0.195 if j == 0 else 0.135), dx, 0, segs=16, outline=0.003)


for k, rot in enumerate((0.0, math.pi / 2, math.pi, -math.pi / 2)):
    in_frame(f'basilica{k}', OX, OY, rot, basilica)
in_frame('southfront', OX, OY - 0.82, 0.0, south_front)
in_frame('eastapses', OX + 0.86, OY, math.pi / 2, east_apses)

for k, (x, y) in enumerate(((-0.75, -0.6), (0.7, -0.65), (-0.8, 0.7), (0.65, 0.8))):
    ball(f'olive{k}', M['olive'], x, y, G + 0.1, 0.09, outline=0.009)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

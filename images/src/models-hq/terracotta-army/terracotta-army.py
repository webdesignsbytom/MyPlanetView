# The Terracotta Army in the high-quality look (hq.py), laid out in metres: a section of Pit 1 by the
# First Emperor's tomb at Xi'an, the grey-brick floor down in the pit, the rammed-earth walls between its
# corridors and the clay warriors standing rank on rank in them facing east, the vanguard's three rows
# across the front; at the back the pit still being dug, the earth heaped and a few figures being
# freed by archaeologists; round it the visitors' walkway and its rail, and over the back two of the
# hall's steel arches.
# Sourced: the warriors, a CC BY scan of a full-size replica of a Type I general (_sources/
# terracotta-general/, its light copy), stood in every place, each a little turned and sized.
# Run: blender -b --factory-startup -P terracotta-army.py -- terracotta-army-1024.png 1024 terracotta-army.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1974)
M['clay'] = material('terracottaClay', '#8a7f72', 0.85, vary='#7c7266', vary_scale=60, bump=0.2, bump_scale=300)
M['earth'] = layered('rammedEarth', ['#b8946a', '#a9875f', '#c3a077', '#9e7d58'], scale=70.0, distortion=0.4, rough=0.95, bump=0.3, bump_scale=200)
M['earthLoose'] = material('looseEarth', '#a8875f', 0.95, vary='#987852', vary_scale=40, bump=0.5, bump_scale=200)
M['pitFloor'] = masonry('pitBricks', '#6f6a63', '#57534d', scale=180, rough=0.9, vary='#68635c')
M['walkway'] = masonry('hallWalkway', '#cdbb9c', '#ab9a7d', scale=90, rough=0.8, vary='#c4b293')
M['rail'] = material('pitRail', '#3e4448', 0.5, metallic=0.5)
M['hallSteel'] = material('hallSteel', '#8d969c', 0.45, metallic=0.5)

S = 0.056               # metres to the tile's units
FY = 0.0                # the plan's middle on the tile's
Z0 = G + 0.004
UPZ = 2.2               # the walkway round the pit, above the pit's floor


def P(x, y, z):
    return Vector((x * S, (y - FY) * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


BEFORE = set(bpy.data.objects)
# ------------------------------------------------------------------ the pit: its floor, the walkway round it, the rail
PX, PY0, PY1 = 17.4, -19.0, 19.0
slab('pitFloor', M['pitFloor'], [(-PX * S, (PY0 - FY) * S), (PX * S, (PY0 - FY) * S), (PX * S, (PY1 - FY) * S), (-PX * S, (PY1 - FY) * S)], Z0 - 0.003, Z0, margin=0.02)
for name, (x0, x1, y0, y1) in (('south', (-40.0, 40.0, -40.0, PY0)), ('north', (-40.0, 40.0, PY1, 40.0)), ('west', (-40.0, -PX, PY0, PY1)), ('east', (PX, 40.0, PY0, PY1))):
    pts = clip_to_plinth([(x0 * S, (y0 - FY) * S), (x1 * S, (y0 - FY) * S), (x1 * S, (y1 - FY) * S), (x0 * S, (y1 - FY) * S)], margin=0.02)
    if pts:
        slab(f'bank{name}', M['earth'], pts, Z0 - 0.003, Z0 + (UPZ - 0.3) * S, margin=0.02)
        slab(f'walk{name}', M['walkway'], pts, Z0 + (UPZ - 0.3) * S, Z0 + UPZ * S, margin=0.02)
for (xa, ya), (xb, yb) in (((-PX, PY0), (PX, PY0)), ((PX, PY0), (PX, PY1 - 4.0)), ((-PX, PY0), (-PX, PY1 - 4.0))):
    n = int(math.hypot(xb - xa, yb - ya) / 3.0)
    for k in range(n + 1):
        x, y = xa + (xb - xa) * k / n, ya + (yb - ya) * k / n
        bar(f'railPost{x:+.0f}{y:+.0f}', M['rail'], P(x, y, UPZ), P(x, y, UPZ + 1.1), 0.12 * S)
    tube(f'rail{xa:+.0f}{ya:+.0f}{xb:+.0f}', M['rail'], [P(xa, ya, UPZ + 1.1), P(xb, yb, UPZ + 1.1)], 0.07 * S)

# ------------------------------------------------------------------ the corridors' earth walls, and the dig at the back
NC = 7
WALL = 1.9
CW = (2 * PX - (NC - 1) * WALL) / NC
VAN = PY0 + 5.4         # the vanguard's strip across the front, then the corridors
DIG = 9.0               # the dig at the back begins here
for k in range(NC - 1):
    x0 = -PX + CW * (k + 1) + WALL * k
    block(f'earthWall{k}', M['earth'], x0, x0 + WALL, VAN, PY1, -0.3, 2.6, bevel=0.003)
MOUNDS = []
for k in range(26):
    x, y = rng.uniform(-PX + 2.0, PX - 2.0), rng.uniform(DIG + 3.0, PY1 - 1.0)
    MOUNDS.append((P(x, y, 0.3).to_tuple(), rng.uniform(1.0, 1.8) * S, 0.5))
blob_cloud('mounds', M['earthLoose'], MOUNDS)

# ------------------------------------------------------------------ the warriors: the scan, cut light, stood in rank in every corridor
src = import_model('terracotta-general', 'warriorSource')
warrior = None
if src is not None:                     # the scan's light copy (terracotta-general-light.glb, read first)
    stand_sourced(src, cut=0.02, turn=0.0, height=1.9 * S, z=0.0, mat=M['clay'], report=True)
    warrior = src.data
    bpy.data.objects.remove(src, do_unlink=True)


def stand(name, x, y, z=0.0):
    if warrior is None:
        return
    ob = bpy.data.objects.new(name, warrior)
    bpy.context.scene.collection.objects.link(ob)
    ob.matrix_world = Matrix.Translation(P(x, y, z)) @ Matrix.Rotation(math.radians(180.0 + rng.uniform(-6.0, 6.0)), 4, 'Z') @ Matrix.Scale(rng.uniform(0.96, 1.04), 4)


n = 0
for row in range(3):
    y = PY0 + 1.6 + 1.6 * row
    for k in range(int(2 * PX / 1.25)):
        stand(f'vanguard{n}', -PX + 0.9 + 1.25 * k, y)
        n += 1
for c in range(NC):
    xc = -PX + CW * c + WALL * c + CW / 2
    y = VAN + 1.0
    while y < PY1 - 1.0:
        for u in (-0.7, 0.7):
            if y < DIG or rng.random() < 0.22:
                stand(f'warrior{n}', xc + u, y)
                n += 1
        y += 1.45
print('WARRIORS', n)
for k, (x, y, shirt) in enumerate(((-9.0, 13.0, 'yellow'), (4.0, 16.0, 'yellow'), (11.0, 12.0, 'blue'))):
    c = P(x, y, 0)
    person(f'digger{k}', c.x, c.y, rng.random() * 6, shirt, z=Z0, scale=0.55)
for k, (x, y, shirt) in enumerate(((-10.0, -21.0, 'red'), (-4.0, -21.5, 'blue'), (4.0, -21.0, 'green'), (10.0, -21.6, 'yellow'), (19.6, -6.0, 'red'), (-19.6, 4.0, 'blue'))):
    c = P(x, y, UPZ)
    person(f'visitor{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.55)

# ------------------------------------------------------------------ the hall: two of its steel arches over the back of the pit, purlins between
ARCH = []
for y in (4.0, 13.0):
    pts = [P(-19.0 + 38.0 * j / 30, y, UPZ + 13.0 * math.sin(math.pi * j / 30) ** 0.7) for j in range(31)]
    tube(f'hallArch{y:.0f}', M['hallSteel'], pts, 0.35 * S)
    for x in (-19.0, 19.0):
        block(f'archFoot{x:+.0f}{y:.0f}', M['hallSteel'], x - 0.6, x + 0.6, y - 0.6, y + 0.6, UPZ, UPZ + 0.8, bevel=0)
    ARCH.append(pts)
for j in range(2, 30, 4):
    tube(f'purlin{j}', M['hallSteel'], [ARCH[0][j], ARCH[1][j]], 0.18 * S)

R = Matrix.Rotation(math.radians(-32.0 + 4.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('terracotta-army')

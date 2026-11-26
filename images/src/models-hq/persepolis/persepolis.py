# Persepolis in the high-quality look (hq.py), laid out in metres (its terrace drawn smaller, to fit): the
# ruins of the Achaemenid capital on its great stone terrace at the foot of the Mountain of Mercy; the
# double stairway climbing to it; the Gate of All Nations with the winged bulls on its jambs and its tall
# columns; the Apadana on its platform, a few of its slender fluted columns still standing among the
# bases of the rest, its stairway's carved panels; the stone door frames of Darius's palace standing
# alone; the plain before it, and people.
# Sourced: the winged bulls, a CC BY sculpted reconstruction of the gate's own (_sources/persepolis-lamassu/).
# Run: blender -b --factory-startup -P persepolis.py -- persepolis-1024.png 1024 persepolis.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(518)
M['stoneP'] = material('persepolisStone', '#ddd1b8', 0.85, vary='#cfc2a8', vary_scale=24, bump=0.25, bump_scale=200)
M['stonePDark'] = material('persepolisStoneDark', '#968a74', 0.9, vary='#877b66', vary_scale=24, bump=0.25, bump_scale=200)
M['terrace'] = masonry('persepolisTerrace', '#9f917b', '#7f7360', scale=70, rough=0.9, vary='#968872')
M['relief'] = material('apadanaRelief', '#a99b83', 0.85, vary='#8c7f69', vary_scale=180, bump=0.6, bump_scale=260)
M['plainP'] = material('marvdashtPlain', '#c6b48c', 0.95, vary='#b9a77f', vary_scale=10, bump=0.3, bump_scale=200)
M['mountainP'] = material('kuhRahmat', '#9c8a70', 0.9, vary='#8b7a61', vary_scale=14, bump=0.4, bump_scale=120)

S = 0.0215              # metres to the tile's units
Z0 = G
TZ = 12.0               # the terrace's top
TY = -30.0              # the terrace's front edge


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    return 40.0 * smooth((y - 50.0) / 30.0) * (0.85 + 0.15 * math.sin(x / 17.0))


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.16)
    return ground(x / S, y / S) * S * rim


land = terrain('plain', H, [M['plainP'], M['mountainP']], lambda z, nz, x, y: 0 if z < 4.0 * S else 1, rings=140, segs=360)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def column(name, x, y, z0, h, standing=True):
    """A slender fluted column on its bell base (or only its base, where it has fallen)."""
    lathe(name + 'Base', M['stoneP'], [(1.6 * S, 0.0), (1.6 * S, 0.4 * S), (1.2 * S, 1.2 * S), (0.95 * S, 1.6 * S)], P(x, y, z0), segs=16)
    if standing:
        cylinder(name + 'Shaft', M['stoneP'], 0.85 * S, (h - 3.0) * S, P(x, y, z0 + 1.6), segs=24, r2=0.75 * S)
        box(name + 'Capital', M['stonePDark'], P(x, y, z0 + h - 0.6), (2.2 * S, 1.4 * S, 1.6 * S), bevel=0)
    else:
        cylinder(name + 'Stump', M['stoneP'], 0.85 * S, rng.uniform(0.5, 2.4) * S, P(x, y, z0 + 1.6), segs=24)


# ------------------------------------------------------------------ the terrace, its double stairway
slab('terrace', M['terrace'], [(-2.0, TY * S), (2.0, TY * S), (2.0, 52.0 * S), (-2.0, 52.0 * S)], Z0 - 0.003, Z0 + TZ * S, margin=0.03)
for s in (-1, 1):
    for j in range(24):
        z1 = TZ * (j + 1) / 24
        box(f'stair{s}{j}', M['stoneP'], P(s * 14.0, TY - 22.0 + j * 0.9, z1 / 2), (10.0 * S, 0.9 * S, z1 * S), bevel=0)
    box(f'stairWall{s}', M['stonePDark'], P(s * 19.5, TY - 11.0, TZ / 2 + 0.5), (1.0 * S, 22.0 * S, (TZ + 1.0) * S), bevel=0)
    box(f'stairWallIn{s}', M['stonePDark'], P(s * 8.5, TY - 11.0, TZ / 2 + 0.5), (1.0 * S, 22.0 * S, (TZ + 1.0) * S), bevel=0)

# ------------------------------------------------------------------ the Gate of All Nations: the jambs with their winged bulls, its columns
GY = TY + 20.0
src = import_model('persepolis-lamassu', 'lamassuSource')
if src is not None:
    stand_sourced(src, cut=0.0, turn=-90.0, height=11.0 * S, z=0.0, mat=M['stoneP'], report=False)
    lam = src.data
    bpy.data.objects.remove(src, do_unlink=True)
    for gy in (GY - 11.0, GY + 11.0):
        for s in (-1, 1):
            ob = bpy.data.objects.new(f'lamassu{s}{gy:+.0f}', lam)
            bpy.context.scene.collection.objects.link(ob)
            ob.matrix_world = Matrix.Translation(P(s * 4.6, gy, TZ)) @ Matrix.Diagonal((-s, 1.0, 1.0, 1.0))
            box(f'gateWall{s}{gy:+.0f}', M['stonePDark'], P(s * 8.5, gy, TZ + 4.0), (4.0 * S, 9.0 * S, 8.0 * S), bevel=0)
for k, (x, y, standing) in enumerate(((-6.0, GY - 5.0, True), (6.0, GY - 5.0, True), (-6.0, GY + 5.0, False), (6.0, GY + 5.0, True))):
    column(f'gateCol{k}', x, y, TZ, 16.5, standing)

# ------------------------------------------------------------------ the Apadana: its platform, its stairway's carved panels, its columns
AX, AY = 22.0, 20.0
box('apadanaPlatform', M['terrace'], P(AX, AY, TZ + 1.5), (40.0 * S, 40.0 * S, 3.0 * S), bevel=0)
box('apadanaRelief', M['relief'], P(AX - 20.05, AY, TZ + 1.5), (0.2 * S, 28.0 * S, 2.6 * S), bevel=0)
for j in range(5):
    box(f'apadanaStair{j}', M['stoneP'], P(AX - 22.0 + j * 0.6, AY, TZ + 0.3 + j * 0.6), (1.2 * S, 10.0 * S, 0.6 * S), bevel=0)
STANDING = {(0, 1), (1, 1), (2, 1), (3, 1), (1, 3), (4, 0), (0, 4), (3, 4), (2, 4), (4, 3), (1, 0), (3, 2)}
for i in range(5):
    for j in range(5):
        x, y = AX - 15.0 + 7.5 * i, AY - 15.0 + 7.5 * j
        if math.hypot(x, y) * S > 1.38:
            continue
        column(f'apadanaCol{i}{j}', x, y, TZ + 3.0, 19.0, (i, j) in STANDING)

# ------------------------------------------------------------------ the Tachara's door and window frames standing alone
DX, DY = -27.0, 20.0
box('tacharaPlatform', M['terrace'], P(DX, DY, TZ + 1.0), (28.0 * S, 30.0 * S, 2.0 * S), bevel=0)
for k, (x, y, w, h) in enumerate(((DX - 8.0, DY - 13.0, 3.4, 6.0), (DX, DY - 13.0, 3.4, 6.0), (DX + 8.0, DY - 13.0, 3.4, 6.0),
                                   (DX - 11.0, DY - 3.0, 2.6, 4.2), (DX - 11.0, DY + 6.0, 2.6, 4.2), (DX + 4.0, DY + 2.0, 3.0, 5.6))):
    for s in (-1, 1):
        box(f'frameJamb{k}{s}', M['stonePDark'], P(x + s * (w / 2 + 0.5), y, TZ + 2.0 + h / 2), (1.0 * S, 1.2 * S, h * S), bevel=0)
    box(f'frameLintel{k}', M['stonePDark'], P(x, y, TZ + 2.0 + h + 0.5), ((w + 2.4) * S, 1.4 * S, 1.0 * S), bevel=0)
    box(f'frameCornice{k}', M['stonePDark'], P(x, y - 0.2, TZ + 2.0 + h + 1.3), ((w + 3.0) * S, 1.8 * S, 0.6 * S), bevel=0)
for k, (x, y, z, shirt) in enumerate(((-4.0, TY - 26.0, 0.0, 'red'), (4.0, TY - 28.0, 0.0, 'blue'), (0.0, GY - 16.0, TZ, 'yellow'), (12.0, GY + 4.0, TZ, 'green'), (6.0, AY - 22.0, TZ, 'red'))):
    c = P(x, y, z)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.5)

R = Matrix.Rotation(math.radians(-32.0 + 16.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('persepolis')

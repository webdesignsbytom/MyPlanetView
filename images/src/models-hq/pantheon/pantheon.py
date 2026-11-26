# The Pantheon in the high-quality look (hq.py), alone on its paving: Rome's ancient temple drawn big,
# to its real proportions (laid out in metres): the deep portico of sixteen columns, the front eight of
# grey granite and the eight behind of pink, on moulded bases under white marble Corinthian capitals
# with their acanthus leaves and volutes; the entablature with M·AGRIPPA·L·F·COS·TERTIVM·FECIT in bronze
# letters, the pediment and its raking cornices, the lead roof; the steps; the great bronze doors
# between their niches; the intermediate block with its second pediment; the brick rotunda behind,
# its three cornices and blind relieving arches; the steps round the dome's foot, the lead dome and
# its open oculus; and people.
# Run: blender -b --factory-startup -P pantheon.py -- pantheon-1024.png 1024 pantheon.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(125)
M['romanBrick'] = banded(material('romanBrick', '#b98a68', 0.8, vary='#a87a59', vary_scale=24, bump=0.3, bump_scale=200), 'Z', 60.0, strength=0.25)   # brick courses
M['brickDeep'] = material('brickDeep', '#9c6f52', 0.85, vary='#8e6448', vary_scale=24, bump=0.3, bump_scale=200)
M['marbleP'] = material('marbleP', '#ebe4d4', 0.5, vary='#dcd2be', vary_scale=18, bump=0.1, bump_scale=150)
M['marbleShade'] = material('marbleShadeP', '#cfc5b0', 0.55, vary='#c1b69f', vary_scale=18, bump=0.1, bump_scale=150)
M['greyGranite'] = material('greyGranite', '#8d8a86', 0.45, vary='#7b7874', vary_scale=60, bump=0.12, bump_scale=300)
M['pinkGranite'] = material('pinkGranite', '#b78c80', 0.45, vary='#a57b70', vary_scale=60, bump=0.12, bump_scale=300)
M['domeLead'] = material('domeLead', '#a9aba9', 0.5, vary='#9a9c9a', vary_scale=14, bump=0.08, bump_scale=200, metallic=0.25)
M['domeSteps'] = material('domeSteps', '#cdc9c0', 0.6, vary='#bfbab0', vary_scale=14, bump=0.12, bump_scale=200)
M['portRoof'] = banded(material('portRoof', '#b2b4b2', 0.45, vary='#a3a5a3', vary_scale=10, metallic=0.25), 'Y', 14.0)
M['bronzeDoor'] = material('bronzeDoor', '#6b4f2c', 0.35, vary='#57401f', vary_scale=30, metallic=0.9)

S = 0.031                    # metres to the tile's units
ZP = G + 0.006               # the paving's top
YR = 12.75                   # the rotunda's centre (metres along y; the portico faces -y)


def P(x, y, z=0.0):
    """A point given in metres, on the tile."""
    return Vector((x * S, y * S, ZP + z * S))


def mm(x, y, z=0.0):
    return Matrix.Translation(P(x, y, z))


def D(*v):
    """A size in metres, on the tile."""
    return Matrix.Diagonal((*[a * S for a in v], 1))


# ------------------------------------------------------------------ the paving
M['sampietrini'] = masonry('sampietrini', '#8e8880', '#625d57', scale=120, rough=0.85, vary='#827c74')
slab('paving', M['sampietrini'], [(-2, -2), (2, -2), (2, 2), (-2, 2)], G - 0.004, ZP, margin=0.05)

# ------------------------------------------------------------------ the rotunda, its cornices and blind arches
RO = 28.0
cylinder('rotunda', M['romanBrick'], RO * S, 30.0 * S, P(0, YR, -0.2), segs=120)
lathe('rotundaFoot', M['marbleShade'], [(RO * S + 0.006, 0), (RO * S + 0.006, 0.9 * S), (RO * S + 0.002, 1.1 * S)], P(0, YR, -0.2), segs=120)
for z, h, out in ((9.5, 0.7, 0.35), (20.0, 1.0, 0.5), (29.2, 1.4, 0.8)):
    lathe(f'rotundaCornice{z}', M['marbleP'], [(RO * S, 0), ((RO + out * 0.5) * S, h * 0.3 * S), ((RO + out) * S, h * 0.7 * S), ((RO + out) * S, h * S), (RO * S, h * S)], P(0, YR, z), segs=120)
ARCH = []
for k in range(34):
    a = math.radians(-90 + 360 * (k + 0.5) / 34)
    if -132 < math.degrees(a) < -48:          # where the intermediate block stands
        continue
    for z0, hh in ((11.0, 7.0), (21.6, 6.0)):
        ARCH.append((RO * S * math.cos(a), YR * S + RO * S * math.sin(a), ZP + z0 * S, 3.6 * S, hh * S, (math.cos(a), math.sin(a)), 'round'))
windows('relievingArches', M['brickDeep'], ARCH, depth=0.5 * S)

# ------------------------------------------------------------------ the steps round the dome, the dome and its oculus
for i in range(7):
    r = (RO - 0.4 - 1.0 * i) * S
    cylinder(f'domeStep{i}', M['domeSteps'], r, 1.15 * S, P(0, YR, 30.6 + 1.1 * i - 0.05), segs=120)
prof = []
for j in range(17):
    t = math.radians(77.0 * j / 16)
    prof.append((21.0 * math.cos(t) * S, (6.0 * math.sin(t)) * S))
lathe('dome', M['domeLead'], prof + [(4.4 * S, prof[-1][1] - 0.2 * S)], P(0, YR, 38.25), segs=128, smooth=True)   # a hair above the top step
ZO = 38.25 + prof[-1][1] / S
annulus('oculusLip', M['marbleP'], 4.9 * S, 4.35 * S, ZP + (ZO - 0.6) * S, ZP + (ZO + 0.35) * S, segs=48, center=(0, YR * S))
cylinder('oculusDark', M['shadow'], 4.36 * S, 0.06 * S, P(0, YR, ZO - 0.18), segs=48)   # the open oculus, on the dome's closed top

# ------------------------------------------------------------------ the intermediate block and its second pediment
YB0, YB1 = YR - 34.0, YR - 20.0          # its front and back (the back inside the rotunda)
box('block', M['romanBrick'], P(0, (YB0 + YB1) / 2, 15.0), (35.0 * S, (YB1 - YB0) * S, 30.4 * S), bevel=0.002)
for z, h, out in ((9.5, 0.7, 0.35), (20.0, 1.0, 0.5), (29.2, 1.4, 0.8)):
    box(f'blockCornice{z}', M['marbleP'], P(0, (YB0 + YB1) / 2 - out / 2, z + h / 2), ((35.0 + 2 * out) * S, (YB1 - YB0 + out) * S, h * S), bevel=0.001)
bm = bmesh.new()
tri = [(-17.5, 30.6), (17.5, 30.6), (0.0, 37.6)]
add_prism(bm, [bm.verts.new(P(x, YB0 + 0.1, z)) for x, z in tri], [bm.verts.new(P(x, YR - 6.0, z)) for x, z in tri])
for f in bm.faces:
    f.material_index = 0 if abs(f.normal.y) > 0.9 else 1
multi('blockPediment', bm, [M['romanBrick'], M['portRoof']], smooth=False)
for s_ in (-1, 1):
    bar(f'blockRake{s_}', M['marbleP'], P(s_ * 18.3, YB0 - 0.3, 30.3), P(0, YB0 - 0.3, 38.2), 0.9 * S)

# ------------------------------------------------------------------ the portico: floor, steps, columns, entablature, pediment, roof
YF = YR - 50.3                           # the front of the portico (the front columns' faces)
box('podium', M['marbleShade'], P(0, (YF + YB0) / 2, 0.65), (35.2 * S, (YB0 - YF + 0.6) * S, 1.5 * S), bevel=0.002)
for j in range(4):                       # four steps down from the podium, 0.26 m each
    top = 1.3 - 0.26 * (j + 1)
    box(f'step{j}', M['marbleP'], P(0, YF - 0.3 - 0.6 * (j + 0.5), (top - 0.1) / 2), (33.0 * S, 0.6 * S, (top + 0.1) * S), bevel=0.001)
SHAFT_G, SHAFT_P, WHITE = bmesh.new(), bmesh.new(), bmesh.new()
COLX = [-15.3 + 4.371 * k for k in range(8)]
ROWS = [(YF + 0.8, COLX, SHAFT_G), (YF + 5.4, [COLX[0], COLX[2], COLX[5], COLX[7]], SHAFT_P), (YF + 10.0, [COLX[0], COLX[2], COLX[5], COLX[7]], SHAFT_P)]
Z0 = 1.3                                 # the podium's top
SH = [(0.74, 0.0), (0.76, 0.25), (0.74, 0.5), (0.73, 3.0), (0.71, 6.0), (0.67, 9.0), (0.63, 11.4), (0.7, 11.5), (0.7, 11.7), (0.63, 11.8)]
BASE = [(0.95, 0.0), (0.95, 0.35), (0.9, 0.42), (0.92, 0.5), (0.8, 0.58), (0.76, 0.64), (0.85, 0.7), (0.82, 0.76), (0.75, 0.8)]


def lathe_into(bm, profile, m, segs=20):
    rings = [[bm.verts.new(m @ Vector((r * math.cos(2 * math.pi * k / segs), r * math.sin(2 * math.pi * k / segs), z))) for k in range(segs)] for r, z in profile]
    for a, b in zip(rings, rings[1:]):
        for k in range(segs):
            bm.faces.new((a[k], a[(k + 1) % segs], b[(k + 1) % segs], b[k]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])


for y, xs, shaft in ROWS:
    for x in xs:
        base = mm(x, y, Z0) @ Matrix.Scale(S, 4)
        bmesh.ops.create_cube(WHITE, size=1.0, matrix=mm(x, y, Z0 + 0.175) @ D(1.95, 1.95, 0.35))
        lathe_into(WHITE, BASE[1:], base)
        lathe_into(shaft, SH, mm(x, y, Z0 + 0.8) @ Matrix.Scale(S, 4))
        # the Corinthian capital: the bell, two rings of acanthus leaves, the volutes and the abacus
        zc = Z0 + 0.8 + 11.8
        lathe_into(WHITE, [(0.64, 0.0), (0.68, 0.6), (0.78, 1.3), (0.86, 1.62)], mm(x, y, zc) @ Matrix.Scale(S, 4), segs=16)
        for ring, (zl, rl, n0) in enumerate(((0.42, 0.66, 0.0), (0.95, 0.74, 0.5))):
            for k in range(8):
                a = 2 * math.pi * (k + n0) / 8
                m = mm(x + rl * math.cos(a), y + rl * math.sin(a), zc + zl) @ Matrix.Rotation(a, 4, 'Z') @ Matrix.Rotation(math.radians(22), 4, 'Y') @ D(0.22, 0.34, 0.62)
                bmesh.ops.create_icosphere(WHITE, subdivisions=1, radius=1.0, matrix=m)
        for k in range(4):
            a = math.pi / 4 + k * math.pi / 2
            bmesh.ops.create_icosphere(WHITE, subdivisions=2, radius=1.0, matrix=mm(x + 0.98 * math.cos(a), y + 0.98 * math.sin(a), zc + 1.55) @ D(0.26, 0.26, 0.26))
        bmesh.ops.create_cube(WHITE, size=1.0, matrix=mm(x, y, zc + 1.82) @ Matrix.Rotation(0, 4, 'Z') @ D(2.15, 2.15, 0.38))
finish('shaftsGrey', SHAFT_G, M['greyGranite'], smooth_all=True)
finish('shaftsPink', SHAFT_P, M['pinkGranite'], smooth_all=True)
finish('basesAndCapitals', WHITE, M['marbleP'], smooth_sides=False)
ZE = Z0 + 0.8 + 11.8 + 2.0               # the top of the capitals
YE0, YE1 = YF - 0.25, YB0 + 0.2         # the entablature's front and back
box('architrave', M['marbleP'], P(0, (YE0 + YE1) / 2, ZE + 0.65), (34.0 * S, (YE1 - YE0) * S, 1.3 * S), bevel=0.0015)
box('frieze', M['marbleP'], P(0, (YE0 + YE1) / 2 + 0.15, ZE + 1.95), (33.7 * S, (YE1 - YE0 - 0.3) * S, 1.3 * S), bevel=0.001)
box('cornice', M['marbleP'], P(0, (YE0 + YE1) / 2 - 0.35, ZE + 3.0), (35.2 * S, (YE1 - YE0 + 0.7) * S, 0.8 * S), bevel=0.0015)
# the inscription, in bronze letters across the frieze
cu = bpy.data.curves.new('inscription', 'FONT')
cu.body = 'M·AGRIPPA·L·F·COS·TERTIVM·FECIT'
cu.align_x, cu.align_y = 'CENTER', 'CENTER'
cu.size = 1.0
cu.extrude = 0.02
letters = bpy.data.objects.new('inscription', cu)
bpy.context.scene.collection.objects.link(letters)
letters.data.materials.append(M['bronze'])
bpy.context.view_layer.update()
k_ = 26.0 * S / letters.dimensions.x
letters.scale = (k_, k_, k_)
letters.rotation_euler = (math.pi / 2, 0, 0)
letters.location = P(0, YE0 + 0.28, ZE + 1.95)   # on the frieze's face (it stands 0.3 m back)
# the pediment: its recessed tympanum, raking cornices and the lead-covered roof behind
ZR = ZE + 3.4
bm = bmesh.new()
tri = [(-17.2, ZR), (17.2, ZR), (0.0, ZR + 6.8)]
add_prism(bm, [bm.verts.new(P(x, YE0 + 0.5, z)) for x, z in tri], [bm.verts.new(P(x, YB0 + 0.1, z)) for x, z in tri])
for f in bm.faces:
    f.material_index = 0 if abs(f.normal.y) > 0.9 else 1
multi('portico', bm, [M['marbleShade'], M['portRoof']], smooth=False)
for s_ in (-1, 1):
    a0, a1 = P(s_ * 17.9, YE0 - 0.1, ZR - 0.3), P(0, YE0 - 0.1, ZR + 7.4)
    bar(f'rake{s_}', M['marbleP'], a0, a1, 1.0 * S)
box('ridge', M['portRoof'], P(0, (YE0 + YB0) / 2 + 0.25, ZR + 6.85), (0.5 * S, (YB0 - YE0 - 0.4) * S, 0.3 * S), bevel=0)
# the bronze doors between their marble frame, and the niches either side
box('doorFrame', M['marbleP'], P(0, YB0 - 0.12, Z0 + 6.6), (9.6 * S, 0.3 * S, 13.2 * S), bevel=0.001)
box('doors', M['bronzeDoor'], P(0, YB0 - 0.3, Z0 + 6.0), (7.6 * S, 0.2 * S, 11.8 * S), bevel=0.001)
box('doorsMid', M['bronze'], P(0, YB0 - 0.42, Z0 + 6.0), (0.2 * S, 0.06 * S, 11.6 * S), bevel=0)
windows('niches', M['marbleShade'], [(s_ * 10.9 * S, YB0 * S, ZP + (Z0 + 1.5) * S, 4.4 * S, 9.0 * S, (0, -1), 'round') for s_ in (-1, 1)], depth=0.5 * S)

# ------------------------------------------------------------------ people
for k, (x, y, shirt) in enumerate(((-0.35, -1.27, 'red'), (0.1, -1.3, 'blue'), (0.42, -1.25, 'yellow'), (-0.65, -1.05, 'green'), (0.75, -1.0, 'red'),
                                     (-0.05, -1.12, 'green'), (0.25, -1.13, 'blue'), (-0.95, -0.4, 'yellow'), (1.0, 0.1, 'blue'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=ZP)

render('pantheon')

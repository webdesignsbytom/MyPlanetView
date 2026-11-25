# Petra (Al-Khazneh, the Treasury) in the high-quality look (hq.py): a square of rose sand at the end
# of the Siq, its cliffs of sandstone in soft layers of rose, orange and cream rising on three sides,
# and the Treasury's face carved into the cliff: the steps, six Corinthian columns with the doorway
# and the reliefs between them, the entablature and the pediment over the middle four; above, the
# round tholos with its cone and urn between two pavilions crowned with halves of a broken pediment;
# camels and visitors in front. Turned to face the camera.
# Run: blender -b --factory-startup -P petra.py -- petra-1024.png 1024 petra.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='sand')
rng = random.Random(100)
M['strata'] = layered('strata', ['#c96a4c', '#e09a72', '#a9503a', '#e8b98e', '#c2603f', '#d98a62'], scale=2.6, distortion=7.0, bump=0.7, bump_scale=18, detail=6.0)
M['petra'] = material('petraFace', '#d99278', 0.75, vary='#c98068', vary_scale=18, bump=0.25, bump_scale=120)
M['petraShade'] = material('petraShade', '#b8735c', 0.8, vary='#a8664f', vary_scale=18, bump=0.25, bump_scale=120)
M['roseSand'] = material('roseSand', '#e2b48f', 0.9, vary='#d6a47e', vary_scale=4, bump=0.2, bump_scale=300)
M['camel'] = material('camel', '#b8875a', 0.8, vary='#a87a50', vary_scale=20)
M['saddle'] = material('saddle', '#b33a2e', 0.7)
before = set(bpy.data.objects)


def smooth(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def H(x, y):
    r = math.hypot(x, y)
    taper = max(0.0, 1 - (r / 1.49) ** 8)
    side = smooth(0.62, 0.72, abs(x))
    face = 0.1 * (1 - side) - 0.14 * side
    back = 1.5 * smooth(face - 0.03, face + 0.03, y) * (1 + (0.1 * math.sin(4 * x + 1) * math.sin(3 * y + 0.5) + 0.05 * math.sin(11 * x) + 0.04 * math.cos(13 * y)) * smooth(0.25, 0.5, y))
    siq = 1.05 * smooth(0.78, 0.9, abs(x)) * smooth(-1.25, -0.2, y)
    h = max(back, siq * (1 + 0.08 * math.sin(9 * y + x)))
    return h * taper


terrain('cliffs', H, [M['roseSand'], M['strata']], lambda z, nz, x, y: 1 if z > 0.02 else 0, rings=90, segs=280)

# ------------------------------------------------------------------ the Treasury's face
face_from = set(bpy.data.objects)
FY = 0.02          # the columns' front
box('steps', M['petra'], (0, FY + 0.02, G + 0.02), (0.9, 0.12, 0.04), bevel=0.003)
box('backWall', M['petra'], (0, 0.09, G + 0.65), (0.9, 0.04, 1.26), bevel=0.003)
for x in (-0.36, -0.22, -0.07, 0.07, 0.22, 0.36):
    column(f'col{x}', M['petra'], x, FY + 0.03, G + 0.04, 0.44, 0.026, cap_mat=M['petra'])
    lathe(f'capital{x}', M['petra'], [(0.024, 0), (0.034, 0.02), (0.042, 0.04)], (x, FY + 0.03, G + 0.45), segs=16)
OPEN = [(0, 0.068, G + 0.04, 0.1, 0.27, (0, -1), 'rect')]
windows('doorway', M['shadow'], OPEN, depth=0.01)
windows('reliefs', M['petraShade'], [(x, 0.068, G + 0.12, 0.09, 0.26, (0, -1), 'rect') for x in (-0.29, 0.29)], depth=0.008)
box('entablature', M['petra'], (0, FY + 0.03, G + 0.51), (0.9, 0.09, 0.06), bevel=0.003)
bm = bmesh.new()
tri = [(-0.3, 0), (0.3, 0), (0.0, 0.12)]
add_prism(bm, [bm.verts.new((u, FY - 0.01, G + 0.54 + z)) for u, z in tri], [bm.verts.new((u, FY + 0.07, G + 0.54 + z)) for u, z in tri])
finish('pediment', bm, M['petra'], bevel=0.002, smooth_sides=False)
box('attic', M['petra'], (0, FY + 0.04, G + 0.69), (0.9, 0.08, 0.05), bevel=0.003)
# the upper order: the tholos between two pavilions with halves of a broken pediment
UZ = G + 0.715
cylinder('tholos', M['petra'], 0.1, 0.3, (0, FY + 0.03, UZ), segs=40)
for k in range(9):
    a = math.radians(200 + k * 17.5)
    column(f'tholosCol{k}', M['petra'], 0.115 * math.cos(a), FY + 0.03 + 0.115 * math.sin(a), UZ, 0.29, 0.012, cap_mat=M['petra'])
lathe('tholosRing', M['petra'], [(0.13, 0), (0.13, 0.03)], (0, FY + 0.03, UZ + 0.29), segs=40)
lathe('tholosRoof', M['petra'], [(0.125, 0), (0.07, 0.07), (0.02, 0.11)], (0, FY + 0.03, UZ + 0.32), segs=40, smooth=True)
lathe('urn', M['petra'], [(0.0, 0), (0.025, 0.01), (0.035, 0.04), (0.025, 0.07), (0.012, 0.08), (0.02, 0.1), (0.0, 0.11)], (0, FY + 0.03, UZ + 0.43), segs=20, smooth=True)
for s in (-1, 1):
    px = s * 0.31
    box(f'pavilion{s}', M['petra'], (px, FY + 0.06, UZ + 0.15), (0.17, 0.06, 0.3), bevel=0.003)
    for u in (-0.06, 0.06):
        column(f'pavCol{s}{u}', M['petra'], px + u, FY + 0.02, UZ, 0.29, 0.014, cap_mat=M['petra'])
    box(f'pavEntablature{s}', M['petra'], (px, FY + 0.04, UZ + 0.31), (0.19, 0.08, 0.04), bevel=0.002)
    bm = bmesh.new()
    tri = [(px - s * 0.095, 0), (px + s * 0.095, 0), (px - s * 0.095, 0.08)]
    add_prism(bm, [bm.verts.new((u, FY + 0.0, UZ + 0.33 + z)) for u, z in tri], [bm.verts.new((u, FY + 0.08, UZ + 0.33 + z)) for u, z in tri])
    finish(f'halfPediment{s}', bm, M['petra'], bevel=0.002, smooth_sides=False)
    windows(f'pavRelief{s}', M['petraShade'], [(px, FY + 0.028, UZ + 0.06, 0.06, 0.18, (0, -1), 'rect')], depth=0.006)

S = Matrix.Translation((0, 0.11, G)) @ Matrix.Scale(1.32, 4) @ Matrix.Translation((0, -0.11, -G))
for ob in bpy.data.objects:
    if ob not in face_from:
        ob.matrix_world = S @ ob.matrix_world

# ------------------------------------------------------------------ camels and visitors
def camel(name, x, y, rot, rider=None):
    m = Matrix.Translation((x, y, G)) @ Matrix.Rotation(rot, 4, 'Z')
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=1.0, matrix=m @ Matrix.Translation((0, 0, 0.075)) @ Matrix.Diagonal((0.06, 0.025, 0.025, 1)))
    bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=1.0, matrix=m @ Matrix.Translation((0.005, 0, 0.1)) @ Matrix.Diagonal((0.025, 0.018, 0.02, 1)))
    bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=1.0, matrix=m @ Matrix.Translation((0.072, 0, 0.118)) @ Matrix.Diagonal((0.018, 0.01, 0.01, 1)))
    finish(name, bm, M['camel'], smooth_all=True)
    bar(name + 'Neck', M['camel'], m @ Vector((0.05, 0, 0.08)), m @ Vector((0.068, 0, 0.115)), 0.012)
    for lx in (-0.04, 0.04):
        for ly in (-0.012, 0.012):
            bar(f'{name}Leg{lx}{ly}', M['camel'], m @ Vector((lx, ly, 0.0)), m @ Vector((lx, ly, 0.065)), 0.007)
    box_m(name + 'Saddle', M['saddle'], m @ Matrix.Translation((0.005, 0, 0.118)), (0.04, 0.035, 0.01))
    if rider:
        cylinder(name + 'Rider', M[rider], 0.009, 0.03, (0, 0, 0), segs=10, matrix=m @ Matrix.Translation((0.005, 0, 0.122)))
        cylinder(name + 'RiderHead', M['white'], 0.007, 0.012, (0, 0, 0), segs=10, matrix=m @ Matrix.Translation((0.005, 0, 0.152)))


camel('camel1', -0.32, -0.45, math.radians(15), 'blue')
camel('camel2', 0.3, -0.62, math.radians(160))
camel('camel3', 0.42, -0.5, math.radians(175))
for k, (x, y, shirt) in enumerate(((-0.08, -0.3, 'red'), (0.05, -0.36, 'yellow'), (0.15, -0.25, 'blue'), (-0.2, -0.7, 'green'), (0.0, -0.85, 'red'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt)

# turned to face the camera
R = Matrix.Rotation(math.radians(-32), 4, 'Z')
for ob in bpy.data.objects:
    if ob not in before:
        ob.matrix_world = R @ ob.matrix_world
render('petra')

# A Leaning Tower of Pisa in the high-quality look (hq.py): the tower with its blind-arcaded ground
# storey (diamond inlays in the arches), six open galleries of 24 columns, the cornices and the
# belfry with its bells, leaning to the right and a little towards you, standing in its paved ring
# with a low marble curb; the cathedral behind it with its lead roofs, the dome on its colonnaded
# gallery, the blind arcade and marble stripes along its side and the loggias of its front; paved
# paths and a few tourists, one propping the tower up. The first of the pilot, from the Pisa
# diorama the user chose on 25 Nov 2026.
# Run: blender -b --factory-startup -P leaning-tower.py -- leaning-tower-1024.png 1024 leaning-tower.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1173)
COL = bpy.context.scene.collection


def arcade_ring(name, mat, r_out, thick, z0, height, n, arch_a, phase=0.0, matrix=None):
    """A ring of n round-arched bays (flat chords), spandrels and all, from z0 up `height`."""
    bm = bmesh.new()
    r_in = r_out - thick
    for i in range(n):
        p0 = phase + 2 * math.pi * i / n
        p1 = phase + 2 * math.pi * (i + 1) / n
        mid = (p0 + p1) / 2
        out_c = Vector((math.cos(mid), math.sin(mid), 0))
        tan = Vector((-math.sin(mid), math.cos(mid), 0))
        half_out = r_out * math.sin(math.pi / n)
        half_in = r_in * math.sin(math.pi / n)
        d_out = r_out * math.cos(math.pi / n)
        d_in = r_in * math.cos(math.pi / n)
        outline = arch_outline(half_out, arch_a, z0, height)
        front = [bm.verts.new(out_c * d_out + tan * u + Vector((0, 0, z))) for u, z in outline]
        back = [bm.verts.new(out_c * d_in + tan * (u * half_in / half_out) + Vector((0, 0, z))) for u, z in outline]
        add_prism(bm, front, back)
    if matrix is not None:
        bmesh.ops.transform(bm, matrix=matrix, verts=bm.verts)
    ob = finish(name, bm, mat, smooth_sides=False)
    return ob



# ------------------------------------------------------------------ the paths
paving_strip('pathPiazza', -1.15, -0.3, -0.06, -0.3, 0.2)
paving_strip('pathEast', 0.8, -0.93, 1.2, -0.6, 0.17)


# ------------------------------------------------------------------ the Leaning Tower
TX, TY = 0.27, -0.75
tower = bpy.data.objects.new('LeaningTower', None)
COL.objects.link(tower)
tower.location = (TX, TY, G)
tower.rotation_euler = (math.radians(1.2), math.radians(5.2), 0)
T = []  # everything in the tower, built round the origin, then parented to the leaning empty

R = 0.4           # the galleries' outer radius
CORE = 0.33       # the inner wall's radius
BASE_H = 0.42     # the ground storey
GAL_H = 0.215     # each gallery storey
N_GAL = 6

# the steps and plinth it stands on
T.append(cylinder('towerStep0', M['marbleShade'], R + 0.07, 0.02, (0, 0, -0.01), segs=96, bevel=0.004))
T.append(cylinder('towerStep1', M['marble'], R + 0.045, 0.02, (0, 0, 0.01), segs=96, bevel=0.004))
z = 0.03
MOAT = 0.55
cylinder('towerPaving', M['paving'], MOAT, 0.01, (TX, TY, G - 0.005), segs=128, bevel=0.002)
annulus('towerPavingBand', M['stripe'], MOAT - 0.02, MOAT - 0.032, G + 0.004, G + 0.0065, segs=128, matrix=Matrix.Translation((TX, TY, 0)))
for k in range(30):
    p = 2 * math.pi * k / 30
    rr = (R + 0.07 + MOAT - 0.032) / 2
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((TX + rr * math.cos(p), TY + rr * math.sin(p), G + 0.005)) @ Matrix.Rotation(p + math.pi / 4, 4, 'Z') @ Matrix.Diagonal((0.034, 0.034, 0.003, 1)))
    finish(f'towerLozenge{k}', bm, M['stripe'], smooth_sides=False)
annulus('towerCurb', M['marble'], MOAT + 0.03, MOAT, G - 0.01, G + 0.038, segs=128, bevel=0.005, matrix=Matrix.Translation((TX, TY, 0)))
# the ground storey: a solid drum ringed by a blind arcade of 15 arches on half-columns
T.append(cylinder('groundDrum', M['marble'], R - 0.012, BASE_H, (0, 0, z), segs=96))
N_BASE = 15
T.append(arcade_ring('groundArcade', M['marble'], R + 0.012, 0.024, z + BASE_H * 0.62, BASE_H * 0.38, N_BASE, R * math.sin(math.pi / N_BASE) - 0.024))
for i in range(N_BASE):
    p = 2 * math.pi * i / N_BASE
    T += column(f'groundCol{i}', M['marble'], (R + 0.0) * math.cos(p), (R + 0.0) * math.sin(p), z, BASE_H * 0.62, 0.017)
# blind arches' darker recess and the door
for i in range(N_BASE):
    p = 2 * math.pi * (i + 0.5) / N_BASE
    ob = box(f'groundRecess{i}', M['marbleShade'], ((R - 0.006) * math.cos(p), (R - 0.006) * math.sin(p), z + BASE_H * 0.4), (0.012, 0.09, BASE_H * 0.8), rot_z=p, bevel=0)
    T.append(ob)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((R * math.cos(p), R * math.sin(p), z + BASE_H * 0.7)) @ Matrix.Rotation(p, 4, 'Z') @ Matrix.Rotation(math.pi / 4, 4, 'X') @ Matrix.Diagonal((0.006, 0.034, 0.034, 1)))
    T.append(finish(f'groundLozenge{i}', bm, M['stripe'], smooth_sides=False))
door_p = 2 * math.pi * 11.5 / N_BASE   # the blind arch facing the camera
dpos = Vector(((R + 0.002) * math.cos(door_p), (R + 0.002) * math.sin(door_p), 0))
T.append(box('towerDoor', M['door'], (dpos.x, dpos.y, z + 0.09), (0.016, 0.07, 0.18), rot_z=door_p, bevel=0.002))
T.append(cylinder('towerDoorArch', M['door'], 0.035, 0.016, (0, 0, 0), segs=16, matrix=Matrix.Translation((dpos.x, dpos.y, z + 0.18)) @ Matrix.Rotation(door_p, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'Y') @ Matrix.Translation((0, 0, -0.008))))
z += BASE_H
T.append(annulus('groundCornice', M['marble'], R + 0.03, CORE - 0.01, z, z + 0.028, segs=96, bevel=0.006))
z += 0.028

# the six open galleries
N_COLS = 24
for g in range(N_GAL):
    gz = z
    col_h = GAL_H * 0.6
    T.append(cylinder(f'galCore{g}', M['marbleShade'], CORE, GAL_H, (0, 0, gz), segs=96))
    # small doors in the inner wall, seen between the columns
    for k in range(6):
        p = 2 * math.pi * (k + 0.25 * g) / 6
        T.append(box(f'galDoor{g}{k}', M['shadow'], ((CORE + 0.002) * math.cos(p), (CORE + 0.002) * math.sin(p), gz + col_h * 0.45), (0.006, 0.04, col_h * 0.7), rot_z=p, bevel=0))
    for i in range(N_COLS):
        p = 2 * math.pi * i / N_COLS
        T += column(f'galCol{g}_{i}', M['marble'], (R - 0.016) * math.cos(p), (R - 0.016) * math.sin(p), gz, col_h, 0.0125)
    arch_a = (R - 0.016) * math.sin(math.pi / N_COLS) - 0.014
    T.append(arcade_ring(f'galArcade{g}', M['marble'], R, 0.032, gz + col_h, GAL_H - col_h, N_COLS, arch_a))
    z += GAL_H
    T.append(annulus(f'galCornice{g}', M['marble'], R + 0.024, CORE - 0.01, z, z + 0.024, segs=96, bevel=0.005))
    # the floor of the next gallery, a step in from the cornice
    z += 0.024

# the belfry: a smaller drum of arches with the bells hanging inside
BR, BCORE = 0.285, 0.2
BH = 0.24
T.append(cylinder('belfryCore', M['marbleShade'], BCORE, BH, (0, 0, z), segs=64))
NB = 12
for i in range(NB):
    p = 2 * math.pi * i / NB
    T += column(f'belfryCol{i}', M['marble'], (BR - 0.014) * math.cos(p), (BR - 0.014) * math.sin(p), z, BH * 0.62, 0.014)
T.append(arcade_ring('belfryArcade', M['marble'], BR, 0.03, z + BH * 0.62, BH * 0.38, NB, (BR - 0.014) * math.sin(math.pi / NB) - 0.016))
for k, p in enumerate((-math.pi / 2 - 0.28, -math.pi / 2 + 0.78, math.pi * 0.2)):
    bx, by = (BCORE + 0.04) * math.cos(p), (BCORE + 0.04) * math.sin(p)
    T.append(lathe(f'bell{k}', M['bronze'], [(0.032, 0), (0.03, 0.006), (0.022, 0.03), (0.019, 0.05), (0.012, 0.06), (0.0, 0.062)], (bx, by, z + BH * 0.28), segs=32, smooth=True))
    T.append(cylinder(f'bellYoke{k}', M['door'], 0.004, 0.06, (bx, by, z + BH * 0.28 + 0.06), segs=8))
z += BH
T.append(cylinder('belfryCornice', M['marble'], BR + 0.02, 0.022, (0, 0, z), segs=96, bevel=0.005))
z += 0.022
# the parapet round the top
T.append(annulus('belfryParapet', M['marble'], BR + 0.012, BR - 0.012, z, z + 0.045, segs=96, bevel=0.004))
T.append(cylinder('belfryRoof', M['marbleShade'], BR - 0.012, 0.012, (0, 0, z), segs=64))
parented(T, tower)


# ------------------------------------------------------------------ the cathedral
CX, CY = -0.98, 0.58   # the facade's middle (it faces -x); the nave runs along +x
cath = []
NAVE_L, NAVE_W, NAVE_H = 1.22, 0.34, 0.5
AISLE_W, AISLE_H = 0.15, 0.33


def C(x, y, zz):
    return (CX + x, CY + y, G + zz)


# the nave and its gable roof
cath.append(box('nave', M['marble'], C(NAVE_L / 2, 0, NAVE_H / 2), (NAVE_L, NAVE_W, NAVE_H)))
for s in (-1, 1):
    cath.append(box(f'aisle{s}', M['marble'], C(NAVE_L / 2, s * (NAVE_W / 2 + AISLE_W / 2), AISLE_H / 2), (NAVE_L, AISLE_W, AISLE_H)))


def gable_roof(name, mat, x0, x1, y_half, z0, rise, over=0.025, along='x', cx=0.0, cy=0.0):
    bm = bmesh.new()
    if along == 'x':
        ring_b = [(x0 - over, -y_half - over), (x1 + over, -y_half - over), (x1 + over, y_half + over), (x0 - over, y_half + over)]
        ring_t = [(x0 - over, -0.004), (x1 + over, -0.004), (x1 + over, 0.004), (x0 - over, 0.004)]
        bottom = [bm.verts.new(C(cx + x, cy + y, z0)) for x, y in ring_b]
        top = [bm.verts.new(C(cx + x, cy + y, z0 + rise)) for x, y in ring_t]
    else:
        ring_b = [(-y_half - over, x0 - over), (y_half + over, x0 - over), (y_half + over, x1 + over), (-y_half - over, x1 + over)]
        ring_t = [(-0.004, x0 - over), (0.004, x0 - over), (0.004, x1 + over), (-0.004, x1 + over)]
        bottom = [bm.verts.new(C(cx + x, cy + y, z0)) for x, y in ring_b]
        top = [bm.verts.new(C(cx + x, cy + y, z0 + rise)) for x, y in ring_t]
    add_prism(bm, list(reversed(bottom)), list(reversed(top)))
    return finish(name, bm, mat, smooth_sides=False)


cath.append(gable_roof('naveRoof', M['leadX'], 0.02, NAVE_L, NAVE_W / 2, NAVE_H, 0.13))
for s in (-1, 1):
    bm = bmesh.new()
    yo, yi = s * (NAVE_W / 2 + AISLE_W + 0.025), s * NAVE_W / 2
    pts = [(0.0, yo, AISLE_H - 0.005), (NAVE_L + 0.02, yo, AISLE_H - 0.005), (NAVE_L + 0.02, yi, AISLE_H + 0.075), (0.0, yi, AISLE_H + 0.075)]
    v0 = [bm.verts.new(C(*p)) for p in pts]
    v1 = [bm.verts.new(C(x, y, zz + 0.018)) for x, y, zz in pts]
    add_prism(bm, v0, v1)
    cath.append(finish(f'aisleRoof{s}', bm, M['leadX'], smooth_sides=False))

# the transept, the crossing's dome and the apse
TRX, TR_W, TR_L, TR_H = 0.88, 0.3, 1.0, 0.47
cath.append(box('transept', M['marble'], C(TRX, 0, TR_H / 2), (TR_W, TR_L, TR_H)))
cath.append(gable_roof('transeptRoof', M['leadY'], -TR_L / 2, TR_L / 2, TR_W / 2, TR_H, 0.12, along='y', cx=TRX))
cath.append(lathe('apse', M['marble'], [(0.15, 0), (0.15, AISLE_H)], C(NAVE_L, 0, 0), segs=48))
cath.append(lathe('apseRoof', M['lead'], [(0.165, 0), (0.0, 0.1)], C(NAVE_L, 0, AISLE_H), segs=48))
DZ = NAVE_H + 0.12
cath.append(lathe('drum', M['marble'], [(0.15, 0), (0.15, 0.1)], C(TRX, 0, DZ - 0.04), segs=64))
for k in range(16):
    p = 2 * math.pi * k / 16
    cath.append(box(f'drumWin{k}', M['shadow'], C(TRX + 0.151 * math.cos(p), 0.151 * math.sin(p), DZ + 0.01), (0.004, 0.02, 0.04), rot_z=p, bevel=0))
cath.append(cylinder('drumCornice', M['marble'], 0.165, 0.015, C(TRX, 0, DZ + 0.06), segs=64, bevel=0.004))
GZ = DZ + 0.075   # the gallery round the dome's foot
for k in range(28):
    p = 2 * math.pi * k / 28
    cath.extend(column(f'domeGalleryCol{k}', M['marble'], *C(TRX + 0.158 * math.cos(p), 0.158 * math.sin(p), 0)[:2], G + GZ, 0.05, 0.0055))
cath.append(cylinder('domeGalleryCore', M['marbleShade'], 0.135, 0.05, C(TRX, 0, GZ), segs=64))
cath.append(cylinder('domeGalleryTop', M['marble'], 0.172, 0.012, C(TRX, 0, GZ + 0.05), segs=64, bevel=0.003))
DB = GZ + 0.062   # the dome's foot
dome_prof = [(0.15 * math.cos(t), 0.175 * math.sin(t)) for t in [k * (math.pi / 2) / 14 for k in range(15)]]
cath.append(lathe('dome', M['lead'], dome_prof, C(TRX, 0, DB), segs=64, smooth=True))
for k in range(12):
    p = 2 * math.pi * k / 12
    pts = [C(TRX + 0.153 * math.cos(t) * math.cos(p), 0.153 * math.cos(t) * math.sin(p), DB + 0.178 * math.sin(t)) for t in [j * (math.pi / 2) / 10 for j in range(10)]]
    cu = bpy.data.curves.new(f'rib{k}', 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = 0.005
    cu.bevel_resolution = 2
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for i, q in enumerate(pts):
        sp.points[i].co = (*q, 1)
    ob = bpy.data.objects.new(f'rib{k}', cu)
    ob.data.materials.append(M['lead'])
    COL.objects.link(ob)
cath.append(lathe('lantern', M['lead'], [(0.035, 0), (0.035, 0.05), (0.04, 0.055), (0.02, 0.08), (0.006, 0.1), (0.012, 0.112), (0.0, 0.125)], C(TRX, 0, DB + 0.165), segs=24, smooth=True))

# the walls' marble stripes, blind arcades and windows on the side facing the camera
for s in (-1,):
    yo = s * (NAVE_W / 2 + AISLE_W)
    for k in range(5):
        cath.append(box(f'aisleStripe{k}', M['stripe'], C(NAVE_L / 2, yo - 0.002, 0.035 + k * 0.06), (NAVE_L, 0.006, 0.012), bevel=0))
    # a blind arcade of half-columns and round arches along the aisle, with the windows in it
    def straight_arcade(name, xa, xb, n, y_front, thick, z_spring, height):
        bm = bmesh.new()
        bay = (xb - xa) / n
        for i in range(n):
            cx = xa + (i + 0.5) * bay
            outline = arch_outline(bay / 2, bay / 2 - 0.011, z_spring, height)
            front = [bm.verts.new(C(cx + u, y_front, zz)) for u, zz in outline]
            back = [bm.verts.new(C(cx + u, y_front + thick, zz)) for u, zz in outline]
            add_prism(bm, front, back)
        cath.append(finish(name, bm, M['marble'], smooth_sides=False))
        for i in range(n + 1):
            x = xa + i * bay
            cath.extend(column(f'{name}Col{i}', M['marble'], *C(x, y_front + 0.004, 0)[:2], G + 0.025, z_spring - 0.025, 0.008))
        for i in range(n):
            x = xa + (i + 0.5) * bay
            cath.append(box(f'{name}Win{i}', M['shadow'], C(x, yo - 0.003, 0.15), (0.026, 0.006, 0.09), bevel=0))
            cath.append(cylinder(f'{name}WinTop{i}', M['shadow'], 0.013, 0.006, (0, 0, 0), segs=12, matrix=Matrix.Translation(C(x, yo - 0.003, 0.195)) @ Matrix.Rotation(math.pi / 2, 4, 'X') @ Matrix.Translation((0, 0, -0.003))))

    straight_arcade('arcadeWest', 0.03, TRX - TR_W / 2 - 0.01, 7, yo - 0.016, 0.016, 0.24, AISLE_H - 0.24)
    straight_arcade('arcadeEast', TRX + TR_W / 2 + 0.01, NAVE_L - 0.01, 1, yo - 0.016, 0.016, 0.24, AISLE_H - 0.24)
    cath.append(box('aisleCornice', M['marble'], C(NAVE_L / 2, yo - 0.01, AISLE_H - 0.008), (NAVE_L + 0.02, 0.03, 0.018), bevel=0.003))
    # the clerestory above the aisle roof
    for b in range(9):
        x = 0.08 + b * (NAVE_L - 0.16) / 8
        if abs(x - TRX) < TR_W / 2 + 0.02:
            continue
        cath.append(box(f'clerestory{b}', M['shadow'], C(x, s * NAVE_W / 2 - 0.004, AISLE_H + 0.12), (0.022, 0.006, 0.05), bevel=0))
    for k in range(3):
        cath.append(box(f'naveStripe{k}', M['stripe'], C(NAVE_L / 2, s * NAVE_W / 2 - 0.002, AISLE_H + 0.09 + k * 0.03), (NAVE_L, 0.006, 0.008), bevel=0))
# the transept's front gable end, facing the camera
ty = -TR_L / 2 - 0.003
for k in range(3):
    cath.append(box(f'transeptWin{k}', M['shadow'], C(TRX - 0.08 + k * 0.08, ty, 0.2), (0.03, 0.006, 0.1), bevel=0))
for k in range(5):
    cath.append(box(f'transeptStripe{k}', M['stripe'], C(TRX, ty, 0.04 + k * 0.08), (TR_W, 0.006, 0.012), bevel=0))
cath.append(box('transeptDoor', M['door'], C(TRX, ty - 0.002, 0.065), (0.06, 0.006, 0.13), bevel=0.001))

# the facade: three portals in a blind arcade, then four tiers of open loggias
FW = NAVE_W + 2 * AISLE_W
cath.append(box('facadeLower', M['marble'], C(-0.015, 0, AISLE_H / 2), (0.03, FW + 0.01, AISLE_H)))
cath.append(box('facadeUpper', M['marble'], C(-0.015, 0, (AISLE_H + NAVE_H + 0.09) / 2), (0.03, NAVE_W + 0.01, NAVE_H + 0.09 - AISLE_H)))
for k, (y, w, h) in enumerate(((0.0, 0.075, 0.19), (-0.15, 0.055, 0.15), (0.15, 0.055, 0.15))):
    cath.append(box(f'portal{k}', M['door'], C(-0.032, y, h / 2), (0.006, w, h), bevel=0.001))
    cath.append(cylinder(f'portalArch{k}', M['stripe'], w / 2 + 0.012, 0.006, (0, 0, 0), segs=16, matrix=Matrix.Translation(C(-0.034, y, h)) @ Matrix.Rotation(math.pi / 2, 4, 'Y') @ Matrix.Translation((0, 0, -0.003))))
for b in range(8):
    y = -FW / 2 + 0.02 + b * (FW - 0.04) / 7
    cath.append(box(f'facadePilaster{b}', M['marble'], C(-0.036, y, AISLE_H * 0.4), (0.012, 0.018, AISLE_H * 0.8), bevel=0.002))
TIERS = ((AISLE_H, FW, 19), (AISLE_H + 0.09, NAVE_W + 0.04, 9), (AISLE_H + 0.17, NAVE_W - 0.02, 8), (AISLE_H + 0.245, NAVE_W * 0.55, 5))
for t, (tz, width, n) in enumerate(TIERS):
    cath.append(box(f'loggiaFloor{t}', M['marble'], C(-0.045, 0, tz + 0.008), (0.05, width, 0.016), bevel=0.002))
    for i in range(n):
        y = -width / 2 + 0.015 + i * (width - 0.03) / (n - 1)
        cath += column(f'loggiaCol{t}_{i}', M['marble'], *C(-0.058, y, 0)[:2], G + tz + 0.016, 0.06, 0.0075)
    cath.append(box(f'loggiaLintel{t}', M['marble'], C(-0.05, 0, tz + 0.083), (0.04, width, 0.012), bevel=0.002))
    cath.append(box(f'loggiaBack{t}', M['marbleShade'], C(-0.032, 0, tz + 0.045), (0.006, width - 0.01, 0.07), bevel=0))
gable_end = bmesh.new()
gw = NAVE_W * 0.6
tri = [(-0.04, -gw / 2, NAVE_H + 0.06), (-0.04, gw / 2, NAVE_H + 0.06), (-0.04, 0.0, NAVE_H + 0.16)]
f0 = [gable_end.verts.new(C(*p)) for p in tri]
f1 = [gable_end.verts.new(C(x + 0.04, y, zz)) for x, y, zz in tri]
add_prism(gable_end, f0, f1)
cath.append(finish('facadeGable', gable_end, M['marble'], smooth_sides=False))
cath.append(lathe('facadeStatue', M['bronze'], [(0.012, 0), (0.008, 0.02), (0.01, 0.035), (0.0, 0.05)], C(-0.02, 0, NAVE_H + 0.16), segs=12))


# ------------------------------------------------------------------ a few tourists propping the tower up
person('tourist1', -0.3, -1.02, 0.55, 'red', 'push')
person('tourist2', 1.0, -0.8, 2.6, 'yellow')
person('tourist3', -0.6, -0.36, -0.2, 'blue')
person('tourist4', -0.5, -0.3, 2.8, 'green')



render('leaning-tower')

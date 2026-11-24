# The Pyramids of Giza in the high-quality look (hq.py), on a top of desert sand: the Great Pyramid
# of Khufu built in its stepped courses of limestone with its entrance high on the face, Khafre's
# with the smooth white casing still on its top, Menkaure's smaller one with its queens' pyramids,
# the Great Sphinx couched before them, scattered blocks, two camels and their riders.
# Run: blender -b --factory-startup -P pyramids-of-giza.py -- pyramids-of-giza-1024.png 1024 pyramids-of-giza.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='sand')
rng = random.Random(2560)
M['block'] = material('block', '#d4b07a', 0.75, vary='#c49f6a', vary_scale=22, bump=0.35, bump_scale=140)
M['blockLight'] = material('blockLight', '#e2c591', 0.7, vary='#d3b380', vary_scale=22, bump=0.3, bump_scale=140)
M['casing'] = material('casing', '#e4d2aa', 0.55, vary='#e0d1b2', vary_scale=10, bump=0.08, bump_scale=120)
M['sphinx'] = material('sphinx', '#c9a26c', 0.8, vary='#b58e5b', vary_scale=14, bump=0.4, bump_scale=60)
M['camel'] = material('camel', '#b8875a', 0.8, vary='#a87a50', vary_scale=20)
M['saddle'] = material('saddle', '#b33a2e', 0.7)


def stepped_pyramid(name, x, y, base, height, courses, casing_from=None, z0=None):
    """A pyramid in courses: each a slab a little smaller than the one below (the steps show), the
    courses from `casing_from` (a share of the height) up smooth white casing."""
    z0 = G if z0 is None else z0
    bm, bm_case = bmesh.new(), bmesh.new()
    ch = height / courses
    for k in range(courses):
        f = k / courses
        if casing_from is not None and f >= casing_from:
            break
        w = base * (1 - f) - ch * 0.35
        lr = random.Random(k)
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((x, y, z0 + ch * (k + 0.5))) @ Matrix.Rotation(lr.uniform(-0.002, 0.002), 4, 'Z') @ Matrix.Diagonal((w, w, ch * 1.001, 1)))
    finish(name, bm, M['block'], bevel=ch * 0.25, smooth_sides=False)
    if casing_from is not None:
        f = casing_from
        zc = z0 + height * f
        wc = base * (1 - f)
        pyramid(name + 'Casing', M['casing'], x, y, zc, wc, height * (1 - f))
    else:
        pyramid(name + 'Cap', M['blockLight'], x, y, z0 + height * (courses - 1) / courses, base / courses * 1.2, height / courses * 1.4)


# ------------------------------------------------------------------ the three pyramids
stepped_pyramid('khufu', 0.38, 0.42, 1.0, 0.64, 32)
windows('khufuEntrance', M['shadow'], [(0.38, 0.42 - 0.5 * 0.87, G + 0.64 * 0.13, 0.03, 0.03, (0, -1), 'rect')], depth=0.02)
stepped_pyramid('khafre', -0.58, -0.34, 0.88, 0.6, 30, casing_from=0.8)
stepped_pyramid('menkaure', 0.75, -0.55, 0.38, 0.25, 15)
for k, (x, y, b) in enumerate(((1.08, -0.12, 0.14), (1.13, 0.12, 0.13), (1.0, -0.88, 0.11))):
    stepped_pyramid(f'queen{k}', x, y, b, b * 0.62, 7)

# ------------------------------------------------------------------ the Sphinx
SX, SY = -0.02, -0.9
sph = Matrix.Translation((SX, SY, G)) @ Matrix.Rotation(math.radians(-8), 4, 'Z') @ Matrix.Scale(1.7, 4)
bm = bmesh.new()
# the couched body: a long rounded block, haunches at the back, paws out in front
bmesh.ops.create_cube(bm, size=1.0, matrix=sph @ Matrix.Translation((0, 0.09, 0.035)) @ Matrix.Diagonal((0.075, 0.2, 0.07, 1)))
bmesh.ops.create_cube(bm, size=1.0, matrix=sph @ Matrix.Translation((0, 0.17, 0.05)) @ Matrix.Diagonal((0.085, 0.07, 0.085, 1)))
for s in (-1, 1):
    bmesh.ops.create_cube(bm, size=1.0, matrix=sph @ Matrix.Translation((s * 0.025, -0.06, 0.012)) @ Matrix.Diagonal((0.022, 0.13, 0.024, 1)))
bmesh.ops.create_cube(bm, size=1.0, matrix=sph @ Matrix.Translation((0, -0.005, 0.07)) @ Matrix.Diagonal((0.06, 0.05, 0.07, 1)))
finish('sphinxBody', bm, M['sphinx'], bevel=0.008, smooth_sides=False)
# the head with its nemes headdress flaring to the shoulders
bm = bmesh.new()
add_prism(bm, [bm.verts.new(sph @ Vector(p)) for p in ((-0.045, -0.03, 0.08), (0.045, -0.03, 0.08), (0.045, 0.03, 0.08), (-0.045, 0.03, 0.08))],
          [bm.verts.new(sph @ Vector(p)) for p in ((-0.026, -0.02, 0.15), (0.026, -0.02, 0.15), (0.026, 0.026, 0.15), (-0.026, 0.026, 0.15))])
finish('sphinxNemes', bm, M['sphinx'], bevel=0.004, smooth_sides=False)
box_m('sphinxFace', M['sphinx'], sph @ Matrix.Translation((0, -0.035, 0.115)), (0.03, 0.02, 0.045), bevel=0.004)
for s in (-1, 1):
    box_m(f'sphinxEye{s}', M['shadow'], sph @ Matrix.Translation((s * 0.008, -0.046, 0.123)), (0.006, 0.002, 0.003))

# ------------------------------------------------------------------ blocks, camels and their riders
for k in range(18):
    x, y = rng.uniform(-1.1, 1.1), rng.uniform(-1.1, 1.1)
    if math.hypot(x, y) > 1.3 or (abs(x - 0.38) < 0.56 and abs(y - 0.42) < 0.56) or (abs(x + 0.58) < 0.5 and abs(y + 0.34) < 0.5) or (abs(x - 0.75) < 0.25 and abs(y + 0.55) < 0.25):
        continue
    box(f'stone{k}', M['block'], (x, y, G + 0.012), (0.03 + 0.03 * rng.random(), 0.03 + 0.02 * rng.random(), 0.025), rot_z=rng.random() * 3, bevel=0.005)


def camel(name, x, y, rot, rider='red'):
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
    cylinder(name + 'Rider', M[rider], 0.009, 0.03, (0, 0, 0), segs=10, matrix=m @ Matrix.Translation((0.005, 0, 0.122)))
    cylinder(name + 'RiderHead', M['white'], 0.007, 0.012, (0, 0, 0), segs=10, matrix=m @ Matrix.Translation((0.005, 0, 0.152)))


camel('camel1', 0.3, -0.9, math.radians(160), 'blue')
camel('camel2', 0.45, -1.02, math.radians(175), 'red')
person('p1', 0.12, -0.72, 0.3, 'yellow')
person('p2', 0.2, -0.76, 2.0, 'green')

render('pyramids-of-giza')

# Uluru in the high-quality look (hq.py), from the real ground (the open terrain tiles in _sources/dem/:
# SRTM and Geoscience Australia): the great red monolith rising from the desert of the Northern
# Territory, its steep flanks ridged by its upturned beds of arkose, its gullies at the foot;
# the red sand plain round it with clumps of spinifex and desert oaks. Heights drawn 2.6 times their
# real height.
# Run: blender -b --factory-startup -P uluru.py -- uluru-1024.png 1024 uluru.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *
from mathutils.bvhtree import BVHTree

setup(top='sand')
rng = random.Random(1985)
M['arkose'] = layered('arkose', ['#a8411f', '#b54a23', '#923a1c', '#ad4521', '#843419'], scale=60.0, distortion=1.2, rough=0.8, bump=0.5, bump_scale=120, axis='X')
M['redSand'] = material('redSand', '#dd9a60', 0.95, vary='#d18c54', vary_scale=5, bump=0.25, bump_scale=300)
M['spinifex'] = material('spinifex', '#b4a34f', 0.9, vary='#9f9145', vary_scale=20)
M['desertOak'] = material('desertOak', '#5a6e3a', 0.85, vary='#4c5f30', vary_scale=14, bump=0.3, bump_scale=90)

LAT0, LON0 = -25.3446, 131.0362
RADIUS_M = 2300.0
MPU = RADIUS_M / 1.45
EXAG = 2.6
elev = elevation('uluru', 14)
to = geo(LAT0, LON0, MPU, turn=0.0)
PLAIN = min(elev(*to(1.4 * math.cos(a), 1.4 * math.sin(a))) for a in (2 * math.pi * k / 24 for k in range(24)))


def H(x, y):
    g = elev(*to(x, y)) - PLAIN
    fade = min(1.0, max(0.0, (1.46 - math.hypot(x, y)) / 0.15))
    return max(0.0, g) * EXAG / MPU * fade * fade * (3 - 2 * fade)


def pick(z, nz, x, y):
    return 0 if z * MPU / EXAG > 12.0 or nz < 0.6 else 1


ground = terrain('uluru', H, [M['arkose'], M['redSand']], pick, rings=240, segs=600)
print('ULURU height', round(max(v.co.z for v in ground.data.vertices) - G, 3), 'plain', round(PLAIN, 1))

# ------------------------------------------------------------------ spinifex and desert oaks on the plain
bm = bmesh.new()
bm.from_mesh(ground.data)
bm.faces.ensure_lookup_table()
tree_ = BVHTree.FromBMesh(bm)
SPIN, OAKS = bmesh.new(), bmesh.new()
n_oak = 0
for k in range(3200):
    x, y = rng.uniform(-1.42, 1.42), rng.uniform(-1.42, 1.42)
    if math.hypot(x, y) > 1.4:
        continue
    hit = tree_.ray_cast(Vector((x, y, 3.0)), Vector((0, 0, -1)), 5.0)
    if hit[0] is None or bm.faces[hit[2]].material_index != 1:
        continue
    p = hit[0]
    if rng.random() < 0.08 and n_oak < 60:
        h = rng.uniform(0.05, 0.08)
        bmesh.ops.create_cone(OAKS, cap_ends=True, segments=6, radius1=0.004, radius2=0.003, depth=h * 0.5, matrix=Matrix.Translation(p + Vector((0, 0, h * 0.25))))
        for j in range(3):
            o = Vector((rng.uniform(-0.012, 0.012), rng.uniform(-0.012, 0.012), h * (0.55 + 0.15 * j)))
            bmesh.ops.create_icosphere(OAKS, subdivisions=1, radius=h * 0.28, matrix=Matrix.Translation(p + o) @ Matrix.Diagonal((1.0, 1.0, 0.7, 1)))
        n_oak += 1
    else:
        r = rng.uniform(0.008, 0.016)
        bmesh.ops.create_icosphere(SPIN, subdivisions=1, radius=1.0, matrix=Matrix.Translation(p) @ Matrix.Diagonal((r, r, r * 0.6, 1)))
finish('spinifex', SPIN, M['spinifex'], smooth_all=True)
finish('desertOaks', OAKS, M['desertOak'], smooth_all=True)
print('OAKS', n_oak)

render('uluru')

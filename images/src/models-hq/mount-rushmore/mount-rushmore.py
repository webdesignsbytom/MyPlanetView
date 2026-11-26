# Mount Rushmore in the high-quality look (hq.py): the granite mountain in the Black Hills with the four
# presidents carved in its face, Washington, Jefferson, Roosevelt and Lincoln, the pale talus of blasted
# rock spilling below them (the scanned mountain in _sources/mount-rushmore/, jerryfisher, CC BY 4.0,
# given the diorama's granite), the ponderosa pine forest on the slopes round it, and in front the Grand
# View Terrace and the Avenue of Flags, and people.
# Run: blender -b --factory-startup -P mount-rushmore.py -- mount-rushmore-1024.png 1024 mount-rushmore.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *
from mathutils.bvhtree import BVHTree

setup()
rng = random.Random(1941)
M['granite'] = material('rushmoreGranite', '#a69b8f', 0.8, vary='#91867a', vary_scale=9, bump=0.35, bump_scale=120)
M['faceGranite'] = material('faceGranite', '#cdc5b9', 0.75, vary='#bdb4a7', vary_scale=9, bump=0.25, bump_scale=120)
M['canopy'] = material('pineCanopy', '#355f34', 0.9, vary='#2a4f2b', vary_scale=60, bump=0.8, bump_scale=420)
M['talus'] = material('talus', '#cbc3b7', 0.9, vary='#b8b0a4', vary_scale=40, bump=0.5, bump_scale=300)
M['forestFloor'] = material('forestFloor', '#557d3f', 0.9, vary='#486e35', vary_scale=12, bump=0.3, bump_scale=200)
M['pine'] = material('ponderosa', '#2f5e34', 0.85, vary='#28512c', vary_scale=14, bump=0.4, bump_scale=90)
M['flagRed'] = material('flagRedR', '#c8323a', 0.7)
M['flagBlue'] = material('flagBlueR', '#2c4a8f', 0.7)

SOURCE_TURN = -62.0     # the presidents then face the camera
K = 0.0165              # the scan's units to the tile's
EDGE = 1.47             # the scan is cut at this radius, and eased down to the base before it
src = import_model('mount-rushmore', 'mountain')
mountain = None
if src is not None:
    me = src.data
    me.transform(Matrix.Rotation(math.radians(SOURCE_TURN), 4, 'Z'))
    xs = [v.co.x for v in me.vertices]
    ys = [v.co.y for v in me.vertices]
    zs = [v.co.z for v in me.vertices]
    me.transform(Matrix.Translation((0.0, 0.05, G - 0.01)) @ Matrix.Scale(K, 4) @ Matrix.Translation((-(min(xs) + max(xs)) / 2, -(min(ys) + max(ys)) / 2, -min(zs))))
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if math.hypot(*f.calc_center_median().xy) > EDGE], context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    for v in bm.verts:      # eased down to the base towards the cut, so no raw edge shows
        f = max(0.0, min(1.0, (EDGE - math.hypot(v.co.x, v.co.y)) / 0.3))
        f = f * f * (3 - 2 * f)
        v.co.z = G - 0.01 + (v.co.z - (G - 0.01)) * f
    bm.to_mesh(me)
    bm.free()
    me.materials.append(M['granite'])
    me.materials.append(M['talus'])
    me.materials.append(M['forestFloor'])
    me.materials.append(M['faceGranite'])
    me.materials.append(M['canopy'])
    zmax = max(v.co.z for v in me.vertices)
    # where each face is on the picture: the camera's right and up (azimuth 32, elevation 24), so the
    # carving is marked where the presidents show, from left of Washington to right of Lincoln, down to
    # the talus; measured off a preview's framing, in the tile's units on the picture
    az, el = math.radians(32), math.radians(24)
    RIGHT = Vector((math.cos(az), -math.sin(az), 0))
    UP = Vector((math.sin(el) * math.sin(az), math.sin(el) * math.cos(az), math.cos(el)))
    for p in me.polygons:
        c = p.center
        h = (c.z - G) / (zmax - G)
        u, v = c.dot(RIGHT), (c - Vector((0, 0, G))).dot(UP)
        front = p.normal.dot(Vector((-math.sin(az), -math.cos(az), 0))) > -0.2      # not facing away from the camera
        n1 = 0.5 * math.sin(13.1 * c.x + 4.7 * c.y + 2.1 * c.z) + 0.5 * math.sin(7.3 * c.y - 9.2 * c.x + 5.3 * c.z)   # soft, wavy edges
        n2 = 0.5 * math.sin(21.7 * c.x - 3.1 * c.y + 11.3 * c.z) + 0.5 * math.sin(17.9 * c.y + 6.1 * c.x - 8.7 * c.z)
        n3 = 0.6 * math.sin(9.0 * c.z + 2.0 * c.x) + 0.4 * math.sin(23.0 * c.z - 5.0 * c.y)                     # wavers with height
        carving = -0.75 + 0.12 * n3 < u < 1.12 + 0.12 * n3 and v > 0.56 + 0.07 * n2 and front
        talus = -0.38 + 0.07 * n1 < u < 0.42 + 0.07 * n2 and 0.0 < v <= 0.66 and p.normal.z > 0.5 and h > 0.08
        if carving or talus:
            p.material_index = 3 if carving else 1
        elif h > 0.72 or (p.normal.z <= 0.5 and n2 > 0.05):
            p.material_index = 0                          # the summit, and the flanks' outcrops
        elif p.normal.z > 0.5:
            p.material_index = 2                          # gentle: forest floor, with pines stood on it
        else:
            p.material_index = 4                          # steep: the pines' canopy
        p.use_smooth = True
    mountain = src
    print('MOUNTAIN height', round(zmax - G, 3))

# ------------------------------------------------------------------ the ponderosa pines on the forest's slopes
if mountain is not None:
    me = mountain.data
    bm = bmesh.new()
    bm.from_mesh(me)
    bm.faces.ensure_lookup_table()
    tree_ = BVHTree.FromBMesh(bm)
    PINES = bmesh.new()
    n = 0
    for k in range(5000):
        x, y = rng.uniform(-1.45, 1.45), rng.uniform(-1.45, 1.45)
        if math.hypot(x, y) > 1.38 or (y < -0.95 and abs(x) < 0.55):        # off the base, or the terrace
            continue
        hit = tree_.ray_cast(Vector((x, y, 3.0)), Vector((0, 0, -1)), 5.0)
        if hit[0] is None:
            hit = (Vector((x, y, G)),)                    # the base's own ground round the mountain
        else:
            f = bm.faces[hit[2]]
            if f.material_index != 2 or f.normal.z < 0.5:
                continue
        hgt = rng.uniform(0.07, 0.12)
        r = hgt * 0.3
        base = hit[0] - Vector((0, 0, 0.004))
        lathe_pts = [(0.0, 0.0), (r, hgt * 0.2), (r * 0.62, hgt * 0.5), (r * 0.75, hgt * 0.52), (r * 0.35, hgt * 0.85), (0.0, hgt)]
        rings = [[PINES.verts.new(base + Vector((rr * math.cos(2 * math.pi * j / 8), rr * math.sin(2 * math.pi * j / 8), zz))) for j in range(8)] for rr, zz in lathe_pts]
        for a_, b_ in zip(rings, rings[1:]):
            for j in range(8):
                PINES.faces.new((a_[j], a_[(j + 1) % 8], b_[(j + 1) % 8], b_[j]))
        n += 1
        if n >= 700:
            break
    bmesh.ops.remove_doubles(PINES, verts=PINES.verts, dist=1e-6)
    finish('pines', PINES, M['pine'], smooth_all=True)
    print('PINES', n)

# ------------------------------------------------------------------ the Grand View Terrace and the Avenue of Flags
TY = -1.12
slab('terrace', M['paving'], rect(0.0, TY, 0.9, 0.26), G - 0.004, G + 0.03, bevel=0.003, margin=0.05)
for s_ in (-1, 1):
    for j in range(7):
        x = s_ * (0.18 + j * 0.035)
        cylinder(f'flagpole{s_}{j}', M['white'], 0.0018, 0.11, (x, TY - 0.07, G + 0.03), segs=6)
        box(f'flag{s_}{j}', M['flagRed'] if j % 2 else M['flagBlue'], (x + 0.012, TY - 0.07, G + 0.128), (0.022, 0.002, 0.014), bevel=0)
for k, (x, y, shirt) in enumerate(((-0.1, -1.16, 'red'), (0.05, -1.2, 'blue'), (0.2, -1.08, 'yellow'), (-0.25, -1.06, 'green'), (0.35, -1.18, 'red'), (-0.4, -1.17, 'blue'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=G + 0.03)

render('mount-rushmore')

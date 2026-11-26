# Marina Bay Sands in the high-quality look (hq.py), laid out in metres: Singapore's three hotel towers,
# each a straight leg facing the bay and a curved leg leaning into it from behind, their glass and white
# frames; the SkyPark laid across their tops like a ship, its bow cantilevered far out beyond the north
# tower, the infinity pool along its bay edge and trees on its deck; the low podium of the Shoppes along
# the waterfront; the white lotus of the ArtScience Museum on its pond; the promenade and the bay.
# Run: blender -b --factory-startup -P marina-bay-sands.py -- marina-bay-sands-1024.png 1024 marina-bay-sands.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(2010)
M['mbsGlass'] = striped('mbsGlass', ['#6f8ea3', '#6f8ea3', '#6f8ea3', '#e6e9ea'], 'Z', 30.0, rough=0.2, metallic=0.3)
M['mbsWhite'] = material('mbsWhite', '#eceeee', 0.45)
M['mbsDeck'] = material('skyParkDeck', '#d8d2c4', 0.7, vary='#cfc8b8', vary_scale=40)
M['pool'] = material('infinityPool', '#3fa8d4', 0.05, vary='#55b8e0', vary_scale=8, coat=0.8)
M['bay'] = material('marinaBay', '#3b7f9e', 0.08, vary='#4690ae', vary_scale=6, bump=0.04, bump_scale=60, coat=0.8)
M['promenade'] = masonry('mbsPromenade', '#d9d0c0', '#bdb3a2', scale=110, rough=0.8, vary='#d0c6b4')
M['lotusWhite'] = material('lotusWhite', '#f4f4f1', 0.4)
M['treeM'] = material('mbsTree', '#3f8236', 0.85, vary='#4c923f', vary_scale=14, bump=0.3, bump_scale=90)
M['podiumRoof'] = material('shoppesRoof', '#b9c2c8', 0.35, metallic=0.4)

S = 0.0072              # metres to the tile's units
X0, FY = 30.0, 10.0     # the plan's point at the tile's middle
Z0 = G + 0.004


def P(x, y, z):
    return Vector(((x - X0) * S, (y - FY) * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


BEFORE = set(bpy.data.objects)
# ------------------------------------------------------------------ the bay, the promenade
slab('bay', M['bay'], [((-400.0 - X0) * S, (-400.0 - FY) * S), ((400.0 - X0) * S, (-400.0 - FY) * S), ((400.0 - X0) * S, (-70.0 - FY) * S), ((-400.0 - X0) * S, (-70.0 - FY) * S)], Z0 - 0.003, Z0 + 0.1 * S, margin=0.02)
slab('promenade', M['promenade'], [((-400.0 - X0) * S, (-70.0 - FY) * S), ((400.0 - X0) * S, (-70.0 - FY) * S), ((400.0 - X0) * S, (-52.0 - FY) * S), ((-400.0 - X0) * S, (-52.0 - FY) * S)], Z0, Z0 + 0.4 * S, margin=0.02)

# ------------------------------------------------------------------ the three towers: a straight leg in front, a curved leg leaning into it behind
TOWERS = (-95.0, 0.0, 95.0)
TW = 19.0               # each tower's half-width along the line of them
TOP = 192.0
for k, tx in enumerate(TOWERS):
    block(f'frontLeg{k}', M['mbsGlass'], tx - TW, tx + TW, -14.0, 0.0, -0.3, TOP)
    block(f'frontLegEdge{k}', M['mbsWhite'], tx - TW - 0.4, tx + TW + 0.4, -14.6, -13.6, -0.3, TOP, bevel=0)
    bm = bmesh.new()
    prof = []
    for j in range(25):
        t = j / 24
        z = TOP * t
        y_back = 30.0 - 26.0 * t ** 1.6            # the back leg's back face, leaning in as it rises
        y_front = 12.0 - 10.0 * t ** 1.6
        prof.append((y_front, y_back, z))
    left = [bm.verts.new(P(tx - TW, yf, z)) for yf, yb, z in prof] + [bm.verts.new(P(tx - TW, yb, z)) for yf, yb, z in reversed(prof)]
    right = [bm.verts.new(P(tx + TW, yf, z)) for yf, yb, z in prof] + [bm.verts.new(P(tx + TW, yb, z)) for yf, yb, z in reversed(prof)]
    add_prism(bm, left, right)
    finish(f'backLeg{k}', bm, M['mbsGlass'], smooth_sides=False)
    block(f'atriumRoof{k}', M['mbsWhite'], tx - TW, tx + TW, 0.0, 12.0, 40.0, 42.0, bevel=0)
    for s in (-1, 1):
        block(f'legSide{k}{s}', M['mbsWhite'], *sorted((tx + s * TW, tx + s * (TW + 0.6))), -14.0, 0.0, -0.3, TOP, bevel=0)

# ------------------------------------------------------------------ the SkyPark: its hull, the bow cantilevered north, the pool, trees
X_A, X_B = -128.0, 178.0
bm = bmesh.new()
outline = [(X_A, -18.0), (X_B - 40.0, -18.0), (X_B - 10.0, -12.0), (X_B, -4.0), (X_B - 2.0, 4.0), (X_B - 30.0, 12.0), (X_A, 14.0), (X_A - 6.0, -2.0)]
add_prism(bm, [bm.verts.new(P(x, y, TOP + 7.0)) for x, y in outline], [bm.verts.new(P(x, y, TOP)) for x, y in outline])
finish('skyParkHull', bm, M['mbsWhite'], smooth_sides=False)
bm = bmesh.new()
hull_low = [(x, y * 0.82) for x, y in outline]
add_prism(bm, [bm.verts.new(P(x, y, TOP)) for x, y in hull_low], [bm.verts.new(P(x * 0.995, y * 0.6, TOP - 5.0)) for x, y in hull_low])
finish('skyParkKeel', bm, M['mbsWhite'], smooth_sides=False)
block('skyParkDeck', M['mbsDeck'], X_A + 2.0, X_B - 34.0, -16.0, 12.0, TOP + 7.0, TOP + 7.4, bevel=0)
block('infinityPool', M['pool'], -110.0, 100.0, -17.4, -9.0, TOP + 7.0, TOP + 7.6, bevel=0)
block('poolEdge', M['mbsWhite'], -110.0, 100.0, -18.0, -17.4, TOP + 6.6, TOP + 7.5, bevel=0)
SKYTREES = [(P(x, rng.uniform(0.0, 9.0), TOP + 10.0).to_tuple(), rng.uniform(2.4, 3.4) * S, 0.85) for x in [rng.uniform(-120.0, 120.0) for _ in range(28)]]
blob_cloud('skyParkTrees', M['treeM'], SKYTREES)
for j in range(5):
    x = -70.0 + 45.0 * j
    block(f'cabana{j}', M['mbsWhite'], x - 5.0, x + 5.0, 4.0, 11.0, TOP + 7.4, TOP + 10.4, bevel=0)

# ------------------------------------------------------------------ the Shoppes' podium along the front, its roofs
for k, (x0, x1) in enumerate(((-150.0, -50.0), (-40.0, 50.0), (60.0, 140.0))):
    block(f'shoppes{k}', M['mbsGlass'], x0, x1, -50.0, -18.0, -0.3, 14.0)
    bm = bmesh.new()
    for j in range(12):
        t0, t1 = j / 12, (j + 1) / 12
        xa, xb = x0 + (x1 - x0) * t0, x0 + (x1 - x0) * t1
        za, zb = 14.0 + 6.0 * math.sin(math.pi * t0), 14.0 + 6.0 * math.sin(math.pi * t1)
        q = [bm.verts.new(P(xa, -52.0, za)), bm.verts.new(P(xb, -52.0, zb)), bm.verts.new(P(xb, -16.0, zb)), bm.verts.new(P(xa, -16.0, za))]
        bm.faces.new(q)
    finish(f'shoppesRoof{k}', bm, M['podiumRoof'], smooth_sides=False)

# ------------------------------------------------------------------ the ArtScience Museum: its pond and the lotus of ten white fingers
LX, LY = 138.0, -96.0
cylinder('lotusPond', M['pool'], 30.0 * S, 0.4 * S, P(LX, LY, 0.0), segs=64)
cylinder('lotusBowl', M['lotusWhite'], 15.0 * S, 10.0 * S, P(LX, LY, 0.0), segs=48, r2=19.0 * S)
for j in range(10):
    a = 2 * math.pi * j / 10
    rings = []
    for i in range(13):
        t = i / 12
        rr = 15.0 + 20.0 * t ** 1.3
        z = 8.0 + 36.0 * t
        w = 6.0 * (1.0 - 0.75 * t) + 0.5
        c = Vector((LX + rr * math.cos(a), LY + rr * math.sin(a), z))
        side = Vector((-math.sin(a), math.cos(a), 0.0))
        up = Vector((-math.cos(a) * 0.6, -math.sin(a) * 0.6, 1.0)).normalized()
        ring = []
        for q in range(10):
            phi = 2 * math.pi * q / 10
            p = c + side * (w * math.cos(phi)) + up.cross(side).normalized() * (w * 0.35 * math.sin(phi))
            ring.append(P(p.x, p.y, p.z).to_tuple())
        rings.append(ring)
    loft(f'lotusFinger{j}', M['lotusWhite'], rings)
cylinder('lotusTop', M['lotusWhite'], 4.0 * S, 2.0 * S, P(LX, LY, 10.0), segs=24)

R = Matrix.Rotation(math.radians(-32.0 + 20.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('marina-bay-sands')

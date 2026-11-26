# Ha Long Bay in the high-quality look (hq.py), laid out in metres: limestone karsts rising sheer from the
# emerald water, each its own shape, grey and streaked on their cliffs, notched at the waterline, crowned
# and ledged with forest; junks among them with their ribbed orange sails, and a kayak.
# Run: blender -b --factory-startup -P ha-long-bay.py -- ha-long-bay-1024.png 1024 ha-long-bay.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1994)
M['limestoneH'] = layered('halongLimestone', ['#9a978d', '#8a877e', '#a8a59a', '#7e7b73'], scale=30.0, distortion=1.5, rough=0.9, bump=0.4, bump_scale=120, axis='X')
M['jungleH'] = material('halongForest', '#3f7a36', 0.85, vary='#4d8a40', vary_scale=14, bump=0.3, bump_scale=90)
M['jungleH2'] = material('halongForestLight', '#5f963f', 0.85, vary='#6ca449', vary_scale=14, bump=0.3, bump_scale=90)
M['bay'] = material('halongWater', '#3a8c86', 0.05, vary='#46988f', vary_scale=6, bump=0.04, bump_scale=60, coat=0.8)
M['hullJ'] = material('junkHull', '#6b4228', 0.7, vary='#5d3920', vary_scale=60)
M['sail'] = material('junkSail', '#d9662e', 0.7, vary='#cf5c28', vary_scale=30)
M['batten'] = material('junkBatten', '#4a3220', 0.7)
M['cabinJ'] = material('junkCabin', '#e8dfcc', 0.6)
M['kayak'] = material('kayak', '#e8c22e', 0.5)

S = 0.012               # metres to the tile's units
Z0 = G


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


slab('bay', M['bay'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0 + 0.3 * S, margin=0.02)
BEFORE = set(bpy.data.objects)


def karst(name, x, y, r, h, seed):
    """A karst: an irregular outline, notched in at the waterline, bulging a little above, rounding
    over at its top; forest on its crown and ledges."""
    rr = random.Random(seed)
    n = 28
    shape = [1.0 + 0.22 * math.sin(3 * a + rr.uniform(0, 6)) + 0.12 * math.sin(5 * a + rr.uniform(0, 6)) + rr.uniform(-0.06, 0.06)
             for a in [2 * math.pi * k / n for k in range(n)]]
    levels = [(-0.5, 0.95), (0.6, 0.78), (1.6, 0.98), (0.3 * h, 1.04), (0.5 * h, 1.02), (0.68 * h, 0.98), (0.84 * h, 0.88), (0.94 * h, 0.66), (h, 0.3)]
    rings = []
    for z, f in levels:
        lean = 0.06 * (z / h) * r
        rings.append([P(x + lean + r * f * shape[k] * math.cos(2 * math.pi * k / n), y + r * f * shape[k] * math.sin(2 * math.pi * k / n), z).to_tuple() for k in range(n)])
    loft(name, M['limestoneH'], rings[:6], smooth=False)
    loft(name + 'Green', M['jungleH' if seed % 2 else 'jungleH2'], rings[4:], smooth=True)
    crown = []
    for k in range(22):
        a = rr.uniform(0, 2 * math.pi)
        d = rr.uniform(0.0, 0.85) * r
        zz = h * (0.98 - 0.35 * (d / r) ** 2)
        crown.append((P(x + 0.06 * r + d * math.cos(a), y + d * math.sin(a), zz).to_tuple(), rr.uniform(0.2, 0.32) * r * S, 0.75))
    for k in range(8):
        a = rr.uniform(0, 2 * math.pi)
        zz = h * rr.uniform(0.3, 0.6)
        crown.append((P(x + r * 0.98 * math.cos(a), y + r * 0.98 * math.sin(a), zz).to_tuple(), rr.uniform(0.12, 0.2) * r * S, 0.6))
    blob_cloud(name + 'Forest', M['jungleH' if seed % 2 else 'jungleH2'], [(c, rad, sq) for c, rad, sq in crown])


KARSTS = [(-22.0, 18.0, 11.0, 66.0), (14.0, 34.0, 9.0, 56.0), (40.0, 2.0, 8.0, 50.0), (-52.0, 46.0, 8.0, 44.0), (-62.0, -8.0, 7.0, 38.0),
          (56.0, 50.0, 7.0, 36.0), (-8.0, 70.0, 8.0, 46.0), (72.0, 18.0, 6.0, 30.0), (-36.0, -40.0, 5.0, 24.0), (34.0, -46.0, 5.0, 22.0),
          (-80.0, 22.0, 5.0, 26.0), (36.0, 82.0, 6.0, 32.0), (-40.0, 82.0, 6.0, 28.0), (8.0, 8.0, 6.0, 34.0)]
for k, (x, y, r, h) in enumerate(KARSTS):
    if math.hypot(x, y) + r * 1.4 > 1.4 / S:
        continue
    karst(f'karst{k}', x, y, r, h, k + 3)


def junk(name, x, y, ang, sc=1.0):
    """A junk: its curved wooden hull, a white cabin, and three ribbed orange sails."""
    m = Matrix.Translation(P(x, y, 0.2)) @ Matrix.Rotation(ang, 4, 'Z') @ Matrix.Scale(sc, 4)
    rings = []
    for k in range(9):
        t = k / 8
        u = -9.0 + 18.0 * t
        w = 2.6 * math.sin(math.pi * (0.1 + 0.8 * t)) + 0.3
        lift = 1.4 * (2.0 * abs(t - 0.5)) ** 2
        rings.append([(m @ Vector((u * S, v * w * S, (z + lift) * S))).to_tuple() for v, z in ((-1, 1.6), (-0.7, -0.4), (0.7, -0.4), (1, 1.6))])
    loft(name + 'Hull', M['hullJ'], rings, smooth=True)
    box_m(name + 'Cabin', M['cabinJ'], m @ Matrix.Translation((-2.0 * S, 0.0, 2.6 * S)), (8.0 * S, 3.6 * S, 2.0 * S))
    box_m(name + 'Roof', M['hullJ'], m @ Matrix.Translation((-2.0 * S, 0.0, 3.8 * S)), (9.0 * S, 4.2 * S, 0.4 * S))
    for j, (u, hsail) in enumerate(((-6.0, 9.0), (0.5, 12.0), (5.6, 8.0))):
        bm = bmesh.new()
        pts = [(u - 2.6, 4.0), (u + 2.2, 4.0), (u + 3.2, 4.0 + hsail), (u - 1.4, 4.0 + hsail * 1.05)]
        vs = [bm.verts.new((m @ Vector((pu * S, 0.0, pz * S))).to_tuple()) for pu, pz in pts]
        bm.faces.new(vs)
        ob = finish(f'{name}Sail{j}', bm, M['sail'], smooth_sides=False)
        ob.modifiers.new('thick', 'SOLIDIFY').thickness = 0.15 * S
        bar(f'{name}Mast{j}', M['batten'], m @ Vector((u * S, 0.0, 2.0 * S)), m @ Vector(((u + 0.6) * S, 0.0, (4.4 + hsail) * S)), 0.25 * S)
        for b in range(1, 6):
            f = b / 6
            za = 4.0 + hsail * f
            ua0 = (u - 2.6) + (-1.4 - -2.6) * f
            ua1 = (u + 2.2) + (1.0) * f
            bar(f'{name}Batten{j}{b}', M['batten'], m @ Vector((ua0 * S, 0.1 * S, za * S)), m @ Vector((ua1 * S, 0.1 * S, za * S)), 0.12 * S)


junk('junk0', -8.0, -30.0, 0.3, 1.5)
junk('junk1', 52.0, -20.0, -0.9, 1.3)
junk('junk2', -50.0, -26.0, 2.2, 1.2)
box('kayak', M['kayak'], P(20.0, -20.0, 0.5), (4.0 * S, 0.8 * S, 0.4 * S), rot_z=0.6, bevel=0)
person('paddler', *P(20.0, -20.0, 0.0).to_tuple()[:2], 0.6, 'red', z=Z0 + 0.6 * S, scale=0.5)

R = Matrix.Rotation(math.radians(-32.0 + 10.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('ha-long-bay')

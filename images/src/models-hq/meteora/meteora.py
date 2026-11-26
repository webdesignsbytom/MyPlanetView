# Meteora in the high-quality look (hq.py), laid out in metres (the rocks drawn closer together than
# they stand): the smooth sandstone-and-conglomerate pillars rising sheer from the Thessaly plain, streaked
# dark down their sides and rounded on top, and the monasteries perched on them: the Great Meteoron's
# walls, halls and domed church on the broadest rock, Varlaam's on its neighbour, the Holy Trinity's,
# and Roussanou filling the top of its narrow pillar, their stone walls, red-tiled roofs and church
# domes; the green valley at their feet with its oaks and the road winding through; people.
# Run: blender -b --factory-startup -P meteora.py -- meteora-1024.png 1024 meteora.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1356)
def streaked(name, light, dark, stretch=0.06, scale=60.0):
    """Rock streaked dark straight down its faces (rain stains on Meteora's pillars): noise stretched
    upright, so its bands run vertically on every side."""
    mat = material(name, light, 0.9, bump=0.45, bump_scale=90)
    nt = mat.node_tree
    n, l = nt.nodes, nt.links
    coord = n.new('ShaderNodeTexCoord')
    mp = n.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (scale, scale, scale * stretch)
    l.new(coord.outputs['Object'], mp.inputs['Vector'])
    tex = n.new('ShaderNodeTexNoise')
    tex.inputs['Scale'].default_value = 1.0
    tex.inputs['Detail'].default_value = 6.0
    l.new(mp.outputs['Vector'], tex.inputs['Vector'])
    ramp = n.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[0].color = lin(dark)
    ramp.color_ramp.elements[1].position = 0.62
    ramp.color_ramp.elements[1].color = lin(light)
    l.new(tex.outputs['Fac'], ramp.inputs['Fac'])
    l.new(ramp.outputs['Color'], n['Principled BSDF'].inputs['Base Color'])
    return mat


M['conglomerate'] = streaked('conglomerate', '#b1a68f', '#6f6757')
M['rockTop'] = material('rockTop', '#9a9078', 0.9, vary='#8a8069', vary_scale=14, bump=0.4, bump_scale=90)
M['monStone'] = material('monasteryStone', '#c7b89a', 0.85, vary='#b8a98b', vary_scale=18, bump=0.25, bump_scale=150)
M['monPlaster'] = material('monasteryPlaster', '#e7dcc6', 0.8, vary='#dccfb6', vary_scale=18)
M['tilesM'] = banded(material('meteoraTiles', '#b25a3a', 0.7, vary='#a04f33', vary_scale=12, bump=0.12, bump_scale=200), 'Z', 300.0, strength=0.25)
M['domeLeadM'] = material('domeLeadM', '#8d9196', 0.45, metallic=0.3)
M['valley'] = material('thessalyValley', '#7e9a4c', 0.9, vary='#718d44', vary_scale=14, bump=0.2, bump_scale=200)
M['oak'] = material('valleyOaks', '#4c6d36', 0.85, vary='#587a3e', vary_scale=16, bump=0.3, bump_scale=90)
M['roadM'] = material('roadM', '#7a7873', 0.8)

S = 0.005               # metres to the tile's units
Z0 = G + 0.004


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


slab('valley', M['valley'], [(-2, -2), (2, -2), (2, 2), (-2, 2)], G - 0.004, Z0, margin=0.02)
road = [(-300.0, -170.0), (-150.0, -150.0), (-60.0, -165.0), (40.0, -135.0), (150.0, -150.0), (260.0, -120.0)]
for k, ((x0, y0), (x1, y1)) in enumerate(zip(road, road[1:])):
    ang = math.atan2(y1 - y0, x1 - x0)
    nx, ny = -math.sin(ang) * 3.0, math.cos(ang) * 3.0
    slab(f'road{k}', M['roadM'], [((x0 - nx) * S, (y0 - ny) * S), ((x1 - nx) * S, (y1 - ny) * S), ((x1 + nx) * S, (y1 + ny) * S), ((x0 + nx) * S, (y0 + ny) * S)], Z0 - 0.001, Z0 + 0.25 * S, margin=0.04)


# ------------------------------------------------------------------ the rock pillars
def pillar(name, x, y, rb, rt, h, seed):
    """A sheer rounded pillar of conglomerate at (x, y), rb metres across its radius at the foot, rt at
    the shoulder, h tall, its sides wavy and its top domed."""
    r_ = random.Random(seed)
    phases = [(r_.uniform(0, 6.3), r_.uniform(0, 6.3), k) for k in (2, 3, 5, 7)]

    def wobble(a, z):
        return 1.0 + sum(0.1 / k ** 0.7 * math.sin(k * a + p1 + 0.012 * z * (1 + k * 0.3)) * math.cos(p2 + 0.02 * z) for p1, p2, k in phases)

    N, RINGS = 64, 26
    bm = bmesh.new()
    rings = []
    for i in range(RINGS + 1):
        t = i / RINGS
        if t < 0.6:
            z = h * t / 0.6 * 0.75
            r = rb + (rt - rb) * (t / 0.6) ** 0.8
        else:
            u = (t - 0.6) / 0.4
            z = h * 0.75 + h * 0.25 * math.sin(u * math.pi / 2)
            r = rt * math.cos(u * math.pi / 2 * 0.94)
        rings.append([bm.verts.new(P(x + r * wobble(2 * math.pi * k / N, z) * math.cos(2 * math.pi * k / N), y + r * wobble(2 * math.pi * k / N, z) * math.sin(2 * math.pi * k / N), z - 2.0)) for k in range(N)])
    for a, b in zip(rings, rings[1:]):
        for k in range(N):
            bm.faces.new((a[k], a[(k + 1) % N], b[(k + 1) % N], b[k]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    for f in bm.faces:
        f.smooth = True
        f.material_index = 1 if f.calc_center_median().z > Z0 + (h * 0.97 - 2.0) * S else 0
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    me.materials.append(M['conglomerate'])
    me.materials.append(M['rockTop'])


def surface(rock, r):
    """The domed top's height (metres) r metres from the middle of a rock, as pillar() draws it."""
    x, y, rb, rt, h = ROCKS[rock]
    u = min(1.0, math.acos(min(1.0, r / rt)) / (0.94 * math.pi / 2))
    return 0.75 * h + 0.25 * h * math.sin(u * math.pi / 2) - 2.0


ROCKS = {
    'greatMeteoron': (-120.0, 85.0, 92.0, 72.0, 215.0),
    'varlaam': (45.0, 115.0, 60.0, 50.0, 185.0),
    'roussanou': (115.0, -35.0, 30.0, 23.0, 140.0),
    'trinity': (-45.0, -80.0, 36.0, 28.0, 150.0),
    'west': (-215.0, -30.0, 46.0, 36.0, 120.0),
    'east': (205.0, 70.0, 50.0, 40.0, 165.0),
    'needle': (10.0, 0.0, 22.0, 15.0, 95.0),
}
for k, (name, (x, y, rb, rt, h)) in enumerate(ROCKS.items()):
    pillar(f'rock_{name}', x, y, rb, rt, h, 100 + k)

# ------------------------------------------------------------------ the monasteries on their tops
WALLS, ROOFS = bmesh.new(), bmesh.new()


def hall(x, y, w, d, h, z0, ang=0.0, rise=3.0, mat=WALLS):
    m = Matrix.Translation(P(x, y, z0 + (h - 4.0) / 2)) @ Matrix.Rotation(ang, 4, 'Z')
    bmesh.ops.create_cube(mat, size=1.0, matrix=m @ Matrix.Diagonal((w * S, d * S, (h + 4.0) * S, 1)))
    top = P(x, y, z0 + h)
    ca, sa = math.cos(ang), math.sin(ang)
    hw, hd = (w / 2 + 0.6) * S, (d / 2 + 0.6) * S
    corners = [(-hw, -hd), (hw, -hd), (hw, hd), (-hw, hd)]
    v = [ROOFS.verts.new((top.x + u * ca - t * sa, top.y + u * sa + t * ca, top.z)) for u, t in corners]
    ridge = [ROOFS.verts.new((top.x + u * ca, top.y + u * sa, top.z + rise * S)) for u in (-hw + hd * 0.6, hw - hd * 0.6)]
    for f in ((v[0], v[1], ridge[1], ridge[0]), (v[2], v[3], ridge[0], ridge[1]), (v[3], v[0], ridge[0]), (v[1], v[2], ridge[1]), (v[3], v[2], v[1], v[0])):
        ROOFS.faces.new(f)


def church(name, x, y, z0, size=1.0):
    hall(x, y, 16.0 * size, 9.0 * size, 9.0 * size, z0, rise=2.5 * size)
    c = P(x, y, z0 + 9.0 * size + 1.2)
    cylinder(name + 'Drum', M['monPlaster'], 2.6 * size * S, 3.5 * size * S, (c.x, c.y, c.z), segs=16)
    lathe(name + 'Dome', M['domeLeadM'], [(r * S, z * S) for r, z in ((2.9 * size, 0.0), (2.6 * size, 1.2 * size), (1.5 * size, 2.6 * size), (0.0, 3.2 * size))], (c.x, c.y, c.z + 3.4 * size * S), segs=16, smooth=True)
    cylinder(name + 'Cross', M['iron'], 0.12 * S, 2.0 * S, (c.x, c.y, c.z + 6.5 * size * S), segs=6)


def rim_buildings(rock, n, h, depth, start=0.0, span=2 * math.pi):
    x, y, rb, rt, H_ = ROCKS[rock]
    r = rt * 0.45
    z0 = surface(rock, r + depth / 2) - 1.0
    for k in range(n):
        a = start + span * (k + 0.5) / n
        hall(x + r * math.cos(a), y + r * math.sin(a), depth, 2 * math.pi * r / n * 0.85, h + rng.uniform(-1.5, 2.5), z0, ang=a)


rim_buildings('greatMeteoron', 5, 14.0, 17.0, start=-2.4, span=2.6)
church('greatMeteoronChurch', -125.0, 85.0, surface('greatMeteoron', 10.0) - 1.0, size=2.1)
hall(-100.0, 102.0, 26.0, 13.0, 12.0, surface('greatMeteoron', 30.0) - 1.0, ang=0.4)
rim_buildings('varlaam', 4, 13.0, 15.0, start=-2.2, span=2.2)
church('varlaamChurch', 45.0, 118.0, surface('varlaam', 6.0) - 1.0, size=1.7)
# Roussanou: the whole top built over, its walls straight up from the cliff edge
x, y, rb, rt, H_ = ROCKS['roussanou']
RZ = surface('roussanou', rt * 0.7) - 5.0
outline = [P(x + rt * 0.7 * math.cos(2 * math.pi * k / 20), y + rt * 0.7 * math.sin(2 * math.pi * k / 20), RZ) for k in range(20)]
bm_ = bmesh.new()
add_prism(bm_, [bm_.verts.new(p) for p in outline], [bm_.verts.new(p + Vector((0, 0, 20.0 * S))) for p in outline])
finish('roussanou', bm_, M['monPlaster'], smooth_sides=False)
lathe('roussanouRoof', M['tilesM'], [(rt * 0.75 * S, 0.0), (rt * 0.4 * S, 4.0 * S), (0.0, 5.0 * S)], P(x, y, RZ + 19.9), segs=20)
church('roussanouChurch', x, y, RZ + 21.0, size=0.9)
RW = []
for k in range(10):
    a = 2 * math.pi * (k + 0.5) / 10
    n = Vector((math.cos(a), math.sin(a), 0))
    p = P(x, y, 0) + n * rt * 0.7 * S * 1.005
    RW.append((p.x, p.y, Z0 + (RZ + 9.0) * S, 1.8 * S, 2.4 * S, (n.x, n.y), 'rect'))
glazed('roussanouWindows', RW, M['monStone'], depth=0.3 * S)
rim_buildings('trinity', 3, 11.0, 12.0, start=-2.2, span=1.8)
church('trinityChurch', -45.0, -78.0, surface('trinity', 4.0) - 1.0, size=1.3)
finish('monasteryWalls', WALLS, M['monStone'], smooth_sides=False)
finish('monasteryRoofs', ROOFS, M['tilesM'], smooth_sides=False)

# ------------------------------------------------------------------ the oaks in the valley, kept off the rocks
oaks = []
for k in range(9000):
    x, y = rng.uniform(-300.0, 300.0), rng.uniform(-300.0, 300.0)
    p = P(x, y, 0)
    if math.hypot(p.x, p.y) > 1.42 or rng.random() > 0.45:
        continue
    if any(math.hypot(x - rx, y - ry) < rb + 6.0 for rx, ry, rb, rt, h in ROCKS.values()):
        continue
    if any(abs(y - (y0 + (y1 - y0) * (x - x0) / (x1 - x0))) < 8.0 for (x0, y0), (x1, y1) in zip(road, road[1:]) if x0 <= x <= x1):
        continue
    r = rng.uniform(0.014, 0.022)
    oaks.append(((p.x, p.y, Z0 + r * 0.75), r, 0.85))
blob_cloud('oaks', M['oak'], oaks)
for k, (x, y, shirt) in enumerate(((-60.0, -160.0, 'red'), (60.0, -138.0, 'blue'), (150.0, -150.0, 'yellow'))):
    c = P(x, y, 0.25)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.6)

render('meteora')

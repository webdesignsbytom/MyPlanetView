# St Stephen's Cathedral, Vienna, in the high-quality look (hq.py), laid out in metres and seen from
# Stephansplatz to the south-west: the great steep roof over the nave patterned in zigzags of green, gold,
# black and white glazed tiles, the lower roof of the choir; the soaring Gothic south tower tapering in
# tiers of gables and pinnacles to its tip; the unfinished north tower under its Renaissance cupola; the
# west front's two Heathen Towers and the Giant's Door between them; the nave's buttresses, tall windows
# and the row of gables along its eaves; the square's paving, and people.
# Run: blender -b --factory-startup -P st-stephens.py -- st-stephens-1024.png 1024 st-stephens.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1147)
M['viennaStone'] = masonry('viennaStone', '#bfb6a3', '#958c7a', scale=240, rough=0.85, vary='#b2a994')
M['viennaLight'] = material('viennaLight', '#cdc5b3', 0.8, vary='#c1b8a5', vary_scale=24, bump=0.08, bump_scale=200)
M['plainRoof'] = banded(material('choirRoof', '#3f4a3f', 0.5, vary='#465245', vary_scale=14, metallic=0.2), 'Z', 380.0, strength=0.2)
M['copperV'] = material('cupolaCopper', '#5b8a74', 0.5, vary='#669580', vary_scale=24, metallic=0.4)
M['platz'] = masonry('stephansplatz', '#c9c2b6', '#a8a195', scale=240, rough=0.8, vary='#bfb8ab')

S = 0.021               # metres to the tile's units
Z0 = G + 0.004


def chevron_roof():
    """The glazed tiles in zigzag bands, green, gold, black and white, running along the roof."""
    mat = material('zigzagTiles', '#d9b23a', 0.35)
    n, l = mat.node_tree.nodes, mat.node_tree.links
    tc = n.new('ShaderNodeTexCoord')
    sep = n.new('ShaderNodeSeparateXYZ')
    l.new(tc.outputs['Object'], sep.inputs['Vector'])

    def op(kind, a, b=None, value=None):
        m = n.new('ShaderNodeMath')
        m.operation = kind
        l.new(a, m.inputs[0])
        if b is not None:
            l.new(b, m.inputs[1])
        elif value is not None:
            m.inputs[1].default_value = value
        return m.outputs[0]
    along = op('MULTIPLY', sep.outputs['X'], value=1.0 / (3.2 * S))            # a zigzag every 3.2 m along the ridge
    tooth = op('MULTIPLY', op('ABSOLUTE', op('SUBTRACT', op('FRACT', along), value=0.5)), value=1.6)
    band = op('ADD', op('MULTIPLY', sep.outputs['Z'], value=1.0 / (2.0 * S)), tooth)
    idx = op('DIVIDE', op('FLOORED_MODULO', op('FLOOR', band), value=4.0), value=4.0)
    ramp = n.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    els = ramp.color_ramp.elements
    for k, c in enumerate(('#2f7a4a', '#d9b23a', '#2a2622', '#ece6d6')):
        el = els[k] if k < 2 else els.new(0.25 * k)
        el.position, el.color = max(0.0, 0.25 * k - 0.05), lin(c)
    l.new(idx, ramp.inputs['Fac'])
    l.new(ramp.outputs['Color'], n['Principled BSDF'].inputs['Base Color'])
    return mat


M['zigzag'] = chevron_roof()
slab('platz', M['platz'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], G - 0.003, Z0, margin=0.02)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


WIN, DOORS = [], []
PIN = bmesh.new()
GAB = bmesh.new()


def pinnacle(x, y, z, h=5.0, r=0.5):
    bmesh.ops.create_cone(PIN, cap_ends=True, segments=8, radius1=r * S, radius2=r * S, depth=h * 0.4 * S, matrix=Matrix.Translation(P(x, y, z + h * 0.2)))
    bmesh.ops.create_cone(PIN, cap_ends=True, segments=8, radius1=r * 1.15 * S, radius2=0.0, depth=h * 0.62 * S, matrix=Matrix.Translation(P(x, y, z + h * 0.4 + h * 0.31 - 0.05)))


def gable(x, y, z, w, h, nx, ny, d=0.5):
    """A pointed ornamental gable (wimperg) on a face with outward normal (nx, ny)."""
    tx, ty = -ny, nx
    tri = [(-w / 2, 0.0), (w / 2, 0.0), (0.0, h)]
    add_prism(GAB, [GAB.verts.new(P(x + tx * u + nx * d, y + ty * u + ny * d, z + v)) for u, v in tri],
              [GAB.verts.new(P(x + tx * u - nx * 0.1, y + ty * u - ny * 0.1, z + v)) for u, v in tri])


# ------------------------------------------------------------------ the nave and choir, their walls, buttresses, windows, eave gables and roofs
NX0, NX1, NW, WALL = -46.0, 18.0, 17.0, 24.0
block('nave', M['viennaStone'], NX0, NX1, -NW, NW, -0.3, WALL)
gable_roof('naveRoof', M['zigzag'], (NX0 - 0.3) * S, (NX1 + 0.3) * S, -(NW + 1.0) * S, (NW + 1.0) * S, Z0 + (WALL - 0.05) * S, 38.0 * S, over=0.0)
CX1, CW = 52.0, 14.5
block('choir', M['viennaStone'], NX1, CX1, -CW, CW, -0.3, WALL)
gable_roof('choirRoofBody', M['plainRoof'], NX1 * S, (CX1 - 6.0) * S, -(CW + 1.0) * S, (CW + 1.0) * S, Z0 + (WALL - 0.05) * S, 30.0 * S, over=0.0)
lathe('apse', M['viennaStone'], [(CW * S, 0.0), (CW * S, (WALL + 0.3) * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(CX1 - 6.0, 0.0, -0.3)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
lathe('apseRoof', M['plainRoof'], [((CW + 1.0) * S, 0.0), (0.0, 30.0 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(CX1 - 6.0, 0.0, WALL)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
for side in (-1, 1):
    for k, x in enumerate([NX0 + 4.0 + 8.0 * i for i in range(12)]):
        wall_y = side * (NW if x < NX1 else CW)
        if abs(x - 8.0) < 9.0 or abs(x + 4.0 - 8.0) < 9.0:      # where the towers stand against the walls
            continue
        block(f'buttress{side}_{k}', M['viennaStone'], x - 0.9, x + 0.9, *sorted((wall_y, wall_y + side * 2.6)), -0.3, WALL - 2.0)
        pinnacle(x, wall_y + side * 1.3, WALL - 2.0, h=7.0, r=0.6)
        if k < 11:
            c = P(x + 4.0, wall_y + side * 0.05, 0)
            WIN.append((c.x, c.y, Z0 + 5.0 * S, 3.0 * S, 15.0 * S, (0, side), 'pointed'))
            gable(x + 4.0, wall_y, WALL - 0.5, 6.0, 7.0, 0, side)
for k in range(8):
    a = math.pi / 8 + 2 * math.pi * k / 8
    if math.cos(a) > 0.1:
        c = P(CX1 - 6.0 + (CW - 0.6) * math.cos(a), (CW - 0.6) * math.sin(a), 0)
        WIN.append((c.x, c.y, Z0 + 5.0 * S, 3.0 * S, 15.0 * S, (math.cos(a), math.sin(a)), 'pointed'))

# ------------------------------------------------------------------ the west front: the Giant's Door between the Heathen Towers
block('westFront', M['viennaStone'], NX0 - 6.0, NX0, -12.0, 12.0, -0.3, 30.0)
bm = bmesh.new()
tri = [(-12.0, 30.0), (12.0, 30.0), (0.0, 44.0)]
add_prism(bm, [bm.verts.new(P(NX0 - 6.0, u, v)) for u, v in tri], [bm.verts.new(P(NX0 + 0.5, u, v)) for u, v in tri])
finish('westGable', bm, M['viennaStone'], smooth_sides=False)
block('giantsDoorPorch', M['viennaLight'], NX0 - 9.0, NX0 - 6.0, -4.5, 4.5, -0.3, 11.0)
c = P(NX0 - 9.05, 0.0, 0)
DOORS.append((c.x, c.y, Z0 - 0.3 * S, 4.6 * S, 8.0 * S, (-1, 0), 'round'))
c = P(NX0 - 6.05, 0.0, 0)
WIN.append((c.x, c.y, Z0 + 16.0 * S, 4.0 * S, 10.0 * S, (-1, 0), 'pointed'))
for side in (-1, 1):
    hx, hy = NX0 - 4.0, side * 9.0
    lathe(f'heathenTower{side}', M['viennaStone'], [(4.2 * S, 0.0), (4.2 * S, 34.0 * S), (3.6 * S, 34.0 * S), (3.6 * S, 52.0 * S)], (0, 0, 0), segs=8,
          matrix=Matrix.Translation(P(hx, hy, -0.3)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
    lathe(f'heathenRoof{side}', M['plainRoof'], [(4.0 * S, 0.0), (0.0, 13.0 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(hx, hy, 51.7)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
    for k in range(8):
        a = 2 * math.pi * k / 8
        if math.cos(a) < 0.5:
            c = P(hx + 3.35 * math.cos(a), hy + 3.35 * math.sin(a), 0)
            WIN.append((c.x, c.y, Z0 + 40.0 * S, 1.4 * S, 6.0 * S, (math.cos(a), math.sin(a)), 'round'))

# ------------------------------------------------------------------ the south tower, tapering in tiers of gables and pinnacles to its tip
TX, TY = 8.0, -NW - 7.0
STAGES = ((0.0, 30.0, 7.0), (30.0, 50.0, 6.0), (50.0, 66.0, 5.2))
for k, (z0, z1, h) in enumerate(STAGES):
    block(f'southTower{k}', M['viennaStone'], TX - h, TX + h, TY - h, TY + h, z0 - 0.3, z1)
    for sx in (-1, 1):
        for sy in (-1, 1):
            pinnacle(TX + sx * (h - 0.5), TY + sy * (h - 0.5), z1, h=7.0, r=0.6)
    for nx, ny in ((0, -1), (-1, 0), (1, 0), (0, 1)):
        gable(TX + nx * h, TY + ny * h, z1 - 0.5, h * 1.3, 6.0, nx, ny, d=0.6)
        c = P(TX + nx * (h + 0.05), TY + ny * (h + 0.05), 0)
        WIN.append((c.x, c.y, Z0 + (z0 + 3.0) * S, 1.8 * S, (z1 - z0 - 7.0) * S, (nx, ny), 'pointed'))
lathe('southOctagon', M['viennaStone'], [(5.0 * S, 0.0), (4.4 * S, 18.0 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(TX, TY, 66.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
for k in range(8):
    a = 2 * math.pi * k / 8
    gable(TX + 4.4 * math.cos(a), TY + 4.4 * math.sin(a), 82.0, 3.4, 5.0, math.cos(a), math.sin(a), d=0.5)
    pinnacle(TX + 4.9 * math.cos(a + math.pi / 8), TY + 4.9 * math.sin(a + math.pi / 8), 82.0, h=6.0, r=0.45)
    c = P(TX + 4.55 * math.cos(a), TY + 4.55 * math.sin(a), 0)
    WIN.append((c.x, c.y, Z0 + 69.0 * S, 1.4 * S, 11.0 * S, (math.cos(a), math.sin(a)), 'pointed'))
lathe('southSpire', M['viennaStone'], [(4.3 * S, 0.0), (2.0 * S, 28.0 * S), (0.6 * S, 48.0 * S), (0.0, 52.0 * S)], (0, 0, 0), segs=8,
      matrix=Matrix.Translation(P(TX, TY, 84.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
for tier in range(6):
    z = 88.0 + 7.5 * tier
    r = 4.3 - (4.3 - 0.6) * (z - 84.0) / 48.0 + 0.3
    for k in range(4):
        a = math.pi / 8 + k * math.pi / 2 + tier * math.pi / 4
        pinnacle(TX + r * math.cos(a), TY + r * math.sin(a), z, h=3.0, r=0.3)
lathe('southFinial', M['gold'], [(0.0, 0.0), (0.4 * S, 0.5 * S), (0.0, 2.4 * S)], P(TX, TY, 135.6), segs=8, smooth=True)

# ------------------------------------------------------------------ the unfinished north tower under its Renaissance cupola
UX, UY, UH = 8.0, NW + 6.5, 6.5
block('northTower', M['viennaStone'], UX - UH, UX + UH, UY - UH, UY + UH, -0.3, 60.0)
for z in (30.0, 59.4):
    block(f'northBand{z:.0f}', M['viennaLight'], UX - UH - 0.3, UX + UH + 0.3, UY - UH - 0.3, UY + UH + 0.3, z, z + 0.8, bevel=0)
cylinder('cupolaDrum', M['viennaLight'], 4.6 * S, 3.0 * S, P(UX, UY, 60.2), segs=16)
lathe('cupola', M['copperV'], [(5.2 * S, 0.0), (4.8 * S, 2.4 * S), (3.0 * S, 4.6 * S), (1.2 * S, 5.6 * S), (1.0 * S, 5.8 * S)], P(UX, UY, 63.2), segs=24, smooth=True)
cylinder('cupolaLantern', M['copperV'], 1.0 * S, 2.6 * S, P(UX, UY, 69.0), segs=12)
lathe('cupolaTop', M['copperV'], [(1.3 * S, 0.0), (0.0, 3.0 * S)], P(UX, UY, 71.6), segs=12)
lathe('cupolaOrb', M['gold'], [(0.0, 0.0), (0.35 * S, 0.3 * S), (0.0, 0.9 * S)], P(UX, UY, 74.4), segs=8, smooth=True)
for nx, ny in ((0, 1), (-1, 0), (1, 0), (0, -1)):
    c = P(UX + nx * (UH + 0.05), UY + ny * (UH + 0.05), 0)
    WIN.append((c.x, c.y, Z0 + 36.0 * S, 2.4 * S, 16.0 * S, (nx, ny), 'pointed'))
finish('pinnacles', PIN, M['viennaLight'], smooth_sides=False)
finish('gables', GAB, M['viennaLight'], smooth_sides=False)
glazed('windows', WIN, M['viennaLight'], depth=0.3 * S)
glazed('doors', DOORS, M['viennaLight'], glass=M['door'], depth=0.3 * S)
for k, (x, y, shirt) in enumerate(((-30.0, -34.0, 'red'), (-10.0, -40.0, 'blue'), (24.0, -30.0, 'yellow'), (-58.0, -10.0, 'green'), (-60.0, 12.0, 'red'), (36.0, -26.0, 'blue'), (-44.0, -28.0, 'yellow'))):
    c = P(x, y, 0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=Z0, scale=0.65)

R = Matrix.Rotation(math.radians(-32.0 + 22.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('st-stephens')

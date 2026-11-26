# Venice in the high-quality look (hq.py), St Mark's seen from the lagoon, laid out in metres as it
# stands: the Doge's Palace on the water, its open portico of pointed arches on stout columns, the
# loggia of slender arches and quatrefoils above it, the upper wall of pink and white lozenges with its
# great pointed windows and the balcony, the white cresting and the lead roofs round its courtyard; the
# Piazzetta's two granite columns by the water, the winged lion on one and the saint on the other (the
# scanned lion of St Mark on its column, 3mc, CC BY 4.0, and a scanned saint with his beast at his
# feet, noe-3d.at, CC BY 4.0, in _sources/); St Mark's Campanile in red brick, its open white belfry,
# its attic and its green spire; St Mark's Basilica behind, its five portals with their gold mosaics
# and coloured columns, the upper arches crowned by gilded ogees and pinnacles, and its five lead domes
# with their lanterns; the three flagpoles of the Piazza; the Molo's Istrian kerb, the Rio di Palazzo
# and the Ponte della Paglia; gondolas and their striped poles on the lagoon, and people.
# Run: blender -b --factory-startup -P venice.py -- venice-1024.png 1024 venice.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='water')
rng = random.Random(1173)
M['istria'] = material('istrianStoneV', '#ece6da', 0.5, vary='#ddd6c8', vary_scale=20, bump=0.08, bump_scale=150)
M['laguna'] = material('laguna', '#3f8a86', 0.06, vary='#4a968f', vary_scale=3, coat=0.6, bump=0.12, bump_scale=40)
M['piazza'] = masonry('piazzaTrachyte', '#8f8b85', '#dcd6ca', scale=40, rough=0.8, vary='#84807a')
M['marbleSM'] = material('sanMarcoMarble', '#e3d6c0', 0.55, vary='#d3c4ab', vary_scale=16, bump=0.08, bump_scale=150)
M['brickV'] = masonry('campanileBrick', '#b0533a', '#93462f', scale=240, rough=0.8, vary='#a34c35')
M['domeLead'] = material('domeLead', '#a3a8a9', 0.45, vary='#939899', vary_scale=10, bump=0.05, metallic=0.3)
M['mosaic'] = material('mosaicGold', '#dcab45', 0.3, vary='#b98b30', vary_scale=60, metallic=0.8, bump=0.1, bump_scale=400)
M['verde'] = material('verdeAntico', '#3e6b58', 0.3)
M['porphyry'] = material('porphyry', '#7c3a35', 0.3)
M['granite'] = material('graniteV', '#8d8682', 0.45, vary='#9c8a84', vary_scale=40, bump=0.05, bump_scale=300)
M['gondola'] = material('gondolaBlack', '#1b1c1f', 0.3, coat=0.6)
M['poleBlue'] = material('poleBlue', '#2f5d9a', 0.5)
M['leadRoof'] = material('dogeLead', '#9ca2a4', 0.45, vary='#8e9496', vary_scale=10, bump=0.05, metallic=0.25)
M['flagRed'] = material('flagRed', '#b3262a', 0.7)

S = 0.0155              # metres to the tile's units
Z0 = G + 0.002          # the lagoon
QZ = 1.2                # the quays above the water (metres)
ZP = Z0 + QZ * S        # the paving
OX, OY = 20.0, 50.0     # the point (metres east and north of the palace's south-west corner) at the tile's middle


def T(x, y):
    return ((x - OX) * S, (y - OY) * S)


def P(x, y, z):
    """A point x metres east and y north of the palace's south-west corner, z metres above the paving."""
    return Vector(((x - OX) * S, (y - OY) * S, ZP + z * S))


def poly(pts):
    return [T(x, y) for x, y in pts]


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0):
    """A box from x0..x1, y0..y1, z0..z1 (metres)."""
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def lozenge(name, base, line, cell, width=0.13):
    """A wall of diamonds: lines of `line` running both ways at 45 degrees, `cell` metres apart, on any
    upright face along x or y (the Doge's Palace's pink and white marble)."""
    mat = material(name, base, 0.65, bump=0.05, bump_scale=160)
    nt = mat.node_tree
    n, l = nt.nodes, nt.links
    coord = n.new('ShaderNodeTexCoord')
    sep = n.new('ShaderNodeSeparateXYZ')
    l.new(coord.outputs['Object'], sep.inputs['Vector'])

    def op(kind, a, b):
        m = n.new('ShaderNodeMath')
        m.operation = kind
        for k, v in enumerate((a, b)):
            if isinstance(v, float):
                m.inputs[k].default_value = v
            else:
                l.new(v, m.inputs[k])
        return m.outputs[0]

    h = op('ADD', sep.outputs['X'], sep.outputs['Y'])
    lines = []
    for kind in ('ADD', 'SUBTRACT'):
        d = op('MULTIPLY', op(kind, h, sep.outputs['Z']), 1.0 / (cell * S))
        lines.append(op('LESS_THAN', op('FRACT', d, 0.0), width))
    ramp = n.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = lin(base)
    ramp.color_ramp.elements[1].position = 0.5
    ramp.color_ramp.elements[1].color = lin(line)
    l.new(op('MAXIMUM', lines[0], lines[1]), ramp.inputs['Fac'])
    l.new(ramp.outputs['Color'], n['Principled BSDF'].inputs['Base Color'])
    return mat


M['lozenge'] = lozenge('dogePink', '#e4ad9c', '#f5ebe1', 1.7)

# ------------------------------------------------------------------ the lagoon, the Rio di Palazzo, the paving and its kerbs
slab('lagoon', M['laguna'], poly([(-200, -200), (300, -200), (300, -22), (-200, -22)]), G - 0.004, Z0, margin=0.02)
slab('rio', M['laguna'], poly([(72, -22), (80, -22), (80, 300), (72, 300)]), G - 0.004, Z0, margin=0.02)
slab('pavingWest', M['piazza'], poly([(-200, -22), (72, -22), (72, 300), (-200, 300)]), G - 0.004, ZP, bevel=0.002, margin=0.02)
slab('pavingEast', M['piazza'], poly([(80, -22), (300, -22), (300, 300), (80, 300)]), G - 0.004, ZP, bevel=0.002, margin=0.02)
for name, pts in (('kerbMolo', [(-200, -22.3), (72.3, -22.3), (72.3, -21.5), (-200, -21.5)]),
                  ('kerbRioWest', [(71.5, -11.0), (72.3, -11.0), (72.3, 300), (71.5, 300)]),
                  ('kerbRioEast', [(79.7, -11.0), (80.5, -11.0), (80.5, 300), (79.7, 300)]),
                  ('kerbRiva', [(79.7, -22.3), (300, -22.3), (300, -21.5), (79.7, -21.5)])):
    slab(name, M['istria'], poly(pts), Z0 - 0.05 * S, ZP + 0.12 * S, margin=0.021)
LINE = (ZP - 0.002, ZP + 0.06 * S)
for k, x in enumerate(range(-84, -3, 9)):
    slab(f'lineNS{k}', M['istria'], poly([(x - 0.3, -21.5), (x + 0.3, -21.5), (x + 0.3, 140.0), (x - 0.3, 140.0)]), *LINE, margin=0.03)
for k, y in enumerate(range(-13, 140, 9)):
    x1 = -3.0 if y > 70 else (72.0 if y < 0 else 0.0)
    slab(f'lineEW{k}', M['istria'], poly([(-90.0, y - 0.3), (x1, y - 0.3), (x1, y + 0.3), (-90.0, y + 0.3)]), *LINE, margin=0.03)
# the Ponte della Paglia over the Rio, along the Molo
deck = lambda x: 1.3 * math.cos(math.pi * (x - 76.0) / 11.0)
prof = [(70.5, -0.2), (72.0, -0.2)] + [(72.0 + 8.0 * k / 12, -QZ - 0.1 + 2.6 * math.sin(math.pi * k / 12)) for k in range(13)] + [(80.0, -0.2), (81.5, -0.2)]
prof += [(x, deck(x)) for x in [81.5 - 11.0 * k / 16 for k in range(17)]]
bm = bmesh.new()
add_prism(bm, [bm.verts.new(P(x, -19.0, z)) for x, z in prof], [bm.verts.new(P(x, -11.0, z)) for x, z in prof])
finish('pontePaglia', bm, M['istria'], smooth_sides=False)
for y0 in (-19.0, -11.4):
    pts = [(70.5, deck(70.5) - 0.1)] + [(x, deck(x) + 1.0) for x in [70.5 + 11.0 * k / 16 for k in range(17)]] + [(81.5, deck(81.5) - 0.1)]
    bm = bmesh.new()
    add_prism(bm, [bm.verts.new(P(x, y0, z)) for x, z in pts], [bm.verts.new(P(x, y0 + 0.4, z)) for x, z in pts])
    finish(f'pagliaParapet{y0}', bm, M['istria'], smooth_sides=False)


# ------------------------------------------------------------------ the Doge's Palace
def facade(o, d):
    """A frame on a façade: o its start (metres), d its direction along it; v runs inwards."""
    nx, ny = -d[1], d[0]
    return lambda u, v, z: P(o[0] + d[0] * u + nx * v, o[1] + d[1] * u + ny * v, z)


def along(name, mat, F, u0, u1, v0, v1, z0, z1, bevel=0.0):
    """A box along a façade, from u0..u1 along it, v0..v1 into it, z0..z1 up."""
    a, b = F(u0, v0, z0), F(u1, v1, z1)
    return box(name, mat, (a + b) / 2, (abs(b.x - a.x), abs(b.y - a.y), b.z - a.z), bevel=bevel)


CREST = bmesh.new()
WIN, BALCONIES = [], []


def doge_front(key, o, d, length, bays, windows_u, balcony_u, corner_first):
    """One of the palace's fronts. The front that turns the corner first (`corner_first`) carries its
    floor, balustrade and cornice round it; the other stops them short of it."""
    F = facade(o, d)
    lead, stop = (-0.3, 0.0) if corner_first else (0.0, 1.0)
    out = Vector((d[1], -d[0], 0))                      # the façade's outward normal
    bay = length / bays
    # the portico: pointed arches on stout columns, its ceiling the loggia's floor
    arcade_path(key + 'Portico', M['istria'], [tuple(F(k * bay, -0.1, 0).xy) for k in range(bays + 1)], 1.3 * S, ZP + 3.9 * S, 3.85 * S, bay * 0.41 * S, pointed=1.3)
    for k in range(bays + 1):
        c = F(k * bay, 0.55, 0)
        column(f'{key}Column{k}', M['istria'], c.x, c.y, ZP - 0.05 * S, 3.95 * S, 0.42 * S)
    along(key + 'LoggiaFloor', M['istria'], F, lead, length - stop * 5.0, -0.3, 5.0, 7.7, 8.1)
    # the loggia: a balustrade, slender columns, pointed arches, and a quatrefoil over every column
    along(key + 'Balustrade', M['istria'], F, 0, length - stop * 0.3, 0.0, 0.3, 8.05, 9.1)
    arcade_path(key + 'Loggia', M['istria'], [tuple(F(k * bay / 2, -0.1, 0).xy) for k in range(2 * bays + 1)], 0.7 * S, ZP + 11.2 * S, 3.3 * S, bay * 0.2 * S, pointed=1.4)
    turn = Vector((0, 0, 1)).rotation_difference(out).to_matrix().to_4x4()
    for k in range(2 * bays + 1):
        c = F(k * bay / 2, 0.25, 0)
        column(f'{key}LoggiaColumn{k}', M['istria'], c.x, c.y, ZP + 9.05 * S, 2.2 * S, 0.2 * S)
        annulus(f'{key}Quatrefoil{k}', M['istria'], 0.62 * S, 0.4 * S, 0.0, 0.15 * S, segs=16, matrix=Matrix.Translation(F(k * bay / 2, -0.1, 13.55)) @ turn)
    # the upper wall's great pointed windows and the balcony's tall one
    for u in windows_u:
        c = F(u, 0.0, 0)
        WIN.append((c.x, c.y, ZP + 16.0 * S, 3.0 * S, 6.2 * S, (out.x, out.y), 'pointed'))
    along(key + 'BalconySurround', M['istria'], F, balcony_u - 3.0, balcony_u + 3.0, -0.3, 0.2, 14.9, 24.3)
    c = F(balcony_u, -0.3, 0)
    WIN.append((c.x, c.y, ZP + 15.9 * S, 3.4 * S, 7.6 * S, (out.x, out.y), 'pointed'))
    along(key + 'Balcony', M['istria'], F, balcony_u - 2.6, balcony_u + 2.6, -1.4, -0.3, 15.0, 15.5)
    along(key + 'BalconyRail', M['istria'], F, balcony_u - 2.6, balcony_u + 2.6, -1.4, -1.2, 15.5, 16.4)
    c = F(balcony_u, -0.05, 24.3)
    spire(key + 'BalconySpire', M['istria'], c.x, c.y, c.z, 0.9 * S, 4.5 * S, segs=8)
    # the cornice, and the cresting of little white merlons along the top
    along(key + 'Cornice', M['istria'], F, lead, length - stop * 0.3, -0.25, 0.3, 24.6, 25.1)
    for k in range(int((length - stop * 1.2) / 1.8) + 1):
        c = F(0.4 + 1.8 * k, 0.0, 25.05)
        bmesh.ops.create_cube(CREST, size=1.0, matrix=Matrix.Translation(c + Vector((0, 0, 0.45 * S))) @ Matrix.Diagonal((0.6 * S, 0.6 * S, 0.9 * S, 1)))
        bmesh.ops.create_cone(CREST, cap_ends=True, segments=4, radius1=0.45 * S, radius2=0.0, depth=0.9 * S, matrix=Matrix.Translation(c + Vector((0, 0, 1.35 * S))) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))


# the two fronts: along the lagoon (south, 71 m, 17 arches) and along the Piazzetta (west, 75 m, 18 arches)
doge_front('south', (0.0, 0.0), (1.0, 0.0), 71.0, 17, (7.0, 15.0, 23.0, 52.0, 60.0, 66.5), 39.0, True)
doge_front('west', (0.0, 75.0), (0.0, -1.0), 75.0, 18, (7.0, 15.0, 23.0, 30.0, 52.0, 60.0, 67.5), 40.5, False)
finish('cresting', CREST, M['istria'], smooth_sides=False)
glazed('dogeWindows', WIN, M['istria'], depth=0.3 * S, bars=False)
# the wings round the courtyard: the walls behind the portico and the loggia, the lozenged upper walls
block('southLower', M['istria'], 5.0, 71.0, 5.0, 24.0, -0.05, 14.45)
block('westLower', M['istria'], 5.0, 22.0, 24.0, 75.0, -0.05, 14.45)
block('southUpper', M['lozenge'], 0.0, 71.0, 0.0, 24.0, 14.4, 25.0)
block('westUpper', M['lozenge'], 0.0, 22.0, 24.0, 75.0, 14.4, 25.0)
block('eastWing', M['istria'], 53.0, 71.0, 24.0, 75.0, -0.05, 25.0)
block('northWing', M['istria'], 22.0, 53.0, 57.0, 75.0, -0.05, 25.0)
# the lead roofs, each wing's ridge along it, meeting the lagoon wing's under its ridge
for name, x0, x1, y0, y1, way in (('south', 0.0, 71.0, 0.0, 24.0, 'x'), ('west', 0.0, 22.0, 12.0, 75.0, 'y'),
                                  ('east', 53.0, 71.0, 12.0, 75.0, 'y'), ('north', 11.0, 62.0, 57.0, 75.0, 'x')):
    gable_roof(name + 'Roof', M['leadRoof'], (x0 - OX) * S, (x1 - OX) * S, (y0 - OY) * S, (y1 - OY) * S, ZP + 24.95 * S, 7.0 * S, over=0.0, along=way)


# ------------------------------------------------------------------ the Piazzetta's columns: the lion of St Mark, and the saint
BASE, SHAFT, CAPITAL, BEAST = range(4)


def piazzetta_column(name, x, y, height, lion):
    """The scanned column (Verona's, its lion on top) stood `height` metres tall at (x, y): stone base,
    granite shaft, white capital, the bronze lion, or the column alone to carry a saint."""
    ob = import_model('lion-of-st-mark', name)
    me = ob.data
    zs = [v.co.z for v in me.vertices]
    zmin, zmax = min(zs), max(zs)
    shaft = [v.co for v in me.vertices if 4.0 < v.co.z < 8.0]
    cx = (min(c.x for c in shaft) + max(c.x for c in shaft)) / 2
    cy = (min(c.y for c in shaft) + max(c.y for c in shaft)) / 2
    bm = bmesh.new()
    bm.from_mesh(me)
    if not lion:
        cut = bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 9.71), plane_no=(0, 0, 1), clear_outer=True)
        bmesh.ops.holes_fill(bm, edges=[e for e in cut['geom_cut'] if isinstance(e, bmesh.types.BMEdge)], sides=0)
    for f in bm.faces:
        z = f.calc_center_median().z
        f.material_index = BASE if z < 2.5 else SHAFT if z < 8.5 else CAPITAL if z < 9.71 else BEAST
        f.smooth = True
    bm.to_mesh(me)
    bm.free()
    me.materials.clear()
    for m in (M['istria'], M['granite'], M['istria'], M['bronze']):
        me.materials.append(m)
    k = height * S / (zmax - zmin)
    base = P(x, y, -0.05)
    me.transform(Matrix.Translation(base) @ Matrix.Scale(k, 4) @ Matrix.Translation((-cx, -cy, -zmin)))
    return base.z + (9.71 - zmin) * k


piazzetta_column('lionColumn', -8.0, -14.0, 18.0, True)
top = piazzetta_column('theodoreColumn', -36.0, -14.0, 18.0, False)
saint = import_model('st-mark-statue', 'theodore')
stand_sourced(saint, cut=0.0, turn=0.0, height=3.8 * S, z=top, mat=M['whiteMarble'], report=False)
saint.data.transform(Matrix.Translation((*T(-36.0, -14.0), 0.0)))

# ------------------------------------------------------------------ St Mark's Campanile
CX, CY = -22.0, 80.0
block('campanilePlinth', M['istria'], CX - 6.6, CX + 6.6, CY - 6.6, CY + 6.6, -0.05, 1.85)
block('campanileShaft', M['brickV'], CX - 6.0, CX + 6.0, CY - 6.0, CY + 6.0, 1.8, 50.05)
for sx in (-1, 1):
    for sy in (-1, 1):
        x0, x1 = sorted((CX + sx * 5.05, CX + sx * 6.25))
        y0, y1 = sorted((CY + sy * 5.05, CY + sy * 6.25))
        block(f'campanileCorner{sx}{sy}', M['brickV'], x0, x1, y0, y1, 1.8, 48.0)
for u in (-2.8, 0.0, 2.8):
    block(f'lesenaS{u}', M['brickV'], CX + u - 0.3, CX + u + 0.3, CY - 6.25, CY - 5.9, 1.8, 48.0)
    block(f'lesenaN{u}', M['brickV'], CX + u - 0.3, CX + u + 0.3, CY + 5.9, CY + 6.25, 1.8, 48.0)
    block(f'lesenaW{u}', M['brickV'], CX - 6.25, CX - 5.9, CY + u - 0.3, CY + u + 0.3, 1.8, 48.0)
    block(f'lesenaE{u}', M['brickV'], CX + 5.9, CX + 6.25, CY + u - 0.3, CY + u + 0.3, 1.8, 48.0)
block('campanileTopBand', M['brickV'], CX - 6.4, CX + 6.4, CY - 6.4, CY + 6.4, 47.9, 50.1)
# the belfry: four open arches a side between corner piers, its bells inside
block('belfryFloor', M['istria'], CX - 6.6, CX + 6.6, CY - 6.6, CY + 6.6, 50.0, 50.8)
for sx in (-1, 1):
    for sy in (-1, 1):
        block(f'belfryPier{sx}{sy}', M['istria'], CX + sx * 5.2 - 0.9, CX + sx * 5.2 + 0.9, CY + sy * 5.2 - 0.9, CY + sy * 5.2 + 0.9, 50.75, 60.4)
for side, (o, d) in enumerate((((CX - 5.2, CY - 6.0), (1, 0)), ((CX + 6.0, CY - 5.2), (0, 1)), ((CX + 5.2, CY + 6.0), (-1, 0)), ((CX - 6.0, CY + 5.2), (0, -1)))):
    F = facade(o, d)
    arcade_path(f'belfryArches{side}', M['istria'], [tuple(F(2.6 * k, 0.0, 0).xy) for k in range(5)], 1.0 * S, ZP + 55.6 * S, 4.8 * S, 1.0 * S)
    for k in (1, 2, 3):
        c = F(2.6 * k, 0.5, 0)
        column(f'belfryColumn{side}{k}', M['istria'], c.x, c.y, ZP + 50.75 * S, 4.9 * S, 0.3 * S)
lathe('bell', M['bronze'], [(r * S, z * S) for r, z in ((1.3, 0.0), (1.2, 0.3), (0.8, 1.2), (0.75, 2.0), (0.3, 2.3), (0.0, 2.35))], P(CX, CY, 53.2), segs=24, smooth=True)
block('belfryEntablature', M['istria'], CX - 6.6, CX + 6.6, CY - 6.6, CY + 6.6, 60.3, 61.0)
block('attic', M['istria'], CX - 5.8, CX + 5.8, CY - 5.8, CY + 5.8, 60.95, 67.6)
for name, x0, x1, y0, y1 in (('S', CX - 3.0, CX + 3.0, CY - 5.95, CY - 5.75), ('W', CX - 5.95, CX - 5.75, CY - 3.0, CY + 3.0)):
    block('atticPanel' + name, M['marbleSM'], x0, x1, y0, y1, 62.0, 66.6)
block('atticCornice', M['istria'], CX - 6.3, CX + 6.3, CY - 6.3, CY + 6.3, 67.5, 68.3)
lathe('campanileSpire', M['copperGreen'], [(r * S, z * S) for r, z in ((5.6 * math.sqrt(2), 0.0), (0.0, 27.3))], (0, 0, 0), segs=4,
      matrix=Matrix.Translation(P(CX, CY, 68.25)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'spirePinnacle{sx}{sy}', M['copperGreen'], [(0.8 * S, 0.0), (0.0, 3.6 * S)], P(CX + sx * 5.6, CY + sy * 5.6, 68.25), segs=4)
lathe('spireFinial', M['gold'], [(0.0, 0.0), (0.6 * S, 0.5 * S), (0.6 * S, 1.3 * S), (0.0, 1.8 * S)], P(CX, CY, 95.3), segs=12, smooth=True)
cylinder('spireSpike', M['gold'], 0.12 * S, 1.6 * S, P(CX, CY, 97.0), segs=6, r2=0.0)

# ------------------------------------------------------------------ St Mark's Basilica, its front on the Piazza (facing west)
BX = -3.0                       # the front
SPANS = [(77.0, 86.5), (87.5, 96.5), (97.5, 110.5), (111.5, 120.5), (121.5, 131.0)]
block('basilicaBase', M['marbleSM'], BX, 57.0, 76.0, 132.0, -0.05, 16.0)
# the five portals: a white archivolt round a gold mosaic, bronze doors below, coloured columns either side
PORTALS, DOORS, MOSAICS = [], [], []
for k, (y0, y1) in enumerate(SPANS):
    yc, w = (y0 + y1) / 2, (8.0 if k == 2 else 6.0)
    h = 13.0 if k == 2 else 11.0
    c = P(BX, yc, 0)
    MOSAICS.append((c.x, c.y, ZP + 0.2 * S, w * S, h * S, (-1, 0), 'round'))
    DOORS.append((c.x - 0.15 * S, c.y, ZP - 0.05 * S, w * 0.62 * S, h * 0.45 * S, (-1, 0), 'rect'))
    for side in (-1, 1):
        for j, mat in enumerate(('verde', 'porphyry', 'marbleSM')):
            cylinder(f'portalColumn{k}{side}{j}', M[mat], 0.32 * S, (h - w / 2 + 0.3) * S, P(BX - 0.45 - 0.5 * j, yc + side * (w / 2 + 1.0 + 0.75 * j), -0.05), segs=10)
glazed('portals', MOSAICS, M['marbleSM'], glass=M['mosaic'], depth=0.4 * S)
windows('portalDoors', M['bronze'], DOORS, depth=0.5 * S)
block('terraceRail', M['istria'], BX - 0.4, BX + 0.2, 76.0, 132.0, 15.95, 17.2)


def ogee(y0, y1, zs, rise, n=10):
    """An ogee crown over the span y0..y1 springing at zs: up, out, in and to a point `rise` above."""
    half, yc = (y1 - y0) / 2, (y0 + y1) / 2
    # a cubic from the springing to the point, leaving the one and reaching the other straight up
    ctrl = ((1.0, 0.0), (1.0, 0.55), (0.0, 0.45), (0.0, 1.0))
    left = []
    for j in range(n + 1):
        t = j / n
        w = ((1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t * t, t ** 3)
        s = sum(wk * c[0] for wk, c in zip(w, ctrl))
        z = sum(wk * c[1] for wk, c in zip(w, ctrl))
        left.append((yc - half * s, zs + rise * z))
    return left + [(2 * yc - y, z) for y, z in reversed(left[:-1])]


# the upper register: five arches whose ogees make the skyline, gold mosaics in the four, the window in the middle
crown = lambda k: ogee(SPANS[k][0], SPANS[k][1], 22.5 + (SPANS[k][1] - SPANS[k][0]) / 2, 7.5 if k == 2 else 6.0)
sky = [p for k in range(len(SPANS)) for p in crown(k)]
sky = [(76.0, 15.8), (76.0, sky[0][1])] + sky + [(132.0, sky[-1][1]), (132.0, 15.8)]
bm = bmesh.new()
add_prism(bm, [bm.verts.new(P(BX + 2.0, y, z)) for y, z in sky], [bm.verts.new(P(BX + 9.0, y, z)) for y, z in sky])
finish('upperRegister', bm, M['marbleSM'], smooth_sides=False)
UPPER, UPPERWIN = [], []
for k, (y0, y1) in enumerate(SPANS):
    half, yc = (y1 - y0) / 2, (y0 + y1) / 2
    c = P(BX + 2.0, yc, 0)
    w = y1 - y0 - 1.8
    (UPPERWIN if k == 2 else UPPER).append((c.x, c.y, ZP + 17.0 * S, w * S, (5.5 + w / 2) * S, (-1, 0), 'round'))
    tube(f'crockets{k}', M['gold'], [P(BX + 1.85, y, z) for y, z in crown(k)], 0.28 * S)
    apex = max(crown(k), key=lambda p: p[1])
    c = P(BX + 2.4, apex[0], apex[1])
    lathe(f'crownFinial{k}', M['gold'], [(0.0, 0.0), (0.5 * S, 0.6 * S), (0.3 * S, 1.6 * S), (0.0, 2.6 * S)], c, segs=10, smooth=True)
glazed('upperMosaics', UPPER, M['istria'], glass=M['mosaic'], depth=0.4 * S)
glazed('upperWindow', UPPERWIN, M['istria'], depth=0.4 * S, bars=False)
for k, y in enumerate((76.6, 87.0, 97.0, 111.0, 121.0, 131.4)):
    c = P(BX + 2.6, y, 0)
    block(f'pinnacleBase{k}', M['istria'], BX + 1.9, BX + 3.3, y - 0.7, y + 0.7, 15.9, 27.0)
    spire(f'pinnacle{k}', M['istria'], c.x, c.y, ZP + 27.0 * S, 0.8 * S, 5.5 * S, segs=8)
# the body behind: its aisles, the arms of its cross, its drums and its five domes
block('aisles', M['marbleSM'], 9.0, 56.5, 76.5, 131.5, 15.9, 22.0)
block('nave', M['marbleSM'], 9.0, 56.5, 94.0, 114.0, 21.9, 26.9)
block('transept', M['marbleSM'], 22.0, 42.0, 76.0, 132.0, 21.9, 27.0)
for name, x, y, r, h in (('west', 15.0, 104.0, 6.0, 9.5), ('centre', 32.0, 104.0, 6.6, 11.0), ('east', 49.0, 104.0, 6.0, 9.5),
                         ('south', 32.0, 86.0, 6.0, 9.5), ('north', 32.0, 122.0, 6.0, 9.5)):
    cylinder(name + 'Drum', M['marbleSM'], r * S, 3.8 * S, P(x, y, 26.8), segs=40)
    lathe(name + 'Dome', M['domeLead'], [(rr * S, zz * S) for rr, zz in ((r + 0.6, 0.0), (r + 1.3, h * 0.2), (r + 0.9, h * 0.55), (r * 0.45, h * 0.9), (1.4, h))], P(x, y, 30.5), segs=48, smooth=True)
    lathe(name + 'Lantern', M['domeLead'], [(rr * S, zz * S) for rr, zz in ((1.3, -0.1), (1.3, 2.2), (1.7, 2.5), (1.2, 3.8), (0.0, 4.6))], P(x, y, 30.5 + h), segs=16, smooth=True)
    lathe(name + 'Cross', M['gold'], [(0.0, 0.0), (0.4 * S, 0.3 * S), (0.4 * S, 0.7 * S), (0.0, 1.0 * S)], P(x, y, 30.5 + h + 4.5), segs=10, smooth=True)
    cylinder(name + 'CrossUpright', M['gold'], 0.09 * S, 2.0 * S, P(x, y, 30.5 + h + 5.3), segs=6)
    box(name + 'CrossArm', M['gold'], P(x, y, 30.5 + h + 6.6), (1.2 * S, 0.18 * S, 0.18 * S), bevel=0)

# ------------------------------------------------------------------ the Piazza's flagpoles
for k, y in enumerate((90.0, 104.0, 118.0)):
    lathe(f'flagBase{k}', M['bronze'], [(r * S, z * S) for r, z in ((1.4, 0.0), (1.4, 0.6), (1.0, 1.0), (0.9, 2.2), (0.45, 2.8), (0.3, 3.2))], P(-17.0, y, -0.05), segs=16, smooth=True)
    cylinder(f'flagPole{k}', M['iron'], 0.2 * S, 18.0 * S, P(-17.0, y, 3.0), segs=8, r2=0.12 * S)
    block(f'flag{k}', M['flagRed'], -16.95, -16.85, y + 0.2, y + 5.0, 17.0, 20.2)
    lathe(f'flagFinial{k}', M['gold'], [(0.0, 0.0), (0.35 * S, 0.35 * S), (0.0, 0.8 * S)], P(-17.0, y, 21.0), segs=8, smooth=True)


# ------------------------------------------------------------------ gondolas and their poles on the lagoon, people
def gondola(name, x, y, rot, k=0.355):
    m = Matrix.Translation((*T(x, y), Z0)) @ Matrix.Rotation(rot, 4, 'Z') @ Matrix.Scale(k, 4)
    bm = bmesh.new()
    rings = []
    for j in range(13):
        t = -1 + 2 * j / 12
        w = 0.032 * (1 - t * t) ** 0.6 + 0.003
        lift = 0.035 * abs(t) ** 4
        rings.append([bm.verts.new(m @ Vector((t * 0.24, u * w, lift + v))) for u, v in ((-1, 0.012), (-0.7, 0.0), (0.7, 0.0), (1, 0.012))])
    for a, b in zip(rings, rings[1:]):
        for i in range(3):
            bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
    finish(name, bm, M['gondola'], smooth_all=True)
    box_m(name + 'Ferro', M['steel'], m @ Matrix.Translation((0.245, 0, 0.05)), (0.006, 0.012, 0.03), bevel=0.001)
    stern = m @ Vector((-0.16, 0, 0.012))
    person(name + 'Gondolier', stern.x, stern.y, rot, 'white', z=stern.z, scale=0.5)


for k, (x, y, r) in enumerate(((-26.0, -27.0, 0.15), (-22.0, -27.5, 0.1), (-14.0, -27.0, 0.2), (10.0, -30.0, 2.9), (40.0, -33.0, 0.4), (55.0, -26.0, -0.1))):
    gondola(f'gondola{k}', x, y, r)
for k, x in enumerate((-34.0, -26.0, -18.0, -10.0, 6.0, 28.0, 50.0)):
    c = T(x, -24.5)
    cylinder(f'pole{k}', M['poleBlue'], 0.2 * S, 4.5 * S, (c[0], c[1], G - 0.004), segs=10)
    cylinder(f'poleBand{k}', M['white'], 0.21 * S, 0.7 * S, (c[0], c[1], Z0 + 1.6 * S), segs=10)
PEOPLE = ((-25.0, -8.0, 'red'), (-18.0, 4.0, 'blue'), (-12.0, 20.0, 'yellow'), (-30.0, 34.0, 'green'), (-20.0, 52.0, 'red'), (-8.0, 64.0, 'blue'),
          (-36.0, 96.0, 'yellow'), (-26.0, 110.0, 'green'), (-12.0, 100.0, 'red'), (20.0, -16.0, 'blue'), (45.0, -14.0, 'green'), (60.0, -18.0, 'yellow'),
          (83.0, -8.0, 'red'), (-45.0, 64.0, 'blue'))
for k, (x, y, shirt) in enumerate(PEOPLE):
    c = T(x, y)
    person(f'p{k}', c[0], c[1], rng.random() * 6, shirt, z=ZP, scale=0.55)

render('venice')

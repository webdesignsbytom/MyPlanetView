# Florence Cathedral in the high-quality look (hq.py), drawn to its real proportions (laid out in metres)
# and seen from its east end: Brunelleschi's great octagonal dome of red tiles between its eight white
# marble ribs, the lantern on top with its gilded ball and cross, the drum with its round windows, the
# three apse tribunes with their tiled half-domes; the nave's white marble walls panelled in green and
# pink, its tall pointed windows and tiled roofs; Giotto's campanile, panelled the same, its storeys of
# pointed windows and its jutting crown; the piazza's paving, and people.
# Run: blender -b --factory-startup -P florence-duomo.py -- florence-duomo-1024.png 1024 florence-duomo.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1436)
M['carrara'] = material('carrara', '#f2eee6', 0.45, vary='#e7e2d7', vary_scale=18, bump=0.05, bump_scale=120)
M['prato'] = material('pratoGreen', '#3d7d5e', 0.45, vary='#357153', vary_scale=18)
M['pink'] = material('maremmaPink', '#d6a29a', 0.5, vary='#ca958c', vary_scale=18)
M['tiles'] = banded(material('duomoTiles', '#c45a30', 0.7, vary='#b04f2a', vary_scale=12, bump=0.15, bump_scale=200), 'Z', 160.0, strength=0.35)
M['pietra'] = masonry('pietraForte', '#c9bba2', '#a99b82', scale=70, rough=0.8, vary='#bcae95')

S = 0.0162              # metres to the tile's units
Z0 = G + 0.006
OPEN = []
GREEN, PINK = bmesh.new(), bmesh.new()


OY = -24.0              # the whole drawn this far forward (metres), to sit in the tile's middle


def P(x, y, z):
    return Vector((x * S, (y + OY) * S, Z0 + z * S))


def strip(bm, a, b, w, d=0.35):
    """A thin strip of inlaid marble from a to b (metres), standing proud of its wall by d."""
    dv = b - a
    rot = dv.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((a + b) / 2) @ rot @ Matrix.Diagonal((w * S, w * S, dv.length, 1)))


def panels(x0, y0, x1, y1, z0, z1, nx, ny, bays, rows):
    """A wall's face (the line from (x0, y0) to (x1, y1) facing (nx, ny), z0 to z1) panelled in green
    frames with pink inlays, as the cathedral's walls are."""
    off = Vector((nx, ny, 0)) * 0.25
    for i in range(bays + 1):
        t = i / bays
        x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        strip(GREEN, P(x, y, z0) + off * S, P(x, y, z1) + off * S, 0.55)
    for j in range(rows + 1):
        z = z0 + (z1 - z0) * j / rows
        strip(GREEN, P(x0, y0, z) + off * S, P(x1, y1, z) + off * S, 0.5)
    for i in range(bays):
        t = (i + 0.5) / bays
        x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        for j in range(rows):
            z = z0 + (z1 - z0) * (j + 0.5) / rows
            dx, dy = (x1 - x0) / bays * 0.22, (y1 - y0) / bays * 0.22
            strip(PINK, P(x - dx, y - dy, z) + off * S, P(x + dx, y + dy, z) + off * S, 0.7)


# ------------------------------------------------------------------ the piazza
slab('piazza', M['pietra'], [(-2, -2), (2, -2), (2, 2), (-2, 2)], G - 0.004, Z0, margin=0.04)

# ------------------------------------------------------------------ the nave (east end at y 0, the facade at y 100)
NW, NL, NH = 40.0, 98.0, 26.0            # the nave's width, length, the aisles' wall height
CW, CH = 20.0, 42.0                      # the clerestory's width and height
Y0 = 6.0
box('nave', M['carrara'], P(0, Y0 + NL / 2, NH / 2), (NW * S, NL * S, NH * S), bevel=0.002)
box('clerestory', M['carrara'], P(0, Y0 + NL / 2, CH / 2), (CW * S, NL * S, CH * S), bevel=0.002)
gable_roof('naveRoof', M['tiles'], -CW / 2 * S, CW / 2 * S, (Y0 + 2 + OY) * S, (Y0 + NL + OY) * S, Z0 + CH * S, 7.0 * S, over=0.003, along='y')
for sx in (-1, 1):
    bm = bmesh.new()
    pts = [(sx * CW / 2, Y0, NH + 5), (sx * CW / 2, Y0 + NL, NH + 5), (sx * (NW / 2 + 0.6), Y0 + NL, NH), (sx * (NW / 2 + 0.6), Y0, NH)]
    add_prism(bm, [bm.verts.new(P(*p)) for p in pts], [bm.verts.new(P(p[0], p[1], p[2] + 0.6)) for p in pts])
    finish(f'aisleRoof{sx}', bm, M['tiles'], smooth_sides=False)
    panels(sx * (NW / 2), Y0 + 2, sx * (NW / 2), Y0 + NL - 2, 1.0, NH - 1.0, sx, 0, 8, 3)
    panels(sx * (CW / 2), Y0 + 2, sx * (CW / 2), Y0 + NL - 2, NH + 6, CH - 1.0, sx, 0, 8, 1)
    for k in range(4):
        y = Y0 + 12 + 24 * k
        OPEN.append(((sx * (NW / 2 + 0.4)) * S, (y + OY) * S, Z0 + 9.0 * S, 3.0 * S, 12.0 * S, (sx, 0), 'pointed'))
        OPEN.append(((sx * (CW / 2 + 0.4)) * S, (y + OY) * S, Z0 + (NH + 7) * S, 2.6 * S, 7.0 * S, (sx, 0), 'round'))

# ------------------------------------------------------------------ the octagon: tribunes, drum, dome, lantern
OC = Vector((0, -20.0))      # the octagon's middle
R8 = 21.0                    # its inner radius at the tribunes


def octagon(r, a0=math.pi / 8):
    return [(OC.x + r * math.cos(a0 + k * math.pi / 4), OC.y + r * math.sin(a0 + k * math.pi / 4)) for k in range(8)]


bm = bmesh.new()
ring = octagon(R8)
add_prism(bm, [bm.verts.new(P(x, y, 0)) for x, y in ring], [bm.verts.new(P(x, y, 32.0)) for x, y in ring])
finish('crossing', bm, M['carrara'], bevel=0.002, smooth_sides=False)
for k, ang in enumerate((math.pi, -math.pi / 2, 0.0)):      # the three tribunes, west and east and south (the nave the fourth arm)
    cx, cy = OC.x + 22.0 * math.cos(ang), OC.y + 22.0 * math.sin(ang)
    half = [(cx + 14.0 * math.cos(ang + a), cy + 14.0 * math.sin(ang + a)) for a in (-math.pi / 2, -math.pi / 4, 0.0, math.pi / 4, math.pi / 2)]
    tb = bmesh.new()
    add_prism(tb, [tb.verts.new(P(x, y, 0)) for x, y in half], [tb.verts.new(P(x, y, 24.0)) for x, y in half])
    finish(f'tribune{k}', tb, M['carrara'], bevel=0.002, smooth_sides=False)
    for (xa, ya), (xb, yb) in zip(half, half[1:]):
        nx, ny = (xa + xb) / 2 - cx, (ya + yb) / 2 - cy
        L = math.hypot(nx, ny)
        panels(xa, ya, xb, yb, 1.0, 23.0, nx / L, ny / L, 2, 2)
        OPEN.append((((xa + xb) / 2 + nx / L * 0.4) * S, ((ya + yb) / 2 + ny / L * 0.4 + OY) * S, Z0 + 8.0 * S, 2.6 * S, 9.0 * S, (nx / L, ny / L), 'pointed'))
    lathe(f'tribuneDome{k}', M['tiles'], [(r * S, z * S) for r, z in ((14.5, 0), (13.0, 4.0), (9.0, 8.0), (4.0, 10.5), (0.0, 11.2))], P(cx, cy, 24.0), segs=8, smooth=False)
# the drum, panelled, with its round windows
DR, DZ0, DZ1 = 27.0, 32.0, 52.0
bm = bmesh.new()
ring = octagon(DR)
add_prism(bm, [bm.verts.new(P(x, y, DZ0)) for x, y in ring], [bm.verts.new(P(x, y, DZ1)) for x, y in ring])
finish('drum', bm, M['carrara'], bevel=0.002, smooth_sides=False)
for (xa, ya), (xb, yb) in zip(ring, ring[1:] + ring[:1]):
    nx, ny = (xa + xb) / 2 - OC.x, (ya + yb) / 2 - OC.y
    L = math.hypot(nx, ny)
    panels(xa, ya, xb, yb, DZ0 + 1, DZ1 - 1, nx / L, ny / L, 3, 1)
    OPEN.append((((xa + xb) / 2 + nx / L * 0.4) * S, ((ya + yb) / 2 + ny / L * 0.4 + OY) * S, Z0 + (DZ0 + 7) * S, 6.0 * S, 6.0 * S, (nx / L, ny / L), 'round'))
bm = bmesh.new()
ring = octagon(DR + 1.0)
add_prism(bm, [bm.verts.new(P(x, y, DZ1 - 1.2)) for x, y in ring], [bm.verts.new(P(x, y, DZ1 + 0.4)) for x, y in ring])
finish('drumCornice', bm, M['carrara'], smooth_sides=False)
# the dome: an octagonal pointed vault of tiles, its eight white ribs on the corners
DOME = []
for j in range(17):
    t = j / 16
    a = math.radians(58 * t)                  # along a pointed arch: centred off the axis
    r = DR * (1.0 - 0.82 * (1 - math.cos(a)) / (1 - math.cos(math.radians(58))))
    z = DZ1 + 38.0 * math.sin(a) / math.sin(math.radians(58))
    DOME.append((max(r, 4.2), z))
ALIGN = Matrix.Translation(P(OC.x, OC.y, 0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z') @ Matrix.Translation(-P(OC.x, OC.y, 0))     # lathes' corners onto the drum's
lathe('dome', M['tiles'], [(r * S, (z - DZ1) * S) for r, z in DOME], P(OC.x, OC.y, DZ1), segs=8, smooth=False, matrix=ALIGN)
RIBS = bmesh.new()
for k in range(8):
    a = math.pi / 8 + k * math.pi / 4
    for (r0, z0), (r1, z1) in zip(DOME, DOME[1:]):
        p0 = P(OC.x + (r0 + 0.6) * math.cos(a), OC.y + (r0 + 0.6) * math.sin(a), z0)
        p1 = P(OC.x + (r1 + 0.6) * math.cos(a), OC.y + (r1 + 0.6) * math.sin(a), z1)
        dv = p1 - p0
        rot = dv.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
        bmesh.ops.create_cube(RIBS, size=1.0, matrix=Matrix.Translation((p0 + p1) / 2) @ rot @ Matrix.Diagonal((2.2 * S, 2.2 * S, dv.length * 1.02, 1)))
finish('ribs', RIBS, M['carrara'], smooth_sides=False)
# the lantern
LZ = DOME[-1][1]
lathe('lanternBase', M['carrara'], [(5.0 * S, 0), (5.0 * S, 2.0 * S), (4.0 * S, 2.2 * S)], P(OC.x, OC.y, LZ - 0.5), segs=8, matrix=ALIGN)
lathe('lantern', M['carrara'], [(3.3 * S, 0), (3.3 * S, 9.0 * S), (3.8 * S, 9.6 * S), (2.6 * S, 11.0 * S), (0.5 * S, 17.0 * S), (0.0, 17.5 * S)], P(OC.x, OC.y, LZ + 1.5), segs=8, matrix=ALIGN)
for k in range(8):
    a = math.pi / 8 + k * math.pi / 4
    bar(f'lanternButtress{k}', M['carrara'], P(OC.x + 4.8 * math.cos(a), OC.y + 4.8 * math.sin(a), LZ + 1.5), P(OC.x + 3.5 * math.cos(a), OC.y + 3.5 * math.sin(a), LZ + 10.0), 1.0 * S)
lathe('ball', M['gold'], [(0.0, 0), (1.3 * S, 0.4 * S), (1.4 * S, 1.3 * S), (0.0, 2.6 * S)], P(OC.x, OC.y, LZ + 18.5), segs=16, smooth=True)
bar('crossV', M['gold'], P(OC.x, OC.y, LZ + 21.0), P(OC.x, OC.y, LZ + 24.5), 0.4 * S)
bar('crossH', M['gold'], P(OC.x - 1.2, OC.y, LZ + 23.4), P(OC.x + 1.2, OC.y, LZ + 23.4), 0.4 * S)

# ------------------------------------------------------------------ Giotto's campanile
GX, GY, GW, GH = 30.0, 96.0, 14.5, 82.0
box('campanile', M['carrara'], P(GX, GY, GH / 2), (GW * S, GW * S, GH * S), bevel=0.002)
for sx in (-1, 1):
    for sy in (-1, 1):
        box(f'campanileButtress{sx}{sy}', M['carrara'], P(GX + sx * (GW / 2), GY + sy * (GW / 2), GH / 2), (1.6 * S, 1.6 * S, GH * S), bevel=0)
for nx, ny in ((0, -1), (-1, 0), (1, 0), (0, 1)):
    a0 = (GX - ny * GW / 2 + nx * GW / 2, GY + nx * GW / 2 + ny * GW / 2)
    b0 = (GX + ny * GW / 2 + nx * GW / 2, GY - nx * GW / 2 + ny * GW / 2)
    panels(a0[0], a0[1], b0[0], b0[1], 1.0, 30.0, nx, ny, 3, 4)
    for z0, h, w in ((33.0, 12.0, 2.4), (49.0, 12.0, 2.4), (65.0, 14.0, 3.0)):
        for u in ((-3.0, 3.0) if w < 3 else (0.0,)):
            OPEN.append(((GX + nx * (GW / 2 + 0.5) - ny * u) * S, (GY + ny * (GW / 2 + 0.5) + nx * u + OY) * S, Z0 + z0 * S, w * S, h * S, (nx, ny), 'pointed'))
box('campanileCrown', M['carrara'], P(GX, GY, GH + 1.0), ((GW + 3.0) * S, (GW + 3.0) * S, 2.0 * S), bevel=0.001)
bm = bmesh.new()
for k in range(28):
    a = 2 * math.pi * k / 28
    u = max(abs(math.cos(a)), abs(math.sin(a)))
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(P(GX + (GW / 2 + 1.2) * math.cos(a) / u, GY + (GW / 2 + 1.2) * math.sin(a) / u, GH + 2.6)) @ Matrix.Diagonal((0.8 * S, 0.8 * S, 1.2 * S, 1)))
finish('crownParapet', bm, M['carrara'], smooth_sides=False)

finish('greenInlay', GREEN, M['prato'], smooth_sides=False)
finish('pinkInlay', PINK, M['pink'], smooth_sides=False)
for k, (x, y, shirt) in enumerate(((-0.3, -1.15, 'red'), (0.1, -1.25, 'blue'), (0.4, -1.1, 'yellow'), (-0.75, -0.9, 'green'), (0.8, -0.85, 'red'), (-0.85, 0.3, 'blue'), (0.85, 0.5, 'green'), (0.0, -1.35, 'red'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=Z0)

glazed('windows', OPEN, M['carrara'], depth=0.5 * S, bars=False)
render('florence-duomo')

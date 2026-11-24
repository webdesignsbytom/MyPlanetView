# The Sydney Opera House in the high-quality look (hq.py), on a top of harbour water: the granite
# podium on Bennelong Point with its harbour walk and the broad monumental steps up from the
# forecourt, and the two halls' white shells, each a vault with a pointed-arch section rising to a
# tip that leans forwards, tiled (the ribs show as fine lines), edged in cream, its open front
# glazed in bronze with mullions; three shells face the harbour in each hall and one faces back,
# the restaurant's two little shells by the steps. A green and gold Sydney ferry, a yacht, and the
# Botanic Garden's trees on the shore. Turned side-on to the camera, as it's seen from the harbour.
# Run: blender -b --factory-startup -P sydney-opera-house.py -- sydney-opera-house-1024.png 1024 sydney-opera-house.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='water')
rng = random.Random(1973)
M['shell'] = banded(material('shell', '#fcfbf7', 0.24, vary='#f0ece2', vary_scale=90, bump=0.03, bump_scale=500, coat=0.35), 'Y', 8.0, strength=0.1)
M['rim'] = material('rim', '#e4d8bf', 0.5, vary='#d8cbb0', vary_scale=30, bump=0.05, bump_scale=200)
M['podium'] = banded(material('podium', '#c39a7e', 0.6, vary='#b48a6e', vary_scale=24, bump=0.1, bump_scale=160), 'Z', 4.0, strength=0.25)
M['mullion'] = material('mullion', '#3a2f25', 0.45, metallic=0.4)
M['ferryGreen'] = material('ferryGreen', '#2c6a43', 0.45, coat=0.4)
M['ferryCream'] = material('ferryCream', '#f1dc98', 0.5)
M['sail'] = material('sail', '#fbfbf8', 0.6, sss=0.05)
before = set(bpy.data.objects)

Z = G + 0.12      # the podium's top


def on_podium(name, fn, z):
    """Runs fn() (which makes things standing on G) and lifts what it made to z."""
    made = set(bpy.data.objects)
    fn()
    for ob in bpy.data.objects:
        if ob not in made:
            ob.location.z += z - G


# ------------------------------------------------------------------ the shore, the forecourt and the steps
bm = bmesh.new()
arc = [(PLINTH_R * 0.995 * math.cos(math.radians(a)), PLINTH_R * 0.995 * math.sin(math.radians(a))) for a in range(30, 151, 4)]
arc = [(x, y) for x, y in arc if y >= 0.78]
shore = [(arc[0][0], 0.78)] + arc + [(arc[-1][0], 0.78)]
add_prism(bm, [bm.verts.new((x, y, G - 0.012)) for x, y in shore], [bm.verts.new((x, y, G + 0.006)) for x, y in shore])
finish('forecourt', bm, M['pavingDark'], smooth_sides=False)
box('seaWall', M['granite'], (0, 0.775, G + 0.006), (2.5, 0.02, 0.03), bevel=0.003)
for k, (x, y, r) in enumerate(((-0.92, 0.94, 0.11), (-0.66, 1.12, 0.1), (-1.1, 0.84, 0.08), (0.82, 1.0, 0.1), (1.02, 0.86, 0.08), (-0.4, 1.24, 0.09))):
    tree(f'garden{k}', x, y, h=0.22, r=r, z=G + 0.006)

# ------------------------------------------------------------------ the podium, its harbour walk and the steps
outline = [(-0.75, 0.82), (0.75, 0.82), (0.75, -0.55), (0.42, -0.98), (-0.42, -0.98), (-0.75, -0.55)]
walk = [(x * 1.08, y * 1.06 - 0.01) for x, y in outline]
bm = bmesh.new()
add_prism(bm, [bm.verts.new((x, y, G - 0.01)) for x, y in walk], [bm.verts.new((x, y, G + 0.012)) for x, y in walk])
finish('harbourWalk', bm, M['paving'], bevel=0.003, smooth_sides=False)
bm = bmesh.new()
add_prism(bm, [bm.verts.new((x, y, G)) for x, y in outline], [bm.verts.new((x, y, Z)) for x, y in outline])
finish('podium', bm, M['podium'], bevel=0.004, smooth_sides=False)
bm = bmesh.new()
inner = [(x * 0.985, y * 0.985) for x, y in outline]
add_prism(bm, [bm.verts.new((x, y, Z - 0.002)) for x, y in inner], [bm.verts.new((x, y, Z + 0.006)) for x, y in inner])
finish('podiumTop', bm, M['paving'], smooth_sides=False)
NSTEP = 11
for k in range(NSTEP):
    top = Z - k * (Z - G - 0.006) / NSTEP
    box(f'step{k}', M['paving'] if k % 2 == 0 else M['pavingDark'], (-0.24, 0.82 + 0.03 * (k + 0.5), (G + top) / 2), (0.96, 0.031, top - G), bevel=0.0015)
for s in (-1, 1):
    box(f'stepWall{s}', M['podium'], (-0.24 + s * 0.49, 0.98, (G + Z) / 2), (0.03, 0.34, Z - G), bevel=0.003)


# ------------------------------------------------------------------ the shells
def shell(name, cx, yb, ya, h, w, z=Z):
    """A shell: a vault from its back at y=yb to its front at y=ya (tip h high, leaning forwards),
    each section a pointed arch w either side of x=cx, edged in cream, its front glazed."""
    U, T = 28, 32
    lean = 0.14 * h * (1 if ya < yb else -1)

    def at(u, t):
        rise = h * (0.12 + 0.88 * math.sin(u * math.pi / 2))
        half = w * (0.82 + 0.18 * u)
        up = (1 - abs(t)) ** 0.62
        return Vector((cx + half * t, yb + (ya - yb) * u - lean * up * u, z + rise * up))
    bm = bmesh.new()
    grid = [[bm.verts.new(at(i / U, -1 + 2 * j / T)) for j in range(T + 1)] for i in range(U + 1)]
    for i in range(U):
        for j in range(T):
            bm.faces.new((grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]))
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.016)
    finish(name, bm, M['shell'], smooth_all=True)
    tube(name + 'Rim', M['rim'], [tuple(at(1.0, -1 + 2 * j / 48)) for j in range(49)], 0.009)
    # the bronze glass filling the front arch, a little inside it, and its mullions
    bm = bmesh.new()
    face = bm.faces.new([bm.verts.new(at(0.975, -1 + 2 * j / T)) for j in range(T + 1)])
    bmesh.ops.triangulate(bm, faces=[face])
    finish(name + 'Glass', bm, M['glassBronze'], smooth_sides=False)
    n = max(3, int(w * 22))
    for j in range(1, n):
        t = -1 + 2 * j / n
        p = at(0.97, t)
        bar(f'{name}Mullion{j}', M['mullion'], (p.x, p.y, z), (p.x, p.y, p.z - 0.004), 0.005)
    p0, p1 = at(0.97, -0.62), at(0.97, 0.62)
    bar(name + 'Transom', M['mullion'], (p0.x, (p0.y + p1.y) / 2, z + h * 0.36), (p1.x, (p0.y + p1.y) / 2, z + h * 0.36), 0.005)


def hall(prefix, cx, k, dy=0.0):
    # three shells facing the harbour (-y), each lower than the one in front, and one facing back
    shell(prefix + '1', cx, 0.0 * k + dy, -0.64 * k + dy, 1.0 * k, 0.34 * k)
    shell(prefix + '2', cx, 0.3 * k + dy, -0.12 * k + dy, 0.78 * k, 0.32 * k)
    shell(prefix + '3', cx, 0.54 * k + dy, 0.2 * k + dy, 0.55 * k, 0.29 * k)
    shell(prefix + 'Back', cx, 0.42 * k + dy, 0.76 * k + dy, 0.42 * k, 0.26 * k)


hall('concert', -0.36, 1.0)
hall('opera', 0.39, 0.86, dy=-0.06)
# the restaurant's two little shells by the steps
shell('restaurant1', 0.48, 0.64, 0.5, 0.2, 0.12)
shell('restaurant2', 0.48, 0.6, 0.78, 0.16, 0.11)

# ------------------------------------------------------------------ a ferry, a yacht, and people
def ferry(name, x, y, rot):
    m = Matrix.Translation((x, y, G)) @ Matrix.Rotation(rot, 4, 'Z')
    bm = bmesh.new()
    hull = [(-0.17, -0.035), (0.13, -0.045), (0.19, 0.0), (0.13, 0.045), (-0.17, 0.035), (-0.19, 0.0)]
    add_prism(bm, [bm.verts.new(m @ Vector((u, v, -0.006))) for u, v in hull], [bm.verts.new(m @ Vector((u * 1.03, v * 1.12, 0.035))) for u, v in hull])
    finish(name + 'Hull', bm, M['ferryGreen'], bevel=0.004, smooth_sides=False)
    box_m(name + 'Cabin', M['ferryCream'], m @ Matrix.Translation((-0.01, 0, 0.055)), (0.26, 0.075, 0.04), bevel=0.004)
    box_m(name + 'Upper', M['ferryCream'], m @ Matrix.Translation((-0.02, 0, 0.09)), (0.17, 0.065, 0.03), bevel=0.004)
    box_m(name + 'Wheelhouse', M['ferryGreen'], m @ Matrix.Translation((0.02, 0, 0.113)), (0.05, 0.05, 0.018), bevel=0.003)
    for s in (-1, 1):
        box_m(f'{name}Windows{s}', M['glass'], m @ Matrix.Translation((-0.01, s * 0.038, 0.06)), (0.23, 0.002, 0.016))
        box_m(f'{name}UpperWindows{s}', M['glass'], m @ Matrix.Translation((-0.02, s * 0.0328, 0.093)), (0.15, 0.002, 0.012))


def yacht(name, x, y, rot):
    m = Matrix.Translation((x, y, G)) @ Matrix.Rotation(rot, 4, 'Z')
    bm = bmesh.new()
    hull = [(-0.07, -0.018), (0.04, -0.022), (0.09, 0.0), (0.04, 0.022), (-0.07, 0.018)]
    add_prism(bm, [bm.verts.new(m @ Vector((u, v, -0.004))) for u, v in hull], [bm.verts.new(m @ Vector((u, v, 0.016))) for u, v in hull])
    finish(name + 'Hull', bm, M['white'], bevel=0.003, smooth_sides=False)
    cylinder(name + 'Mast', M['steel'], 0.003, 0.22, (0, 0, 0), segs=8, matrix=m @ Matrix.Translation((0.01, 0, 0.016)))
    bm = bmesh.new()
    add_prism(bm, [bm.verts.new(m @ Vector(p)) for p in ((0.013, -0.001, 0.03), (0.075, -0.001, 0.03), (0.013, -0.001, 0.23))],
              [bm.verts.new(m @ Vector(p)) for p in ((0.013, 0.001, 0.03), (0.075, 0.001, 0.03), (0.013, 0.001, 0.23))])
    finish(name + 'Jib', bm, M['sail'], smooth_sides=False)
    bm = bmesh.new()
    add_prism(bm, [bm.verts.new(m @ Vector(p)) for p in ((0.007, -0.001, 0.03), (-0.07, -0.001, 0.03), (0.007, -0.001, 0.21))],
              [bm.verts.new(m @ Vector(p)) for p in ((0.007, 0.001, 0.03), (-0.07, 0.001, 0.03), (0.007, 0.001, 0.21))])
    finish(name + 'Main', bm, M['sail'], smooth_sides=False)


ferry('ferry', 1.08, -0.35, math.radians(96))
yacht('yacht1', 0.35, -1.25, math.radians(20))
yacht('yacht2', -0.75, -1.1, math.radians(-30))

for k, (x, y, shirt) in enumerate(((-0.4, 1.3, 'red'), (-0.15, 1.24, 'blue'), (0.2, 1.2, 'yellow'), (-0.6, 1.12, 'green'), (0.05, 1.36, 'red'))):
    on_podium(f'forecourt{k}', lambda x=x, y=y, k=k, shirt=shirt: person(f'forecourt{k}', x, y, rng.random() * 6, shirt), G + 0.006)
for k, (x, y, shirt) in enumerate(((0.05, -0.75, 'blue'), (-0.08, -0.6, 'yellow'), (0.62, 0.3, 'red'), (-0.62, 0.45, 'green'), (0.0, 0.6, 'blue'))):
    on_podium(f'podiumPerson{k}', lambda x=x, y=y, k=k, shirt=shirt: person(f'podium{k}', x, y, rng.random() * 6, shirt), Z + 0.006)
for k, (x, y, shirt) in enumerate(((0.84, -0.2, 'red'), (0.86, 0.2, 'yellow'), (-0.84, -0.1, 'blue'))):
    on_podium(f'walker{k}', lambda x=x, y=y, k=k, shirt=shirt: person(f'walker{k}', x, y, rng.random() * 6, shirt), G + 0.012)

# turned side-on to the camera, the harbour shells facing left
R = Matrix.Rotation(math.radians(-78), 4, 'Z')
for ob in bpy.data.objects:
    if ob not in before:
        ob.matrix_world = R @ ob.matrix_world

render('sydney-opera-house')

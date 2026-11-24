# The Taj Mahal in the high-quality look (hq.py): the white marble tomb on its square plinth over
# the red sandstone terrace, its chamfered corners, the great pointed portal (pishtaq) on each face
# framed in a dark inlaid band with stacked arched niches either side, the drum and the onion dome
# with its gilded finial, the four domed pavilions (chhatris) round it, the four tapering minarets
# with their balconies and pavilions; the long reflecting pool down the garden between rows of
# cypresses, its marble edge and the central pool.
# Run: blender -b --factory-startup -P taj-mahal.py -- taj-mahal-1024.png 1024 taj-mahal.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
M['inlay'] = material('inlay', '#3a3330', 0.4)
M['recess'] = material('recess', '#d9d2c4', 0.4, vary='#cec6b6', vary_scale=14, sss=0.04)
M['pool'] = material('pool', '#3f8fc0', 0.04, vary='#4d9fd0', vary_scale=4, coat=0.9)
TX, TY = 0.0, 0.32
FACES = ((0, -1), (1, 0), (0, 1), (-1, 0))


def onion(name, x, y, z, r, h, mat=None):
    prof = [(r * 0.86, 0), (r * 1.0, h * 0.12), (r * 1.06, h * 0.3), (r * 0.95, h * 0.5), (r * 0.7, h * 0.68), (r * 0.38, h * 0.84), (r * 0.12, h * 0.95), (0.0, h)]
    lathe(name, mat or M['whiteMarble'], prof, (x, y, z), segs=48, smooth=True)
    lathe(name + 'Finial', M['gold'], [(r * 0.08, 0), (r * 0.1, h * 0.06), (r * 0.04, h * 0.12), (r * 0.07, h * 0.18), (r * 0.02, h * 0.28), (0.0, h * 0.34)], (x, y, z + h - 0.004), segs=16, smooth=True)


def chhatri(name, x, y, z, r, h):
    for k in range(8):
        a = 2 * math.pi * k / 8
        cylinder(f'{name}Col{k}', M['whiteMarble'], r * 0.09, h * 0.45, (x + r * 0.8 * math.cos(a), y + r * 0.8 * math.sin(a), z), segs=8)
    lathe(name + 'Eave', M['whiteMarble'], [(r * 1.15, 0), (r * 1.15, h * 0.06), (r * 0.9, h * 0.1)], (x, y, z + h * 0.45), segs=24)
    onion(name + 'Dome', x, y, z + h * 0.53, r * 0.75, h * 0.55)


# ------------------------------------------------------------------ the terrace and the plinth
box('terrace', M['redSandstone'], (TX, TY, G + 0.03), (1.5, 1.12, 0.06), bevel=0.004)
box('plinth', M['whiteMarble'], (TX, TY, G + 0.1), (1.08, 1.08, 0.08), bevel=0.004)
pspecs = []
for nrm in FACES:
    for i in range(13):
        u = -0.48 + i * 0.08
        pspecs.append((TX + nrm[0] * 0.54 + (-nrm[1]) * u, TY + nrm[1] * 0.54 + nrm[0] * u, G + 0.075, 0.035, 0.045, nrm, 'pointed'))
windows('plinthArcade', M['marbleShade'], pspecs)
box('stairs', M['whiteMarble'], (TX, TY - 0.6, G + 0.05), (0.18, 0.12, 0.1), bevel=0.003)
PZ = G + 0.14

# ------------------------------------------------------------------ the tomb
W, C, HT = 0.6, 0.12, 0.38   # the side, the chamfer, the walls' height
oct_pts = [(-W / 2 + C, -W / 2), (W / 2 - C, -W / 2), (W / 2, -W / 2 + C), (W / 2, W / 2 - C), (W / 2 - C, W / 2), (-W / 2 + C, W / 2), (-W / 2, W / 2 - C), (-W / 2, -W / 2 + C)]
bm = bmesh.new()
add_prism(bm, [bm.verts.new((TX + x, TY + y, PZ)) for x, y in oct_pts], [bm.verts.new((TX + x, TY + y, PZ + HT)) for x, y in oct_pts])
finish('tomb', bm, M['whiteMarble'], smooth_sides=False)
bm = bmesh.new()
add_prism(bm, [bm.verts.new((TX + x * 1.02, TY + y * 1.02, PZ + HT - 0.005)) for x, y in oct_pts], [bm.verts.new((TX + x * 1.02, TY + y * 1.02, PZ + HT + 0.02)) for x, y in oct_pts])
finish('tombCornice', bm, M['whiteMarble'], bevel=0.002, smooth_sides=False)
specs, inlays = [], []
for nrm in FACES:
    nx, ny = nrm
    tx, ty = -ny, nx
    fx, fy = TX + nx * W / 2, TY + ny * W / 2
    # the portal: a raised frame, the dark inlaid band, the deep pointed arch
    box_m(f'pishtaq{nrm}', M['whiteMarble'], Matrix.Translation((fx + nx * 0.01, fy + ny * 0.01, PZ + 0.23)) @ Matrix.Rotation(math.atan2(nx, -ny), 4, 'Z'), (0.26, 0.03, 0.46), bevel=0.003)
    # the inlaid band framing the arch: four thin dark strips
    rot = Matrix.Rotation(math.atan2(nx, -ny), 4, 'Z')
    for (u, z, w, h) in ((0.0, PZ + 0.405, 0.2, 0.014), (-0.1, PZ + 0.22, 0.014, 0.37), (0.1, PZ + 0.22, 0.014, 0.37)):
        box_m(f'inlay{nrm}{u}{z:.2f}', M['inlay'], Matrix.Translation((fx + nx * 0.026 + tx * u, fy + ny * 0.026 + ty * u, z)) @ rot, (w, 0.004, h))
    specs.append((fx + nx * 0.03, fy + ny * 0.03, PZ + 0.04, 0.15, 0.3, nrm, 'pointed'))
    # the stacked niches either side of it
    for s in (-1, 1):
        for zz, hh in ((PZ + 0.03, 0.15), (PZ + 0.2, 0.14)):
            specs.append((fx + tx * s * 0.2, fy + ty * s * 0.2, zz, 0.07, hh, nrm, 'pointed'))
windows('portalArches', M['recess'], specs, depth=0.014)
# niches on the chamfered corners
cspecs = []
for k in range(4):
    a = math.pi / 4 + k * math.pi / 2
    nx, ny = math.cos(a), math.sin(a)
    d = W / 2 - C / 2
    for zz, hh in ((PZ + 0.03, 0.15), (PZ + 0.2, 0.14)):
        cspecs.append((TX + nx * d * math.sqrt(2), TY + ny * d * math.sqrt(2), zz, 0.07, hh, (nx, ny), 'pointed'))
windows('cornerNiches', M['recess'], cspecs, depth=0.012)
# the drum and the great onion dome
DZ = PZ + HT + 0.02
lathe('drum', M['whiteMarble'], [(0.16, 0), (0.16, 0.1), (0.17, 0.11)], (TX, TY, DZ), segs=64)
onion('dome', TX, TY, DZ + 0.11, 0.2, 0.42)
for sx in (-1, 1):
    for sy in (-1, 1):
        chhatri(f'chhatri{sx}{sy}', TX + sx * 0.2, TY + sy * 0.2, DZ, 0.06, 0.2)
# the four minarets at the plinth's corners
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = TX + sx * 0.48, TY + sy * 0.48
        lathe(f'minaret{sx}{sy}', M['whiteMarble'], [(0.042, 0), (0.036, 0.62)], (x, y, PZ), segs=24, smooth=False)
        for zz in (0.2, 0.4, 0.6):
            lathe(f'balcony{sx}{sy}{zz}', M['whiteMarble'], [(0.058, 0), (0.058, 0.015), (0.045, 0.025)], (x, y, PZ + zz), segs=24)
        chhatri(f'minaretTop{sx}{sy}', x, y, PZ + 0.625, 0.04, 0.13)

# ------------------------------------------------------------------ the garden and the reflecting pool
box('poolEdge', M['whiteMarble'], (TX, -0.68, G + 0.006), (0.2, 0.88, 0.012), bevel=0.002)
box('pool', M['pool'], (TX, -0.68, G + 0.009), (0.13, 0.84, 0.01), bevel=0)
lathe('centralPoolEdge', M['whiteMarble'], [(0.14, 0), (0.14, 0.02), (0.0, 0.02)], (TX, -0.62, G), segs=4, smooth=False)
lathe('centralPool', M['pool'], [(0.115, 0), (0.115, 0.022), (0.0, 0.022)], (TX, -0.62, G), segs=4, smooth=False)
for s in (-1, 1):
    paving_strip(f'walk{s}', TX + s * 0.17, -1.12, TX + s * 0.17, -0.26, 0.1)
    for k in range(7):
        cypress(f'cypress{s}{k}', TX + s * 0.25, -1.06 + k * 0.13, h=0.2, r=0.028)
    for k in range(3):
        tree(f'gardenTree{s}{k}', TX + s * 0.75, -0.95 + k * 0.32, h=0.2, r=0.09)
for k, (x, y, shirt) in enumerate(((TX - 0.16, -0.95, 'red'), (TX + 0.17, -0.8, 'blue'), (TX - 0.18, -0.5, 'yellow'))):
    person(f'p{k}', x, y, 1.5 + k, shirt)

render('taj-mahal')

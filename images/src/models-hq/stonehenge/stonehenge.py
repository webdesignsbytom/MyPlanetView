# Stonehenge in the high-quality look (hq.py), laid out as it stands today (seen from the air): the
# sarsen circle with its continuous run of lintels across the front, the paired uprights with their
# lintels on the left, single uprights and gaps round the back; inside, the complete trilithon at the
# back right, the tall upright of the great trilithon at the back, the trilithon on the left; the
# fallen stones lying in the middle, the small bluestones scattered among them, boulders outside the
# circle; the stones chunky, pale and lichened, on the plain's grass with the earth worn round them.
# Run: blender -b --factory-startup -P stonehenge.py -- stonehenge-1024.png 1024 stonehenge.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(2500)
M['sarsen'] = material('sarsen', '#c3bfb2', 0.9, vary='#a9a597', vary_scale=7, bump=0.8, bump_scale=40)
M['lichen'] = material('lichen', '#b8b9a2', 0.9, vary='#9fa38a', vary_scale=6, bump=0.8, bump_scale=40)
M['bluestone'] = material('bluestone', '#8f9496', 0.85, vary='#7c8284', vary_scale=9, bump=0.6, bump_scale=50)
M['worn'] = material('worn', '#8a9a56', 0.9, vary='#7d8a4c', vary_scale=6, bump=0.2, bump_scale=200)
M['bank'] = material('bank', '#77b14b', 0.85, vary='#6aa340', vary_scale=7, bump=0.15, bump_scale=420)
RC = 0.92            # the sarsen circle's radius
SC = 1.0             # the stones' scale


def stone(name, x, y, w, d, h, rot, mat='sarsen', tilt=(0.0, 0.0), z=None):
    """A sarsen: a chunky block with rounded edges, a little narrower at the top, its top uneven."""
    lr = random.Random(hash(name) & 0xffff)
    z = G - 0.01 if z is None else z
    m = Matrix.Translation((x, y, z)) @ Matrix.Rotation(rot, 4, 'Z') @ Matrix.Rotation(tilt[0], 4, 'X') @ Matrix.Rotation(tilt[1], 4, 'Y')
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((0, 0, h / 2)) @ Matrix.Diagonal((w, d, h, 1)))
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=2, use_grid_fill=True)
    for v in bm.verts:
        f = v.co.z / h
        v.co.x *= 1 - 0.1 * f ** 2 * lr.uniform(0.6, 1.3)
        v.co.y *= 1 - 0.08 * f ** 2
        v.co += Vector((lr.uniform(-1, 1) * w * 0.05, lr.uniform(-1, 1) * d * 0.06, lr.uniform(-1, 1) * h * 0.03 if f > 0.9 else 0))
    bmesh.ops.transform(bm, matrix=m, verts=bm.verts)
    finish(name, bm, M[mat], bevel=min(w, d, h) * 0.22, segments=2, smooth_all=True)


def at(angle_deg, r=RC):
    a = math.radians(angle_deg)
    return r * math.cos(a), r * math.sin(a), a


def lintel(name, a0, a1, z, r=RC):
    """A lintel over two neighbouring uprights of the circle (angles in degrees)."""
    am = math.radians((a0 + a1) / 2)
    L = 2 * r * math.sin(math.radians(abs(a1 - a0)) / 2) + 0.1
    stone(name, r * math.cos(am), r * math.sin(am), L, 0.09, 0.055, am + math.pi / 2, 'sarsen', z=z)


# ------------------------------------------------------------------ the ground: the worn earth round the stones, the faint bank
annulus('wornRing', M['worn'], RC + 0.14, RC - 0.12, G - 0.004, G + 0.002, segs=128)
cylinder('wornInside', M['worn'], 0.45, 0.006, (0.05, 0.1, G - 0.004), segs=64)
annulus('bank', M['bank'], 1.42, 1.3, G - 0.01, G + 0.02, segs=128, bevel=0.01)

# ------------------------------------------------------------------ the sarsen circle
UH = 0.3
UPRIGHTS = {  # angle: (height, material, lean)
    157: (0.3, 'lichen', 0.06), 191: (0.29, 'sarsen', 0.0), 201: (0.3, 'lichen', 0.0), 217: (0.31, 'sarsen', 0.0), 232: (0.3, 'sarsen', 0.0),
    249: (0.31, 'lichen', 0.0), 266: (0.32, 'sarsen', 0.0), 284: (0.31, 'sarsen', 0.0), 301: (0.31, 'lichen', 0.0), 318: (0.32, 'sarsen', 0.0),
    331: (0.29, 'sarsen', 0.05), 346: (0.24, 'lichen', -0.08), 26: (0.3, 'sarsen', 0.0), 36: (0.3, 'lichen', 0.0), 45: (0.31, 'sarsen', 0.0),
}
for k, (ang, (h, mat, lean)) in enumerate(UPRIGHTS.items()):
    x, y, a = at(ang)
    stone(f'upright{ang}', x, y, 0.12, 0.08, h, a + math.pi / 2, mat, tilt=(lean, rng.uniform(-0.04, 0.04)))
for a0, a1 in ((191, 201), (217, 232), (266, 284), (284, 301), (301, 318), (26, 36), (36, 45)):
    lintel(f'lintel{a0}', a0, a1, G + UH)
lintel('lintelEnd', 318, 330, G + UH)

# ------------------------------------------------------------------ the trilithons, the great upright
def trilithon(name, x, y, h, rot, with_lintel=True):
    t = Vector((math.cos(rot), math.sin(rot)))
    for s in (-1, 1):
        stone(f'{name}{s}', x + t.x * s * 0.075, y + t.y * s * 0.075, 0.13, 0.09, h, rot, 'lichen' if s > 0 else 'sarsen')
    if with_lintel:
        stone(f'{name}Lintel', x, y, 0.3, 0.1, 0.06, rot, 'sarsen', z=G + h - 0.005)


trilithon('backRight', 0.38, 0.55, 0.46, math.radians(-35))
trilithon('left', -0.4, 0.32, 0.44, math.radians(80))
stone('greatUpright', -0.02, 0.72, 0.14, 0.1, 0.56, 0.05, 'sarsen')
stone('greatUprightB', 0.05, 0.86, 0.12, 0.09, 0.48, 0.1, 'lichen', tilt=(0.12, 0.0))
stone('leftTall', -0.38, 0.02, 0.13, 0.09, 0.4, math.radians(80), 'sarsen', tilt=(0.0, 0.14))
stone('rightTall', 0.55, 0.12, 0.11, 0.08, 0.34, math.radians(100), 'lichen')

# ------------------------------------------------------------------ the fallen stones, the bluestones, the boulders outside
for k, (x, y, w, d, h, rot) in enumerate(((-0.1, 0.5, 0.3, 0.12, 0.07, 0.3), (0.06, 0.42, 0.26, 0.12, 0.07, -0.4), (0.2, 0.38, 0.24, 0.1, 0.06, 0.7),
                                          (0.38, 0.12, 0.22, 0.09, 0.06, 0.1), (-0.65, 0.6, 0.18, 0.08, 0.05, 0.4), (-0.12, 0.62, 0.14, 0.08, 0.05, 1.2))):
    stone(f'fallen{k}', x, y, w, d, h, rot, 'sarsen' if k % 2 else 'lichen')
for k, (x, y, h) in enumerate(((0.22, 0.02, 0.1), (0.33, 0.04, 0.09), (0.24, -0.1, 0.07), (0.06, -0.12, 0.06), (-0.25, -0.2, 0.08), (-0.75, 0.15, 0.08), (0.12, 0.6, 0.09),
                               (0.5, 0.4, 0.06), (-0.2, 0.45, 0.07), (0.6, -0.25, 0.06), (-0.55, -0.35, 0.06), (0.15, -0.35, 0.05))):
    stone(f'blue{k}', x, y, 0.05, 0.04, h, rng.uniform(0, 3), 'bluestone', tilt=(rng.uniform(-0.15, 0.15), rng.uniform(-0.15, 0.15)))
for k, (x, y, w) in enumerate(((-1.22, 0.02, 0.12), (-1.1, 0.06, 0.1), (-1.2, -0.12, 0.11), (1.18, 0.0, 0.14), (1.08, -0.18, 0.1), (0.62, 0.95, 0.1), (0.75, 0.88, 0.08))):
    stone(f'boulder{k}', x, y, w, w * 0.7, w * 0.45, rng.uniform(0, 3), 'sarsen')
stone('heel', 0.1, -1.24, 0.12, 0.1, 0.3, 0.3, 'lichen', tilt=(0.12, 0.05))

for k, (x, y, shirt) in enumerate(((-1.25, -0.55, 'red'), (-1.18, -0.62, 'blue'), (1.2, -0.6, 'yellow'), (0.4, -1.3, 'green'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt)

render('stonehenge')

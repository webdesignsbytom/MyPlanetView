# Hagia Sophia in the high-quality look (hq.py): the rose-ochre walls in their massing round the great
# central dome, the dome itself wide and shallow, lead-grey with its ribs, on its drum ringed with
# forty windows; the half-domes east and west stepping down to the smaller half-domes, the great
# buttresses sloping against the north and south sides, the tympanum walls with their rows of
# windows; the four slender Ottoman minarets with their balconies and pointed lead caps, the
# mausoleums' little domes, the gardens with cypresses and a fountain, and people.
# Run: blender -b --factory-startup -P hagia-sophia.py -- hagia-sophia-1024.png 1024 hagia-sophia.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(537)
M['rose'] = material('roseOchre', '#d9a27c', 0.75, vary='#c8916c', vary_scale=20, bump=0.2, bump_scale=160)
M['roseDark'] = material('roseDark', '#c38c68', 0.8, vary='#b27c59', vary_scale=20, bump=0.2, bump_scale=160)
M['leadH'] = banded(material('leadH', '#8f979c', 0.45, vary='#838b90', vary_scale=14, metallic=0.4), 'Z', 34.0, strength=0.15)
M['minaret'] = material('minaretStone', '#eadfcb', 0.6, vary='#dccfb7', vary_scale=20, bump=0.1, bump_scale=150)
OPEN = []
CX, CY = 0.0, 0.1


def half_dome(name, x, y, r, z0, h, facing):
    """A half-dome: a quarter of a sphere's shell facing `facing` (+1 east, -1 west along x)."""
    bm = bmesh.new()
    rings = []
    for i in range(9):
        el = (math.pi / 2) * i / 8
        ring = []
        for k in range(17):
            az = -math.pi / 2 + math.pi * k / 16
            ring.append(bm.verts.new((x + facing * r * math.cos(el) * math.cos(az), y + r * math.cos(el) * math.sin(az), z0 + h * math.sin(el))))
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for k in range(16):
            bm.faces.new((a[k], a[k + 1], b[k + 1], b[k]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    ob = finish(name, bm, M['leadH'], smooth_all=True)
    mod = ob.modifiers.new('solid', 'SOLIDIFY')
    mod.thickness = 0.012
    return ob


# ------------------------------------------------------------------ the gardens
slab('court', M['paving'], rect(0.0, -0.1, 2.1, 1.7), G - 0.004, G + 0.005, margin=0.14)
for k, (x, y) in enumerate(((-0.95, -0.75), (-0.75, -0.95), (0.85, -0.8), (1.05, -0.55), (-1.1, 0.5), (1.1, 0.55), (-0.3, -1.1), (0.35, -1.12))):
    cypress(f'cypress{k}', x, y, h=0.3, r=0.04)
lathe('fountain', M['minaret'], [(0.08, 0), (0.08, 0.03), (0.06, 0.04), (0.06, 0.1), (0.075, 0.12), (0.0, 0.16)], (0.55, -0.9, G), segs=8)

# ------------------------------------------------------------------ the massing
box('base', M['rose'], (CX, CY, G + 0.17), (1.0, 0.86, 0.34), bevel=0.004)
box('centre', M['rose'], (CX, CY, G + 0.27), (0.56, 0.56, 0.54), bevel=0.004)
for k in range(9):
    for s in (-1, 1):
        x = CX - 0.44 + k * 0.11
        OPEN.append((x, CY + s * 0.43, G + 0.06, 0.035, 0.09, (0, s), 'round'))
        OPEN.append((x, CY + s * 0.43, G + 0.2, 0.035, 0.08, (0, s), 'round'))
for s in (-1, 1):
    for k in range(7):
        OPEN.append((CX - 0.18 + k * 0.06, CY + s * 0.28, G + 0.38, 0.032, 0.08, (0, s), 'round'))
        OPEN.append((CX - 0.15 + k * 0.05, CY + s * 0.28, G + 0.47, 0.025, 0.05, (0, s), 'round'))
    # the great buttresses against the north and south sides
    for x in (-0.24, 0.24):
        bm = bmesh.new()
        prof = [(0.0, G), (0.16, G), (0.16, G + 0.3), (0.06, G + 0.5), (0.0, G + 0.5)]
        add_prism(bm, [bm.verts.new((CX + x - 0.045, CY + s * (0.28 + u), z)) for u, z in prof], [bm.verts.new((CX + x + 0.045, CY + s * (0.28 + u), z)) for u, z in prof])
        finish(f'buttress{s}{x}', bm, M['roseDark'], bevel=0.004, smooth_sides=False)
    box(f'aisleRoof{s}', M['leadH'], (CX, CY + s * 0.36, G + 0.345), (1.0, 0.14, 0.012), bevel=0.002)
for s in (-1, 1):
    box(f'westEnd{s}', M['rose'], (CX + s * 0.43, CY, G + 0.21), (0.16, 0.6, 0.42), bevel=0.003)   # never flush with the base: coincident faces render black
# the half-domes east and west, the smaller ones stepping down from them
for s in (-1, 1):
    half_dome(f'halfDome{s}', CX + s * 0.25, CY, 0.25, G + 0.5, 0.2, s)
    for oy in (-0.15, 0.15):
        half_dome(f'smallHalfDome{s}{oy}', CX + s * 0.36, CY + oy, 0.1, G + 0.38, 0.09, s)
    half_dome(f'apseDome{s}', CX + s * 0.46, CY, 0.1, G + 0.4, 0.09, s)

# ------------------------------------------------------------------ the great dome on its drum of windows
DZ = G + 0.54
cylinder('drum', M['rose'], 0.27, 0.07, (CX, CY, DZ), segs=64)
for k in range(40):
    a = 2 * math.pi * k / 40
    OPEN.append((CX + 0.27 * math.cos(a), CY + 0.27 * math.sin(a), DZ + 0.015, 0.022, 0.04, (math.cos(a), math.sin(a)), 'round'))
    bar(f'drumPier{k}', M['rose'], (CX + 0.278 * math.cos(a + math.pi / 40), CY + 0.278 * math.sin(a + math.pi / 40), DZ), (CX + 0.278 * math.cos(a + math.pi / 40), CY + 0.278 * math.sin(a + math.pi / 40), DZ + 0.07), 0.016)
lathe('dome', M['leadH'], [(0.285, 0), (0.27, 0.05), (0.23, 0.11), (0.16, 0.16), (0.08, 0.19), (0.0, 0.2)], (CX, CY, DZ + 0.07), segs=80, smooth=True)
for k in range(40):
    a = 2 * math.pi * k / 40
    tube(f'domeRib{k}', M['leadH'], [(CX + r * math.cos(a), CY + r * math.sin(a), DZ + 0.07 + z) for r, z in ((0.287, 0.0), (0.272, 0.05), (0.232, 0.11), (0.162, 0.16), (0.082, 0.19))], 0.003)
lathe('finial', M['gold'], [(0.0, 0), (0.012, 0.01), (0.008, 0.03), (0.0, 0.06)], (CX, CY, DZ + 0.27), segs=12, smooth=True)


# ------------------------------------------------------------------ the four minarets
def minaret(name, x, y, h, r):
    lathe(name + 'Base', M['minaret'], [(r * 1.5, 0), (r * 1.5, 0.08), (r * 1.15, 0.1)], (x, y, G), segs=12)
    lathe(name, M['minaret'], [(r * 1.15, 0), (r, h * 0.5), (r * 0.9, h)], (x, y, G + 0.1), segs=16)
    for f in (0.45, 0.72, 0.9):
        lathe(f'{name}Balcony{f}', M['minaret'], [(r * 1.0, 0), (r * 1.75, 0.02), (r * 1.75, 0.035), (r * 1.6, 0.04)], (x, y, G + 0.1 + h * f), segs=16)
    spire(name + 'Cap', M['leadH'], x, y, G + 0.1 + h, r * 0.95, h * 0.22)


for k, (x, y) in enumerate(((-0.6, -0.42), (0.6, -0.42), (-0.6, 0.62), (0.6, 0.62))):
    minaret(f'minaret{k}', x, y, 0.95 if k < 2 else 0.85, 0.032)
# the mausoleums' little domes
for k, (x, y) in enumerate(((0.82, 0.15), (0.78, -0.2))):
    lathe(f'tomb{k}', M['minaret'], [(0.08, 0), (0.08, 0.1)], (x, y, G), segs=8)
    lathe(f'tombDome{k}', M['leadH'], [(0.085, 0), (0.07, 0.04), (0.04, 0.07), (0.0, 0.08)], (x, y, G + 0.1), segs=24, smooth=True)

for k, (x, y, shirt) in enumerate(((-0.2, -0.55, 'red'), (0.1, -0.6, 'blue'), (0.3, -0.7, 'yellow'), (-0.4, -0.75, 'green'), (0.0, -0.95, 'red'), (-0.6, -0.6, 'blue'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=G + 0.005)

windows('openings', M['shadow'], OPEN, depth=0.01)
render('hagia-sophia')

# A cartoon Sydney Harbour Bridge for the country maps, built in the set's shared look (../toon.py):
# the great grey steel arch over the harbour, its two chords braced by a lattice, the deck hung from it
# on its hangers, the four granite pylons at the ends, the climbers' flags on the summit, a ferry on
# the blue water and the shores either side. Turned a little towards the camera.
# Run: blender -b --factory-startup -P sydney-harbour-bridge.py -- sydney-harbour-bridge-1024.png 1024 sydney-harbour-bridge.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'harbour': toon('harbour', '#2f86c0', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'shore': toon('shore', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'steel': toon('steel', '#8e969e', shadow_mul=(0.84, 0.86, 0.92), lift=0.12),
    'steelDark': toon('steelDark', '#6a7078'),
    'granite': toon('granite', '#d8ccb0', shadow_mul=(0.86, 0.82, 0.8), lift=0.15),
    'deck': toon('deck', '#7a7a80'),
    'white': toon('white', '#f4f2ec', lift=0.15),
    'green': toon('green', '#2a7a4a'),
    'yellow': toon('yellow', '#f0c840'),
    'flagBlue': toon('flagBlue', '#2a3a8a'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['harbour'])
before = set(bpy.data.objects)


def vstrip(x0, x1, r, z, n=8):
    """The band of the tile's disc between x0 and x1 (counter-clockwise from above)."""
    ya0, ya1 = math.sqrt(r * r - x0 * x0), math.sqrt(r * r - x1 * x1)
    b0, b1 = math.acos(x0 / r), math.acos(x1 / r)
    pts = [(x0, -ya0)]
    pts += [(r * math.cos(-b0 + (b0 - b1) * k / n), r * math.sin(-b0 + (b0 - b1) * k / n)) for k in range(1, n)]
    pts += [(x1, -ya1), (x1, ya1)]
    pts += [(r * math.cos(b1 + (b0 - b1) * k / n), r * math.sin(b1 + (b0 - b1) * k / n)) for k in range(1, n)]
    pts += [(x0, ya0)]
    return [(x, y, z) for x, y in pts]


# the shores on the left and right, the harbour between
for s, (x0, x1) in ((-1, (-1.41, -0.78)), (1, (0.78, 1.41))):
    loft(f'shore{s}', M['shore'], [vstrip(x0, x1, 1.42, G - 0.01), vstrip(x0, x1, 1.42, G + 0.05)], outline=0.006)
    for k, y in enumerate((-0.45, 0.4)):
        ball(f'tree{s}{k}', M['tree'], s * 1.0, y, G + 0.12, 0.08, outline=0.01)

# ---------- the arch ----------
SPAN = 0.74     # half the arch's span between its bearings
DZ = G + 0.22   # the deck's height
BD = 0.12       # half the bridge's breadth
N = 24


def lower(x):
    """The arch itself, from its bearings at the water up to its crown."""
    return G + 0.04 + 0.52 * (1 - (x / SPAN) ** 2)


def upper(x):
    """The top chord: high over the pylons, a little above the crown in the middle."""
    return G + 0.38 + 0.28 * (1 - (x / SPAN) ** 2) ** 0.6


xs = [-SPAN + 2 * SPAN * k / N for k in range(N + 1)]
for fy in (-1, 1):
    y = fy * BD
    for a, b in zip(xs, xs[1:]):
        bar(f'lowerchord{fy}{a:.3f}', M['steel'], (a, y, lower(a)), (b, y, lower(b)), 0.04, outline=0.004)
        bar(f'upperchord{fy}{a:.3f}', M['steel'], (a, y, upper(a)), (b, y, upper(b)), 0.03, outline=0.003)
    for k, x in enumerate(xs[1:-1]):
        nxt = xs[k + 2]
        bar(f'post{fy}{k}', M['steelDark'], (x, y, lower(x)), (x, y, upper(x)), 0.012, outline=0)
        bar(f'diagonal{fy}{k}', M['steelDark'], (x, y, lower(x)), (nxt, y, upper(nxt)), 0.01, outline=0)
        # the hangers carrying the deck under the arch, and the struts holding it up beyond
        if lower(x) > DZ + 0.02:
            rod(f'hanger{fy}{k}', M['steelDark'], (x, y, DZ), (x, y, lower(x)), 0.004, segs=4, outline=0)
        elif lower(x) < DZ - 0.05:
            rod(f'strut{fy}{k}', M['steelDark'], (x, y, lower(x)), (x, y, DZ - 0.03), 0.007, segs=4, outline=0)
# cross bracing between the two arches at the top
for k, x in enumerate(xs[3:-3:2]):
    bar(f'crossbrace{k}', M['steelDark'], (x, -BD, upper(x) - 0.01), (x, BD, upper(x) - 0.01), 0.012, outline=0)

# ---------- the deck and the pylons ----------
box('deck', M['deck'], 0, 0, DZ - 0.03, 2.2, 2 * BD + 0.06, 0.035, outline=0.005, bevel=0)
for s in (-1, 1):
    for fy in (-1, 1):
        px, py = s * (SPAN + 0.07), fy * (BD + 0.02)
        box(f'pylon{s}{fy}', M['granite'], px, py, G - 0.005, 0.1, 0.1, DZ - G + 0.3, outline=0.006, bevel=0)
        box(f'pyloncap{s}{fy}', M['granite'], px, py, DZ + 0.29, 0.11, 0.11, 0.02, outline=0.002, bevel=0)
        for k in range(3):
            box(f'pylonslit{s}{fy}{k}', M['steelDark'], px, py - 0.052, DZ + 0.05 + k * 0.08, 0.02, 0.006, 0.05, outline=0, bevel=0)
    box(f'abutment{s}', M['granite'], s * (SPAN + 0.07), 0, G - 0.005, 0.12, 2 * BD + 0.1, DZ - G - 0.02, outline=0.005, bevel=0)
# the flags on the summit
for k, (y, m) in enumerate(((-0.04, 'flagBlue'), (0.04, 'green'))):
    rod(f'flagpole{k}', M['white'], (0, y, upper(0)), (0, y, upper(0) + 0.1), 0.004, segs=4, outline=0)
    box(f'flag{k}', M[m], 0.025, y, upper(0) + 0.06, 0.05, 0.004, 0.035, outline=0.001, bevel=0)

# ---------- a ferry ----------
FX, FY = -0.3, -0.62
hull = ball('ferry', M['green'], 0, 0, 0, 0.07, outline=0.005)
hull.scale = (2.5, 0.9, 0.5)
hull.location = (FX, FY, G + 0.01)
box('ferrydeck', M['yellow'], FX, FY, G + 0.03, 0.26, 0.1, 0.03, outline=0.003, bevel=0)
box('ferrycabin', M['white'], FX, FY, G + 0.06, 0.18, 0.08, 0.04, outline=0.003, bevel=0)
box('ferryroof', M['green'], FX, FY, G + 0.1, 0.2, 0.09, 0.01, outline=0.002, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

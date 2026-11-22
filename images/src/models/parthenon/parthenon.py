# A cartoon Parthenon for the country maps, built in the set's shared look (../toon.py): the
# Acropolis as a low rocky plateau, and on it the temple: three steps, a colonnade of ten
# columns along its sides and five across its ends, the inner hall, the entablature, and the
# gabled roof with a pediment at each end; two olive trees on the rock.
# Run: blender -b --factory-startup -P parthenon.py -- parthenon-1024.png 1024 parthenon.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'marble': toon('marble', '#f3ead6', shadow_mul=(0.80, 0.80, 0.90), lift=0.25),
    'marbleShade': toon('marbleShade', '#ddd0b5', shadow_mul=(0.80, 0.78, 0.86)),
    'rock': toon('rock', '#c7b08a', shadow_mul=(0.75, 0.72, 0.8)),
    'olive': toon('olive', '#7d9a55', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6a4a'),
})

G = tile()

# ---------- the Acropolis: a low plateau of rock, its cliffs faceted ----------
rng = random.Random(9)
SIDES = 13


def ring(r, z, jitter):
    return [(r * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / SIDES),
             r * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / SIDES), G + z) for k in range(SIDES)]


ROCK_TOP = 0.3
rock = loft('rock', M['rock'], [ring(1.33, -0.01, 0.0), ring(1.25, 0.11, 0.04), ring(1.17, 0.24, 0.05), ring(1.1, ROCK_TOP, 0.02)],
            outline=0.035)
rock.visible_shadow = False  # its cliffs shadowing themselves speckled
R = G + ROCK_TOP

# ---------- the temple, its long sides along x ----------
LX, LY = 1.5, 0.74
for k in range(3):
    box(f'step{k}', M['marbleShade'], 0, 0, R + k * 0.035, LX + 0.12 - k * 0.04, LY + 0.12 - k * 0.04, 0.035,
        outline=0.022, bevel=0.004)
S = R + 0.105
COL_H = 0.42
box('cella', M['marbleShade'], 0, 0, S, 1.05, 0.4, COL_H, outline=0.03, bevel=0.006)
XS = [-0.68 + 1.36 * i / 9 for i in range(10)]
YS = [-0.3 + 0.6 * i / 4 for i in range(5)]
spots = [(x, y) for x in XS for y in (YS[0], YS[-1])] + [(x, y) for x in (XS[0], XS[-1]) for y in YS[1:-1]]
for k, (x, y) in enumerate(spots):
    rod(f'column{k}', M['marble'], (x, y, S), (x, y, S + COL_H), 0.042, r2=0.035, segs=12, outline=0.022)
    box(f'capital{k}', M['marble'], x, y, S + COL_H, 0.095, 0.095, 0.025, outline=0.014, bevel=0)

E = S + COL_H + 0.025
box('architrave', M['marble'], 0, 0, E, LX + 0.02, LY + 0.02, 0.06, outline=0.03, bevel=0.004)
box('frieze', M['marbleShade'], 0, 0, E + 0.06, LX + 0.02, LY + 0.02, 0.05, outline=0.025, bevel=0)
box('cornice', M['marble'], 0, 0, E + 0.11, LX + 0.08, LY + 0.08, 0.03, outline=0.025, bevel=0.004)
# the gabled roof: a pediment at each end
Z_ROOF = E + 0.14
L, W = (LX + 0.08) / 2, (LY + 0.08) / 2
loft('roof', M['marble'], [[(x, -W, Z_ROOF), (x, W, Z_ROOF), (x, 0, Z_ROOF + 0.15)] for x in (-L, L)], outline=0.03)
# the pediments' recessed faces
for k, x in enumerate((-L - 0.004, L + 0.004)):
    bm = bmesh.new()
    face = bm.faces.new([bm.verts.new((x, -W + 0.07, Z_ROOF + 0.015)), bm.verts.new((x, W - 0.07, Z_ROOF + 0.015)),
                         bm.verts.new((x, 0, Z_ROOF + 0.12))])
    finish(f'tympanum{k}', bm, M['marbleShade'], outline=0)

# ---------- olive trees on the rock ----------
for k, (x, y) in enumerate(((-0.92, 0.42), (0.86, -0.6))):
    rod(f'olivetrunk{k}', M['trunk'], (x, y, R), (x + 0.02, y, R + 0.12), 0.025, r2=0.018, segs=8, outline=0.015)
    ball(f'olive{k}', M['olive'], x + 0.02, y, R + 0.18, 0.1, outline=0.022)
    ball(f'olive{k}b', M['olive'], x + 0.08, y + 0.03, R + 0.15, 0.07, outline=0.02)

render(G)

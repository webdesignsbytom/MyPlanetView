# A cartoon theatre of Epidaurus for the country maps, built in the set's shared look (../toon.py):
# the great Greek theatre cut into the hillside, its fan of pale limestone seats rising in tiers round
# the round orchestra, the stairways dividing it into wedges, the walkway part-way up, the ruins of
# the stage building in front, and the pines of the Argolid round it. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P epidaurus.py -- epidaurus-1024.png 1024 epidaurus.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'hill': toon('hill', '#7aa854', shadow_mul=(0.72, 0.8, 0.76)),
    'seat': toon('seat', '#e8dcc0', shadow_mul=(0.86, 0.84, 0.86), lift=0.2),
    'seatDark': toon('seatDark', '#cbbd9c'),
    'orchestra': toon('orchestra', '#d8c8a0', lift=0.15),
    'stone': toon('stone', '#c8b890'),
    'pine': toon('pine', '#3f7a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile()
before = set(bpy.data.objects)

OX, OY = 0.0, -0.35      # the orchestra's middle
R0 = 0.2                  # the orchestra's radius
ROWS = 16
SPREAD = math.radians(115)   # the fan opens this far either side of straight back

# ---------- the seats: wedges of tiered rows round the orchestra ----------
lathe('orchestra', M['orchestra'], ((R0, 0), (R0, 0.012)), G - 0.004, OX, OY, segs=32, outline=0.003)
lathe('orchestrastone', M['stone'], ((0.03, 0), (0.03, 0.02)), G + 0.005, OX, OY, segs=12, outline=0.001)
WEDGES = 12
for w in range(WEDGES):
    a0 = math.pi / 2 - SPREAD + 2 * SPREAD * w / WEDGES + 0.012
    a1 = math.pi / 2 - SPREAD + 2 * SPREAD * (w + 1) / WEDGES - 0.012
    for r in range(ROWS):
        if r == 10:
            continue   # the walkway (diazoma)
        ri = R0 + 0.03 + r * 0.05
        ro = ri + 0.05
        z1 = G + 0.02 + r * 0.03
        n = 3
        inner = [(OX + ri * math.cos(a0 + (a1 - a0) * k / n), OY + ri * math.sin(a0 + (a1 - a0) * k / n)) for k in range(n + 1)]
        outer = [(OX + ro * math.cos(a0 + (a1 - a0) * k / n), OY + ro * math.sin(a0 + (a1 - a0) * k / n)) for k in range(n + 1)]
        ring = inner + outer[::-1]
        loft(f'seat{w}{r}', M['seat'] if (w + r) % 2 else M['seatDark'], [[(x, y, G - 0.005) for x, y in ring], [(x, y, z1) for x, y in ring]], outline=0.0015)
# the walkway's floor
for w in range(WEDGES * 2):
    a0 = math.pi / 2 - SPREAD + 2 * SPREAD * w / (WEDGES * 2)
    a1 = math.pi / 2 - SPREAD + 2 * SPREAD * (w + 1) / (WEDGES * 2)
    ri, ro = R0 + 0.03 + 10 * 0.05, R0 + 0.03 + 11 * 0.05
    ring = [(OX + ri * math.cos(a0), OY + ri * math.sin(a0)), (OX + ri * math.cos(a1), OY + ri * math.sin(a1)),
            (OX + ro * math.cos(a1), OY + ro * math.sin(a1)), (OX + ro * math.cos(a0), OY + ro * math.sin(a0))]
    loft(f'walkway{w}', M['orchestra'], [[(x, y, G - 0.005) for x, y in ring], [(x, y, G + 0.02 + 9 * 0.03 + 0.01) for x, y in ring]], outline=0.001)

# ---------- the hillside behind, sloping down from the top row to the tile's edge ----------
TOP = G + 0.02 + (ROWS - 1) * 0.03
R1 = R0 + 0.03 + ROWS * 0.05


def reach(a, limit=1.36):
    """How far from the orchestra's middle, along angle a, the tile allows."""
    ux, uy = math.cos(a), math.sin(a)
    pu = OX * ux + OY * uy
    return -pu + math.sqrt(pu * pu - (OX * OX + OY * OY) + limit * limit)


for w in range(WEDGES * 2):
    a0 = math.pi / 2 - SPREAD + 2 * SPREAD * w / (WEDGES * 2)
    a1 = math.pi / 2 - SPREAD + 2 * SPREAD * (w + 1) / (WEDGES * 2)
    r0, r1 = min(R1 + 0.25, reach(a0)), min(R1 + 0.25, reach(a1))
    quad = [(OX + R1 * math.cos(a0), OY + R1 * math.sin(a0)), (OX + R1 * math.cos(a1), OY + R1 * math.sin(a1)),
            (OX + r1 * math.cos(a1), OY + r1 * math.sin(a1)), (OX + r0 * math.cos(a0), OY + r0 * math.sin(a0))]
    top = [(quad[0][0], quad[0][1], TOP), (quad[1][0], quad[1][1], TOP), (quad[2][0], quad[2][1], G + 0.005), (quad[3][0], quad[3][1], G + 0.005)]
    bk = loft(f'bank{w}', M['hill'], [[(x, y, G - 0.005) for x, y in quad], top], outline=0.004)
    bk.visible_shadow = False

# ---------- the stage building's ruins ----------
box('skene', M['stone'], OX, OY - 0.32, G - 0.005, 0.7, 0.1, 0.05, outline=0.004, bevel=0)
for j in range(8):
    x = OX - 0.3 + j * 0.086
    rod(f'skenecol{j}', M['stone'], (x, OY - 0.27, G + 0.04), (x, OY - 0.27, G + 0.04 + (0.08 if j % 3 else 0.14)), 0.012, segs=8, outline=0.002)
for s in (-1, 1):
    box(f'gate{s}', M['stone'], OX + s * 0.42, OY - 0.12, G - 0.005, 0.05, 0.04, 0.16, outline=0.003, bevel=0)

# ---------- pines ----------
for k, (x, y) in enumerate(((-0.62, -0.92), (0.62, -0.92), (-0.25, -1.05), (0.25, -1.05), (-0.88, -0.84), (0.88, -0.84))):
    rod(f'pinetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.14), 0.014, segs=6, outline=0.002)
    pn = ball(f'pine{k}', M['pine'], 0, 0, 0, 0.09, outline=0.01)
    pn.scale = (1.4, 1.4, 0.6)
    pn.location = (x, y, G + 0.17)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

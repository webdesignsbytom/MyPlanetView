# Cartoon Cliffs of Moher for the country maps, built in the set's shared look (../toon.py) on a
# tile of Atlantic: the sheer cliffs in bands of dark rock under green grass, their edge
# waving in and out of headlands, foam at their foot, a sea stack, O'Brien's Tower on the top
# and a few sheep. Turned a little towards the camera.
# Run: blender -b --factory-startup -P cliffs-of-moher.py -- cliffs-of-moher-1024.png 1024 cliffs-of-moher.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#3f8fc4', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'rock': toon('rock', '#6f6a63', shadow_mul=(0.76, 0.74, 0.82)),
    'rockLight': toon('rockLight', '#8c8478', shadow_mul=(0.76, 0.74, 0.82)),
    'turf': toon('turf', '#6fbf4f', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'foam': toon('foam', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'tower': toon('tower', '#a8a297', shadow_mul=(0.76, 0.76, 0.86)),
    'wool': toon('wool', '#f6f3ec', shadow_mul=(0.85, 0.82, 0.88)),
    'black': flat('black', '#2e2a28'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
R = 1.42


def edge_y(x):
    """The cliff's edge: waving in and out of headlands."""
    return -0.12 + 0.14 * math.sin(x * 3.4 + 0.6) + 0.05 * math.sin(x * 7.1)


# the clifftop's outline: the wavy edge across the tile, then round its back
front = [(x, edge_y(x)) for x in (-1.3 + 2.6 * k / 30 for k in range(31))]
a_end, a_start = math.atan2(front[-1][1], front[-1][0]), math.atan2(front[0][1], front[0][0])
if a_start < a_end:
    a_start += 2 * math.pi   # round the back of the tile, not through the sea
back = [(R * math.cos(a), R * math.sin(a)) for a in (a_end + (a_start - a_end) * k / 30 for k in range(1, 30))]

# ---------- the cliffs: bands of rock, the turf on top ----------
BANDS = ((0.0, 0.2, 'rock'), (0.2, 0.32, 'rockLight'), (0.32, 0.52, 'rock'), (0.52, 0.6, 'rockLight'))
TOP = 0.6
for k, (z0, z1, mat) in enumerate(BANDS):
    shrink = 0.006 * k   # each band set back a hair, so the bands show as ledges
    pts = [(x, y + shrink) for x, y in front] + back
    band = loft(f'band{k}', M[mat], [[(x, y, G + z0 - 0.01) for x, y in pts], [(x, y, G + z1) for x, y in pts]], outline=0.03)
    band.visible_shadow = False
bm = bmesh.new()
face = bm.faces.new([bm.verts.new((x, y + 0.03, G + TOP)) for x, y in front] + [bm.verts.new((x, y, G + TOP)) for x, y in back])
bmesh.ops.triangulate(bm, faces=[face])
turf = finish('turf', bm, M['turf'], outline=0)
turf_edge = loft('turfedge', M['turf'], [[(x, y + 0.03, G + TOP - 0.03) for x, y in front] + [(x, y, G + TOP - 0.03) for x, y in back],
                                         [(x, y + 0.03, G + TOP + 0.005) for x, y in front] + [(x, y, G + TOP + 0.005) for x, y in back]],
                 outline=0.025)
turf_edge.visible_shadow = False

# ---------- foam at the foot, and a sea stack ----------
for k, x in enumerate((-1.1, -0.75, -0.4, -0.05, 0.3, 0.65, 1.0)):
    ball(f'foam{k}', M['foam'], x, edge_y(x) - 0.05, G + 0.01, 0.06 + 0.02 * (k % 2), outline=0.015)
SX, SY = 0.35, -0.72
for k, (z0, z1, r, mat) in enumerate(((0.0, 0.22, 0.13, 'rock'), (0.22, 0.32, 0.12, 'rockLight'), (0.32, 0.46, 0.11, 'rock'))):
    stack = lathe(f'stack{k}', M[mat], ((r, 0), (r * 0.95, z1 - z0)), G + z0 - 0.01, SX, SY, segs=9, outline=0.025, smooth=False)
    stack.visible_shadow = False
lathe('stacktop', M['turf'], ((0.105, 0), (0.1, 0.02)), G + 0.46, SX, SY, segs=9, outline=0.015, smooth=False)
ball('stackfoam', M['foam'], SX - 0.12, SY - 0.06, G + 0.01, 0.06, outline=0.014)

# ---------- O'Brien's Tower and the sheep ----------
TX = -0.35
TY = edge_y(TX) + 0.2
lathe('tower', M['tower'], ((0.075, 0), (0.07, 0.24)), G + TOP, TX, TY, segs=14, outline=0.022)
for k in range(8):
    a = 2 * math.pi * k / 8
    box(f'merlon{k}', M['tower'], TX + 0.065 * math.cos(a), TY + 0.065 * math.sin(a), G + TOP + 0.24, 0.035, 0.035, 0.035,
        rot_z=a, outline=0.01, bevel=0)
box('towerdoor', M['black'], TX, TY - 0.075, G + TOP, 0.03, 0.02, 0.06, outline=0, bevel=0)
for k, (x, dy) in enumerate(((0.25, 0.35), (0.5, 0.55), (0.75, 0.3), (-0.8, 0.5))):
    y = edge_y(x) + dy
    body = ball(f'sheep{k}', M['wool'], x, y, G + TOP + 0.05, 0.045, outline=0.012)
    body.scale = (1.3, 1, 0.9)
    body.location = (x * (1 - 1.3), 0, (G + TOP + 0.05) * (1 - 0.9))
    ball(f'sheephead{k}', M['black'], x - 0.055, y, G + TOP + 0.065, 0.02, outline=0)

turn(before, -20)
render(G)

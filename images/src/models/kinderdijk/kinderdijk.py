# Cartoon Kinderdijk windmills for the country maps, built in the set's shared look
# (../toon.py): two thatched polder mills either side of a canal, each with its red brick foot, white
# door and window, dark cap, and four lattice sails turned to the camera; and a field of tulips.
# Run: blender -b --factory-startup -P kinderdijk.py -- kinderdijk-1024.png 1024 kinderdijk.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'thatch': toon('thatch', '#7a6650'),
    'brick': toon('brick', '#a8513e'),
    'cap': toon('cap', '#4f4338', shadow_mul=(0.78, 0.74, 0.8)),
    'white': toon('white', '#f4efe4', shadow_mul=(0.85, 0.82, 0.88)),
    'sail': toon('sail', '#efe6d2', shadow_mul=(0.85, 0.8, 0.82)),
    'wood': toon('wood', '#6b4a33'),
    'water': toon('water', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'stem': toon('stem', '#4f9a4a'),
    'red': toon('red', '#e0453a'),
    'yellow': toon('yellow', '#f4c83c', shadow_mul=(0.8, 0.68, 0.55)),
    'pink': toon('pink', '#ef8fb6', shadow_mul=(0.85, 0.75, 0.85)),
    'orange': toon('orange', '#f0883a'),
})

G = tile()

# ---------- the canal ----------
# Placed by where they fall in the picture: across it (sx) and away from the camera (depth)
def ground_at(sx, depth):
    return 0.85 * sx + 0.53 * depth, -0.53 * sx + 0.85 * depth


cx, cy = ground_at(0, 0.1)
box('canal', M['water'], cx, cy, G - 0.005, 2.8, 0.2, 0.02, rot_z=math.radians(-32), outline=0.012, bevel=0)

# ---------- the mills ----------
CAMERA_TURN = -32


def mill(k, x, y, s):
    """A thatched polder mill, built facing the front (-Y) and turned to the camera."""
    before = set(bpy.data.objects)
    lathe(f'foot{k}', M['brick'], ((0.24 * s, 0), (0.23 * s, 0.1 * s)), G - 0.005, x, y, segs=8, outline=0.025, smooth=False)
    body_h = 0.62 * s
    lathe(f'body{k}', M['thatch'], ((0.22 * s, 0), (0.13 * s, body_h)), G + 0.095 * s, x, y, segs=8, outline=0.03, smooth=False)
    top = G + 0.095 * s + body_h
    cap = ball(f'cap{k}', M['cap'], x, y, top, 0.15 * s, outline=0.025)
    cap.scale = (1, 1.25, 0.75)
    cap.location = (x * (1 - 1), y * (1 - 1.25), top * (1 - 0.75))
    # the white door below and a window above, towards the front
    box(f'door{k}', M['white'], x, y - 0.215 * s, G + 0.095 * s, 0.07 * s, 0.03, 0.12 * s, outline=0.012, bevel=0)
    box(f'window{k}', M['white'], x, y - 0.17 * s, G + 0.45 * s, 0.05 * s, 0.03, 0.06 * s, outline=0.012, bevel=0)
    # the four sails in an X, on a hub at the front of the cap
    hub = Vector((x, y - 0.2 * s, top + 0.01 * s))
    ball(f'hub{k}', M['wood'], *hub, 0.035 * s, outline=0.015)
    L, W = 0.5 * s, 0.11 * s
    for j, a in enumerate((45, 135, 225, 315)):
        d = Vector((math.cos(math.radians(a)), 0, math.sin(math.radians(a))))
        turn_m = Matrix.Rotation(math.radians(90 - a), 4, 'Y')
        panel = box(f'sail{k}{j}', M['sail'], 0, 0, -L / 2, W, 0.012, L, outline=0.014, bevel=0)
        panel.matrix_world = Matrix.Translation(hub + d * (L / 2 + 0.05 * s) + Vector((0, -0.01, 0))) @ turn_m
        bar(f'stock{k}{j}', M['wood'], hub, hub + d * (L + 0.06 * s), 0.022 * s, outline=0.01)
        for i in range(1, 5):
            slat = box(f'slat{k}{j}{i}', M['wood'], 0, 0, -0.006 * s, W, 0.016, 0.012 * s, outline=0, bevel=0)
            slat.matrix_world = Matrix.Translation(hub + d * (0.05 * s + L * i / 5) + Vector((0, -0.02, 0))) @ turn_m
    turn(before, CAMERA_TURN, about=(x, y))


# two mills, apart across the picture so their sails never cross
mill(0, *ground_at(-0.55, -0.38), 1.0)
mill(1, *ground_at(0.28, 0.55), 0.84)

# ---------- a field of tulips, in rows of colour ----------
for r, colour in enumerate(('red', 'yellow', 'pink', 'orange')):
    for i in range(6):
        x, y = ground_at(0.3 + i * 0.1, -0.48 - r * 0.1)
        rod(f'stem{r}{i}', M['stem'], (x, y, G), (x, y, G + 0.06), 0.008, segs=6, outline=0)
        ball(f'tulip{r}{i}', M[colour], x, y, G + 0.075, 0.03, outline=0.01)

render(G)

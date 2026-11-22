# A cartoon Boudhanath Stupa (Kathmandu) for the country maps, built in the set's shared look
# (../toon.py): the white dome on its stepped square terraces, the gilded tower above it with
# the Buddha's eyes painted on each side, the gold spire of thirteen steps under its little
# canopy, and strings of prayer flags in five colours running down from the top to the terraces.
# Run: blender -b --factory-startup -P boudhanath.py -- boudhanath-1024.png 1024 boudhanath.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'white': toon('white', '#f6f3ec', shadow_mul=(0.82, 0.82, 0.92), lift=0.2),
    'trim': toon('trim', '#c0392b'),
    'eye': toon('eye', '#fbfbfd', shadow_mul=(0.85, 0.85, 0.92)),
    'pupil': flat('pupil', '#1f2a44'),
    'nose': flat('nose', '#c0392b'),
    'flagBlue': toon('flagBlue', '#3c6fc4', shadow_mul=(0.72, 0.72, 0.82)),
    'flagWhite': toon('flagWhite', '#f6f3ec', shadow_mul=(0.82, 0.82, 0.92)),
    'flagRed': toon('flagRed', '#d8463a'),
    'flagGreen': toon('flagGreen', '#3aa56b', shadow_mul=(0.7, 0.78, 0.8)),
    'flagYellow': toon('flagYellow', '#f2c84a', shadow_mul=(0.8, 0.68, 0.55)),
    'string': flat('string', '#6b4a33'),
})

G = tile()
before = set(bpy.data.objects)

# ---------- the stepped square terraces ----------
z = G - 0.005
for k, (side, h) in enumerate(((1.6, 0.08), (1.4, 0.08), (1.2, 0.08))):
    box(f'terrace{k}', M['white'], 0, 0, z, side, side, h, outline=0.025, bevel=0.006)
    box(f'terracetrim{k}', M['trim'], 0, 0, z + h - 0.018, side + 0.006, side + 0.006, 0.018, outline=0, bevel=0)
    z += h

# ---------- the dome ----------
DOME = ((0.56, 0), (0.55, 0.12), (0.5, 0.24), (0.4, 0.34), (0.26, 0.41), (0.12, 0.44))
lathe('dome', M['white'], DOME, z, segs=40, outline=0.035)
TOP = z + DOME[-1][1]

# ---------- the gilded tower with the Buddha's eyes ----------
HW, HH = 0.15, 0.2
box('harmika', M['gold'], 0, 0, TOP - 0.01, HW * 2, HW * 2, HH, outline=0.025, bevel=0.005)


def eyes(i, a, at):
    for side in (-1, 1):
        x, y = at(side * 0.065, -HW - 0.008)
        white = ball(f'eye{i}{side}', M['eye'], x, y, TOP + 0.1, 0.035, outline=0.008)
        white.scale = (1.0, 0.25, 0.55)
        white.location = (x * (1 - 1.0), y * (1 - 0.25), (TOP + 0.1) * (1 - 0.55))
        white.rotation_euler = (0, 0, a)
        px, py = at(side * 0.065, -HW - 0.016)
        ball(f'pupil{i}{side}', M['pupil'], px, py, TOP + 0.1, 0.012, outline=0)
        bx, by = at(side * 0.065, -HW - 0.006)
        box(f'brow{i}{side}', M['pupil'], bx, by, TOP + 0.135, 0.07, 0.012, 0.01, rot_z=a + side * 0.15, outline=0, bevel=0)
    nx, ny = at(0, -HW - 0.006)
    box(f'nose{i}', M['nose'], nx, ny, TOP + 0.04, 0.02, 0.012, 0.045, rot_z=a, outline=0, bevel=0)


each_side(eyes)

# ---------- the gold spire of thirteen steps and its canopy ----------
SPIRE = TOP + HH - 0.01
for k in range(13):
    w = 0.24 - k * 0.013
    box(f'step{k}', M['gold'], 0, 0, SPIRE + k * 0.03, w, w, 0.03, outline=0.008, bevel=0.002)
TIP = SPIRE + 13 * 0.03
lathe('canopy', M['gold'], ((0.1, 0), (0.06, 0.04), (0.01, 0.06)), TIP, segs=16, outline=0.012)
rod('finial', M['gold'], (0, 0, TIP + 0.05), (0, 0, TIP + 0.2), 0.012, r2=0.004, segs=8, outline=0.008)
FLAG_TOP = Vector((0, 0, TIP + 0.12))

# ---------- prayer flags from the top down to the terraces' corners ----------
COLOURS = ('flagBlue', 'flagWhite', 'flagRed', 'flagGreen', 'flagYellow')
for c, (sx, sy) in enumerate(((1, 1), (-1, 1), (-1, -1), (1, -1))):
    end = Vector((sx * 0.78, sy * 0.78, G + 0.24))
    rod(f'string{c}', M['string'], FLAG_TOP, end, 0.004, segs=4, outline=0)
    d = end - FLAG_TOP
    heading = math.atan2(d.y, d.x)
    for k in range(1, 12):
        p = FLAG_TOP + d * (k / 12) - Vector((0, 0, 0.03 * math.sin(math.pi * k / 12)))
        box(f'flag{c}{k}', M[COLOURS[k % 5]], p.x, p.y, p.z - 0.055, 0.05, 0.006, 0.05, rot_z=heading, outline=0.004, bevel=0)

render(G)

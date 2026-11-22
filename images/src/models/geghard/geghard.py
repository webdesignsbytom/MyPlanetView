# A cartoon Geghard Monastery for the country maps, built in the set's shared look (../toon.py): the
# Armenian monastery at the head of the Azat gorge, its main church in grey-pink stone with the tall
# drum and cone roof, the porch before it, the dark doorways of the chapels cut into the cliff
# behind, cross-stones (khachkars) along the path, the monastery wall and gate, trees, and the
# river below. Turned a little towards the camera.
# Run: blender -b --factory-startup -P geghard.py -- geghard-1024.png 1024 geghard.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#8ab55a', shadow_mul=(0.72, 0.8, 0.76), lift=0.25),
    'cliff': toon('cliff', '#a8968a', shadow_mul=(0.8, 0.76, 0.84)),
    'cliffDark': toon('cliffDark', '#8a7a70', shadow_mul=(0.8, 0.76, 0.84)),
    'stone': toon('stone', '#c4aca0', shadow_mul=(0.8, 0.76, 0.84)),
    'stoneDark': toon('stoneDark', '#a88f84', shadow_mul=(0.8, 0.76, 0.84)),
    'cave': flat('cave', '#3a3036'),
    'khachkar': toon('khachkar', '#c98a6a', shadow_mul=(0.84, 0.74, 0.72)),
    'cross': flat('cross', '#8a5a48'),
    'water': toon('water', '#5fa8c8', shadow_mul=(0.75, 0.84, 0.88), lift=0.3),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'path': toon('path2', '#d9c9a8', lift=0.25),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(337)


def ring(cx, cy, rx, ry, z, jitter, sides=16):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- the rugged cliff behind, the chapels cut into its steep foot ----------
RX0, RY0, RCX, RCY = 1.05, 0.36, 0.0, 0.86
cliff = loft('cliff', M['cliff'], [ring(RCX, RCY, RX0, RY0, -0.01, 0.03, sides=20), ring(RCX, RCY + 0.03, RX0 * 0.95, RY0 * 0.88, 0.42, 0.06, sides=20),
                                   ring(RCX, RCY + 0.08, RX0 * 0.72, RY0 * 0.62, 0.68, 0.16, sides=20), ring(RCX + 0.1, RCY + 0.1, RX0 * 0.35, RY0 * 0.3, 0.82, 0.2, sides=20)],
             outline=0.035)
cliff.visible_shadow = False


def face_y(x, z):
    """Where the cliff's steep foot is at x and height z: the front of its lowest rings."""
    t = max(-1.0, min(1.0, (x - RCX) / RX0))
    y0 = RCY - RY0 * math.sqrt(1 - t * t)
    y1 = RCY + 0.03 - RY0 * 0.88 * math.sqrt(max(0.0, 1 - ((x - RCX) / (RX0 * 0.95)) ** 2))
    return y0 + (y1 - y0) * z / 0.42


for k, (x, z, w, h) in enumerate(((-0.62, 0.04, 0.12, 0.18), (-0.38, 0.24, 0.08, 0.12), (0.45, 0.05, 0.1, 0.16), (0.68, 0.22, 0.08, 0.11), (-0.82, 0.18, 0.07, 0.1))):
    y = face_y(x, z + h / 2)
    box(f'cave{k}', M['cave'], x, y - 0.012, G + z, w, 0.02, h, outline=0, bevel=0)
    box(f'cavelintel{k}', M['stoneDark'], x, y - 0.022, G + z + h, w + 0.03, 0.025, 0.025, outline=0.006, bevel=0)

# ---------- the main church: cross plan, the drum and its cone ----------
CX, CY = 0.05, 0.18
church_made = set(bpy.data.objects)
box('nave', M['stone'], CX, CY, G - 0.005, 0.36, 0.22, 0.24, outline=0.02, bevel=0)
box('arms', M['stone'], CX, CY, G - 0.005, 0.22, 0.36, 0.24, outline=0.02, bevel=0)
for name, w, d, along in (('naveroof', 0.36, 0.22, True), ('armroof', 0.22, 0.36, False)):
    top = ([(CX - w / 2, CY - 0.004), (CX + w / 2, CY - 0.004), (CX + w / 2, CY + 0.004), (CX - w / 2, CY + 0.004)] if along else
           [(CX - 0.004, CY - d / 2), (CX + 0.004, CY - d / 2), (CX + 0.004, CY + d / 2), (CX - 0.004, CY + d / 2)])
    loft(name, M['stoneDark'], [[(CX - w / 2 - 0.01, CY - d / 2 - 0.01, G + 0.235), (CX + w / 2 + 0.01, CY - d / 2 - 0.01, G + 0.235),
                                 (CX + w / 2 + 0.01, CY + d / 2 + 0.01, G + 0.235), (CX - w / 2 - 0.01, CY + d / 2 + 0.01, G + 0.235)],
                                [(px, py, G + 0.31) for px, py in top]], outline=0.014)
lathe('drum', M['stone'], ((0.075, 0), (0.075, 0.18)), G + 0.28, CX, CY, segs=12, outline=0.014, smooth=False)
lathe('cone', M['stoneDark'], ((0.09, 0), (0.004, 0.16)), G + 0.455, CX, CY, segs=12, outline=0.014, smooth=False)
for k in range(4):
    a = math.pi / 12 + k * math.pi / 2 - math.pi / 2
    box(f'drumwin{k}', M['cave'], CX + 0.073 * math.cos(a), CY + 0.073 * math.sin(a), G + 0.33, 0.014, 0.014, 0.07, rot_z=a, outline=0, bevel=0)
box('door', M['cave'], CX, CY - 0.184, G, 0.06, 0.01, 0.11, outline=0, bevel=0)
# the porch (gavit) in front, low and square
box('gavit', M['stoneDark'], CX - 0.28, CY - 0.02, G - 0.005, 0.22, 0.24, 0.18, outline=0.016, bevel=0)
pyramid('gavitroof', M['stone'], CX - 0.28, CY - 0.02, G + 0.175, 0.24, 0.07, outline=0.012)
box('gavitdoor', M['cave'], CX - 0.28, CY - 0.143, G, 0.05, 0.01, 0.09, outline=0, bevel=0)
# the church is the point of the model: a third bigger, about its own foot
bpy.context.view_layer.update()
grow = Matrix.Translation((CX - 0.1, CY, G)) @ Matrix.Scale(1.35, 4) @ Matrix.Translation((-(CX - 0.1), -CY, -G))
for ob in set(bpy.data.objects) - church_made:
    ob.matrix_world = grow @ ob.matrix_world

# ---------- the monastery wall and gate ----------
for k, (x, y, w, d) in enumerate(((-0.75, -0.25, 0.7, 0.05), (0.55, -0.25, 0.7, 0.05), (-1.08, 0.1, 0.05, 0.7), (1.0, 0.08, 0.05, 0.62))):
    box(f'wall{k}', M['stoneDark'], x, y, G - 0.005, w, d, 0.12, outline=0.014, bevel=0)
box('gate', M['stone'], -0.15, -0.25, G - 0.005, 0.22, 0.08, 0.2, outline=0.016, bevel=0)
box('gateway', M['cave'], -0.15, -0.292, G, 0.08, 0.01, 0.13, outline=0, bevel=0)

# ---------- the path in, lined with cross-stones ----------
box('path', M['path'], -0.15, -0.65, G - 0.005, 0.16, 0.75, 0.012, outline=0.006, bevel=0)
for k, (x, y) in enumerate(((-0.32, -0.45), (-0.32, -0.7), (0.02, -0.55), (0.02, -0.82))):
    box(f'khachkar{k}', M['khachkar'], x, y, G - 0.005, 0.07, 0.025, 0.15, outline=0.008, bevel=0)
    box(f'crossv{k}', M['cross'], x, y - 0.014, G + 0.03, 0.012, 0.004, 0.09, outline=0, bevel=0)
    box(f'crossh{k}', M['cross'], x, y - 0.014, G + 0.09, 0.045, 0.004, 0.012, outline=0, bevel=0)

# ---------- the Azat river below, trees ----------
RIVER = [(-1.22, -0.55), (-0.7, -0.95), (0.1, -1.1), (0.75, -0.95), (1.18, -0.55)]
for k, ((x0, y0), (x1, y1)) in enumerate(zip(RIVER, RIVER[1:])):
    box(f'river{k}', M['water'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.002, math.hypot(x1 - x0, y1 - y0) + 0.09, 0.1, 0.008, rot_z=math.atan2(y1 - y0, x1 - x0),
        outline=0.008, bevel=0)
for k, (x, y) in enumerate(((-0.75, -0.55), (0.6, -0.6), (0.85, -0.3), (-1.0, -0.35), (0.65, 0.15))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.13, rng.uniform(0.08, 0.11), outline=0.016)

turn(before, -20)
render(G)

# Cartoon Royal Palaces of Abomey for the country maps, built in the set's shared look (../toon.py):
# the Dahomey kings' palaces in Benin, red earthen walls round a courtyard, the long reception hall
# under its steep thatch with coloured bas-reliefs set in its front wall, the round thatched tombs
# of the kings, the gate, and palms. Turned a little towards the camera.
# Run: blender -b --factory-startup -P abomey.py -- abomey-1024.png 1024 abomey.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'earth': toon('earth', '#c47a4a', lift=0.2),
    'wall': toon('wall', '#a8553a', shadow_mul=(0.84, 0.72, 0.72)),
    'thatch': toon('thatch', '#c9a85a', shadow_mul=(0.84, 0.76, 0.62)),
    'thatchDark': toon('thatchDark', '#a88a44', shadow_mul=(0.84, 0.76, 0.62)),
    'relief1': flat('relief1', '#e0453a'), 'relief2': flat('relief2', '#f4efe2'), 'relief3': flat('relief3', '#3f7fc0'), 'relief4': flat('relief4', '#f2c84a'),
    'window': flat('window', '#3a3640'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(643)

# ---------- the courtyard of red earth, inside its walls ----------
CX, CY, W, D = 0.0, 0.12, 1.5, 1.05
box('courtyard', M['earth'], CX, CY, G - 0.004, W - 0.04, D - 0.04, 0.008, outline=0, bevel=0)
corners = [(CX - W / 2, CY - D / 2), (CX + W / 2, CY - D / 2), (CX + W / 2, CY + D / 2), (CX - W / 2, CY + D / 2)]
for k in range(4):
    (x0, y0), (x1, y1) = corners[k], corners[(k + 1) % 4]
    a = math.atan2(y1 - y0, x1 - x0)
    length = math.hypot(x1 - x0, y1 - y0)
    if k == 0:
        for s in (-1, 1):          # the front wall, either side of the gate
            box(f'wall{k}{s}', M['wall'], CX + s * (length / 4 + 0.05), y0, G - 0.005, length / 2 - 0.1, 0.05, 0.12, outline=0.01, bevel=0)
    else:
        box(f'wall{k}', M['wall'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.005, length, 0.05, 0.12, rot_z=a, outline=0.01, bevel=0)
GX, GY = CX, CY - D / 2
box('gatehouse', M['wall'], GX, GY, G - 0.005, 0.22, 0.12, 0.13, outline=0.012, bevel=0)
loft('gateroof', M['thatch'], [[(GX - 0.15, GY - 0.1, G + 0.12), (GX + 0.15, GY - 0.1, G + 0.12), (GX + 0.15, GY + 0.1, G + 0.12), (GX - 0.15, GY + 0.1, G + 0.12)],
                               [(GX - 0.08, GY - 0.004, G + 0.24), (GX + 0.08, GY - 0.004, G + 0.24), (GX + 0.08, GY + 0.004, G + 0.24), (GX - 0.08, GY + 0.004, G + 0.24)]],
     outline=0.01)
box('gateway', M['window'], GX, GY - 0.062, G, 0.07, 0.01, 0.09, outline=0, bevel=0)


# ---------- the long halls under steep thatch ----------
def hall(name, x, y, w, d, reliefs=0):
    box(name, M['wall'], x, y, G - 0.005, w, d, 0.14, outline=0.014, bevel=0)
    loft(f'{name}roof', M['thatch'], [[(x - w / 2 - 0.04, y - d / 2 - 0.035, G + 0.13), (x + w / 2 + 0.04, y - d / 2 - 0.035, G + 0.13), (x + w / 2 + 0.04, y + d / 2 + 0.035, G + 0.13),
                                       (x - w / 2 - 0.04, y + d / 2 + 0.035, G + 0.13)],
                                      [(x - w / 2 + 0.02, y - 0.004, G + 0.34), (x + w / 2 - 0.02, y - 0.004, G + 0.34), (x + w / 2 - 0.02, y + 0.004, G + 0.34),
                                       (x - w / 2 + 0.02, y + 0.004, G + 0.34)]], outline=0.014)
    for k in range(reliefs):
        rx = x - w / 2 + 0.07 + k * (w - 0.14) / max(1, reliefs - 1)
        box(f'{name}panel{k}', M['relief2'], rx, y - d / 2 - 0.004, G + 0.025, 0.075, 0.01, 0.075, outline=0, bevel=0)
        box(f'{name}figure{k}', M[('relief1', 'relief3', 'relief4')[k % 3]], rx, y - d / 2 - 0.008, G + 0.035, 0.04, 0.01, 0.05, outline=0, bevel=0)


hall('receptionhall', -0.2, 0.3, 0.72, 0.2, reliefs=7)
hall('sidehall', 0.5, 0.05, 0.34, 0.18, reliefs=3)

# ---------- the kings' round thatched tombs ----------
for k, (x, y, r) in enumerate(((0.45, 0.45, 0.11), (-0.5, -0.12, 0.1), (0.2, -0.2, 0.09))):
    lathe(f'tombwall{k}', M['wall'], ((r, 0), (r, 0.08)), G - 0.005, x, y, segs=16, outline=0.01)
    lathe(f'tombroof{k}', M['thatchDark'], ((r + 0.05, 0), (r * 0.6, 0.08), (0.004, 0.2)), G + 0.05, x, y, segs=16, outline=0.012)
    box(f'tombdoor{k}', M['window'], x, y - r - 0.002, G, 0.035, 0.01, 0.05, outline=0, bevel=0)

# ---------- palms ----------
for k, (x, y) in enumerate(((-0.95, -0.6), (0.95, -0.55), (-1.0, 0.75), (0.95, 0.85), (-0.3, -0.85))):
    h = rng.uniform(0.24, 0.3)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + h), 0.014, r2=0.011, segs=8, outline=0.006)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + h), (x + 0.03 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + h - 0.05), 0.02, outline=0.005)

turn(before, -20)
render(G)

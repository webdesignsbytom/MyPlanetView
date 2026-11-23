# A cartoon Island of Gorée for the country maps, built in the set's shared look (../toon.py) on a
# tile of the Atlantic: the little island off Dakar, its colonial houses in ochre, red and pink
# under tiled roofs, the House of Slaves with its pair of curving stairs, the fort on the Castel
# hill with its great guns, a baobab, the beach with painted pirogues, and the ferry from Dakar.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P goree.py -- goree-1024.png 1024 goree.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2f8fc8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'sand': toon('sand', '#f0dcae', shadow_mul=(0.84, 0.78, 0.7), lift=0.25),
    'rock': toon('rock', '#8a6a52', shadow_mul=(0.8, 0.74, 0.8)),
    'grass': toon('grass2', '#a8b863', shadow_mul=(0.74, 0.8, 0.74)),
    'ochre': toon('ochre', '#e0a85a', shadow_mul=(0.84, 0.74, 0.62)),
    'red': toon('red', '#c8573a'),
    'salmon': toon('salmon', '#e8a088', shadow_mul=(0.84, 0.74, 0.76)),
    'yellow': toon('hyellow', '#f2d27a', shadow_mul=(0.84, 0.74, 0.62)),
    'roof': toon('roof', '#b8573a'),
    'stone': toon('stone', '#b8ae9c', shadow_mul=(0.8, 0.8, 0.88)),
    'window': flat('window', '#3a3640'),
    'shutter': flat('shutter', '#2f7a5a'),
    'gun': toon('gun', '#3a3a40'),
    'baobab': toon('baobab', '#a89a8a', shadow_mul=(0.8, 0.78, 0.84)),
    'leaf': toon('leaf', '#5f9e55', shadow_mul=(0.7, 0.78, 0.8)),
    'pirogue': toon('pirogue', '#2f8a5a', shadow_mul=(0.7, 0.78, 0.8)),
    'pirogue2': toon('pirogue2', '#d9483b'),
    'paint': flat('paint', '#f4c83c'),
    'ferry': toon('ferry', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'ferryStripe': flat('ferryStripe', '#2f6fb8'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(509)


def ring(cx, cy, rx, ry, z, jitter, sides=20):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- the island ----------
IX, IY = 0.0, 0.2
loft('island', M['sand'], [ring(IX, IY, 0.95, 0.62, -0.01, 0.04), ring(IX, IY, 0.92, 0.6, 0.04, 0.04)], outline=0.02)
T = G + 0.04

# ---------- the Castel hill and its fort ----------
CX, CY = 0.5, 0.45
hill = loft('castel', M['rock'], [ring(CX, CY, 0.38, 0.28, 0.02, 0.06), ring(CX, CY, 0.3, 0.22, 0.2, 0.06), ring(CX, CY, 0.26, 0.18, 0.28, 0.03)], outline=0.025)
top = loft('casteltop', M['grass'], [ring(CX, CY, 0.262, 0.182, 0.275, 0.0), ring(CX, CY, 0.25, 0.17, 0.29, 0.02)], outline=0.012)
hill.visible_shadow = top.visible_shadow = False
FZ = G + 0.29
box('fortwall', M['stone'], CX, CY, FZ - 0.005, 0.3, 0.2, 0.07, outline=0.012, bevel=0)
box('fortyard', M['grass'], CX, CY, FZ + 0.06, 0.24, 0.14, 0.01, outline=0, bevel=0)
for k, (dx, a) in enumerate(((-0.08, -1.9), (0.08, -1.3))):
    rod(f'gun{k}', M['gun'], (CX + dx, CY, FZ + 0.08), (CX + dx + 0.18 * math.cos(a), CY + 0.18 * math.sin(a), FZ + 0.1), 0.022, r2=0.014, segs=10, outline=0.006)
    lathe(f'gunmount{k}', M['gun'], ((0.04, 0), (0.04, 0.03)), FZ + 0.06, CX + dx, CY, segs=12, outline=0.005)


# ---------- the colonial houses ----------
def house(name, x, y, w, d, h, mat, rot=0.0):
    box(name, M[mat], x, y, T - 0.005, w, d, h, rot_z=rot, outline=0.012, bevel=0)
    loft(f'{name}roof', M['roof'], [[(x - w / 2 - 0.01, y - d / 2 - 0.01, T + h - 0.005), (x + w / 2 + 0.01, y - d / 2 - 0.01, T + h - 0.005),
                                     (x + w / 2 + 0.01, y + d / 2 + 0.01, T + h - 0.005), (x - w / 2 - 0.01, y + d / 2 + 0.01, T + h - 0.005)],
                                    [(x - w / 2 + 0.02, y - 0.004, T + h + 0.06), (x + w / 2 - 0.02, y - 0.004, T + h + 0.06), (x + w / 2 - 0.02, y + 0.004, T + h + 0.06),
                                     (x - w / 2 + 0.02, y + 0.004, T + h + 0.06)]], outline=0.01)
    for k in range(int(w / 0.07)):
        wx = x - w / 2 + 0.035 + k * 0.07
        box(f'{name}win{k}', M['window'], wx, y - d / 2 - 0.004, T + h * 0.45, 0.025, 0.01, 0.04, outline=0, bevel=0)
        box(f'{name}shutter{k}', M['shutter'], wx + 0.018, y - d / 2 - 0.004, T + h * 0.45, 0.01, 0.01, 0.04, outline=0, bevel=0)


for k, (x, y, w, mat) in enumerate(((-0.65, 0.1, 0.2, 'ochre'), (-0.42, 0.18, 0.18, 'yellow'), (-0.55, 0.45, 0.2, 'red'), (-0.25, 0.5, 0.18, 'ochre'),
                                    (0.0, 0.62, 0.16, 'yellow'), (-0.3, -0.12, 0.16, 'red'), (0.05, 0.25, 0.16, 'ochre'))):
    house(f'house{k}', x, y, w, 0.14, rng.uniform(0.12, 0.16), mat)

# ---------- the House of Slaves, with its pair of curving stairs ----------
HX, HY = 0.12, -0.12
box('maison', M['salmon'], HX, HY, T - 0.005, 0.32, 0.18, 0.2, outline=0.016, bevel=0)
loft('maisonroof', M['roof'], [[(HX - 0.17, HY - 0.1, T + 0.195), (HX + 0.17, HY - 0.1, T + 0.195), (HX + 0.17, HY + 0.1, T + 0.195), (HX - 0.17, HY + 0.1, T + 0.195)],
                               [(HX - 0.14, HY - 0.004, T + 0.26), (HX + 0.14, HY - 0.004, T + 0.26), (HX + 0.14, HY + 0.004, T + 0.26), (HX - 0.14, HY + 0.004, T + 0.26)]],
     outline=0.012)
box('maisondoor', M['window'], HX, HY - 0.092, T, 0.05, 0.01, 0.07, outline=0, bevel=0)
for s in (-1, 1):
    for k in range(6):
        t = k / 6
        a = math.pi * 0.5 * t
        x = HX + s * (0.09 - 0.05 * math.sin(a)) + s * 0.01
        y = HY - 0.12 + 0.03 * (1 - math.cos(a))
        box(f'stair{s}{k}', M['salmon'], x + s * 0.03 * (1 - t), y, T - 0.005, 0.05, 0.035, 0.02 + 0.016 * k, outline=0.004, bevel=0)
box('landing', M['salmon'], HX, HY - 0.1, T + 0.09, 0.12, 0.05, 0.015, outline=0.006, bevel=0)
for k in range(3):
    box(f'maisonwin{k}', M['window'], HX - 0.1 + k * 0.1, HY - 0.092, T + 0.13, 0.03, 0.01, 0.045, outline=0, bevel=0)

# ---------- a baobab ----------
BX, BY = -0.7, -0.15
lathe('baobab', M['baobab'], ((0.08, 0), (0.075, 0.1), (0.055, 0.22), (0.05, 0.27)), T - 0.005, BX, BY, segs=14, outline=0.014)
for k in range(5):
    a = 2 * math.pi * k / 5
    p1 = (BX + 0.13 * math.cos(a), BY + 0.13 * math.sin(a), T + 0.35)
    rod(f'baobabbranch{k}', M['baobab'], (BX, BY, T + 0.26), p1, 0.018, r2=0.01, segs=6, outline=0.005)
    b = ball(f'baobableaf{k}', M['leaf'], 0, 0, 0, 0.055, outline=0.01)
    b.scale = (1.2, 1.2, 0.6)
    b.location = p1

# ---------- painted pirogues on the beach, the ferry ----------
for k, (x, y, a, mat) in enumerate(((-0.25, -0.35, 0.3, 'pirogue'), (-0.05, -0.38, 0.1, 'pirogue2'), (0.4, -0.3, -0.2, 'pirogue'))):
    box(f'pirogue{k}', M[mat], x, y, T - 0.01, 0.24, 0.05, 0.03, rot_z=a, outline=0.008, bevel=0.01)
    box(f'pirogueband{k}', M['paint'], x, y, T + 0.015, 0.245, 0.055, 0.008, rot_z=a, outline=0, bevel=0)
FX, FY = -0.45, -0.85
loft('ferryhull', M['ferry'], [[(FX - 0.17, FY - 0.04, G - 0.005), (FX + 0.12, FY - 0.04, G - 0.005), (FX + 0.18, FY, G - 0.005), (FX + 0.12, FY + 0.04, G - 0.005),
                                (FX - 0.17, FY + 0.04, G - 0.005)],
                               [(FX - 0.18, FY - 0.06, G + 0.045), (FX + 0.12, FY - 0.06, G + 0.045), (FX + 0.21, FY, G + 0.045), (FX + 0.12, FY + 0.06, G + 0.045),
                                (FX - 0.18, FY + 0.06, G + 0.045)]], outline=0.012)
box('ferrystripe', M['ferryStripe'], FX, FY - 0.06, G + 0.025, 0.28, 0.006, 0.014, outline=0, bevel=0)
box('ferrycabin', M['ferry'], FX - 0.03, FY, G + 0.045, 0.18, 0.09, 0.06, outline=0.01, bevel=0)
box('ferrywindows', M['ferryStripe'], FX - 0.03, FY - 0.046, G + 0.07, 0.16, 0.006, 0.02, outline=0, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

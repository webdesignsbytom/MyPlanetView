# A cartoon Gustavia for the country maps, built in the set's shared look (../toon.py): the little
# harbour capital of St Barthélemy, white houses with red roofs climbing the green hills round the
# harbour, the Swedish clock tower from the island's Swedish years, the lighthouse on its hill, and
# yachts moored in the harbour. Turned a little towards the camera.
# Run: blender -b --factory-startup -P gustavia.py -- gustavia-1024.png 1024 gustavia.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2fa8c8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'hill': toon('hill', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'quay': toon('quay', '#d8ccb4', shadow_mul=(0.8, 0.8, 0.88)),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'roof': toon('roof', '#c8402f'),
    'stone': toon('stone', '#b8a890', shadow_mul=(0.82, 0.8, 0.84)),
    'slate': toon('slate', '#5a6068', shadow_mul=(0.78, 0.8, 0.88)),
    'window': flat('window', '#3a3640'),
    'shutter': toon('shutter', '#3f7fc0'),
    'boat': toon('boat', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'mast': toon('mast', '#b7bcc4'),
    'tree': toon('tree', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1063)

# ---------- the hills round the harbour: a horseshoe, in four-sided pieces ----------
HC = (0.05, -0.1)
ANGLES = [math.radians(a) for a in range(-20, 201, 12)]
for k, (t0, t1) in enumerate(zip(ANGLES, ANGLES[1:])):
    for tier, (rin, rout, z0, z1) in enumerate((((0.5, 0.4), (1.2, 0.98), -0.01, 0.05), ((0.68, 0.55), (1.2, 0.98), 0.04, 0.16), ((0.86, 0.7), (1.2, 0.98), 0.15, 0.28))):
        lift = 0.18
        quad = [(HC[0] + rin[0] * math.cos(t0), HC[1] + rin[1] * math.sin(t0) + lift), (HC[0] + rout[0] * math.cos(t0), HC[1] + rout[1] * math.sin(t0) + lift),
                (HC[0] + rout[0] * math.cos(t1), HC[1] + rout[1] * math.sin(t1) + lift), (HC[0] + rin[0] * math.cos(t1), HC[1] + rin[1] * math.sin(t1) + lift)]
        piece = loft(f'hill{tier}_{k}', M['quay' if tier == 0 else 'hill'], [[(x, y, G + z0) for x, y in quad], [(x, y, G + z1) for x, y in quad]], outline=0.012)
        piece.visible_shadow = False


# ---------- the white houses under red roofs ----------
def house(name, t, rx, ry, z):
    x, y = HC[0] + rx * math.cos(t), HC[1] + ry * math.sin(t) + 0.18
    a = t - math.pi / 2
    w = rng.uniform(0.09, 0.12)
    box(name, M['white'], x, y, G + z - 0.005, w, w * 0.8, 0.07, rot_z=a, outline=0.008, bevel=0)
    pyramid(f'{name}roof', M['roof'], x, y, G + z + 0.065, w * 1.1, 0.05, outline=0.006)
    fx, fy = -math.cos(t), -math.sin(t)
    box(f'{name}shutter', M['shutter'], x + fx * (w * 0.4 + 0.004), y + fy * (w * 0.4 + 0.004), G + z + 0.02, 0.025, 0.01, 0.03, rot_z=a, outline=0, bevel=0)


n = 0
for tier, (rx, ry, z) in enumerate(((0.62, 0.5, 0.05), (0.78, 0.63, 0.16), (0.95, 0.77, 0.28))):
    for j in range(7 - tier):
        t = math.radians(-5 + (j + 0.5) * (190 / (7 - tier)))
        house(f'house{n}', t, rx, ry, z)
        n += 1
for k in range(6):
    t = math.radians(20 + k * 28)
    ball(f'hilltree{k}', M['tree'], HC[0] + 1.08 * math.cos(t), HC[1] + 0.88 * math.sin(t) + 0.18, G + 0.34, 0.07, outline=0.012)

# ---------- the Swedish clock tower and the lighthouse ----------
t = math.radians(150)
TX, TY = HC[0] + 0.62 * math.cos(t), HC[1] + 0.5 * math.sin(t) + 0.18
box('clocktower', M['stone'], TX, TY, G + 0.045, 0.09, 0.09, 0.22, outline=0.01, bevel=0)
pyramid('clocktowerroof', M['slate'], TX, TY, G + 0.26, 0.12, 0.09, outline=0.008)
cyl('clockface', M['white'], 0.025, 0.006, segs=14, outline=0.003, matrix=Matrix.Translation((TX + 0.03, TY - 0.04, G + 0.2)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
t = math.radians(30)
LX, LY = HC[0] + 0.98 * math.cos(t), HC[1] + 0.8 * math.sin(t) + 0.18
lathe('lighthouse', M['white'], ((0.035, 0), (0.028, 0.16)), G + 0.275, LX, LY, segs=10, outline=0.006)
lathe('lighthousetop', M['roof'], ((0.035, 0), (0.035, 0.02), (0.004, 0.05)), G + 0.43, LX, LY, segs=10, outline=0.004)

# ---------- yachts in the harbour ----------
for k, (x, y) in enumerate(((-0.15, 0.1), (0.2, 0.05), (0.0, -0.3), (0.4, -0.25), (-0.4, -0.5))):
    loft(f'hull{k}', M['boat'], [[(x - 0.08, y, G - 0.002), (x + 0.05, y - 0.022, G - 0.002), (x + 0.09, y, G - 0.002), (x + 0.05, y + 0.022, G - 0.002)],
                                 [(x - 0.09, y, G + 0.03), (x + 0.05, y - 0.03, G + 0.03), (x + 0.11, y, G + 0.03), (x + 0.05, y + 0.03, G + 0.03)]], outline=0.007)
    rod(f'mast{k}', M['mast'], (x, y, G + 0.03), (x, y, G + 0.26), 0.004, segs=6, outline=0)

turn(before, -20)
render(G)

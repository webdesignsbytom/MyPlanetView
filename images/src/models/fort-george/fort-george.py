# A cartoon St. George's and Fort George for the country maps, built in the set's shared look
# (../toon.py): Grenada's capital round its horseshoe harbour, the Carenage, its houses in bright
# colours under red fish-scale roofs climbing the green hillside, Fort George on the headland at the
# harbour mouth with its walls, guns and flag, palms along the quay, and boats in the harbour.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P fort-george.py -- fort-george-1024.png 1024 fort-george.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2fa0c8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'hill': toon('hill', '#5f9e55', shadow_mul=(0.7, 0.78, 0.8)),
    'quay': toon('quay', '#c9c2b4', shadow_mul=(0.8, 0.8, 0.88)),
    'rock': toon('rock', '#8a7a6a', shadow_mul=(0.8, 0.78, 0.84)),
    'fort': toon('fort', '#b8a888', shadow_mul=(0.82, 0.78, 0.82)),
    'gun': toon('gun', '#3a3a40'),
    'roof': toon('roof', '#c8402f'),
    'c1': toon('c1', '#f2d27a', shadow_mul=(0.84, 0.74, 0.62)), 'c2': toon('c2', '#8ac4e0', shadow_mul=(0.74, 0.8, 0.88)),
    'c3': toon('c3', '#e8a8b8', shadow_mul=(0.84, 0.74, 0.82)), 'c4': toon('c4', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'c5': toon('c5', '#a8d88a', shadow_mul=(0.74, 0.82, 0.78)),
    'window': flat('window', '#3a3640'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'tree': toon('tree', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'boat': toon('boat', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'sail': toon('sail', '#fbfbfd', shadow_mul=(0.82, 0.85, 0.95), lift=0.1),
    'mast': toon('mast', '#b7bcc4'),
    'flagRed': flat('flagRed', '#ce1126'), 'flagGold': flat('flagGold', '#fcd116'), 'flagGreen': flat('flagGreen', '#007a5e'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(557)


def ring(cx, cy, rx, ry, z, jitter, sides=20):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- the land wrapped round the harbour: a horseshoe, built in four-sided pieces so no face folds ----------
HC = (0.1, -0.05)
ANGLES = [math.radians(a) for a in range(-15, 196, 15)]


def band(name, mat, r_in, r_out, z0, z1, lift_out=0.0, lift_in=0.0):
    for k, (t0, t1) in enumerate(zip(ANGLES, ANGLES[1:])):
        quad = [(HC[0] + r_in[0] * math.cos(t0), HC[1] + r_in[1] * math.sin(t0) + lift_in), (HC[0] + r_out[0] * math.cos(t0), HC[1] + r_out[1] * math.sin(t0) + lift_out),
                (HC[0] + r_out[0] * math.cos(t1), HC[1] + r_out[1] * math.sin(t1) + lift_out), (HC[0] + r_in[0] * math.cos(t1), HC[1] + r_in[1] * math.sin(t1) + lift_in)]
        piece = loft(f'{name}{k}', M[mat], [[(x, y, z0) for x, y in quad], [(x, y, z1) for x, y in quad]], outline=0.014)
        piece.visible_shadow = False


band('quay', 'quay', (0.52, 0.38), (1.2, 0.95), G - 0.01, G + 0.04, lift_out=0.2)
# the hillside rising behind in terraced streets
TIERS = ((0.66, 0.5, 0.12), (0.8, 0.62, 0.22), (0.94, 0.74, 0.32))
for k, (rx, ry, z) in enumerate(TIERS):
    band(f'terrace{k}', 'hill', (rx, ry), (1.18, 0.93), G + 0.03, G + z, lift_out=0.2, lift_in=0.05 + 0.05 * k)


def house(name, t, rx, ry, lift, z, w, mat):
    x, y = HC[0] + rx * math.cos(t), HC[1] + ry * math.sin(t) + lift
    a = t - math.pi / 2
    box(name, M[mat], x, y, z - 0.005, w, w * 0.8, 0.07, rot_z=a, outline=0.008, bevel=0)
    pyramid(f'{name}roof', M['roof'], x, y, z + 0.065, w * 1.1, 0.05, outline=0.006)
    fx, fy = -math.cos(t), -math.sin(t)          # the front faces the harbour
    box(f'{name}win', M['window'], x + fx * (w * 0.4 + 0.004), y + fy * (w * 0.4 + 0.004), z + 0.02, 0.02, 0.01, 0.025, rot_z=a, outline=0, bevel=0)


# ---------- the colourful houses climbing the hill ----------
COLOURS = ('c1', 'c2', 'c3', 'c4', 'c5')
n = 0
for k, (rx, ry, z) in enumerate(TIERS):
    for j in range(7 - k):
        t = math.radians(15 + (j + 0.5) * (150 / (7 - k)) + 4 * k)
        house(f'house{n}', t, rx + 0.07, ry + 0.06, 0.05 + 0.05 * k + 0.03, G + z, rng.uniform(0.09, 0.12), COLOURS[n % 5])
        n += 1
for k in range(6):
    t = math.radians(30 + k * 25)
    ball(f'hilltree{k}', M['tree'], HC[0] + 1.08 * math.cos(t), HC[1] + 0.86 * math.sin(t) + 0.2, G + 0.38, 0.08, outline=0.014)

# ---------- Fort George on the headland at the harbour mouth ----------
FX, FY = -0.95, -0.25
head = loft('headland', M['rock'], [ring(FX, FY, 0.32, 0.26, -0.01, 0.05, 14), ring(FX, FY, 0.28, 0.22, 0.22, 0.05, 14)], outline=0.025)
head.visible_shadow = False
FZ = G + 0.22
fort = [(FX - 0.22, FY - 0.14), (FX + 0.18, FY - 0.17), (FX + 0.22, FY + 0.12), (FX - 0.18, FY + 0.16)]
loft('fortwalls', M['fort'], [[(x, y, FZ - 0.01) for x, y in fort], [(x, y, FZ + 0.12) for x, y in fort]], outline=0.016)
for k, (x, y) in enumerate(fort):
    lathe(f'bastion{k}', M['fort'], ((0.05, 0), (0.05, 0.14)), FZ - 0.01, x, y, segs=12, outline=0.01)
for k, a in enumerate((-2.2, -1.7, -1.2)):
    rod(f'gun{k}', M['gun'], (FX + 0.04 * k - 0.04, FY - 0.1, FZ + 0.13), (FX + 0.04 * k - 0.04 + 0.1 * math.cos(a), FY - 0.1 + 0.1 * math.sin(a), FZ + 0.14), 0.012,
        r2=0.009, segs=8, outline=0.004)
rod('flagpole', M['quay'], (FX, FY + 0.05, FZ + 0.12), (FX, FY + 0.05, FZ + 0.38), 0.005, segs=6, outline=0)
for k, mat in enumerate(('flagRed', 'flagGold', 'flagGreen')):
    box(f'flag{k}', M[mat], FX + 0.055, FY + 0.05, FZ + 0.35 - k * 0.02, 0.1, 0.006, 0.02, outline=0, bevel=0)

# ---------- palms on the quay, boats in the harbour ----------
for k, t in enumerate((165, 125, 55, 15)):
    a = math.radians(t)
    x, y = HC[0] + 0.58 * math.cos(a), HC[1] + 0.44 * math.sin(a) + 0.02
    h = rng.uniform(0.2, 0.26)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G + 0.04), (x + 0.02, y, G + 0.04 + h), 0.013, r2=0.01, segs=8, outline=0.006)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + 0.04 + h), (x + 0.02 + 0.09 * math.cos(b), y + 0.09 * math.sin(b), G + h - 0.01), 0.018, outline=0.005)
for k, (x, y) in enumerate(((0.05, 0.0), (0.3, -0.15), (-0.2, -0.2), (0.5, -0.75))):
    loft(f'boathull{k}', M['boat'], [[(x - 0.09, y, G - 0.002), (x + 0.06, y - 0.025, G - 0.002), (x + 0.1, y, G - 0.002), (x + 0.06, y + 0.025, G - 0.002)],
                                     [(x - 0.1, y, G + 0.03), (x + 0.06, y - 0.035, G + 0.03), (x + 0.12, y, G + 0.03), (x + 0.06, y + 0.035, G + 0.03)]], outline=0.008)
    if k % 2 == 0:
        rod(f'boatmast{k}', M['mast'], (x, y, G + 0.03), (x, y, G + 0.26), 0.004, segs=6, outline=0)
        loft(f'boatsail{k}', M['sail'], [[(x - 0.07, y - 0.002, G + 0.05), (x - 0.004, y - 0.002, G + 0.05), (x - 0.004, y - 0.002, G + 0.25)],
                                         [(x - 0.07, y + 0.002, G + 0.05), (x - 0.004, y + 0.002, G + 0.05), (x - 0.004, y + 0.002, G + 0.25)]], outline=0.006)

turn(before, -20)
render(G)

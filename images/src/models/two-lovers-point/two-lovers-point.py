# A cartoon Two Lovers Point for the country maps, built in the set's shared look (../toon.py):
# Puntan Dos Amantes on Guam, the limestone cliff over Tumon Bay with its lookout jutting out at the
# edge and the statue of the two lovers, their hair tied together, the jungle on top, the bay's
# reef and beach, and the hotels round it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P two-lovers-point.py -- two-lovers-point-1024.png 1024 two-lovers-point.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2a8ac0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'reef': toon('reef', '#5ad0d0', shadow_mul=(0.74, 0.84, 0.88), lift=0.35),
    'sand': toon('sand', '#f2e8d0', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'limestone': toon('limestone', '#d6ccb8', shadow_mul=(0.82, 0.8, 0.86)),
    'jungle': toon('jungle', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'jungleDark': toon('jungleDark', '#2f7240', shadow_mul=(0.7, 0.78, 0.8)),
    'deck': toon('deck', '#b8b4ac', shadow_mul=(0.8, 0.8, 0.88), lift=0.2),
    'rail': toon('rail', '#f8f6f0', lift=0.2),
    'bronze': toon('bronze', '#8a6a4a', shadow_mul=(0.82, 0.76, 0.72)),
    'hotel': toon('hotel', '#f2efe8', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'hotel2': toon('hotel2', '#e8d8c0', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'window': flat('window', '#5a7a9a'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1129)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the bay: the beach at the back right, the reef flat ----------
flat_face('beach', M['sand'], [(1.41 * math.cos(math.radians(a)), 1.41 * math.sin(math.radians(a))) for a in range(-20, 96, 4)], G + 0.003, outline=0.008)
flat_face('reef', M['reef'], [(1.12 * math.cos(math.radians(a)), 1.12 * math.sin(math.radians(a)) - 0.08) for a in range(-25, 100, 4)], G + 0.005, outline=0.006)

# ---------- the headland: a limestone cliff with jungle on top ----------
FOOT = [(-0.15, -0.55), (0.12, -0.2), (0.05, 0.4), (-0.35, 0.95), (-0.95, 0.85), (-1.3, 0.3), (-1.2, -0.45), (-0.65, -0.8)]
CEN = (-0.6, 0.1)


def shrink(pts, f, z):
    return [(CEN[0] + (x - CEN[0]) * f, CEN[1] + (y - CEN[1]) * f, G + z) for x, y in pts]


cl = loft('cliff', M['limestone'], [shrink(FOOT, 1.0, -0.01), shrink(FOOT, 0.97, 0.5)], outline=0.02)
cl.visible_shadow = False
top = loft('jungletop', M['jungle'], [shrink(FOOT, 0.97, 0.495), shrink(FOOT, 0.9, 0.56)], outline=0.014, smooth=True)
top.visible_shadow = False
T = G + 0.56
for k in range(16):
    a = 2 * math.pi * k / 16
    x, y = CEN[0] + 0.45 * math.cos(a) - 0.1, CEN[1] + 0.5 * math.sin(a) + 0.12
    ball(f'jungle{k}', M['jungleDark' if k % 2 else 'jungle'], x, y, T + 0.02, rng.uniform(0.08, 0.1), outline=0.012)

# ---------- the lookout jutting out at the tip, and the lovers ----------
LX, LY = 0.0, -0.4
box('deck', M['deck'], LX + 0.05, LY + 0.02, T - 0.03, 0.34, 0.2, 0.03, rot_z=0.9, outline=0.008, bevel=0)
for k in range(7):
    t = k / 6
    a = 0.9
    x = LX + 0.05 + (t - 0.5) * 0.34 * math.cos(a) + 0.1 * math.sin(a)
    y = LY + 0.02 + (t - 0.5) * 0.34 * math.sin(a) - 0.1 * math.cos(a)
    rod(f'railpost{k}', M['rail'], (x, y, T), (x, y, T + 0.05), 0.005, segs=5, outline=0.002)
c, s = math.cos(0.9), math.sin(0.9)
bar('railtop', M['rail'], (LX + 0.05 - 0.17 * c + 0.1 * s, LY + 0.02 - 0.17 * s - 0.1 * c, T + 0.05), (LX + 0.05 + 0.17 * c + 0.1 * s, LY + 0.02 + 0.17 * s - 0.1 * c, T + 0.05),
    0.008, outline=0.002)
SX, SY = -0.35, -0.2
box('plinth', M['limestone'], SX, SY, T - 0.005, 0.1, 0.08, 0.05, outline=0.006, bevel=0)
for k, dx in enumerate((-0.022, 0.022)):
    rod(f'lover{k}', M['bronze'], (SX + dx, SY, T + 0.045), (SX + dx * 0.6, SY, T + 0.2), 0.02, r2=0.014, segs=8, outline=0.005)
    ball(f'loverhead{k}', M['bronze'], SX + dx * 0.55, SY, T + 0.225, 0.02, outline=0.004)
bar('hairknot', M['bronze'], (SX - 0.012, SY + 0.012, T + 0.235), (SX + 0.012, SY + 0.012, T + 0.235), 0.014, outline=0.003)


# ---------- the hotels round Tumon Bay ----------
def hotel(name, x, y, w, h, a, mat):
    box(name, M[mat], x, y, G - 0.005, w, 0.1, h, rot_z=a, outline=0.008, bevel=0)
    for row in range(int(h / 0.05)):
        box(f'{name}band{row}', M['window'], x - 0.051 * math.sin(-a), y - 0.051 * math.cos(-a), G + 0.03 + row * 0.05, w * 0.85, 0.006, 0.018, rot_z=a, outline=0, bevel=0)


hotel('hotel0', 0.45, 1.15, 0.2, 0.34, -0.5, 'hotel')
hotel('hotel1', 0.82, 0.9, 0.22, 0.28, -0.8, 'hotel2')
hotel('hotel2', 1.08, 0.5, 0.2, 0.24, -1.1, 'hotel')
hotel('hotel3', 1.2, 0.1, 0.16, 0.2, -1.4, 'hotel2')
for k, (x, y) in enumerate(((0.62, 0.88), (0.95, 0.62), (1.12, 0.25), (0.25, 1.15))):
    h = 0.24
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + h), 0.012, r2=0.009, segs=8, outline=0.004)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + h), (x + 0.03 + 0.09 * math.cos(b), y + 0.09 * math.sin(b), G + h - 0.045), 0.017, outline=0.004)

turn(before, -20)
render(G)

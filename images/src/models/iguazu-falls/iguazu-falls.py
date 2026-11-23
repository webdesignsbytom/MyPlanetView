# A cartoon Iguazú Falls for the country maps, built in the set's shared look (../toon.py): the
# Devil's Throat, the horseshoe of waterfalls pouring off the basalt cliff into its misty gorge, the
# upper river running to the brink, the walkway out over it with people at the rail, the jungle on
# top, a rainbow in the spray, and a boat on the river below. Turned a little towards the camera.
# Run: blender -b --factory-startup -P iguazu-falls.py -- iguazu-falls-1024.png 1024 iguazu-falls.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'river': toon('river', '#5a9a96', shadow_mul=(0.76, 0.84, 0.86), lift=0.3),
    'upper': toon('upper', '#7a9a80', shadow_mul=(0.76, 0.84, 0.86), lift=0.3),
    'basalt': toon('basalt', '#6e5e50', shadow_mul=(0.84, 0.82, 0.88)),
    'jungle': toon('jungle', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'jungleDark': toon('jungleDark', '#2f7240', shadow_mul=(0.7, 0.78, 0.8)),
    'fall': toon('fall', '#f4f8fb', shadow_mul=(0.84, 0.88, 0.96), lift=0.15),
    'fallBlue': toon('fallBlue', '#d4eaf2', shadow_mul=(0.84, 0.88, 0.96), lift=0.15),
    'mist': toon('mist', '#ffffff', shadow_mul=(0.88, 0.9, 0.96), lift=0.1),
    'walk': toon('walk', '#9a9ea6', shadow_mul=(0.8, 0.8, 0.88)),
    'r0': flat('r0', '#e8504a'), 'r1': flat('r1', '#f0a040'), 'r2': flat('r2', '#f0d850'), 'r3': flat('r3', '#6ab85a'), 'r4': flat('r4', '#4a8ad0'),
    's0': toon('s0', '#e8402c'), 's1': toon('s1', '#f0c030'), 's2': toon('s2', '#2f6fc0'),
    'boat': toon('boat', '#f0a030'),
})

G = tile(M['river'])
before = set(bpy.data.objects)
rng = random.Random(1231)

# ---------- the horseshoe cliff, open towards the camera, in four-sided pieces ----------
HC = (0.0, -0.05)
H = 0.4
RIN, RTOP, ROUT = (0.5, 0.42), (0.74, 0.62), (1.24, 1.16)
ANGLES = [math.radians(a) for a in range(-16, 197, 12)]


def at(r, t):
    return (HC[0] + r[0] * math.cos(t), HC[1] + r[1] * math.sin(t))


for k, (t0, t1) in enumerate(zip(ANGLES, ANGLES[1:])):
    quad = [at(RIN, t0), at(ROUT, t0), at(ROUT, t1), at(RIN, t1)]
    piece = loft(f'cliff{k}', M['basalt'], [[(x, y, G - 0.01) for x, y in quad], [(x, y, G + H) for x, y in quad]], outline=0.014)
    piece.visible_shadow = False
    water = [at(RIN, t0), at(RTOP, t0), at(RTOP, t1), at(RIN, t1)]
    loft(f'upperriver{k}', M['upper'], [[(x, y, G + H - 0.002) for x, y in water], [(x, y, G + H + 0.01) for x, y in water]], outline=0.004)
    land = [at(RTOP, t0), at(ROUT, t0), at(ROUT, t1), at(RTOP, t1)]
    loft(f'junglefloor{k}', M['jungle'], [[(x, y, G + H - 0.002) for x, y in land], [(x, y, G + H + 0.02) for x, y in land]], outline=0.006)
    tm = (t0 + t1) / 2
    for j, f in enumerate((0.35, 0.75)):
        r = (RTOP[0] + (ROUT[0] - RTOP[0]) * f, RTOP[1] + (ROUT[1] - RTOP[1]) * f)
        x, y = at(r, tm + (j - 0.5) * 0.08)
        ball(f'jungletree{k}{j}', M['jungleDark' if (k + j) % 2 else 'jungle'], x, y, G + H + 0.05, rng.uniform(0.065, 0.085), outline=0.01)

# ---------- the falls: curtains of water down the inner face ----------
for k in range(16):
    t = math.radians(4 + k * 11.5)
    x, y = at((RIN[0] - 0.012, RIN[1] - 0.012), t)
    w = 0.1 if k % 3 else 0.075
    box(f'fall{k}', M['fall' if k % 2 else 'fallBlue'], x, y, G - 0.005, w, 0.02, H + 0.012, rot_z=t + math.pi / 2, outline=0.005, bevel=0)
for k in range(14):
    t = math.radians(8 + k * 13)
    x, y = at((RIN[0] - 0.08, RIN[1] - 0.07), t)
    ball(f'mist{k}', M['mist'], x, y, G + 0.04, rng.uniform(0.06, 0.09), outline=0.01)
for k in range(6):
    ball(f'throatmist{k}', M['mist'], HC[0] - 0.25 + k * 0.1, HC[1] + 0.05 + 0.08 * math.sin(k), G + 0.03, rng.uniform(0.07, 0.09), outline=0.01)

# ---------- the walkway out to the brink, people at its rail ----------
T = math.radians(55)
p0, p1 = at((ROUT[0] - 0.05, ROUT[1] - 0.05), T), at((RIN[0] + 0.02, RIN[1] + 0.02), T)
WZ = G + H + 0.04
bar('walkway', M['walk'], (p0[0], p0[1], WZ), (p1[0], p1[1], WZ), 0.045, outline=0.004)
for k in range(5):
    f = k / 4
    x, y = p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f
    rod(f'walkpost{k}', M['walk'], (x, y, G + H), (x, y, WZ), 0.006, segs=5, outline=0.002)
for k, f in enumerate((0.8, 0.92)):
    x, y = p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f
    rod(f'visitor{k}', M[f's{k}'], (x, y, WZ + 0.01), (x, y, WZ + 0.06), 0.014, segs=6, outline=0.003)
    ball(f'visitorhead{k}', M['s1'] if k else M['s2'], x, y, WZ + 0.075, 0.013, outline=0.003)

# ---------- a rainbow in the spray, a boat on the river below ----------
RX, RY = 0.3, -0.38
for b in range(5):
    R = 0.3 - b * 0.022
    pts = [(RX + R * math.cos(math.pi * j / 14), RY, G + 0.02 + R * 0.95 * math.sin(math.pi * j / 14)) for j in range(15)]
    for j in range(14):
        rod(f'rainbow{b}{j}', M[f'r{b}'], pts[j], pts[j + 1], 0.011, segs=6, outline=0)
BX, BY = -0.45, -0.75
loft('boat', M['boat'], [[(BX - 0.12, BY, G - 0.002), (BX + 0.08, BY - 0.035, G - 0.002), (BX + 0.14, BY, G - 0.002), (BX + 0.08, BY + 0.035, G - 0.002)],
                         [(BX - 0.13, BY, G + 0.04), (BX + 0.08, BY - 0.045, G + 0.04), (BX + 0.18, BY, G + 0.05), (BX + 0.08, BY + 0.045, G + 0.04)]], outline=0.007)
for k in range(3):
    ball(f'rider{k}', M[f's{k}'], BX - 0.06 + k * 0.06, BY, G + 0.06, 0.018, outline=0.003)

turn(before, -20)
render(G)

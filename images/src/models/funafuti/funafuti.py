# A cartoon Funafuti for the country maps, built in the set's shared look (../toon.py): Tuvalu's
# atoll, a thin curving islet of white sand and palms round a wide turquoise lagoon, Fongafale with
# its airstrip running along it, a little plane and houses beside it, the conservation area's
# islets across the lagoon, and an outrigger canoe. Turned a little towards the camera.
# Run: blender -b --factory-startup -P funafuti.py -- funafuti-1024.png 1024 funafuti.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ocean': toon('ocean', '#1f6fa8', shadow_mul=(0.76, 0.82, 0.9), lift=0.35),
    'lagoon': toon('lagoon', '#6fd4d0', shadow_mul=(0.76, 0.86, 0.9), lift=0.3),
    'sand': toon('sand', '#f6ecd0', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'green': toon('green2', '#7aba5a', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'runway': toon('runway', '#6a6670', shadow_mul=(0.82, 0.82, 0.9)),
    'mark': flat('mark', '#f8f8f8'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'house': toon('house', '#f4efe2', lift=0.2), 'roof': toon('roof', '#3f7fc0'), 'roof2': toon('roof2', '#d0402f'),
    'plane': toon('plane', '#f8f8f8', lift=0.2), 'planeStripe': toon('planeStripe', '#3f7fc0'),
    'canoe': toon('canoe', '#8a5a3a'),
})

G = tile(M['ocean'])
before = set(bpy.data.objects)
rng = random.Random(997)

AX, AY = 0.05, 0.15
cyl('lagoon', M['lagoon'], 1.0, 0.004, segs=48, outline=0.006, matrix=Matrix.Translation((AX, AY, G + 0.002)) @ Matrix.Scale(1.05, 4, (1, 0, 0)) @ Matrix.Scale(0.85, 4, (0, 1, 0)))


def arc_band(name, mat, a0, a1, r_in, r_out, z0, z1, n=16):
    """A strip of land along the atoll's rim from angle a0 to a1 (degrees), in four-sided pieces."""
    for k in range(n):
        t0 = math.radians(a0 + (a1 - a0) * k / n)
        t1 = math.radians(a0 + (a1 - a0) * (k + 1) / n)
        quad = [(AX + r_in[0] * math.cos(t0), AY + r_in[1] * math.sin(t0)), (AX + r_out[0] * math.cos(t0), AY + r_out[1] * math.sin(t0)),
                (AX + r_out[0] * math.cos(t1), AY + r_out[1] * math.sin(t1)), (AX + r_in[0] * math.cos(t1), AY + r_in[1] * math.sin(t1))]
        piece = loft(f'{name}{k}', M[mat], [[(x, y, z0) for x, y in quad], [(x, y, z1) for x, y in quad]], outline=0.008)
        piece.visible_shadow = False


# ---------- Fongafale: a long curving islet along the front, its airstrip and houses ----------
arc_band('fongafale', 'sand', 200, 340, (0.88, 0.7), (1.12, 0.92), G - 0.01, G + 0.03)
arc_band('fongafalegreen', 'green', 205, 335, (0.92, 0.74), (1.08, 0.88), G + 0.02, G + 0.035)
arc_band('runway', 'runway', 225, 315, (0.97, 0.78), (1.03, 0.83), G + 0.03, G + 0.038, n=12)
for k in range(9):
    t = math.radians(230 + k * 10)
    x, y = AX + 1.0 * math.cos(t), AY + 0.805 * math.sin(t)
    box(f'runwaymark{k}', M['mark'], x, y, G + 0.037, 0.03, 0.008, 0.003, rot_z=t + math.pi / 2, outline=0, bevel=0)
t = math.radians(260)
PX, PY = AX + 1.0 * math.cos(t), AY + 0.805 * math.sin(t)
rod('fuselage', M['plane'], (PX - 0.07, PY + 0.01, G + 0.06), (PX + 0.07, PY - 0.01, G + 0.06), 0.014, r2=0.01, segs=10, outline=0.003)
bar('wing', M['plane'], (PX - 0.01, PY - 0.07, G + 0.06), (PX + 0.01, PY + 0.07, G + 0.06), 0.012, outline=0.002)
bar('tail', M['planeStripe'], (PX - 0.065, PY + 0.008, G + 0.06), (PX - 0.075, PY + 0.01, G + 0.1), 0.01, outline=0.002)
for k in range(5):
    t = math.radians(215 + k * 26)
    x, y = AX + 1.07 * math.cos(t), AY + 0.87 * math.sin(t)
    box(f'house{k}', M['house'], x, y, G + 0.03, 0.06, 0.05, 0.04, rot_z=t + math.pi / 2, outline=0.004, bevel=0)
    pyramid(f'houseroof{k}', M['roof' if k % 2 else 'roof2'], x, y, G + 0.07, 0.07, 0.03, outline=0.003)

# ---------- the islets of the conservation area across the lagoon ----------
for k, (a0, a1) in enumerate(((20, 50), (65, 95), (110, 140), (155, 175))):
    arc_band(f'islet{k}', 'sand', a0, a1, (0.92, 0.74), (1.1, 0.9), G - 0.01, G + 0.03, n=4)
    for j in range(2):
        t = math.radians(a0 + (a1 - a0) * (j + 0.5) / 2)
        x, y = AX + 1.0 * math.cos(t), AY + 0.82 * math.sin(t)
        h = rng.uniform(0.18, 0.24)
        rod(f'palmtrunk{k}{j}', M['trunk'], (x, y, G + 0.03), (x + 0.02, y, G + 0.03 + h), 0.01, r2=0.008, segs=6, outline=0.004)
        for f in range(6):
            b = 2 * math.pi * f / 6 + j
            bar(f'frond{k}{j}{f}', M['palm'], (x + 0.02, y, G + 0.03 + h), (x + 0.02 + 0.075 * math.cos(b), y + 0.075 * math.sin(b), G + h - 0.01), 0.016, outline=0.004)
for k in range(6):
    t = math.radians(207 + k * 25)
    x, y = AX + 0.92 * math.cos(t), AY + 0.75 * math.sin(t)
    h = rng.uniform(0.18, 0.24)
    rod(f'fpalmtrunk{k}', M['trunk'], (x, y, G + 0.03), (x + 0.02, y, G + 0.03 + h), 0.01, r2=0.008, segs=6, outline=0.004)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'ffrond{k}{f}', M['palm'], (x + 0.02, y, G + 0.03 + h), (x + 0.02 + 0.075 * math.cos(b), y + 0.075 * math.sin(b), G + h - 0.01), 0.016, outline=0.004)

# ---------- an outrigger canoe on the lagoon ----------
CX, CY = 0.0, 0.1
loft('canoe', M['canoe'], [[(CX - 0.13, CY, G + 0.003), (CX, CY - 0.022, G + 0.003), (CX + 0.13, CY, G + 0.003), (CX, CY + 0.022, G + 0.003)],
                           [(CX - 0.15, CY, G + 0.03), (CX, CY - 0.03, G + 0.03), (CX + 0.15, CY, G + 0.03), (CX, CY + 0.03, G + 0.03)]], outline=0.006)
rod('outrigger', M['canoe'], (CX - 0.07, CY + 0.1, G + 0.01), (CX + 0.07, CY + 0.1, G + 0.01), 0.01, segs=6, outline=0.002)
for k, dx in enumerate((-0.04, 0.04)):
    bar(f'boom{k}', M['canoe'], (CX + dx, CY, G + 0.03), (CX + dx, CY + 0.1, G + 0.012), 0.007, outline=0.002)

turn(before, -20)
render(G)

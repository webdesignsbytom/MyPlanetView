# A cartoon Pilgrimage Church of St John of Nepomuk at Zelená Hora for the country maps, built in the
# set's shared look (../toon.py): Santini's church on its green hill, laid out as a five-pointed star
# in honour of the saint's five stars, its white walls with the pointed windows, the tall central
# drum and dome, and round it the cloister wall that follows the star's shape in a ten-pointed ring
# with its little chapels and gates, among the trees of the hilltop. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P zelena-hora.py -- zelena-hora-1024.png 1024 zelena-hora.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'hill': toon('hill', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'court': toon('court', '#9ac06a', lift=0.15),
    'white': toon('white', '#f6f4ee', shadow_mul=(0.82, 0.84, 0.9), lift=0.22),
    'whiteDark': toon('whiteDark', '#dcd6c8'),
    'roof': toon('roof', '#5a6a58', shadow_mul=(0.84, 0.86, 0.88)),
    'red': toon('red', '#b8503e'),
    'dark': flat('dark', '#2e2a2a'),
    'gold': toon('gold', '#e0b040', lift=0.2),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile()
before = set(bpy.data.objects)

# ---------- the hill ----------
hl = lathe('hill', M['hill'], ((1.3, 0), (1.15, 0.06), (0.9, 0.14), (0.75, 0.16), (0.0, 0.16)), G - 0.01, 0, 0, segs=40, outline=0.008)
hl.visible_shadow = False
T = G + 0.15


def star(n, r_out, r_in, rot=math.pi / 2):
    pts = []
    for k in range(2 * n):
        a = rot + math.pi * k / n
        r = r_out if k % 2 == 0 else r_in
        pts.append((r * math.cos(a), r * math.sin(a)))
    return pts


# ---------- the ten-pointed cloister wall round the church ----------
ring = star(10, 0.7, 0.58)
for k in range(len(ring)):
    (x0, y0), (x1, y1) = ring[k], ring[(k + 1) % len(ring)]
    bar(f'cloisterwall{k}', M['white'], (x0, y0, T + 0.05), (x1, y1, T + 0.05), 0.06, outline=0.004)
    bar(f'cloisterroof{k}', M['roof'], (x0, y0, T + 0.09), (x1, y1, T + 0.09), 0.08, outline=0.002)
for k in range(0, len(ring), 2):
    x, y = ring[k]
    box(f'chapel{k}', M['white'], x, y, T - 0.005, 0.08, 0.08, 0.12, rot_z=math.atan2(y, x), outline=0.003, bevel=0)
    lathe(f'chapelroof{k}', M['roof'], ((0.055, 0), (0.003, 0.07)), T + 0.115, x, y, segs=6, outline=0.002, smooth=False)

# ---------- the church: a five-pointed star of chapels round the central drum ----------
STAR = star(5, 0.34, 0.2)
# built as five pointed chapels, each a convex wedge from the middle out to its point
for k in range(5):
    p_in0 = STAR[(2 * k - 1) % 10]
    p_out = STAR[2 * k]
    p_in1 = STAR[(2 * k + 1) % 10]
    wedge = [(0, 0), p_in0, p_out, p_in1]
    loft(f'starchapel{k}', M['white'], [[(x, y, T - 0.005) for x, y in wedge], [(x, y, T + 0.2) for x, y in wedge]], outline=0.006)
    roof = [(0, 0, T + 0.2), (p_in0[0], p_in0[1], T + 0.2), (p_out[0], p_out[1], T + 0.2), (p_in1[0], p_in1[1], T + 0.2)]
    loft(f'starroof{k}', M['roof'], [roof, [(x * 0.6, y * 0.6, T + 0.28) for x, y, _ in roof]], outline=0.004)
    # a pointed window on each point's two faces
    for p_in in (p_in0, p_in1):
        mx, my = (p_out[0] + p_in[0]) / 2, (p_out[1] + p_in[1]) / 2
        ang = math.atan2(p_in[1] - p_out[1], p_in[0] - p_out[0])
        nx, ny = math.sin(ang), -math.cos(ang)
        if (mx * nx + my * ny) < 0:
            nx, ny = -nx, -ny
        if ny > 0.3:
            continue
        box(f'starwin{k}{p_in[0]:.2f}', M['dark'], mx + nx * 0.004, my + ny * 0.004, T + 0.06, 0.025, 0.006, 0.09, rot_z=ang, outline=0, bevel=0)
# the central drum and dome
lathe('drum', M['white'], ((0.14, 0), (0.14, 0.2)), T + 0.18, 0, 0, segs=10, outline=0.006, smooth=False)
for k in range(10):
    a = 2 * math.pi * (k + 0.5) / 10
    if math.sin(a) > 0.3:
        continue
    box(f'drumwin{k}', M['dark'], 0.135 * math.cos(a), 0.135 * math.sin(a), T + 0.24, 0.004, 0.03, 0.08, rot_z=a, outline=0, bevel=0)
lathe('dome', M['roof'], ((0.15, 0), (0.13, 0.07), (0.08, 0.13), (0.03, 0.16)), T + 0.375, 0, 0, segs=10, outline=0.005, smooth=False)
lathe('lantern', M['white'], ((0.035, 0), (0.035, 0.05), (0.003, 0.1)), T + 0.53, 0, 0, segs=10, outline=0.002, smooth=False)
for k in range(5):
    a = math.pi / 2 + 2 * math.pi * k / 5
    ball(f'star{k}', M['gold'], 0.045 * math.cos(a), 0.045 * math.sin(a), T + 0.63, 0.008, outline=0)
rod('cross', M['gold'], (0, 0, T + 0.62), (0, 0, T + 0.67), 0.004, segs=4, outline=0)

# ---------- trees round the hilltop ----------
for k in range(10):
    a = 2 * math.pi * k / 10 + 0.3
    x, y = 0.98 * math.cos(a), 0.98 * math.sin(a)
    ball(f'tree{k}', M['tree'], x, y, G + 0.17, 0.1, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

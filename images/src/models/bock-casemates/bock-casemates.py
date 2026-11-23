# A cartoon Bock Casemates for the country maps, built in the set's shared look (../toon.py): the
# Bock promontory in Luxembourg City, its sandstone cliff riddled with the openings of the
# casemates, the old fortress walls along its top, the Alzette river curving round its foot, the
# arched Castle Bridge, and the Grund's houses under their slate roofs by the water.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P bock-casemates.py -- bock-casemates-1024.png 1024 bock-casemates.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'rock': toon('rock', '#c9b48e', shadow_mul=(0.82, 0.78, 0.8)),
    'rockDark': toon('rockDark', '#a8946e', shadow_mul=(0.82, 0.78, 0.8)),
    'hole': flat('hole', '#2a2228'),
    'wall': toon('wall', '#d8ccb0', shadow_mul=(0.82, 0.78, 0.82)),
    'river': toon('river', '#5a9ab0', shadow_mul=(0.75, 0.82, 0.88), lift=0.3),
    'house': toon('house', '#f3efe6', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'houseCream': toon('houseCream', '#e8dcc0', shadow_mul=(0.82, 0.8, 0.84)),
    'slate': toon('slate', '#4f5560', shadow_mul=(0.75, 0.75, 0.85)),
    'window': flat('window', '#3a3640'),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(503)

# ---------- the river curving round the foot of the rock ----------
KNOTS = [(-1.3, -0.33), (-0.7, -0.5), (-0.1, -0.35), (0.45, -0.05), (0.85, 0.45), (0.95, 0.92)]
path = []
for (x0, y0), (x1, y1), (x2, y2) in zip(KNOTS, KNOTS[1:], KNOTS[2:]):
    ax, ay, bx, by = (x0 + x1) / 2, (y0 + y1) / 2, (x1 + x2) / 2, (y1 + y2) / 2
    for j in range(8):
        t = j / 8
        path.append(((1 - t) ** 2 * ax + 2 * (1 - t) * t * x1 + t * t * bx, (1 - t) ** 2 * ay + 2 * (1 - t) * t * y1 + t * t * by))
path = [KNOTS[0]] + path + [KNOTS[-1]]
bm = bmesh.new()
left, right = [], []
for k, (x, y) in enumerate(path):
    (xa, ya), (xb, yb) = path[max(0, k - 1)], path[min(len(path) - 1, k + 1)]
    d = math.hypot(xb - xa, yb - ya) or 1
    px, py = -(yb - ya) / d, (xb - xa) / d
    left.append(bm.verts.new((x + px * 0.1, y + py * 0.1, G + 0.006)))
    right.append(bm.verts.new((x - px * 0.1, y - py * 0.1, G + 0.006)))
for k in range(len(path) - 1):
    bm.faces.new((left[k], right[k], right[k + 1], left[k + 1]))
finish('river', bm, M['river'], outline=0.012)

# ---------- the Bock: a sandstone promontory inside the bend ----------
PROM = [(-0.95, 0.05), (-0.4, -0.15), (0.15, 0.05), (0.5, 0.4), (0.55, 0.9), (0.1, 1.2), (-0.6, 1.1), (-1.1, 0.6)]
H = 0.55
inner = [(x * 0.96 - 0.01, y * 0.96 + 0.03) for x, y in PROM]
rock = loft('bock', M['rock'], [[(x, y, G - 0.01) for x, y in PROM], [(x, y, G + H) for x, y in inner]], outline=0.035)
rock.visible_shadow = False
top = loft('bocktop', M['grass'], [[(x, y, G + H - 0.005) for x, y in inner], [(x, y, G + H + 0.03) for x, y in inner]], outline=0.018)
top.visible_shadow = False
# the cliff's strata
for k, z in enumerate((0.15, 0.32)):
    for j, ((x0, y0), (x1, y1)) in enumerate(zip(PROM[:4], PROM[1:4])):
        t = z / H
        a0 = (x0 + (inner[j][0] - x0) * t, y0 + (inner[j][1] - y0) * t)
        a1 = (x1 + (inner[j + 1][0] - x1) * t, y1 + (inner[j + 1][1] - y1) * t)
        bar(f'stratum{k}{j}', M['rockDark'], (a0[0], a0[1] - 0.006, G + z), (a1[0], a1[1] - 0.006, G + z), 0.016, outline=0)
# rows of casemate openings on its front faces
for j, ((x0, y0), (x1, y1)) in enumerate(zip(PROM[:4], PROM[1:4])):
    a = math.atan2(y1 - y0, x1 - x0)
    nx, ny = math.sin(a), -math.cos(a)
    for row, z in enumerate((0.1, 0.24, 0.38)):
        t = z / H
        for c in range(4):
            u = (c + 0.5) / 4
            bx = x0 + (x1 - x0) * u
            by = y0 + (y1 - y0) * u
            ix = inner[j][0] + (inner[j + 1][0] - inner[j][0]) * u
            iy = inner[j][1] + (inner[j + 1][1] - inner[j][1]) * u
            px, py = bx + (ix - bx) * t, by + (iy - by) * t
            box(f'casemate{j}{row}{c}', M['hole'], px + nx * 0.004, py + ny * 0.004, G + z, 0.035, 0.012, 0.05, rot_z=a, outline=0, bevel=0)

# ---------- the fortress walls along the top ----------
T = G + H + 0.03
for k, ((x0, y0), (x1, y1)) in enumerate(zip(inner[:4], inner[1:4])):
    sx, sy = x0 + (0.0 - x0) * 0.08, y0 + (0.55 - y0) * 0.08
    ex, ey = x1 + (0.0 - x1) * 0.08, y1 + (0.55 - y1) * 0.08
    length = math.hypot(ex - sx, ey - sy)
    box(f'topwall{k}', M['wall'], (sx + ex) / 2, (sy + ey) / 2, T - 0.01, length, 0.04, 0.08, rot_z=math.atan2(ey - sy, ex - sx), outline=0.01, bevel=0)
    n = int(length / 0.07)
    for m in range(n):
        u = (m + 0.5) / n
        box(f'topmerlon{k}{m}', M['wall'], sx + (ex - sx) * u, sy + (ey - sy) * u, T + 0.07, 0.025, 0.04, 0.03, rot_z=math.atan2(ey - sy, ex - sx), outline=0.004, bevel=0)
lathe('watchtower', M['wall'], ((0.07, 0), (0.07, 0.2)), T - 0.01, -0.35, 0.5, segs=16, outline=0.014)
lathe('watchtowerroof', M['slate'], ((0.085, 0), (0.004, 0.14)), T + 0.19, -0.35, 0.5, segs=16, outline=0.01)
for k, (x, y) in enumerate(((-0.6, 0.75), (0.1, 0.85), (-0.15, 0.3))):
    ball(f'toptree{k}', M['tree'], x, y, T + 0.08, 0.09, outline=0.016)

# ---------- the arched Castle Bridge, from the cliff across the river to the far bank ----------
BRX = -0.72
Y_ROCK, Y_BANK = -0.04, -0.72
for k in range(3):
    y = Y_BANK + 0.1 + k * 0.19
    for s in (-1, 1):
        box(f'bridgepier{k}{s}', M['wall'], BRX, y + s * 0.06, G - 0.005, 0.12, 0.04, 0.3, outline=0.01, bevel=0)
    cyl(f'bridgearch{k}', M['hole'], 0.05, 0.012, segs=16, outline=0, matrix=Matrix.Translation((BRX - 0.062, y, G + 0.22)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
box('bridgedeck', M['wall'], BRX, (Y_ROCK + Y_BANK) / 2, G + 0.29, 0.13, Y_ROCK - Y_BANK, 0.05, outline=0.012, bevel=0)
box('bridgeabutment', M['wall'], BRX, Y_BANK, G - 0.005, 0.16, 0.1, 0.34, outline=0.012, bevel=0)

# ---------- the Grund's houses by the water ----------
for k, (x, y) in enumerate(((-0.25, -0.75), (0.0, -0.7), (0.25, -0.55), (0.5, -0.4), (0.75, -0.2), (-0.45, -0.9))):
    h = rng.uniform(0.14, 0.2)
    box(f'house{k}', M['house' if k % 2 else 'houseCream'], x, y, G - 0.005, 0.15, 0.13, h, rot_z=0.4, outline=0.012, bevel=0)
    loft(f'houseroof{k}', M['slate'], [[(x + dx * math.cos(0.4) - dy * math.sin(0.4), y + dx * math.sin(0.4) + dy * math.cos(0.4), G + h - 0.005)
                                        for dx, dy in ((-0.085, -0.075), (0.085, -0.075), (0.085, 0.075), (-0.085, 0.075))],
                                       [(x + dx * math.cos(0.4) - dy * math.sin(0.4), y + dx * math.sin(0.4) + dy * math.cos(0.4), G + h + 0.08)
                                        for dx, dy in ((-0.08, -0.004), (0.08, -0.004), (0.08, 0.004), (-0.08, 0.004))]], outline=0.01)
    box(f'housewin{k}', M['window'], x + 0.068 * math.sin(0.4), y - 0.068 * math.cos(0.4), G + h * 0.5, 0.03, 0.01, 0.04, rot_z=0.4, outline=0, bevel=0)

turn(before, -20)
render(G)

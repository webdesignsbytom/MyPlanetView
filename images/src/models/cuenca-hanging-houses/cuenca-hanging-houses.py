# A cartoon Cuenca for the country maps, built in the set's shared look (../toon.py): the hanging
# houses on the edge of the ochre limestone cliff, white walls under red roofs with their dark wooden
# balconies jutting out over the drop, and the San Pablo bridge, an iron footbridge on tall stone
# piers, crossing the Huécar gorge to the rock opposite, with trees in the gorge below. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P cuenca-hanging-houses.py -- cuenca-hanging-houses-1024.png 1024 cuenca-hanging-houses.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'rock': toon('rock', '#c8a46a', shadow_mul=(0.86, 0.82, 0.76), lift=0.06),
    'rockDark': toon('rockDark', '#a8844a'),
    'white': toon('white', '#f2ece0', lift=0.15),
    'wood': toon('wood', '#5a3a24'),
    'roof': toon('roof', '#c4603e'),
    'iron': toon('iron', '#8a3a2a'),
    'stone': toon('stone', '#b8a888', shadow_mul=(0.84, 0.82, 0.86)),
    'window': flat('window', '#3a3430'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)


def rrect(cx, cy, hw, hh, z, rad, n=4):
    pts = []
    for ox, oy, a0 in ((cx + hw - rad, cy - hh + rad, -90), (cx + hw - rad, cy + hh - rad, 0), (cx - hw + rad, cy + hh - rad, 90), (cx - hw + rad, cy - hh + rad, 180)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append((ox + rad * math.cos(a), oy + rad * math.sin(a), G + z))
    return pts


cl = loft('cliff', M['rock'], [rrect(-0.2, 0.38, 0.75, 0.38, -0.01, 0.15), rrect(-0.2, 0.4, 0.72, 0.34, 0.4, 0.12)], outline=0.012)
cl.visible_shadow = False
T = G + 0.4
for k in range(3):
    z = 0.09 + k * 0.1
    box(f'stratum{k}', M['rockDark'], -0.2, 0.0 + 0.06 * (z / 0.4) - 0.006, G + z, 1.4, 0.014, 0.014, outline=0, bevel=0)

# ---------- the hanging houses ----------
for k, (x, h) in enumerate(((-0.58, 0.24), (-0.34, 0.3), (-0.1, 0.26))):
    box(f'house{k}', M['white'], x, 0.15, T - 0.005, 0.23, 0.18, h, outline=0.007, bevel=0)
    loft(f'roof{k}', M['roof'], [[(x - 0.125, 0.05, T + h - 0.01), (x + 0.125, 0.05, T + h - 0.01), (x + 0.125, 0.25, T + h - 0.01), (x - 0.125, 0.25, T + h - 0.01)],
                                 [(x - 0.125, 0.146, T + h + 0.06), (x + 0.125, 0.146, T + h + 0.06), (x + 0.125, 0.154, T + h + 0.06), (x - 0.125, 0.154, T + h + 0.06)]], outline=0.005)
    for lv, z in enumerate((T + 0.06, T + 0.16)):
        if z + 0.08 > T + h:
            continue
        box(f'balconyfloor{k}{lv}', M['wood'], x, 0.02, z, 0.21, 0.09, 0.014, outline=0.002, bevel=0)
        box(f'balconyrail{k}{lv}', M['wood'], x, -0.02, z + 0.012, 0.21, 0.012, 0.045, outline=0.002, bevel=0)
        box(f'balconyroof{k}{lv}', M['wood'], x, 0.02, z + 0.085, 0.21, 0.09, 0.012, outline=0.002, bevel=0)
        for j in range(4):
            rod(f'balconypost{k}{lv}{j}', M['wood'], (x - 0.095 + j * 0.063, -0.02, z), (x - 0.095 + j * 0.063, -0.02, z + 0.085), 0.006, segs=4, outline=0)
        box(f'balconydoor{k}{lv}', M['window'], x, 0.058, z + 0.015, 0.05, 0.006, 0.06, outline=0, bevel=0)
    # beams under the lower balcony, into the rock
    for j in range(3):
        bar(f'strut{k}{j}', M['wood'], (x - 0.08 + j * 0.08, 0.03, T - 0.08), (x - 0.08 + j * 0.08, -0.02, T + 0.06), 0.012, outline=0.001)

# ---------- the San Pablo bridge ----------
P0, P1 = (0.42, 0.12), (0.88, -0.52)
lathe('farrock', M['rock'], ((0.2, 0), (0.17, 0.25), (0.13, 0.39)), G - 0.01, 0.92, -0.58, segs=14, outline=0.008, smooth=False)
dx, dy = P1[0] - P0[0], P1[1] - P0[1]
L = math.hypot(dx, dy)
nx, ny = -dy / L, dx / L
Z = G + 0.39


def at(t, off=0.0, z=0.0):
    return (P0[0] + dx * t + nx * off, P0[1] + dy * t + ny * off, Z + z)


bar('deck', M['iron'], at(0), at(1), 0.05, outline=0.003)
for s in (-1, 1):
    bar(f'rail{s}', M['iron'], at(0, s * 0.03, 0.065), at(1, s * 0.03, 0.065), 0.012, outline=0.001)
    bar(f'chord{s}', M['iron'], at(0.05, s * 0.025, -0.07), at(0.95, s * 0.025, -0.07), 0.014, outline=0.001)
    for i in range(10):
        t0, t1 = i / 10, (i + 1) / 10
        bar(f'post{s}{i}', M['iron'], at(t0, s * 0.03, 0.0), at(t0, s * 0.03, 0.065), 0.008, outline=0)
        bar(f'diag{s}{i}', M['iron'], at(t0, s * 0.03, 0.0), at(t1, s * 0.03, 0.065), 0.006, outline=0)
        if 0.05 <= t0 <= 0.9:
            bar(f'truss{s}{i}', M['iron'], at(t0, s * 0.025, -0.07), at(t1, s * 0.025, 0.0), 0.008, outline=0)
for k, t in enumerate((0.36, 0.68)):
    x, y, _ = at(t)
    loft(f'pier{k}', M['stone'], [[(x - 0.05, y - 0.05, G - 0.005), (x + 0.05, y - 0.05, G - 0.005), (x + 0.05, y + 0.05, G - 0.005), (x - 0.05, y + 0.05, G - 0.005)],
                                  [(x - 0.03, y - 0.03, Z - 0.07), (x + 0.03, y - 0.03, Z - 0.07), (x + 0.03, y + 0.03, Z - 0.07), (x - 0.03, y + 0.03, Z - 0.07)]], outline=0.004)

# ---------- trees in the gorge ----------
for k, (x, y, r) in enumerate(((-0.75, -0.3, 0.1), (-0.45, -0.55, 0.12), (-0.1, -0.4, 0.09), (0.15, -0.7, 0.1), (-0.85, 0.05, 0.08), (0.3, -0.2, 0.08), (-0.35, -0.2, 0.08))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 0.9, r, outline=0.007)

turn(before, -20)
render(G)

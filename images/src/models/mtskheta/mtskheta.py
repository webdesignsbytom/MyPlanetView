# A cartoon Mtskheta for the country maps, built in the set's shared look (../toon.py): Jvari
# Monastery's little cross-shaped church with its conical dome on the hilltop above the meeting of
# the Aragvi and the Mtkvari, and below, Svetitskhoveli Cathedral's tall drum and pointed dome
# rising inside its fortified walls in the old capital. Turned a little towards the camera.
# Run: blender -b --factory-startup -P mtskheta.py -- mtskheta-1024.png 1024 mtskheta.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#8ab85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'hill': toon('hill', '#7aa050', shadow_mul=(0.76, 0.8, 0.78)),
    'river': toon('river', '#4a9ab0', lift=0.3),
    'river2': toon('river2', '#6a9a8a', lift=0.25),
    'stone': toon('stone', '#b8ae98', shadow_mul=(0.84, 0.84, 0.88), lift=0.06),
    'yellow': toon('yellow', '#dcc898', shadow_mul=(0.86, 0.84, 0.8), lift=0.1),
    'roof': toon('roof', '#7a7a80'),
    'dark': flat('dark', '#2e2a28'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

for k, (p0, p1, w, mat) in enumerate((((-1.05, -0.58), (0.95, -0.66), 0.16, 'river'), ((0.07, -0.6), (0.09, 0.85), 0.1, 'river2'))):
    bar(f'river{k}', M[mat], (p0[0], p0[1], G - 0.001), (p1[0], p1[1], G - 0.001), w, outline=0.002)


def church(name, x, y, s, mat, drum_h, rot=0.0):
    box(f'{name}armx', M[mat], x, y, G0[name] - 0.005, 0.3 * s, 0.14 * s, 0.14 * s, outline=0.006, bevel=0)
    box(f'{name}army', M[mat], x, y, G0[name] - 0.005, 0.14 * s, 0.3 * s, 0.14 * s, outline=0.006, bevel=0)
    for k, (dx, dy) in enumerate(((1, 0), (0, 1))):
        loft(f'{name}roof{k}', M['roof'], [[(x - 0.15 * s * dx - 0.07 * s * dy, y - 0.15 * s * dy - 0.07 * s * dx, G0[name] + 0.13 * s), (x + 0.15 * s * dx - 0.07 * s * dy, y + 0.15 * s * dy - 0.07 * s * dx, G0[name] + 0.13 * s),
                                            (x + 0.15 * s * dx + 0.07 * s * dy, y + 0.15 * s * dy + 0.07 * s * dx, G0[name] + 0.13 * s), (x - 0.15 * s * dx + 0.07 * s * dy, y - 0.15 * s * dy + 0.07 * s * dx, G0[name] + 0.13 * s)],
                                           [(x - 0.15 * s * dx - 0.004 * dy, y - 0.15 * s * dy - 0.004 * dx, G0[name] + 0.2 * s), (x + 0.15 * s * dx - 0.004 * dy, y + 0.15 * s * dy - 0.004 * dx, G0[name] + 0.2 * s),
                                            (x + 0.15 * s * dx + 0.004 * dy, y + 0.15 * s * dy + 0.004 * dx, G0[name] + 0.2 * s), (x - 0.15 * s * dx + 0.004 * dy, y - 0.15 * s * dy + 0.004 * dx, G0[name] + 0.2 * s)]], outline=0.004)
    lathe(f'{name}drum', M[mat], ((0.05 * s, 0), (0.05 * s, drum_h * s)), G0[name] + 0.15 * s, x, y, segs=12, outline=0.004, smooth=False)
    for k in range(4):
        a = -math.pi / 2 + k * math.pi / 2 + math.pi / 12
        box(f'{name}drumwin{k}', M['dark'], x + 0.048 * s * math.cos(a), y + 0.048 * s * math.sin(a), G0[name] + (0.15 + drum_h * 0.4) * s, 0.012 * s, 0.006, drum_h * 0.4 * s, rot_z=a + math.pi / 2, outline=0, bevel=0)
    lathe(f'{name}cone', M['roof'], ((0.056 * s, 0), (0.004, 0.09 * s)), G0[name] + (0.15 + drum_h) * s - 0.005, x, y, segs=12, outline=0.003, smooth=False)
    box(f'{name}door', M['dark'], x, y - 0.153 * s, G0[name], 0.04 * s, 0.006, 0.08 * s, outline=0, bevel=0)


# ---------- Jvari on its hill ----------
JX, JY = -0.42, 0.45
hl = lathe('jvarihill', M['hill'], ((0.5, 0), (0.36, 0.14), (0.2, 0.24), (0.14, 0.25)), G - 0.01, JX, JY, segs=24, outline=0.009)
hl.visible_shadow = False
G0 = {'jvari': G + 0.245, 'sveti': G}
church('jvari', JX, JY, 0.8, 'stone', 0.12)
for k in range(12):
    a = 2 * math.pi * k / 12
    bar(f'jvariwall{k}', M['stone'], (JX + 0.17 * math.cos(a), JY + 0.17 * math.sin(a), G + 0.25), (JX + 0.17 * math.cos(a + math.pi / 6), JY + 0.17 * math.sin(a + math.pi / 6), G + 0.25), 0.03, outline=0.001)

# ---------- Svetitskhoveli in its walls ----------
SX, SY = 0.45, 0.1
church('sveti', SX, SY, 1.3, 'yellow', 0.22)
for k, (x0, y0, x1, y1) in enumerate(((SX - 0.3, SY - 0.3, SX + 0.3, SY - 0.3), (SX + 0.3, SY - 0.3, SX + 0.3, SY + 0.32), (SX + 0.3, SY + 0.32, SX - 0.3, SY + 0.32), (SX - 0.3, SY + 0.32, SX - 0.3, SY - 0.3))):
    a = math.atan2(y1 - y0, x1 - x0)
    box(f'svetiwall{k}', M['stone'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.005, math.hypot(x1 - x0, y1 - y0), 0.03, 0.08, rot_z=a, outline=0.003, bevel=0)
    box(f'svetitower{k}', M['stone'], x0, y0, G - 0.005, 0.06, 0.06, 0.12, outline=0.003, bevel=0)
box('svetigate', M['stone'], SX, SY - 0.3, G - 0.005, 0.1, 0.06, 0.14, outline=0.003, bevel=0)
box('svetigatearch', M['dark'], SX, SY - 0.332, G - 0.005, 0.04, 0.006, 0.07, outline=0, bevel=0)

for k, (x, y, r) in enumerate(((-0.85, 0.0, 0.08), (0.88, -0.25, 0.08), (-0.2, -0.3, 0.07), (-0.85, -0.35, 0.07), (0.3, 0.6, 0.07))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.0, r, outline=0.006)

turn(before, -20)
render(G)

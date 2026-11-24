# A cartoon Semmering Railway for the country maps, built in the set's shared look (../toon.py): the
# first mountain railway, winding through the Austrian Alps, its great two-storey stone viaduct over
# the Kalte Rinne gorge with arch upon arch, a little red train crossing it, the tunnel mouth in the
# cliff, the steep wooded slopes and the limestone peaks behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P semmering.py -- semmering-1024.png 1024 semmering.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'stone': toon('stone', '#b8ac98', shadow_mul=(0.84, 0.84, 0.88), lift=0.1),
    'stoneDark': toon('stoneDark', '#968a78'),
    'rock': toon('rock', '#a8a49c', shadow_mul=(0.84, 0.84, 0.9)),
    'snow': toon('snow', '#f4f6fa', lift=0.3),
    'fir': toon('fir', '#3f6a40', shadow_mul=(0.7, 0.78, 0.8)),
    'dark': flat('dark', '#2a2622'),
    'red': toon('red', '#c83a30', lift=0.12),
    'cream': toon('cream', '#f0e2c4'),
    'rail': toon('rail', '#5a5e66'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(1854)

# ---------- the peaks behind and the gorge's two sides ----------
for k, (x, y, r, h) in enumerate(((-0.55, 0.85, 0.42, 0.62), (0.25, 0.95, 0.36, 0.72))):
    r = min(r, 1.36 - math.hypot(x, y))
    mt = lathe(f'peak{k}', M['rock'], ((r, 0), (r * 0.6, h * 0.55), (r * 0.25, h * 0.88), (0.004, h)), G - 0.01, x, y, segs=10, outline=0.008, smooth=False)
    mt.visible_shadow = False
    lathe(f'snow{k}', M['snow'], ((r * 0.25 + 0.006, 0), (0.004, h * 0.12 + 0.004)), G - 0.01 + h * 0.88, x, y, segs=10, outline=0.003, smooth=False)
DZ = G + 0.42     # the line's height
for s in (-1, 1):
    hl = lathe(f'gorgeside{s}', M['grass'], ((0.48, 0), (0.42, DZ - G - 0.1), (0.3, DZ - G), (0.0, DZ - G)), G - 0.01, s * 0.88, 0.05, segs=20, outline=0.006)
    hl.visible_shadow = False

# ---------- the two-storey viaduct, curving slightly ----------
L = 0.66
N = 7
pts = [(-L + 2 * L * k / N, 0.05 - 0.08 * math.sin(math.pi * k / N)) for k in range(N + 1)]
for k in range(N):
    (x0, y0), (x1, y1) = pts[k], pts[k + 1]
    xm, ym = (x0 + x1) / 2, (y0 + y1) / 2
    ang = math.atan2(y1 - y0, x1 - x0)
    # the pier, then the lower and upper arches above it
    box(f'pier{k}', M['stone'], x0, y0, G - 0.005, 0.06, 0.1, DZ - G - 0.04, rot_z=ang, outline=0.004, bevel=0)
    for lv, (zb, h) in enumerate(((G + 0.17, 0.05), (DZ - 0.06, 0.05))):
        bar(f'archspan{k}{lv}', M['stone'], (x0, y0, zb + h / 2), (x1, y1, zb + h / 2), 0.08, outline=0.003)
box('pierlast', M['stone'], pts[-1][0], pts[-1][1], G - 0.005, 0.06, 0.1, DZ - G - 0.04, outline=0.004, bevel=0)
for k in range(N):
    (x0, y0), (x1, y1) = pts[k], pts[k + 1]
    bar(f'deck{k}', M['stoneDark'], (x0, y0, DZ - 0.01), (x1, y1, DZ - 0.01), 0.1, outline=0.003)
    for fy in (-0.03, 0.03):
        bar(f'rail{k}{fy}', M['rail'], (x0, y0 + fy, DZ + 0.035), (x1, y1 + fy, DZ + 0.035), 0.008, outline=0)

# ---------- the tunnel mouth and the train ----------
box('tunnelportal', M['stoneDark'], -L - 0.08, 0.05, DZ - 0.06, 0.06, 0.18, 0.18, outline=0.004, bevel=0)
box('tunnelmouth', M['dark'], -L - 0.05, 0.05, DZ - 0.01, 0.006, 0.1, 0.1, outline=0, bevel=0)
for k in range(3):
    x = -0.35 + k * 0.17
    y = 0.05 - 0.08 * math.sin(math.pi * (x + L) / (2 * L))
    box(f'car{k}', M['red'] if k else M['rail'], x, y, DZ + 0.04, 0.15, 0.07, 0.07, rot_z=-0.1 + 0.1 * k, outline=0.003, bevel=0)
    box(f'carwin{k}', M['cream'], x, y - 0.036, DZ + 0.075, 0.12, 0.006, 0.02, rot_z=-0.1 + 0.1 * k, outline=0, bevel=0)
lathe('funnel', M['rail'], ((0.015, 0), (0.02, 0.05)), DZ + 0.11, -0.4, 0.05 - 0.08 * math.sin(math.pi * 0.2), segs=8, outline=0.002)

# ---------- firs on the slopes ----------
for k in range(16):
    x, y = rng.uniform(-1.05, 1.05), rng.uniform(-0.95, 0.6)
    if math.hypot(x, y) > 1.15 or (abs(x) < 0.5 and -0.2 < y < 0.3):
        continue
    z = G + (0.2 if abs(x) > 0.55 and abs(y - 0.05) < 0.4 else 0.0)
    lathe(f'fir{k}', M['fir'], ((0.06, 0), (0.035, 0.08), (0.045, 0.08), (0.003, 0.22)), z, x, y, segs=8, outline=0.005, smooth=False)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

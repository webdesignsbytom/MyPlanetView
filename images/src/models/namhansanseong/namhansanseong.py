# A cartoon Namhansanseong for the country maps, built in the set's shared look (../toon.py): the
# mountain fortress south-east of Seoul, Korea, its stone wall with crenellations winding over
# the wooded ridges, the South Gate with its timber pavilion under a curved tiled roof on top
# of the stone arch, a command post on the crest, and the pines. Turned a little towards the camera.
# Run: blender -b --factory-startup -P namhansanseong.py -- namhansanseong-1024.png 1024 namhansanseong.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'hill': toon('hill', '#6a9a48', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#d4ccb8', shadow_mul=(0.8, 0.8, 0.86), lift=0.18),
    'roof': toon('roof', '#4a4e58'),
    'wood': toon('wood', '#a8402e'),
    'green': toon('green3', '#3a8a6a', lift=0.2),
    'dark': flat('dark', '#2e2622'),
    'pine': toon('pine', '#2e6a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)


def hz(x, y):
    """The ridge's height: a long hill rising to the right and the back."""
    return G + 0.18 * max(0.0, 1 - ((x - 0.35) ** 2 / 0.9 + (y - 0.45) ** 2 / 0.6))


# ---------- the wooded ridge ----------
rings = []
for k, f in enumerate((1.0, 0.7, 0.4, 0.15)):
    rings.append([(0.35 + 0.95 * f * math.cos(2 * math.pi * j / 32), 0.45 + 0.77 * f * math.sin(2 * math.pi * j / 32), G - 0.01 + 0.18 * (1 - f * f)) for j in range(32)])
ridge = loft('ridge', M['hill'], rings, outline=0.006)
ridge.visible_shadow = False


def curved_roof(name, x, y, z, w, d, h):
    """A Korean hipped roof whose eaves curl up at the corners."""
    rr = [[(x - w / 2 - 0.02, y - d / 2 - 0.02, z + 0.02), (x + w / 2 + 0.02, y - d / 2 - 0.02, z + 0.02), (x + w / 2 + 0.02, y + d / 2 + 0.02, z + 0.02), (x - w / 2 - 0.02, y + d / 2 + 0.02, z + 0.02)],
          [(x - w / 2, y - d / 2, z + h * 0.35), (x + w / 2, y - d / 2, z + h * 0.35), (x + w / 2, y + d / 2, z + h * 0.35), (x - w / 2, y + d / 2, z + h * 0.35)],
          [(x - w * 0.25, y - 0.004, z + h), (x + w * 0.25, y - 0.004, z + h), (x + w * 0.25, y + 0.004, z + h), (x - w * 0.25, y + 0.004, z + h)]]
    loft(name, M['roof'], rr, outline=0.004)


# ---------- the wall winding over the ridge ----------
PATH = [(-1.0, -0.3), (-0.7, -0.45), (-0.3, -0.5), (0.1, -0.4), (0.45, -0.2), (0.75, 0.05), (0.95, 0.35)]
for k in range(len(PATH) - 1):
    (x0, y0), (x1, y1) = PATH[k], PATH[k + 1]
    n = 4
    for j in range(n):
        t0, t1 = j / n, (j + 1) / n
        a = (x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0)
        b = (x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1)
        za, zb = hz(*a), hz(*b)
        bar(f'wall{k}{j}', M['stone'], (a[0], a[1], za + 0.03), (b[0], b[1], zb + 0.03), 0.05, outline=0.002)
        box(f'merlon{k}{j}', M['stone'], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (za + zb) / 2 + 0.05, 0.03, 0.05, 0.03, rot_z=math.atan2(y1 - y0, x1 - x0), outline=0.001, bevel=0)

# ---------- the South Gate ----------
GX, GY = -0.3, -0.5
GZ = hz(GX, GY)
box('gatebase', M['stone'], GX, GY, GZ - 0.01, 0.3, 0.14, 0.14, outline=0.005, bevel=0)
arch('gatearch', M['dark'], GX, GY - 0.073, GZ - 0.01, 0.08, 0.11)
for (dx, dy) in ((-0.1, -0.04), (0.1, -0.04), (-0.1, 0.04), (0.1, 0.04)):
    rod(f'gatepost{dx}{dy}', M['wood'], (GX + dx, GY + dy, GZ + 0.13), (GX + dx, GY + dy, GZ + 0.22), 0.008, segs=8, outline=0.001)
box('gatebeam', M['green'], GX, GY, GZ + 0.2, 0.24, 0.1, 0.025, outline=0.002, bevel=0)
curved_roof('gateroof', GX, GY, GZ + 0.2, 0.26, 0.12, 0.09)

# ---------- the command post on the crest ----------
CX, CY = 0.3, 0.4
CZ = hz(CX, CY)
box('postbase', M['stone'], CX, CY, CZ - 0.01, 0.24, 0.16, 0.04, outline=0.003, bevel=0)
for (dx, dy) in ((-0.09, -0.05), (0.09, -0.05), (-0.09, 0.05), (0.09, 0.05), (0.0, -0.05), (0.0, 0.05)):
    rod(f'postpost{dx}{dy}', M['wood'], (CX + dx, CY + dy, CZ + 0.03), (CX + dx, CY + dy, CZ + 0.15), 0.008, segs=8, outline=0.001)
box('postbeam', M['green'], CX, CY, CZ + 0.13, 0.22, 0.12, 0.025, outline=0.002, bevel=0)
curved_roof('postroof', CX, CY, CZ + 0.13, 0.24, 0.14, 0.1)

for k, (x, y) in enumerate(((-0.75, 0.2), (-0.5, 0.55), (-0.1, 0.1), (0.75, 0.6), (0.05, 0.8), (0.6, -0.65), (-0.9, -0.7))):
    z = hz(x, y)
    rod(f'pinetrunk{k}', M['trunk'], (x, y, z - 0.01), (x, y, z + 0.06), 0.012, segs=6, outline=0.001)
    b = ball(f'pine{k}', M['pine'], 0, 0, 0, 0.09, outline=0.007)
    b.scale = (1.2, 1.2, 0.7)
    b.location = (x, y, z + 0.11)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

# A cartoon Tower of Belém for the country maps, built in the set's shared look (../toon.py):
# the limestone bastion standing in the Tagus, its crenellations of shield-shaped merlons
# bearing the red cross, little domed turrets at its corners; the square tower rising behind
# it with its loggia over the river, its windows, its own crenellations and corner turrets; a
# footbridge to the shore. Turned to face the camera.
# Run: blender -b --factory-startup -P belem-tower.py -- belem-tower-1024.png 1024 belem-tower.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lime': toon('lime', '#efe3c6', shadow_mul=(0.82, 0.78, 0.86), lift=0.2),
    'limeDark': toon('limeDark', '#d9caa6', shadow_mul=(0.82, 0.78, 0.86)),
    'window': flat('window', '#4b3a55'),
    'cross': toon('cross', '#c8382e'),
    'water': toon('water', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
})

G = tile()
before = set(bpy.data.objects)

# ---------- the Tagus: the front of the tile ----------
EDGE, R = 0.5, 1.43
a0 = math.asin(EDGE / R)
arc = [(R * math.cos(a), R * math.sin(a)) for a in (math.pi - a0 + (math.pi + 2 * a0) * k / 50 for k in range(51))]
bm = bmesh.new()
bm.faces.new([bm.verts.new((x, y, G + 0.003)) for x, y in arc])
finish('river', bm, M['water'], outline=0)


def merlons(prefix, x0, y0, x1, y1, z, count, outward):
    """Shield-shaped merlons along a wall top, each with the red cross on its outer face."""
    d = Vector((x1 - x0, y1 - y0, 0))
    a = math.atan2(d.y, d.x)
    for k in range(count):
        p = Vector((x0, y0, 0)) + d * ((k + 0.5) / count)
        box(f'{prefix}{k}', M['lime'], p.x, p.y, z, 0.06, 0.04, 0.06, rot_z=a, outline=0.012, bevel=0)
        pyramid_top = pyramid(f'{prefix}{k}top', M['lime'], 0, 0, 0, 0.06, 0.035, outline=0.01)
        pyramid_top.matrix_world = Matrix.Translation((p.x, p.y, z + 0.06)) @ Matrix.Rotation(a, 4, 'Z') @ Matrix.Scale(0.67, 4, (0, 1, 0))
        q = p + outward * 0.022
        box(f'{prefix}{k}x', M['cross'], q.x, q.y, z + 0.015, 0.012, 0.01, 0.04, rot_z=a, outline=0, bevel=0)
        box(f'{prefix}{k}y', M['cross'], q.x, q.y, z + 0.03, 0.035, 0.01, 0.012, rot_z=a, outline=0, bevel=0)


def turret(name, x, y, z, r=0.045):
    lathe(name, M['lime'], ((r, 0), (r, 0.1)), z, x, y, segs=12, outline=0.014)
    lathe(name + 'dome', M['limeDark'], ((r + 0.008, 0), (r * 0.8, 0.04), (0.004, 0.08)), z + 0.1, x, y, segs=12, outline=0.012)


# ---------- the bastion, its prow into the river ----------
BH = 0.32
bastion = [(-0.42, 0.35), (-0.42, -0.25), (-0.2, -0.5), (0.2, -0.5), (0.42, -0.25), (0.42, 0.35)]
loft('bastion', M['limeDark'], [[(x, y, G - 0.005) for x, y in bastion], [(x, y, G + BH) for x, y in bastion]], outline=0.035)
for k, ((x0, y0), (x1, y1)) in enumerate(zip(bastion[:-1], bastion[1:])):
    edge = Vector((x1 - x0, y1 - y0, 0))
    outward = Vector((edge.y, -edge.x, 0)).normalized()
    inset = outward * -0.025
    merlons(f'bm{k}', x0 + inset.x, y0 + inset.y, x1 + inset.x, y1 + inset.y, G + BH, max(2, round(edge.length / 0.12)), outward)
for k, (x, y) in enumerate(bastion[1:-1]):
    turret(f'bturret{k}', x * 0.96, y * 0.96, G + BH)
for k, x in enumerate((-0.25, 0.0, 0.25)):
    box(f'bwindow{k}', M['window'], x, -0.505, G + 0.12, 0.05, 0.02, 0.1, outline=0, bevel=0)

# ---------- the tower behind, with its loggia over the river ----------
TW, TH = 0.4, 1.0
TY = 0.14
box('tower', M['lime'], 0, TY, G + BH - 0.01, TW, TW, TH - BH + 0.01, outline=0.035, bevel=0.006)
TOP = G + TH
FRONT = TY - TW / 2
box('loggia', M['limeDark'], 0, FRONT - 0.03, G + 0.58, 0.34, 0.06, 0.04, outline=0.014, bevel=0)
for k, x in enumerate((-0.1, 0.0, 0.1)):
    box(f'loggiaarch{k}', M['window'], x, FRONT - 0.006, G + 0.62, 0.07, 0.02, 0.12, outline=0, bevel=0)
    cyl(f'loggiatop{k}', M['window'], 0.035, 0.02, segs=12, outline=0,
        matrix=Matrix.Translation((x, FRONT - 0.006, G + 0.74)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for k, z in enumerate((G + 0.84,)):
    for x in (-0.09, 0.09):
        box(f'twin{k}{x}', M['window'], x, FRONT - 0.006, z, 0.05, 0.02, 0.08, outline=0, bevel=0)
corners = [(-TW / 2, TY - TW / 2), (TW / 2, TY - TW / 2), (TW / 2, TY + TW / 2), (-TW / 2, TY + TW / 2)]
for k in range(4):
    (x0, y0), (x1, y1) = corners[k], corners[(k + 1) % 4]
    edge = Vector((x1 - x0, y1 - y0, 0))
    outward = Vector((edge.y, -edge.x, 0)).normalized()
    inset = outward * -0.025
    merlons(f'tm{k}', x0 + inset.x, y0 + inset.y, x1 + inset.x, y1 + inset.y, TOP, 4, outward)
    turret(f'tturret{k}', x0, y0, TOP - 0.06)
# the little terrace and lantern on top
box('topterrace', M['limeDark'], 0, TY, TOP, 0.24, 0.24, 0.1, outline=0.018, bevel=0.004)

# ---------- the footbridge to the shore ----------
box('footbridge', M['limeDark'], 0, 0.62, G - 0.004, 0.14, 0.42, 0.06, outline=0.016, bevel=0)

turn(before, -32)
render(G)

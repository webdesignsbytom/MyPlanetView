# A cartoon Ōura Church for the country maps, built in the set's shared look (../toon.py): Nagasaki's
# little white Gothic church on its hillside, its front with the pointed doorway and rose window under
# the octagonal spire, the long nave behind, the statue of the Virgin in its niche, the stone stairs
# climbing to it between camellias, and the harbour below with a ship. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P oura-church.py -- oura-church-1024.png 1024 oura-church.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'hill': toon('hill', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#cfc6b4', lift=0.15),
    'white': toon('white', '#f6f4ee', shadow_mul=(0.82, 0.84, 0.9), lift=0.2),
    'slate': toon('slate', '#4a5060', shadow_mul=(0.84, 0.86, 0.92)),
    'dark': flat('dark', '#2e3040'),
    'sea': toon('sea', '#3a7ab0', lift=0.3),
    'camellia': toon('camellia', '#3f7a40', shadow_mul=(0.7, 0.78, 0.8)),
    'flower': toon('flower', '#e04a6a', lift=0.15),
    'gold': toon('gold', '#e0b040', lift=0.2),
    'red': toon('red', '#c83a30'),
})

G = tile(M['hill'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z, n=6):
    """The band of the tile's disc between y0 and y1 (counter-clockwise from above)."""
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('harbour', M['sea'], [strip(-1.41, -0.8, 1.42, -0.004), strip(-1.41, -0.8, 1.42, 0.004)], outline=0)
# the terrace the church stands on, raised at the back of the tile
TZ = G + 0.16
loft('terrace', M['stone'], [strip(-0.05, 1.3, 1.33, -0.01), strip(0.0, 1.27, 1.3, 0.16)], outline=0.006)

# ---------- the church (built at 1, then grown) ----------
CX, CY = 0.0, 0.32
church = set(bpy.data.objects)
NW = 0.28
box('nave', M['white'], CX, CY + 0.18, TZ - 0.005, NW, 0.5, 0.2, outline=0.008, bevel=0)
loft('naveroof', M['slate'], [[(CX - NW / 2 - 0.01, CY - 0.07, TZ + 0.195), (CX + NW / 2 + 0.01, CY - 0.07, TZ + 0.195), (CX + NW / 2 + 0.01, CY + 0.43, TZ + 0.195), (CX - NW / 2 - 0.01, CY + 0.43, TZ + 0.195)],
                              [(CX - 0.004, CY - 0.07, TZ + 0.3), (CX + 0.004, CY - 0.07, TZ + 0.3), (CX + 0.004, CY + 0.43, TZ + 0.3), (CX - 0.004, CY + 0.43, TZ + 0.3)]], outline=0.005)
for s in (-1, 1):
    for j in range(4):
        box(f'navewin{s}{j}', M['dark'], CX + s * (NW / 2 + 0.003), CY + 0.0 + j * 0.11, TZ + 0.06, 0.006, 0.03, 0.09, outline=0, bevel=0)
# the front and its octagonal spire
box('front', M['white'], CX, CY - 0.08, TZ - 0.005, 0.18, 0.1, 0.3, outline=0.007, bevel=0)
box('door', M['dark'], CX, CY - 0.133, TZ - 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)
pyramid('doorarch', M['dark'], CX, CY - 0.133, TZ + 0.094, 0.06, 0.04, outline=0)
cyl('rose', M['dark'], 0.028, 0.006, segs=16, outline=0, matrix=Matrix.Translation((CX, CY - 0.133, TZ + 0.2)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for s in (-1, 1):
    lathe(f'frontpinnacle{s}', M['white'], ((0.016, 0), (0.016, 0.06), (0.003, 0.11)), TZ + 0.295, CX + s * 0.08, CY - 0.12, segs=8, outline=0.002, smooth=False)
lathe('belfry', M['white'], ((0.06, 0), (0.06, 0.1)), TZ + 0.295, CX, CY - 0.08, segs=8, outline=0.004, smooth=False)
for k in range(8):
    a = 2 * math.pi * (k + 0.5) / 8
    box(f'belfrywin{k}', M['dark'], CX + 0.056 * math.cos(a), CY - 0.08 + 0.056 * math.sin(a), TZ + 0.32, 0.004, 0.02, 0.05, rot_z=a, outline=0, bevel=0)
lathe('spire', M['slate'], ((0.065, 0), (0.003, 0.26)), TZ + 0.395, CX, CY - 0.08, segs=8, outline=0.004, smooth=False)
rod('cross', M['gold'], (CX, CY - 0.08, TZ + 0.655), (CX, CY - 0.08, TZ + 0.71), 0.004, segs=4, outline=0)
bar('crossbar', M['gold'], (CX - 0.016, CY - 0.08, TZ + 0.69), (CX + 0.016, CY - 0.08, TZ + 0.69), 0.006, outline=0)
# the Virgin's statue in front of the church
lathe('virginplinth', M['stone'], ((0.035, 0), (0.03, 0.08)), TZ - 0.005, CX + 0.18, CY - 0.2, segs=8, outline=0.002, smooth=False)
rod('virgin', M['white'], (CX + 0.18, CY - 0.2, TZ + 0.075), (CX + 0.18, CY - 0.2, TZ + 0.15), 0.016, r2=0.01, segs=8, outline=0.002)
ball('virginhead', M['white'], CX + 0.18, CY - 0.2, TZ + 0.16, 0.01, outline=0.001)

bpy.context.view_layer.update()
grow = Matrix.Translation((CX, CY - 0.1, TZ)) @ Matrix.Scale(1.45, 4) @ Matrix.Translation((-CX, -(CY - 0.1), -TZ))
for o in set(bpy.data.objects) - church:
    o.matrix_world = grow @ o.matrix_world

# ---------- the stairs up and the camellias ----------
for i in range(7):
    t = i / 7
    box(f'stair{i}', M['stone'], CX, -0.55 + i * 0.075, G - 0.005, 0.2, 0.075, (TZ - G) * (t + 1 / 7) + 0.005, outline=0.002, bevel=0)
for s in (-1, 1):
    for k in range(3):
        x, y = CX + s * (0.22 + 0.04 * k), -0.5 + k * 0.17
        ball(f'camellia{s}{k}', M['camellia'], x, y, G + 0.06, 0.07, outline=0.008)
        for j in range(3):
            ball(f'flower{s}{k}{j}', M['flower'], x + 0.04 * math.cos(j * 2.1), y - 0.04 + 0.02 * math.sin(j * 2.1), G + 0.08 + 0.02 * j, 0.012, outline=0)
# a ship in the harbour
hull = ball('ship', M['white'], 0, 0, 0, 0.06, outline=0.004)
hull.scale = (3.0, 0.9, 0.5)
hull.location = (-0.45, -1.0, G + 0.01)
box('shipcabin', M['white'], -0.42, -1.0, G + 0.03, 0.18, 0.08, 0.06, outline=0.003, bevel=0)
lathe('shipfunnel', M['red'], ((0.02, 0), (0.02, 0.06)), G + 0.085, -0.4, -1.0, segs=8, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

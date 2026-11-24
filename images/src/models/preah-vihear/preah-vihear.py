# A cartoon Preah Vihear for the country maps, built in the set's shared look (../toon.py): the Khmer
# temple on the clifftop of the Dângrêk Mountains, its gopuras, the cross-shaped gateway pavilions
# of grey sandstone with their stepped roofs and doorways, standing one after another along the
# causeway that climbs the plateau to the sanctuary at the very edge of the cliff, the ruined tower
# of the sanctuary, and the forest and the plain of Cambodia far below. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P preah-vihear.py -- preah-vihear-1024.png 1024 preah-vihear.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'plain': toon('plain', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'cliff': toon('cliff', '#9a8e7a', shadow_mul=(0.8, 0.78, 0.84)),
    'plateau': toon('plateau', '#8ab062', shadow_mul=(0.7, 0.78, 0.8)),
    'sandstone': toon('sandstone', '#b0a492', shadow_mul=(0.8, 0.8, 0.86), lift=0.15),
    'sandDark': toon('sandDark', '#8e8270'),
    'path': toon('path', '#c8bca4', lift=0.15),
    'dark': flat('dark', '#2e2a26'),
    'forest': toon('forest', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['plain'])
before = set(bpy.data.objects)
rng = random.Random(1100)


def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


# ---------- the cliff and the plateau ----------
PZ = G + 0.34
cliff = loft('cliff', M['cliff'], [strip(-0.3, 1.31, 1.32, G - 0.01), strip(-0.3, 1.31, 1.32, PZ - 0.02)], outline=0.007)
cliff.visible_shadow = False
top = loft('plateau', M['plateau'], [strip(-0.3, 1.31, 1.32, PZ - 0.025), strip(-0.3, 1.31, 1.32, PZ)], outline=0.003)
top.visible_shadow = False
box('causeway', M['path'], 0.0, 0.42, PZ - 0.004, 0.1, 1.3, 0.01, outline=0.001, bevel=0)


def gopura(name, x, y, w, h):
    """A cross-shaped gateway pavilion with stepped roofs and a doorway to the front."""
    box(f'{name}base', M['sandDark'], x, y, PZ - 0.005, w + 0.06, w * 0.7 + 0.04, 0.025, outline=0.003, bevel=0)
    box(f'{name}hall', M['sandstone'], x, y, PZ + 0.015, w, w * 0.45, h, outline=0.005, bevel=0)
    box(f'{name}porch', M['sandstone'], x, y, PZ + 0.015, w * 0.4, w * 0.7, h * 1.1, outline=0.005, bevel=0)
    box(f'{name}door', M['dark'], x, y - w * 0.35 - 0.004, PZ + 0.015, w * 0.16, 0.006, h * 0.7, outline=0, bevel=0)
    for s in (-1, 1):
        box(f'{name}win{s}', M['dark'], x + s * w * 0.32, y - w * 0.225 - 0.004, PZ + 0.04, w * 0.08, 0.006, h * 0.4, outline=0, bevel=0)
    for k in range(2):
        hw = w * (0.5 - k * 0.12)
        hd = w * (0.24 - k * 0.05)
        zz = PZ + 0.015 + h + k * 0.035
        loft(f'{name}roof{k}', M['sandDark'], [[(x - hw, y - hd, zz), (x + hw, y - hd, zz), (x + hw, y + hd, zz), (x - hw, y + hd, zz)],
                                               [(x - hw + 0.03, y - 0.005, zz + 0.04), (x + hw - 0.03, y - 0.005, zz + 0.04), (x + hw - 0.03, y + 0.005, zz + 0.04), (x - hw + 0.03, y + 0.005, zz + 0.04)]], outline=0.003)
    loft(f'{name}pediment', M['sandstone'], [[(x - w * 0.2, y - w * 0.35, PZ + 0.015 + h * 1.1), (x + w * 0.2, y - w * 0.35, PZ + 0.015 + h * 1.1), (x + w * 0.2, y - w * 0.3, PZ + 0.015 + h * 1.1), (x - w * 0.2, y - w * 0.3, PZ + 0.015 + h * 1.1)],
                                             [(x - 0.004, y - w * 0.35, PZ + 0.015 + h * 1.1 + w * 0.2), (x + 0.004, y - w * 0.35, PZ + 0.015 + h * 1.1 + w * 0.2), (x + 0.004, y - w * 0.3, PZ + 0.015 + h * 1.1 + w * 0.2), (x - 0.004, y - w * 0.3, PZ + 0.015 + h * 1.1 + w * 0.2)]], outline=0.002)


# ---------- the gopuras along the causeway, the last at the cliff's edge ----------
gopura('gopura3', 0.0, 0.85, 0.22, 0.09)
gopura('gopura2', 0.0, 0.48, 0.26, 0.1)
gopura('gopura1', 0.0, 0.12, 0.3, 0.11)
# the sanctuary and its ruined tower at the edge
SY = -0.15
box('sanctuary', M['sandstone'], 0.0, SY, PZ - 0.005, 0.24, 0.2, 0.12, outline=0.005, bevel=0)
box('sanctuarydoor', M['dark'], 0.0, SY - 0.104, PZ - 0.005, 0.04, 0.006, 0.08, outline=0, bevel=0)
z = PZ + 0.115
for k, w in enumerate((0.14, 0.11, 0.08)):
    box(f'tower{k}', M['sandstone'], 0.0, SY, z, w, w, 0.05, outline=0.003, bevel=0)
    z += 0.05
for k in range(4):
    box(f'rubble{k}', M['sandDark'], -0.16 + k * 0.1, SY - 0.06 + 0.12 * rng.random(), PZ - 0.005, 0.04, 0.03, 0.025, rot_z=rng.random(), outline=0.001, bevel=0)

# ---------- the forest: on the plateau and on the plain below ----------
for k in range(10):
    x = -1.0 + k * 0.22
    for row, (y, z) in enumerate(((0.3 + 0.4 * rng.random(), PZ), (-0.55 - 0.35 * rng.random(), G))):
        if abs(x) < 0.25 and row == 0:
            continue
        if math.hypot(x, y) > 1.18:
            continue
        ball(f'tree{k}{row}', M['forest'], x, y, z + 0.08, 0.08 + 0.02 * rng.random(), outline=0.008)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

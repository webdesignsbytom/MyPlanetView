# A cartoon Heart of Neolithic Orkney for the country maps, built in the set's shared look
# (../toon.py): the Ring of Brodgar's tall thin standing stones in their great circle on the
# heather, inside the ring of its ditch, and Skara Brae's Stone Age village of stone houses set into
# the turf by the Bay of Skaill, open to the sky to show their stone dressers, beds and hearths.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P skara-brae.py -- skara-brae-1024.png 1024 skara-brae.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'heather': toon('heather', '#9a7a8a'),
    'ditch': toon('ditch', '#5a7a4a'),
    'stone': toon('stone', '#8a8a86', shadow_mul=(0.84, 0.84, 0.88), lift=0.06),
    'flag': toon('flag', '#a8a49a', shadow_mul=(0.84, 0.84, 0.88), lift=0.06),
    'turf': toon('turf', '#6a9a4a', shadow_mul=(0.72, 0.8, 0.74)),
    'floor': toon('floor', '#b8a888'),
    'sea': toon('sea', '#2f7ab8', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'sand': toon('sand', '#e8d8a8'),
    'fire': toon('fire', '#e06a2a', lift=0.3),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(2383)


def strip(y0, y1, r, z, n=6):
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('sand', M['sand'], [strip(-1.3, -0.78, 1.33, -0.004), strip(-1.3, -0.78, 1.33, 0.004)], outline=0.003)
loft('sea', M['sea'], [strip(-1.3, -0.9, 1.33, 0.0), strip(-1.3, -0.9, 1.33, 0.009)], outline=0.003)

# ---------- the Ring of Brodgar ----------
RX, RY, R = -0.22, 0.28, 0.5
lathe('heather', M['heather'], ((R + 0.02, 0), (R + 0.02, 0.008)), G - 0.004, RX, RY, segs=40, outline=0.002)
for k in range(44):
    a0, a1 = 2 * math.pi * k / 44, 2 * math.pi * (k + 1) / 44
    r = R + 0.1
    loft(f'ditch{k}', M['ditch'], [[(RX + (r - 0.04) * math.cos(a0), RY + (r - 0.04) * math.sin(a0), G - 0.004), (RX + (r + 0.04) * math.cos(a0), RY + (r + 0.04) * math.sin(a0), G - 0.004),
                                    (RX + (r + 0.04) * math.cos(a1), RY + (r + 0.04) * math.sin(a1), G - 0.004), (RX + (r - 0.04) * math.cos(a1), RY + (r - 0.04) * math.sin(a1), G - 0.004)],
                                   [(RX + (r - 0.04) * math.cos(a0), RY + (r - 0.04) * math.sin(a0), G + 0.004), (RX + (r + 0.04) * math.cos(a0), RY + (r + 0.04) * math.sin(a0), G + 0.004),
                                    (RX + (r + 0.04) * math.cos(a1), RY + (r + 0.04) * math.sin(a1), G + 0.004), (RX + (r - 0.04) * math.cos(a1), RY + (r - 0.04) * math.sin(a1), G + 0.004)]], outline=0)
for k in range(27):
    if k in (5, 12, 19, 23):
        continue  # the missing stones
    a = 2 * math.pi * k / 27
    h = rng.uniform(0.14, 0.26) if k % 3 else rng.uniform(0.06, 0.1)
    w = rng.uniform(0.06, 0.08)
    loft(f'standing{k}', M['stone'], [[(-w / 2, -0.014, 0), (w / 2, -0.014, 0), (w / 2, 0.014, 0), (-w / 2, 0.014, 0)],
                                      [(-w * 0.4, -0.012, h * 0.85), (w * 0.35, -0.012, h), (w * 0.35, 0.012, h), (-w * 0.4, 0.012, h * 0.85)]], outline=0.004)
    o = bpy.data.objects[f'standing{k}']
    o.location = (RX + R * math.cos(a), RY + R * math.sin(a), G - 0.005)
    o.rotation_euler = (0, 0, a + math.pi / 2)

# ---------- Skara Brae ----------
VX, VY = 0.48, -0.4
mound = lathe('villagemound', M['turf'], ((0.46, 0), (0.42, 0.06), (0.36, 0.08)), G - 0.01, VX, VY, segs=28, outline=0.006)
mound.visible_shadow = False


def house(name, x, y, ro, ri):
    lathe(f'{name}wall', M['flag'], ((ro, 0), (ro, 0.1), (ri, 0.1), (ri, 0.006)), G - 0.005, x, y, segs=10, outline=0.004, smooth=False)
    lathe(f'{name}floor', M['floor'], ((ri - 0.002, 0), (ri - 0.002, 0.008)), G - 0.003, x, y, segs=10, outline=0, smooth=False)
    box(f'{name}dresser', M['stone'], x, y + ri - 0.03, G - 0.005, 0.1, 0.03, 0.07, outline=0.002, bevel=0)
    box(f'{name}dressershelf', M['flag'], x, y + ri - 0.045, G + 0.03, 0.1, 0.008, 0.008, outline=0, bevel=0)
    for s in (-1, 1):
        box(f'{name}bed{s}', M['stone'], x + s * (ri - 0.03), y, G - 0.005, 0.03, 0.09, 0.04, outline=0.002, bevel=0)
    box(f'{name}hearth', M['stone'], x, y - 0.01, G - 0.003, 0.05, 0.05, 0.012, outline=0.001, bevel=0)
    box(f'{name}fire', M['fire'], x, y - 0.01, G + 0.003, 0.025, 0.025, 0.01, outline=0, bevel=0)


house('h1', VX - 0.15, VY + 0.08, 0.15, 0.11)
house('h2', VX + 0.15, VY + 0.1, 0.14, 0.1)
house('h3', VX + 0.02, VY - 0.18, 0.13, 0.095)
for j, (p0, p1) in enumerate((((VX - 0.03, VY + 0.08), (VX + 0.03, VY + 0.08)), ((VX + 0.02, VY - 0.07), (VX + 0.02, VY + 0.0)))):
    bar(f'passage{j}', M['flag'], (p0[0], p0[1], G + 0.035), (p1[0], p1[1], G + 0.035), 0.06, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)

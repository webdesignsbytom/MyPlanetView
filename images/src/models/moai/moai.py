# Cartoon moai (Ahu Tongariki, Easter Island) for the country maps, built in the set's shared
# look (../toon.py): a row of six moai on their stone platform, two with red topknots, the
# Pacific behind them; each with its long face, heavy brow, long nose and long ears. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P moai.py -- moai-1024.png 1024 moai.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'tuff': toon('tuff', '#8e8273', shadow_mul=(0.78, 0.74, 0.82)),
    'ahu': toon('ahu', '#8d887e', shadow_mul=(0.78, 0.78, 0.86)),
    'paving': toon('paving', '#b9b2a4'),
    'socket': flat('socket', '#3d3530'),
    'pukao': toon('pukao', '#b5543c'),
    'sea': toon('sea', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
})

G = tile()
before = set(bpy.data.objects)

# ---------- the Pacific behind: the tile's back third ----------
EDGE, R = 0.28, 1.43
a0 = math.asin(EDGE / R)
arc = [(R * math.cos(a), R * math.sin(a)) for a in (a0 + (math.pi - 2 * a0) * k / 40 for k in range(41))]
bm = bmesh.new()
bm.faces.new([bm.verts.new((x, y, G + 0.003)) for x, y in arc])
finish('sea', bm, M['sea'], outline=0)

# ---------- the platform ----------
box('ahu', M['ahu'], 0, 0.02, G - 0.005, 1.6, 0.3, 0.13, outline=0.03, bevel=0.01)
box('paving', M['paving'], 0, -0.25, G - 0.005, 1.6, 0.22, 0.035, outline=0.018, bevel=0)
B = G + 0.125


def moai(k, x, tall, topknot):
    """One moai, facing the front (-Y), its base on the platform."""
    s = tall / 0.7
    rect = lambda w, d, z: [(x - w / 2, -d / 2, z), (x + w / 2, -d / 2, z), (x + w / 2, d / 2, z), (x - w / 2, d / 2, z)]
    loft(f'torso{k}', M['tuff'], [rect(0.17 * s, 0.13 * s, B), rect(0.15 * s, 0.12 * s, B + 0.34 * s)], outline=0.025, bevel=0.01)
    loft(f'head{k}', M['tuff'], [rect(0.12 * s, 0.12 * s, B + 0.32 * s), rect(0.15 * s, 0.14 * s, B + 0.66 * s)],
         outline=0.025, bevel=0.01)
    box(f'brow{k}', M['tuff'], x, -0.065 * s, B + 0.55 * s, 0.155 * s, 0.05 * s, 0.045 * s, outline=0.015, bevel=0.005)
    loft(f'nose{k}', M['tuff'], [[(x - 0.024 * s, -0.06 * s, z), (x + 0.024 * s, -0.06 * s, z), (x, -0.11 * s, z)]
                                 for z in (B + 0.42 * s, B + 0.56 * s)], outline=0.014)
    for side in (-1, 1):
        box(f'socket{k}{side}', M['socket'], x + side * 0.038 * s, -0.071 * s, B + 0.5 * s, 0.035 * s, 0.01, 0.03 * s,
            outline=0, bevel=0)
        box(f'ear{k}{side}', M['tuff'], x + side * 0.077 * s, 0, B + 0.4 * s, 0.022 * s, 0.045 * s, 0.17 * s,
            outline=0.012, bevel=0.004)
    box(f'mouth{k}', M['socket'], x, -0.068 * s, B + 0.385 * s, 0.07 * s, 0.01, 0.01 * s, outline=0, bevel=0)
    if topknot:
        cyl(f'pukao{k}', M['pukao'], 0.07 * s, 0.075 * s, segs=16, outline=0.018, smooth=True,
            matrix=Matrix.Translation((x, 0, B + 0.66 * s + 0.037 * s)))


for k, (tall, topknot) in enumerate(((0.66, False), (0.72, True), (0.7, False), (0.74, False), (0.68, True), (0.64, False))):
    moai(k, -0.65 + 0.26 * k, tall, topknot)

turn(before, -20)
render(G)

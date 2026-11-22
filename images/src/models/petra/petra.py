# A cartoon Petra (Al-Khazneh, the Treasury) for the country maps, built in the set's shared
# look (../toon.py) on a tile of rose sand: the rose-red cliff with the Treasury's face carved
# into it: below, six columns, a doorway and a pediment; above, the round tholos with its cone
# and urn between two pavilions crowned with halves of a broken pediment; and the rocks of the
# Siq either side. Turned to face the camera.
# Run: blender -b --factory-startup -P petra.py -- petra-1024.png 1024 petra.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e8bf94', lift=0.25),
    'rock': toon('rock', '#c97b5c', shadow_mul=(0.78, 0.68, 0.72)),
    'facade': toon('facade', '#e7a988', shadow_mul=(0.8, 0.7, 0.74)),
    'door': flat('door', '#4a2f2a'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(5)


def rock_ring(cx, cy, rx, ry, z, jitter, sides=12):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- the cliff, and the Siq's rocks either side in front ----------
cliff = loft('cliff', M['rock'], [rock_ring(0, 0.62, 1.22, 0.56, -0.01, 0.04), rock_ring(0, 0.64, 1.16, 0.52, 0.5, 0.08),
                                  rock_ring(0, 0.66, 1.08, 0.48, 1.05, 0.08), rock_ring(0, 0.7, 0.95, 0.4, 1.35, 0.06)],
             outline=0.04)
cliff.visible_shadow = False  # its own facets shadowing themselves speckled
for k, (x, y) in enumerate(((-0.98, -0.32), (0.98, -0.3))):
    r = loft(f'siq{k}', M['rock'], [rock_ring(x, y, 0.3, 0.26, -0.01, 0.1, 9), rock_ring(x, y, 0.26, 0.22, 0.28, 0.14, 9),
                                     rock_ring(x, y, 0.16, 0.14, 0.5, 0.12, 9)], outline=0.035)
    r.visible_shadow = False

# ---------- the Treasury's face: a smooth panel carved into the cliff ----------
F = 0.06          # the face's plane (y), in front of the cliff
box('panel', M['facade'], 0, F + 0.06, G, 1.0, 0.12, 1.2, outline=0.035, bevel=0.01)
box('steps', M['facade'], 0, F - 0.08, G - 0.005, 0.94, 0.14, 0.045, outline=0.02, bevel=0.004)
LOW = G + 0.04
# below: six columns, the doorway between the middle two, the entablature and the pediment
for k, x in enumerate((-0.38, -0.23, -0.08, 0.08, 0.23, 0.38)):
    rod(f'column{k}', M['facade'], (x, F - 0.05, LOW), (x, F - 0.05, LOW + 0.42), 0.036, segs=12, outline=0.02)
    box(f'capital{k}', M['facade'], x, F - 0.05, LOW + 0.42, 0.08, 0.08, 0.03, outline=0.014, bevel=0)
box('doorway', M['door'], 0, F - 0.006, LOW, 0.12, 0.02, 0.26, outline=0, bevel=0)
box('entablature', M['facade'], 0, F - 0.04, LOW + 0.45, 0.94, 0.11, 0.07, outline=0.025, bevel=0.004)
Z_PED = LOW + 0.52
loft('pediment', M['facade'], [[(-0.3, y, Z_PED), (0.3, y, Z_PED), (0, y, Z_PED + 0.13)] for y in (F - 0.09, F - 0.01)],
     outline=0.025)
# above: the tholos with its cone and urn, between two pavilions under half pediments
UP = Z_PED + 0.08
box('attic', M['facade'], 0, F - 0.03, Z_PED - 0.005, 0.94, 0.09, 0.06, outline=0.02, bevel=0.004)
cyl('tholos', M['facade'], 0.11, 0.34, segs=20, outline=0.025, smooth=True, matrix=Matrix.Translation((0, F - 0.08, UP + 0.17)))
box('tholosdoor', M['door'], 0, F - 0.19, UP + 0.04, 0.05, 0.02, 0.14, outline=0, bevel=0)
lathe('tholosroof', M['facade'], ((0.13, 0), (0.12, 0.03), (0.02, 0.13)), UP + 0.34, 0, F - 0.08, segs=20, outline=0.02)
ball('urn', M['facade'], 0, F - 0.08, UP + 0.5, 0.04, outline=0.015)
for side in (-1, 1):
    x = side * 0.33
    box(f'pavilion{side}', M['facade'], x, F - 0.04, UP, 0.24, 0.09, 0.3, outline=0.022, bevel=0.004)
    for dx in (-0.08, 0.08):
        rod(f'pavcol{side}{dx}', M['facade'], (x + dx, F - 0.095, UP), (x + dx, F - 0.095, UP + 0.28), 0.025, segs=10, outline=0.014)
    inner, outer = side * 0.21, side * 0.45
    loft(f'halfpediment{side}', M['facade'], [[(outer, y, UP + 0.3), (inner, y, UP + 0.3), (inner, y, UP + 0.41)]
                                              for y in (F - 0.09, F - 0.01)], outline=0.02)

turn(before, -32)
render(G)

# A cartoon East Rennell for the country maps, built in the set's shared look (../toon.py): the
# raised coral atoll in the Solomon Islands, its forested rim of limestone cliffs round Lake Tegano,
# the Pacific's largest island lake, with its little forested limestone islets, a dugout canoe on
# the brackish water, and the sea beyond the cliffs. Turned a little towards the camera.
# Run: blender -b --factory-startup -P east-rennell.py -- east-rennell-1024.png 1024 east-rennell.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2f8fc8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'lake': toon('lake', '#4aa6a0', shadow_mul=(0.74, 0.84, 0.86), lift=0.35),
    'rimGreen': toon('rimGreen', '#3f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'forest': toon('forest', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'forestLight': toon('forestLight', '#5aa652', shadow_mul=(0.7, 0.78, 0.8)),
    'islet': toon('islet', '#9a9488', shadow_mul=(0.8, 0.8, 0.88)),
    'canoe': toon('canoe', '#6b4a33'),
    'shirt': toon('shirt', '#e0453a'), 'skin': toon('skin', '#6b4430'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(929)

LX, LY = 0.0, 0.05
ANGLES = [2 * math.pi * k / 30 for k in range(31)]


def band(name, mat, rin, rout, z0, z1):
    for k, (t0, t1) in enumerate(zip(ANGLES, ANGLES[1:])):
        quad = [(LX + rin[0] * math.cos(t0), LY + rin[1] * math.sin(t0)), (LX + rout[0] * math.cos(t0), LY + rout[1] * math.sin(t0)),
                (LX + rout[0] * math.cos(t1), LY + rout[1] * math.sin(t1)), (LX + rin[0] * math.cos(t1), LY + rin[1] * math.sin(t1))]
        piece = loft(f'{name}{k}', M[mat], [[(x, y, z0) for x, y in quad], [(x, y, z1) for x, y in quad]], outline=0.01)
        piece.visible_shadow = False


# ---------- the lake, and the atoll's rim of cliffs round it ----------
cyl('lake', M['lake'], 1.0, 0.006, segs=40, outline=0.006, matrix=Matrix.Translation((LX, LY, G + 0.003)) @ Matrix.Scale(0.8, 4, (1, 0, 0)) @ Matrix.Scale(0.6, 4, (0, 1, 0)))
band('rim', 'rimGreen', (0.78, 0.58), (1.25, 1.0), G - 0.01, G + 0.09)
for k in range(30):
    a = ANGLES[k] + 0.1
    for s in (0.88, 1.12):
        x, y = LX + 1.0 * s * math.cos(a), LY + 0.78 * s * math.sin(a)
        if math.hypot(x, y) > 1.3 or (s > 1 and math.sin(a) < -0.3):
            continue
        ball(f'rimforest{k}{s}', M['forest' if (k + int(s * 10)) % 2 else 'forestLight'], x, y, G + 0.13, rng.uniform(0.07, 0.09), outline=0.012)

# ---------- the forested limestone islets in the lake ----------
for k, (x, y, r) in enumerate(((-0.3, 0.15, 0.12), (0.2, 0.25, 0.09), (0.35, -0.1, 0.07), (-0.05, -0.15, 0.06), (-0.5, -0.1, 0.07))):
    lathe(f'islet{k}', M['islet'], ((r * 0.8, 0), (r, 0.05), (r * 0.9, 0.08)), G, x, y, segs=12, outline=0.008)
    ball(f'isletforest{k}', M['forest' if k % 2 else 'forestLight'], x, y, G + 0.1, r * 0.9, outline=0.01)

# ---------- a dugout canoe on the lake ----------
CX, CY = 0.1, -0.35
loft('canoe', M['canoe'], [[(CX - 0.13, CY, G + 0.005), (CX, CY - 0.025, G + 0.005), (CX + 0.13, CY, G + 0.005), (CX, CY + 0.025, G + 0.005)],
                           [(CX - 0.15, CY, G + 0.035), (CX, CY - 0.032, G + 0.035), (CX + 0.15, CY, G + 0.035), (CX, CY + 0.032, G + 0.035)]], outline=0.006)
rod('paddlerbody', M['shirt'], (CX - 0.03, CY, G + 0.035), (CX - 0.03, CY, G + 0.08), 0.014, segs=8, outline=0.003)
ball('paddlerhead', M['skin'], CX - 0.03, CY, G + 0.095, 0.014, outline=0.003)
bar('paddle', M['canoe'], (CX - 0.01, CY - 0.05, G + 0.0), (CX - 0.05, CY + 0.02, G + 0.1), 0.006, outline=0.001)

turn(before, -20)
render(G)

# A cartoon Neuschwanstein Castle for the country maps, built in the set's shared look
# (../toon.py): a forested rock with a grey cliff on top, and on it the white palace with its
# rows of windows under a slate gabled roof, the tall slender tower and the round bower with
# their pointed blue-grey spires, little corner turrets, and the red-ochre gatehouse in front.
# Run: blender -b --factory-startup -P neuschwanstein.py -- neuschwanstein-1024.png 1024 neuschwanstein.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'wall': toon('wall', '#f2eee6', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'slate': toon('slate', '#5a6f8f', shadow_mul=(0.75, 0.75, 0.85), lift=0.25),
    'gatehouse': toon('gatehouse', '#c98868'),
    'window': flat('window', '#3f4a66'),
    'forest': toon('forest', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'rock': toon('rock', '#a39c92', shadow_mul=(0.75, 0.75, 0.85)),
})

G = tile()

# ---------- the rock, forest below and a grey cliff on top ----------
rng = random.Random(11)
SIDES = 12


def ring(r, z, jitter):
    return [(r * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / SIDES),
             r * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / SIDES), G + z) for k in range(SIDES)]


forest = loft('forest', M['forest'], [ring(1.3, -0.01, 0.0), ring(1.16, 0.16, 0.08), ring(0.98, 0.3, 0.08), ring(0.84, 0.38, 0.05)],
              outline=0.04)
CLIFF = 0.55
cliff = loft('cliff', M['rock'], [ring(0.86, 0.32, 0.04), ring(0.76, 0.47, 0.06), ring(0.72, CLIFF, 0.0)], outline=0.035)
forest.visible_shadow = cliff.visible_shadow = False  # their facets shadowing themselves speckled
H = G + CLIFF


def windows(prefix, x0, x1, y, z0, rows, cols, w=0.03, h=0.055, gap=0.1):
    for r in range(rows):
        for c in range(cols):
            x = x0 + (x1 - x0) * (c + 0.5) / cols
            box(f'{prefix}{r}{c}', M['window'], x, y, z0 + r * gap, w, 0.02, h, outline=0, bevel=0)


def gable(name, mat, x, y, z, w, d, h, over=0.025):
    """A gabled roof along x over a w by d block."""
    loft(name, mat, [[(xx, y - d / 2 - over, z), (xx, y + d / 2 + over, z), (xx, y, z + h)]
                     for xx in (x - w / 2 - over, x + w / 2 + over)], outline=0.025)


def round_tower(name, x, y, r, h, spire, z0=H):
    lathe(name, M['wall'], ((r, 0), (r, h)), z0, x, y, segs=20, outline=0.03)
    lathe(name + 'spire', M['slate'], ((r + 0.02, 0), (r * 0.7, spire * 0.2), (0.004, spire)), z0 + h, x, y, segs=20,
          outline=0.025)
    cam = Vector((-math.sin(math.radians(32)), -math.cos(math.radians(32)), 0)) * (r + 0.004)
    for k in range(3):
        box(f'{name}win{k}', M['window'], x + cam.x, y + cam.y, z0 + h * (0.3 + 0.22 * k), 0.026, 0.02, 0.05,
            rot_z=math.radians(-32), outline=0, bevel=0)


# ---------- the palace ----------
PW, PD, PH = 0.66, 0.26, 0.5
box('palace', M['wall'], 0.0, 0.08, H, PW, PD, PH, outline=0.035, bevel=0.006)
gable('palaceroof', M['slate'], 0.0, 0.08, H + PH, PW, PD, 0.2)
windows('pw', -0.3, 0.3, 0.08 - PD / 2 - 0.006, H + 0.1, 4, 6)
for k, x in enumerate((-0.3, 0.3)):
    lathe(f'turret{k}', M['wall'], ((0.035, 0), (0.035, 0.2)), H + PH - 0.08, x, 0.08 - PD / 2, segs=12, outline=0.018)
    lathe(f'turretspire{k}', M['slate'], ((0.045, 0), (0.003, 0.17)), H + PH + 0.12, x, 0.08 - PD / 2, segs=12, outline=0.016)

# ---------- the tall slender tower and the round bower ----------
round_tower('keep', -0.33, 0.16, 0.075, 0.86, 0.34)
round_tower('bower', 0.34, -0.08, 0.09, 0.6, 0.28)

# ---------- the gatehouse, red-ochre, in front ----------
box('gatehouse', M['gatehouse'], -0.12, -0.24, H, 0.32, 0.14, 0.3, outline=0.03, bevel=0.006)
gable('gateroof', M['slate'], -0.12, -0.24, H + 0.3, 0.32, 0.14, 0.12)
box('gate', M['window'], -0.12, -0.24 - 0.076, H, 0.07, 0.02, 0.12, outline=0, bevel=0)
cyl('gatetop', M['window'], 0.035, 0.02, segs=12, outline=0,
    matrix=Matrix.Translation((-0.12, -0.316, H + 0.12)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
windows('gw', -0.26, 0.02, -0.24 - 0.076, H + 0.17, 1, 3)
for k, x in enumerate((-0.28, 0.04)):
    lathe(f'gateturret{k}', M['gatehouse'], ((0.035, 0), (0.035, 0.38)), H, x, -0.31, segs=12, outline=0.018)
    lathe(f'gateturretspire{k}', M['slate'], ((0.045, 0), (0.003, 0.15)), H + 0.38, x, -0.31, segs=12, outline=0.016)

render(G)

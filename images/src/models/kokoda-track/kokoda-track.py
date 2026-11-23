# A cartoon Kokoda Track for the country maps, built in the set's shared look (../toon.py): the
# trail over Papua New Guinea's Owen Stanley Range, jungle-covered ridges in the cloud, the muddy
# path winding over them past Efogi's thatched stilt houses, the four black granite pillars of the
# Isurava memorial, and a trekker with a pack. Turned a little towards the camera.
# Run: blender -b --factory-startup -P kokoda-track.py -- kokoda-track-1024.png 1024 kokoda-track.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ridge': toon('ridge', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'ridgeDark': toon('ridgeDark', '#2f6e40', shadow_mul=(0.7, 0.78, 0.8)),
    'jungle': toon('jungle', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'jungleLight': toon('jungleLight', '#5aa652', shadow_mul=(0.7, 0.78, 0.8)),
    'trail': toon('trail', '#9a6e48'),
    'cloud': toon('cloud', '#f4f6fa', shadow_mul=(0.84, 0.86, 0.94), lift=0.15),
    'stilt': toon('stilt', '#7a5a40'),
    'wall': toon('wall', '#c8a878', shadow_mul=(0.84, 0.76, 0.66)),
    'thatch': toon('thatch', '#a89060', shadow_mul=(0.84, 0.76, 0.62)),
    'granite': toon('granite', '#2e2a30', shadow_mul=(0.86, 0.86, 0.9)),
    'plinth': toon('plinth', '#a8a49a', shadow_mul=(0.8, 0.8, 0.88)),
    'shirt': toon('shirt', '#e0453a'), 'pack': toon('pack', '#3f6fa0'), 'skin': toon('skin', '#e0b090'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(887)


def ring(cx, cy, rx, ry, z, k, sides=20):
    return [(cx + rx * math.cos(t) * (1 + 0.05 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.05 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- ridges, jungle-covered ----------
for k, (cx, cy, rx, ry, h) in enumerate(((-0.5, 0.65, 0.6, 0.38, 0.5), (0.45, 0.75, 0.55, 0.36, 0.58), (0.0, 0.2, 0.55, 0.3, 0.3))):
    rd = loft(f'ridge{k}', M['ridge' if k % 2 else 'ridgeDark'], [ring(cx, cy, rx, ry, -0.01, k), ring(cx, cy, rx * 0.55, ry * 0.5, h * 0.7, k), ring(cx, cy, rx * 0.2, ry * 0.18, h, k)],
              outline=0.025, smooth=True)
    rd.visible_shadow = False
    for j in range(12):
        a = 2 * math.pi * j / 12
        for s, z in ((0.8, 0.22), (0.45, 0.78)):
            x, y = cx + s * rx * math.cos(a), cy + s * ry * math.sin(a)
            if math.hypot(x, y) > 1.25:
                continue
            ball(f'jungle{k}{j}{s}', M['jungle' if (j + k) % 2 else 'jungleLight'], x, y, G + h * z + 0.03, rng.uniform(0.06, 0.08), outline=0.01)
for k, (x, y, z, r) in enumerate(((-0.65, 0.75, 0.48, 0.1), (-0.5, 0.78, 0.5, 0.08), (0.3, 0.85, 0.55, 0.1), (0.45, 0.88, 0.58, 0.08))):
    ball(f'cloud{k}', M['cloud'], x, y, G + z, r, outline=0.01)

# ---------- the trail winding over the front ridge and down ----------
PATH = [(-1.0, -0.3), (-0.6, -0.25), (-0.35, -0.05), (-0.1, 0.05), (0.15, 0.0), (0.4, -0.15), (0.6, -0.4), (0.75, -0.75), (0.7, -1.05)]
bm = bmesh.new()
verts = []
for i, (x, y) in enumerate(PATH):
    (x0, y0), (x1, y1) = PATH[max(0, i - 1)], PATH[min(len(PATH) - 1, i + 1)]
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy)
    # the front ridge's height under the trail: its rings at 1, 0.53 and 0.19 of its foot's size
    rho = math.hypot(x / 0.55, (y - 0.2) / 0.3)
    z = 0.012 + (0.0 if rho >= 1 else 0.21 * (1 - rho) / 0.47 if rho >= 0.53 else 0.21 + 0.09 * (0.53 - rho) / 0.34 if rho >= 0.19 else 0.3)
    w = 0.035
    verts.append((bm.verts.new((x - dy / n * w, y + dx / n * w, G + z)), bm.verts.new((x + dy / n * w, y - dx / n * w, G + z))))
for (a0, a1), (b0, b1) in zip(verts, verts[1:]):
    bm.faces.new((a0, a1, b1, b0))
finish('trail', bm, M['trail'], outline=0.005)

# ---------- Efogi's thatched stilt houses ----------
for k, (x, y) in enumerate(((-0.7, -0.6), (-0.45, -0.72), (-0.85, -0.35))):
    for sx in (-1, 1):
        for sy in (-1, 1):
            rod(f'stilt{k}{sx}{sy}', M['stilt'], (x + sx * 0.06, y + sy * 0.045, G), (x + sx * 0.06, y + sy * 0.045, G + 0.06), 0.007, segs=5, outline=0.002)
    box(f'house{k}', M['wall'], x, y, G + 0.055, 0.15, 0.11, 0.07, outline=0.008, bevel=0)
    loft(f'houseroof{k}', M['thatch'], [[(x - 0.095, y - 0.075, G + 0.12), (x + 0.095, y - 0.075, G + 0.12), (x + 0.095, y + 0.075, G + 0.12), (x - 0.095, y + 0.075, G + 0.12)],
                                        [(x - 0.06, y - 0.004, G + 0.22), (x + 0.06, y - 0.004, G + 0.22), (x + 0.06, y + 0.004, G + 0.22), (x - 0.06, y + 0.004, G + 0.22)]],
         outline=0.008)

# ---------- the Isurava memorial's four granite pillars ----------
PX, PY = 0.25, -0.55
box('memorialplinth', M['plinth'], PX, PY, G - 0.005, 0.38, 0.14, 0.03, outline=0.006, bevel=0)
for k in range(4):
    box(f'pillar{k}', M['granite'], PX - 0.135 + k * 0.09, PY, G + 0.025, 0.05, 0.05, 0.2 + 0.01 * (k % 2), outline=0.006, bevel=0)

# ---------- a trekker on the trail ----------
TX, TY = 0.48, -0.25
rod('trekkerlegs', M['trail'], (TX, TY, G + 0.01), (TX, TY, G + 0.06), 0.012, segs=6, outline=0.002)
rod('trekkerbody', M['shirt'], (TX, TY, G + 0.06), (TX, TY, G + 0.11), 0.018, segs=8, outline=0.003)
box('trekkerpack', M['pack'], TX, TY + 0.022, G + 0.07, 0.035, 0.025, 0.05, outline=0.003, bevel=0.006)
ball('trekkerhead', M['skin'], TX, TY, G + 0.13, 0.016, outline=0.003)

turn(before, -20)
render(G)

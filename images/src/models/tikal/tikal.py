# A cartoon Tikal for the country maps, built in the set's shared look (../toon.py): Temple I, the
# Temple of the Great Jaguar, rising steeply in nine sloping terraces with its stairway up the
# front, the temple on top with its one doorway and the tall roof comb above it, Temple II's lower
# bulk across the Great Plaza, and the rainforest canopy all round. Turned a little towards the camera.
# Run: blender -b --factory-startup -P tikal.py -- tikal-1024.png 1024 tikal.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'stone': toon('stone', '#d3ccbb', shadow_mul=(0.78, 0.76, 0.84)),
    'stoneDark': toon('stoneDark', '#b5ad98', shadow_mul=(0.78, 0.76, 0.84)),
    'moss': toon('moss', '#9aa47a', shadow_mul=(0.72, 0.78, 0.8)),
    'stairs': toon('stairs', '#e4ddcc', shadow_mul=(0.8, 0.78, 0.86)),
    'door': flat('door', '#3f3545'),
    'canopy': toon('canopy', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'canopyDark': toon('canopyDark', '#3a7f43', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5238'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(61)


def terraces(name, cx, cy, base_w, base_d, top_w, top_d, height, count, z0=None):
    """Stepped terraces, each wall leaning in a little (the Maya talud). Returns the top's height."""
    z = G - 0.01 if z0 is None else z0
    h = height / count
    for k in range(count):
        t0, t1 = k / count, (k + 0.82) / count
        w0, d0 = base_w + (top_w - base_w) * t0, base_d + (top_d - base_d) * t0
        w1, d1 = base_w + (top_w - base_w) * t1, base_d + (top_d - base_d) * t1
        ring = lambda w, d, zz: [(cx - w / 2, cy - d / 2, zz), (cx + w / 2, cy - d / 2, zz), (cx + w / 2, cy + d / 2, zz), (cx - w / 2, cy + d / 2, zz)]
        mat = M['stone'] if k % 3 else M['moss']
        loft(f'{name}{k}', mat, [ring(w0, d0, z), ring(w1 * 0.97, d1 * 0.97, z + h)], outline=0.022)
        z += h
    return z


# ---------- Temple I: nine steep terraces ----------
TX, TY = 0.05, 0.25
BW, BD, TW, TD, H = 0.86, 0.74, 0.42, 0.36, 1.05
top = terraces('temple1_', TX, TY, BW, BD, TW, TD, H, 9)

# the stairway up the front
STEPS, SW = 22, 0.22
for j in range(STEPS):
    t = j / STEPS
    half_d = (BD + (TD - BD) * t) / 2
    box(f'step{j}', M['stairs'], TX, TY - half_d - 0.02, G + H * t - 0.01, SW, 0.1, H / STEPS + 0.004, outline=0.01, bevel=0)
for side in (-1, 1):
    bar(f'balustrade{side}', M['stoneDark'], (TX + side * (SW / 2 + 0.02), TY - BD / 2 - 0.05, G), (TX + side * (SW / 2 + 0.02), TY - TD / 2 - 0.05, top),
        0.04, outline=0.014)

# the temple on top, its doorway and the tall roof comb
box('temple', M['stone'], TX, TY + 0.02, top, 0.34, 0.28, 0.2, outline=0.024, bevel=0.005)
box('templedoor', M['door'], TX, TY + 0.02 - 0.142, top + 0.01, 0.07, 0.02, 0.13, outline=0, bevel=0)
box('templecornice', M['stoneDark'], TX, TY + 0.02, top + 0.2, 0.37, 0.31, 0.035, outline=0.016, bevel=0.003)
box('roofcomb', M['stone'], TX, TY + 0.08, top + 0.235, 0.26, 0.12, 0.28, outline=0.022, bevel=0.004)
box('roofcombtop', M['stoneDark'], TX, TY + 0.08, top + 0.515, 0.2, 0.1, 0.05, outline=0.016, bevel=0.003)
# the worn carving on the comb's face
box('combface', M['moss'], TX, TY + 0.08 - 0.062, top + 0.3, 0.12, 0.012, 0.14, outline=0, bevel=0)

# ---------- Temple II across the plaza, lower and broader ----------
T2X, T2Y = -0.62, -0.42
top2 = terraces('temple2_', T2X, T2Y, 0.56, 0.48, 0.34, 0.28, 0.42, 3)
for j in range(9):
    t = j / 9
    half_d = (0.48 + (0.28 - 0.48) * t) / 2
    box(f'step2_{j}', M['stairs'], T2X, T2Y - half_d - 0.015, G + 0.42 * t - 0.01, 0.16, 0.08, 0.42 / 9 + 0.004, outline=0.008, bevel=0)
box('temple2', M['stone'], T2X, T2Y + 0.02, top2, 0.26, 0.2, 0.15, outline=0.02, bevel=0.004)
box('temple2door', M['door'], T2X, T2Y + 0.02 - 0.102, top2 + 0.01, 0.06, 0.02, 0.1, outline=0, bevel=0)
box('temple2comb', M['stoneDark'], T2X, T2Y + 0.05, top2 + 0.15, 0.2, 0.09, 0.16, outline=0.018, bevel=0.004)

# ---------- the rainforest canopy all round ----------
SPOTS = [(-1.05, 0.55), (-0.85, 0.95), (-0.35, 1.15), (0.45, 1.12), (0.9, 0.85), (1.15, 0.35), (1.1, -0.2), (0.85, -0.7),
         (0.35, -1.05), (-1.15, 0.0), (-1.1, -0.75), (-0.2, -1.15)]
for k, (x, y) in enumerate(SPOTS):
    r = rng.uniform(0.17, 0.23)
    h = rng.uniform(0.2, 0.34)
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + h), 0.03, segs=8, outline=0.014)
    crown = ball(f'crown{k}', M['canopy' if k % 2 else 'canopyDark'], x, y, G + h + r * 0.4, r, outline=0.024)
    crown.scale = (1, 1, 0.7)
    crown.location = (0, 0, (G + h + r * 0.4) * (1 - 0.7))

turn(before, -20)
render(G)

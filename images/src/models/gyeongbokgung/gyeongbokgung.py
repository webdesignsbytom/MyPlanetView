# A cartoon Gyeongbokgung (its throne hall, Geunjeongjeon) for the country maps, built in the
# set's shared look (../toon.py): the two-tiered stone terrace with its stairs, the hall's red
# pillars and green-and-blue painted beams, and its great two-tiered roof of dark tiles with
# upswept corners; Bugaksan's green peak behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P gyeongbokgung.py -- gyeongbokgung-1024.png 1024 gyeongbokgung.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'granite': toon('granite', '#d8d4ca', shadow_mul=(0.8, 0.8, 0.9)),
    'pillar': toon('pillar', '#b8382e'),
    'beam': toon('beam', '#3f9a7a', shadow_mul=(0.7, 0.78, 0.8)),
    'beamBlue': toon('beamBlue', '#4a78b8', shadow_mul=(0.72, 0.72, 0.82)),
    'wall': toon('wall', '#efe4cc', shadow_mul=(0.82, 0.78, 0.86)),
    'roof': toon('roof', '#4a4f5a', shadow_mul=(0.75, 0.75, 0.85), lift=0.25),
    'ridge': toon('ridge', '#3a3e47', shadow_mul=(0.75, 0.75, 0.85)),
    'door': flat('door', '#5a2e26'),
    'mountain': toon('mountain', '#5f9e55', shadow_mul=(0.7, 0.78, 0.8)),
    'rock': toon('rock', '#9a958c', shadow_mul=(0.76, 0.76, 0.86)),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(23)


# ---------- Bugaksan behind ----------
def ring(cx, cy, r, z, jitter, sides=11):
    return [(cx + r * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + r * 0.7 * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


hill = loft('bugaksan', M['mountain'], [ring(0.15, 0.95, 0.75, -0.01, 0.0), ring(0.15, 0.98, 0.55, 0.4, 0.1),
                                        ring(0.18, 1.0, 0.32, 0.75, 0.12)], outline=0.035)
peak = loft('bugaksanrock', M['rock'], [ring(0.18, 1.0, 0.34, 0.7, 0.1), ring(0.2, 1.0, 0.16, 0.95, 0.1), ring(0.2, 1.0, 0.02, 1.02, 0.0)],
            outline=0.03)
hill.visible_shadow = peak.visible_shadow = False

# ---------- the courtyard and the two-tiered terrace ----------
box('courtyard', M['path'], 0, -0.1, G - 0.006, 1.9, 1.3, 0.02, outline=0.015, bevel=0)
z = G
for k, (w, d, h) in enumerate(((1.4, 0.95, 0.09), (1.2, 0.78, 0.09))):
    box(f'terrace{k}', M['granite'], 0, 0, z, w, d, h, outline=0.025, bevel=0.006)
    box(f'stairs{k}', M['granite'], 0, -d / 2 - 0.05, z, 0.24, 0.1, h, outline=0.018, bevel=0)
    z += h
T = z

# ---------- the hall: red pillars, painted beams, latticed walls ----------
HW, HD, HH = 0.96, 0.56, 0.3
box('hallwalls', M['wall'], 0, 0, T, HW - 0.1, HD - 0.1, HH, outline=0.02, bevel=0)
for k in range(5):
    x = -0.3 + 0.15 * k
    box(f'door{k}', M['door'], x, -(HD - 0.1) / 2 - 0.006, T, 0.1, 0.02, HH * 0.8, outline=0, bevel=0)
for i in range(7):
    x = -HW / 2 + HW * i / 6
    for y in (-HD / 2, HD / 2):
        rod(f'pillar{i}{y}', M['pillar'], (x, y, T), (x, y, T + HH), 0.022, segs=10, outline=0.01)
for j in range(1, 4):
    y = -HD / 2 + HD * j / 4
    for x in (-HW / 2, HW / 2):
        rod(f'sidepillar{j}{x}', M['pillar'], (x, y, T), (x, y, T + HH), 0.022, segs=10, outline=0.01)
box('beam', M['beam'], 0, 0, T + HH - 0.01, HW + 0.05, HD + 0.05, 0.05, outline=0.015, bevel=0)
box('beamband', M['beamBlue'], 0, 0, T + HH + 0.04, HW + 0.05, HD + 0.05, 0.025, outline=0.01, bevel=0)


def roof(name, z0, w, d, h, lift, ridge_w):
    """A hipped roof whose corners sweep up: its eave sags between the corners."""
    def edge_ring(hw, hd, z, rise):
        return [(hw, -hd, z + rise), (0, -hd, z), (-hw, -hd, z + rise), (-hw, 0, z), (-hw, hd, z + rise), (0, hd, z),
                (hw, hd, z + rise), (hw, 0, z)]
    loft(name, M['roof'], [edge_ring(w / 2, d / 2, z0, lift), edge_ring(w / 2 - 0.06, d / 2 - 0.06, z0 + 0.03, lift * 0.7),
                           edge_ring(ridge_w / 2, 0.03, z0 + h, 0)], outline=0.03)
    box(name + 'ridge', M['ridge'], 0, 0, z0 + h - 0.01, ridge_w + 0.04, 0.05, 0.045, outline=0.014, bevel=0.005)
    for s in (-1, 1):
        box(name + f'end{s}', M['ridge'], s * (ridge_w / 2 + 0.02), 0, z0 + h - 0.01, 0.04, 0.05, 0.08, outline=0.012, bevel=0)


# the lower roof, the upper storey, the upper roof
roof('lowerroof', T + HH + 0.06, HW + 0.36, HD + 0.32, 0.16, 0.08, HW * 0.55)
box('upperstorey', M['wall'], 0, 0, T + HH + 0.19, HW * 0.62, HD * 0.5, 0.12, outline=0.018, bevel=0)
box('upperbeam', M['beam'], 0, 0, T + HH + 0.3, HW * 0.66, HD * 0.54, 0.035, outline=0.012, bevel=0)
roof('upperroof', T + HH + 0.33, HW * 0.92, HD * 0.85, 0.22, 0.07, HW * 0.45)

turn(before, -20)
render(G)

# A cartoon Kaesong for the country maps, built in the set's shared look (../toon.py): the old
# Koryo capital in North Korea, its South Gate, Namdaemun, a stone base with an arched passage under
# a two-tier pavilion with upswept tiled roofs, the Sungkyunkwan academy's hall among golden ginkgo
# trees behind, and Mount Songak beyond. Turned a little towards the camera.
# Run: blender -b --factory-startup -P kaesong.py -- kaesong-1024.png 1024 kaesong.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'stone': toon('stone', '#c8c0b0', shadow_mul=(0.8, 0.8, 0.88)),
    'stoneDark': toon('stoneDark', '#a8a092', shadow_mul=(0.8, 0.8, 0.88)),
    'tile': toon('tileRoof', '#4a5058', shadow_mul=(0.78, 0.8, 0.88)),
    'wood': toon('wood', '#b8402f'),
    'green': toon('greenPaint', '#3f8a6a'),
    'window': flat('window', '#2e2a28'),
    'ginkgo': toon('ginkgo', '#f2c84a', shadow_mul=(0.84, 0.72, 0.6)),
    'trunk': toon('trunk', '#6b5040'),
    'mountain': toon('mountain', '#5f8a55', shadow_mul=(0.7, 0.78, 0.8)),
    'courtyard': toon('courtyard', '#d9c9a8', lift=0.25),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(823)


def korean_roof(name, x, y, z, w, d, h, rise=0.035):
    """A hipped roof of dark tiles, its eaves overhanging and its corners swept up."""
    loft(name, M['tile'], [[(x - w / 2, y - d / 2, z), (x + w / 2, y - d / 2, z), (x + w / 2, y + d / 2, z), (x - w / 2, y + d / 2, z)],
                           [(x - w / 2 + 0.03, y - d / 2 + 0.03, z + h * 0.35), (x + w / 2 - 0.03, y - d / 2 + 0.03, z + h * 0.35), (x + w / 2 - 0.03, y + d / 2 - 0.03, z + h * 0.35),
                            (x - w / 2 + 0.03, y + d / 2 - 0.03, z + h * 0.35)],
                           [(x - w * 0.3, y - 0.006, z + h), (x + w * 0.3, y - 0.006, z + h), (x + w * 0.3, y + 0.006, z + h), (x - w * 0.3, y + 0.006, z + h)]], outline=0.01)
    for sx in (-1, 1):
        for sy in (-1, 1):
            bar(f'{name}tip{sx}{sy}', M['tile'], (x + sx * (w / 2 - 0.03), y + sy * (d / 2 - 0.03), z + 0.01), (x + sx * (w / 2 + 0.02), y + sy * (d / 2 + 0.02), z + rise),
                0.02, outline=0.004)


# ---------- Mount Songak behind ----------
m = loft('songak', M['mountain'], [[(0.1 + 0.8 * math.cos(t), 1.0 + 0.3 * math.sin(t), G - 0.01) for t in (2 * math.pi * j / 18 for j in range(18))],
                                  [(0.1 + 0.4 * math.cos(t), 1.02 + 0.15 * math.sin(t), G + 0.3) for t in (2 * math.pi * j / 18 for j in range(18))],
                                  [(0.15 + 0.1 * math.cos(t), 1.05 + 0.04 * math.sin(t), G + 0.42) for t in (2 * math.pi * j / 18 for j in range(18))]], outline=0.025, smooth=True)
m.visible_shadow = False

# ---------- the Sungkyunkwan's hall and its courtyard, ginkgos ----------
HX, HY = -0.1, 0.45
box('courtyard', M['courtyard'], HX, HY - 0.1, G - 0.004, 0.9, 0.5, 0.008, outline=0.004, bevel=0)
box('hallbase', M['stone'], HX, HY, G - 0.005, 0.6, 0.24, 0.05, outline=0.01, bevel=0)
box('hall', M['wood'], HX, HY, G + 0.045, 0.52, 0.18, 0.12, outline=0.012, bevel=0)
for k in range(7):
    box(f'hallpanel{k}', M['green'], HX - 0.24 + k * 0.08, HY - 0.094, G + 0.07, 0.05, 0.01, 0.07, outline=0, bevel=0)
korean_roof('hallroof', HX, HY, G + 0.16, 0.7, 0.34, 0.14)
for k, (x, y) in enumerate(((-0.65, 0.2), (0.45, 0.25), (-0.55, 0.62), (0.55, 0.62))):
    rod(f'ginkgotrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.16), 0.025, segs=8, outline=0.006)
    lathe(f'ginkgo{k}', M['ginkgo'], ((0.06, 0), (0.15, 0.08), (0.14, 0.18), (0.06, 0.28), (0.004, 0.31)), G + 0.12, x, y, segs=14, outline=0.012)

# ---------- Namdaemun: the stone gate and its two-tier pavilion ----------
GX, GY = 0.1, -0.4
box('gatebase', M['stone'], GX, GY, G - 0.005, 0.66, 0.3, 0.2, outline=0.016, bevel=0)
for k in range(4):
    box(f'gatecourse{k}', M['stoneDark'], GX, GY - 0.151, G + 0.03 + k * 0.045, 0.66, 0.008, 0.006, outline=0, bevel=0)
pts = [(GX - 0.07, 0.0), (GX + 0.07, 0.0)] + [(GX + 0.07 * math.cos(t), 0.1 + 0.07 * math.sin(t)) for t in (math.pi * j / 10 for j in range(11))]
loft('gatepassage', M['window'], [[(px, GY - 0.156, G + pz) for px, pz in pts], [(px, GY - 0.146, G + pz) for px, pz in pts]], outline=0)
box('pavilion1', M['wood'], GX, GY, G + 0.195, 0.4, 0.18, 0.08, outline=0.012, bevel=0)
for k in range(6):
    box(f'pavilionpanel{k}', M['green'], GX - 0.17 + k * 0.068, GY - 0.094, G + 0.21, 0.04, 0.01, 0.05, outline=0, bevel=0)
korean_roof('gateroof1', GX, GY, G + 0.27, 0.56, 0.32, 0.08, rise=0.03)
box('pavilion2', M['wood'], GX, GY, G + 0.33, 0.3, 0.14, 0.06, outline=0.01, bevel=0)
korean_roof('gateroof2', GX, GY, G + 0.385, 0.46, 0.26, 0.11)

turn(before, -20)
render(G)

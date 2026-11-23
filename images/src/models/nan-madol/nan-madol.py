# A cartoon Nan Madol for the country maps, built in the set's shared look (../toon.py): the ruined
# city of artificial islets in Pohnpei's lagoon in Micronesia, Nandauwas' great walls of basalt
# logs stacked crosswise, its corners rising, the smaller islets' log platforms, mangroves round
# the lagoon, palms, and an outrigger canoe in the channel. Turned a little towards the camera.
# Run: blender -b --factory-startup -P nan-madol.py -- nan-madol-1024.png 1024 nan-madol.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lagoon': toon('lagoon', '#4ab0b0', shadow_mul=(0.74, 0.84, 0.88), lift=0.35),
    'basalt': toon('basalt', '#4a4c52', shadow_mul=(0.84, 0.84, 0.9)),
    'basaltLight': toon('basaltLight', '#62646a', shadow_mul=(0.84, 0.84, 0.9)),
    'fill': toon('fill', '#8a8478', shadow_mul=(0.8, 0.8, 0.88)),
    'mangrove': toon('mangrove', '#3f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'root': toon('root', '#6b5040'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'canoe': toon('canoe', '#8a5a3a'),
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
})

G = tile(M['lagoon'])
before = set(bpy.data.objects)
rng = random.Random(743)


def log(name, p0, p1, r=0.016):
    rod(name, M['basalt' if rng.random() < 0.7 else 'basaltLight'], p0, p1, r, segs=6, outline=0.004)


def log_walls(name, cx, cy, w, d, layers, base_z, corner_rise=0.0):
    """Walls of basalt logs round a rectangle: layers of logs along the wall, then crosswise headers."""
    corners = [(cx - w / 2, cy - d / 2), (cx + w / 2, cy - d / 2), (cx + w / 2, cy + d / 2), (cx - w / 2, cy + d / 2)]
    for layer in range(layers):
        z = base_z + 0.024 + layer * 0.03
        for k in range(4):
            (x0, y0), (x1, y1) = corners[k], corners[(k + 1) % 4]
            length = math.hypot(x1 - x0, y1 - y0)
            ux, uy = (x1 - x0) / length, (y1 - y0) / length
            nx, ny = uy, -ux
            if layer % 2 == 0:
                for side in (-1, 1):
                    log(f'{name}l{layer}{k}{side}', (x0 + side * nx * 0.025, y0 + side * ny * 0.025, z), (x1 + side * nx * 0.025, y1 + side * ny * 0.025, z))
            else:
                count = int(length / 0.07)
                for j in range(count + 1):
                    t = j / count
                    rise = corner_rise * (abs(2 * t - 1) ** 3) * layer / layers
                    px, py = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
                    log(f'{name}h{layer}{k}{j}', (px - nx * 0.05, py - ny * 0.05, z + rise), (px + nx * 0.05, py + ny * 0.05, z + rise))


# ---------- Nandauwas: its outer wall, rising at the corners, and its inner court ----------
NX, NY = -0.05, 0.12
box('islet', M['fill'], NX, NY, G - 0.005, 0.92, 0.78, 0.03, outline=0.01, bevel=0)
log_walls('outer', NX, NY, 0.82, 0.68, 8, G, corner_rise=0.08)
box('court', M['grass'], NX, NY, G + 0.02, 0.38, 0.3, 0.01, outline=0, bevel=0)
log_walls('inner', NX, NY, 0.34, 0.26, 5, G + 0.01)
box('tomb', M['basalt'], NX, NY, G + 0.02, 0.1, 0.07, 0.05, outline=0.006, bevel=0)

# ---------- smaller islets' log platforms ----------
for k, (x, y, w, d) in enumerate(((0.75, -0.25, 0.32, 0.26), (-0.75, -0.45, 0.28, 0.24), (0.62, 0.62, 0.3, 0.22))):
    box(f'smallislet{k}', M['fill'], x, y, G - 0.005, w, d, 0.03, outline=0.008, bevel=0)
    log_walls(f'platform{k}', x, y, w - 0.06, d - 0.06, 3, G)
    h = rng.uniform(0.22, 0.28)
    rod(f'palmtrunk{k}', M['trunk'], (x + 0.05, y, G + 0.03), (x + 0.08, y, G + 0.03 + h), 0.013, r2=0.01, segs=8, outline=0.005)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.08, y, G + 0.03 + h), (x + 0.08 + 0.09 * math.cos(b), y + 0.09 * math.sin(b), G + h - 0.02), 0.018, outline=0.005)

# ---------- mangroves round the lagoon ----------
for k in range(16):
    a = 2 * math.pi * k / 16 + rng.uniform(-0.08, 0.08)
    if 4.0 < a < 5.5:
        continue
    r = rng.uniform(1.12, 1.25)
    x, y = r * math.cos(a), r * 0.95 * math.sin(a)
    for j in range(3):
        b = 2 * math.pi * j / 3
        rod(f'mroot{k}{j}', M['root'], (x + 0.05 * math.cos(b), y + 0.05 * math.sin(b), G), (x, y, G + 0.07), 0.006, segs=5, outline=0.002)
    ball(f'mangrove{k}', M['mangrove'], x, y, G + 0.12, rng.uniform(0.08, 0.1), outline=0.012)

# ---------- an outrigger canoe ----------
CX, CY = 0.05, -0.75
loft('canoe', M['canoe'], [[(CX - 0.15, CY, G + 0.0), (CX, CY - 0.025, G + 0.0), (CX + 0.15, CY, G + 0.0), (CX, CY + 0.025, G + 0.0)],
                           [(CX - 0.17, CY, G + 0.035), (CX, CY - 0.032, G + 0.035), (CX + 0.17, CY, G + 0.035), (CX, CY + 0.032, G + 0.035)]], outline=0.006)
rod('outrigger', M['canoe'], (CX - 0.08, CY + 0.12, G + 0.01), (CX + 0.08, CY + 0.12, G + 0.01), 0.012, segs=6, outline=0.003)
for k, dx in enumerate((-0.05, 0.05)):
    bar(f'boom{k}', M['canoe'], (CX + dx, CY, G + 0.035), (CX + dx, CY + 0.12, G + 0.015), 0.008, outline=0.002)

turn(before, -20)
render(G)

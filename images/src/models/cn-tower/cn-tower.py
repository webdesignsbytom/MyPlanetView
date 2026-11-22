# A cartoon CN Tower for the country maps, built in the set's shared look (../toon.py): the
# tall concrete shaft rising from its three flared legs, the main pod with its dark band of
# windows, the little SkyPod above, the antenna with its red light; beside it the white dome
# of the Rogers Centre, a red maple, and Lake Ontario's shore in front.
# Run: blender -b --factory-startup -P cn-tower.py -- cn-tower-1024.png 1024 cn-tower.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'concrete': toon('concrete', '#dcd8cf', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'window': flat('window', '#3f4a66'),
    'antenna': toon('antenna', '#b7bcc4', shadow_mul=(0.78, 0.78, 0.88)),
    'red': toon('red', '#e0453a'),
    'dome': toon('dome', '#f2f2ee', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'domeRib': toon('domeRib', '#c9cdd4'),
    'water': toon('water', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'maple': toon('maple', '#d8432e', shadow_mul=(0.78, 0.62, 0.62)),
    'trunk': toon('trunk', '#7a5238'),
})

G = tile()

# ---------- Lake Ontario's shore along the front ----------
EDGE, R = -0.72, 1.43
a0 = math.asin(-EDGE / R)
arc = [(R * math.cos(a), R * math.sin(a)) for a in (math.pi + a0 + (math.pi - 2 * a0) * k / 40 for k in range(41))]
bm = bmesh.new()
bm.faces.new([bm.verts.new((x, y, G + 0.003)) for x, y in arc])
finish('lake', bm, M['water'], outline=0)

# ---------- the tower ----------
TX, TY = -0.22, 0.12
POD, SKYPOD, TIP = 2.6, 3.45, 4.75
# three legs flaring out at the foot, then the hexagonal shaft
for k in range(3):
    a = math.radians(90 + 120 * k)
    foot = Vector((TX + 0.3 * math.cos(a), TY + 0.3 * math.sin(a), G))
    loft(f'leg{k}', M['concrete'],
         [[(*(foot + Vector((-math.sin(a), math.cos(a), 0)) * dx).xy, G - 0.005) for dx in (-0.05, 0.05)] +
          [(*(Vector((TX, TY, 0)) + Vector((math.cos(a), math.sin(a), 0)) * 0.08 + Vector((-math.sin(a), math.cos(a), 0)) * dx).xy, G - 0.005)
           for dx in (0.05, -0.05)],
          [(*(Vector((TX, TY, 0)) + Vector((math.cos(a), math.sin(a), 0)) * 0.09 + Vector((-math.sin(a), math.cos(a), 0)) * dx).xy,
            G + 0.9) for dx in (-0.04, 0.04)] +
          [(*(Vector((TX, TY, 0)) + Vector((math.cos(a), math.sin(a), 0)) * 0.02 + Vector((-math.sin(a), math.cos(a), 0)) * dx).xy,
            G + 0.9) for dx in (0.04, -0.04)]],
         outline=0.025)
lathe('shaft', M['concrete'], ((0.13, 0), (0.1, POD * 0.5), (0.075, POD)), G, TX, TY, segs=6, outline=0.03, smooth=False)
# the main pod, its dark band of windows, and the deck above it
lathe('pod', M['concrete'], ((0.075, 0), (0.2, 0.06), (0.24, 0.11), (0.24, 0.2), (0.2, 0.25), (0.1, 0.3), (0.06, 0.32)),
      G + POD, TX, TY, segs=32, outline=0.03)
lathe('podwindows', M['window'], ((0.243, 0), (0.243, 0.05)), G + POD + 0.13, TX, TY, segs=32, outline=0, smooth=True)
# up to the SkyPod, then the antenna with its red light
lathe('upper', M['concrete'], ((0.06, 0), (0.045, SKYPOD - POD - 0.32)), G + POD + 0.32, TX, TY, segs=12, outline=0.022)
lathe('skypod', M['concrete'], ((0.05, 0), (0.09, 0.03), (0.09, 0.08), (0.05, 0.11)), G + SKYPOD, TX, TY, segs=20, outline=0.02)
lathe('skypodwindows', M['window'], ((0.092, 0), (0.092, 0.03)), G + SKYPOD + 0.035, TX, TY, segs=20, outline=0, smooth=True)
rod('antenna', M['antenna'], (TX, TY, G + SKYPOD + 0.1), (TX, TY, G + TIP), 0.03, r2=0.012, segs=10, outline=0.016)
ball('light', M['red'], TX, TY, G + TIP, 0.03, outline=0.012)

# ---------- the Rogers Centre's white dome beside it ----------
RX, RY = 0.55, -0.12
lathe('stadium', M['dome'], ((0.42, 0), (0.42, 0.12)), G - 0.005, RX, RY, segs=36, outline=0.03)
lathe('roof', M['dome'], ((0.42, 0), (0.38, 0.08), (0.28, 0.15), (0.14, 0.19), (0.004, 0.2)), G + 0.115, RX, RY, segs=36,
      outline=0.03)
for k in range(4):
    a = math.radians(90 + 45 * k)
    rod(f'rib{k}', M['domeRib'], (RX + 0.42 * math.cos(a), RY + 0.42 * math.sin(a), G + 0.12),
        (RX - 0.42 * math.cos(a), RY - 0.42 * math.sin(a), G + 0.12), 0.006, segs=6, outline=0)

# ---------- a red maple ----------
MX, MY = -0.9, -0.3
rod('mapletrunk', M['trunk'], (MX, MY, G), (MX, MY, G + 0.2), 0.03, r2=0.022, segs=8, outline=0.016)
for k, (dx, dy, dz, r) in enumerate(((0, 0, 0.3, 0.14), (0.09, 0.03, 0.24, 0.1), (-0.08, -0.02, 0.24, 0.1))):
    ball(f'maple{k}', M['maple'], MX + dx, MY + dy, G + dz, r, outline=0.022)

render(G)

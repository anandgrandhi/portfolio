#!/usr/bin/env python3
"""Generate the landscape tablet collages used by the horizontal career journey.

Original vector compositions (no photographs, no third-party artwork) drawn in the
portfolio palette. Output: journey/career-tablets/<scene>.json (Lottie, 60 fps).

Timeline shared by every scene (frame numbers are referenced by the journey markup):
  intro   0-120   tablet settles in, tiles arrive in a short stagger
  loop  120-120   still frame, nothing moves while the visitor reads
  outro 121-150   tiles leave, then the tablet fades (short: the journey only travels once it ends)

Geometry: the 1000x1000 composition is rendered as a square above the scene title, and
only its lower ~45% is inside the camera frame. The tablet therefore sits in the bottom
band (y 635-975) so that, with the camera framing used by the journey, the whole tablet sits
between ~8% and ~50% of the viewport height at any window size.

Run: python3 tools/career_tablets.py
"""
import json
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'journey' / 'career-tablets'
FR, OP = 60, 151
INTRO_END, OUTRO_START, OUTRO_END = 120, 121, 150

PALETTE = {
    'blue': '#199aff', 'lime': '#d6fe6a', 'yellow': '#ffd100', 'pink': '#fbe3e8',
    'coral': '#fe5241', 'ink': '#2c2c2c', 'white': '#ffffff', 'mist': '#f4f4f4',
}

# Tablet outer frame and screen (composition coordinates)
TAB_X, TAB_Y, TAB_W, TAB_H = 245, 635, 510, 340
BEZEL = 14
SCR_X, SCR_Y = TAB_X + BEZEL, TAB_Y + BEZEL
SCR_W, SCR_H = TAB_W - 2 * BEZEL, TAB_H - 2 * BEZEL
PAD = 14
CX0, CY0 = SCR_X + PAD, SCR_Y + PAD          # content origin
CW, CH = SCR_W - 2 * PAD, SCR_H - 2 * PAD    # 454 x 284
GRID_W, GRID_H = 496, 312                    # tile layouts below are drawn on this grid, then scaled


def rgb(name, alpha=1):
    h = PALETTE.get(name, name).lstrip('#')
    return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)] + [alpha]


def static(v):
    return {'a': 0, 'k': v}


EASE_OUT = ({'x': [0.2], 'y': [1]}, {'x': [0.4], 'y': [0]})
EASE_IN = ({'x': [0.6], 'y': [1]}, {'x': [0.7], 'y': [0]})


def anim(frames):
    """frames: list of (t, value, easing) where easing applies to the segment starting at t."""
    keys = []
    for i, (t, v, ease) in enumerate(frames):
        v = v if isinstance(v, list) else [v]
        k = {'t': t, 's': v}
        if i < len(frames) - 1:
            ii, oo = ease or EASE_OUT
            dims = len(v)
            k['i'] = {'x': ii['x'] * dims, 'y': ii['y'] * dims}
            k['o'] = {'x': oo['x'] * dims, 'y': oo['y'] * dims}
        keys.append(k)
    return {'a': 1, 'k': keys}


def transform():
    return {'ty': 'tr', 'p': static([0, 0]), 'a': static([0, 0]), 's': static([100, 100]),
            'r': static(0), 'o': static(100), 'sk': static(0), 'sa': static(0), 'nm': 'Transform'}


def group(items, name='g'):
    return {'ty': 'gr', 'nm': name, 'it': items + [transform()]}


def fill(color, alpha=1):
    return {'ty': 'fl', 'c': static(rgb(color)), 'o': static(alpha * 100), 'r': 1, 'nm': 'Fill'}


def stroke(color, width, alpha=1):
    return {'ty': 'st', 'c': static(rgb(color)), 'o': static(alpha * 100), 'w': static(width),
            'lc': 2, 'lj': 2, 'nm': 'Stroke'}


def rect(x, y, w, h, color=None, r=10, line=None, alpha=1):
    items = [{'ty': 'rc', 'd': 1, 's': static([w, h]), 'p': static([x + w / 2, y + h / 2]), 'r': static(r), 'nm': 'Rect'}]
    if color:
        items.append(fill(color, alpha))
    if line:
        items.append(stroke(line[0], line[1]))
    return group(items, 'rect')


def ellipse(cx, cy, d, color=None, line=None, alpha=1):
    items = [{'ty': 'el', 'd': 1, 's': static([d, d]), 'p': static([cx, cy]), 'nm': 'Ellipse'}]
    if color:
        items.append(fill(color, alpha))
    if line:
        items.append(stroke(line[0], line[1]))
    return group(items, 'ellipse')


def path(points, color=None, line=None, closed=False, draw=None):
    zeros = [[0, 0] for _ in points]
    items = [{'ty': 'sh', 'ks': static({'i': zeros, 'o': zeros, 'v': [list(p) for p in points], 'c': closed}), 'nm': 'Path'}]
    if draw:  # (start_frame, end_frame): line draws itself in during the intro
        items.append({'ty': 'tm', 's': static(0), 'o': static(0), 'm': 1, 'nm': 'Trim',
                      'e': anim([(draw[0], 0, None), (draw[1], 100, None)])})
    if color:
        items.append(fill(color))
    if line:
        items.append(stroke(line[0], line[1]))
    return group(items, 'path')


def arc(cx, cy, d, color, width, start=0, end=100, draw=None, offset=0):
    """Circle outline trimmed to [start, end] percent (0 = 12 o'clock, clockwise), rotated by offset degrees."""
    items = [{'ty': 'el', 'd': 1, 's': static([d, d]), 'p': static([cx, cy]), 'nm': 'Ellipse'}]
    e = anim([(draw[0], start, None), (draw[1], end, None)]) if draw else static(end)
    items.append({'ty': 'tm', 's': static(start), 'e': e, 'o': static(offset), 'm': 1, 'nm': 'Trim'})
    items.append(stroke(color, width))
    return group(items, 'arc')


def lines(x, y, widths, color='ink', h=7, gap=13, alpha=0.85):
    return [rect(x, y + i * gap, w, h, color, r=h / 2, alpha=alpha) for i, w in enumerate(widths)]


def layer(ind, name, shapes, center, intro_at, outro_at, scale_from=86):
    """Shape layer whose anchor/position are the tile centre, so shapes use comp coordinates."""
    cx, cy = center
    ks = {
        'o': anim([(0, 0, None), (intro_at, 0, None), (intro_at + 26, 100, None),
                   (outro_at, 100, EASE_IN), (outro_at + 14, 0, None)]),
        'r': static(0),
        'p': anim([(0, [cx, cy + 18, 0], None), (intro_at, [cx, cy + 18, 0], None), (intro_at + 34, [cx, cy, 0], None),
                   (outro_at, [cx, cy, 0], EASE_IN), (outro_at + 14, [cx, cy - 10, 0], None)]),
        'a': static([cx, cy, 0]),
        's': anim([(0, [scale_from] * 2 + [100], None), (intro_at, [scale_from] * 2 + [100], None),
                   (intro_at + 34, [100, 100, 100], None)]),
    }
    return {'ddd': 0, 'ind': ind, 'ty': 4, 'nm': name, 'sr': 1, 'ks': ks, 'ao': 0, 'shapes': shapes,
            'ip': 0, 'op': OP, 'st': 0, 'bm': 0}


def tablet_layers(start_ind):
    cx, cy = TAB_X + TAB_W / 2, TAB_Y + TAB_H / 2
    frame = [
        rect(SCR_X + SCR_W / 2 - 3, TAB_Y + 6, 6, 3, 'white', r=1.5, alpha=0.5),                # camera
        rect(SCR_X, SCR_Y, SCR_W, SCR_H, 'white', r=16),                                     # screen
        rect(TAB_X, TAB_Y, TAB_W, TAB_H, 'ink', r=30),                                       # body
    ]
    shadow = [rect(TAB_X + 18, TAB_Y + TAB_H - 10, TAB_W - 36, 20, 'ink', r=10, alpha=0.08)]
    ks = {
        'o': anim([(0, 0, None), (34, 100, None), (OUTRO_END - 16, 100, EASE_IN), (OUTRO_END, 0, None)]),
        'r': static(0),
        'p': anim([(0, [cx, cy + 24, 0], None), (46, [cx, cy, 0], None)]),
        'a': static([cx, cy, 0]),
        's': anim([(0, [94, 94, 100], None), (46, [100, 100, 100], None),
                   (OUTRO_END - 16, [100, 100, 100], EASE_IN), (OUTRO_END, [97, 97, 100], None)]),
    }
    mk = lambda ind, nm, sh: {'ddd': 0, 'ind': ind, 'ty': 4, 'nm': nm, 'sr': 1, 'ks': ks, 'ao': 0,
                              'shapes': sh, 'ip': 0, 'op': OP, 'st': 0, 'bm': 0}
    return [mk(start_ind, 'Tablet', frame), mk(start_ind + 1, 'Tablet shadow', shadow)]


def tile_layers(tiles):
    """tiles: list of (name, (x, y, w, h) in content coords, shapes_fn(x, y, w, h))."""
    out = []
    n = len(tiles)
    sx, sy = CW / GRID_W, CH / GRID_H
    for i, (name, (x, y, w, h), fn) in enumerate(tiles):
        x, y, w, h = x * sx, y * sy, w * sx, h * sy
        X, Y = CX0 + x, CY0 + y
        intro_at = 30 + i * 9
        outro_at = OUTRO_START + (n - 1 - i) * 2
        out.append(layer(i + 1, name, fn(X, Y, w, h), (X + w / 2, Y + h / 2), intro_at, outro_at))
    return out


# ----- tile drawings (x, y are absolute comp coordinates of the tile's top-left) -----

def t_video(x, y, w, h):
    cx, cy = x + w / 2, y + h / 2 - 12
    tri = [(cx - 12, cy - 16), (cx + 18, cy), (cx - 12, cy + 16)]
    return [path(tri, 'blue', closed=True), ellipse(cx, cy, 64, 'white'),
            *lines(x + 18, y + h - 34, [w * 0.55, w * 0.32], 'white', alpha=0.9),
            rect(x, y, w, h, 'blue', r=14)]


def t_quiz(x, y, w, h):
    rows = []
    for i in range(3):
        ry = y + 16 + i * 20
        rows += [ellipse(x + 22, ry + 4, 11, 'ink' if i != 1 else 'white', line=('ink', 2)),
                 rect(x + 36, ry, w * (0.62 if i != 1 else 0.48), 8, 'ink', r=4, alpha=0.8)]
    return rows + [rect(x, y, w, h, 'lime', r=14)]


def t_progress(x, y, w, h):
    cx, cy = x + 46, y + h / 2
    return [arc(cx, cy, 46, 'ink', 7, 0, 72, draw=(58, 100)), ellipse(cx, cy, 46, line=('white', 7)),
            *lines(x + 86, y + 24, [w * 0.4, w * 0.28], 'ink'),
            rect(x, y, w, h, 'yellow', r=14)]


def t_molecule(x, y, w, h):
    pts = [(x + w * 0.3, y + h * 0.36), (x + w * 0.66, y + h * 0.28), (x + w * 0.52, y + h * 0.7), (x + w * 0.22, y + h * 0.74)]
    bonds = [path([pts[0], pts[1]], line=('ink', 3)), path([pts[0], pts[2]], line=('ink', 3)),
             path([pts[2], pts[3]], line=('ink', 3))]
    atoms = [ellipse(*pts[0], 24, 'coral'), ellipse(*pts[1], 18, 'blue'), ellipse(*pts[2], 22, 'ink'), ellipse(*pts[3], 15, 'yellow')]
    return atoms + bonds + [rect(x, y, w, h, 'pink', r=14)]


def t_growth(x, y, w, h):
    bars, n = [], 5
    bw = (w - 36) / n - 8
    for i in range(n):
        bh = (h - 44) * (0.25 + 0.75 * (i + 1) / n)
        bars.append(rect(x + 18 + i * (bw + 8), y + h - 18 - bh, bw, bh, 'white', r=4, alpha=0.95))
    return bars + [rect(x, y, w, h, 'coral', r=14)]


def t_globe(x, y, w, h):
    cx, cy, d = x + w / 2, y + h / 2, min(w, h) - 30
    return [ellipse(cx, cy, d, line=('ink', 2.5)), path([(cx - d / 2, cy), (cx + d / 2, cy)], line=('ink', 2)),
            {'ty': 'gr', 'nm': 'meridian', 'it': [{'ty': 'el', 'd': 1, 's': static([d * 0.45, d]), 'p': static([cx, cy])},
                                                stroke('ink', 2), transform()]},
            ellipse(cx + d * 0.28, cy - d * 0.2, 12, 'blue'), ellipse(cx - d * 0.3, cy + d * 0.18, 10, 'coral'),
            rect(x, y, w, h, 'mist', r=14)]


def t_catalogue(x, y, w, h):
    cells, cols = [], ['blue', 'yellow', 'lime', 'pink']
    cw, chh = (w - 42) / 2, (h - 42) / 2
    for i, c in enumerate(cols):
        cx, cy = x + 14 + (i % 2) * (cw + 14), y + 14 + (i // 2) * (chh + 14)
        cells += [rect(cx + 10, cy + chh - 18, cw * 0.55, 7, 'ink', r=3.5, alpha=0.75), rect(cx, cy, cw, chh, c, r=10)]
    return cells + [rect(x, y, w, h, 'mist', r=14)]


def t_engagement(x, y, w, h):
    pts = [(x + 20, y + h - 30), (x + w * 0.3, y + h - 52), (x + w * 0.48, y + h - 46), (x + w * 0.66, y + h - 86), (x + w - 20, y + 34)]
    return [ellipse(*pts[-1], 14, 'lime'), path(pts, line=('white', 5), draw=(70, 112)),
            path([(x + 20, y + h - 18), (x + w - 20, y + h - 18)], line=('white', 2)),
            rect(x, y, w, h, 'blue', r=14)]


def t_profile(x, y, w, h):
    cx = x + w / 2
    return [ellipse(cx, y + 50, 46, 'ink'), ellipse(cx, y + 40, 18, 'lime'),
            *lines(x + 24, y + 92, [w - 48, (w - 48) * 0.7, (w - 48) * 0.45], 'ink'),
            rect(x, y, w, h, 'lime', r=14)]


def t_support(x, y, w, h):
    return [rect(x + 16, y + 18, w * 0.62, 30, 'white', r=12), rect(x + w * 0.3, y + 58, w * 0.56, 30, 'coral', r=12),
            rect(x + 16, y + 98, w * 0.48, 30, 'white', r=12), rect(x, y, w, h, 'pink', r=14)]


def t_checklist(x, y, w, h):
    rows = []
    for i in range(4):
        ry = y + 22 + i * 28
        rows += [path([(x + 18, ry + 4), (x + 24, ry + 10), (x + 34, ry - 2)], line=('ink', 3)),
                 rect(x + 44, ry, w * (0.55 - 0.08 * (i % 2)), 8, 'ink', r=4, alpha=0.8)]
    return rows + [rect(x, y, w, h, 'yellow', r=14)]


def t_kanban(x, y, w, h):
    out, cw = [], (w - 56) / 3
    colours = [['pink', 'pink', 'lime'], ['yellow', 'lime'], ['blue', 'yellow', 'pink']]
    for c, stack in enumerate(colours):
        cx = x + 14 + c * (cw + 14)
        out.append(rect(cx, y + 14, cw * 0.6, 7, 'ink', r=3.5, alpha=0.7))
        for r_, col in enumerate(stack):
            out.append(rect(cx, y + 32 + r_ * 46, cw, 38, col, r=8))
    return out + [rect(x, y, w, h, 'mist', r=14)]


def t_clients(x, y, w, h):
    out = []
    for i, c in enumerate(['white', 'yellow', 'white', 'pink']):
        out.append(ellipse(x + 30 + i * (w - 60) / 3, y + h / 2 - 8, 30, c))
    return out + lines(x + 18, y + h - 22, [w * 0.5], 'white', alpha=0.9) + [rect(x, y, w, h, 'coral', r=14)]


def t_margin(x, y, w, h):
    pts = [(x + 16, y + h - 20), (x + w * 0.35, y + h - 34), (x + w * 0.6, y + h - 30), (x + w - 18, y + 22)]
    return [path(pts, line=('lime', 5), draw=(80, 118)), ellipse(*pts[-1], 12, 'lime'), rect(x, y, w, h, 'ink', r=14)]


def t_timeline(x, y, w, h):
    bars = [(0.06, 0.38), (0.24, 0.62), (0.5, 0.92)]
    out = []
    for i, (a, b) in enumerate(bars):
        out.append(rect(x + 14 + (w - 28) * a, y + 22 + i * 26, (w - 28) * (b - a), 16, 'ink', r=8, alpha=0.85))
    return out + [rect(x, y, w, h, 'yellow', r=14)]


def star(cx, cy, r, color):
    k = r * 0.28
    pts = [(cx, cy - r), (cx + k, cy - k), (cx + r, cy), (cx + k, cy + k), (cx, cy + r), (cx - k, cy + k), (cx - r, cy), (cx - k, cy - k)]
    return path(pts, color, closed=True)


def t_automation(x, y, w, h):
    return [star(x + 52, y + h / 2, 30, 'white'), star(x + 88, y + 30, 12, 'lime'),
            *lines(x + 112, y + 32, [w - 140, (w - 140) * 0.7, (w - 140) * 0.85], 'white', h=8, gap=18, alpha=0.95),
            rect(x, y, w, h, 'blue', r=14)]


def t_assistant(x, y, w, h):
    return [rect(x + 14, y + h - 46, w - 28, 32, 'white', r=16, line=('ink', 2)), ellipse(x + w - 32, y + h - 30, 18, 'blue'),
            rect(x + w * 0.38, y + 18, w * 0.56, 40, 'pink', r=14),
            rect(x + 14, y + 70, w * 0.7, 64, 'blue', r=14), star(x + 34, y + 92, 10, 'white'),
            *lines(x + 54, y + 86, [w * 0.44, w * 0.32], 'white', h=7, gap=16, alpha=0.95),
            rect(x + w * 0.46, y + 148, w * 0.48, 40, 'pink', r=14),
            rect(x + 14, y + 200, w * 0.58, 40, 'blue', r=14, alpha=0.9),
            rect(x, y, w, h, 'mist', r=14)]


def t_docs(x, y, w, h):
    out = []
    for i in range(3):
        out.append(rect(x + 20 + i * 16, y + 14 + i * 8, 64, 66, 'white' if i < 2 else 'white', r=6, line=('ink', 1.5)))
    out.reverse()
    return out + lines(x + 112, y + 26, [w - 134, (w - 134) * 0.6], 'ink') + [rect(x, y, w, h, 'lime', r=14)]


def t_gauge(x, y, w, h):
    d = min(w - 48, 2 * (h - 34))
    cx, cy = x + w / 2, y + h - 16
    return [path([(cx, cy), (cx + d * 0.26, cy - d * 0.3)], line=('ink', 4)), ellipse(cx, cy, 12, 'ink'),
            arc(cx, cy, d, 'ink', 8, 0, 36, draw=(96, 120), offset=-90), arc(cx, cy, d, 'white', 8, 0, 50, offset=-90),
            rect(x, y, w, h, 'yellow', r=14)]


def t_funnel(x, y, w, h):
    out = []
    for i, f in enumerate([1, 0.72, 0.46]):
        bw = (w - 40) * f
        out.append(rect(x + (w - bw) / 2, y + 18 + i * 22, bw, 14, 'white', r=7, alpha=0.95))
    return out + [rect(x, y, w, h, 'coral', r=14)]


SCENES = {
    'byjus': ('BYJU’S: learning products at scale', [
        ('Lesson video', (0, 0, 300, 176), t_video),
        ('Quiz', (312, 0, 184, 82), t_quiz),
        ('Progress', (312, 94, 184, 82), t_progress),
        ('STEM', (0, 188, 146, 124), t_molecule),
        ('Growth', (158, 188, 142, 124), t_growth),
        ('Global', (312, 188, 184, 124), t_globe),
    ]),
    'amazon': ('Amazon Academy: engagement and operations', [
        ('Catalogue', (0, 0, 232, 150), t_catalogue),
        ('Engagement', (244, 0, 252, 150), t_engagement),
        ('Personalisation', (0, 162, 150, 150), t_profile),
        ('Support', (162, 162, 170, 150), t_support),
        ('Operations', (344, 162, 152, 150), t_checklist),
    ]),
    'archmation': ('ARCHMATION: clients, delivery and margins', [
        ('Delivery board', (0, 0, 320, 190), t_kanban),
        ('Clients', (332, 0, 164, 90), t_clients),
        ('Margins', (332, 102, 164, 88), t_margin),
        ('Timeline', (0, 202, 236, 110), t_timeline),
        ('Automation', (248, 202, 248, 110), t_automation),
    ]),
    'applied-ai': ('Applied AI: knowledge, productivity and decisions', [
        ('Assistant', (0, 0, 300, 312), t_assistant),
        ('Knowledge', (312, 0, 184, 96), t_docs),
        ('Decision support', (312, 108, 184, 96), t_gauge),
        ('Acquisition', (312, 216, 184, 96), t_funnel),
    ]),
}


def build(name, title, tiles):
    tl = tile_layers(tiles)
    layers = tl + tablet_layers(len(tl) + 1)
    return {'v': '5.7.4', 'fr': FR, 'ip': 0, 'op': OP, 'w': 1000, 'h': 1000, 'nm': title, 'ddd': 0,
            'assets': [], 'layers': layers, 'markers': []}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (title, tiles) in SCENES.items():
        data = build(name, title, tiles)
        (OUT / f'{name}.json').write_text(json.dumps(data, separators=(',', ':'), ensure_ascii=False))
        print('wrote', OUT / f'{name}.json')


if __name__ == '__main__':
    main()

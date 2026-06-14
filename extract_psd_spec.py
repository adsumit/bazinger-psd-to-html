#!/usr/bin/env python3
"""
extract_psd_spec.py  —  Dump EVERY layer's full properties from a PSD to JSON.

No human curation: it records geometry, opacity, blend mode, text typography,
fill colour, and every layer effect for every layer. The output (psd-spec.json)
is the machine-readable source of truth the style-audit harness diffs against.

Usage:
    pip install psd-tools pillow --break-system-packages
    python extract_psd_spec.py bazinger_UPDATED.psd psd-spec.json
"""
import sys, json, statistics
from psd_tools import PSDImage

# --- The PSD renders at 0.9489x its stored values (the doc is a 0.9489 scale of a
# 1480px master). We output RENDERED psd px (the 1404 canvas, matching the PNG):
# geometry is already psd px; stored FontSize is the PRE-scale master size, so it
# is multiplied by SCALE to get the rendered px.
SCALE = 0.9489                           # stored/master px -> rendered psd px

def _default(o):
    """Coerce psd-tools Integer/Decimal wrappers to native JSON numbers."""
    try:
        f = float(o)
        return int(f) if f.is_integer() else round(f, 4)
    except Exception:
        return str(o)

BLEND = {b'Nrml': 'normal', b'Mltp': 'multiply', b'Scrn': 'screen',
         b'Ovrl': 'overlay', b'Drkn': 'darken', b'Lghn': 'lighten',
         b'Dslv': 'dissolve', b'HrdL': 'hard-light', b'SftL': 'soft-light'}

def hexcolor(d):
    """Photoshop colour dict {b'Rd  ':.., b'Grn ':.., b'Bl  ':..} -> #RRGGBB."""
    try:
        r = round(float(d[b'Rd  ']))
        g = round(float(d[b'Grn ']))
        b = round(float(d[b'Bl  ']))
        return f"#{r:02X}{g:02X}{b:02X}"
    except Exception:
        return None

def text_info(layer):
    try:
        raw = layer.text
    except Exception:
        return None
    info = {"content": raw, "has_linebreak": ('\r' in raw or '\n' in raw)}
    runs, seen = [], set()
    try:
        fonts = [f['Name'] for f in layer.resource_dict['FontSet']]
        for run in layer.engine_dict['StyleRun']['RunArray']:
            sd = run['StyleSheet']['StyleSheetData']
            fi = sd.get('Font', 0)
            font = str(fonts[fi]) if fi < len(fonts) else f"idx{fi}"
            size = sd.get('FontSize')
            size_px = round(float(size) * SCALE, 1) if size is not None else None
            color = hexcolor(sd['FillColor']['Values']) if 'FillColor' in sd and isinstance(sd['FillColor'].get('Values'), dict) else None
            # FillColor.Values is actually a list [a,r,g,b] of 0..1 floats here:
            if color is None and 'FillColor' in sd:
                try:
                    v = sd['FillColor']['Values']; r,g,b = [round(v[i]*255) for i in (1,2,3)]
                    color = f"#{r:02X}{g:02X}{b:02X}"
                except Exception:
                    color = None
            trk = sd.get('Tracking', 0)
            ls = round(size_px * trk / 1000, 2) if size_px else 0
            key = (font, size_px, color, trk)
            if key not in seen:
                seen.add(key)
                runs.append({"font": font, "size_px": size_px, "color": color,
                             "tracking": trk, "letter_spacing_px": ls})
    except Exception as e:
        runs.append({"error": str(e)[:60]})
    info["runs"] = runs
    return info

def effects_info(layer):
    out = []
    try:
        if not layer.effects.enabled:
            return out
    except Exception:
        return out
    for e in layer.effects:
        d = {"type": e.__class__.__name__}
        for a in ('opacity', 'angle', 'distance', 'size', 'choke', 'spread', 'noise'):
            if hasattr(e, a):
                try: d[a] = getattr(e, a)
                except Exception: pass
        if hasattr(e, 'blend_mode'):
            bm = getattr(e, 'blend_mode')
            d['blend'] = BLEND.get(bm, str(bm))
        if hasattr(e, 'color'):
            try: d['color'] = hexcolor(getattr(e, 'color'))
            except Exception: pass
        out.append(d)
    return out

def fill_color(layer):
    """Own fill colour via single-layer composite (handles semi-transparent)."""
    try:
        b = layer.bbox
        if (b[2]-b[0]) * (b[3]-b[1]) > 500_000:   # skip huge layers (slow)
            return None
        img = layer.composite().convert('RGBA')
        op = [(r, g, bl) for x in range(img.width) for y in range(img.height)
              for (r, g, bl, a) in [img.getpixel((x, y))] if a > 25]
        if not op:
            return None
        r = int(statistics.median([c[0] for c in op]))
        g = int(statistics.median([c[1] for c in op]))
        bl = int(statistics.median([c[2] for c in op]))
        return f"#{r:02X}{g:02X}{bl:02X}"
    except Exception:
        return None

def walk(layer, path, out):
    p = (path + " / " + str(layer.name)) if path else str(layer.name)
    try:
        b = list(layer.bbox)
    except Exception:
        b = None
    rec = {
        "path": p,
        "name": str(layer.name),
        "kind": layer.kind,
        "visible": bool(layer.visible),
        "opacity": getattr(layer, "opacity", None),
        "opacity_pct": round(getattr(layer, "opacity", 255) / 255 * 100) if getattr(layer, "opacity", None) is not None else None,
        "blend_mode": str(getattr(layer, "blend_mode", "")).replace("BlendMode.", "").lower(),
        "bbox_psd": b,
        "size_psd": [b[2]-b[0], b[3]-b[1]] if b else None,
    }
    if layer.kind == 'type':
        rec["text"] = text_info(layer)
    elif layer.kind in ('shape', 'pixel', 'smartobject'):
        rec["fill"] = fill_color(layer)
    fx = effects_info(layer)
    if fx:
        rec["effects"] = fx
    out.append(rec)
    if layer.is_group():
        for c in layer:
            walk(c, p, out)

def main():
    src = sys.argv[1] if len(sys.argv) > 1 else "bazinger_UPDATED.psd"
    dst = sys.argv[2] if len(sys.argv) > 2 else "psd-spec.json"
    psd = PSDImage.open(src)
    layers = []
    for l in psd:
        walk(l, "", layers)
    doc = {
        "meta": {
            "source": src,
            "canvas_psd": [psd.width, psd.height],
            "note": "All values are RENDERED psd px (the 1404-wide canvas, matching the PNG). Geometry is raw psd-space; FontSize is multiplied by the 0.9489 doc scale to give rendered px. Container content width ~1110 psd px.",
            "layer_count": len(layers),
        },
        "layers": layers,
    }
    with open(dst, "w") as f:
        json.dump(doc, f, indent=2, default=_default)
    print(f"Wrote {dst}: {len(layers)} layers from {psd.width}x{psd.height} PSD.")

if __name__ == "__main__":
    main()

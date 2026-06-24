/* ============================================================================
   nav-scroll.js — navbar smooth scroll-to-section + active-link highlighting.

   Two behaviours, one rule for every link:
   1. CLICK a link  -> smooth-scroll to its section (leaving the fixed navbar room)
                       and mark that link active (the others go inactive), and put
                       #section in the URL.
   2. SCROLL the page -> the active link auto-follows whichever section you're
                       looking at (scroll-spy).

   Why animate the scroll ourselves instead of CSS `scroll-behavior: smooth`?
   Because the native version uses the browser's own (ease-in-out) curve, which we
   can't change — and we want the SAME easing the rest of the site uses: CSS
   `ease` = cubic-bezier(0.25, 0.1, 0.25, 1). So we run the animation by hand.
   ========================================================================== */
(function () {
    const NAV_OFFSET = 110;   // px kept clear above a section top = 94px fixed navbar + breathing room
    const DURATION = 600;     // scroll animation length (ms) — matches the sliders' 0.6s transition

    // Only links that point at a "#section" (skip anything else).
    const links = Array.prototype.slice.call(
        document.querySelectorAll('.header .menu li a[href^="#"]')
    );
    if (!links.length) return;

    // Pair each link with its target section; drop any whose target id is missing.
    const items = links
        .map(function (link) {
            return { link: link, section: document.getElementById(link.getAttribute('href').slice(1)) };
        })
        .filter(function (it) { return it.section; });
    if (!items.length) return;

    // --- CSS `ease` as a JS timing function -------------------------------------
    // A cubic-bezier timing curve maps elapsed-time x (0..1) to output-progress y
    // (0..1) through control points (p1x,p1y) & (p2x,p2y). To read y for a given x
    // we first invert x(u) for the bezier parameter u (a few Newton steps), then
    // evaluate y(u). This is exactly how the browser computes a CSS `ease` step.
    function bezierEasing(p1x, p1y, p2x, p2y) {
        const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
        const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
        const sampleX = function (u) { return ((ax * u + bx) * u + cx) * u; };
        const sampleY = function (u) { return ((ay * u + by) * u + cy) * u; };
        const slopeX = function (u) { return (3 * ax * u + 2 * bx) * u + cx; };
        return function (x) {
            let u = x;
            for (let i = 0; i < 8; i++) {
                const err = sampleX(u) - x;
                if (Math.abs(err) < 1e-4) break;
                const d = slopeX(u);
                if (Math.abs(d) < 1e-6) break;
                u -= err / d;
            }
            return sampleY(u);
        };
    }
    const ease = bezierEasing(0.25, 0.1, 0.25, 1);   // === CSS `ease`

    // Absolute distance of an element from the very top of the document.
    function absTop(el) { return el.getBoundingClientRect().top + window.pageYOffset; }

    function setActive(link) {
        for (let i = 0; i < items.length; i++) {
            items[i].link.classList.toggle('active', items[i].link === link);
        }
    }

    // --- The custom smooth scroll -----------------------------------------------
    let animating = false;   // true while WE drive the scroll, so scroll-spy stands down
    function scrollToY(targetY) {
        const startY = window.pageYOffset;
        const dist = targetY - startY;
        if (Math.abs(dist) < 1) return;
        const t0 = performance.now();
        animating = true;
        requestAnimationFrame(function frame(now) {
            const p = Math.min(1, (now - t0) / DURATION);
            window.scrollTo(0, Math.round(startY + dist * ease(p)));
            if (p < 1) requestAnimationFrame(frame);
            else animating = false;
        });
    }

    // --- 1) Click -> scroll + activate + reflect in the URL ---------------------
    items.forEach(function (it) {
        it.link.addEventListener('click', function (e) {
            e.preventDefault();
            setActive(it.link);                       // light it up immediately
            scrollToY(Math.max(0, absTop(it.section) - NAV_OFFSET));
            // show #section in the address bar without a jump or history clutter
            history.replaceState(null, '', it.link.getAttribute('href'));
        });
    });

    // --- 2) Scroll-spy -> keep the active link in sync as you scroll ------------
    const MIN_SPAN = 80;   // smallest active scroll-span we let any section keep near the page end

    function spy() {
        if (animating) return;        // don't fight a click's animation
        const scroll = window.pageYOffset;
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

        // Each section's natural "activation" scroll = where its top reaches the
        // navbar seam (scroll = top - NAV_OFFSET).
        const act = items.map(function (it) { return absTop(it.section) - NAV_OFFSET; });

        // The page can't scroll far enough to give the LAST section(s) their seam
        // turn — their top only reaches the seam at (or past) the very last pixel of
        // scroll, so by the raw seam rule they'd flash active for ~1px and flip away
        // the instant you scroll up from the bottom (the bug). Walk back from the end
        // and pull each over-squeezed activation earlier so every trailing section
        // keeps at least MIN_SPAN px of active range, sharing the final stretch of
        // scroll. The moment a section already has room we stop — so the well-spaced
        // sections above stay exactly on the seam (scrolling DOWN feels unchanged).
        let cap = maxScroll;
        for (let i = items.length - 1; i >= 0; i--) {
            const limit = cap - MIN_SPAN;
            if (act[i] > limit) { act[i] = limit; cap = act[i]; }
            else break;
        }

        let current = items[0];
        for (let i = 0; i < items.length; i++) {
            if (scroll + 1 >= act[i]) current = items[i];
        }
        setActive(current.link);
    }

    // rAF-throttle the scroll handler so it stays cheap.
    let ticking = false;
    window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () { spy(); ticking = false; });
    }, { passive: true });

    spy();   // set the correct link on first paint
})();

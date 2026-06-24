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

    // Index of the link active right now. The scroll-spy nudges it up/down as you
    // scroll; a click sets it outright. It's kept as STATE (not recomputed from
    // scratch each tick) so the up/down hysteresis in spy() can remember the current
    // section and release it only at the right moment.
    let cur = 0;

    // --- 1) Click -> scroll + activate + reflect in the URL ---------------------
    items.forEach(function (it, idx) {
        it.link.addEventListener('click', function (e) {
            e.preventDefault();
            cur = idx;                                // keep the spy's state in sync
            setActive(it.link);                       // light it up immediately
            scrollToY(Math.max(0, absTop(it.section) - NAV_OFFSET));
            // show #section in the address bar without a jump or history clutter
            history.replaceState(null, '', it.link.getAttribute('href'));
        });
    });

    // --- 2) Scroll-spy -> keep the active link in sync as you scroll ------------
    function spy() {
        if (animating) return;        // don't fight a click's animation
        const scroll = window.pageYOffset;
        const innerH = window.innerHeight;
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - innerH);
        const seam = scroll + NAV_OFFSET;        // ADVANCE line — just under the navbar
        const mid = scroll + innerH * 0.5;       // RETREAT line — the viewport middle

        // Directional hysteresis. A plain "section whose top is under the navbar"
        // rule reads right going DOWN (a section lights up as it fills the screen)
        // but wrong going UP: it drops the current section the instant its top slips
        // back under the navbar — while that section STILL fills the screen — so the
        // active flips to the previous, still-hidden section far too early (the bug).
        //
        // So the active only moves in the direction you're scrolling, with two
        // different trigger lines:
        //   ADVANCE (down): step to the next section once its TOP reaches the navbar
        //     seam — it has just filled the area below the navbar. (Scroll-DOWN feel
        //     is exactly as before.)
        //   RETREAT (up): step back only once the CURRENT section's TOP has fallen
        //     past the viewport middle — i.e. the previous section now fills the upper
        //     half of the screen. So the active stays "sticky" while you scroll up
        //     through a section instead of releasing it the moment its top dips below
        //     the navbar.
        // ADVANCE's line sits above RETREAT's, so the two can never fire on the same
        // tick — no flip-flop.
        while (cur < items.length - 1 && absTop(items[cur + 1].section) <= seam) cur++;
        while (cur > 0 && absTop(items[cur].section) > mid) cur--;

        // The last section's top can't reach the seam (the page ends first), so
        // ADVANCE can't land on it going down — force it once you're at the bottom.
        if (scroll >= maxScroll - 1) cur = items.length - 1;

        setActive(items[cur].link);
    }

    // --- 3) Translucent navbar -> more opaque once you scroll off the top ---------
    // At the very top the fixed navbar is barely-there (30% black) so it rests lightly
    // over the banner; once you've scrolled past the first 100px we deepen it to 85%
    // so the links stay readable over the page content. The CSS rule .header.scrolled
    // holds the actual colour (and fades it); here we just flip the class at 100px.
    const header = document.querySelector('.header');
    const SOLID_AFTER = 100;   // px of scroll before the navbar turns opaque
    function updateNavbar() {
        if (header) header.classList.toggle('scrolled', window.pageYOffset > SOLID_AFTER);
    }

    // rAF-throttle the scroll handler so it stays cheap (it drives both the active
    // link and the navbar background).
    let ticking = false;
    window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () { spy(); updateNavbar(); ticking = false; });
    }, { passive: true });

    spy();           // set the correct link on first paint
    updateNavbar();  // set the navbar background for the initial scroll position
})();

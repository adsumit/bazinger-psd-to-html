/* ============================================================================
   slider.js — one tiny, dependency-free slider, reused for BOTH the banner and
   the testimonials.

   It's a "track" slider: all slides sit side-by-side in a flex row (the track),
   and we slide left/right by translating that track on the X axis. The CSS gives
   the track a `transition: transform … ease`, so each move eases smoothly — that
   easing is what makes it feel like a slide rather than a jump.

   Why one function for two different sections? The banner and testimonials have
   different class names and the testimonial has no arrows. So instead of hard-
   coding selectors, initSlider() takes an `opts` object telling it which track,
   dots, and (optional) arrow elements to use. Same logic, two configurations.
   ========================================================================== */

function initSlider(root, opts) {
    if (!root) return;                       // section not on this page → skip

    const track = root.querySelector(opts.track);
    if (!track) return;

    // The slides are simply the track's direct children. Reading them from the
    // DOM (instead of a count) means markup and JS can't drift out of sync.
    const slides = track.children;
    if (slides.length <= 1) return;          // nothing to slide between

    // Existing nav elements in the markup. dots are required-ish; arrows optional
    // (the testimonial has dots only). querySelectorAll returns an empty list if
    // the selector is absent, so the loops below just no-op.
    const dots = opts.dots ? root.querySelectorAll(opts.dots) : [];
    const prevBtn = opts.prev ? root.querySelector(opts.prev) : null;
    const nextBtn = opts.next ? root.querySelector(opts.next) : null;

    let index = 0;                           // which slide is currently showing

    // Move to slide n. The modulo wrap (`(n + len) % len`) lets prev/next loop
    // endlessly: going past the last slide returns to the first, and vice-versa.
    function go(n) {
        index = (n + slides.length) % slides.length;
        // Each slide is exactly 100% of the track's width, so shifting the track
        // by -100% per index lands the chosen slide in the window. The CSS
        // transition on the track animates this shift (the "ease").
        track.style.transform = 'translateX(-' + index * 100 + '%)';
        // Light up the matching dot, dim the rest.
        for (let i = 0; i < dots.length; i++) {
            dots[i].classList.toggle('active', i === index);
        }
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { go(index - 1); restart(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { go(index + 1); restart(); });

    // Click a dot to jump straight to that slide. The IIFE captures `i` per dot
    // (a classic closure-in-a-loop guard).
    for (let i = 0; i < dots.length; i++) {
        (function (i) {
            dots[i].addEventListener('click', function () { go(i); restart(); });
        })(i);
    }

    // Guard against rapid-click text selection. A fast double/triple-click makes the
    // browser run its word/line text-select; because the arrows hold no text of their
    // own, that select spills into the nearest heading ("summarise the features").
    // Cancelling the default on mousedown suppresses the selection while leaving the
    // click — and therefore the slide change — completely untouched.
    function noTextSelect(el) {
        if (el) el.addEventListener('mousedown', function (e) { e.preventDefault(); });
    }
    noTextSelect(prevBtn);
    noTextSelect(nextBtn);
    for (let i = 0; i < dots.length; i++) noTextSelect(dots[i]);

    // Autoplay — only if opts.autoplay (ms) was given. We keep the timer in one
    // place so manual nav can reset it (restart), giving the reader a full beat
    // on the slide they just chose instead of an immediate auto-advance.
    let timer = null;
    function restart() {
        if (!opts.autoplay) return;
        clearInterval(timer);
        timer = setInterval(function () { go(index + 1); }, opts.autoplay);
    }

    // Pause while the pointer is over the section, so a reader isn't yanked to
    // the next slide mid-sentence; resume on leave.
    root.addEventListener('mouseenter', function () { clearInterval(timer); });
    root.addEventListener('mouseleave', restart);

    go(0);        // paint the initial slide + dot
    restart();    // start autoplay if enabled
}

// --- Wire up the two sliders on this page -----------------------------------

// Banner: text slides (h1 + paragraph), round dots, and prev/next chevrons.
initSlider(document.querySelector('.banner'), {
    track: '.banner-track',
    dots: '.slider-dots .dot',
    prev: '.slider-arrow.prev',
    next: '.slider-arrow.next',
    autoplay: 6000,
});

// Testimonials: whole cards slide, driven by the 3 bar-dots; no arrows.
initSlider(document.querySelector('.testimonial'), {
    track: '.t-track',
    dots: '.indicator .indi',
    autoplay: 7000,
});

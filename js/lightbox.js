/* ============================================================================
   lightbox.js — a tiny gallery lightbox for the screenshot grid.

   Clicking any gallery thumbnail (the plus-icon overlay) opens a full-screen
   overlay showing that image larger, with a zoom-in + fade. You can then step
   through ALL four images with the on-screen arrows or the keyboard, and close
   with the ×, the Esc key, or by clicking the dark backdrop.

   The overlay markup is built here in JS (rather than sitting in index.html)
   so the page's HTML stays about content, not chrome. The zoom/fade itself is
   pure CSS — we only toggle an `.open` class and let the transitions animate.
   ========================================================================== */

(function () {
    // Every clickable thumbnail. (The whole .photo-box is the click target; the
    // plus overlay is just its hover cue.)
    const boxes = Array.from(
        document.querySelectorAll('.gallery .gallery-box .photo-box')
    );
    if (!boxes.length) return;

    // Collect each thumbnail's image source once, in document order, so the
    // lightbox can cycle through them.
    const sources = boxes.map(function (box) {
        const img = box.querySelector('img');
        return img ? img.getAttribute('src') : '';
    });

    // --- Build the overlay once and append it to <body> ---------------------
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML =
        '<button class="lb-close" aria-label="Close">&times;</button>' +
        '<button class="lb-prev" aria-label="Previous image">&#8249;</button>' +
        '<img class="lb-img" alt="Gallery image">' +
        '<button class="lb-next" aria-label="Next image">&#8250;</button>';
    document.body.appendChild(lb);

    const imgEl = lb.querySelector('.lb-img');
    let index = 0;

    // Show image n (with wrap-around so prev/next loop like the sliders do).
    function show(n) {
        index = (n + sources.length) % sources.length;
        imgEl.src = sources[index];
    }

    function open(n) {
        show(n);
        lb.classList.add('open');           // CSS fades the backdrop + zooms the image in
        document.body.style.overflow = 'hidden';   // freeze page scroll behind the overlay
    }

    function close() {
        lb.classList.remove('open');        // CSS fades out + zooms the image back down
        document.body.style.overflow = '';
    }

    // Open on thumbnail click, starting at that thumbnail's index.
    boxes.forEach(function (box, i) {
        box.addEventListener('click', function () { open(i); });
    });

    // Arrows: stopPropagation so the click doesn't bubble to the backdrop-close.
    lb.querySelector('.lb-prev').addEventListener('click', function (e) {
        e.stopPropagation();
        show(index - 1);
    });
    lb.querySelector('.lb-next').addEventListener('click', function (e) {
        e.stopPropagation();
        show(index + 1);
    });
    lb.querySelector('.lb-close').addEventListener('click', close);

    // Clicking the dark backdrop (but not the image or a button) closes it.
    lb.addEventListener('click', function (e) {
        if (e.target === lb) close();
    });

    // Keyboard: Esc closes, ←/→ step through — but only while the lightbox is open.
    document.addEventListener('keydown', function (e) {
        if (!lb.classList.contains('open')) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowLeft') show(index - 1);
        else if (e.key === 'ArrowRight') show(index + 1);
    });
})();

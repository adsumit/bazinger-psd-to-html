/* ============================================================================
   nav.js — mobile hamburger toggle for the fixed navbar.

   At desktop the whole menu is visible and this script does nothing useful (the
   button is display:none). Below 900px the CSS hides the 8-link menu and shows a
   hamburger button instead; this file is what makes that button DO something:
   tapping it slides the menu open/closed by toggling a single `.open` class that
   the CSS animates. Keeping the behaviour to one class-toggle (rather than
   inline styles) means the look stays entirely in style.css — JS only flips state.
   ========================================================================== */
(function () {
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.header .menu');
    if (!toggle || !menu) return;            // navbar not on this page → no-op

    function setOpen(open) {
        // One source of truth: the menu's .open class drives the CSS slide-down,
        // the button's .is-open class morphs the bars into an ✕, and aria-expanded
        // keeps screen readers in sync with what's visually happening.
        menu.classList.toggle('open', open);
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    // Toggle on hamburger tap.
    toggle.addEventListener('click', function () {
        setOpen(!menu.classList.contains('open'));
    });

    // Close after a link is chosen, so the dropdown doesn't stay covering the page
    // once you've "navigated" (these are # links, but it's the correct UX habit).
    menu.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { setOpen(false); });
    });
})();

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Scan the markup so Tailwind only emits the utility classes actually used.
  content: ["./index.html"],

  // PREFLIGHT OFF (deliberate). Tailwind's reset would force `box-sizing:border-box`
  // on everything and add img/`display:block`+max-width defaults. This build's column
  // math is CONTENT-BOX (e.g. .feat-box width:205px + padding:0 48px → 4×205+6×48=1108),
  // so border-box would silently break every fixed-width row and the 1280 audit. We
  // supply the build's own minimal reset in input.css's @layer base instead.
  corePlugins: { preflight: false },

  theme: {
    extend: {
      // Map utilities onto the EXISTING @font-face families (defined in input.css).
      // font-family is not audited (verified by eye vs the PNG); these just pick the
      // correct .ttf. Pair each with a weight utility (font-light/normal/bold/black)
      // so the COMPUTED weight matches the PSD and the right file loads (no faux bold).
      fontFamily: {
        "lato-light": ["Lato-Light"],
        lato: ["Lato-Regular"],
        "lato-bold": ["Lato-Bold"],
        "lato-black": ["Lato-Black"],
        droid: ["DroidSans"],
        "droid-bold": ["DroidSansBold"],
      },
      // The PSD palette as named tokens (single source of truth). One-off hover/shadow
      // colours are written as arbitrary values (text-[#xxxxxx]) at the call site.
      colors: {
        ink: "#414042", // primary dark text + dark base
        sky: "#4bcaff", // brand blue
        body: "#838383", // body copy grey
        faint: "#d7d7d7", // light-grey price labels/lists + gallery plus
        footer: "#707071", // footer text (white@25% blended over #414042)
        mist: "#f9f9f9", // light section background
        ring: "#efefef", // feature icon-circle border
        grass: "#91c46b", // packone accent
        grassdk: "#6d9151", // packone button hover
        tang: "#fd7c00", // packthree accent
        tangdk: "#bf5e00", // packthree button hover
        deepsky: "#277697", // LEARN MORE / DOWNLOAD-NOW hard shadow
        muted: "#72b3cc", // Send button text (muted blue)
        cardbdr: "#e3e0e0", // price-card border
      },
      // Desktop-first max-width breakpoints mirroring the raw-responsive ladder.
      // (The responsive layer currently stays as raw CSS in input.css; these are ready
      // if/when responsive rules are migrated to variants.)
      screens: {
        "max-bp1": { max: "1157px" },
        "max-bp2": { max: "1023px" },
        "max-bp3": { max: "900px" },
        "max-bp4": { max: "560px" },
      },
    },
  },

  plugins: [],
};

"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Registering plugins is idempotent. Calling on the client side
// avoids the "window is not defined" trap during SSR — the browser
// is the only place we ever import this module.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };

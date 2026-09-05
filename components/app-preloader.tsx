"use client"

import { useEffect, useState } from "react"

export function AppPreloader() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (document.readyState === "complete") {
      setHidden(true)
      return
    }
    function onLoad() {
      setHidden(true)
    }
    window.addEventListener("load", onLoad)
    return () => window.removeEventListener("load", onLoad)
  }, [])

  return (
    <div id="app-preloader" className={hidden ? "hide" : ""} aria-hidden={hidden}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          #app-preloader{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;background:linear-gradient(135deg,#fbf9f3 0%,#eaf0e2 45%,#fdf5e6 100%);opacity:1;visibility:visible;transition:opacity .5s ease,visibility .5s ease}
          #app-preloader.hide{opacity:0;visibility:hidden;pointer-events:none}
          #app-preloader svg{width:88px;height:88px}
          #app-preloader span{font-size:13px;font-weight:600;letter-spacing:.1em;color:#2b4a22}
          @media (prefers-reduced-motion: no-preference){
            #app-preloader svg{animation:app-preloader-float 1.6s ease-in-out infinite}
          }
          @keyframes app-preloader-float{0%,100%{transform:translateY(0)}50%{transform:translateY(10px)}}
        `,
        }}
      />
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="50" cy="54" rx="29" ry="27" fill="#f6d975" />
        <circle cx="50" cy="27" r="19" fill="#f6d975" />
        <path d="M30 50 Q20 52 18 62 Q26 60 32 55Z" fill="#eec95f" />
        <path d="M70 50 Q80 52 82 62 Q74 60 68 55Z" fill="#eec95f" />
        <path d="M46 12 Q50 6 54 12 Q50 15 46 12Z" fill="#eec95f" />
        <circle cx="43" cy="25" r="2.6" fill="#3a2c1a" />
        <circle cx="57" cy="25" r="2.6" fill="#3a2c1a" />
        <ellipse cx="36" cy="31" rx="3.4" ry="2.2" fill="#f2a4a4" opacity="0.6" />
        <ellipse cx="64" cy="31" rx="3.4" ry="2.2" fill="#f2a4a4" opacity="0.6" />
        <path d="M46 30 Q50 36 54 30 Q50 33 46 30Z" fill="#e8862c" />
        <path d="M40 80 l-4 6 M40 80 l0 7 M40 80 l4 6" stroke="#e8862c" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d="M60 80 l-4 6 M60 80 l0 7 M60 80 l4 6" stroke="#e8862c" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      </svg>
      <span>MEMUAT&hellip;</span>
    </div>
  )
}

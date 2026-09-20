import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "Hollow Realm";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#0c0a08" },
      {
        name: "description",
        content: "Command the S.Y.N.A.P.S.E compound. Caps, vault, and the squad — Tyrone holds the CRT.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: () => (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <div id="synapse-boot" data-synapse-boot="1" style={{ background: "#0b0f0c", color: "#e7f3ea" }}>
          <style>{`
            #synapse-boot{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;font-family:ui-sans-serif,system-ui,sans-serif;pointer-events:none;transition:opacity .7s cubic-bezier(.22,1,.36,1)}
            #synapse-boot.is-up{opacity:0;pointer-events:none}
            .synapse-boot-panel{display:flex;width:min(18rem,70vw);flex-direction:column;align-items:center;text-align:center}
            .synapse-boot-kicker{font-size:11px;letter-spacing:.48em;text-transform:uppercase;color:#3ee07a}
            .synapse-boot-title{margin-top:12px;font-size:1.875rem}
            .synapse-boot-unit{margin-top:8px;font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#3ee07a}
            .synapse-boot-meter{width:100%;margin-top:32px}
            .synapse-boot-track{height:7px;overflow:hidden;border-radius:999px;background:rgba(62,224,122,.14);box-shadow:inset 0 0 0 1px rgba(62,224,122,.28)}
            .synapse-boot-fill{height:100%;width:10%;border-radius:inherit;background:#7dffb0;animation:synapse-boot-creep 14s cubic-bezier(.22,1,.36,1) forwards}
            .synapse-boot-meta{margin-top:10px;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#3ee07a}
            .synapse-boot-hint{margin-top:16px;font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#8a9a90;opacity:0;animation:synapse-boot-hint .4s ease 12s forwards}
            @keyframes synapse-boot-creep{from{width:8%}to{width:88%}}
            @keyframes synapse-boot-hint{to{opacity:1}}
            @media (prefers-reduced-motion:reduce){.synapse-boot-fill,.synapse-boot-hint{animation:none!important}.synapse-boot-fill{width:42%}.synapse-boot-hint{opacity:1}}
          `}</style>
          <div className="synapse-boot-panel">
            <div className="synapse-boot-kicker">Moon Squad HQ</div>
            <div className="synapse-boot-title">The Hollow Realm</div>
            <div className="synapse-boot-unit">S.Y.N.A.P.S.E T-0880</div>
            <div className="synapse-boot-meter">
              <div className="synapse-boot-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={12} aria-label="Seating CRT">
                <div className="synapse-boot-fill" />
              </div>
              <div className="synapse-boot-meta">
                <span>Seating CRT</span>
                <span>…</span>
              </div>
            </div>
            <div className="synapse-boot-hint">Still seating the CRT…</div>
          </div>
        </div>
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});

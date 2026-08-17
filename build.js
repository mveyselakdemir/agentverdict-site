// Pure Node.js static site builder — no external dependencies.
// Reads tools.json and comparisons.json, outputs static HTML into /dist.

const fs = require("fs");
const path = require("path");

const SITE_NAME = "AgentVerdict";
const SITE_URL = "https://aiagentcompares.com"; // update after domain is connected
const SITE_TAGLINE = "Honest, independent reviews of AI agent and automation tools";

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");
const tools = JSON.parse(fs.readFileSync(path.join(ROOT, "tools.json"), "utf8"));
const comparisons = JSON.parse(fs.readFileSync(path.join(ROOT, "comparisons.json"), "utf8"));

function ensureDir(p) {
    fs.mkdirSync(p, { recursive: true });
}

function toolBySlug(slug) {
    return tools.find((t) => t.slug === slug);
}

function layout({ title, description, canonical, jsonLd, body, ogImage }) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonical}" />
    <meta name="twitter:card" content="summary_large_image" />
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- AdSense: paste publisher script tag here once account is approved -->
    <!-- <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script> -->
    ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ""}
    <link rel="icon" href="data:,">
    </head>
    <body class="bg-white text-slate-900">
    ${header()}
    <main>${body}</main>
    ${footer()}
    </body>
    </html>`;
}

function header() {
    return `
    <header class="border-b border-slate-200">
      <div class="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" class="font-bold text-xl tracking-tight">${SITE_NAME}</a>
              <nav class="flex gap-6 text-sm font-medium text-slate-600">
                    <a href="/tools/" class="hover:text-slate-900">All Tools</a>
                          <a href="/compare/" class="hover:text-slate-900">Comparisons</a>
                                <a href="/about.html" class="hover:text-slate-900">About</a>
                                    </nav>
                                      </div>
                                      </header>`;
}

function footer() {
    return `
    <footer class="border-t border-slate-200 mt-16">
      <div class="max-w-5xl mx-auto px-4 py-8 text-sm text-slate-500 flex flex-col gap-2">
          <p>© ${new Date().getFullYear()} ${SITE_NAME}. Independent reviews — we may earn a commission from some links, which does not affect our ratings.</p>
              <p><a href="/about.html" class="underline">About &amp; methodology</a> · <a href="/disclosure.html" class="underline">Affiliate disclosure</a></p>
                </div>
                </footer>`;
}

function ratingStars(rating) {
    const full = Math.round(rating);
    return `<span class="text-amber-500">${"★".repeat(full)}${"☆".repeat(5 - full)}</span> <span class="text-slate-500 text-sm">${rating}/5</span>`;
}

function toolCard(t) {
    return `
    <a href="/tools/${t.slug}.html" class="block border border-slate-200 rounded-xl p-5 hover:shadow-md transition">
      <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-lg">${t.name}</h3>
              ${ratingStars(t.rating)}
                </div>
                  <p class="text-slate-600 text-sm mb-2">${t.tagline}</p>
                    <p class="text-xs uppercase tracking-wide text-slate-400">${t.category}</p>
                    </a>`;
}

// ---------- Homepage ----------
function buildHome() {
    const body = `
    <section class="max-w-5xl mx-auto px-4 pt-16 pb-10 text-center">
      <h1 class="text-4xl font-bold tracking-tight mb-4">${SITE_TAGLINE}</h1>
        <p class="text-slate-600 max-w-2xl mx-auto">We test and compare the AI agent and workflow automation tools teams actually use — n8n, Zapier, Make, Lindy, CrewAI, Relevance AI, and more — so you can pick the right one without the trial-and-error.</p>
        </section>
        <section class="max-w-5xl mx-auto px-4 pb-8">
          <h2 class="text-xl font-semibold mb-4">Latest reviews</h2>
            <div class="grid sm:grid-cols-2 gap-4">
                ${tools.map(toolCard).join("\n")}
                  </div>
                  </section>
                  <section class="max-w-5xl mx-auto px-4 pb-16">
                    <h2 class="text-xl font-semibold mb-4">Head-to-head comparisons</h2>
                      <div class="grid sm:grid-cols-2 gap-4">
                          ${comparisons
                                  .map(
                                            (c) => `
                                                <a href="/compare/${c.slug}.html" class="block border border-slate-200 rounded-xl p-5 hover:shadow-md transition">
                                                      <h3 class="font-semibold">${toolBySlug(c.a).name} vs ${toolBySlug(c.b).name}</h3>
                                                            <p class="text-slate-600 text-sm mt-1">${c.verdict}</p>
                                                                </a>`
                                          )
                                  .join("\n")}
                                    </div>
                                    </section>`;
    return layout({
          title: `${SITE_NAME} — ${SITE_TAGLINE}`,
          description: SITE_TAGLINE,
          canonical: `${SITE_URL}/`,
          body,
    });
}

// ---------- Tools index ----------
function buildToolsIndex() {
    const body = `
    <section class="max-w-5xl mx-auto px-4 py-12">
      <h1 class="text-3xl font-bold mb-6">All AI agent &amp; automation tools</h1>
        <div class="grid sm:grid-cols-2 gap-4">${tools.map(toolCard).join("\n")}</div>
        </section>`;
    return layout({
          title: `All Tools — ${SITE_NAME}`,
          description: "Every AI agent and automation tool reviewed on AgentVerdict.",
          canonical: `${SITE_URL}/tools/`,
          body,
    });
}

// ---------- Individual tool page ----------
function buildToolPage(t) {
    const jsonLd = {
          "@context": "https://schema.org",
          "@type": "Review",
          itemReviewed: { "@type": "SoftwareApplication", name: t.name, applicationCategory: t.category },
          reviewRating: { "@type": "Rating", ratingValue: t.rating, bestRating: "5" },
          author: { "@type": "Organization", name: SITE_NAME },
    };
    const body = `
    <article class="max-w-3xl mx-auto px-4 py-12">
      <p class="text-sm text-slate-400 uppercase tracking-wide mb-2">${t.category}</p>
        <h1 class="text-3xl font-bold mb-2">${t.name} review</h1>
          <p class="text-slate-600 mb-4">${t.tagline}</p>
            <div class="mb-6">${ratingStars(t.rating)}</div>

              <div class="grid sm:grid-cols-2 gap-6 mb-8">
                  <div class="border border-slate-200 rounded-xl p-5">
                        <h2 class="font-semibold mb-3 text-emerald-700">Pros</h2>
                              <ul class="list-disc list-inside space-y-1 text-sm text-slate-700">
                                      ${t.pros.map((p) => `<li>${p}</li>`).join("\n")}
                                            </ul>
                                                </div>
                                                    <div class="border border-slate-200 rounded-xl p-5">
                                                          <h2 class="font-semibold mb-3 text-rose-700">Cons</h2>
                                                                <ul class="list-disc list-inside space-y-1 text-sm text-slate-700">
                                                                        ${t.cons.map((c) => `<li>${c}</li>`).join("\n")}
                                                                              </ul>
                                                                                  </div>
                                                                                    </div>

                                                                                      <h2 class="text-xl font-semibold mb-3">Our take</h2>
                                                                                        <p class="text-slate-700 leading-relaxed mb-6">${t.summary}</p>

                                                                                          <div class="border border-slate-200 rounded-xl p-5 mb-8">
                                                                                              <h2 class="font-semibold mb-2">Best for</h2>
                                                                                                  <p class="text-slate-700 text-sm mb-4">${t.bestFor}</p>
                                                                                                      <h2 class="font-semibold mb-2">Pricing</h2>
                                                                                                          <p class="text-slate-700 text-sm mb-4">${t.pricing}</p>
                                                                                                              <a href="${t.website}" target="_blank" rel="nofollow sponsored noopener" class="inline-block bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg">Visit ${t.name} →</a>
                                                                                                                </div>
                                                                                                                </article>`;
    return layout({
          title: `${t.name} Review 2026 — ${SITE_NAME}`,
          description: `${t.name}: ${t.tagline}. Pros, cons, pricing, and who it's actually best for.`,
          canonical: `${SITE_URL}/tools/${t.slug}.html`,
          jsonLd,
          body,
    });
}

// ---------- Comparisons index ----------
function buildComparisonsIndex() {
    const body = `
    <section class="max-w-5xl mx-auto px-4 py-12">
      <h1 class="text-3xl font-bold mb-6">Head-to-head comparisons</h1>
        <div class="grid sm:grid-cols-2 gap-4">
            ${comparisons
                    .map(
                              (c) => `
                                  <a href="/compare/${c.slug}.html" class="block border border-slate-200 rounded-xl p-5 hover:shadow-md transition">
                                        <h3 class="font-semibold">${toolBySlug(c.a).name} vs ${toolBySlug(c.b).name}</h3>
                                              <p class="text-slate-600 text-sm mt-1">${c.verdict}</p>
                                                  </a>`
                            )
                    .join("\n")}
                      </div>
                      </section>`;
    return layout({
          title: `Comparisons — ${SITE_NAME}`,
          description: "Head-to-head comparisons of AI agent and automation tools.",
          canonical: `${SITE_URL}/compare/`,
          body,
    });
}

// ---------- Comparison page ----------
function buildComparisonPage(c) {
    const a = toolBySlug(c.a);
    const b = toolBySlug(c.b);
    const body = `
    <article class="max-w-3xl mx-auto px-4 py-12">
      <h1 class="text-3xl font-bold mb-2">${a.name} vs ${b.name}</h1>
        <p class="text-slate-600 mb-8">${c.intro}</p>

          <div class="grid sm:grid-cols-2 gap-6 mb-8">
              <div class="border border-slate-200 rounded-xl p-5">
                    <h2 class="font-semibold mb-2">${a.name}</h2>
                          <div class="mb-2">${ratingStars(a.rating)}</div>
                                <p class="text-sm text-slate-600 mb-3">${a.tagline}</p>
                                      <a href="/tools/${a.slug}.html" class="text-sm underline">Full review →</a>
                                          </div>
                                              <div class="border border-slate-200 rounded-xl p-5">
                                                    <h2 class="font-semibold mb-2">${b.name}</h2>
                                                          <div class="mb-2">${ratingStars(b.rating)}</div>
                                                                <p class="text-sm text-slate-600 mb-3">${b.tagline}</p>
                                                                      <a href="/tools/${b.slug}.html" class="text-sm underline">Full review →</a>
                                                                          </div>
                                                                            </div>

                                                                              <h2 class="text-xl font-semibold mb-3">Verdict</h2>
                                                                                <p class="text-slate-700 leading-relaxed mb-6">${c.verdict}</p>

                                                                                  <h2 class="text-xl font-semibold mb-3">Choose ${a.name} if…</h2>
                                                                                    <p class="text-slate-700 leading-relaxed mb-6">${c.chooseA}</p>

                                                                                      <h2 class="text-xl font-semibold mb-3">Choose ${b.name} if…</h2>
                                                                                        <p class="text-slate-700 leading-relaxed mb-6">${c.chooseB}</p>
                                                                                        </article>`;
    return layout({
          title: `${a.name} vs ${b.name} (2026) — ${SITE_NAME}`,
          description: c.intro,
          canonical: `${SITE_URL}/compare/${c.slug}.html`,
          body,
    });
}

// ---------- Static pages ----------
function buildAbout() {
    const body = `
    <article class="max-w-2xl mx-auto px-4 py-12 prose">
      <h1 class="text-3xl font-bold mb-4">About ${SITE_NAME}</h1>
        <p class="text-slate-700 leading-relaxed mb-4">${SITE_NAME} reviews AI agent and workflow automation tools. We evaluate each tool on setup time, integration depth, pricing transparency, and how well it handles real workflows — not just marketing claims.</p>
          <p class="text-slate-700 leading-relaxed mb-4">Ratings are based on published documentation, pricing pages, and hands-on testing where available, reviewed by our editorial team before publishing. This site is independently operated and not affiliated with any tool listed.</p>
          </article>`;
    return layout({ title: `About — ${SITE_NAME}`, description: "About AgentVerdict and our review methodology.", canonical: `${SITE_URL}/about.html`, body });
}

function buildDisclosure() {
    const body = `
    <article class="max-w-2xl mx-auto px-4 py-12 prose">
      <h1 class="text-3xl font-bold mb-4">Affiliate disclosure</h1>
        <p class="text-slate-700 leading-relaxed mb-4">Some links on ${SITE_NAME} are affiliate links. If you sign up through them, we may earn a commission at no extra cost to you. This never affects which tools we cover or how we rate them.</p>
        </article>`;
    return layout({ title: `Disclosure — ${SITE_NAME}`, description: "Affiliate disclosure.", canonical: `${SITE_URL}/disclosure.html`, body });
}

// ---------- Build ----------
function build() {
    fs.rmSync(DIST, { recursive: true, force: true });
    ensureDir(DIST);
    ensureDir(path.join(DIST, "tools"));
    ensureDir(path.join(DIST, "compare"));

  fs.writeFileSync(path.join(DIST, "index.html"), buildHome());
    fs.writeFileSync(path.join(DIST, "about.html"), buildAbout());
    fs.writeFileSync(path.join(DIST, "disclosure.html"), buildDisclosure());
    fs.writeFileSync(path.join(DIST, "tools", "index.html"), buildToolsIndex());
    fs.writeFileSync(path.join(DIST, "compare", "index.html"), buildComparisonsIndex());

  for (const t of tools) {
        fs.writeFileSync(path.join(DIST, "tools", `${t.slug}.html`), buildToolPage(t));
  }
    for (const c of comparisons) {
          fs.writeFileSync(path.join(DIST, "compare", `${c.slug}.html`), buildComparisonPage(c));
    }

  // sitemap.xml
  const urls = [
        "/",
        "/tools/",
        "/compare/",
        "/about.html",
        "/disclosure.html",
        ...tools.map((t) => `/tools/${t.slug}.html`),
        ...comparisons.map((c) => `/compare/${c.slug}.html`),
      ];
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join("\n")}
    </urlset>`;
    fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap);

  // robots.txt
  fs.writeFileSync(
        path.join(DIST, "robots.txt"),
        `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`
      );
}

build();

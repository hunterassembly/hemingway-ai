/**
 * Self-contained demo page HTML for testing the Hemingway overlay.
 * Served at /demo on the companion server.
 */
export function getDemoHtml(port: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Beacon — Demo Site</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --text: #0f172a;
      --text-muted: #64748b;
      --bg: #ffffff;
      --bg-subtle: #f8fafc;
      --border: #e2e8f0;
      --accent: #2563eb;
      --accent-hover: #1d4ed8;
      --radius: 8px;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: var(--text);
      background: var(--bg);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    /* --- Nav --- */
    nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 960px;
      margin: 0 auto;
      padding: 20px 24px;
    }
    nav .logo {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text);
      text-decoration: none;
    }
    nav .nav-links { display: flex; gap: 32px; align-items: center; }
    nav .nav-links a {
      font-size: 14px;
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.15s;
    }
    nav .nav-links a:hover { color: var(--text); }

    /* --- Hero --- */
    .hero {
      max-width: 640px;
      margin: 80px auto 0;
      padding: 0 24px;
      text-align: center;
    }
    .hero .badge {
      display: inline-block;
      font-size: 13px;
      font-weight: 500;
      color: var(--accent);
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 999px;
      padding: 4px 14px;
      margin-bottom: 24px;
    }
    .hero h1 {
      font-size: 48px;
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.1;
      margin-bottom: 20px;
    }
    .hero p {
      font-size: 18px;
      color: var(--text-muted);
      max-width: 480px;
      margin: 0 auto 36px;
    }
    .hero .cta-group {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    /* --- Buttons --- */
    .btn {
      display: inline-flex;
      align-items: center;
      font-size: 15px;
      font-weight: 500;
      padding: 10px 22px;
      border-radius: var(--radius);
      text-decoration: none;
      transition: all 0.15s;
      cursor: pointer;
      border: none;
    }
    .btn-primary {
      background: var(--accent);
      color: #fff;
    }
    .btn-primary:hover { background: var(--accent-hover); }
    .btn-secondary {
      background: var(--bg);
      color: var(--text);
      border: 1px solid var(--border);
    }
    .btn-secondary:hover { background: var(--bg-subtle); }

    /* --- Logos --- */
    .logos {
      max-width: 960px;
      margin: 80px auto 0;
      padding: 0 24px;
      text-align: center;
    }
    .logos p {
      font-size: 13px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      margin-bottom: 24px;
    }
    .logo-row {
      display: flex;
      justify-content: center;
      gap: 48px;
      flex-wrap: wrap;
    }
    .logo-row span {
      font-size: 16px;
      font-weight: 600;
      color: var(--border);
      letter-spacing: -0.01em;
    }

    /* --- Features --- */
    .features {
      max-width: 960px;
      margin: 100px auto 0;
      padding: 0 24px;
    }
    .features .section-label {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--accent);
      text-align: center;
      margin-bottom: 12px;
    }
    .features h2 {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.02em;
      text-align: center;
      margin-bottom: 12px;
    }
    .features .section-sub {
      font-size: 16px;
      color: var(--text-muted);
      text-align: center;
      max-width: 520px;
      margin: 0 auto 48px;
    }
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }
    .feature-card {
      padding: 28px;
      border: 1px solid var(--border);
      border-radius: 12px;
      transition: box-shadow 0.2s;
    }
    .feature-card:hover {
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
    }
    .feature-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #eff6ff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      margin-bottom: 16px;
    }
    .feature-card h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .feature-card p {
      font-size: 14px;
      color: var(--text-muted);
      line-height: 1.5;
    }

    /* --- Testimonial --- */
    .testimonial {
      max-width: 640px;
      margin: 100px auto 0;
      padding: 0 24px;
      text-align: center;
    }
    .testimonial blockquote {
      font-size: 22px;
      font-weight: 400;
      font-style: italic;
      line-height: 1.5;
      color: var(--text);
      margin-bottom: 20px;
    }
    .testimonial cite {
      font-style: normal;
      font-size: 14px;
      color: var(--text-muted);
    }

    /* --- CTA --- */
    .cta {
      max-width: 640px;
      margin: 100px auto 0;
      padding: 48px 24px;
      text-align: center;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: 16px;
    }
    .cta h2 {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 12px;
    }
    .cta p {
      font-size: 16px;
      color: var(--text-muted);
      margin-bottom: 28px;
    }

    /* --- Footer --- */
    footer {
      max-width: 960px;
      margin: 80px auto 0;
      padding: 24px 24px 48px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    footer p {
      font-size: 13px;
      color: var(--text-muted);
    }
    footer a {
      font-size: 13px;
      color: var(--text-muted);
      text-decoration: none;
    }
    footer a:hover { color: var(--text); }

    /* --- Hemingway hint --- */
    .hw-hint {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--text);
      color: #fff;
      font-size: 13px;
      padding: 8px 16px;
      border-radius: 999px;
      opacity: 0.85;
      pointer-events: none;
      z-index: 9999;
    }
    .hw-hint kbd {
      font-family: inherit;
      font-weight: 600;
      background: rgba(255,255,255,0.15);
      padding: 2px 6px;
      border-radius: 4px;
      margin: 0 2px;
    }

    @media (max-width: 720px) {
      .hero h1 { font-size: 32px; }
      .feature-grid { grid-template-columns: 1fr; }
      .logo-row { gap: 24px; }
    }
  </style>
</head>
<body>

  <nav>
    <a href="#" class="logo">Beacon</a>
    <div class="nav-links">
      <a href="#">Features</a>
      <a href="#">Pricing</a>
      <a href="#">Docs</a>
      <a href="#" class="btn btn-primary" style="font-size:13px; padding:7px 16px;">Get Started</a>
    </div>
  </nav>

  <section class="hero">
    <span class="badge">Now in public beta</span>
    <h1>Know what's working. Know what to fix. No dashboard required.</h1>
    <p>Stop drowning in dashboards. Beacon surfaces the metrics that matter and tells you what to do about them.</p>
    <div class="cta-group">
      <a href="#" class="btn btn-primary">Start for free</a>
      <a href="#" class="btn btn-secondary">See a demo</a>
    </div>
  </section>

  <section class="logos">
    <p>Trusted by forward-thinking teams</p>
    <div class="logo-row">
      <span>Vercel</span>
      <span>Linear</span>
      <span>Notion</span>
      <span>Stripe</span>
      <span>Resend</span>
    </div>
  </section>

  <section class="features">
    <p class="section-label">Features</p>
    <h2>Everything you need, nothing you don't</h2>
    <p class="section-sub">We obsessed over simplicity so you can obsess over your product.</p>

    <div class="feature-grid">
      <div class="feature-card">
        <div class="feature-icon">&#9678;</div>
        <h3>One-line setup</h3>
        <p>Drop in a script tag and you're live. No build steps, no config files, no PhD required.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">&#9670;</div>
        <h3>Real-time insights</h3>
        <p>See what's happening on your site right now. Not yesterday, not last week — right now.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">&#9733;</div>
        <h3>Smart alerts</h3>
        <p>Get notified when something actually matters. We filter out the noise so you don't have to.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">&#9744;</div>
        <h3>Privacy-first</h3>
        <p>No cookies, no fingerprinting, no creepy tracking. GDPR and CCPA compliant out of the box.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">&#9881;</div>
        <h3>Team dashboards</h3>
        <p>Give everyone on your team the view that matters to them. Marketing, product, engineering — all covered.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">&#10148;</div>
        <h3>Export anywhere</h3>
        <p>Your data is yours. Export to CSV, push to your data warehouse, or hit our API directly.</p>
      </div>
    </div>
  </section>

  <section class="testimonial">
    <blockquote>"We replaced three different analytics tools with Beacon. Our team finally agrees on what the numbers mean."</blockquote>
    <cite>Jamie Torres, Head of Growth at Campfire</cite>
  </section>

  <section class="cta">
    <h2>Ready to see what you've been missing?</h2>
    <p>Free for up to 10,000 events per month. No credit card required.</p>
    <a href="#" class="btn btn-primary">Get started in 30 seconds</a>
  </section>

  <footer>
    <p>&copy; 2026 Beacon Analytics. All rights reserved.</p>
    <a href="#">Privacy Policy</a>
  </footer>

  <div class="hw-hint">
    Press <kbd id="hw-mod">Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>H</kbd> to activate Hemingway
  </div>

  <script src="http://localhost:${port}/client.js"></script>
  <script>if(/Mac|iPhone|iPad/.test(navigator.platform??navigator.userAgent))document.getElementById('hw-mod').textContent='\u2318';</script>
</body>
</html>`;
}

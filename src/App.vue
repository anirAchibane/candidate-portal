<template>
  <div id="app">
    <header class="site-header">
      <div class="header-inner">
        <router-link to="/" class="logo">
          <span class="logo-mark">SR</span>
          <span class="logo-text">SmartRecruit</span>
        </router-link>
        <nav class="header-nav">
          <router-link to="/" class="nav-link">Open Positions</router-link>
          <router-link to="/apply" class="nav-link nav-cta">General Application</router-link>
        </nav>
      </div>
    </header>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="site-footer">
      <div class="footer-inner">
        <span>© {{ new Date().getFullYear() }} SmartRecruit — 2026</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
// No setup logic needed at app level
</script>

<style>
/* ─── Reset & Tokens ─── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  /* Palette — deep slate editorial */
  --bg:          #0c0f14;
  --bg-card:     #12161d;
  --bg-elevated: #181d26;
  --border:      #232a36;
  --border-soft: #1c2230;

  --text-primary:   #eef0f4;
  --text-secondary: #8a93a8;
  --text-muted:     #4e5669;

  --accent:       #3d7eff;
  --accent-glow:  rgba(61, 126, 255, 0.18);
  --accent-hover: #5a91ff;

  --success: #22c97a;
  --warning: #f0a843;
  --danger:  #f05656;

  /* Typography */
  --font-display: 'Syne', sans-serif;
  --font-body:    'DM Sans', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;

  /* Spacing */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;

  --max-w: 1140px;
}

@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=JetBrains+Mono:wght@400;500&display=swap');

html { scroll-behavior: smooth; }

body {
  background: var(--bg);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}

/* ─── Header ─── */
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--border);
  background: rgba(12, 15, 20, 0.85);
  backdrop-filter: blur(12px);
}

.header-inner {
  max-width: var(--max-w);
  margin: 0 auto;
  padding: 0 2rem;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.logo-mark {
  width: 34px;
  height: 34px;
  background: var(--accent);
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 13px;
  color: #fff;
  letter-spacing: -0.5px;
  flex-shrink: 0;
}

.logo-text {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 17px;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-link {
  padding: 7px 14px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color 0.15s, background 0.15s;
}
.nav-link:hover,
.nav-link.router-link-active {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.nav-cta {
  background: var(--accent-glow);
  color: var(--accent);
  border: 1px solid rgba(61, 126, 255, 0.3);
}
.nav-cta:hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

/* ─── Main ─── */
.main-content {
  min-height: calc(100vh - 64px - 56px);
}

/* ─── Footer ─── */
.site-footer {
  border-top: 1px solid var(--border);
  height: 56px;
  display: flex;
  align-items: center;
}
.footer-inner {
  max-width: var(--max-w);
  margin: 0 auto;
  padding: 0 2rem;
  width: 100%;
  font-size: 13px;
  color: var(--text-muted);
}

/* ─── Page Transitions ─── */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ─── Shared Utilities ─── */
.page-container {
  max-width: var(--max-w);
  margin: 0 auto;
  padding: 3rem 2rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  font-family: var(--font-mono);
  letter-spacing: 0.02em;
}
.badge-blue   { background: rgba(61,126,255,.15); color: #7aaeff; border: 1px solid rgba(61,126,255,.2); }
.badge-green  { background: rgba(34,201,122,.12); color: #3ddea0; border: 1px solid rgba(34,201,122,.2); }
.badge-amber  { background: rgba(240,168,67,.12);  color: #f5c06e; border: 1px solid rgba(240,168,67,.2); }
.badge-slate  { background: rgba(138,147,168,.1);  color: var(--text-secondary); border: 1px solid var(--border); }

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  text-decoration: none;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-primary {
  background: var(--accent);
  color: #fff;
}
.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(61,126,255,.35);
}

.btn-secondary {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border);
}
.btn-secondary:hover:not(:disabled) {
  background: var(--bg-card);
  border-color: #2e3849;
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid transparent;
}
.btn-ghost:hover:not(:disabled) {
  color: var(--text-primary);
  border-color: var(--border);
}

.btn-lg {
  padding: 13px 28px;
  font-size: 15px;
  border-radius: var(--radius-md);
}

.divider {
  height: 1px;
  background: var(--border);
  margin: 2rem 0;
}
</style>

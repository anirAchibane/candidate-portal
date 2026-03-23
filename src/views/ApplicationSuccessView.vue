<template>
  <div class="success-page">
    <div class="success-box">
      <div class="checkmark-wrap">
        <svg class="checkmark" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle class="checkmark-circle" cx="26" cy="26" r="24" stroke="currentColor" stroke-width="2"/>
          <path class="checkmark-tick" d="M14 26l9 9 15-17" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <h1 class="success-title">Application submitted!</h1>
      <p class="success-sub">
        We've received your resume and will process it shortly.<br>
        Keep an eye on your inbox — we'll be in touch within 5–7 business days.
      </p>

      <div class="next-steps">
        <div class="ns-item">
          <div class="ns-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <p>AI extraction & scoring will run automatically</p>
        </div>
        <div class="ns-item">
          <div class="ns-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="5" r="2.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M3 13c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <p>A recruiter will review your profile and score</p>
        </div>
        <div class="ns-item">
          <div class="ns-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4Z" stroke="currentColor" stroke-width="1.5"/>
              <path d="M2 4l6 5 6-5" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </div>
          <p>Expect an email from our recruitment team</p>
        </div>
      </div>

      <div class="success-actions">
        <router-link to="/" class="btn btn-primary">
          View all open positions
        </router-link>
        <router-link to="/apply" class="btn btn-ghost">
          Submit another application
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// No logic needed
</script>

<style scoped>
.success-page {
  min-height: calc(100vh - 64px - 56px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
}

.success-box {
  max-width: 520px;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

/* ─── Checkmark animation ─── */
.checkmark-wrap {
  margin-bottom: 28px;
}

.checkmark {
  width: 68px; height: 68px;
  color: var(--success);
}

.checkmark-circle {
  stroke-dasharray: 157;
  stroke-dashoffset: 157;
  animation: drawCircle 0.6s ease forwards;
}

.checkmark-tick {
  stroke-dasharray: 50;
  stroke-dashoffset: 50;
  animation: drawTick 0.4s ease 0.5s forwards;
}

@keyframes drawCircle {
  to { stroke-dashoffset: 0; }
}
@keyframes drawTick {
  to { stroke-dashoffset: 0; }
}

/* ─── Text ─── */
.success-title {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.success-sub {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.65;
  margin-bottom: 32px;
}

/* ─── Next steps ─── */
.next-steps {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  margin-bottom: 32px;
  text-align: left;
}

.ns-item {
  display: flex;
  align-items: center;
  gap: 14px;
}

.ns-icon {
  width: 32px; height: 32px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  color: var(--accent);
  flex-shrink: 0;
}

.ns-item p {
  font-size: 13.5px;
  color: var(--text-secondary);
}

/* ─── Actions ─── */
.success-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>

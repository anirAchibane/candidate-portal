<template>
  <div class="page-container">
    <!-- Back -->
    <router-link to="/" class="back-link">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M13 8H3M7 4l-4 4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      All positions
    </router-link>

    <!-- Loading -->
    <div v-if="loading" class="detail-skeleton">
      <div class="sk sk-eyebrow"></div>
      <div class="sk sk-h1"></div>
      <div class="sk sk-h1 short"></div>
      <div class="sk-meta-row">
        <div class="sk sk-chip" v-for="n in 4" :key="n"></div>
      </div>
      <div class="sk sk-body" v-for="n in 5" :key="n"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="state-box state-error">
      <p>{{ error }}</p>
      <button class="btn btn-secondary" @click="fetchOffer()">Retry</button>
    </div>

    <!-- Content -->
    <template v-else-if="offer">
      <div class="detail-layout">
        <!-- Main -->
        <article class="detail-main">
          <div class="offer-head">
            <div class="offer-tags">
              <span class="badge" :class="typeBadgeClass">{{ offer.Type__c }}</span>
              <span v-if="offer.Department__r?.Name" class="badge badge-slate">{{ offer.Department__r.Name }}</span>
            </div>
            <h1 class="offer-title">{{ offer.Title__c || offer.Name }}</h1>

            <div class="offer-chips">
              <div v-if="offer.Location__c" class="chip">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a4.5 4.5 0 0 1 4.5 4.5c0 3.5-4.5 8.5-4.5 8.5S3.5 9.5 3.5 6A4.5 4.5 0 0 1 8 1.5Z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="6" r="1.5" stroke="currentColor" stroke-width="1.5"/></svg>
                {{ offer.Location__c }}
              </div>
              <div v-if="offer.Experience_Min__c !== undefined" class="chip">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                {{ offer.Experience_Min__c }}+ years
              </div>
              <div class="chip">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M5 2v2M11 2v2M2 7h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                Posted {{ formatDate(offer.CreatedDate) }}
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Description -->
          <section class="content-section" v-if="offer.Description__c">
            <h2 class="section-title">About the role</h2>
            <div class="prose" v-html="formattedDescription"></div>
          </section>

          <!-- Required skills -->
          <section class="content-section" v-if="offer.Skills?.length">
            <h2 class="section-title">Required skills</h2>
            <div class="skills-grid">
              <div
                v-for="skill in offer.Skills"
                :key="skill.Id || skill.Name"
                class="skill-chip"
              >
                <span class="skill-dot"></span>
                {{ skill.Name }}
                <span v-if="skill.Weight__c" class="skill-weight">×{{ skill.Weight__c }}</span>
              </div>
            </div>
          </section>

          <!-- Certifications -->
          <section class="content-section" v-if="offer.Certifications?.length">
            <h2 class="section-title">Certifications</h2>
            <div class="cert-list">
              <div v-for="cert in offer.Certifications" :key="cert" class="cert-item">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13.5 8l-5.5 5.5L2.5 8M8 2v11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                {{ cert }}
              </div>
            </div>
          </section>
        </article>

        <!-- Sidebar -->
        <aside class="detail-sidebar">
          <div class="sidebar-card">
            <h3 class="sidebar-title">Apply for this role</h3>
            <p class="sidebar-sub">
              Submit your resume and we'll match it against the requirements automatically.
            </p>
            <router-link
              :to="{ name: 'ApplyToOffer', params: { offerId: id } }"
              class="btn btn-primary btn-lg sidebar-apply-btn"
            >
              Apply Now
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </router-link>

            <div class="divider"></div>

            <div class="sidebar-meta-list">
              <div v-if="offer.Type__c" class="smeta-row">
                <span class="smeta-label">Type</span>
                <span class="smeta-val">{{ offer.Type__c }}</span>
              </div>
              <div v-if="offer.Department__r?.Name" class="smeta-row">
                <span class="smeta-label">Department</span>
                <span class="smeta-val">{{ offer.Department__r.Name }}</span>
              </div>
              <div v-if="offer.Location__c" class="smeta-row">
                <span class="smeta-label">Location</span>
                <span class="smeta-val">{{ offer.Location__c }}</span>
              </div>
              <div v-if="offer.Experience_Min__c !== undefined" class="smeta-row">
                <span class="smeta-label">Experience</span>
                <span class="smeta-val">{{ offer.Experience_Min__c }}+ years</span>
              </div>
            </div>
          </div>

          <div class="not-right-fit">
            <p>Not the right fit?</p>
            <router-link to="/apply" class="btn btn-ghost" style="padding: 6px 12px; font-size:13px">
              General application →
            </router-link>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, defineProps } from 'vue'
import { useJobOffer } from '../composables/useApi.js'

const props = defineProps({
  id: { type: String, required: true }
})

const { offer, loading, error, fetchOffer } = useJobOffer(props.id)

const TYPE_CLASSES = {
  CDI: 'badge-green',
  CDD: 'badge-amber',
  Internship: 'badge-blue',
  Stage: 'badge-blue',
  Freelance: 'badge-slate'
}
const typeBadgeClass = computed(() =>
  TYPE_CLASSES[offer.value?.Type__c] ?? 'badge-slate'
)

const formattedDescription = computed(() => {
  const raw = offer.value?.Description__c || ''
  return raw.replace(/\n/g, '<br>')
})

function formatDate (iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

onMounted(() => fetchOffer())
</script>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  margin-bottom: 2.5rem;
  transition: color 0.15s;
}
.back-link:hover { color: var(--text-primary); }

/* ─── Layout ─── */
.detail-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2.5rem;
  align-items: start;
}

/* ─── Main ─── */
.offer-head { margin-bottom: 1.5rem; }
.offer-tags { display: flex; gap: 8px; margin-bottom: 14px; }

.offer-title {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  font-weight: 800;
  letter-spacing: -0.8px;
  line-height: 1.15;
  color: var(--text-primary);
  margin-bottom: 18px;
}

.offer-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 5px 11px;
}

/* ─── Content sections ─── */
.content-section { margin-bottom: 2.5rem; }

.section-title {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 14px;
}

.prose {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.75;
}

/* ─── Skills ─── */
.skills-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 6px 12px;
  font-size: 13px;
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.skill-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}

.skill-weight {
  color: var(--accent);
  font-size: 11px;
}

/* ─── Certs ─── */
.cert-list { display: flex; flex-direction: column; gap: 8px; }

.cert-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}
.cert-item svg { color: var(--success); flex-shrink: 0; }

/* ─── Sidebar ─── */
.sidebar-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  position: sticky;
  top: 84px;
}

.sidebar-title {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.sidebar-sub {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.55;
  margin-bottom: 18px;
}

.sidebar-apply-btn {
  width: 100%;
  margin-bottom: 4px;
}

.sidebar-meta-list { display: flex; flex-direction: column; gap: 10px; }

.smeta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}
.smeta-label { color: var(--text-muted); }
.smeta-val   { color: var(--text-primary); font-weight: 500; text-align: right; }

.not-right-fit {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0 0;
  font-size: 13px;
  color: var(--text-muted);
}

/* ─── Skeleton ─── */
.detail-skeleton {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 640px;
}
.sk {
  border-radius: 6px;
  background: linear-gradient(90deg, var(--bg-elevated) 25%, #1e2534 50%, var(--bg-elevated) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
.sk-eyebrow { height: 22px; width: 70px; border-radius: 999px; }
.sk-h1      { height: 36px; width: 80%; }
.sk-h1.short { width: 55%; }
.sk-chip    { height: 28px; width: 90px; border-radius: 999px; }
.sk-body    { height: 14px; width: 100%; }
.sk-meta-row { display: flex; gap: 8px; }
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ─── State ─── */
.state-box {
  display: flex; flex-direction: column; align-items: center;
  gap: 14px; padding: 4rem 2rem; color: var(--text-muted); text-align: center;
}
.state-error { color: var(--danger); }

@media (max-width: 860px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
  .sidebar-card { position: static; }
}
</style>

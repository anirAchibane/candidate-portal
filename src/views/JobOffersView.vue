<template>
  <div class="page-container">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-eyebrow">
        <span class="badge badge-blue">We're hiring</span>
      </div>
      <h1 class="hero-title">Open Positions</h1>
      <p class="hero-sub">
        Browse our open roles or submit a general application below.
      </p>

      <!-- Filters -->
      <div class="filters">
        <div class="search-wrap">
          <svg class="search-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input
            v-model="search"
            type="text"
            placeholder="Search by title, skill…"
            class="search-input"
          />
        </div>

        <select v-model="filterType" class="filter-select">
          <option value="">All types</option>
          <option value="CDI">CDI</option>
          <option value="CDD">CDD</option>
          <option value="Internship">Internship / Stage</option>
          <option value="Freelance">Freelance</option>
        </select>

        <select v-model="filterDept" class="filter-select">
          <option value="">All departments</option>
          <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
        </select>
      </div>
    </section>

    <!-- Loading skeleton -->
    <div v-if="loading" class="offers-grid">
      <div v-for="n in 6" :key="n" class="skeleton-card">
        <div class="sk sk-badge"></div>
        <div class="sk sk-title"></div>
        <div class="sk sk-body"></div>
        <div class="sk sk-body short"></div>
        <div class="sk sk-footer"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="state-box state-error">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M12 7v5M12 16v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      <p>{{ error }}</p>
      <button class="btn btn-secondary" @click="fetchOffers()">Retry</button>
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="state-box">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M9 9h6M9 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <p>No positions found matching your filters.</p>
      <button class="btn btn-ghost" @click="clearFilters">Clear filters</button>
    </div>

    <!-- Grid -->
    <div v-else class="offers-grid">
      <JobOfferCard
        v-for="offer in filtered"
        :key="offer.Id"
        :offer="offer"
        class="card-appear"
        :style="{ animationDelay: `${filtered.indexOf(offer) * 40}ms` }"
      />
    </div>

    <!-- General application CTA -->
    <section class="general-cta">
      <div class="cta-content">
        <h2 class="cta-title">Don't see the right fit?</h2>
        <p class="cta-sub">Send us your resume anyway — we'll keep it on file for future opportunities.</p>
      </div>
      <router-link to="/apply" class="btn btn-primary btn-lg">
        General Application
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </router-link>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import JobOfferCard from '../components/JobOfferCard.vue'
import { useJobOffers } from '../composables/useApi.js'

const { offers, loading, error, fetchOffers } = useJobOffers()

const search = ref('')
const filterType = ref('')
const filterDept = ref('')

const departments = computed(() => {
  const depts = offers.value
    .map(o => o.Department__r?.Name)
    .filter(Boolean)
  return [...new Set(depts)].sort()
})

const filtered = computed(() => {
  return offers.value.filter(o => {
    const title = (o.Title__c || o.Name || '').toLowerCase()
    const desc = (o.Description__c || '').toLowerCase()
    const q = search.value.trim().toLowerCase()

    if (q && !title.includes(q) && !desc.includes(q)) return false
    if (filterType.value && o.Type__c !== filterType.value) return false
    if (filterDept.value && o.Department__r?.Name !== filterDept.value) return false
    return true
  })
})

function clearFilters () {
  search.value = ''
  filterType.value = ''
  filterDept.value = ''
}

onMounted(() => fetchOffers())
</script>

<style scoped>
/* ─── Hero ─── */
.hero {
  margin-bottom: 3rem;
}

.hero-eyebrow {
  margin-bottom: 14px;
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 3.2rem);
  font-weight: 800;
  letter-spacing: -1px;
  line-height: 1.1;
  color: var(--text-primary);
  margin-bottom: 14px;
}

.hero-sub {
  font-size: 16px;
  color: var(--text-secondary);
  max-width: 520px;
  margin-bottom: 2rem;
  line-height: 1.6;
}

/* ─── Filters ─── */
.filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 9px 14px 9px 36px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
}
.search-input::placeholder { color: var(--text-muted); }
.search-input:focus { border-color: var(--accent); }

.filter-select {
  padding: 9px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 14px;
  outline: none;
  cursor: pointer;
  min-width: 150px;
  transition: border-color 0.15s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%234e5669' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}
.filter-select option { background: var(--bg-card); }
.filter-select:focus { border-color: var(--accent); }

/* ─── Grid ─── */
.offers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 4rem;
}

/* ─── Skeleton ─── */
.skeleton-card {
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sk {
  border-radius: 4px;
  background: linear-gradient(90deg, var(--bg-elevated) 25%, #1e2534 50%, var(--bg-elevated) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
.sk-badge  { height: 22px; width: 60px; border-radius: 999px; }
.sk-title  { height: 22px; width: 75%; }
.sk-body   { height: 14px; width: 100%; }
.sk-body.short { width: 60%; }
.sk-footer { height: 14px; width: 50%; margin-top: 4px; }

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ─── States ─── */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 5rem 2rem;
  color: var(--text-muted);
  text-align: center;
  margin-bottom: 4rem;
}
.state-error { color: var(--danger); }
.state-box p { font-size: 15px; max-width: 300px; }

/* ─── Card appear animation ─── */
.card-appear {
  animation: cardIn 0.35s ease both;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ─── General CTA ─── */
.general-cta {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 32px 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  background: var(--bg-card);
  position: relative;
  overflow: hidden;
}
.general-cta::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 60% 100% at 80% 50%, rgba(61,126,255,.07) 0%, transparent 70%);
  pointer-events: none;
}

.cta-title {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.3px;
  margin-bottom: 6px;
}
.cta-sub {
  font-size: 14px;
  color: var(--text-secondary);
}

@media (max-width: 600px) {
  .general-cta { flex-direction: column; align-items: flex-start; }
  .offers-grid { grid-template-columns: 1fr; }
}
</style>

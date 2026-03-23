<template>
  <article class="offer-card" @click="$router.push({ name: 'JobOfferDetail', params: { id: offer.Id } })">
    <div class="card-top">
      <div class="card-meta">
        <span class="badge" :class="typeBadgeClass">{{ offer.Type__c || offer.OfferType }}</span>
        <span v-if="offer.Location__c" class="meta-item">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a4.5 4.5 0 0 1 4.5 4.5c0 3.5-4.5 8.5-4.5 8.5S3.5 9.5 3.5 6A4.5 4.5 0 0 1 8 1.5Z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="6" r="1.5" stroke="currentColor" stroke-width="1.5"/></svg>
          {{ offer.Location__c }}
        </span>
        <span v-if="offer.Department__r?.Name" class="meta-item">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="4.5" width="13" height="9" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 4.5V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5" stroke="currentColor" stroke-width="1.5"/></svg>
          {{ offer.Department__r.Name }}
        </span>
      </div>
      <div class="card-arrow">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
    </div>

    <h3 class="card-title">{{ offer.Title__c || offer.Name }}</h3>

    <p v-if="offer.Description__c" class="card-excerpt">
      {{ truncate(offer.Description__c, 110) }}
    </p>

    <div class="card-footer">
      <span v-if="offer.Experience_Min__c" class="footer-tag">
        {{ offer.Experience_Min__c }}y+ exp.
      </span>
      <span v-if="offer.Skills?.length" class="footer-tag">
        {{ offer.Skills.slice(0, 3).map(s => s.Name).join(' · ') }}
        <span v-if="offer.Skills.length > 3" class="footer-more">+{{ offer.Skills.length - 3 }}</span>
      </span>
      <time class="card-date">{{ formatDate(offer.CreatedDate) }}</time>
    </div>
  </article>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  offer: { type: Object, required: true }
})

const TYPE_CLASSES = {
  CDI: 'badge-green',
  CDD: 'badge-amber',
  Internship: 'badge-blue',
  Stage: 'badge-blue',
  Freelance: 'badge-slate'
}
const typeBadgeClass = TYPE_CLASSES[props.offer.Type__c || props.offer.OfferType] ?? 'badge-slate'

function truncate (str, len) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len).trimEnd() + '…' : str
}

function formatDate (iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.offer-card {
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  padding: 22px 24px;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.offer-card:hover {
  border-color: rgba(61,126,255,.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0,0,0,.35), 0 0 0 1px rgba(61,126,255,.1);
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
}

.card-arrow {
  color: var(--text-muted);
  flex-shrink: 0;
  margin-top: 2px;
  transition: color 0.15s, transform 0.15s;
}
.offer-card:hover .card-arrow {
  color: var(--accent);
  transform: translateX(3px);
}

.card-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
  letter-spacing: -0.3px;
}

.card-excerpt {
  font-size: 13.5px;
  color: var(--text-secondary);
  line-height: 1.55;
  flex: 1;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.footer-tag {
  font-size: 11.5px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  background: rgba(255,255,255,.04);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 2px 7px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.footer-more {
  color: var(--accent);
}

.card-date {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}
</style>

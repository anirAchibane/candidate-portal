<template>
  <div class="page-container">
    <router-link
      :to="offerId ? { name: 'JobOfferDetail', params: { id: offerId } } : '/'"
      class="back-link"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M13 8H3M7 4l-4 4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      {{ offerId ? 'Back to offer' : 'All positions' }}
    </router-link>

    <div class="apply-layout">
      <!-- Left: Form -->
      <div class="apply-main">
        <!-- Header -->
        <div class="apply-header">
          <span v-if="general" class="badge badge-slate" style="margin-bottom:14px; display:inline-flex">
            General Application
          </span>
          <span v-else class="badge badge-blue" style="margin-bottom:14px; display:inline-flex">
            Applying to a specific role
          </span>

          <h1 class="apply-title">
            {{ general ? 'Send your application' : 'Apply for this position' }}
          </h1>
          <p class="apply-sub" v-if="loadingOffer">Loading offer details…</p>
          <p class="apply-sub" v-else-if="targetOffer">
            <strong style="color: var(--text-primary)">{{ targetOffer.Title__c || targetOffer.Name }}</strong>
            <span v-if="targetOffer.Department__r?.Name"> · {{ targetOffer.Department__r.Name }}</span>
          </p>
          <p class="apply-sub" v-else>
            Submit your resume and we'll reach out when the right role comes up.
          </p>
        </div>

        <div class="divider"></div>

        <form @submit.prevent="handleSubmit" novalidate>
          <!-- Personal info -->
          <fieldset class="form-section">
            <legend class="form-legend">
              <span class="legend-num">01</span> Your Information
            </legend>

            <div class="fields-grid">
              <div class="field-group">
                <label class="field-label" for="firstName">
                  First name <span class="required">*</span>
                </label>
                <input
                  id="firstName"
                  v-model="form.firstName"
                  type="text"
                  class="field-input"
                  :class="{ 'has-error': errors.firstName }"
                  placeholder="Jean"
                  autocomplete="given-name"
                />
                <span v-if="errors.firstName" class="field-error">{{ errors.firstName }}</span>
              </div>

              <div class="field-group">
                <label class="field-label" for="lastName">
                  Last name <span class="required">*</span>
                </label>
                <input
                  id="lastName"
                  v-model="form.lastName"
                  type="text"
                  class="field-input"
                  :class="{ 'has-error': errors.lastName }"
                  placeholder="Dupont"
                  autocomplete="family-name"
                />
                <span v-if="errors.lastName" class="field-error">{{ errors.lastName }}</span>
              </div>

              <div class="field-group full">
                <label class="field-label" for="email">
                  Email address <span class="required">*</span>
                </label>
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  class="field-input"
                  :class="{ 'has-error': errors.email }"
                  placeholder="jean.dupont@example.com"
                  autocomplete="email"
                />
                <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
              </div>

              <div class="field-group full">
                <label class="field-label" for="phone">
                  Phone number
                  <span class="field-optional">optional</span>
                </label>
                <input
                  id="phone"
                  v-model="form.phone"
                  type="tel"
                  class="field-input"
                  placeholder="+33 6 12 34 56 78"
                  autocomplete="tel"
                />
              </div>
            </div>
          </fieldset>

          <!-- CV Upload -->
          <fieldset class="form-section">
            <legend class="form-legend">
              <span class="legend-num">02</span> Resume / CV
            </legend>

            <div
              class="drop-zone"
              :class="{
                'drop-zone--active': isDragging,
                'drop-zone--filled': cvFile,
                'drop-zone--error': errors.cv,
              }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="onDrop"
              @click="openFilePicker"
            >
              <input
                ref="fileInputRef"
                type="file"
                accept="application/pdf"
                class="file-input-hidden"
                @change="onFileChange"
              />

              <!-- Empty state -->
              <template v-if="!cvFile">
                <div class="dz-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M12 15V3M12 3l-4 4M12 3l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </div>
                <p class="dz-primary">
                  <span class="dz-link">Click to upload</span> or drag and drop
                </p>
                <p class="dz-secondary">PDF only · max 10 MB</p>
              </template>

              <!-- File selected -->
              <template v-else>
                <div class="dz-file-preview">
                  <div class="dz-file-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8L14 2Z" stroke="currentColor" stroke-width="1.5"/>
                      <path d="M14 2v6h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <div class="dz-file-info">
                    <span class="dz-file-name">{{ cvFile.name }}</span>
                    <span class="dz-file-size">{{ formatSize(cvFile.size) }}</span>
                  </div>
                  <button
                    type="button"
                    class="dz-remove"
                    @click.stop="removeFile"
                    title="Remove file"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                  </button>
                </div>
              </template>
            </div>
            <span v-if="errors.cv" class="field-error" style="margin-top: 6px; display:block">{{ errors.cv }}</span>
          </fieldset>

          <!-- Privacy notice -->
          <div class="privacy-notice">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5L2 4v5c0 3.5 2.5 6 6 6.5C14 15 14 9 14 9V4L8 1.5Z" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <p>
              Your data is handled securely. By submitting, you agree that your information
              may be stored in our recruitment system for up to 2 years.
            </p>
          </div>

          <!-- Submit -->
          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary btn-lg"
              :disabled="submitting"
            >
              <span v-if="submitting" class="spinner"></span>
              <template v-else>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8.5L6.5 13 14 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </template>
              {{ submitting ? 'Submitting…' : 'Submit Application' }}
            </button>
            <span v-if="apiError" class="submit-error">{{ apiError }}</span>
          </div>
        </form>
      </div>

      <!-- Right: What happens next -->
      <aside class="apply-sidebar">
        <div class="process-card">
          <h3 class="process-title">What happens next?</h3>
          <ol class="process-steps">
            <li class="process-step">
              <div class="step-icon step-icon--done">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.5 3.5 6.5-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <div>
                <strong>You submit</strong>
                <p>Your resume is uploaded securely.</p>
              </div>
            </li>

            <li class="process-step">
              <div class="step-icon">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 13c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              </div>
              <div>
                <strong>Recruiter review</strong>
                <p>A recruiter looks at your profile and score.</p>
              </div>
            </li>
            <li class="process-step">
              <div class="step-icon">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4Z" stroke="currentColor" stroke-width="1.5"/><path d="M2 4l6 5 6-5" stroke="currentColor" stroke-width="1.5"/></svg>
              </div>
              <div>
                <strong>We'll be in touch</strong>
                <p>Expect an email within 5–7 business days.</p>
              </div>
            </li>
          </ol>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, defineProps } from 'vue'
import { useRouter } from 'vue-router'
import { useApplication, useJobOffer } from '../composables/useApi.js'

const props = defineProps({
  offerId: { type: String, default: null },
  general: { type: Boolean, default: false }
})

const router = useRouter()

// --- Offer details (for sidebar context) ---
const targetOffer = ref(null)
const loadingOffer = ref(false)

if (props.offerId) {
  const { offer, loading, fetchOffer } = useJobOffer(props.offerId)
  loadingOffer.value = loading.value
  onMounted(async () => {
    await fetchOffer()
    targetOffer.value = offer.value
    loadingOffer.value = false
  })
}

// --- Form state ---
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: ''
})

const errors = reactive({})
const cvFile = ref(null)
const isDragging = ref(false)
const fileInputRef = ref(null)

function openFilePicker () {
  fileInputRef.value?.click()
}

function onFileChange (e) {
  const file = e.target.files[0]
  if (file) validateAndSetFile(file)
}

function onDrop (e) {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file) validateAndSetFile(file)
}

function validateAndSetFile (file) {
  if (file.type !== 'application/pdf') {
    errors.cv = 'Only PDF files are accepted.'
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    errors.cv = 'File must be under 10 MB.'
    return
  }
  delete errors.cv
  cvFile.value = file
}

function removeFile () {
  cvFile.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function formatSize (bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// --- Validation ---
function validate () {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.firstName.trim()) errors.firstName = 'First name is required.'
  if (!form.lastName.trim()) errors.lastName = 'Last name is required.'
  if (!form.email.trim()) errors.email = 'Email address is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email.'
  }
  if (!cvFile.value) {
    errors.cv = 'Please upload your resume.'
  }
  return Object.keys(errors).length === 0
}

// --- Submit ---
const { submitting, error: apiError, submitApplication } = useApplication()

async function handleSubmit () {
  if (!validate()) return
  try {
    await submitApplication(cvFile.value, form, props.offerId ?? null)
    router.push({ name: 'ApplicationSuccess' })
  } catch {
    // apiError is already set by composable
  }
}
</script>

<style scoped>
/* ─── Back link ─── */
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
.apply-layout {
  display: grid;
  grid-template-columns: 1fr 290px;
  gap: 3rem;
  align-items: start;
}

/* ─── Header ─── */
.apply-header { margin-bottom: 1.5rem; }

.apply-title {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 3.5vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.6px;
  line-height: 1.15;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.apply-sub {
  font-size: 14.5px;
  color: var(--text-secondary);
}

/* ─── Form sections ─── */
.form-section {
  border: none;
  padding: 0;
  margin-bottom: 2.5rem;
}

.form-legend {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 18px;
}

.legend-num {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent);
  background: var(--accent-glow);
  border: 1px solid rgba(61,126,255,.25);
  border-radius: 4px;
  padding: 2px 6px;
}

/* ─── Fields ─── */
.fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-group.full { grid-column: 1 / -1; }

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 5px;
}

.required { color: var(--danger); }

.field-optional {
  font-size: 11px;
  font-weight: 400;
  color: var(--text-muted);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 1px 5px;
}

.field-input {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 14px;
  padding: 10px 13px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  width: 100%;
}
.field-input::placeholder { color: var(--text-muted); }
.field-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(61,126,255,.12);
}
.field-input.has-error {
  border-color: var(--danger);
  box-shadow: 0 0 0 3px rgba(240,86,86,.1);
}

.field-error {
  font-size: 12px;
  color: var(--danger);
}

/* ─── Drop zone ─── */
.drop-zone {
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  padding: 36px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  text-align: center;
  min-height: 160px;
  position: relative;
}

.file-input-hidden {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
}

.drop-zone:hover,
.drop-zone--active {
  border-color: var(--accent);
  background: rgba(61,126,255,.04);
}

.drop-zone--filled {
  border-style: solid;
  border-color: var(--success);
  background: rgba(34,201,122,.04);
  cursor: default;
}

.drop-zone--error {
  border-color: var(--danger);
}

.dz-icon {
  color: var(--text-muted);
  margin-bottom: 4px;
}

.dz-primary {
  font-size: 14px;
  color: var(--text-secondary);
}

.dz-link {
  color: var(--accent);
  font-weight: 500;
}

.dz-secondary {
  font-size: 12px;
  color: var(--text-muted);
}

.dz-file-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 360px;
}

.dz-file-icon {
  width: 40px; height: 40px;
  background: rgba(34,201,122,.12);
  border: 1px solid rgba(34,201,122,.25);
  border-radius: var(--radius-md);
  display: grid;
  place-items: center;
  color: var(--success);
  flex-shrink: 0;
}

.dz-file-info {
  flex: 1;
  text-align: left;
  overflow: hidden;
}

.dz-file-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dz-file-size {
  font-size: 12px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.dz-remove {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  width: 28px; height: 28px;
  display: grid;
  place-items: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s, border-color 0.15s;
}
.dz-remove:hover { color: var(--danger); border-color: var(--danger); }

/* ─── Privacy notice ─── */
.privacy-notice {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 14px 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  margin-bottom: 2rem;
}
.privacy-notice svg { color: var(--text-muted); flex-shrink: 0; margin-top: 1px; }
.privacy-notice p { font-size: 12.5px; color: var(--text-muted); line-height: 1.5; }

/* ─── Form actions ─── */
.form-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.submit-error {
  font-size: 13px;
  color: var(--danger);
}

/* ─── Spinner ─── */
.spinner {
  width: 15px; height: 15px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── Sidebar process card ─── */
.process-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  position: sticky;
  top: 84px;
}

.process-title {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.process-steps {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
}

.process-steps::before {
  content: '';
  position: absolute;
  left: 14px;
  top: 28px;
  bottom: 28px;
  width: 1px;
  background: var(--border);
}

.process-step {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 0 0 22px;
  position: relative;
}
.process-step:last-child { padding-bottom: 0; }

.step-icon {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  display: grid;
  place-items: center;
  color: var(--text-muted);
  flex-shrink: 0;
  z-index: 1;
}

.step-icon--done {
  background: rgba(34,201,122,.12);
  border-color: rgba(34,201,122,.3);
  color: var(--success);
}

.process-step strong {
  display: block;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.process-step p {
  font-size: 12.5px;
  color: var(--text-secondary);
  line-height: 1.45;
}

/* ─── Responsive ─── */
@media (max-width: 860px) {
  .apply-layout { grid-template-columns: 1fr; }
  .process-card { position: static; order: -1; }
}

@media (max-width: 500px) {
  .fields-grid { grid-template-columns: 1fr; }
  .field-group.full { grid-column: 1; }
}
</style>

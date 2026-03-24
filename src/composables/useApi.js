// composables/useApi.js
// All API calls go through Supabase Edge Functions which proxy to Salesforce

import { ref } from 'vue'

const SUPABASE_URL = process.env.VUE_APP_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VUE_APP_SUPABASE_ANON_KEY

async function callEdgeFunction (fnName, options = {}) {
  const { method = 'GET', body, params } = options

  let url = `${SUPABASE_URL}/functions/v1/${fnName}`
  if (params) {
    url += '?' + new URLSearchParams(params).toString()
  }

  const headers = {
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`
  }

  const fetchOptions = { method, headers }

  if (body instanceof FormData) {
    // Let browser set multipart boundary
    fetchOptions.body = body
  } else if (body) {
    headers['Content-Type'] = 'application/json'
    fetchOptions.body = JSON.stringify(body)
  }

  const res = await fetch(url, fetchOptions)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || 'Request failed')
  }
  return res.json()
}

// --- Job Offers ---

export function useJobOffers () {
  const offers = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchOffers (filters = {}) {
    loading.value = true
    error.value = null
    try {
      const data = await callEdgeFunction('get-job-offers', { params: filters })
      offers.value = data.offers ?? []
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return { offers, loading, error, fetchOffers }
}

export function useJobOffer (id) {
  const offer = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function fetchOffer () {
    loading.value = true
    error.value = null
    try {
      const data = await callEdgeFunction('get-job-offers', { params: { id } })
      offer.value = data.offer ?? null
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return { offer, loading, error, fetchOffer }
}

// --- Application / CV Upload ---

export function useApplication () {
  const submitting = ref(false)
  const error = ref(null)

  /**
   * @param {File} cvFile - the PDF resume
   * @param {Object} candidateInfo - { firstName, lastName, email, phone }
   * @param {string|null} offerId - Salesforce Job Offer ID, or null for general application
   */
  async function submitApplication (cvFile, candidateInfo, offerId = null) {
    submitting.value = true
    error.value = null
    try {
      const form = new FormData()
      form.append('cv', cvFile)
      form.append('firstName', candidateInfo.firstName)
      form.append('lastName', candidateInfo.lastName)
      form.append('email', candidateInfo.email)
      form.append('phone', candidateInfo.phone ?? '')
      if (offerId) form.append('offerId', offerId)

      const data = await callEdgeFunction('submit-application', {
        method: 'POST',
        body: form
      })
      return data
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      submitting.value = false
    }
  }

  return { submitting, error, submitApplication }
}

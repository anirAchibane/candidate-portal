import { createRouter, createWebHistory } from 'vue-router'
import JobOffersView from '../views/JobOffersView.vue'
import JobOfferDetailView from '../views/JobOfferDetailView.vue'
import ApplyView from '../views/ApplyView.vue'
import ApplicationSuccessView from '../views/ApplicationSuccessView.vue'

const routes = [
  {
    path: '/',
    name: 'JobOffers',
    component: JobOffersView
  },
  {
    path: '/offers/:id',
    name: 'JobOfferDetail',
    component: JobOfferDetailView,
    props: true
  },
  {
    path: '/apply',
    name: 'GeneralApply',
    component: ApplyView,
    props: { general: true }
  },
  {
    path: '/apply/:offerId',
    name: 'ApplyToOffer',
    component: ApplyView,
    props: true
  },
  {
    path: '/success',
    name: 'ApplicationSuccess',
    component: ApplicationSuccessView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior () {
    return { top: 0 }
  }
})

export default router

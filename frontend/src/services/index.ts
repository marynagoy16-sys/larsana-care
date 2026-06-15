import { createCrudService } from '@/lib/createCrudService'

export const professionalsService = createCrudService('professionals')
export const initialAssessmentsService = createCrudService('initial_assessments')
export const careCyclesService = createCrudService('care_cycles')
export const careSessionsService = createCrudService('care_sessions')
export const treatmentPausesService = createCrudService('treatment_pauses')
export const medicalRecordsService = createCrudService('medical_records')
export const chargesService = createCrudService('charges')
export const transfersService = createCrudService('transfers')
export const transferQueueService = createCrudService('transfer_queue')
export { demandsService } from '@/services/demands'
export { listPPPatients, getPPPatientDetail, getPPProfessionalCrefito } from '@/services/ppPatients'
export type { DemandListItem } from '@/services/demands'
export { listCareCycles } from '@/services/cycles'
export type { CycleListItem } from '@/services/cycles'
export const demandResponsesService = createCrudService('demand_responses')
export const profilesService = createCrudService('profiles')
export const internalExpensesService = createCrudService('internal_expenses')
export const supportTicketsService = createCrudService('support_tickets')
export const legalTermsService = createCrudService('legal_terms')
export const contractTemplatesService = createCrudService('contract_templates')
export const pricingVersionsService = createCrudService('pricing_matrix_versions')
export const pricingEntriesService = createCrudService('pricing_matrix_entries')
export const npsSurveysService = createCrudService('nps_surveys')
export const notificationsService = createCrudService('notifications')
export const contractsService = createCrudService('contracts')
export const professionalInvoicesService = createCrudService('professional_invoices')
export const delumaExportsService = createCrudService('deluma_exports')
export const lgpdRequestsService = createCrudService('lgpd_requests')
export {
  academyCoursesService,
  getAcademySettings,
  getGateRules,
  getDemandsGateRule,
  getPublishedCourses,
  getCourseWithProgress,
  checkPpPassesGate,
  applyGatePreset,
  previewGateImpact,
} from '@/services/academy'
export {
  larsanapillCategoriesService,
  larsanapillContentsService,
  getPublishedCategories,
  getCategoryContents,
  getWeeklyPlans,
} from '@/services/larsanapill'
export {
  academyAdminKeys,
  larsanapillAdminKeys,
  uploadAcademyMedia,
  listAdminCourses,
  getAdminCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  listAdminModules,
  createModule,
  updateModule,
  deleteModule,
  listAdminLessons,
  getAdminLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  getCourseStats,
  listAdminEnrollments,
  getEnrollmentDetail,
  getAcademyDashboardStats,
  listAdminCategories,
  getAdminCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  listAdminContents,
  getAdminContent,
  createContent,
  updateContent,
  deleteContent,
  listAdminWeeklyPlans,
  createWeeklyPlan,
  updateWeeklyPlan,
  deleteWeeklyPlan,
} from '@/services/academyAdmin'

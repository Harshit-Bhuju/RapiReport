const getBaseUrl = () => {
  const hostname = window.location.hostname;

  // Detect if we are in local development (localhost, 127.0.0.1, or LAN IP)
  // Also support common tunnels like Cloudflare and Ngrok
  const isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".trycloudflare.com") ||
    hostname.endsWith(".ngrok-free.app") ||
    hostname.endsWith(".ngrok.io");

  if (isLocal) {
    // Return relative path to benefit from Vite proxy
    return "/api";
  }

  // Production
  return "https://api.harmanbhuju.com.np/rapireport/backend";
};

export const BASE_URL = getBaseUrl();

const getOcrServiceBaseUrl = () => {
  const hostname = window.location.hostname;
  const isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".trycloudflare.com") ||
    hostname.endsWith(".ngrok-free.app") ||
    hostname.endsWith(".ngrok.io");

  // Local dev uses Vite proxy to FastAPI at http://localhost:8000
  if (isLocal) return "/ocr-api";

  // Production can be configured via env (otherwise OCR service is disabled)
  return import.meta?.env?.VITE_OCR_SERVICE_URL || "";
};

export const OCR_SERVICE_BASE_URL = getOcrServiceBaseUrl();

const API = {
  // Authentication
  GOOGLE_LOGIN: `${BASE_URL}/auth/google_login.php`,
  GET_CURRENT_USER: `${BASE_URL}/auth/get_current_user.php`,
  UPDATE_PROFILE: `${BASE_URL}/auth/update_profile.php`,
  LOGOUT: `${BASE_URL}/auth/logout.php`,

  // Territory/Game APIs
  GET_LEADERBOARD: `${BASE_URL}/api/get_leaderboard.php`,
  UPDATE_LOCATION: `${BASE_URL}/api/update_location.php`,

  // Smart Health Detective (backend-persisted)
  PRESCRIPTIONS_LIST: `${BASE_URL}/health/prescriptions_list.php`,
  PRESCRIPTIONS_CREATE: `${BASE_URL}/health/prescriptions_create.php`,
  PRESCRIPTIONS_DELETE: `${BASE_URL}/health/prescriptions_delete.php`,
  SYMPTOMS_LIST: `${BASE_URL}/health/symptoms_list.php`,

  CHAT: `${BASE_URL}/api/chat.php`,
  CHAT_HISTORY: `${BASE_URL}/api/get_chat_history.php`,
  CHAT_SESSIONS: `${BASE_URL}/api/get_chat_sessions.php`,
  REWARDS_LIST: `${BASE_URL}/health/rewards_list.php`,
  REWARDS_HISTORY: `${BASE_URL}/health/rewards_history.php`,
  REWARDS_REDEEM: `${BASE_URL}/health/rewards_redeem.php`,
  CAMPAIGNS_LIST: `${BASE_URL}/health/campaigns_list.php`,
  CAMPAIGNS_COMPLETE: `${BASE_URL}/health/campaigns_complete.php`,
  ASYNC_CONSULT_SUBMIT: `${BASE_URL}/health/async_consult_submit.php`,
  ASYNC_CONSULT_LIST: `${BASE_URL}/health/async_consult_list.php`,
  AI_PARSE_PRESCRIPTION: `${BASE_URL}/api/ai_parse_prescription.php`,
  DOCTOR_PATIENTS: `${BASE_URL}/health/doctor_patients.php`,
  DOCTOR_PATIENT_TIMELINE: `${BASE_URL}/health/doctor_patient_timeline.php`,
  PRESCRIPTION_STATS: `${BASE_URL}/health/prescription_stats.php`,

  OCR_HISTORY_LIST: `${BASE_URL}/health/ocr_history_list.php`,
  OCR_HISTORY_DELETE: `${BASE_URL}/health/ocr_history_delete.php`,
  OCR_HISTORY_SAVE: `${BASE_URL}/health/ocr_history_save.php`,
  GEMINI_OCR: `${BASE_URL}/api/gemini_ocr.php`,
  GEMINI_ANALYZE_REPORT: `${BASE_URL}/api/gemini_analyze_report.php`,
  AI_ANALYZE_HISTORY: `${BASE_URL}/api/ai_analyze_history.php`,

  // Reports (lab/diagnostic)
  REPORTS_LIST: `${BASE_URL}/health/reports_list.php`,
  REPORTS_GET: `${BASE_URL}/health/reports_get.php`,
  REPORTS_CREATE: `${BASE_URL}/health/reports_create.php`,
  REPORTS_DELETE: `${BASE_URL}/health/reports_delete.php`,

  // Family Planner
  FAMILY_LIST: `${BASE_URL}/health/family_list.php`,
  FAMILY_ADD: `${BASE_URL}/health/family_add.php`,
  FAMILY_REMOVE: `${BASE_URL}/health/family_remove.php`,
  FAMILY_SEARCH: `${BASE_URL}/health/family_search.php`,
  FAMILY_CALL_START: `${BASE_URL}/health/family_call_start.php`,
  FAMILY_CALL_SIGNAL: `${BASE_URL}/health/family_call_signal.php`,
  FAMILY_CALL_INCOMING: `${BASE_URL}/health/family_call_incoming.php`,
  FAMILY_CALL_STATUS: `${BASE_URL}/health/family_call_status.php`,
  FAMILY_CHAT: `${BASE_URL}/health/family_chat.php`,
  FAMILY_MEMBER_HEALTH: `${BASE_URL}/health/family_member_health.php`,

  // Admin
  ADMIN_GET_USERS: `${BASE_URL}/api/admin/get_users.php`,
  ADMIN_GET_ANALYTICS: `${BASE_URL}/api/admin/get_analytics.php`,
  ADMIN_UPDATE_ROLE: `${BASE_URL}/api/admin/update_role.php`,

  // Consultants & Appointments
  CONSULTANTS_LIST: `${BASE_URL}/api/consultants/get_consultants.php`,
  GET_CONSULTANT_PROFILE: `${BASE_URL}/api/consultants/get_consultant_profile.php`,
  USER_APPOINTMENTS: `${BASE_URL}/api/consultants/get_user_appointments.php`,
  DOCTOR_AVAILABILITY: `${BASE_URL}/api/doctor/update_availability.php`,
  DOCTOR_SLOTS: `${BASE_URL}/api/consultants/get_doctor_slots.php`,
  ESEWA_INITIATE: `${BASE_URL}/api/payments/initiate_esewa.php`,
  DOCTOR_TRANSACTIONS: `${BASE_URL}/api/payments/doctor_transactions.php`,

  // Consultation WebRTC
  CONSULTATION_SIGNAL: `${BASE_URL}/api/consultants/consultation_call_signal.php`,
  CONSULTATION_STATUS: `${BASE_URL}/api/consultants/consultation_call_status.php`,
  GET_CONSULTATION_DETAILS: `${BASE_URL}/api/consultants/get_consultation_details.php`,

  // Prescriptions
  SAVE_PRESCRIPTION: `${BASE_URL}/health/prescriptions_create.php`,

  // Optional Python OCR microservice (FastAPI/EasyOCR)
  OCR_UPLOAD: OCR_SERVICE_BASE_URL ? `${OCR_SERVICE_BASE_URL}/upload` : null,
};

export default API;

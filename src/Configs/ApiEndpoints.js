const getBaseUrl = () => {
  const hostname = window.location.hostname;

  // Detect if we are in local development (localhost, 127.0.0.1, or LAN IP)
  const isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.endsWith(".local");

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
    hostname.endsWith(".local");

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
  ADHERENCE_LOGS: `${BASE_URL}/health/adherence_logs.php`,
  ADHERENCE_REMINDERS: `${BASE_URL}/health/adherence_reminders.php`,
  SYMPTOMS_LIST: `${BASE_URL}/health/symptoms_list.php`,
  DIET_LIST: `${BASE_URL}/health/diet_list.php`,
  ACTIVITY_LIST: `${BASE_URL}/health/activity_list.php`,
  CHAT: `${BASE_URL}/api/chat.php`,
  CHAT_HISTORY: `${BASE_URL}/api/get_chat_history.php`,
  REWARDS_LIST: `${BASE_URL}/health/rewards_list.php`,
  REWARDS_REDEEM: `${BASE_URL}/health/rewards_redeem.php`,
  CAMPAIGNS_LIST: `${BASE_URL}/health/campaigns_list.php`,
  CAMPAIGNS_COMPLETE: `${BASE_URL}/health/campaigns_complete.php`,
  ASYNC_CONSULT_SUBMIT: `${BASE_URL}/health/async_consult_submit.php`,
  ASYNC_CONSULT_LIST: `${BASE_URL}/health/async_consult_list.php`,
  AI_PARSE_PRESCRIPTION: `${BASE_URL}/api/ai_parse_prescription.php`,
  DOCTOR_PATIENTS: `${BASE_URL}/health/doctor_patients.php`,
  DOCTOR_PATIENT_TIMELINE: `${BASE_URL}/health/doctor_patient_timeline.php`,
  PRESCRIPTION_STATS: `${BASE_URL}/health/prescription_stats.php`,
  AI_DIET_SUGGESTION: `${BASE_URL}/api/ai_diet_suggestion.php`,
  OCR_HISTORY_LIST: `${BASE_URL}/health/ocr_history_list.php`,
  OCR_HISTORY_DELETE: `${BASE_URL}/health/ocr_history_delete.php`,
  OCR_HISTORY_SAVE: `${BASE_URL}/health/ocr_history_save.php`,
  GEMINI_OCR: `${BASE_URL}/api/gemini_ocr.php`,

  // Family Planner
  FAMILY_LIST: `${BASE_URL}/health/family_list.php`,
  FAMILY_ADD: `${BASE_URL}/health/family_add.php`,
  FAMILY_REMOVE: `${BASE_URL}/health/family_remove.php`,
  FAMILY_SEARCH: `${BASE_URL}/health/family_search.php`,

  // Optional Python OCR microservice (FastAPI/EasyOCR)
  OCR_UPLOAD: OCR_SERVICE_BASE_URL ? `${OCR_SERVICE_BASE_URL}/upload` : null,
};

export default API;

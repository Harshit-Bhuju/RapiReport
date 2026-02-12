const getBaseUrl = () => {
    const hostname = window.location.hostname;

    // Local development
    if (hostname === "localhost" || hostname === "127.0.0.1") {
        return "http://localhost/RapiReport/backend";
    }

    // Production
    return "https://api.harmanbhuju.com.np/rapireport/backend";
};

export const BASE_URL = getBaseUrl();

const API = {
    // Authentication
    GOOGLE_LOGIN: `${BASE_URL}/auth/google_login.php`,
    LOGOUT: `${BASE_URL}/auth/logout.php`,

    // Territory/Game APIs
    GET_LEADERBOARD: `${BASE_URL}/api/get_leaderboard.php`,
    UPDATE_LOCATION: `${BASE_URL}/api/update_location.php`,
};

export default API;

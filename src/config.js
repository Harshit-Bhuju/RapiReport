export const getAIBaseUrl = () => {
    // If we are on localhost, look for the local Python server
    // Otherwise, point to the production Python server subdomain
    if (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
    ) {
        return 'http://localhost:5000';
    }
    return 'https://py.harmanbhuju.com.np';
};

export const getAPIBaseUrl = () => {
    // If we are on localhost, look for the local PHP server
    if (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
    ) {
        return "/api";
    }
    // In production, we assume the API is at /api relative to the domain
    return "/api";
};

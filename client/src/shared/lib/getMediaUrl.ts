const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005/api';

const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export function getMediaUrl(url?: string | null) {
    if (!url) {
        return null;
    }

    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
        return url;
    }

    if (url.startsWith('/uploads/')) {
        return `${API_ORIGIN}${url}`;
    }

    return url;
}
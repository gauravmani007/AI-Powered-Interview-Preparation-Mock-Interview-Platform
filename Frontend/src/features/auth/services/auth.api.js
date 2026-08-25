const API_BASE = "http://localhost:3000/api";

async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        credentials: "include",
        ...options,
        headers: {
            ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data;
}

export async function register({ username, email, password }) {
    return request("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password })
    });
}

export async function login({ email, password }) {
    return request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
    });
}

export async function logout() {
    return request("/auth/logout");
}

export async function getMe() {
    return request("/auth/get-me");
}
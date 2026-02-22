/**
 * GitHub Notifications OAuth + proxy worker (v2)
 *
 * Routes:
 *   POST /           – exchange OAuth code for access_token
 *   POST /mark-read  – proxy PATCH /notifications/threads/{threadId}
 *   POST /mark-all-read – proxy PUT /notifications (mark all as read)
 *   OPTIONS *        – CORS preflight
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: CORS_HEADERS,
      });
    }

    const url = new URL(request.url);

    // Route: POST /mark-read
    if (url.pathname === "/mark-read") {
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: "Invalid request" }, 400);
      }

      const { threadId, token } = body;
      if (!threadId) return jsonResponse({ error: "Missing `threadId`" }, 400);
      if (!token)    return jsonResponse({ error: "Missing `token`" }, 400);

      try {
        const res = await fetch(
          `https://api.github.com/notifications/threads/${threadId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Length": "0",
            },
          }
        );
        return jsonResponse({ success: res.ok });
      } catch {
        return jsonResponse({ error: "Upstream request failed" }, 502);
      }
    }

    // Route: POST /mark-all-read
    if (url.pathname === "/mark-all-read") {
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: "Invalid request" }, 400);
      }

      const { token } = body;
      if (!token) return jsonResponse({ error: "Missing `token`" }, 400);

      try {
        const res = await fetch("https://api.github.com/notifications", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Length": "0",
          },
        });
        return jsonResponse({ success: res.ok });
      } catch {
        return jsonResponse({ error: "Upstream request failed" }, 502);
      }
    }

    // Route: POST / – OAuth code exchange
    try {
      const { code } = await request.json();
      if (!code) {
        return jsonResponse({ error: "Missing `code`" }, 400);
      }

      const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const data = await response.json();

      if (data.error) {
        return jsonResponse({ error: data.error_description || "OAuth failed" }, 400);
      }

      return jsonResponse({ access_token: data.access_token });
    } catch {
      return jsonResponse({ error: "Invalid request" }, 400);
    }
  },
};

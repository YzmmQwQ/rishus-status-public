/**
 * Pages Function: 代理 API 请求到 Worker
 */

export async function onRequest({ request, env }) {
    try {
        const workerRequest = new Request(request, {
            headers: request.headers
        });

        const response = await env['rishus-status-worker'].fetch(workerRequest);
        return response;
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

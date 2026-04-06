/**
 * Pages Function: 代理 API 请求到 Worker
 * 在 Pages 设置中绑定 Worker 服务后生效
 */

export async function onRequest({ request, env }) {
    const url = new URL(request.url);

    // 转发到 Worker
    const workerRequest = new Request(request, {
        headers: request.headers
    });

    // 调用绑定的 Worker
    return env['rishus-status-worker'].fetch(workerRequest);
}

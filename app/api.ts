export async function api(path: string, body?: any, method?: string) {
  const response = await fetch("/api" + path, {
    method: method || (body === undefined ? "GET" : "POST"),
    headers: { "Content-Type": "application/json", "X-Studio-Request": "1" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}
export const go = (path: string) => {
  location.hash = "/" + path;
};
export const media = (assetId: string) => `/api/assets/${assetId}/preview`;

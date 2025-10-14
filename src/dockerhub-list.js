import process from "process";
import 'dotenv/config';

const HUB = "https://hub.docker.com";

async function getJwt(username, password) {
  if (!username || !password) return null;

  const res = await fetch(`${HUB}/v2/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Docker Hub login failed: ${res.status} ${txt}`);
  }
  const data = await res.json();
  return data.token;
}

async function fetchJson(url, jwt) {
  const headers = { Accept: "application/json" };
  if (jwt) headers.Authorization = `JWT ${jwt}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Request failed ${res.status} for ${url}\n${txt}`);
  }
  return res.json();
}

async function *paginate(url, jwt) {
  let next = url;
  while (next) {
    const page = await fetchJson(next, jwt);
    if (Array.isArray(page.results)) yield page.results;
    next = page.next;
  }
}

export async function listAllDockerHubImages({
  namespace = process.env.DOCKERHUB_NAMESPACE,
  username = process.env.DOCKERHUB_USERNAME,
  password = process.env.DOCKERHUB_PASSWORD, 
  pageSize = 100,
} = {}) {
  if (!namespace) {
    throw new Error("Set DOCKERHUB_NAMESPACE or pass { namespace }");
  }

  const jwt = await getJwt(username, password).catch((e) => {
    console.warn(String(e));
    return null;
  });

  const repoUrl = `${HUB}/v2/repositories/${encodeURIComponent(namespace)}/?page_size=${pageSize}`;
  const repos = [];
  for await (const results of paginate(repoUrl, jwt)) {
    for (const r of results) {
      repos.push(r.name);
    }
  }

  const images = [];
  for (const repo of repos) {
    const tagsUrl = `${HUB}/v2/repositories/${encodeURIComponent(namespace)}/${encodeURIComponent(repo)}/tags?page_size=${pageSize}`;
    for await (const results of paginate(tagsUrl, jwt)) {
      for (const t of results) {
        images.push(`${repo}:${t.name}`);
      }
    }
  }

  images.sort((a, b) => a.localeCompare(b));
  return images;
}

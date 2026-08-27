import type { APIRoute } from "astro";

export const prerender = false;

const API_BASE =
  "https://api-kodepos.linkq.workers.dev/api/kode-pos";

const SITE_URL =
  "https://pos-kode.pages.dev";

export const GET: APIRoute = async () => {
  try {
    const res = await fetch(
      `${API_BASE}/provinsi`
    );

    if (!res.ok) {
      throw new Error(
        `Provinsi API HTTP ${res.status}`
      );
    }

    const json = await res.json();
    const provinces = json.data || [];

    const sitemaps = provinces.flatMap(
      (province: any) => {
        const slug = slugify(province.name);

        if (!slug) return [];

        return [
          `${SITE_URL}/sitemap-kode-pos-${slug}.xml`,
          `${SITE_URL}/sitemap-sedot-wc-${slug}.xml`,
        ];
      }
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (url: string) =>
      `  <sitemap><loc>${escapeXml(url)}</loc></sitemap>`
  )
  .join("\n")}
</sitemapindex>`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type":
          "application/xml; charset=utf-8",
        "Cache-Control":
          "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error(
      "SITEMAP INDEX ERROR:",
      error
    );

    return new Response(
      "Sitemap index gagal dibuat",
      {
        status: 500,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      }
    );
  }
};

function slugify(value: string) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

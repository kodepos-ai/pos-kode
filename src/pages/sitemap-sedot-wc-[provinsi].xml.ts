import type { APIRoute } from "astro";

export const prerender = false;

const API_BASE =
  "https://api-kodepos.linkq.workers.dev/api/kode-pos";

const SITE_URL =
  "https://pos-kode.pages.dev";

export const GET: APIRoute = async ({
  params,
}) => {
  try {
    const provinsi = params.provinsi;

    if (!provinsi) {
      return new Response("Provinsi tidak ditemukan", {
        status: 404,
      });
    }

    const provincesRes = await fetch(
      `${API_BASE}/provinsi`
    );

    if (!provincesRes.ok) {
      throw new Error("Gagal mengambil provinsi");
    }

    const provincesJson =
      await provincesRes.json();

    const province = (provincesJson.data || []).find(
      (item: any) =>
        slugify(item.name) === provinsi
    );

    if (!province) {
      return new Response("Provinsi tidak ditemukan", {
        status: 404,
      });
    }

    const urls: string[] = [];

    const citiesRes = await fetch(
      `${API_BASE}/kota?prov_id=${encodeURIComponent(
        province.id
      )}`
    );

    if (citiesRes.ok) {
      const citiesJson =
        await citiesRes.json();

      for (const city of citiesJson.data || []) {
        const citySlug = slugify(city.name);

        if (!citySlug) continue;

        const districtsRes = await fetch(
          `${API_BASE}/kecamatan?city_id=${encodeURIComponent(
            city.id
          )}`
        );

        if (!districtsRes.ok) continue;

        const districtsJson =
          await districtsRes.json();

        for (const district of districtsJson.data || []) {
          const districtSlug =
            slugify(district.name);

          if (!districtSlug) continue;

          urls.push(
            `${SITE_URL}/sedot-wc/${provinsi}/${citySlug}/${districtSlug}/`
          );
        }
      }
    }

    return sitemapResponse(urls);
  } catch (error) {
    console.error(
      "SEDOT WC SITEMAP ERROR:",
      error
    );

    return new Response(
      "Sitemap Sedot WC gagal dibuat",
      {
        status: 500,
      }
    );
  }
};

function sitemapResponse(urls: string[]) {
  const uniqueUrls = [...new Set(urls)];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls
  .map(
    (url) =>
      `  <url><loc>${escapeXml(url)}</loc></url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type":
        "application/xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=3600, s-maxage=86400",
    },
  });
}

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

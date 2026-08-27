import type { APIRoute } from "astro";

export const prerender = false;

const API_BASE =
  "https://api-kodepos.linkq.workers.dev/api/kode-pos";

const SITE_URL =
  "https://pos-kode.pages.dev";

export const GET: APIRoute = async ({ locals }) => {
  try {
    const urls: string[] = [];

    // =========================
    // 1. PROVINSI
    // =========================
    const provincesRes = await fetch(
      `${API_BASE}/provinsi`
    );

    if (!provincesRes.ok) {
      throw new Error(
        `Provinsi API HTTP ${provincesRes.status}`
      );
    }

    const provincesJson = await provincesRes.json();
    const provinces = provincesJson.data || [];

    // =========================
    // 2. PROSES SETIAP PROVINSI
    // =========================
    for (const province of provinces) {
      const provinceSlug = slugify(province.name);

      if (!provinceSlug) continue;

      // Kode Pos Provinsi
      urls.push(
        `${SITE_URL}/kode-pos/${provinceSlug}/`
      );

      // =========================
      // KOTA
      // =========================
      const citiesRes = await fetch(
        `${API_BASE}/kota?prov_id=${encodeURIComponent(
          province.id
        )}`
      );

      if (!citiesRes.ok) continue;

      const citiesJson = await citiesRes.json();
      const cities = citiesJson.data || [];

      for (const city of cities) {
        const citySlug = slugify(city.name);

        if (!citySlug) continue;

        // Kode Pos Kota
        urls.push(
          `${SITE_URL}/kode-pos/${provinceSlug}/${citySlug}/`
        );

        // =========================
        // KECAMATAN
        // =========================
        const districtsRes = await fetch(
          `${API_BASE}/kecamatan?city_id=${encodeURIComponent(
            city.id
          )}`
        );

        if (!districtsRes.ok) continue;

        const districtsJson =
          await districtsRes.json();

        const districts =
          districtsJson.data || [];

        for (const district of districts) {
          const districtSlug =
            slugify(district.name);

          if (!districtSlug) continue;

          // =========================
          // KODE POS
          // =========================
          urls.push(
            `${SITE_URL}/kode-pos/${provinceSlug}/${citySlug}/${districtSlug}/`
          );

          // =========================
          // SEDOT WC
          // =========================
          urls.push(
            `${SITE_URL}/sedot-wc/${provinceSlug}/${citySlug}/${districtSlug}/`
          );
        }
      }
    }

    // Hilangkan URL duplikat
    const uniqueUrls = [...new Set(urls)];

    const today =
      new Date().toISOString().split("T")[0];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
${uniqueUrls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${today}</lastmod>
  </url>`
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
  } catch (error) {
    console.error(
      "SITEMAP ERROR:",
      error
    );

    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<error>Sitemap gagal dibuat</error>`,
      {
        status: 500,
        headers: {
          "Content-Type":
            "application/xml; charset=utf-8",
        },
      }
    );
  }
};

// =====================================
// SLUG
// =====================================
function slugify(value: string) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// =====================================
// XML ESCAPE
// =====================================
function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

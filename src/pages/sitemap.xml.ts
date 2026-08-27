import type { APIRoute } from "astro";

const API_BASE =
  "https://api-kodepos.linkq.workers.dev/api/kode-pos";

const SITE_URL = "https://kodepos.linkqb.com";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const provincesRes = await fetch(
      `${API_BASE}/provinsi`
    );

    if (!provincesRes.ok) {
      throw new Error("Gagal mengambil provinsi");
    }

    const provincesJson = await provincesRes.json();
    const provinces = provincesJson.data || [];

    const urls: string[] = [];

    // =========================
    // KODE POS
    // =========================

    urls.push(`${SITE_URL}/`);
    urls.push(`${SITE_URL}/kode-pos/`);
    urls.push(`${SITE_URL}/kode-pos/cari/`);

    for (const province of provinces) {
      const provinceSlug = slugify(province.name);

      urls.push(
        `${SITE_URL}/kode-pos/${provinceSlug}/`
      );

      const citiesRes = await fetch(
        `${API_BASE}/kota?prov_id=${encodeURIComponent(province.id)}`
      );

      if (!citiesRes.ok) continue;

      const citiesJson = await citiesRes.json();
      const cities = citiesJson.data || [];

      for (const city of cities) {
        const citySlug = slugify(city.name);

        urls.push(
          `${SITE_URL}/kode-pos/${provinceSlug}/${citySlug}/`
        );

        const districtsRes = await fetch(
          `${API_BASE}/kecamatan?city_id=${encodeURIComponent(city.id)}`
        );

        if (!districtsRes.ok) continue;

        const districtsJson = await districtsRes.json();
        const districts = districtsJson.data || [];

        for (const district of districts) {
          const districtSlug = slugify(district.name);

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

    const uniqueUrls = [...new Set(urls)];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
${uniqueUrls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url)}</loc>
  </url>`
  )
  .join("\n")}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("SITEMAP ERROR:", error);

    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      {
        status: 500,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
        },
      }
    );
  }
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

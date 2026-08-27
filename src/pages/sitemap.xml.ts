import type { APIRoute } from "astro";

const API_BASE =
  "https://api-kodepos.linkq.workers.dev/api/kode-pos";

const SITE_URL = "https://kodepos.linkqb.com";

export const prerender = false;

export const GET: APIRoute = async () => {
  const urls = new Set<string>();

  urls.add(`${SITE_URL}/`);
  urls.add(`${SITE_URL}/kode-pos/`);
  urls.add(`${SITE_URL}/kode-pos/cari/`);
  urls.add(`${SITE_URL}/sedot-wc/`);

  try {
    // =========================
    // PROVINSI
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

    for (const province of provinces) {
      const provinceSlug = slugify(province.name);

      urls.add(
        `${SITE_URL}/kode-pos/${provinceSlug}/`
      );

      // =========================
      // KOTA / KABUPATEN
      // =========================

      const citiesRes = await fetch(
        `${API_BASE}/kota?prov_id=${encodeURIComponent(
          province.id
        )}`
      );

      if (!citiesRes.ok) {
        console.error(
          "CITY API ERROR:",
          province.name,
          citiesRes.status
        );
        continue;
      }

      const citiesJson = await citiesRes.json();
      const cities = citiesJson.data || [];

      for (const city of cities) {
        const citySlug = slugify(city.name);

        urls.add(
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

        if (!districtsRes.ok) {
          console.error(
            "DISTRICT API ERROR:",
            city.name,
            districtsRes.status
          );
          continue;
        }

        const districtsJson = await districtsRes.json();
        const districts = districtsJson.data || [];

        for (const district of districts) {
          const districtSlug = slugify(
            district.name
          );

          // KODE POS
          urls.add(
            `${SITE_URL}/kode-pos/${provinceSlug}/${citySlug}/${districtSlug}/`
          );

          // SEDOT WC
          urls.add(
            `${SITE_URL}/sedot-wc/${provinceSlug}/${citySlug}/${districtSlug}/`
          );
        }
      }
    }
  } catch (error) {
    console.error("SITEMAP ERROR:", error);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...urls]
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

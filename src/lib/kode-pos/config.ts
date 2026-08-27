const API_BASE =
  "https://api-kodepos.linkq.workers.dev/api/kode-pos";

export type Province = {
  id?: string;
  prov_id: string;
  name: string;
  slug: string;
};

export type City = {
  id?: string;
  city_id: string;
  prov_id: string;
  name: string;
  slug: string;
};

export type District = {
  id?: string;
  dis_id: string;
  city_id: string;
  name: string;
  slug: string;
};

export type PostalCode = {
  id?: string;
  dis_id: string;
  name: string;
  postal_code: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "dan")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Kode Pos API ${response.status}: ${url}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Kode Pos API error:", error);
    return null;
  }
}

/**
 * API helper utama.
 */
export async function kodePosApi<T = unknown>(
  endpoint = ""
): Promise<T | null> {
  return fetchJson<T>(`${API_BASE}${endpoint}`);
}

/**
 * URL halaman Kode Pos.
 *
 * Contoh:
 * /kode-pos/
 * /kode-pos/jawa-barat/
 * /kode-pos/jawa-barat/bandung/
 * /kode-pos/jawa-barat/bandung/arcamanik/
 */
export function kodePosUrl(
  provinsi?: string,
  kota?: string,
  kecamatan?: string
) {
  const parts = [
    "kode-pos",
    provinsi,
    kota,
    kecamatan,
  ].filter(Boolean);

  return (
    "/" +
    parts
      .map((part) => encodeURIComponent(part as string))
      .join("/") +
    "/"
  );
}

/**
 * Provinsi
 *
 * Endpoint:
 * /api/kode-pos/provinsi
 */
export async function getProvinces(): Promise<Province[]> {
  const result = await kodePosApi<{
    data: Array<{
      id: string;
      name: string;
    }>;
  }>("/provinsi");

  return (result?.data ?? []).map((item) => ({
    id: item.id,
    prov_id: item.id,
    name: item.name,
    slug: slugify(item.name),
  }));
}

/**
 * Cari provinsi berdasarkan slug.
 */
export async function resolveProvince(
  slug: string
): Promise<Province | undefined> {
  const provinces = await getProvinces();

  return provinces.find(
    (province) => province.slug === slug
  );
}

/**
 * Kabupaten / Kota
 *
 * Endpoint:
 * /api/kode-pos/kota?prov_id=...
 */
export async function getCities(
  _locals: App.Locals,
  provId: string
): Promise<City[]> {
  const result = await kodePosApi<{
    data?: Array<{
      id?: string;
      prov_id?: string;
      name?: string;
    }>;
  }>(`/kota?prov_id=${encodeURIComponent(provId)}`);

  return (result?.data ?? [])
    .filter((item) => item.id && item.name)
    .map((item) => ({
      id: item.id,
      city_id: item.id!,
      prov_id: item.prov_id ?? provId,
      name: item.name!,
      slug: slugify(item.name!),
    }));
}

/**
 * Cari kota berdasarkan slug.
 */
export async function resolveCity(
  province: Province,
  slug: string
): Promise<City | undefined> {
  const cities = await getCities(
    province.prov_id
  );

  return cities.find(
    (city) => city.slug === slug
  );
}

/**
 * Kecamatan
 *
 * Endpoint:
 * /api/kode-pos/kecamatan?city_id=...
 */
export async function getDistricts(
  _locals: App.Locals,
  cityId: string
): Promise<District[]> {
  const result = await kodePosApi<{
    data?: Array<{
      id?: string;
      city_id?: string;
      name?: string;
    }>;
  }>(`/kecamatan?city_id=${encodeURIComponent(cityId)}`);

  return (result?.data ?? [])
    .filter((item) => item.id && item.name)
    .map((item) => ({
      id: item.id,
      dis_id: item.id!,
      city_id: item.city_id ?? cityId,
      name: item.name!,
      slug: slugify(item.name!),
    }));
}
/**
 * Cari kecamatan berdasarkan slug.
 */
export async function resolveDistrict(
  city: City,
  slug: string
): Promise<District | undefined> {
  const districts = await getDistricts(
    city.city_id
  );

  return districts.find(
    (district) => district.slug === slug
  );
}

/**
 * Kelurahan / Desa + Kode Pos
 *
 * Endpoint:
 * /api/kode-pos/kelurahan?dis_id=...
 */
export async function getPostalCodes(
  _locals: App.Locals,
  disId: string
): Promise<PostalCode[]> {
  const result = await kodePosApi<{
    data?: Array<{
      id?: string;
      dis_id?: string;
      name: string;
      postal_code: string;
    }>;
  }>(
    `/kelurahan?dis_id=${encodeURIComponent(disId)}`
  );

  return (result?.data ?? []).map((item) => ({
    id: item.id,
    dis_id: item.dis_id ?? disId,
    name: item.name,
    postal_code: item.postal_code,
  }));
}

/**
 * Alias untuk kompatibilitas API lama.
 */
export async function getSubdistricts(
  disId: string
): Promise<PostalCode[]> {
  return getPostalCodes(disId);
}

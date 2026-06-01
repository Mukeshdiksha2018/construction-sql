/** Shared country list (ISO 3166-1 alpha-2) — used by corporations and customers. */
export type CountryRecord = {
  code: string;
  name: string;
  currency: string;
  symbol: string;
};

export const COUNTRIES: CountryRecord[] = [
  {
    "code": "US",
    "name": "United States",
    "currency": "USD",
    "symbol": "$"
  },
  {
    "code": "CA",
    "name": "Canada",
    "currency": "CAD",
    "symbol": "C$"
  },
  {
    "code": "GB",
    "name": "United Kingdom",
    "currency": "GBP",
    "symbol": "£"
  },
  {
    "code": "DE",
    "name": "Germany",
    "currency": "EUR",
    "symbol": "€"
  },
  {
    "code": "FR",
    "name": "France",
    "currency": "EUR",
    "symbol": "€"
  },
  {
    "code": "IT",
    "name": "Italy",
    "currency": "EUR",
    "symbol": "€"
  },
  {
    "code": "ES",
    "name": "Spain",
    "currency": "EUR",
    "symbol": "€"
  },
  {
    "code": "AU",
    "name": "Australia",
    "currency": "AUD",
    "symbol": "A$"
  },
  {
    "code": "JP",
    "name": "Japan",
    "currency": "JPY",
    "symbol": "¥"
  },
  {
    "code": "CN",
    "name": "China",
    "currency": "CNY",
    "symbol": "¥"
  },
  {
    "code": "IN",
    "name": "India",
    "currency": "INR",
    "symbol": "₹"
  },
  {
    "code": "BR",
    "name": "Brazil",
    "currency": "BRL",
    "symbol": "R$"
  },
  {
    "code": "MX",
    "name": "Mexico",
    "currency": "MXN",
    "symbol": "$"
  },
  {
    "code": "RU",
    "name": "Russia",
    "currency": "RUB",
    "symbol": "₽"
  },
  {
    "code": "KR",
    "name": "South Korea",
    "currency": "KRW",
    "symbol": "₩"
  },
  {
    "code": "SG",
    "name": "Singapore",
    "currency": "SGD",
    "symbol": "S$"
  },
  {
    "code": "HK",
    "name": "Hong Kong",
    "currency": "HKD",
    "symbol": "HK$"
  },
  {
    "code": "CH",
    "name": "Switzerland",
    "currency": "CHF",
    "symbol": "CHF"
  },
  {
    "code": "SE",
    "name": "Sweden",
    "currency": "SEK",
    "symbol": "kr"
  },
  {
    "code": "NO",
    "name": "Norway",
    "currency": "NOK",
    "symbol": "kr"
  },
  {
    "code": "DK",
    "name": "Denmark",
    "currency": "DKK",
    "symbol": "kr"
  },
  {
    "code": "NL",
    "name": "Netherlands",
    "currency": "EUR",
    "symbol": "€"
  },
  {
    "code": "BE",
    "name": "Belgium",
    "currency": "EUR",
    "symbol": "€"
  },
  {
    "code": "AT",
    "name": "Austria",
    "currency": "EUR",
    "symbol": "€"
  },
  {
    "code": "IE",
    "name": "Ireland",
    "currency": "EUR",
    "symbol": "€"
  },
  {
    "code": "PT",
    "name": "Portugal",
    "currency": "EUR",
    "symbol": "€"
  },
  {
    "code": "FI",
    "name": "Finland",
    "currency": "EUR",
    "symbol": "€"
  },
  {
    "code": "GR",
    "name": "Greece",
    "currency": "EUR",
    "symbol": "€"
  },
  {
    "code": "PL",
    "name": "Poland",
    "currency": "PLN",
    "symbol": "zł"
  },
  {
    "code": "CZ",
    "name": "Czech Republic",
    "currency": "CZK",
    "symbol": "Kč"
  },
  {
    "code": "HU",
    "name": "Hungary",
    "currency": "HUF",
    "symbol": "Ft"
  },
  {
    "code": "RO",
    "name": "Romania",
    "currency": "RON",
    "symbol": "lei"
  },
  {
    "code": "BG",
    "name": "Bulgaria",
    "currency": "BGN",
    "symbol": "лв"
  },
  {
    "code": "HR",
    "name": "Croatia",
    "currency": "EUR",
    "symbol": "€"
  },
  {
    "code": "SI",
    "name": "Slovenia",
    "currency": "EUR",
    "symbol": "€"
  },
  {
    "code": "SK",
    "name": "Slovakia",
    "currency": "EUR",
    "symbol": "€"
  },
  {
    "code": "LT",
    "name": "Lithuania",
    "currency": "EUR",
    "symbol": "€"
  },
  {
    "code": "LV",
    "name": "Latvia",
    "currency": "EUR",
    "symbol": "€"
  },
  {
    "code": "EE",
    "name": "Estonia",
    "currency": "EUR",
    "symbol": "€"
  },
  {
    "code": "CY",
    "name": "Cyprus",
    "currency": "EUR",
    "symbol": "€"
  },
  {
    "code": "MT",
    "name": "Malta",
    "currency": "EUR",
    "symbol": "€"
  },
  {
    "code": "LU",
    "name": "Luxembourg",
    "currency": "EUR",
    "symbol": "€"
  },
  {
    "code": "ZA",
    "name": "South Africa",
    "currency": "ZAR",
    "symbol": "R"
  },
  {
    "code": "EG",
    "name": "Egypt",
    "currency": "EGP",
    "symbol": "£"
  },
  {
    "code": "NG",
    "name": "Nigeria",
    "currency": "NGN",
    "symbol": "₦"
  },
  {
    "code": "KE",
    "name": "Kenya",
    "currency": "KES",
    "symbol": "KSh"
  },
  {
    "code": "GH",
    "name": "Ghana",
    "currency": "GHS",
    "symbol": "₵"
  },
  {
    "code": "MA",
    "name": "Morocco",
    "currency": "MAD",
    "symbol": "د.م."
  },
  {
    "code": "TN",
    "name": "Tunisia",
    "currency": "TND",
    "symbol": "د.ت"
  },
  {
    "code": "DZ",
    "name": "Algeria",
    "currency": "DZD",
    "symbol": "د.ج"
  },
  {
    "code": "LY",
    "name": "Libya",
    "currency": "LYD",
    "symbol": "ل.د"
  },
  {
    "code": "SD",
    "name": "Sudan",
    "currency": "SDG",
    "symbol": "ج.س."
  },
  {
    "code": "ET",
    "name": "Ethiopia",
    "currency": "ETB",
    "symbol": "Br"
  },
  {
    "code": "UG",
    "name": "Uganda",
    "currency": "UGX",
    "symbol": "USh"
  },
  {
    "code": "TZ",
    "name": "Tanzania",
    "currency": "TZS",
    "symbol": "TSh"
  },
  {
    "code": "ZW",
    "name": "Zimbabwe",
    "currency": "ZWL",
    "symbol": "Z$"
  },
  {
    "code": "BW",
    "name": "Botswana",
    "currency": "BWP",
    "symbol": "P"
  },
  {
    "code": "NA",
    "name": "Namibia",
    "currency": "NAD",
    "symbol": "N$"
  },
  {
    "code": "SZ",
    "name": "Eswatini",
    "currency": "SZL",
    "symbol": "L"
  },
  {
    "code": "LS",
    "name": "Lesotho",
    "currency": "LSL",
    "symbol": "L"
  },
  {
    "code": "MW",
    "name": "Malawi",
    "currency": "MWK",
    "symbol": "MK"
  },
  {
    "code": "ZM",
    "name": "Zambia",
    "currency": "ZMW",
    "symbol": "ZK"
  },
  {
    "code": "AO",
    "name": "Angola",
    "currency": "AOA",
    "symbol": "Kz"
  },
  {
    "code": "MZ",
    "name": "Mozambique",
    "currency": "MZN",
    "symbol": "MT"
  },
  {
    "code": "MG",
    "name": "Madagascar",
    "currency": "MGA",
    "symbol": "Ar"
  },
  {
    "code": "MU",
    "name": "Mauritius",
    "currency": "MUR",
    "symbol": "₨"
  },
  {
    "code": "SC",
    "name": "Seychelles",
    "currency": "SCR",
    "symbol": "₨"
  },
  {
    "code": "KM",
    "name": "Comoros",
    "currency": "KMF",
    "symbol": "CF"
  },
  {
    "code": "DJ",
    "name": "Djibouti",
    "currency": "DJF",
    "symbol": "Fdj"
  },
  {
    "code": "SO",
    "name": "Somalia",
    "currency": "SOS",
    "symbol": "S"
  },
  {
    "code": "ER",
    "name": "Eritrea",
    "currency": "ERN",
    "symbol": "Nfk"
  },
  {
    "code": "SS",
    "name": "South Sudan",
    "currency": "SSP",
    "symbol": "£"
  },
  {
    "code": "CF",
    "name": "Central African Republic",
    "currency": "XAF",
    "symbol": "FCFA"
  },
  {
    "code": "TD",
    "name": "Chad",
    "currency": "XAF",
    "symbol": "FCFA"
  },
  {
    "code": "CM",
    "name": "Cameroon",
    "currency": "XAF",
    "symbol": "FCFA"
  },
  {
    "code": "GQ",
    "name": "Equatorial Guinea",
    "currency": "XAF",
    "symbol": "FCFA"
  },
  {
    "code": "GA",
    "name": "Gabon",
    "currency": "XAF",
    "symbol": "FCFA"
  },
  {
    "code": "CG",
    "name": "Congo",
    "currency": "XAF",
    "symbol": "FCFA"
  },
  {
    "code": "CD",
    "name": "Democratic Republic of the Congo",
    "currency": "CDF",
    "symbol": "FC"
  },
  {
    "code": "ST",
    "name": "São Tomé and Príncipe",
    "currency": "STN",
    "symbol": "Db"
  },
  {
    "code": "GW",
    "name": "Guinea-Bissau",
    "currency": "XOF",
    "symbol": "CFA"
  },
  {
    "code": "GN",
    "name": "Guinea",
    "currency": "GNF",
    "symbol": "FG"
  },
  {
    "code": "SL",
    "name": "Sierra Leone",
    "currency": "SLE",
    "symbol": "Le"
  },
  {
    "code": "LR",
    "name": "Liberia",
    "currency": "LRD",
    "symbol": "L$"
  },
  {
    "code": "CI",
    "name": "Côte d'Ivoire",
    "currency": "XOF",
    "symbol": "CFA"
  },
  {
    "code": "TG",
    "name": "Togo",
    "currency": "XOF",
    "symbol": "CFA"
  },
  {
    "code": "BJ",
    "name": "Benin",
    "currency": "XOF",
    "symbol": "CFA"
  },
  {
    "code": "NE",
    "name": "Niger",
    "currency": "XOF",
    "symbol": "CFA"
  },
  {
    "code": "BF",
    "name": "Burkina Faso",
    "currency": "XOF",
    "symbol": "CFA"
  },
  {
    "code": "ML",
    "name": "Mali",
    "currency": "XOF",
    "symbol": "CFA"
  },
  {
    "code": "SN",
    "name": "Senegal",
    "currency": "XOF",
    "symbol": "CFA"
  },
  {
    "code": "GM",
    "name": "Gambia",
    "currency": "GMD",
    "symbol": "D"
  },
  {
    "code": "CV",
    "name": "Cape Verde",
    "currency": "CVE",
    "symbol": "$"
  },
  {
    "code": "MR",
    "name": "Mauritania",
    "currency": "MRU",
    "symbol": "UM"
  },
  {
    "code": "AR",
    "name": "Argentina",
    "currency": "ARS",
    "symbol": "$"
  },
  {
    "code": "CL",
    "name": "Chile",
    "currency": "CLP",
    "symbol": "$"
  },
  {
    "code": "CO",
    "name": "Colombia",
    "currency": "COP",
    "symbol": "$"
  },
  {
    "code": "PE",
    "name": "Peru",
    "currency": "PEN",
    "symbol": "S/"
  },
  {
    "code": "VE",
    "name": "Venezuela",
    "currency": "VES",
    "symbol": "Bs.S"
  },
  {
    "code": "UY",
    "name": "Uruguay",
    "currency": "UYU",
    "symbol": "$U"
  },
  {
    "code": "PY",
    "name": "Paraguay",
    "currency": "PYG",
    "symbol": "₲"
  },
  {
    "code": "BO",
    "name": "Bolivia",
    "currency": "BOB",
    "symbol": "Bs"
  },
  {
    "code": "EC",
    "name": "Ecuador",
    "currency": "USD",
    "symbol": "$"
  },
  {
    "code": "GY",
    "name": "Guyana",
    "currency": "GYD",
    "symbol": "G$"
  },
  {
    "code": "SR",
    "name": "Suriname",
    "currency": "SRD",
    "symbol": "$"
  },
  {
    "code": "FK",
    "name": "Falkland Islands",
    "currency": "FKP",
    "symbol": "£"
  },
  {
    "code": "GF",
    "name": "French Guiana",
    "currency": "EUR",
    "symbol": "€"
  }
];

const CODE_SET = new Set(COUNTRIES.map((c) => c.code));
const NAME_TO_CODE = new Map(
  COUNTRIES.map((c) => [c.name.trim().toLowerCase(), c.code])
);

export function findCountryByCode(code?: string | null): CountryRecord | undefined {
  if (!code) return undefined;
  return COUNTRIES.find((c) => c.code === code.toUpperCase());
}

export function getCountrySelectOptions() {
  return COUNTRIES.map((country) => ({
    label: country.name,
    value: country.code,
    currency: country.currency,
    symbol: country.symbol,
  }));
}

export function getCurrencyFromCountryCode(countryCode: string) {
  const country = findCountryByCode(countryCode);
  return country
    ? { currency: country.currency, symbol: country.symbol }
    : null;
}

/** Normalize free-text or ISO input to a valid ISO alpha-2 code, or empty string. */
export function normalizeCountryCode(value?: string | null): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";

  const upper = trimmed.toUpperCase();
  if (upper.length === 2 && CODE_SET.has(upper)) return upper;

  const byName = NAME_TO_CODE.get(trimmed.toLowerCase());
  if (byName) return byName;

  return "";
}

/** API-safe country field: empty string or valid ISO code; throws on invalid non-empty input. */
export function sanitizeCustomerCountry(
  value?: string | null,
  options?: { allowEmpty?: boolean }
): string {
  const allowEmpty = options?.allowEmpty !== false;
  const normalized = normalizeCountryCode(value);
  const raw = String(value ?? "").trim();

  if (!raw) return allowEmpty ? "" : normalized;

  if (normalized) return normalized;

  throw new Error(
    "Invalid customer_country. Use an ISO 3166-1 alpha-2 code (e.g. US, CA) from the country list."
  );
}

export function isValidCountryCode(value?: string | null): boolean {
  return normalizeCountryCode(value).length === 2;
}

const COUNTRY_TO_CURRENCY = {
  IN: "INR",
  US: "USD",
  DE: "EUR",
  AE: "AED",
  GB: "GBP",
  CA: "CAD",
};

export const getCurrencyFromCountry = (countryCode) => {
  return COUNTRY_TO_CURRENCY[countryCode] || "USD";
};

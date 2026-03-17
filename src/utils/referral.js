export const generateReferralCode = (name) => {
  const clean = name.replace(/\s/g, "").toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${clean}${random}`;
};

export const maxPriceCents = 9_999_999;

export function formatMoney(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPriceInput(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 7);
  if (digits === "") {
    return "";
  }
  return formatMoney(Math.min(Number(digits), maxPriceCents));
}

export function formatStoredPrice(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") {
    return "";
  }
  const amount = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(amount) || amount < 0) {
    return "";
  }
  return formatMoney(Math.min(Math.round(amount * 100), maxPriceCents));
}

export function priceToApi(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits === "") {
    return "";
  }
  return (Number(digits) / 100).toFixed(2);
}

export function formatBrl(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "R$ 0,00";
  }
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

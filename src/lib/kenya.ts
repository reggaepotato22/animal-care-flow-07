export const formatKES = (amount: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    currencyDisplay: "symbol",
    maximumFractionDigits: 2,
  }).format(amount);

export const commonBreedsKE: Record<"dog" | "cat", string[]> = {
  dog: [
    "German Shepherd",
    "Rottweiler",
    "Labrador Retriever",
    "Golden Retriever",
    "Doberman",
    "Chihuahua",
    "Local (Mixed)",
  ],
  cat: ["Domestic Short Hair", "Siamese", "Persian", "Maine Coon", "Local (Mixed)"],
};

export function mpesaStkPushPlaceholder(args: {
  phone: string;
  amount: number;
  accountReference: string;
  description?: string;
}) {
  console.log("[M-Pesa STK Placeholder]", args);
  return Promise.resolve({ ok: true });
}


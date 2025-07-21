"use server";

interface CoinGeckoPriceResponse {
  [key: string]: {
    usd: number;
  };
}

export async function getCoinPrices() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=dogecoin,litecoin,bitcoin-cash&vs_currencies=usd",
      {
        next: { revalidate: 60 * 15 }, // Revalidate every 15 minutes
      }
    );

    if (!response.ok) {
      console.error(
        "Failed to fetch prices from CoinGecko:",
        response.statusText
      );
      return {
        dogecoin: 0,
        litecoin: 0,
        bitcoin_cash: 0,
      };
    }

    const data: CoinGeckoPriceResponse = await response.json();

    return {
      dogecoin: data.dogecoin?.usd || 0,
      litecoin: data.litecoin?.usd || 0,
      bitcoin_cash: data["bitcoin-cash"]?.usd || 0,
    };
  } catch (error) {
    console.error("Error fetching CoinGecko prices:", error);
    return {
      dogecoin: 0,
      litecoin: 0,
      bitcoin_cash: 0,
    };
  }
}

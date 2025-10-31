import { db } from "../db";
import {
  currencies,
  exchangeRates,
  exchangeRateHistory,
  type ExchangeRate,
  type InsertExchangeRate,
  type InsertExchangeRateHistory,
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * Exchange Rate Service
 * Handles fetching, storing, and retrieving exchange rates
 * Uses exchangerate-api.com (free tier) for fetching live rates
 */

const EXCHANGE_RATE_API_URL = "https://api.exchangerate-api.com/v4/latest";
const BASE_CURRENCY = "USD"; // Use USD as base for all conversions

interface ExchangeRateApiResponse {
  base: string;
  date: string;
  time_last_updated: number;
  rates: {
    [currencyCode: string]: number;
  };
}

export class ExchangeRateService {
  /**
   * Fetch latest exchange rates from API
   * @param baseCurrency - Base currency code (default: USD)
   * @returns Exchange rates object
   */
  async fetchLatestRates(baseCurrency: string = BASE_CURRENCY): Promise<ExchangeRateApiResponse> {
    try {
      console.log(`📡 Fetching exchange rates for base currency: ${baseCurrency}`);
      
      const response = await fetch(`${EXCHANGE_RATE_API_URL}/${baseCurrency}`);
      
      if (!response.ok) {
        throw new Error(`Exchange rate API returned status: ${response.status}`);
      }

      const data: ExchangeRateApiResponse = await response.json();
      console.log(`✅ Fetched ${Object.keys(data.rates).length} exchange rates`);
      
      return data;
    } catch (error) {
      console.error("❌ Error fetching exchange rates:", error);
      throw new Error("Failed to fetch exchange rates from API");
    }
  }

  /**
   * Update exchange rates in database
   * Fetches latest rates and stores them in both current and history tables
   */
  async updateExchangeRates(): Promise<void> {
    try {
      console.log("🔄 Starting exchange rate update...");
      
      const ratesData = await this.fetchLatestRates(BASE_CURRENCY);
      const effectiveDate = new Date(ratesData.time_last_updated * 1000);

      // Get list of active currencies from our database
      const activeCurrencies = await db
        .select()
        .from(currencies)
        .where(eq(currencies.isActive, true));

      const currencyCodes = activeCurrencies.map((c) => c.code);

      let updatedCount = 0;
      let historyCount = 0;

      for (const [targetCurrency, rate] of Object.entries(ratesData.rates)) {
        // Only process currencies that are in our supported list
        if (!currencyCodes.includes(targetCurrency)) {
          continue;
        }

        // Update or insert current exchange rate
        const existingRate = await db
          .select()
          .from(exchangeRates)
          .where(
            and(
              eq(exchangeRates.baseCurrency, BASE_CURRENCY),
              eq(exchangeRates.targetCurrency, targetCurrency)
            )
          )
          .limit(1);

        const rateData: InsertExchangeRate = {
          baseCurrency: BASE_CURRENCY,
          targetCurrency: targetCurrency,
          rate: rate.toString(),
          effectiveDate: effectiveDate,
          source: "exchangerate-api.com",
        };

        if (existingRate.length > 0) {
          // Update existing rate
          await db
            .update(exchangeRates)
            .set({
              rate: rate.toString(),
              effectiveDate: effectiveDate,
              updatedAt: new Date(),
            })
            .where(eq(exchangeRates.id, existingRate[0].id));
        } else {
          // Insert new rate
          await db.insert(exchangeRates).values(rateData);
        }
        updatedCount++;

        // Store in history
        const historyData: InsertExchangeRateHistory = {
          baseCurrency: BASE_CURRENCY,
          targetCurrency: targetCurrency,
          rate: rate.toString(),
          effectiveDate: effectiveDate,
          source: "exchangerate-api.com",
        };
        await db.insert(exchangeRateHistory).values(historyData);
        historyCount++;
      }

      console.log(`✅ Updated ${updatedCount} exchange rates`);
      console.log(`✅ Added ${historyCount} history records`);
    } catch (error) {
      console.error("❌ Error updating exchange rates:", error);
      throw error;
    }
  }

  /**
   * Get current exchange rate between two currencies
   * @param from - Source currency code
   * @param to - Target currency code
   * @returns Exchange rate
   */
  async getExchangeRate(from: string, to: string): Promise<number> {
    try {
      // If same currency, return 1
      if (from === to) {
        return 1;
      }

      // If converting from base currency
      if (from === BASE_CURRENCY) {
        const rate = await db
          .select()
          .from(exchangeRates)
          .where(
            and(
              eq(exchangeRates.baseCurrency, BASE_CURRENCY),
              eq(exchangeRates.targetCurrency, to)
            )
          )
          .limit(1);

        if (rate.length === 0) {
          throw new Error(`Exchange rate not found for ${from}/${to}`);
        }

        return parseFloat(rate[0].rate);
      }

      // If converting to base currency
      if (to === BASE_CURRENCY) {
        const rate = await db
          .select()
          .from(exchangeRates)
          .where(
            and(
              eq(exchangeRates.baseCurrency, BASE_CURRENCY),
              eq(exchangeRates.targetCurrency, from)
            )
          )
          .limit(1);

        if (rate.length === 0) {
          throw new Error(`Exchange rate not found for ${from}/${to}`);
        }

        return 1 / parseFloat(rate[0].rate);
      }

      // Cross-currency conversion (via USD)
      const fromRate = await this.getExchangeRate(BASE_CURRENCY, from);
      const toRate = await this.getExchangeRate(BASE_CURRENCY, to);

      return toRate / fromRate;
    } catch (error) {
      console.error(`❌ Error getting exchange rate for ${from}/${to}:`, error);
      throw error;
    }
  }

  /**
   * Convert amount from one currency to another
   * @param amount - Amount to convert
   * @param from - Source currency code
   * @param to - Target currency code
   * @returns Converted amount
   */
  async convertAmount(amount: number, from: string, to: string): Promise<number> {
    const rate = await this.getExchangeRate(from, to);
    return amount * rate;
  }

  /**
   * Get historical exchange rate for a specific date
   * @param from - Source currency code
   * @param to - Target currency code
   * @param date - Date for which to get the rate
   * @returns Exchange rate
   */
  async getHistoricalRate(from: string, to: string, date: Date): Promise<number> {
    try {
      // If same currency, return 1
      if (from === to) {
        return 1;
      }

      // Get rate from history table closest to the specified date
      const historicalRate = await db
        .select()
        .from(exchangeRateHistory)
        .where(
          and(
            eq(exchangeRateHistory.baseCurrency, BASE_CURRENCY),
            eq(exchangeRateHistory.targetCurrency, to),
            sql`${exchangeRateHistory.effectiveDate} <= ${date}`
          )
        )
        .orderBy(desc(exchangeRateHistory.effectiveDate))
        .limit(1);

      if (historicalRate.length === 0) {
        // If no historical rate found, use current rate
        console.warn(`No historical rate found for ${from}/${to} on ${date}, using current rate`);
        return await this.getExchangeRate(from, to);
      }

      // If converting from base currency
      if (from === BASE_CURRENCY) {
        return parseFloat(historicalRate[0].rate);
      }

      // If converting to base currency
      if (to === BASE_CURRENCY) {
        return 1 / parseFloat(historicalRate[0].rate);
      }

      // Cross-currency conversion
      const fromRate = await this.getHistoricalRate(BASE_CURRENCY, from, date);
      const toRate = parseFloat(historicalRate[0].rate);

      return toRate / fromRate;
    } catch (error) {
      console.error(`❌ Error getting historical rate for ${from}/${to}:`, error);
      throw error;
    }
  }

  /**
   * Get all current exchange rates
   * @returns Array of exchange rates
   */
  async getAllExchangeRates(): Promise<ExchangeRate[]> {
    return await db.select().from(exchangeRates).orderBy(exchangeRates.targetCurrency);
  }

  /**
   * Get supported currencies
   * @returns Array of active currencies
   */
  async getSupportedCurrencies() {
    return await db
      .select()
      .from(currencies)
      .where(eq(currencies.isActive, true))
      .orderBy(currencies.code);
  }
}

// Export singleton instance
export const exchangeRateService = new ExchangeRateService();

import { exchangeRateService } from "./exchangeRateService";

/**
 * Currency Converter Utility
 * Provides helper functions for currency conversion and formatting
 */

export interface ConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  targetCurrency: string;
  exchangeRate: number;
  convertedAt: Date;
}

export interface FormattedAmount {
  amount: number;
  currency: string;
  symbol: string;
  formatted: string;
}

const CURRENCY_SYMBOLS: { [key: string]: string } = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  AUD: "A$",
  CAD: "C$",
  JPY: "¥",
  CNY: "¥",
  CHF: "CHF",
  SGD: "S$",
  HKD: "HK$",
  NZD: "NZ$",
  SEK: "kr",
  KRW: "₩",
  NOK: "kr",
  MXN: "$",
  BRL: "R$",
  ZAR: "R",
  AED: "د.إ",
  SAR: "﷼",
};

export class CurrencyConverter {
  /**
   * Convert amount from one currency to another
   * @param amount - Amount to convert
   * @param fromCurrency - Source currency code
   * @param toCurrency - Target currency code
   * @returns Conversion result with details
   */
  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<ConversionResult> {
    const exchangeRate = await exchangeRateService.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = amount * exchangeRate;

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: this.roundToCurrency(convertedAmount, toCurrency),
      targetCurrency: toCurrency,
      exchangeRate: exchangeRate,
      convertedAt: new Date(),
    };
  }

  /**
   * Convert amount using historical exchange rate
   * @param amount - Amount to convert
   * @param fromCurrency - Source currency code
   * @param toCurrency - Target currency code
   * @param date - Historical date
   * @returns Conversion result
   */
  async convertHistorical(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    date: Date
  ): Promise<ConversionResult> {
    const exchangeRate = await exchangeRateService.getHistoricalRate(
      fromCurrency,
      toCurrency,
      date
    );
    const convertedAmount = amount * exchangeRate;

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: this.roundToCurrency(convertedAmount, toCurrency),
      targetCurrency: toCurrency,
      exchangeRate: exchangeRate,
      convertedAt: date,
    };
  }

  /**
   * Convert multiple amounts in batch
   * @param conversions - Array of conversion requests
   * @returns Array of conversion results
   */
  async convertBatch(
    conversions: Array<{
      amount: number;
      from: string;
      to: string;
    }>
  ): Promise<ConversionResult[]> {
    const results: ConversionResult[] = [];

    for (const conversion of conversions) {
      const result = await this.convert(conversion.amount, conversion.from, conversion.to);
      results.push(result);
    }

    return results;
  }

  /**
   * Format amount with currency symbol
   * @param amount - Amount to format
   * @param currency - Currency code
   * @param locale - Locale for formatting (default: en-US)
   * @returns Formatted amount object
   */
  formatAmount(amount: number, currency: string, locale: string = "en-US"): FormattedAmount {
    const symbol = this.getCurrencySymbol(currency);
    const decimalPlaces = this.getDecimalPlaces(currency);
    const roundedAmount = this.roundToCurrency(amount, currency);

    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(roundedAmount);

    return {
      amount: roundedAmount,
      currency: currency,
      symbol: symbol,
      formatted: formatted,
    };
  }

  /**
   * Get currency symbol
   * @param currency - Currency code
   * @returns Currency symbol
   */
  getCurrencySymbol(currency: string): string {
    return CURRENCY_SYMBOLS[currency] || currency;
  }

  /**
   * Get decimal places for currency
   * @param currency - Currency code
   * @returns Number of decimal places
   */
  getDecimalPlaces(currency: string): number {
    // Japanese Yen and Korean Won don't use decimal places
    if (currency === "JPY" || currency === "KRW") {
      return 0;
    }
    return 2;
  }

  /**
   * Round amount to appropriate decimal places for currency
   * @param amount - Amount to round
   * @param currency - Currency code
   * @returns Rounded amount
   */
  roundToCurrency(amount: number, currency: string): number {
    const decimalPlaces = this.getDecimalPlaces(currency);
    const multiplier = Math.pow(10, decimalPlaces);
    return Math.round(amount * multiplier) / multiplier;
  }

  /**
   * Convert invoice/financial document to target currency
   * Converts all monetary fields in an object
   * @param document - Document with monetary fields
   * @param fromCurrency - Source currency
   * @param toCurrency - Target currency
   * @param monetaryFields - Array of field names to convert
   * @returns Document with converted amounts
   */
  async convertDocument<T extends Record<string, any>>(
    document: T,
    fromCurrency: string,
    toCurrency: string,
    monetaryFields: (keyof T)[]
  ): Promise<T> {
    const exchangeRate = await exchangeRateService.getExchangeRate(fromCurrency, toCurrency);
    const converted = { ...document };

    for (const field of monetaryFields) {
      if (typeof document[field] === "number") {
        converted[field] = this.roundToCurrency(
          document[field] * exchangeRate,
          toCurrency
        ) as T[keyof T];
      } else if (typeof document[field] === "string") {
        const numValue = parseFloat(document[field] as string);
        if (!isNaN(numValue)) {
          converted[field] = this.roundToCurrency(
            numValue * exchangeRate,
            toCurrency
          ).toString() as T[keyof T];
        }
      }
    }

    return converted;
  }

  /**
   * Calculate total in base currency from mixed currency amounts
   * @param amounts - Array of {amount, currency} objects
   * @param baseCurrency - Target base currency
   * @returns Total in base currency
   */
  async calculateTotalInBaseCurrency(
    amounts: Array<{ amount: number; currency: string }>,
    baseCurrency: string
  ): Promise<number> {
    let total = 0;

    for (const item of amounts) {
      const converted = await this.convert(item.amount, item.currency, baseCurrency);
      total += converted.convertedAmount;
    }

    return this.roundToCurrency(total, baseCurrency);
  }

  /**
   * Check if currency is supported
   * @param currency - Currency code
   * @returns Boolean indicating if currency is supported
   */
  async isCurrencySupported(currency: string): Promise<boolean> {
    const supportedCurrencies = await exchangeRateService.getSupportedCurrencies();
    return supportedCurrencies.some((c) => c.code === currency);
  }

  /**
   * Get exchange rate between two currencies
   * @param from - Source currency
   * @param to - Target currency
   * @returns Exchange rate
   */
  async getRate(from: string, to: string): Promise<number> {
    return await exchangeRateService.getExchangeRate(from, to);
  }

  /**
   * Format exchange rate for display
   * @param from - Source currency
   * @param to - Target currency
   * @param rate - Exchange rate
   * @returns Formatted rate string
   */
  formatExchangeRate(from: string, to: string, rate: number): string {
    const decimalPlaces = this.getDecimalPlaces(to);
    return `1 ${from} = ${rate.toFixed(decimalPlaces)} ${to}`;
  }
}

// Export singleton instance
export const currencyConverter = new CurrencyConverter();

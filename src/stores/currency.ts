import { defineStore } from 'pinia';
import { currencyService } from '@/services/currency/currency.service';
import type { Currency } from '@/types';

export const useCurrencyStore = defineStore('currency', {
  state: () => {
    // Basic defaults in case API fails
    const usd = {
      id: 1,
      code: 'USD',
      country: 'USA',
      currency: 'US Dollar',
      symbol: '$',
      thousandSeparator: ',',
      decimalSeparator: '.',
      exchangeRate: 1,
      isDefault: true,
      status: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      activeCurrency: usd as Currency | null,
      availableCurrencies: [usd] as Currency[],
      isLoading: false,
      error: null as string | null,
    };
  },

  getters: {
    currentSymbol: (state) => state.activeCurrency?.symbol || '$',
    currentCode: (state) => state.activeCurrency?.code || 'USD',
    currentRate: (state) => state.activeCurrency?.exchangeRate || 1,
  },

  actions: {
    async fetchCurrencies() {
      this.isLoading = true;
      try {
        const response = await currencyService.getAll();
        if (response.success && response.data && response.data.length > 0) {
          this.availableCurrencies = response.data.filter(c => c.status);
          
          // Selection Logic:
          // 1. Check localStorage for user preference
          // 2. If not in localStorage, look for the currency marked 'isDefault' in the API
          // 3. Fallback to the first available currency
          
          const savedId = localStorage.getItem('stock_pos_currency_id');
          if (savedId) {
            const saved = this.availableCurrencies.find(c => c.id === parseInt(savedId));
            if (saved) {
              this.activeCurrency = saved;
            }
          }
          
          if (!this.activeCurrency) {
            const defaultCurrency = this.availableCurrencies.find(c => c.isDefault);
            if (defaultCurrency) {
              this.activeCurrency = defaultCurrency;
            } else if (this.availableCurrencies.length > 0) {
              this.activeCurrency = this.availableCurrencies[0];
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch currencies:', err);
        this.error = err.message || 'Failed to fetch currencies';
      } finally {
        this.isLoading = false;
      }
    },

    setCurrency(currency: Currency) {
      this.activeCurrency = currency;
      localStorage.setItem('stock_pos_currency_id', currency.id.toString());
    }
  }
});

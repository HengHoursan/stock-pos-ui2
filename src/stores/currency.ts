import { defineStore } from 'pinia';
import { currencyService } from '@/services/currency/currency.service';
import type { Currency } from '@/types';

export const useCurrencyStore = defineStore('currency', {
  state: () => {
    const usd = {
      id: 1,
      code: 'USD',
      country: 'USA',
      currency: 'US Dollar',
      symbol: '$',
      thousandSeparator: ',',
      decimalSeparator: '.',
      status: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const khr = {
      id: 2,
      code: 'KHR',
      country: 'Cambodia',
      currency: 'Riel',
      symbol: '៛',
      thousandSeparator: ',',
      decimalSeparator: '.',
      status: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      activeCurrency: usd as Currency | null,
      availableCurrencies: [usd, khr] as Currency[],
      isLoading: false,
      error: null as string | null,
    };
  },

  getters: {
    currentSymbol: (state) => state.activeCurrency?.symbol || '$',
    currentCode: (state) => state.activeCurrency?.code || 'USD',
  },

  actions: {
    async fetchCurrencies() {
      this.isLoading = true;
      try {
        const response = await currencyService.getAll();
        if (response.success && response.data && response.data.length > 0) {
          this.availableCurrencies = response.data.filter(c => c.status);
        }
        
        // Initial selection from localStorage
        const savedId = localStorage.getItem('stock_pos_currency_id');
        if (savedId) {
          const saved = this.availableCurrencies.find(c => c.id === parseInt(savedId));
          if (saved) {
            this.activeCurrency = saved;
          }
        }
        
        // Fallback to first one if none selected
        if (!this.activeCurrency && this.availableCurrencies.length > 0) {
          this.activeCurrency = this.availableCurrencies[0];
        }
      } catch (err: any) {
        console.error('Failed to fetch currencies:', err);
        this.error = err.message || 'Failed to fetch currencies';
        
        // Ensure we still have an active currency even on error
        if (!this.activeCurrency && this.availableCurrencies.length > 0) {
          this.activeCurrency = this.availableCurrencies[0];
        }
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

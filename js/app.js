angular
  .module('ExtensionApp', [])
  .constant('APIKEY', '87107fde87c9952fb7d1b9655538cd32')
  .constant('ENDPOINT', 'http://apilayer.net/api/live')
  .constant('CURRENCIES', ['USD', 'EUR', 'CAD', 'AUD', 'GBP', 'SGD', 'HKD', 'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AWG', 'AZN', 'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BOB', 'BRL', 'BSD', 'BTN', 'BWP', 'BYR', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY', 'COP', 'CRC', 'CUC', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP', 'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GHS', 'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HRK', 'HTG', 'HUF', 'IDR', 'ILS', 'INR', 'IQD', 'IRR', 'ISK', 'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KGS', 'KHR', 'KMF', 'KPW', 'KRW', 'KWD', 'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MUR', 'MVR', 'MWK', 'MXN', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLL', 'SOS', 'SRD', 'SVC', 'SYP', 'SZL', 'THB', 'TJS', 'TMT', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'UYU', 'UZS', 'VEF', 'VND', 'VUV', 'WST', 'XAF', 'XCD', 'XDR', 'YER', 'ZAR', 'ZMW', 'ZWL'])
  .constant('CACHELIMIT', 604800) /* 7 * 24 * 60 * 60 = 7 days */

  // Controller
  .controller('PopupController', function($q, $http, $timeout, CURRENCIES, APIKEY, ENDPOINT) {
    var self = this;


    // Functino to focus input field
    self.init = function() {
      $timeout(function() {
        var inputElement = document.querySelector('input[type="number"]');
        if (inputElement) {
          inputElement.focus();
        }
      }, 100);  // Delay slightly to ensure the popup is fully loaded
    };
    // Select box with supported currencies
    this.currencies = {
      from: CURRENCIES,
      to: []
    };

    // Chosen currencies
    this.selector = {
      from: '---',
      to: '---'
    };

    // Function to store selected currencies in chrome.storage
    function storeSelectedCurrencies() {
      chrome.storage.local.set({
        fromCurrency: self.selector.from,
        toCurrency: self.selector.to
      }, function() {
        console.log('Stored: ', self.selector.from, self.selector.to);
      });
    }

    // Function to load previously stored currencies
    function loadSelectedCurrencies() {
      chrome.storage.local.get(['fromCurrency', 'toCurrency'], function(result) {
        if (result.fromCurrency && result.toCurrency) {
          console.log('Loaded: ', result.fromCurrency, result.toCurrency);

          self.selector.from = result.fromCurrency;
          self.selector.to = result.toCurrency;

          // Update "to" currency options based on selected "from" currency
          self.currencies.to = CURRENCIES.filter(function(currency) {
            return currency !== self.selector.from;
          });

          self.readyToConvert = isSettedUp(self.selector);

          // Automatically convert after loading
          if (self.readyToConvert) {
            self.toConvert = 1;
            convert(self.toConvert, self.selector.from, self.selector.to);
          }
        }
      });
    }

    // Load saved currencies when the controller is initialized
    loadSelectedCurrencies();

    this.onBaseChange = function() {
      var newBase = this.selector.from;

      this.currencies.to = CURRENCIES.filter(function(currency) {
        return currency != newBase;
      });

      this.readyToConvert = isSettedUp(this.selector);

      if (this.readyToConvert === true) {
        this.toConvert = 1;
        convert(this.toConvert, this.selector.from, this.selector.to);
        storeSelectedCurrencies(); // Save to storage
      }
    };

    this.onDestChange = function() {
      this.readyToConvert = isSettedUp(this.selector);

      if (this.readyToConvert === true) {
        this.toConvert = 1;
        convert(this.toConvert, this.selector.from, this.selector.to);
        storeSelectedCurrencies(); // Save to storage
      }
    };

    this.convert = function() {
      var readyToConvert = isSettedUp(this.selector);
    
      // Ensure 'this.rate' is defined before accessing 'this.rate.value'
      if (this.rate && this.rate.value !== null) {
        var convertible = true;
      } else {
        var convertible = false;
      }
    
      if (readyToConvert && convertible) {
        this.result = this.toConvert * this.rate.value;
      }
    };
    

    // Function to reverse the selected currencies
    this.reverseCurrencies = function() {
      var temp = self.selector.from;
      self.selector.from = self.selector.to;
      self.selector.to = temp;

      self.currencies.to = CURRENCIES.filter(function(currency) {
        return currency != self.selector.from;
      });

      if (isSettedUp(self.selector)) {
        convert(self.toConvert, self.selector.from, self.selector.to);
        storeSelectedCurrencies(); // Save the reversed selection to storage
      }
    };

    // Utility function to check if the selection is ready
    function isSettedUp(selector) {
      return selector.from !== '---' && selector.to !== '---';
    }

    // Fetch data and calculate the conversion
    function fetchData() {
      var config = {
        headers: {},
        params: {
          access_key: APIKEY,
          currencies: CURRENCIES.join(','),
          source: 'USD',
          format: 1
        }
      };
      return $http.get(ENDPOINT, config);
    }

    function convert(amount, from, to) {
      self.result = undefined;
      self.rate = {
        value: 0,
        lastUpdate: 'in progress ...'
      };

      fetchData()
        .then(function(response) {
          var rates = response.data;

          self.rate = {
            value: computeRates(rates.quotes, from, to),
            lastUpdate: rates.timestamp * 1000,
            source: response.config.url
          };

          self.result = amount * self.rate.value;
        });
    }

    function computeRates(rates, from, to) {
      if (from === 'USD') {
        return rates['USD' + to];
      } else if (to === 'USD') {
        return 1 / rates['USD' + from];
      } else {
        return rates['USD' + to] / rates['USD' + from];
      }
    }
  });

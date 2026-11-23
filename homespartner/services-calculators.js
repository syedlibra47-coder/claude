(function () {
  function fmtAED(n) {
    return 'AED ' + Math.round(n).toLocaleString('en-US');
  }
  function fmtPct(n) {
    return n.toFixed(1) + '%';
  }

  // ----- Rental Yield Calculator -----
  const ryPrice = document.getElementById('ry_price');
  const ryRent = document.getElementById('ry_rent');
  const ryExpenses = document.getElementById('ry_expenses');
  if (ryPrice && ryRent && ryExpenses) {
    function updateRentalYield() {
      const price = Number(ryPrice.value) || 0;
      const rent = Number(ryRent.value) || 0;
      const expenses = Number(ryExpenses.value) || 0;
      const grossYield = price > 0 ? (rent / price) * 100 : 0;
      const netIncome = rent - expenses;
      const netYield = price > 0 ? (netIncome / price) * 100 : 0;
      document.getElementById('ry_grossYield').textContent = fmtPct(grossYield);
      document.getElementById('ry_netYield').textContent = fmtPct(netYield);
      document.getElementById('ry_netIncome').textContent = fmtAED(netIncome);
    }
    [ryPrice, ryRent, ryExpenses].forEach(el => el.addEventListener('input', updateRentalYield));
    updateRentalYield();
  }

  // ----- Buy vs Rent Calculator -----
  const bvrPrice = document.getElementById('bvr_price');
  const bvrDownPct = document.getElementById('bvr_downPct');
  const bvrRate = document.getElementById('bvr_rate');
  const bvrTerm = document.getElementById('bvr_term');
  const bvrRent = document.getElementById('bvr_rent');
  const bvrYears = document.getElementById('bvr_years');

  if (bvrPrice && bvrDownPct && bvrRate && bvrTerm && bvrRent && bvrYears) {
    // Standard amortization: monthly payment, and remaining balance after k payments.
    function monthlyPayment(principal, annualRatePct, termYears) {
      const r = (annualRatePct / 100) / 12;
      const n = termYears * 12;
      if (r === 0) return principal / n;
      return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    }
    function remainingBalance(principal, annualRatePct, termYears, paymentsMade) {
      const r = (annualRatePct / 100) / 12;
      const n = termYears * 12;
      const k = Math.min(paymentsMade, n);
      if (r === 0) return principal * (1 - k / n);
      return principal * (Math.pow(1 + r, n) - Math.pow(1 + r, k)) / (Math.pow(1 + r, n) - 1);
    }

    function updateBuyVsRent() {
      const price = Number(bvrPrice.value) || 0;
      const downPct = Number(bvrDownPct.value);
      const rate = Number(bvrRate.value);
      const term = Number(bvrTerm.value);
      const rent = Number(bvrRent.value) || 0;
      const years = Number(bvrYears.value);

      document.getElementById('bvr_downPctLabel').textContent = downPct + '%';
      document.getElementById('bvr_rateLabel').textContent = rate.toFixed(2) + '%';
      document.getElementById('bvr_termLabel').textContent = term + ' yrs';
      document.getElementById('bvr_yearsLabel').textContent = years + ' yrs';

      const downPayment = price * (downPct / 100);
      const loanAmount = price - downPayment;
      const closingCosts = price * 0.06; // approx. DLD transfer fee (4%) + agency commission (2%)
      const payment = monthlyPayment(loanAmount, rate, term);
      const monthsOwned = Math.min(years * 12, term * 12);

      const buyTotal = downPayment + closingCosts + (payment * monthsOwned);
      const rentTotal = rent * 12 * years;

      const balanceAfter = remainingBalance(loanAmount, rate, term, monthsOwned);
      const principalPaid = loanAmount - balanceAfter;
      const equity = downPayment + principalPaid;

      document.getElementById('bvr_buyTotal').textContent = fmtAED(buyTotal);
      document.getElementById('bvr_rentTotal').textContent = fmtAED(rentTotal);
      document.getElementById('bvr_equity').textContent = fmtAED(equity);
    }
    [bvrPrice, bvrDownPct, bvrRate, bvrTerm, bvrRent, bvrYears].forEach(el => el.addEventListener('input', updateBuyVsRent));
    updateBuyVsRent();
  }
})();

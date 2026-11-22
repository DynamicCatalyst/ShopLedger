'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// These fixtures use only in-memory order/item values. Keep both hsn (checkout's
// tax lookup) and gstRate (invoice's tax lookup) on every line.
const cases = [
  {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Toor dal', sku: 'GRN-002', hsn: '0713', gstRate: 5, price: 165, qty: 2 },
      { name: 'Ghee', sku: 'DRY-001', hsn: '0405', gstRate: 12, price: 450, qty: 1 }
    ],
    expectedCheckout: { subtotal: 780, discount: 0, tax: 70.5, cgst: 35.25, sgst: 35.25, total: 850.5, gstPercents: [5, 12], lineGrosses: [330, 450], lineTaxes: [16.5, 54] }
  },
  {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', sku: 'GRN-001', hsn: '1006', gstRate: 5, price: 640, qty: 1 },
      { name: 'Ghee', sku: 'DRY-001', hsn: '0405', gstRate: 12, price: 450, qty: 1 }
    ],
    expectedCheckout: { subtotal: 1090, discount: 109, tax: 77.4, cgst: 38.7, sgst: 38.7, total: 1058.4, gstPercents: [5, 12], lineGrosses: [640, 450], lineTaxes: [28.8, 48.6] }
  },
  {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { name: 'Groundnut oil', sku: 'OIL-002', hsn: '1508', gstRate: 5, price: 1120, qty: 2 }
    ],
    expectedCheckout: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5, gstPercents: [5], lineGrosses: [2240], lineTaxes: [104.5] }
  },
  {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', sku: 'BEV-001', hsn: '0902', gstRate: 18, price: 140, qty: 1 },
      { name: 'Coffee', sku: 'BEV-002', hsn: '0901', gstRate: 18, price: 310, qty: 1 },
      { name: 'Sherbet', sku: 'BEV-003', hsn: '2106', gstRate: 18, price: 180, qty: 1 }
    ],
    expectedCheckout: { subtotal: 630, discount: 0, tax: 113.4, cgst: 56.7, sgst: 56.7, total: 743.4, gstPercents: [18, 18, 18], lineGrosses: [140, 310, 180], lineTaxes: [25.2, 55.8, 32.4] }
  }
];

for (const orderCase of cases) {
  test(`Invoice matches checkout for order #${orderCase.id} with ${orderCase.coupon || 'no coupon'}`, () => {
    const order = { id: orderCase.id, coupon: orderCase.coupon, items: orderCase.items };
    const invoiceFigures = invoice.computeInvoiceFigures(order);
    const checkoutFigures = pricing.computeTotals(orderCase.items, orderCase.coupon);

    assert.deepEqual({
      subtotal: checkoutFigures.subtotal,
      discount: checkoutFigures.discount,
      tax: checkoutFigures.tax,
      cgst: checkoutFigures.cgst,
      sgst: checkoutFigures.sgst,
      total: checkoutFigures.total,
      gstPercents: checkoutFigures.lines.map(line => line.gstPercent),
      lineGrosses: checkoutFigures.lines.map(line => line.gross),
      lineTaxes: checkoutFigures.lines.map(line => line.tax)
    }, orderCase.expectedCheckout);

    assert.deepEqual({
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst,
      sgst: invoiceFigures.sgst,
      total: invoiceFigures.total,
      gstPercents: invoiceFigures.rows.map(row => row.gstPercent),
      lineGrosses: invoiceFigures.rows.map(row => row.line),
      lineTaxes: invoiceFigures.rows.map(row => row.lineTax)
    }, orderCase.expectedCheckout);
  });
}

const fs = require('fs');
const path = require('path');

const files = [
  'src/views/admin/purchase_invoice/PurchaseInvoiceDetail.vue',
  'src/views/admin/purchase_order/PurchaseOrderDetail.vue',
  'src/views/admin/purchase_payment/PurchasePaymentDetail.vue',
  'src/views/admin/purchase_quotation/PurchaseQuotationDetail.vue',
  'src/views/admin/purchase_return/PurchaseReturnDetail.vue',
  'src/views/admin/sale_invoice/SaleInvoiceDetail.vue',
  'src/views/admin/sale_order/SaleOrderDetail.vue',
  'src/views/admin/sale_payment/SalePaymentDetail.vue',
  'src/views/admin/sale_quotation/SaleQuotationDetail.vue',
  'src/views/admin/sale_return/SaleReturnDetail.vue',
  'src/views/admin/transaction/TransactionDetail.vue'
];

for (const relPath of files) {
  const fullPath = path.resolve('d:/MernProjects/stock-pos/stock-pos-ui', relPath);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, 'utf8');

  if (relPath.includes('TransactionDetail.vue')) {
    // TransactionDetail specific adjustments
    content = content.replace(/<Card class="lg:col-span-2[^>]*>/, '<Card class="lg:col-span-2">');
    content = content.replace(/<div class="lg:col-span-1 space-y-6">/, '<div class="lg:col-span-1 space-y-6">'); // keep as is
    
    // We want the 1/3 sidebar to be FIRST instead of SECOND. TransactionDetail has the table (col-span-2) first.
    // By extracting the columns and swapping them.
    const parts = content.split('<!-- Sidebar Info -->');
    if(parts.length === 2 && content.includes('<!-- Main Content -->')) {
       // Since manually swapping HTML in regex is brittle, we'll just handle styles
    }
  } else {
    // Grid conversions for 1/3 and 2/3 pattern
    content = content.replace(/lg:grid-cols-4/g, 'lg:grid-cols-3');
    content = content.replace(/lg:col-span-3/g, 'lg:col-span-2');
  }

  // Generic Card style stripping
  content = content.replace(/<Card class="shadow-sm border-muted-foreground\/10">/g, '<Card>');
  content = content.replace(/<Card class="shadow-sm border-success\/20 bg-success\/5">/g, '<Card>');
  content = content.replace(/class="pb-3 border-b bg-muted\/5"/g, 'class="pb-3 border-b"');
  content = content.replace(/class="pb-3 border-b border-success\/10"/g, 'class="pb-3 border-b"');

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated ${relPath}`);
}

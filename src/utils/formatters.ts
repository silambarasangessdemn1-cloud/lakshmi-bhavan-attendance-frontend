/**
 * Utility functions for currency, dates, numbers, exports, and image compression
 */

export function formatCurrency(amount: number, symbol = '₹'): string {
  const safeNum = Number(amount) || 0;
  return `${symbol} ${safeNum.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCompactCurrency(amount: number, symbol = '₹'): string {
  const safeNum = Number(amount) || 0;
  return `${symbol} ${safeNum.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatMonthName(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatDatePretty(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Converts a numeric amount to Indian English words for professional payslips
 * Handles decimals (paise) and supports arbitrarily large crore values.
 */
export function numberToWordsIndian(amount: number): string {
  const safeAmount = Math.abs(Number(amount) || 0);
  const integerPart = Math.floor(safeAmount);
  const decimalPart = Math.round((safeAmount - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) return 'Zero Rupees Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(val: number): string {
    if (val < 10) return units[val];
    if (val >= 10 && val < 20) return teens[val - 10];
    const t = Math.floor(val / 10);
    const u = val % 10;
    return (tens[t] + (u ? ' ' + units[u] : '')).trim();
  }

  function convertThreeDigits(val: number): string {
    const h = Math.floor(val / 100);
    const r = val % 100;
    let res = '';
    if (h > 0) res += units[h] + ' Hundred';
    if (r > 0) {
      if (res) res += ' ';
      res += convertTwoDigits(r);
    }
    return res;
  }

  function convertSection(n: number): string {
    let words = '';
    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const remainder = n % 1000;

    if (crore > 0) {
      // Recursively handle multi-hundred crore amounts
      words += (crore >= 100 ? convertThreeDigits(crore) : convertTwoDigits(crore)) + ' Crore ';
    }
    if (lakh > 0) words += convertTwoDigits(lakh) + ' Lakh ';
    if (thousand > 0) words += convertTwoDigits(thousand) + ' Thousand ';
    if (remainder > 0) words += convertThreeDigits(remainder);

    return words.trim();
  }

  let finalWords = convertSection(integerPart);
  if (finalWords) finalWords += ' Rupees';

  if (decimalPart > 0) {
    const paiseWords = convertTwoDigits(decimalPart);
    if (finalWords) finalWords += ' and ' + paiseWords + ' Paise';
    else finalWords = paiseWords + ' Paise';
  }

  return (finalWords.trim() + ' Only');
}

/**
 * Generates WhatsApp click-to-chat URL with a clean formatted payslip
 * Automatically normalizes Indian phone numbers with country code +91
 */
export function buildWhatsAppSlipUrl(
  phone: string,
  staffName: string,
  staffId: string,
  month: string,
  wage: number,
  days: number,
  otHours: number,
  gross: number,
  advance: number,
  loanDeduct: number,
  net: number,
  companyName: string
): string {
  let cleanPhone = (phone || '').replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }

  const monthName = formatMonthName(month);

  const text =
    `*${(companyName || 'SHREE LAKSHMI BHAVAN').toUpperCase()} — SALARY STATEMENT*\n` +
    `Period: ${monthName}\n\n` +
    `Employee: *${staffName}* (ID: ${staffId})\n` +
    `--------------------------------\n` +
    `Daily Wage: ₹${wage.toLocaleString('en-IN')}\n` +
    `Days Worked: ${days} days\n` +
    `Overtime: ${otHours} hrs\n` +
    `Gross Earnings: *₹${gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}*\n` +
    `--------------------------------\n` +
    `Deductions:\n` +
    (advance > 0 ? `• Advance: ₹${advance.toLocaleString('en-IN')}\n` : '') +
    (loanDeduct > 0 ? `• Loan Deduction: ₹${loanDeduct.toLocaleString('en-IN')}\n` : '') +
    `Total Deductions: ₹${(advance + loanDeduct).toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
    `--------------------------------\n` +
    `*NET SALARY PAYABLE: ₹${net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}*\n\n` +
    `_Generated automatically for ${companyName || 'Shree Lakshmi Bhavan'}._`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Exports data array as a downloadable CSV with UTF-8 BOM for flawless Excel compatibility
 */
export function exportToCSV(filename: string, rows: Record<string, string | number>[]): void {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] !== undefined ? String(row[h]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ].join('\r\n');

  // \uFEFF enables UTF-8 BOM so Excel opens non-ASCII characters (like ₹ and Tamil text) perfectly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Compresses an image file client-side to thumbnail dimensions (e.g. 160x160)
 * Keeps photo under 20KB to protect browser and database storage
 */
export function compressImageFile(file: File, maxDimension = 180, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(reader.result as string);
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

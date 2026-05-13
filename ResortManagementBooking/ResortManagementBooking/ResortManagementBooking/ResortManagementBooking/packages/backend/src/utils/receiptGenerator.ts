import { IBooking } from "../domains/booking-reservation/models/booking";

export interface ReceiptData {
  transactionId: string;
  resortName: string;
  resortAddress: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: Date;
  checkOutDate: Date;
  checkInTime: string;
  checkOutTime: string;
  bookingType: "online" | "walk_in";
  items: ReceiptItem[];
  subtotal: number;
  discount?: {
    type: string;
    percentage: number;
    amount: number;
  };
  tax: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionDate: Date;
  processedBy: string;
}

export interface ReceiptItem {
  type: "room" | "cottage" | "amenity";
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

/**
 * Generate receipt data from a booking
 */
export function generateReceiptData(booking: IBooking, hotelName: string, hotelAddress: string): ReceiptData {
  const items: ReceiptItem[] = [];

  // Add rooms to receipt
  if (booking.selectedRooms && booking.selectedRooms.length > 0) {
    const nights = Math.ceil(
      (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    booking.selectedRooms.forEach((room) => {
      items.push({
        type: "room",
        name: room.name,
        quantity: nights,
        unitPrice: room.pricePerNight,
        totalPrice: room.pricePerNight * nights,
        description: room.type,
      });
    });
  }

  // Add cottages to receipt
  if (booking.selectedCottages && booking.selectedCottages.length > 0) {
    const nights = Math.ceil(
      (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    booking.selectedCottages.forEach((cottage) => {
      items.push({
        type: "cottage",
        name: cottage.name,
        quantity: nights,
        unitPrice: cottage.pricePerNight,
        totalPrice: cottage.pricePerNight * nights,
        description: cottage.type,
      });
    });
  }

  // Add amenities to receipt
  if (booking.selectedAmenities && booking.selectedAmenities.length > 0) {
    booking.selectedAmenities.forEach((amenity) => {
      items.push({
        type: "amenity",
        name: amenity.name,
        quantity: 1,
        unitPrice: amenity.price,
        totalPrice: amenity.price,
        description: amenity.description,
      });
    });
  }

  // Calculate subtotal (before discount)
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Calculate tax (assuming 12% VAT - adjust as needed for your region)
  const taxRate = 0.12;
  const tax = subtotal * taxRate;

  // Calculate total
  let total = subtotal + tax;
  let discount = undefined;

  // Apply discount if applicable
  if (booking.discountApplied) {
    discount = {
      type: booking.discountApplied.type,
      percentage: booking.discountApplied.percentage,
      amount: booking.discountApplied.amount,
    };
    total = subtotal + tax - booking.discountApplied.amount;
  }

  // Determine payment method display
  let paymentMethodDisplay = "Unknown";
  if (booking.source === "walk_in" && booking.walkInDetails) {
    paymentMethodDisplay = booking.walkInDetails.paymentMethod.toUpperCase();
  } else if (booking.paymentMethod) {
    paymentMethodDisplay = booking.paymentMethod.toUpperCase();
  }

  return {
    transactionId: booking._id.toString(),
    resortName: hotelName,
    resortAddress: hotelAddress,
    guestName: `${booking.firstName} ${booking.lastName}`,
    guestEmail: booking.email,
    guestPhone: booking.phone || "N/A",
    checkInDate: booking.checkIn,
    checkOutDate: booking.checkOut,
    checkInTime: booking.checkInTime,
    checkOutTime: booking.checkOutTime,
    bookingType: booking.source,
    items,
    subtotal,
    discount,
    tax,
    total,
    paymentMethod: paymentMethodDisplay,
    paymentStatus: booking.paymentStatus,
    transactionDate: booking.createdAt || new Date(),
    processedBy: booking.walkInDetails?.processedByStaffId || "System",
  };
}

/**
 * Generate HTML receipt for digital display/printing
 */
export function generateHTMLReceipt(receiptData: ReceiptData): string {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`;
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt - ${receiptData.transactionId}</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .receipt {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 15px;
      margin-bottom: 15px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      color: #333;
    }
    .header p {
      margin: 5px 0;
      color: #666;
      font-size: 12px;
    }
    .section {
      margin-bottom: 15px;
    }
    .section-title {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 8px;
      color: #333;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 12px;
    }
    .info-label {
      color: #666;
    }
    .info-value {
      font-weight: 500;
      text-align: right;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .items-table th {
      text-align: left;
      padding: 5px;
      border-bottom: 1px solid #ddd;
      background: #f9f9f9;
    }
    .items-table td {
      padding: 5px;
      border-bottom: 1px solid #eee;
    }
    .items-table .price {
      text-align: right;
    }
    .totals {
      margin-top: 15px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 12px;
    }
    .total-row.final {
      font-weight: bold;
      font-size: 16px;
      border-top: 2px solid #333;
      padding-top: 10px;
      margin-top: 10px;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .badge.walk-in {
      background: #4CAF50;
      color: white;
    }
    .badge.online {
      background: #2196F3;
      color: white;
    }
    .badge.paid {
      background: #4CAF50;
      color: white;
    }
    .badge.pending {
      background: #FF9800;
      color: white;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px dashed #ccc;
      font-size: 11px;
      color: #666;
    }
    @media print {
      body {
        background: white;
        margin: 0;
        padding: 0;
      }
      .receipt {
        box-shadow: none;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>${receiptData.resortName}</h1>
      <p>${receiptData.resortAddress}</p>
      <p><strong>RECEIPT</strong></p>
    </div>

    <div class="section">
      <div class="section-title">Transaction Information</div>
      <div class="info-row">
        <span class="info-label">Transaction ID:</span>
        <span class="info-value">${receiptData.transactionId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date:</span>
        <span class="info-value">${formatDate(receiptData.transactionDate)} ${formatTime(receiptData.transactionDate)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Booking Type:</span>
        <span class="info-value">
          <span class="badge ${receiptData.bookingType === 'walk_in' ? 'walk-in' : 'online'}">${receiptData.bookingType}</span>
        </span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment Status:</span>
        <span class="info-value">
          <span class="badge ${receiptData.paymentStatus === 'paid' ? 'paid' : 'pending'}">${receiptData.paymentStatus}</span>
        </span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Guest Information</div>
      <div class="info-row">
        <span class="info-label">Name:</span>
        <span class="info-value">${receiptData.guestName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email:</span>
        <span class="info-value">${receiptData.guestEmail}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Phone:</span>
        <span class="info-value">${receiptData.guestPhone}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Stay Details</div>
      <div class="info-row">
        <span class="info-label">Check-in:</span>
        <span class="info-value">${formatDate(receiptData.checkInDate)} at ${receiptData.checkInTime}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Check-out:</span>
        <span class="info-value">${formatDate(receiptData.checkOutDate)} at ${receiptData.checkOutTime}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Items</div>
      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th class="price">Price</th>
          </tr>
        </thead>
        <tbody>
          ${receiptData.items.map(item => `
            <tr>
              <td>
                <strong>${item.name}</strong><br>
                <small>${item.description || item.type}</small>
              </td>
              <td>${item.quantity}</td>
              <td class="price">${formatCurrency(item.totalPrice)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="section totals">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>${formatCurrency(receiptData.subtotal)}</span>
      </div>
      ${receiptData.discount ? `
        <div class="total-row" style="color: #4CAF50;">
          <span>Discount (${receiptData.discount.type} - ${receiptData.discount.percentage}%):</span>
          <span>-${formatCurrency(receiptData.discount.amount)}</span>
        </div>
      ` : ''}
      <div class="total-row">
        <span>Tax (12%):</span>
        <span>${formatCurrency(receiptData.tax)}</span>
      </div>
      <div class="total-row final">
        <span>Total:</span>
        <span>${formatCurrency(receiptData.total)}</span>
      </div>
      <div class="total-row">
        <span>Payment Method:</span>
        <span>${receiptData.paymentMethod}</span>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for choosing ${receiptData.resortName}!</p>
      <p>Processed by: ${receiptData.processedBy}</p>
      <p>This receipt serves as proof of payment.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text receipt for simple printing
 */
export function generateTextReceipt(receiptData: ReceiptData): string {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`;
  };

  const line = "=".repeat(40);
  const divider = "-".repeat(40);

  return `
${line}
${receiptData.resortName.toUpperCase()}
${receiptData.resortAddress}
${line}
RECEIPT
${line}

Transaction ID: ${receiptData.transactionId}
Date: ${formatDate(receiptData.transactionDate)}
Booking Type: ${receiptData.bookingType.toUpperCase()}
Payment Status: ${receiptData.paymentStatus.toUpperCase()}

${divider}
GUEST INFORMATION
${divider}
Name: ${receiptData.guestName}
Email: ${receiptData.guestEmail}
Phone: ${receiptData.guestPhone}

${divider}
STAY DETAILS
${divider}
Check-in: ${formatDate(receiptData.checkInDate)} at ${receiptData.checkInTime}
Check-out: ${formatDate(receiptData.checkOutDate)} at ${receiptData.checkOutTime}

${divider}
ITEMS
${divider}
${receiptData.items.map(item => {
  return `${item.name} (${item.type})
  Qty: ${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.totalPrice)}`;
}).join('\n')}

${divider}
PAYMENT SUMMARY
${divider}
Subtotal: ${formatCurrency(receiptData.subtotal)}
${receiptData.discount ? `Discount (${receiptData.discount.type}): -${formatCurrency(receiptData.discount.amount)}\n` : ''}Tax (12%): ${formatCurrency(receiptData.tax)}
${divider}
TOTAL: ${formatCurrency(receiptData.total)}
Payment Method: ${receiptData.paymentMethod}

${line}
Thank you for choosing ${receiptData.resortName}!
Processed by: ${receiptData.processedBy}
This receipt serves as proof of payment.
${line}
  `.trim();
}

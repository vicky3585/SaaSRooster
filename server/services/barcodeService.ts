import QRCode from "qrcode";
import crypto from "crypto";

/**
 * Barcode and QR Code Generation Service
 * Handles generation of barcodes and QR codes for products
 */

export interface BarcodeOptions {
  format?: "ean13" | "ean8" | "code128" | "custom";
  width?: number;
  height?: number;
}

export interface QRCodeOptions {
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export class BarcodeService {
  /**
   * Generate a unique SKU for a product
   * @param orgId - Organization ID (first 4 chars)
   * @param category - Product category (first 3 chars)
   * @param sequence - Sequence number
   * @returns SKU string
   */
  generateSKU(orgId: string, category: string = "GEN", sequence?: number): string {
    const orgPrefix = orgId.substring(0, 4).toUpperCase();
    const catPrefix = category.substring(0, 3).toUpperCase();
    const seq = sequence || Date.now().toString().substring(7);
    
    return `${orgPrefix}-${catPrefix}-${seq}`;
  }

  /**
   * Generate a unique barcode number
   * @param prefix - Optional prefix (default: random)
   * @returns Barcode number string
   */
  generateBarcodeNumber(prefix?: string): string {
    // Generate EAN-13 compatible barcode
    // Format: [2-digit prefix][10-digit unique][1-digit checksum]
    
    const prefixDigits = prefix || this.generateRandomPrefix();
    const uniqueDigits = this.generateUniqueDigits(10);
    const barcode = prefixDigits + uniqueDigits;
    const checksum = this.calculateEAN13Checksum(barcode);
    
    return barcode + checksum;
  }

  /**
   * Generate QR code for product
   * @param data - Data to encode (product info, URL, etc.)
   * @param options - QR code options
   * @returns QR code as data URL
   */
  async generateQRCode(data: string | object, options?: QRCodeOptions): Promise<string> {
    try {
      const dataString = typeof data === "object" ? JSON.stringify(data) : data;
      
      const qrOptions = {
        errorCorrectionLevel: options?.errorCorrectionLevel || "M",
        width: options?.width || 200,
        margin: options?.margin || 1,
        color: {
          dark: options?.color?.dark || "#000000",
          light: options?.color?.light || "#FFFFFF",
        },
      };

      const qrCodeDataURL = await QRCode.toDataURL(dataString, qrOptions);
      return qrCodeDataURL;
    } catch (error) {
      console.error("❌ Error generating QR code:", error);
      throw new Error("Failed to generate QR code");
    }
  }

  /**
   * Generate QR code as buffer (for saving to file)
   * @param data - Data to encode
   * @param options - QR code options
   * @returns Buffer containing PNG image
   */
  async generateQRCodeBuffer(data: string | object, options?: QRCodeOptions): Promise<Buffer> {
    try {
      const dataString = typeof data === "object" ? JSON.stringify(data) : data;
      
      const qrOptions = {
        errorCorrectionLevel: options?.errorCorrectionLevel || "M",
        width: options?.width || 200,
        margin: options?.margin || 1,
      };

      const buffer = await QRCode.toBuffer(dataString, qrOptions);
      return buffer;
    } catch (error) {
      console.error("❌ Error generating QR code buffer:", error);
      throw new Error("Failed to generate QR code buffer");
    }
  }

  /**
   * Generate product QR code with encoded product information
   * @param productInfo - Product information to encode
   * @returns QR code data URL
   */
  async generateProductQRCode(productInfo: {
    id: string;
    name: string;
    sku: string;
    barcode?: string;
    price?: number;
    url?: string;
  }): Promise<string> {
    const data = {
      type: "product",
      id: productInfo.id,
      name: productInfo.name,
      sku: productInfo.sku,
      barcode: productInfo.barcode,
      price: productInfo.price,
      url: productInfo.url || `https://app.example.com/products/${productInfo.id}`,
      timestamp: new Date().toISOString(),
    };

    return await this.generateQRCode(data, {
      errorCorrectionLevel: "H",
      width: 250,
    });
  }

  /**
   * Validate barcode format
   * @param barcode - Barcode to validate
   * @param format - Expected format
   * @returns Boolean indicating if barcode is valid
   */
  validateBarcode(barcode: string, format: "ean13" | "ean8" = "ean13"): boolean {
    if (format === "ean13") {
      if (barcode.length !== 13 || !/^\d+$/.test(barcode)) {
        return false;
      }
      
      const checksum = parseInt(barcode[12]);
      const calculatedChecksum = this.calculateEAN13Checksum(barcode.substring(0, 12));
      
      return checksum === calculatedChecksum;
    }
    
    if (format === "ean8") {
      if (barcode.length !== 8 || !/^\d+$/.test(barcode)) {
        return false;
      }
      
      const checksum = parseInt(barcode[7]);
      const calculatedChecksum = this.calculateEAN8Checksum(barcode.substring(0, 7));
      
      return checksum === calculatedChecksum;
    }
    
    return true; // For other formats, assume valid
  }

  /**
   * Calculate EAN-13 checksum digit
   * @param barcode - 12-digit barcode without checksum
   * @returns Checksum digit
   */
  private calculateEAN13Checksum(barcode: string): number {
    let sum = 0;
    
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(barcode[i]);
      // Odd positions (1st, 3rd, 5th...) multiply by 1
      // Even positions (2nd, 4th, 6th...) multiply by 3
      sum += digit * (i % 2 === 0 ? 1 : 3);
    }
    
    const checksum = (10 - (sum % 10)) % 10;
    return checksum;
  }

  /**
   * Calculate EAN-8 checksum digit
   * @param barcode - 7-digit barcode without checksum
   * @returns Checksum digit
   */
  private calculateEAN8Checksum(barcode: string): number {
    let sum = 0;
    
    for (let i = 0; i < 7; i++) {
      const digit = parseInt(barcode[i]);
      sum += digit * (i % 2 === 0 ? 3 : 1);
    }
    
    const checksum = (10 - (sum % 10)) % 10;
    return checksum;
  }

  /**
   * Generate random 2-digit prefix for barcode
   * @returns 2-digit string
   */
  private generateRandomPrefix(): string {
    // Use country code range for custom barcodes (20-29)
    const prefix = Math.floor(Math.random() * 10) + 20;
    return prefix.toString();
  }

  /**
   * Generate unique digits using timestamp and random
   * @param length - Number of digits
   * @returns Digit string
   */
  private generateUniqueDigits(length: number): string {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(4).toString("hex");
    const combined = timestamp + random;
    const hash = crypto.createHash("sha256").update(combined).digest("hex");
    
    // Extract digits from hash
    let digits = "";
    for (let i = 0; i < hash.length && digits.length < length; i++) {
      if (/\d/.test(hash[i])) {
        digits += hash[i];
      }
    }
    
    // If not enough digits, pad with timestamp digits
    if (digits.length < length) {
      digits += timestamp.substring(0, length - digits.length);
    }
    
    return digits.substring(0, length);
  }

  /**
   * Parse QR code data
   * @param qrData - QR code data string
   * @returns Parsed object or original string
   */
  parseQRCode(qrData: string): any {
    try {
      return JSON.parse(qrData);
    } catch {
      return qrData;
    }
  }

  /**
   * Generate multiple barcodes for batch products
   * @param count - Number of barcodes to generate
   * @param prefix - Optional prefix
   * @returns Array of barcode numbers
   */
  generateBatchBarcodes(count: number, prefix?: string): string[] {
    const barcodes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      barcodes.push(this.generateBarcodeNumber(prefix));
    }
    
    return barcodes;
  }

  /**
   * Generate SKU from product attributes
   * @param attributes - Product attributes
   * @returns Generated SKU
   */
  generateSmartSKU(attributes: {
    orgCode?: string;
    category?: string;
    brand?: string;
    variant?: string;
    sequence?: number;
  }): string {
    const parts: string[] = [];
    
    if (attributes.orgCode) {
      parts.push(attributes.orgCode.substring(0, 3).toUpperCase());
    }
    
    if (attributes.category) {
      parts.push(attributes.category.substring(0, 3).toUpperCase());
    }
    
    if (attributes.brand) {
      parts.push(attributes.brand.substring(0, 3).toUpperCase());
    }
    
    if (attributes.variant) {
      parts.push(attributes.variant.substring(0, 3).toUpperCase());
    }
    
    const sequence = attributes.sequence || Math.floor(Math.random() * 10000);
    parts.push(sequence.toString().padStart(4, "0"));
    
    return parts.join("-");
  }
}

// Export singleton instance
export const barcodeService = new BarcodeService();

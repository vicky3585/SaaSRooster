import { db } from "../db";
import {
  items,
  inventoryBatches,
  stockTransactions,
  stockAlerts,
  warehouses,
  type Item,
  type InventoryBatch,
  type InsertInventoryBatch,
  type InsertStockTransaction,
  type InsertStockAlert,
} from "@shared/schema";
import { eq, and, sql, lt, desc, asc } from "drizzle-orm";
import { notificationService } from "./notificationService";

/**
 * Inventory Management Service with FIFO Valuation
 * Handles stock movements, FIFO tracking, and inventory valuation
 */

export interface StockAdjustment {
  itemId: string;
  warehouseId: string;
  quantity: number;
  type: "adjustment_increase" | "adjustment_decrease" | "damage" | "return";
  reason: string;
  userId: string;
  purchasePrice?: number; // For increases
}

export interface StockDeduction {
  itemId: string;
  warehouseId: string;
  quantity: number;
  referenceId?: string; // Invoice ID
  referenceType?: string; // "invoice"
}

export interface FIFOValuation {
  itemId: string;
  totalQuantity: number;
  totalValue: number;
  averageCost: number;
  batches: Array<{
    batchNumber: string;
    quantity: number;
    purchasePrice: number;
    purchaseDate: Date;
    value: number;
  }>;
}

export interface InventoryReport {
  itemId: string;
  itemName: string;
  sku: string;
  currentStock: number;
  stockValue: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  warehouseId: string;
  warehouseName: string;
}

export class InventoryService {
  /**
   * Add stock to inventory (FIFO - creates new batch)
   * @param orgId - Organization ID
   * @param itemId - Item ID
   * @param warehouseId - Warehouse ID
   * @param quantity - Quantity to add
   * @param purchasePrice - Purchase price per unit
   * @param referenceId - Reference document ID (e.g., purchase invoice)
   * @param referenceType - Reference type
   * @returns Created batch
   */
  async addStock(
    orgId: string,
    itemId: string,
    warehouseId: string,
    quantity: number,
    purchasePrice: number,
    referenceId?: string,
    referenceType?: string
  ): Promise<InventoryBatch> {
    try {
      // Generate batch number
      const batchNumber = await this.generateBatchNumber(orgId, itemId);

      // Create inventory batch for FIFO tracking
      const batch: InsertInventoryBatch = {
        orgId,
        itemId,
        warehouseId,
        batchNumber,
        purchasePrice: purchasePrice.toString(),
        quantityReceived: quantity,
        quantityRemaining: quantity,
        purchaseDate: new Date(),
        referenceId,
        referenceType,
      };

      const [createdBatch] = await db.insert(inventoryBatches).values(batch).returning();

      // Update item stock quantity
      await db
        .update(items)
        .set({
          stockQuantity: sql`${items.stockQuantity} + ${quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(items.id, itemId));

      // Create stock transaction record
      const transaction: InsertStockTransaction = {
        orgId,
        itemId,
        warehouseId,
        type: "purchase",
        quantity,
        referenceId,
        referenceType,
        notes: `Added ${quantity} units at ${purchasePrice} per unit`,
      };
      await db.insert(stockTransactions).values(transaction);

      // Check if low stock alert should be resolved
      await this.checkAndResolveStockAlerts(orgId, itemId);

      console.log(`✅ Added ${quantity} units of item ${itemId} to inventory`);
      return createdBatch;
    } catch (error) {
      console.error("❌ Error adding stock:", error);
      throw error;
    }
  }

  /**
   * Deduct stock from inventory using FIFO method
   * @param orgId - Organization ID
   * @param deduction - Stock deduction details
   * @returns Array of batches used for deduction
   */
  async deductStock(orgId: string, deduction: StockDeduction): Promise<InventoryBatch[]> {
    try {
      const { itemId, warehouseId, quantity, referenceId, referenceType } = deduction;

      // Get current item stock
      const [item] = await db.select().from(items).where(eq(items.id, itemId)).limit(1);

      if (!item) {
        throw new Error(`Item ${itemId} not found`);
      }

      if (item.stockQuantity < quantity) {
        throw new Error(
          `Insufficient stock for item ${item.name}. Available: ${item.stockQuantity}, Required: ${quantity}`
        );
      }

      // Get available batches ordered by purchase date (FIFO)
      const availableBatches = await db
        .select()
        .from(inventoryBatches)
        .where(
          and(
            eq(inventoryBatches.orgId, orgId),
            eq(inventoryBatches.itemId, itemId),
            eq(inventoryBatches.warehouseId, warehouseId),
            sql`${inventoryBatches.quantityRemaining} > 0`
          )
        )
        .orderBy(asc(inventoryBatches.purchaseDate));

      if (availableBatches.length === 0) {
        throw new Error(`No available batches for item ${itemId}`);
      }

      let remainingToDeduct = quantity;
      const usedBatches: InventoryBatch[] = [];

      // Deduct from batches using FIFO
      for (const batch of availableBatches) {
        if (remainingToDeduct <= 0) break;

        const batchRemaining = batch.quantityRemaining;
        const deductFromBatch = Math.min(batchRemaining, remainingToDeduct);

        // Update batch quantity
        await db
          .update(inventoryBatches)
          .set({
            quantityRemaining: batch.quantityRemaining - deductFromBatch,
            updatedAt: new Date(),
          })
          .where(eq(inventoryBatches.id, batch.id));

        remainingToDeduct -= deductFromBatch;
        usedBatches.push({ ...batch, quantityRemaining: deductFromBatch });
      }

      if (remainingToDeduct > 0) {
        throw new Error(`Could not fully deduct stock. Remaining: ${remainingToDeduct}`);
      }

      // Update item stock quantity
      await db
        .update(items)
        .set({
          stockQuantity: sql`${items.stockQuantity} - ${quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(items.id, itemId));

      // Create stock transaction record
      const transaction: InsertStockTransaction = {
        orgId,
        itemId,
        warehouseId,
        type: "sale",
        quantity: -quantity, // Negative for deduction
        referenceId,
        referenceType,
        notes: `Deducted ${quantity} units using FIFO method`,
      };
      await db.insert(stockTransactions).values(transaction);

      // Check for low stock and create alert if needed
      await this.checkLowStock(orgId, itemId);

      console.log(`✅ Deducted ${quantity} units of item ${itemId} using FIFO`);
      return usedBatches;
    } catch (error) {
      console.error("❌ Error deducting stock:", error);
      throw error;
    }
  }

  /**
   * Manual stock adjustment
   * @param orgId - Organization ID
   * @param adjustment - Stock adjustment details
   */
  async adjustStock(orgId: string, adjustment: StockAdjustment): Promise<void> {
    try {
      const { itemId, warehouseId, quantity, type, reason, userId, purchasePrice } = adjustment;

      const isIncrease = type === "adjustment_increase" || type === "return";

      if (isIncrease) {
        // For increases, create a new batch
        await this.addStock(
          orgId,
          itemId,
          warehouseId,
          quantity,
          purchasePrice || 0,
          undefined,
          type
        );
      } else {
        // For decreases, use FIFO deduction
        await this.deductStock(orgId, {
          itemId,
          warehouseId,
          quantity,
          referenceType: type,
        });
      }

      // Create stock transaction with reason
      const transaction: InsertStockTransaction = {
        orgId,
        itemId,
        warehouseId,
        type,
        quantity: isIncrease ? quantity : -quantity,
        notes: reason,
        createdBy: userId,
      };
      await db.insert(stockTransactions).values(transaction);

      console.log(`✅ Stock adjustment completed for item ${itemId}: ${type}`);
    } catch (error) {
      console.error("❌ Error adjusting stock:", error);
      throw error;
    }
  }

  /**
   * Calculate FIFO valuation for an item
   * @param orgId - Organization ID
   * @param itemId - Item ID
   * @param warehouseId - Optional warehouse filter
   * @returns FIFO valuation details
   */
  async calculateFIFOValuation(
    orgId: string,
    itemId: string,
    warehouseId?: string
  ): Promise<FIFOValuation> {
    try {
      const conditions = [
        eq(inventoryBatches.orgId, orgId),
        eq(inventoryBatches.itemId, itemId),
        sql`${inventoryBatches.quantityRemaining} > 0`,
      ];

      if (warehouseId) {
        conditions.push(eq(inventoryBatches.warehouseId, warehouseId));
      }

      const batches = await db
        .select()
        .from(inventoryBatches)
        .where(and(...conditions))
        .orderBy(asc(inventoryBatches.purchaseDate));

      let totalQuantity = 0;
      let totalValue = 0;

      const batchDetails = batches.map((batch) => {
        const quantity = batch.quantityRemaining;
        const price = parseFloat(batch.purchasePrice);
        const value = quantity * price;

        totalQuantity += quantity;
        totalValue += value;

        return {
          batchNumber: batch.batchNumber,
          quantity,
          purchasePrice: price,
          purchaseDate: batch.purchaseDate,
          value,
        };
      });

      const averageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;

      return {
        itemId,
        totalQuantity,
        totalValue,
        averageCost,
        batches: batchDetails,
      };
    } catch (error) {
      console.error("❌ Error calculating FIFO valuation:", error);
      throw error;
    }
  }

  /**
   * Check for low stock and create alerts
   * @param orgId - Organization ID
   * @param itemId - Item ID
   */
  async checkLowStock(orgId: string, itemId: string): Promise<void> {
    try {
      const [item] = await db.select().from(items).where(eq(items.id, itemId)).limit(1);

      if (!item) return;

      const isLowStock = item.stockQuantity <= item.lowStockThreshold;
      const isOutOfStock = item.stockQuantity === 0;

      if (isLowStock) {
        // Check if alert already exists and is not resolved
        const existingAlerts = await db
          .select()
          .from(stockAlerts)
          .where(
            and(
              eq(stockAlerts.orgId, orgId),
              eq(stockAlerts.itemId, itemId),
              eq(stockAlerts.isResolved, false)
            )
          );

        if (existingAlerts.length === 0) {
          // Create new alert
          const alert: InsertStockAlert = {
            orgId,
            itemId,
            alertType: isOutOfStock ? "out_of_stock" : "low_stock",
            currentQuantity: item.stockQuantity,
            threshold: item.lowStockThreshold,
            isResolved: false,
          };

          await db.insert(stockAlerts).values(alert);

          // Send notification
          await notificationService.sendLowStockAlert(orgId, {
            itemName: item.name,
            sku: item.sku || "",
            currentStock: item.stockQuantity,
            threshold: item.lowStockThreshold,
            isOutOfStock,
          });

          console.log(`⚠️  Low stock alert created for item: ${item.name}`);
        }
      }
    } catch (error) {
      console.error("❌ Error checking low stock:", error);
    }
  }

  /**
   * Check and resolve stock alerts if stock is above threshold
   * @param orgId - Organization ID
   * @param itemId - Item ID
   */
  async checkAndResolveStockAlerts(orgId: string, itemId: string): Promise<void> {
    try {
      const [item] = await db.select().from(items).where(eq(items.id, itemId)).limit(1);

      if (!item) return;

      if (item.stockQuantity > item.lowStockThreshold) {
        // Resolve any open alerts
        await db
          .update(stockAlerts)
          .set({
            isResolved: true,
            resolvedAt: new Date(),
          })
          .where(
            and(
              eq(stockAlerts.orgId, orgId),
              eq(stockAlerts.itemId, itemId),
              eq(stockAlerts.isResolved, false)
            )
          );

        console.log(`✅ Stock alerts resolved for item: ${item.name}`);
      }
    } catch (error) {
      console.error("❌ Error resolving stock alerts:", error);
    }
  }

  /**
   * Get inventory report for organization
   * @param orgId - Organization ID
   * @returns Array of inventory reports
   */
  async getInventoryReport(orgId: string): Promise<InventoryReport[]> {
    try {
      const itemsList = await db
        .select()
        .from(items)
        .where(eq(items.orgId, orgId))
        .orderBy(items.name);

      const reports: InventoryReport[] = [];

      for (const item of itemsList) {
        const valuation = await this.calculateFIFOValuation(orgId, item.id);

        // Get warehouse info if default warehouse is set
        let warehouseName = "Default";
        if (item.defaultWarehouseId) {
          const [warehouse] = await db
            .select()
            .from(warehouses)
            .where(eq(warehouses.id, item.defaultWarehouseId))
            .limit(1);
          warehouseName = warehouse?.name || "Default";
        }

        reports.push({
          itemId: item.id,
          itemName: item.name,
          sku: item.sku || "",
          currentStock: item.stockQuantity,
          stockValue: valuation.totalValue,
          lowStockThreshold: item.lowStockThreshold,
          isLowStock: item.stockQuantity <= item.lowStockThreshold,
          warehouseId: item.defaultWarehouseId || "",
          warehouseName,
        });
      }

      return reports;
    } catch (error) {
      console.error("❌ Error generating inventory report:", error);
      throw error;
    }
  }

  /**
   * Get stock movement history for an item
   * @param orgId - Organization ID
   * @param itemId - Item ID
   * @param limit - Number of records to return
   * @returns Array of stock transactions
   */
  async getStockMovements(orgId: string, itemId: string, limit: number = 50) {
    try {
      return await db
        .select()
        .from(stockTransactions)
        .where(and(eq(stockTransactions.orgId, orgId), eq(stockTransactions.itemId, itemId)))
        .orderBy(desc(stockTransactions.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("❌ Error fetching stock movements:", error);
      throw error;
    }
  }

  /**
   * Generate unique batch number
   * @param orgId - Organization ID
   * @param itemId - Item ID
   * @returns Batch number
   */
  private async generateBatchNumber(orgId: string, itemId: string): Promise<string> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `BATCH-${timestamp}-${random}`;
  }

  /**
   * Get low stock items for organization
   * @param orgId - Organization ID
   * @returns Array of low stock items
   */
  async getLowStockItems(orgId: string): Promise<Item[]> {
    try {
      return await db
        .select()
        .from(items)
        .where(
          and(
            eq(items.orgId, orgId),
            sql`${items.stockQuantity} <= ${items.lowStockThreshold}`
          )
        )
        .orderBy(items.name);
    } catch (error) {
      console.error("❌ Error fetching low stock items:", error);
      throw error;
    }
  }

  /**
   * Get total inventory value for organization
   * @param orgId - Organization ID
   * @returns Total inventory value
   */
  async getTotalInventoryValue(orgId: string): Promise<number> {
    try {
      const itemsList = await db.select().from(items).where(eq(items.orgId, orgId));

      let totalValue = 0;

      for (const item of itemsList) {
        const valuation = await this.calculateFIFOValuation(orgId, item.id);
        totalValue += valuation.totalValue;
      }

      return totalValue;
    } catch (error) {
      console.error("❌ Error calculating total inventory value:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const inventoryService = new InventoryService();

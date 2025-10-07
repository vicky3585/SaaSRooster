import { Router } from "express";
import { db } from "../db";
import { customers, contacts, accounts, invoices, deals, leads } from "../../shared/schema";
import { eq, or, ilike, and } from "drizzle-orm";
import type { Request } from "express";

const router = Router();

interface AuthRequest extends Request {
  orgId?: string;
}

router.get("/", async (req: AuthRequest, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: "Search query required" });
    }

    const searchTerm = `%${q}%`;

    const [customerResults, contactResults, accountResults, invoiceResults, dealResults, leadResults] = await Promise.all([
      db
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.orgId, req.orgId!),
            or(
              ilike(customers.name, searchTerm),
              ilike(customers.email, searchTerm),
              ilike(customers.phone, searchTerm)
            )
          )
        )
        .limit(5),
      
      db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.orgId, req.orgId!),
            or(
              ilike(contacts.firstName, searchTerm),
              ilike(contacts.lastName, searchTerm),
              ilike(contacts.email, searchTerm)
            )
          )
        )
        .limit(5),
      
      db
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.orgId, req.orgId!),
            or(
              ilike(accounts.name, searchTerm),
              ilike(accounts.email, searchTerm)
            )
          )
        )
        .limit(5),
      
      db
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.orgId, req.orgId!),
            ilike(invoices.invoiceNumber, searchTerm)
          )
        )
        .limit(5),
      
      db
        .select()
        .from(deals)
        .where(
          and(
            eq(deals.orgId, req.orgId!),
            ilike(deals.name, searchTerm)
          )
        )
        .limit(5),
      
      db
        .select()
        .from(leads)
        .where(
          and(
            eq(leads.orgId, req.orgId!),
            or(
              ilike(leads.name, searchTerm),
              ilike(leads.email, searchTerm),
              ilike(leads.company, searchTerm)
            )
          )
        )
        .limit(5),
    ]);

    res.json({
      customers: customerResults.map(c => ({ ...c, type: 'customer' })),
      contacts: contactResults.map(c => ({ ...c, type: 'contact' })),
      accounts: accountResults.map(a => ({ ...a, type: 'account' })),
      invoices: invoiceResults.map(i => ({ ...i, type: 'invoice' })),
      deals: dealResults.map(d => ({ ...d, type: 'deal' })),
      leads: leadResults.map(l => ({ ...l, type: 'lead' })),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

# Invoicing

This context covers creating projects, customers, and invoices for a small invoicing workflow.

## Language

**Project**:
The invoicing workspace for one supplier identity. A project owns its customers and invoices, and its name is independent from the supplier's official company name.
_Avoid_: Account, tenant

**Supplier**:
The company or person issuing invoices from a project.
_Avoid_: Project company, seller

**Customer**:
The odběratel receiving an invoice from a project. A customer belongs to exactly one project, and its name is the invoice-facing customer identity. Customer company identity is considered duplicate within that project when the same IČO is already present.
_Avoid_: Client, buyer, account

**Company Registry Lookup**:
A lookup of official company identity data by company name or IČO, used to prefill supplier or customer details.
_Avoid_: ARES search, ICO search

**IČO**:
The Czech company identification number used to identify a company in official registries.
_Avoid_: ICO

## Example Dialogue

Dev: When creating a project, should the company registry lookup create a customer?

Domain expert: No. In project creation it fills the supplier details for that project.

Dev: When creating a new odběratel while drafting an invoice, should the same lookup be used?

Domain expert: Yes. There it fills customer details, and the customer belongs to the current project.

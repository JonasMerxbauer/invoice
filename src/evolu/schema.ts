import * as Evolu from "@evolu/common";

const ProjectId = Evolu.id("Project");
const CustomerId = Evolu.id("Customer");
const PaymentMethodId = Evolu.id("PaymentMethod");
const InvoiceId = Evolu.id("Invoice");
const InvoiceItemId = Evolu.id("InvoiceItem");

const InvoiceStatus = Evolu.union(
  Evolu.literal("issued"),
  Evolu.literal("paid"),
  Evolu.literal("cancelled"),
);

const PaymentMethodType = Evolu.union(
  Evolu.literal("bank-transfer"),
  Evolu.literal("cash"),
  Evolu.literal("card"),
);

const VatMode = Evolu.union(
  Evolu.literal("none"),
  Evolu.literal("standard"),
  Evolu.literal("reverse-charge"),
);

const InvoiceNumberingScheme = Evolu.union(
  Evolu.literal("yearmonthnumber"),
  Evolu.literal("yearnumber"),
);

const DigitString = Evolu.regex(
  "DigitString",
  /^\d+$/,
)(Evolu.NonEmptyTrimmedString);
const VariableSymbol = Evolu.maxLength(10)(DigitString);
const ConstantSymbol = Evolu.maxLength(4)(DigitString);
const SpecificSymbol = Evolu.maxLength(10)(DigitString);
const Ico = Evolu.maxLength(16)(Evolu.NonEmptyTrimmedString);
const Dic = Evolu.maxLength(20)(Evolu.NonEmptyTrimmedString);
const VatId = Evolu.maxLength(20)(Evolu.NonEmptyTrimmedString);
const PostalCode = Evolu.maxLength(20)(Evolu.NonEmptyTrimmedString);
const BankAccount = Evolu.maxLength(34)(Evolu.NonEmptyTrimmedString);
const Iban = Evolu.maxLength(34)(Evolu.NonEmptyTrimmedString);
const Swift = Evolu.regex(
  "Swift",
  /^[A-Z0-9]{8}([A-Z0-9]{3})?$/,
)(Evolu.NonEmptyTrimmedString);
const Phone = Evolu.maxLength(30)(Evolu.NonEmptyTrimmedString);
const Website = Evolu.maxLength(255)(Evolu.NonEmptyTrimmedString);
const Unit = Evolu.maxLength(20)(Evolu.NonEmptyTrimmedString);

export const Schema = {
  project: {
    id: ProjectId,
    name: Evolu.NonEmptyString100,
    companyName: Evolu.NonEmptyString100,
    ico: Evolu.nullOr(Ico),
    dic: Evolu.nullOr(Dic),
    vatId: Evolu.nullOr(VatId),
    vatMode: VatMode,
    isVatPayer: Evolu.SqliteBoolean,
    street: Evolu.nullOr(Evolu.TrimmedString100),
    city: Evolu.nullOr(Evolu.TrimmedString100),
    postalCode: Evolu.nullOr(PostalCode),
    country: Evolu.nullOr(Evolu.TrimmedString100),
    email: Evolu.nullOr(Evolu.TrimmedString100),
    phone: Evolu.nullOr(Phone),
    website: Evolu.nullOr(Website),
    bankAccount: Evolu.nullOr(BankAccount),
    iban: Evolu.nullOr(Iban),
    swift: Evolu.nullOr(Swift),
    defaultCurrency: Evolu.CurrencyCode,
    invoiceNumberingScheme: InvoiceNumberingScheme,
    note: Evolu.nullOr(Evolu.TrimmedString1000),
  },
  customer: {
    id: CustomerId,
    projectId: ProjectId,
    name: Evolu.NonEmptyString100,
    companyName: Evolu.nullOr(Evolu.TrimmedString100),
    ico: Evolu.nullOr(Ico),
    dic: Evolu.nullOr(Dic),
    vatId: Evolu.nullOr(VatId),
    vatMode: Evolu.nullOr(VatMode),
    street: Evolu.nullOr(Evolu.TrimmedString100),
    city: Evolu.nullOr(Evolu.TrimmedString100),
    postalCode: Evolu.nullOr(PostalCode),
    country: Evolu.nullOr(Evolu.TrimmedString100),
    email: Evolu.nullOr(Evolu.TrimmedString100),
    phone: Evolu.nullOr(Phone),
    note: Evolu.nullOr(Evolu.TrimmedString1000),
  },
  paymentMethod: {
    id: PaymentMethodId,
    projectId: ProjectId,
    name: Evolu.NonEmptyString100,
    type: PaymentMethodType,
    bankAccount: Evolu.nullOr(BankAccount),
    iban: Evolu.nullOr(Iban),
    swift: Evolu.nullOr(Swift),
    isDefault: Evolu.SqliteBoolean,
  },
  invoice: {
    id: InvoiceId,
    projectId: ProjectId,
    customerId: CustomerId,
    paymentMethodId: Evolu.nullOr(PaymentMethodId),
    invoiceNumber: Evolu.NonEmptyString100,
    issueDate: Evolu.DateIso,
    taxableSupplyDate: Evolu.DateIso,
    dueDate: Evolu.DateIso,
    paidDate: Evolu.nullOr(Evolu.DateIso),
    status: InvoiceStatus,
    currency: Evolu.CurrencyCode,
    vatMode: VatMode,
    variableSymbol: Evolu.nullOr(VariableSymbol),
    constantSymbol: Evolu.nullOr(ConstantSymbol),
    specificSymbol: Evolu.nullOr(SpecificSymbol),
    subtotal: Evolu.NonNegativeNumber,
    vatTotal: Evolu.NonNegativeNumber,
    total: Evolu.NonNegativeNumber,
    note: Evolu.nullOr(Evolu.TrimmedString1000),
    supplierCompanyName: Evolu.nullOr(Evolu.NonEmptyString100),
    supplierIco: Evolu.nullOr(Ico),
    supplierDic: Evolu.nullOr(Dic),
    supplierVatId: Evolu.nullOr(VatId),
    supplierStreet: Evolu.nullOr(Evolu.TrimmedString100),
    supplierCity: Evolu.nullOr(Evolu.TrimmedString100),
    supplierPostalCode: Evolu.nullOr(PostalCode),
    supplierCountry: Evolu.nullOr(Evolu.TrimmedString100),
    supplierBankAccount: Evolu.nullOr(BankAccount),
    supplierIban: Evolu.nullOr(Iban),
    supplierSwift: Evolu.nullOr(Swift),
    customerName: Evolu.nullOr(Evolu.NonEmptyString100),
    customerCompanyName: Evolu.nullOr(Evolu.TrimmedString100),
    customerIco: Evolu.nullOr(Ico),
    customerDic: Evolu.nullOr(Dic),
    customerStreet: Evolu.nullOr(Evolu.TrimmedString100),
    customerCity: Evolu.nullOr(Evolu.TrimmedString100),
    customerPostalCode: Evolu.nullOr(PostalCode),
    customerCountry: Evolu.nullOr(Evolu.TrimmedString100),
  },
  invoiceItem: {
    id: InvoiceItemId,
    invoiceId: InvoiceId,
    sortOrder: Evolu.NonNegativeInt,
    description: Evolu.NonEmptyString1000,
    quantity: Evolu.PositiveNumber,
    unit: Evolu.nullOr(Unit),
    unitPrice: Evolu.NonNegativeNumber,
    vatRate: Evolu.NonNegativeNumber,
    subtotal: Evolu.NonNegativeNumber,
    vatAmount: Evolu.NonNegativeNumber,
    total: Evolu.NonNegativeNumber,
  },
};

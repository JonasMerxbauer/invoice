import { Font, pdf } from "@react-pdf/renderer";
import {
  InvoicePdfDocument,
  type InvoicePdfInvoice,
  type InvoicePdfItem,
} from "~/components/invoice-pdf-document";
import { createQrPaymentDataUrl } from "~/lib/qr-payment";

let pdfFontsRegistered = false;

function getPublicAssetUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}

function ensurePdfFontsRegistered() {
  if (pdfFontsRegistered) return;

  Font.register({
    family: "InvoicePdfLibreBaskerville",
    fonts: [
      {
        src: getPublicAssetUrl(
          "/Libre_Baskerville/static/LibreBaskerville-Regular.ttf",
        ),
        fontWeight: 400,
      },
      {
        src: getPublicAssetUrl(
          "/Libre_Baskerville/static/LibreBaskerville-Italic.ttf",
        ),
        fontStyle: "italic",
        fontWeight: 400,
      },
      {
        src: getPublicAssetUrl(
          "/Libre_Baskerville/static/LibreBaskerville-Bold.ttf",
        ),
        fontWeight: 700,
      },
      {
        src: getPublicAssetUrl(
          "/Libre_Baskerville/static/LibreBaskerville-BoldItalic.ttf",
        ),
        fontStyle: "italic",
        fontWeight: 700,
      },
    ],
  });

  Font.register({
    family: "InvoicePdfOpenSansMono",
    fonts: [
      {
        src: getPublicAssetUrl("/Open_Sans/static/OpenSans-Regular.ttf"),
        fontWeight: 400,
      },
      {
        src: getPublicAssetUrl("/Open_Sans/static/OpenSans-Bold.ttf"),
        fontWeight: 700,
      },
    ],
  });

  pdfFontsRegistered = true;
}

export type { InvoicePdfInvoice, InvoicePdfItem };

export async function generateInvoicePdfBlob({
  invoice,
  items,
}: {
  invoice: InvoicePdfInvoice;
  items: InvoicePdfItem[];
}) {
  ensurePdfFontsRegistered();
  const qrPaymentDataUrl = await createQrPaymentDataUrl(invoice);

  return pdf(
    <InvoicePdfDocument
      invoice={invoice}
      items={items}
      qrPaymentDataUrl={qrPaymentDataUrl}
    />,
  ).toBlob();
}

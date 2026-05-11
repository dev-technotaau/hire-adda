/**
 * Invoice PDF renderer. Compiles the Handlebars template + runs Puppeteer
 * to produce an A4 PDF. Used by `invoice.service.issueInvoice()` and the
 * BullMQ `invoice-generation.worker`.
 */
import puppeteer, { type Browser } from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import logger from '../config/logger';

const tracer = trace.getTracer('invoice-pdf');

// Register a tiny `add` helper used by the template's index numbering.
handlebars.registerHelper('add', (a: number, b: number) => a + b);

/**
 * Per-type template variants. Each is a separate .hbs file so type-specific
 * legal copy (e.g. "this is NOT a tax invoice" on PROFORMA, the credit
 * banner on CREDIT_NOTE, the simplified hero layout on RECEIPT) lives in
 * one place. They all consume the same data shape from invoice.service —
 * only the framing differs.
 *
 * Falls back to tax-invoice.hbs (which has a dynamic docTitle) for any
 * unrecognised type so legacy callers continue to work.
 */
type TemplateName = 'tax-invoice' | 'receipt' | 'credit-note' | 'proforma';

const TEMPLATE_FILES: Record<TemplateName, string> = {
  'tax-invoice': 'tax-invoice.hbs',
  receipt: 'receipt.hbs',
  'credit-note': 'credit-note.hbs',
  proforma: 'proforma.hbs',
};

/** Memoise the compiled templates so we re-read from disk only on first use. */
const _compiledTemplates: Partial<Record<TemplateName, HandlebarsTemplateDelegate>> = {};

function getTemplate(name: TemplateName = 'tax-invoice'): HandlebarsTemplateDelegate {
  const cached = _compiledTemplates[name];
  if (cached) return cached;
  // Templates are copied to dist/ at build time via copyfiles.
  // __dirname differs between dev (src/utils) and prod (dist/utils) — both
  // resolve to <root>/<src|dist>/utils, so ../templates/invoice/...
  const filename = TEMPLATE_FILES[name] ?? TEMPLATE_FILES['tax-invoice'];
  const tplPath = path.resolve(__dirname, '..', 'templates', 'invoice', filename);
  const html = fs.readFileSync(tplPath, 'utf8');
  const compiled = handlebars.compile(html);
  _compiledTemplates[name] = compiled;
  return compiled;
}

/**
 * Map an `InvoiceType` value to the corresponding template variant.
 * Unknown values silently degrade to `tax-invoice` (the universal layout).
 */
function templateForInvoiceType(type: string | undefined): TemplateName {
  switch (type) {
    case 'RECEIPT':
      return 'receipt';
    case 'CREDIT_NOTE':
      return 'credit-note';
    case 'PROFORMA':
      return 'proforma';
    case 'TAX_INVOICE':
    default:
      return 'tax-invoice';
  }
}

let _sharedBrowser: Browser | null = null;
async function getSharedBrowser(): Promise<Browser> {
  if (_sharedBrowser && _sharedBrowser.connected) return _sharedBrowser;
  _sharedBrowser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: true,
  });
  return _sharedBrowser;
}

export async function shutdownInvoicePdfBrowser(): Promise<void> {
  if (_sharedBrowser) {
    try {
      await _sharedBrowser.close();
    } catch {
      /* noop */
    }
    _sharedBrowser = null;
  }
}

export async function renderInvoicePdf(
  data: Record<string, unknown>,
  options: { type?: string } = {}
): Promise<Buffer> {
  return tracer.startActiveSpan('invoice.render-pdf', async (span) => {
    try {
      const tplName = templateForInvoiceType(options.type);
      span.setAttribute('invoice.template', tplName);
      const template = getTemplate(tplName);
      const html = template(data);
      const browser = await getSharedBrowser();
      const page = await browser.newPage();
      try {
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
        });
        span.setStatus({ code: SpanStatusCode.OK });
        return Buffer.from(pdf);
      } finally {
        await page.close().catch(() => {});
      }
    } catch (err) {
      const e = err as Error;
      span.recordException(e);
      span.setStatus({ code: SpanStatusCode.ERROR, message: e.message });
      logger.error('Invoice PDF render failed', err);
      throw err;
    } finally {
      span.end();
    }
  });
}

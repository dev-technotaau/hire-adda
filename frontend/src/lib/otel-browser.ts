import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { Resource } from '@opentelemetry/resources';
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-web';

let initialized = false;

export function initBrowserOtel() {
  if (initialized) return;
  initialized = true;

  const isProduction = process.env.NODE_ENV === 'production';
  const collectorUrl =
    process.env.NEXT_PUBLIC_OTEL_COLLECTOR_URL ||
    (isProduction ? 'https://hireadda.in/otel/v1/traces' : 'http://localhost:4318/v1/traces');

  const provider = new WebTracerProvider({
    resource: new Resource({
      'service.name': 'hire-adda-frontend-browser',
    }),
    sampler: new TraceIdRatioBasedSampler(isProduction ? 0.1 : 1.0),
    spanProcessors: [
      new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: collectorUrl,
        }),
      ),
    ],
  });

  provider.register({
    contextManager: new ZoneContextManager(),
  });

  registerInstrumentations({
    instrumentations: [
      new FetchInstrumentation({
        // Only trace fetch calls to our own backend
        propagateTraceHeaderCorsUrls: [/https?:\/\/(api\.)?hireadda\.in/, /https?:\/\/localhost/],
      }),
      new DocumentLoadInstrumentation(),
    ],
  });
}

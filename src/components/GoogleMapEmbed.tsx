import { useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import { ExternalLink, MapPin } from 'lucide-react';
import { siteConfig } from '../config/site';

interface GoogleMapEmbedProps {
  quotaExceeded: boolean;
}

function OfficeMarkerWithInfoWindow() {
  const [infoOpen, setInfoOpen] = useState(true);
  const [markerRef, marker] = useAdvancedMarkerRef();
  const { brand } = siteConfig;
  const { address } = siteConfig.contact;

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={address.coordinates}
        title={`${brand.name} — ${address.city}, ${address.state}`}
        onClick={() => setInfoOpen((prev) => !prev)}
      >
        <Pin
          background="#00a3ff"
          borderColor="#000000"
          glyphColor="#000000"
          scale={1.15}
        />
      </AdvancedMarker>

      {infoOpen && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={260}
          onCloseClick={() => setInfoOpen(false)}
        >
          {/* Google Maps InfoWindow renders inside a native white popup, so keep ink high-contrast dark */}
          <div className="p-1 text-[#090a0d]">
            <p className="text-[14px] font-semibold text-[#090a0d]">{brand.name}</p>
            <p className="mt-1 text-[13px] leading-5 text-[#454a52]">
              {address.full}, {address.country}
            </p>
            <a
              href={address.googleMapsDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#0066cc] underline"
            >
              <span>Open in Google Maps</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function GoogleMapEmbed({ quotaExceeded }: GoogleMapEmbedProps) {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim();
  const { address } = siteConfig.contact;
  const standardEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    `${address.full}, ${address.country}`
  )}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

  // Automatic interactive Google Maps iframe fallback when no Maps JS API key is configured or quota is reached
  if (!apiKey || quotaExceeded) {
    return (
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
        <div className="relative h-[260px] w-full min-h-[240px]">
          <iframe
            title={`${siteConfig.brand.name} location map — ${address.full}`}
            src={standardEmbedUrl}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] bg-black/90 px-4 py-3 text-[13px]">
          <div className="flex items-center gap-2 text-[var(--color-ink)]">
            <MapPin className="h-4 w-4 shrink-0 text-[#00a3ff]" aria-hidden="true" />
            <span>
              {address.full}, {address.country}
            </span>
          </div>
          <a
            href={address.googleMapsDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-[#00a3ff] hover:underline"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-[280px] w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]"
      aria-label={`Google Map showing ${siteConfig.brand.name} location in ${address.city}, ${address.state}`}
    >
      <APIProvider apiKey={apiKey} libraries={['marker']} language="en" region="IN">
        <GoogleMap
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          defaultCenter={address.coordinates}
          defaultZoom={13}
          gestureHandling="cooperative"
          style={{ width: '100%', height: '100%' }}
        >
          <OfficeMarkerWithInfoWindow />
        </GoogleMap>
      </APIProvider>
    </div>
  );
}

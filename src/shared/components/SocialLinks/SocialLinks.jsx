/**
 * SocialLinks
 * Renders a row of branded social/contact pills.
 * Used in: HogaresPage (OrgCard), OrgProfileSheet.
 *
 * Props:
 *   ig        - Instagram handle (string | null)
 *   wa        - WhatsApp number — only shown if waPublic=true (string | null)
 *   waPublic  - boolean, defaults to false
 *   fb        - Facebook page (string | null)
 *   tt        - TikTok handle (string | null)
 *   website   - Website URL (string | null)
 *   maps      - Google Maps URL (string | null)
 *   size      - 'sm' | 'md' (default 'sm')
 *   className - extra wrapper className
 *   stopPropagation - whether to stopPropagation on wrapper click (default true)
 */

import './SocialLinks.css';

const IG_PATH  = 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z';
const WA_PATH  = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z';
const FB_PATH  = 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z';
const TT_PATH  = 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.52V6.75a4.85 4.85 0 01-1.02-.06z';

function SvgFill({ path, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d={path} />
    </svg>
  );
}

function WebSvg({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function MapsSvg({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/** Resolves a social network handle/url to an absolute URL, or returns null. */
export function buildSocialUrls({ ig, wa, waPublic, fb, tt, website, maps }) {
  const igUrl   = ig ? `https://instagram.com/${ig.replace('@', '')}` : null;
  const waNum   = waPublic ? (wa || null) : null;
  const waUrl   = waNum ? `https://wa.me/${waNum.replace(/[^0-9]/g, '')}` : null;
  const fbUrl   = fb ? (fb.startsWith('http') ? fb : `https://${fb}`) : null;
  const ttUrl   = tt ? `https://tiktok.com/${tt.startsWith('@') ? tt : '@' + tt}` : null;
  const webUrl  = website ? (website.startsWith('http') ? website : `https://${website}`) : null;
  const mapsUrl = maps || null;
  return { igUrl, waUrl, fbUrl, ttUrl, webUrl, mapsUrl };
}

export default function SocialLinks({
  ig, wa, waPublic = false, fb, tt, website, maps,
  size = 'sm', className = '', stopPropagation = true,
}) {
  const iconSize = size === 'sm' ? 14 : 16;
  const { igUrl, waUrl, fbUrl, ttUrl, webUrl, mapsUrl } = buildSocialUrls({ ig, wa, waPublic, fb, tt, website, maps });

  if (!igUrl && !waUrl && !fbUrl && !ttUrl && !webUrl && !mapsUrl) return null;

  const cls = `sl-wrapper sl-wrapper--${size} ${className}`.trim();

  return (
    <div className={cls} onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}>
      {igUrl && (
        <a href={igUrl} target="_blank" rel="noopener noreferrer" className="sl-btn sl-ig">
          <SvgFill path={IG_PATH} size={iconSize} /> Instagram
        </a>
      )}
      {waUrl && (
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="sl-btn sl-wa">
          <SvgFill path={WA_PATH} size={iconSize} /> WhatsApp
        </a>
      )}
      {fbUrl && (
        <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="sl-btn sl-fb">
          <SvgFill path={FB_PATH} size={iconSize} /> Facebook
        </a>
      )}
      {ttUrl && (
        <a href={ttUrl} target="_blank" rel="noopener noreferrer" className="sl-btn sl-tt">
          <SvgFill path={TT_PATH} size={iconSize} /> TikTok
        </a>
      )}
      {webUrl && (
        <a href={webUrl} target="_blank" rel="noopener noreferrer" className="sl-btn sl-web">
          <WebSvg size={iconSize} /> Sitio web
        </a>
      )}
      {mapsUrl && (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="sl-btn sl-maps">
          <MapsSvg size={iconSize} /> Cómo llegar
        </a>
      )}
    </div>
  );
}

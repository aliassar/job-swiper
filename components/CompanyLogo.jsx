'use client';

import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Company logo with an initial-letter fallback.
 *
 * Two distinct failure modes are handled, because both occur in this data:
 *
 * 1. The stored value is not a usable URL. 3,114 of 32,630 jobs have the
 *    four-character string "null" in logo_url rather than SQL NULL, so the
 *    usual `job.logoUrl || fallback` picks the truthy "null" and the browser
 *    requests a relative path that cannot resolve.
 * 2. The URL is well-formed but does not load. 15,490 logos point at
 *    media.licdn.com, whose signed URLs expire and which blocks hotlinking, so
 *    onError has to catch what validation cannot predict.
 *
 * The fallback is the same ui-avatars initial used for jobs that never had a
 * logo, so a broken image looks identical to a missing one.
 */

const AVATAR_BACKGROUND = '0D8ABC';
const NON_URL_VALUES = new Set(['null', 'undefined', 'none', 'nil', 'false', '']);

export function initialAvatarUrl(company, size, background = AVATAR_BACKGROUND) {
  const name = (company || '').trim() || 'N A';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}` +
    `&size=${size}&background=${background}&color=fff&bold=true`;
}

/** A stored logo value is only usable if it is an absolute http(s) URL. */
export function isUsableLogoUrl(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (NON_URL_VALUES.has(trimmed.toLowerCase())) return false;
  return /^https?:\/\//i.test(trimmed);
}

export default function CompanyLogo({
  company,
  logoUrl,
  size = 48,
  className = '',
  background = AVATAR_BACKGROUND,
  ...imgProps
}) {
  const fallback = initialAvatarUrl(company, size, background);
  const [src, setSrc] = useState(() => (isUsableLogoUrl(logoUrl) ? logoUrl.trim() : fallback));

  return (
    <img
      src={src}
      alt={`${company || 'Company'} logo`}
      className={className}
      width={size}
      height={size}
      loading="lazy"
      // Several logo hosts reject requests carrying a referrer from another
      // site, which is one of the ways these images fail.
      referrerPolicy="no-referrer"
      onError={() => {
        // Swap once. Without the guard, a failing fallback would loop forever.
        if (src !== fallback) setSrc(fallback);
      }}
      {...imgProps}
    />
  );
}

CompanyLogo.propTypes = {
  company: PropTypes.string,
  logoUrl: PropTypes.string,
  size: PropTypes.number,
  className: PropTypes.string,
  background: PropTypes.string,
};

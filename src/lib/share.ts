// Worksheet settings travel in the URL so a teacher can send a link that opens the same sheet.
// Format: #/<worksheet>?o=<base64url(JSON options)>

function toB64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '==='.slice((b64.length + 3) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function parseRoute(hash: string): { id: string; opts: Record<string, unknown> | null } {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?');
  const o = new URLSearchParams(query).get('o');
  let opts: Record<string, unknown> | null = null;
  if (o) {
    try {
      const v = JSON.parse(fromB64Url(o));
      if (v && typeof v === 'object' && !Array.isArray(v)) opts = v;
    } catch {
      opts = null;
    }
  }
  return { id: path, opts };
}

export function routeFor(id: string, opts?: Record<string, unknown>): string {
  return opts ? `#/${id}?o=${toB64Url(JSON.stringify(opts))}` : `#/${id}`;
}

export function shareUrl(id: string, opts: Record<string, unknown>): string {
  return `${location.origin}${location.pathname}${routeFor(id, opts)}`;
}

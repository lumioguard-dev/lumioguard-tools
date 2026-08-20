import { type CiteFinding, finding, quote, when } from '../domain/CiteFinding.js';
import type { PageDocument } from '../read/PageDocument.js';

/**
 * A BCP 47 language subtag, which is what an `hreflang` has to open with.
 *
 * Only the LANGUAGE is validated, as Lighthouse does: the value may be
 * language, language-script, or language-region, and the parts after the first
 * are checked for shape rather than against a registry. Two or three letters
 * covers every registered language subtag; anything longer or containing a
 * digit is not one.
 */
const LANGUAGE = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i;

/** The one reserved value, for the page shown when no other locale matches. */
const X_DEFAULT = 'x-default';

/**
 * `hreflang` validity, after Lighthouse's `hreflang` audit.
 *
 * Two failures, both of which silently void the annotation rather than
 * degrading it: a language code no engine recognises, and a relative `href`.
 * An hreflang set that does not parse is an hreflang set that does nothing, and
 * a site publishing one has already decided it wants the alternates honoured.
 */
export function checkHreflang(page: PageDocument): CiteFinding[] {
  const alternates = page.links.filter(
    (link) => link.rel.split(/\s+/).includes('alternate') && link.hreflang !== null,
  );
  if (alternates.length === 0) return [];

  const badCode = alternates.filter((link) => {
    const value = (link.hreflang ?? '').trim();
    return value.toLowerCase() !== X_DEFAULT && !LANGUAGE.test(value);
  });

  const relative = alternates.filter((link) => !/^https?:\/\//i.test(link.href.trim()));

  return [
    ...when(badCode.length > 0, () =>
      finding({
        code: 'document.invalid-hreflang',
        impact: 'major',
        area: 'document',
        title: `${badCode.length} hreflang ${badCode.length === 1 ? 'value is' : 'values are'} not a language code`,
        detail:
          'A value an engine cannot parse is ignored outright, so the alternate it names is never connected to this page. The set reads as complete and does nothing.',
        evidence: quote(
          badCode
            .slice(0, 3)
            .map((link) => `hreflang="${link.hreflang}"`)
            .join(' · '),
        ),
        fix: 'Use a language code such as en, en-GB, or x-default.',
      }),
    ),
    ...when(relative.length > 0, () =>
      finding({
        code: 'document.relative-hreflang',
        impact: 'major',
        area: 'document',
        title: `${relative.length} hreflang ${relative.length === 1 ? 'link is' : 'links are'} not a full address`,
        detail:
          'An hreflang has to name an absolute URL. A relative one is discarded, so the alternate it points at is never associated with this page.',
        evidence: quote(
          relative
            .slice(0, 3)
            .map((link) => link.href)
            .join(' · '),
        ),
        fix: 'Write each alternate as a full https:// address.',
      }),
    ),
  ];
}

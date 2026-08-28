/**
 * ORDERED BY HOW MANY INDEPENDENT WRITE-UPS REPORT IT, not by judgement. The
 * tally, and what was merged, is in `tools/leakpeek/README.md`. This is what
 * goes wrong in general, NOT a list of what this tool checks.
 */
export interface KnownIssue {
  readonly title: string;
  readonly detail: string;
}

export const KNOWN_ISSUES: readonly KnownIssue[] = [
  {
    title: 'Row Level Security is missing',
    detail:
      'Your frontend can connect to the database, but the tables have no RLS rules. Anyone who finds the public client key may be able to read every row, and sometimes update or delete them too.',
  },
  {
    title: 'Secrets end up in the frontend',
    detail:
      'API keys, payment keys or service-role tokens are added to client-side code. Once the app is deployed, those values can be extracted from the browser bundle and used outside your app.',
  },
  {
    title: 'Admin access only exists in the UI',
    detail:
      'The app hides admin buttons from normal users, but the API itself does not check permissions. Someone can call the endpoint directly and bypass what the interface is hiding.',
  },
  {
    title: 'Any record can be fetched by changing the ID',
    detail:
      "The app loads data using an ID from the URL or request without checking who owns it. Changing that ID can return another user's account, order, document or private data.",
  },
  {
    title: 'Users can change protected account fields',
    detail:
      'Fields such as role, plan, credits or balance can be updated by the user. Someone can change their own account to admin, paid or unlimited without going through the intended flow.',
  },
  {
    title: 'Expensive endpoints have no limits',
    detail:
      'AI calls, emails, SMS, image generation or other paid APIs can be called without rate limits. A script can burn through your credits or generate a large bill very quickly.',
  },
  {
    title: 'The client decides how much to charge',
    detail:
      'The frontend sends the payment amount and the server trusts it. A user can change the request before sending it, or fake payment events if webhook signatures are not verified.',
  },
  {
    title: '.env or .git files are publicly accessible',
    detail:
      'Deployment or server configuration exposes files that should never be reachable from the web. A simple request can reveal database URLs, API keys and other credentials.',
  },
  {
    title: 'The app trusts local storage',
    detail:
      'Roles, user IDs or account status are stored in the browser and treated as trusted values. Users can edit local storage themselves, so it should never decide what they are allowed to do.',
  },
  {
    title: 'Login tokens are not properly verified',
    detail:
      'The app accepts session tokens without fully checking their signature, expiry or issuer. In the worst case, someone can create their own token and pretend to be any user.',
  },
];

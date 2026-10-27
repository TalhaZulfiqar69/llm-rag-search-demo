import { load } from "cheerio";

export interface DemoDocument {
  id: string;
  title: string;
  url: string;
  html: string;
}

export const demoDocuments: DemoDocument[] = [
  {
    id: "auth",
    title: "Authentication",
    url: "/docs/authentication",
    html: `
      <h1>Authentication</h1>
      <p>
        The application uses access tokens to authenticate API requests.
        Send the token in the Authorization header using the Bearer scheme.
      </p>
      <p>
        Tokens should be stored securely. Never expose secret keys in
        browser-side JavaScript or commit them to source control.
      </p>
    `,
  },
  {
    id: "search",
    title: "Search",
    url: "/docs/search",
    html: `
      <h1>Search</h1>
      <p>
        Search allows users to find documentation by keywords.
        Semantic search can also retrieve relevant content when the query
        uses different words from the original documentation.
      </p>
    `,
  },
  {
    id: "deployment",
    title: "Deployment",
    url: "/docs/deployment",
    html: `
      <h1>Deployment</h1>
      <p>
        Deploy the Node.js API as a server-side service.
        Store API keys in environment variables or a secret manager.
        Use HTTPS and restrict access to internal database services.
      </p>
    `,
  },
];

export function htmlToText(html: string): string {
  const $ = load(html);

  $("script, style, nav, footer, header, noscript").remove();

  return $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim();
}
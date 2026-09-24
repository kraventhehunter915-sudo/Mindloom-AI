import { ScrollViewStyleReset } from "expo-router/html";

export default function RootHtml({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="theme-color" content="#34785C" />
        <meta
          name="description"
          content="Mindloom AI — a calm, connected workspace for notes, ideas, and AI-assisted thinking."
        />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/assets/images/favicon.png" />
        <title>Mindloom AI</title>
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `html, body { background: #F3F5F0; } body { margin: 0; }`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

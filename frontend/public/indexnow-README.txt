IndexNow instant indexing — setup instructions
================================================

IndexNow is a Microsoft-and-Yandex-backed protocol that lets you notify
Bing, Yandex, Seznam, Naver, and a growing list of participating engines
the moment a URL changes on your site. Unlike sitemap-based discovery
(which can take days), IndexNow typically indexes within minutes.

To activate:

1. Generate a key. Any URL-safe 8-128 character string:
     openssl rand -hex 32

2. Create the key file at the project root:
     public/<KEY>.txt
   Contents of the file is just the key value on one line. Example:
     echo "d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8" > public/d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8.txt

3. Set the env var INDEXNOW_KEY in .env.production with the same value.

4. Wire a ping on content publish. Example (Next.js Route Handler):

     // src/app/api/indexnow-ping/route.ts
     export async function POST(req: Request) {
       const { urls } = await req.json();
       const key = process.env.INDEXNOW_KEY;
       const host = 'hireadda.in';
       await fetch('https://api.indexnow.org/IndexNow', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           host,
           key,
           keyLocation: `https://${host}/${key}.txt`,
           urlList: urls,
         }),
       });
       return Response.json({ ok: true });
     }

5. For static public pages (marketing, legal), ping on each deploy:

     curl -X POST https://hireadda.in/api/indexnow-ping \
          -H "Content-Type: application/json" \
          -d '{"urls": ["https://hireadda.in/", "https://hireadda.in/about"]}'

6. For dynamic content (job postings, company profiles when they go live),
   fire a ping from the backend write path whenever a record is created,
   updated, or deleted.

Verification: Microsoft Bing → https://www.bing.com/webmasters/indexnow
will confirm that your key file is reachable and that pings are landing.

DELETE THIS FILE once the real key file is in place — it's only a
setup reminder, not part of the production asset set.

Learn more: https://www.indexnow.org/

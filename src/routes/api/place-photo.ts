import { createFileRoute } from "@tanstack/react-router";

function imageResponse(status: number) {
  return new Response(null, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export const Route = createFileRoute("/api/place-photo")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const photoName = params.get("name") || "";
        const expires = Number(params.get("expires"));
        const signature = params.get("signature") || "";
        const segments = photoName.split("/");
        if (
          segments.length !== 4 ||
          segments[0] !== "places" ||
          segments[2] !== "photos" ||
          !segments[1] ||
          !segments[3] ||
          !segments.slice(1).every((segment) => /^[A-Za-z0-9_-]+$/.test(segment))
        ) {
          return imageResponse(400);
        }

        const apiKey = process.env.GOOGLE_PLACES_KEY?.trim();
        if (!apiKey) return imageResponse(503);
        const now = Date.now();
        if (!Number.isFinite(expires) || expires <= now || expires > now + 31 * 60 * 1000) {
          return imageResponse(403);
        }

        const { verifyPlacePhotoSignature } = await import("@/lib/place-photo-signature.server");
        if (!verifyPlacePhotoSignature(photoName, expires, signature, apiKey)) {
          return imageResponse(403);
        }

        try {
          const upstream = await fetch(
            `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=720`,
            {
              headers: { "X-Goog-Api-Key": apiKey, Accept: "image/*" },
              signal: AbortSignal.timeout(10_000),
            },
          );
          const contentType = upstream.headers.get("content-type") || "";
          if (!upstream.ok || !contentType.startsWith("image/") || !upstream.body) {
            return imageResponse(502);
          }

          return new Response(upstream.body, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "no-store",
              "X-Content-Type-Options": "nosniff",
            },
          });
        } catch {
          return imageResponse(502);
        }
      },
    },
  },
});

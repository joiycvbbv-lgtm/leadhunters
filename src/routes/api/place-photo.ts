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
          photoName.length > 2048 ||
          segments.length !== 4 ||
          segments[0] !== "places" ||
          segments[2] !== "photos" ||
          !segments[1] ||
          !segments[3] ||
          !segments.slice(1).every((segment) => segment !== "." && segment !== ".." && !segment.includes("\\") && !/[\u0000-\u0020\u007f]/.test(segment))
        ) {
          return imageResponse(400);
        }

        const apiKey = process.env.GOOGLE_PLACES_KEY?.trim();
        if (!apiKey) return imageResponse(503);
        const now = Date.now();
        if (!Number.isFinite(expires) || expires <= now || expires > now + 25 * 60 * 60 * 1000) {
          return imageResponse(403);
        }

        const { verifyPlacePhotoSignature } = await import("@/lib/place-photo-signature.server");
        if (!verifyPlacePhotoSignature(photoName, expires, signature, apiKey)) {
          return imageResponse(403);
        }

        try {
          const resourcePath = segments.map((segment) => encodeURIComponent(segment)).join("/");
          const photoUrl = new URL(`https://places.googleapis.com/v1/${resourcePath}/media`);
          photoUrl.searchParams.set("maxWidthPx", "720");
          photoUrl.searchParams.set("skipHttpRedirect", "true");
          photoUrl.searchParams.set("key", apiKey);

          const photoResponse = await fetch(photoUrl, {
            headers: {
              Accept: "application/json",
              "X-Goog-Api-Key": apiKey,
            },
            signal: AbortSignal.timeout(10_000),
          });
          if (!photoResponse.ok) {
            console.warn("[place-photo] Google photo request failed", photoResponse.status);
            return imageResponse(502);
          }

          const photoPayload = (await photoResponse.json().catch(() => null)) as { photoUri?: unknown } | null;
          if (typeof photoPayload?.photoUri !== "string") {
            console.warn("[place-photo] Google photo response did not include a photo URI");
            return imageResponse(502);
          }

          const imageUrl = new URL(photoPayload.photoUri);
          const host = imageUrl.hostname.toLowerCase();
          if (
            imageUrl.protocol !== "https:" ||
            !(host === "googleusercontent.com" || host.endsWith(".googleusercontent.com"))
          ) {
            console.warn("[place-photo] Google returned an unexpected photo host");
            return imageResponse(502);
          }

          const upstream = await fetch(imageUrl, {
            headers: { Accept: "image/*" },
            signal: AbortSignal.timeout(10_000),
          });
          const contentType = upstream.headers.get("content-type") || "";
          if (!upstream.ok || !contentType.startsWith("image/") || !upstream.body) {
            console.warn("[place-photo] Google image download failed", upstream.status);
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
          console.warn("[place-photo] Photo proxy request failed");
          return imageResponse(502);
        }
      },
    },
  },
});

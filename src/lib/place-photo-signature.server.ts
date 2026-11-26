import { createHmac, timingSafeEqual } from "node:crypto";

export function signPlacePhoto(name: string, expires: number, secret: string) {
  return createHmac("sha256", secret).update(`${expires}\n${name}`).digest("hex");
}

export function verifyPlacePhotoSignature(
  name: string,
  expires: number,
  signature: string,
  secret: string,
) {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = Buffer.from(signPlacePhoto(name, expires, secret), "hex");
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function generateKey() {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const exported = await crypto.subtle.exportKey("jwk", key);
  await chrome.storage.session.set({ githubCryptoKey: exported });
  return key;
}

export async function getKey() {
  const { githubCryptoKey } = await chrome.storage.session.get("githubCryptoKey");
  if (!githubCryptoKey) return null;
  return crypto.subtle.importKey("jwk", githubCryptoKey, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
}

export async function encrypt(text, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return { ciphertext: Array.from(new Uint8Array(encrypted)), iv: Array.from(iv) };
}

export async function decrypt(cipherData, key) {
  const { ciphertext, iv } = cipherData;
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    new Uint8Array(ciphertext)
  );
  return new TextDecoder().decode(decrypted);
}

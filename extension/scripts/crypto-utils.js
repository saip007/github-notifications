"use strict";

export async function generateKey() {
  try {
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const exported = await crypto.subtle.exportKey("jwk", key);
    await chrome.storage.session.set({ githubCryptoKey: exported });
    return key;
  } catch (err) {
    console.error("Key generation failed:", err);
    throw err;
  }
}

export async function getKey() {
  try {
    const { githubCryptoKey } = await chrome.storage.session.get("githubCryptoKey");
    if (!githubCryptoKey) return null;
    return crypto.subtle.importKey("jwk", githubCryptoKey, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
  } catch (err) {
    console.error("Key import failed:", err);
    return null;
  }
}

export async function clearKey() {
  try {
    await chrome.storage.session.remove("githubCryptoKey");
  } catch (err) {
    console.error("Key clearing failed:", err);
  }
}

export async function encrypt(text, key) {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
    return { ciphertext: Array.from(new Uint8Array(encrypted)), iv: Array.from(iv) };
  } catch (err) {
    console.error("Encryption failed:", err);
    throw err;
  }
}

export async function decrypt(cipherData, key) {
  try {
    const { ciphertext, iv } = cipherData;
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      new Uint8Array(ciphertext)
    );
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error("Decryption failed:", err);
    throw err;
  }
}

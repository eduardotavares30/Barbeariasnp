import { readFile } from "node:fs/promises";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";

async function credentialFromEnvironment() {
  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialPath) return applicationDefault();
  const serviceAccount = JSON.parse(await readFile(credentialPath, "utf8"));
  return cert(serviceAccount);
}

export async function getAdminApp() {
  if (getApps().length) return getApps()[0];
  return initializeApp({
    credential: await credentialFromEnvironment(),
    projectId: process.env.FIREBASE_PROJECT_ID || "barbearia50k",
  });
}

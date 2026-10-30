import { stdin, stdout } from "node:process";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "./firebase-admin-app.mjs";

const email = "eduardolacerda0908@gmail.com";

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY) return reject(new Error("Execute este comando em um terminal interativo."));
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      stdout.write("\n");
    };
    const onData = (key) => {
      if (key === "\u0003") {
        cleanup();
        reject(new Error("Operação cancelada."));
      } else if (key === "\r" || key === "\n") {
        cleanup();
        resolve(value);
      } else if (key === "\u007f" || key === "\b") {
        value = value.slice(0, -1);
      } else {
        value += key;
      }
    };
    stdin.on("data", onData);
  });
}

const password = await readHidden(`Senha para ${email}: `);
if (password.length < 6) throw new Error("A senha precisa ter pelo menos 6 caracteres.");

const app = await getAdminApp();
const auth = getAuth(app);
let user;
let created = false;
try {
  user = await auth.getUserByEmail(email);
  user = await auth.updateUser(user.uid, { password, disabled: false });
  console.log("Usuário existente atualizado.");
} catch (error) {
  if (error.code !== "auth/user-not-found") throw error;
  user = await auth.createUser({ email, password, emailVerified: true, disabled: false });
  created = true;
  console.log("Usuário administrador criado.");
}

await auth.setCustomUserClaims(user.uid, { admin: true });
const adminProfile = {
  nome: "Administrador principal",
  email,
  tipo: "admin",
  status: "ativo",
  updatedAt: FieldValue.serverTimestamp(),
};
if (created) adminProfile.createdAt = FieldValue.serverTimestamp();
await getFirestore(app).collection("admins").doc(user.uid).set(adminProfile, { merge: true });

console.log("Perfil administrativo confirmado com segurança. A senha não foi gravada em arquivo.");

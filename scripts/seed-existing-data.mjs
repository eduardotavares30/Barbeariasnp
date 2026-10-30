import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "./firebase-admin-app.mjs";

const db = getFirestore(await getAdminApp());

const [services, professionals] = await Promise.all([
  db.collection("servicos").limit(1).get(),
  db.collection("profissionais").limit(1).get(),
]);

if (services.empty) {
  const batch = db.batch();
  [
    ["corte-maquina", "Corte Máquina", 30, 30, 1],
    ["corte-tesoura", "Corte Tesoura", 80, 60, 2],
    ["sobrancelha", "Sobrancelha", 15, 30, 3],
  ].forEach(([id, nome, valor, tempoMin, ordem]) => batch.set(db.collection("servicos").doc(id), {
    nome, descricao: "", valor, tempoMin, ativo: true, ordem,
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  }));
  await batch.commit();
  console.log("Serviços existentes no site foram cadastrados no Firestore.");
} else {
  console.log("Serviços já existem; nenhum dado foi duplicado.");
}

if (professionals.empty) {
  await db.collection("profissionais").doc("rodrigotorre2").set({
    nome: "Rodrigo dos Anjos",
    whatsapp: "5581983704290",
    colecao: "reservas_rodrigotorre2",
    fimExpediente: "18:30",
    diasFolga: [0],
    ativo: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  console.log("Profissional presente no projeto original foi cadastrado.");
} else {
  console.log("Profissionais já existem; nenhum dado foi duplicado.");
}

await db.collection("config").doc("horarios").set({ inicio: "09:00", fim: "19:00" }, { merge: true });
await db.collection("config").doc("semana").set({
  weekdays: [1, 2, 3, 4, 5, 6], dayStart: "09:00", dayEnd: "19:00",
}, { merge: true });
console.log("Horário de funcionamento confirmado.");

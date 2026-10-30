import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "./firebase-admin-app.mjs";

const db = getFirestore(await getAdminApp());
const professionals = await db.collection("profissionais").get();
let migrated = 0;

const toMinutes = (value) => {
  const [h, m] = String(value).split(":").map(Number);
  return h * 60 + m;
};
const toHHmm = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

for (const professional of professionals.docs) {
  const colecao = professional.data().colecao;
  if (!/^reservas_[a-z0-9_]+$/.test(colecao || "")) continue;
  const reservations = await db.collection(colecao).get();
  for (const reservation of reservations.docs) {
    const value = reservation.data();
    if (!value.data || !value.hora) continue;
    const duration = Math.max(30, Number(value.servicoTempoMin) || 30);
    const batch = db.batch();
    for (let offset = 0; offset < duration; offset += 30) {
      const slot = toHHmm(toMinutes(value.hora) + offset);
      const id = `${colecao}__${value.data}_${slot}`;
      batch.set(db.collection("availability").doc(id), {
        colecao,
        data: value.data,
        hora: slot,
        inicioReserva: value.hora,
        duracaoMin: duration,
        reservaId: reservation.id,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    await batch.commit();
    migrated += 1;
  }
}

console.log(`${migrated} agendamento(s) sincronizado(s) com a disponibilidade pública.`);

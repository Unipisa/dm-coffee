module.exports = {
  async up(db, client) {
    await db.collection("users").updateMany(
      { code: { $exists: true } }, // Prendi tutti i documenti con "code"
      [
        {
          $set: {
            codes: {
              $cond: {
                if: { $isArray: "$code" }, // Se è già un array, lo lascia così
                then: "$code",
                else: ["$code"] // Se è una stringa, lo converte in array
              }
            }
          }
        },
        { $unset: "code" } // Rimuove "code" dopo la conversione
      ]
    );
  },

  async down(db, client) {
    await db.collection("users").updateMany(
      { codes: { $exists: true, $type: "array" } },
      [
        {
          $set: {
            code: { $arrayElemAt: ["$codes", 0] } // Prendi il primo elemento dell'array
          }
        },
        { $unset: "codes" } // Rimuove "codes" per tornare al vecchio schema
      ]
    );
  }
};

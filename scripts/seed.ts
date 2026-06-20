// Seed script: VOLONTAIREMENT VIDE.
// L'utilisateur a demandé que la base démarre VIERGE, sans cursus par défaut.
// Les cursus sont créés :
//   - soit automatiquement par l'extension Chrome quand on capture un cours DataCamp
//   - soit manuellement via le bouton "+" sur le dashboard
async function seed() {
  console.log('Seed volontairement vide. La base demarre vierge.')
  console.log('Les cursus seront crees par l\'extension DataCamp ou le bouton "+".')
}

seed()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => {
    const { db } = await import('../src/lib/db')
    await db.$disconnect()
  })

import { NextResponse } from 'next/server'

// GET /api/integrations/datacamp
// Returns the status of DataCamp integration (for the dashboard indicator)
export async function GET() {
  return NextResponse.json({
    connected: false, // Always false - we can't detect Chrome extension from server
    extensionAvailable: true,
    bookmarkletUrl: 'javascript:(function(){const c=document.querySelector("article, main, [class*=exercise__content], [class*=WorkspaceBody]")||document.body;const t=(c.innerText||document.body.innerText).slice(0,8000);const u=window.location.href;const w=window.open("about:blank","_blank");w.document.write(`<form id="f" method="POST" action="${window.location.origin.startsWith("http") ? window.location.origin : "http://localhost:3000"}/api/missions/quick" enctype="application/x-www-form-urlencoded"><input name="courseContent" value="${encodeURIComponent(t)}"><input name="courseLink" value="${encodeURIComponent(u)}"></form>`);w.document.close();})();',
    extensionUrl: '/mnemo-datacamp-extension/',
    instructions: [
      'Installez l\'extension Chrome "Mnemo DataCamp Bridge" (dossier téléchargeable)',
      'Naviguez sur app.datacamp.com',
      'Cliquez sur l\'icône Mnemo dans la barre d\'extensions',
      'Sélectionnez le cursus cible et cliquez "Capturer & Envoyer"',
    ],
  })
}

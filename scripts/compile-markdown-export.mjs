import fs from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  bold: '\x1b[1m'
};

const backupPath = path.resolve(process.cwd(), 'scripts/n8n_workflows_backup.json');
const mdPath = path.resolve(process.cwd(), 'scripts/n8n_workflows_export.md');

async function main() {
  console.log(`\n${colors.cyan}${colors.bold}📝 REBUILDING N8N WORKFLOWS MARKDOWN EXPORT ARTIFACT...${colors.reset}\n`);

  try {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found at ${backupPath}`);
    }

    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    // Find workflows
    const lovina1 = backupData.find(w => w.name && w.name.includes('Lovina 1'));
    const lovina2 = backupData.find(w => w.name && w.name.includes('Lovina 2'));
    const lovina3 = backupData.find(w => w.name && w.name.includes('Lovina 3'));

    if (!lovina1 || !lovina2 || !lovina3) {
      throw new Error("Could not find all three Lovina workflows (Lovina 1, Lovina 2, Lovina 3) in backup JSON.");
    }

    // Redaction function
    const redact = (wf) => {
      const cleanWf = {
        name: wf.name,
        nodes: wf.nodes,
        connections: wf.connections
      };

      let jsonStr = JSON.stringify(cleanWf, null, 2);

      // Redact Meta access tokens
      jsonStr = jsonStr.replace(/EAA[A-Za-z0-9]+/g, 'YOUR_META_ACCESS_TOKEN');

      // Redact Meta Phone Number IDs
      jsonStr = jsonStr.replace(/1248861244970433/g, 'YOUR_META_PHONE_NUMBER_ID');
      jsonStr = jsonStr.replace(/1146773325183741/g, 'YOUR_META_PHONE_NUMBER_ID');

      // Redact email addresses
      jsonStr = jsonStr.replace(/nthn6828@gmail\.com/g, 'YOUR_EMAIL_ADDRESS');

      return jsonStr;
    };

    const cleanL1 = redact(lovina1);
    const cleanL2 = redact(lovina2);
    const cleanL3 = redact(lovina3);

    // Build the complete markdown content
    const markdownContent = `# Bali Dolphin Tours: Complete Production n8n Workflows

You can import any of these production workflows into n8n in **2 seconds**:
1. Open n8n in your browser.
2. Create a new workflow.
3. Copy one of the JSON blocks below.
4. Paste it directly onto the n8n canvas (or press \`Cmd+V\` / \`Ctrl+V\`).

> [!IMPORTANT]
> All active Meta tokens, personal emails, and credentials have been redacted as \`YOUR_META_ACCESS_TOKEN\`, \`YOUR_META_PHONE_NUMBER_ID\`, and \`YOUR_EMAIL_ADDRESS\` for security. Make sure to replace these placeholder strings or select the corresponding n8n credentials after pasting.

---

## 1. Lovina 1: Prioritized Sequential Meta Loop (Booking Dispatcher)
This workflow is triggered when a traveler successfully completes a Stripe Checkout session. It parses checkout metadata, inserts a booking row, and enters a sequential bidding loop, notifying the highest-priority captain first, waiting for a claim, and proceeding down the list if unclaimed.
*Updated to use short, pronounceable metadata-driven booking IDs, Service Account auth for Google Sheets, and the v5 captain broadcast template.*

\`\`\`json
${cleanL1}
\`\`\`

---

## 2. Lovina 2: Bidding Claim & Contract Request (Inbound Hook Router)
This workflow handles inbound WhatsApp quick-replies (e.g., clicking the "Terima Tugas" / "Claim Trip" button). It processes button clicks safely, verifies captain status, updates the Google Sheet, and responds with the Captain Behavior Contract link.
*Updated with the Vercel-hosted agreement form, Service Account auth, and safe boolean conditional checks.*

\`\`\`json
${cleanL2}
\`\`\`

---

## 3. Lovina 3: Contract Signed & Lead Unlock (Signed Agreement Dispatcher)
This workflow is triggered when a captain successfully signs the rules on your web page, which POSTs to \`/api/captain-agreement\` and forwards to n8n. It releases the private guest coordinates (Name, Phone, Hotel, Pickup details) and sends the template alert containing these details directly to the signed captain.
*Updated with explicit self-drive meeting point (Dolphin Statue monument), Google Maps link, dynamic meetup times, and Service Account Google Sheets/Calendar authentication.*

\`\`\`json
${cleanL3}
\`\`\`
`;

    // Write the new file
    fs.writeFileSync(mdPath, markdownContent, 'utf8');
    console.log(`${colors.green}${colors.bold}✔ SUCCESSFULLY REBUILT MARKDOWN EXPORT FILE AT:${colors.reset}`);
    console.log(`  ${mdPath}\n`);

  } catch (error) {
    console.error(`${colors.red}✖ Error generating markdown: ${error.message}${colors.reset}\n`);
  }
}

main();

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import JSZip from 'npm:jszip@3.10.1';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { onboardingCaseId } = await req.json();
  if (!onboardingCaseId) {
    return Response.json({ error: 'onboardingCaseId is required' }, { status: 400 });
  }

  // Fetch all documents for this case
  const documents = await base44.asServiceRole.entities.DocumentUpload.filter({
    onboardingCaseId
  });

  if (!documents || documents.length === 0) {
    return Response.json({ error: 'No documents found for this case' }, { status: 404 });
  }

  const zip = new JSZip();
  const nameCount = {};

  for (const doc of documents) {
    if (!doc.fileUrl) continue;

    // Generate unique file name
    let baseName = doc.fileName || doc.documentName || 'documento';
    if (nameCount[baseName]) {
      nameCount[baseName]++;
      const parts = baseName.split('.');
      if (parts.length > 1) {
        const ext = parts.pop();
        baseName = `${parts.join('.')}_${nameCount[baseName]}.${ext}`;
      } else {
        baseName = `${baseName}_${nameCount[baseName]}`;
      }
    } else {
      nameCount[baseName] = 1;
    }

    try {
      let downloadUrl = doc.fileUrl;

      // If it's a private file (b44s:// or private storage), get a signed URL
      if (doc.fileUrl.startsWith('b44s://') || doc.fileUrl.includes('/private/')) {
        const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
          file_uri: doc.fileUrl,
          expires_in: 120
        });
        downloadUrl = signed_url;
      }

      const response = await fetch(downloadUrl);
      if (!response.ok) {
        console.error(`Failed to download ${baseName}: ${response.status}`);
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      zip.file(baseName, arrayBuffer);
    } catch (err) {
      console.error(`Error downloading ${baseName}:`, err.message);
      continue;
    }
  }

  const filesInZip = Object.keys(zip.files).length;
  if (filesInZip === 0) {
    return Response.json({ error: 'Could not download any documents' }, { status: 500 });
  }

  const zipBuffer = await zip.generateAsync({ type: 'uint8array' });

  return new Response(zipBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="documentos_${onboardingCaseId}.zip"`,
    },
  });
});
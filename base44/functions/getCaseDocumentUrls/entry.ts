import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const { onboardingCaseId } = await req.json();
  if (!onboardingCaseId) {
    return Response.json({ error: 'onboardingCaseId is required' }, { status: 400 });
  }

  const documents = await base44.asServiceRole.entities.DocumentUpload.filter({
    onboardingCaseId
  });

  if (!documents || documents.length === 0) {
    return Response.json({ error: 'No documents found' }, { status: 404 });
  }

  const results = [];

  for (const doc of documents) {
    if (!doc.fileUrl) continue;

    const fileName = doc.fileName || doc.documentName || 'documento';

    try {
      let downloadUrl = doc.fileUrl;

      // If private file, generate signed URL
      if (doc.fileUrl.startsWith('b44s://') || doc.fileUrl.includes('/private/')) {
        const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
          file_uri: doc.fileUrl,
          expires_in: 120
        });
        downloadUrl = signed_url;
      }

      results.push({ fileName, url: downloadUrl, docId: doc.id });
    } catch (err) {
      console.error(`Error getting URL for ${fileName}:`, err.message);
    }
  }

  return Response.json({ documents: results });
});
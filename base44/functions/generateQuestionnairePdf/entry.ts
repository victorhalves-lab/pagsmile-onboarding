import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const payload = await req.json();
        const { questionnaireTemplateId } = payload;
        
        if (!questionnaireTemplateId) {
            return Response.json({ error: 'questionnaireTemplateId is required' }, { status: 400 });
        }

        const template = await base44.entities.QuestionnaireTemplate.get(questionnaireTemplateId);
        if (!template) {
             return Response.json({ error: 'Template not found' }, { status: 404 });
        }

        const questions = await base44.entities.Question.filter({ questionnaireTemplateId }, 'order');
        
        const doc = new jsPDF();

        // Title and headers
        doc.setFontSize(16);
        doc.text(`Questionario: ${template.name}`, 20, 20);

        doc.setFontSize(10);
        doc.text(`Categoria: ${template.category} | Versao: ${template.version}`, 20, 30);
        doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 20, 36);

        // Questions content
        let y = 50;
        doc.setFontSize(11);
        
        questions.forEach((q, index) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            // Bold for question text
            doc.setFont('helvetica', 'bold');
            const questionText = `${index + 1}. ${q.text} ${q.isRequired ? '*' : ''}`;
            const splitTitle = doc.splitTextToSize(questionText, 170);
            doc.text(splitTitle, 20, y);
            y += (splitTitle.length * 6);
            
            doc.setFont('helvetica', 'normal');
            
            if (q.type === 'SELECT' || q.type === 'MULTI_SELECT') {
                 if (q.options && q.options.length > 0) {
                     q.options.forEach(opt => {
                          if (y > 280) {
                              doc.addPage();
                              y = 20;
                          }
                          doc.text(`- ${opt}`, 25, y);
                          y += 6;
                     });
                 }
            } else {
                 doc.text(`[ ${q.type} ]`, 25, y);
                 y += 6;
            }
            
            if (q.helpText) {
                doc.setFontSize(9);
                doc.setTextColor(100);
                const splitHelp = doc.splitTextToSize(`Ajuda: ${q.helpText}`, 165);
                doc.text(splitHelp, 25, y);
                y += (splitHelp.length * 5);
                doc.setFontSize(11);
                doc.setTextColor(0);
            }
            
            y += 4; // spacing between questions
        });

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=questionario_${template.name.replace(/\s+/g, '_')}.pdf`
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function evaluateCondition(condition, data) {
  const { field, operator, value } = condition;
  const fieldValue = field.split('.').reduce((obj, key) => obj?.[key], data);

  switch (operator) {
    case 'equals': return String(fieldValue) === String(value);
    case 'not_equals': return String(fieldValue) !== String(value);
    case 'greater_than': return Number(fieldValue) > Number(value);
    case 'less_than': return Number(fieldValue) < Number(value);
    case 'greater_than_or_equal': return Number(fieldValue) >= Number(value);
    case 'less_than_or_equal': return Number(fieldValue) <= Number(value);
    case 'contains': return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
    case 'in': return String(value).split(',').map(v => v.trim()).includes(String(fieldValue));
    default: return false;
  }
}

function evaluateRule(rule, data) {
  const conditions = rule.conditions || [];
  if (conditions.length === 0) return { matched: false, reason: 'Nenhuma condição definida' };

  const results = conditions.map(c => ({
    condition: `${c.field} ${c.operator} ${c.value}`,
    result: evaluateCondition(c, data),
    actualValue: c.field.split('.').reduce((obj, key) => obj?.[key], data)
  }));

  const logicOp = rule.logicOperator || 'AND';
  const matched = logicOp === 'AND'
    ? results.every(r => r.result)
    : results.some(r => r.result);

  const actions = matched ? (rule.actions || []).map(a => {
    if (a.actionType === 'set_status') return `Definir status para "${a.parameters?.status}"`;
    if (a.actionType === 'send_notification') return `Enviar notificação`;
    if (a.actionType === 'assign_analyst') return `Atribuir analista`;
    if (a.actionType === 'request_document') return `Solicitar documentos`;
    if (a.actionType === 'add_flag') return `Adicionar flag de risco`;
    if (a.actionType === 'update_field') return `Atualizar campo`;
    return `Ação: ${a.actionType}`;
  }) : [];

  return { matched, logicOperator: logicOp, conditionResults: results, actionsToExecute: actions };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { rule, testData } = await req.json();
    if (!rule || !testData) {
      return Response.json({ error: 'rule and testData are required' }, { status: 400 });
    }

    const result = evaluateRule(rule, testData);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
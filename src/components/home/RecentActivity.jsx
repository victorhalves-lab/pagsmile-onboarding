import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Plus, Pencil, Trash2, Eye, CheckCircle, XCircle, Shield } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

const ACTION_CONFIG = {
  CREATE: { icon: Plus, color: 'bg-green-100 text-green-600' },
  UPDATE: { icon: Pencil, color: 'bg-blue-100 text-blue-600' },
  DELETE: { icon: Trash2, color: 'bg-red-100 text-red-600' },
  VIEW: { icon: Eye, color: 'bg-slate-100 text-slate-600' },
  APPROVAL: { icon: CheckCircle, color: 'bg-green-100 text-green-600' },
  REJECTION: { icon: XCircle, color: 'bg-red-100 text-red-600' },
  VALIDATION: { icon: Shield, color: 'bg-purple-100 text-purple-600' },
};

export default function RecentActivity({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--pagsmile-green)]" />
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--pagsmile-blue)]/50 text-center py-4">Nenhuma atividade recente</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-[var(--pagsmile-green)]" />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.map((log, idx) => {
            const config = ACTION_CONFIG[log.actionType] || ACTION_CONFIG.VIEW;
            const Icon = config.icon;
            return (
              <div key={log.id || idx} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                <div className={`p-1.5 rounded-lg ${config.color} shrink-0 mt-0.5`}>
                  <Icon className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--pagsmile-blue)] font-medium leading-relaxed line-clamp-2">
                    {log.actionDescription || `${log.actionType} em ${log.entityName}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-[var(--pagsmile-blue)]/50 font-medium">
                      {log.changedBy?.split('@')[0] || 'Sistema'}
                    </span>
                    <span className="text-[10px] text-[var(--pagsmile-blue)]/30">•</span>
                    <span className="text-[10px] text-[var(--pagsmile-blue)]/50">
                      {moment(log.changeDate || log.created_date).fromNow()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
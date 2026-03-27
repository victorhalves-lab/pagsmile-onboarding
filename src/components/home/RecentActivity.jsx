import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Plus, Pencil, Trash2, Eye, CheckCircle, XCircle, Shield } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/pt-br';
import { useTranslation } from '@/lib/i18n/LanguageContext';

moment.locale('pt-br');

const ACTION_CONFIG = {
  CREATE: { icon: Plus, color: 'bg-[#2bc196]/10 text-[#2bc196]' },
  UPDATE: { icon: Pencil, color: 'bg-[#36706c]/10 text-[#36706c]' },
  DELETE: { icon: Trash2, color: 'bg-red-100 text-red-500' },
  VIEW: { icon: Eye, color: 'bg-[#002443]/10 text-[#002443]' },
  APPROVAL: { icon: CheckCircle, color: 'bg-[#2bc196]/10 text-[#2bc196]' },
  REJECTION: { icon: XCircle, color: 'bg-red-100 text-red-500' },
  VALIDATION: { icon: Shield, color: 'bg-[#36706c]/10 text-[#36706c]' },
};

export default function RecentActivity({ logs }) {
  const { t } = useTranslation();

  if (!logs || logs.length === 0) {
    return (
      <Card className="rounded-2xl border-[#002443]/5 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 font-bold text-[#002443]">
            <div className="p-1.5 rounded-lg bg-[#002443]/10">
              <Activity className="w-3.5 h-3.5 text-[#002443]" />
            </div>
            {t('activity.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#282828]/30 text-center py-6">{t('activity.none')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-[#002443]/5 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 font-bold text-[#002443]">
          <div className="p-1.5 rounded-lg bg-[#002443]/10">
            <Activity className="w-3.5 h-3.5 text-[#002443]" />
          </div>
          {t('activity.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {logs.map((log, idx) => {
            const config = ACTION_CONFIG[log.actionType] || ACTION_CONFIG.VIEW;
            const Icon = config.icon;
            return (
              <div key={log.id || idx} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f4f4f4] transition-colors">
                <div className={`p-2 rounded-lg ${config.color} shrink-0 mt-0.5`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#002443] font-medium leading-relaxed line-clamp-2">
                    {log.actionDescription || `${log.actionType} em ${log.entityName}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-[#282828]/40 font-semibold">
                      {log.changedBy?.split('@')[0] || t('activity.system')}
                    </span>
                    <span className="text-[10px] text-[#282828]/20">•</span>
                    <span className="text-[10px] text-[#282828]/40">
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
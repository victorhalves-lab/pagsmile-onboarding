// Mapa de ícones lucide usados em perfis/seções
import {
  Shield, ShieldCheck, Crown, Briefcase, Users, Handshake, DollarSign, Eye,
  Inbox, Stamp, Database, BarChart3, Wrench, Plug, Settings, BookOpen, Folder, FileText
} from 'lucide-react';

export const ICON_MAP = {
  Shield, ShieldCheck, Crown, Briefcase, Users, Handshake, DollarSign, Eye,
  Inbox, Stamp, Database, BarChart3, Wrench, Plug, Settings, BookOpen, Folder, FileText
};

export function getIcon(name, fallback = Folder) {
  return ICON_MAP[name] || fallback;
}
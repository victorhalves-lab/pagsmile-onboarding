import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';

// ══════════════════════════════════════════════════════════════════
// PermissionsProvider — fonte de permissões no frontend
// ══════════════════════════════════════════════════════════════════
// Busca as permissões via getMyPermissions no mount e expõe helpers:
//   - canAccessPage(pageId)
//   - canViewTab(pageId, tabId)
//   - canEditTab(pageId, tabId)
//   - canViewSubTab(pageId, tabId, subTabId)
//   - canEditSubTab(pageId, tabId, subTabId)
//   - can(pageId, actionId)
//
// Regras:
//   - isAdmin → bypass full (retorna true pra tudo)
//   - default DENY pra tudo que não estiver explicitamente permitido
// ══════════════════════════════════════════════════════════════════

const PermissionsContext = createContext(null);

const CACHE_KEY = 'base44_permissions_cache';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

function loadCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch { return null; }
}

function saveCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

export function clearPermissionsCache() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch {}
}

export function PermissionsProvider({ children }) {
  const [data, setData] = useState(() => loadCache());
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('getMyPermissions', {});
      if (res?.data?.authenticated) {
        setData(res.data);
        saveCache(res.data);
      } else {
        setData(null);
      }
    } catch (e) {
      console.warn('[PermissionsProvider] Failed to fetch permissions:', e?.message);
      setError(e?.message || 'Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Se já temos cache fresco, não refetch
    if (!data) fetchPermissions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const helpers = useMemo(() => {
    const isAdmin = !!data?.isAdmin;
    const pagePerms = Array.isArray(data?.pagePermissions) ? data.pagePermissions : [];

    const findPagePerm = (pageId) => pagePerms.find(p => p.pageId === pageId) || null;

    const canAccessPage = (pageId) => {
      if (isAdmin) return true;
      const p = findPagePerm(pageId);
      return !!(p && p.canView);
    };

    const getTabPerm = (pageId, tabId) => {
      const p = findPagePerm(pageId);
      if (!p || !p.canView) return null;
      return p.tabs?.[tabId] || null;
    };

    const canViewTab = (pageId, tabId) => {
      if (isAdmin) return true;
      const t = getTabPerm(pageId, tabId);
      return !!(t && t.canView);
    };

    const canEditTab = (pageId, tabId) => {
      if (isAdmin) return true;
      const t = getTabPerm(pageId, tabId);
      return !!(t && t.canEdit);
    };

    const getSubTabPerm = (pageId, tabId, subTabId) => {
      const t = getTabPerm(pageId, tabId);
      if (!t || !t.canView) return null;
      return t.subTabs?.[subTabId] || null;
    };

    const canViewSubTab = (pageId, tabId, subTabId) => {
      if (isAdmin) return true;
      const st = getSubTabPerm(pageId, tabId, subTabId);
      return !!(st && st.canView);
    };

    const canEditSubTab = (pageId, tabId, subTabId) => {
      if (isAdmin) return true;
      const st = getSubTabPerm(pageId, tabId, subTabId);
      return !!(st && st.canEdit);
    };

    const can = (pageId, actionId) => {
      if (isAdmin) return true;
      const p = findPagePerm(pageId);
      if (!p || !p.canView) return false;
      return !!p.actions?.[actionId];
    };

    return {
      isAdmin,
      profile: data?.profile || null,
      user: data?.user || null,
      pagePermissions: pagePerms,
      canAccessPage,
      canViewTab,
      canEditTab,
      canViewSubTab,
      canEditSubTab,
      can,
      refresh: fetchPermissions
    };
  }, [data, fetchPermissions]);

  const value = {
    ...helpers,
    loading,
    error,
    hasData: !!data
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    // Não falha se alguém usar fora do Provider — retorna stub seguro (default deny)
    return {
      isAdmin: false,
      profile: null,
      user: null,
      pagePermissions: [],
      canAccessPage: () => false,
      canViewTab: () => false,
      canEditTab: () => false,
      canViewSubTab: () => false,
      canEditSubTab: () => false,
      can: () => false,
      refresh: async () => {},
      loading: false,
      error: null,
      hasData: false
    };
  }
  return ctx;
}

/** Hook conveniente: returns permissions scoped a uma página */
export function usePagePermissions(pageId) {
  const p = usePermissions();
  return {
    canView: p.canAccessPage(pageId),
    canViewTab: (tabId) => p.canViewTab(pageId, tabId),
    canEditTab: (tabId) => p.canEditTab(pageId, tabId),
    canViewSubTab: (tabId, subTabId) => p.canViewSubTab(pageId, tabId, subTabId),
    canEditSubTab: (tabId, subTabId) => p.canEditSubTab(pageId, tabId, subTabId),
    can: (actionId) => p.can(pageId, actionId),
    isAdmin: p.isAdmin,
    profile: p.profile,
    loading: p.loading
  };
}
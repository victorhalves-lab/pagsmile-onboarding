const isNode = typeof window === 'undefined';
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (isNode) {
		return defaultValue;
	}
	const storageKey = `base44_${toSnakeCase(paramName)}`;
	const urlParams = new URLSearchParams(window.location.search);
	const searchParam = urlParams.get(paramName);
	if (removeFromUrl) {
		urlParams.delete(paramName);
		const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
			}${window.location.hash}`;
		window.history.replaceState({}, document.title, newUrl);
	}
	if (searchParam) {
		storage.setItem(storageKey, searchParam);
		return searchParam;
	}
	if (defaultValue) {
		storage.setItem(storageKey, defaultValue);
		return defaultValue;
	}
	const storedValue = storage.getItem(storageKey);
	if (storedValue) {
		return storedValue;
	}
	return null;
}

// List of public path prefixes — kept in sync with lib/publicRoutes.js.
// Duplicated here (instead of imported) because app-params runs BEFORE the SDK
// is instantiated and we need zero-dependency early detection.
const PUBLIC_PATH_MARKERS = [
	'/onboarding',
	'/compliancedoconly',
	'/propostapublica',
	'/propostapadraopublica',
	'/propostapixpublica',
	'/contratopublico',
	'/compliancedinamico',
	'/complianceresume',
	'/onboardingcompletion',
	'/subsellerquestionnaire',
	'/subsellerdocupload',
	'/questionariosimplificadopublico',
	'/questionarioleadspagsmile',
	'/leadpixv4',
	'/fechamentolandingpage',
	'/kickoffpublico',
	'/complianceonboardingstart',
	'/complianceecommerce',
	'/compliancefullkyc',
	'/compliancegateway',
	'/compliancelite',
	'/compliancemarketplace',
	'/compliancemerchant',
	'/compliancepixonly',
	'/compliancesaas',
	'/documentuploadecommerce',
	'/documentuploadfull',
	'/documentuploadlite',
	'/documentuploadpix',
	'/documentuploadsaas',
	'/leadquestionnaire',
	'/leadsuccess',
	'/leadquestionnairepix',
	'/livenessfacematchstep',
	'/livenesssimulation',
	'/parceiro/',
	'/s/',
	'/p/',
	'/pp/',
	'/pix/',
	'/c/',
];

const isOnPublicRoute = () => {
	if (isNode) return false;
	const path = (window.location.pathname || '').toLowerCase();
	return PUBLIC_PATH_MARKERS.some(marker => path === marker || path.startsWith(marker));
};

const getAppParams = () => {
	if (getAppParamValue("clear_access_token") === 'true') {
		storage.removeItem('base44_access_token');
		storage.removeItem('token');
	}

	// ⚡ CRITICAL: on public routes, force token=null at the parameter layer.
	// This prevents the SDK from ever receiving a stale token and trying to
	// validate it (which causes the "instanceof is not callable" crash).
	// Also defensively strip the token from storage so subsequent reloads stay clean.
	const onPublicRoute = isOnPublicRoute();
	if (onPublicRoute && !isNode) {
		try {
			storage.removeItem('base44_access_token');
			storage.removeItem('token');
		} catch {}
	}

	const rawToken = getAppParamValue("access_token", { removeFromUrl: true });

	return {
		appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
		token: onPublicRoute ? null : rawToken,
		fromUrl: getAppParamValue("from_url", { defaultValue: window.location.href }),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL }),
	}
}


export const appParams = {
	...getAppParams()
}
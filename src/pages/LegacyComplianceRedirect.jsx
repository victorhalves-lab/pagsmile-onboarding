import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Redirect component for legacy compliance routes.
 * Maps old route patterns to ComplianceDinamico with the correct V4 model.
 */
const LEGACY_ROUTE_TO_V4 = {
  ComplianceEcommerce: 'ComplianceEcommerceV4',
  ComplianceLite: 'ComplianceSaaSV4',
  ComplianceSaaS: 'ComplianceSaaSV4',
  ComplianceGateway: 'ComplianceGatewayV4',
  ComplianceMarketplace: 'ComplianceMarketplaceV4',
  ComplianceMerchant: 'ComplianceEcommerceV4',
  CompliancePixOnly: 'CompliancePixMerchantV4',
  ComplianceFullKYC: 'ComplianceEcommerceV4',
  ComplianceOnboardingStart: 'ComplianceEcommerceV4',
  // Document upload pages redirect to ComplianceDinamico (questionnaire will handle doc phase)
  DocumentUploadEcommerce: 'ComplianceEcommerceV4',
  DocumentUploadLite: 'ComplianceSaaSV4',
  DocumentUploadSaaS: 'ComplianceSaaSV4',
};

// For ComplianceFullKYC, detect sub-model from URL params
const resolveFullKYCModel = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const model = urlParams.get('model');
  if (model === 'gateway') return 'ComplianceGatewayV4';
  if (model === 'marketplace') return 'ComplianceMarketplaceV4';
  return 'ComplianceEcommerceV4';
};

export default function LegacyComplianceRedirect({ legacyRoute }) {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    let targetModel;
    if (legacyRoute === 'ComplianceFullKYC') {
      targetModel = resolveFullKYCModel();
    } else {
      targetModel = LEGACY_ROUTE_TO_V4[legacyRoute] || 'ComplianceEcommerceV4';
    }

    // Preserve ref code and other query params
    const ref = urlParams.get('ref');
    const leadId = urlParams.get('leadId');
    const businessSubCategory = urlParams.get('businessSubCategory');
    
    let newUrl = `/ComplianceDinamico?model=${targetModel}`;
    if (ref) newUrl += `&ref=${ref}`;
    if (leadId) newUrl += `&leadId=${leadId}`;
    if (businessSubCategory) newUrl += `&businessSubCategory=${businessSubCategory}`;

    navigate(newUrl, { replace: true });
  }, [navigate, legacyRoute]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#1356E2] rounded-full animate-spin" />
    </div>
  );
}
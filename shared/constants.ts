// Indian States and Union Territories with GST State Codes
export const INDIAN_STATES = [
  { code: "01", name: "Jammu & Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "25", name: "Daman & Diu" },
  { code: "26", name: "Dadra & Nagar Haveli and Daman & Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "28", name: "Andhra Pradesh (Before Division)" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman & Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
  { code: "97", name: "Other Territory" },
] as const;

// Helper function to get state name from code
export function getStateName(code: string): string {
  const state = INDIAN_STATES.find(s => s.code === code);
  return state ? state.name : code;
}

// Helper function to get state code from name or return if already a code
export function getStateCode(nameOrCode: string): string {
  if (!nameOrCode) return "";
  
  // If it's already a 2-digit code, return it
  if (/^\d{2}$/.test(nameOrCode.trim())) {
    return nameOrCode.trim();
  }
  
  // Otherwise, find by name
  const state = INDIAN_STATES.find(s => s.name === nameOrCode);
  return state ? state.code : "";
}

// Helper function to extract state code from GSTIN
export function extractStateCodeFromGSTIN(gstin: string): string {
  if (!gstin || gstin.length < 2) return "";
  return gstin.substring(0, 2);
}

// Helper function to normalize state to code (handles name, code, or GSTIN)
export function normalizeToStateCode(stateOrGstin: string, gstin?: string): string {
  if (!stateOrGstin) {
    // Fallback to GSTIN if provided
    return gstin ? extractStateCodeFromGSTIN(gstin) : "";
  }
  
  // Check if it's already a valid state code
  if (/^\d{2}$/.test(stateOrGstin.trim())) {
    return stateOrGstin.trim();
  }
  
  // Try to get code from state name
  const codeFromName = getStateCode(stateOrGstin);
  if (codeFromName) return codeFromName;
  
  // Last resort: try to extract from GSTIN
  return gstin ? extractStateCodeFromGSTIN(gstin) : "";
}

// Helper function to determine if transaction is intra-state
export function isIntraStateTransaction(orgState: string, placeOfSupply: string, orgGstin?: string): boolean {
  const orgStateCode = normalizeToStateCode(orgState, orgGstin);
  const posStateCode = placeOfSupply.includes("-") ? placeOfSupply.split("-")[0].trim() : normalizeToStateCode(placeOfSupply);
  return orgStateCode === posStateCode && orgStateCode !== "";
}

// Helper function to format state for display (with code)
export function formatStateDisplay(state: { code: string; name: string }): string {
  return `${state.code} - ${state.name}`;
}

// Helper function to parse state from display format
export function parseStateFromDisplay(display: string): string {
  // Returns just the state code
  return display.split("-")[0].trim();
}

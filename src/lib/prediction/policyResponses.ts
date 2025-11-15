import type { PolicyImpactSummary, ShockEvent } from '@/lib/types/prediction';

interface PolicyTemplate {
  label: string;
  minSupport: number;
  severityMultiplier: number;
  recoveryMultiplier: number;
}

const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    label: 'Обмежена реакція',
    minSupport: 0,
    severityMultiplier: 1.05,
    recoveryMultiplier: 1.1,
  },
  {
    label: 'Стабілізаційна місія',
    minSupport: 0.4,
    severityMultiplier: 0.92,
    recoveryMultiplier: 0.9,
  },
  {
    label: 'Гуманітарний прорив',
    minSupport: 0.7,
    severityMultiplier: 0.82,
    recoveryMultiplier: 0.8,
  },
];

export interface PolicyResponseResult {
  events: ShockEvent[];
  policies: PolicyImpactSummary[];
}

export function applyPolicyResponses(shocks: ShockEvent[] | undefined, supportLevel: number): PolicyResponseResult {
  if (!shocks?.length) {
    return { events: [], policies: [] };
  }

  const template =
    POLICY_TEMPLATES.slice()
      .reverse()
      .find((policy) => supportLevel >= policy.minSupport) ?? POLICY_TEMPLATES[0];

  const adjustedEvents = shocks.map((shock) => ({
    ...shock,
    severity: shock.severity * template.severityMultiplier,
    recoveryYears: Math.max(1, Math.round(shock.recoveryYears * template.recoveryMultiplier)),
  }));

  const policies: PolicyImpactSummary[] = [
    {
      label: template.label,
      severityModifier: template.severityMultiplier,
      recoveryModifier: template.recoveryMultiplier,
    },
  ];

  return { events: adjustedEvents, policies };
}


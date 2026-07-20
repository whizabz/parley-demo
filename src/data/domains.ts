import type { Domain, DataSource } from '../types'

export const domains: Domain[] = [
  { id: 'claims', name: 'Claims', owningTeam: 'Actuarial', permissionTags: ['claims-read'] },
  { id: 'underwriting', name: 'Underwriting', owningTeam: 'UW Analytics', permissionTags: ['uw-read'] },
  { id: 'policy', name: 'Policy', owningTeam: 'Policy Ops', permissionTags: ['policy-read'] },
]

export const dataSources: DataSource[] = [
  {
    id: 'claims-ledger',
    name: 'Claims Ledger',
    lastRefreshed: '2026-06-28T06:00:00Z',
    domain: 'claims',
    permissionTags: ['claims-read'],
  },
  {
    id: 'adjuster-notes',
    name: 'Adjuster Notes',
    lastRefreshed: '2026-06-27T18:30:00Z',
    domain: 'claims',
    permissionTags: ['claims-read'],
  },
  {
    id: 'premium-register',
    name: 'Premium Register',
    lastRefreshed: '2026-06-28T04:00:00Z',
    domain: 'underwriting',
    permissionTags: ['uw-read'],
  },
  {
    id: 'policy-master',
    name: 'Policy Master',
    lastRefreshed: '2026-06-28T02:00:00Z',
    domain: 'policy',
    permissionTags: ['policy-read'],
  },
  {
    id: 'restricted-actuarial',
    name: 'Risk Adjustment Model',
    lastRefreshed: '2026-06-25T12:00:00Z',
    domain: 'claims',
    permissionTags: ['actuarial-admin'],
    restricted: true,
  },
]

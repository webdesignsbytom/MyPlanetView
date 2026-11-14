// A trip's status (Trip.status). Completing a trip marks its stops' countries as visited.
export const TRIP_STATUSES = [
  { value: 'PLANNED', label: 'Planning' },
  { value: 'ACTIVE', label: 'On the trip' },
  { value: 'COMPLETED', label: 'Done' },
];

export const TRIP_STATUS_LABELS = Object.fromEntries(TRIP_STATUSES.map((s) => [s.value, s.label]));

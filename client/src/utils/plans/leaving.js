// Leaving (docs/API.md, "Leaving"): what each owned map goes to when the account is deleted

export const DELETE_MAP = 'DELETE';

/**
 * What a map goes to unless chosen otherwise, as the server's heirOf: its longest-standing
 * active editor, else a deactivated one, else nobody (17 Nov 2026, the audit: a deactivated
 * editor could be the default while an active one waited).
 */
export const defaultChoiceFor = (map) => {
  const editors = map.members.filter((m) => m.role === 'EDITOR');
  return (editors.find((m) => m.isActive !== false) ?? editors[0])?.userId || DELETE_MAP;
};

/** The PUT /users/leaving-plan body from the choices ({ mapId: userId | 'DELETE' }). */
export const leavingPlanFrom = (maps, choices, leavePhotos) => ({
  maps: maps.map((map) => {
    const choice = map.members.length ? choices[map.id] || DELETE_MAP : DELETE_MAP;
    return choice === DELETE_MAP ? { mapId: map.id, action: 'DELETE' } : { mapId: map.id, action: 'TRANSFER', toUserId: choice };
  }),
  leavePhotos,
});

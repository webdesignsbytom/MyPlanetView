// Leaving (docs/API.md, "Leaving"): what each owned map goes to when the account is deleted

export const DELETE_MAP = 'DELETE';

/** What a map goes to unless chosen otherwise: its longest-standing editor, as the server would, else nobody. */
export const defaultChoiceFor = (map) => map.members.find((m) => m.role === 'EDITOR')?.userId || DELETE_MAP;

/** The PUT /users/leaving-plan body from the choices ({ mapId: userId | 'DELETE' }). */
export const leavingPlanFrom = (maps, choices, leavePhotos) => ({
  maps: maps.map((map) => {
    const choice = map.members.length ? choices[map.id] || DELETE_MAP : DELETE_MAP;
    return choice === DELETE_MAP ? { mapId: map.id, action: 'DELETE' } : { mapId: map.id, action: 'TRANSFER', toUserId: choice };
  }),
  leavePhotos,
});

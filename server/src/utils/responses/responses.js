// Status responses
const STATUS_MESSAGES = {
  200: `success`,
  201: `success`,
  400: `fail`,
  401: `fail`,
  403: `fail`,
  404: `fail`,
  409: `fail`,
  413: `fail`,
  429: `fail`,
  500: `error`,
  503: `error`,
};

// AppEvent domain slugs
export const DOMAINS = {
  users: 'users',
  contact: 'contact',
  events: 'events',
  auth: 'auth',
  system: 'system',
  // Travel
  places: 'places',
  maps: 'maps',
  trips: 'trips',
  photos: 'photos',
  sharing: 'sharing',
};

export const EVENT_MESSAGES = {
  badRequest: `Bad Request`,
  notFound: `Not Found`,
  missingUserIdentifier: `Missing User identifier`,
  missingFields: `Missing fields in request`,
  malformedData: `Data incorrectly formatted or malformed request`,
  // Audits
  auditTag: `Audit database.`,
  auditNotFound: `Failed to find audit(s).`,
  createAuditFail: `Failed to create audit.`,
  deleteAuditsFailed: `Failed to delete audit(s).`,
  // Auth
  noValidSession: `No valid session found.`,
  sessionUserNotFound: `Session valid but user record not found.`,
  adminActionNoSession: `Admin action attempted without a valid session.`,
  adminRoleRequired: `This action requires an admin or developer role.`,
  developerActionNoSession: `Developer action attempted without a valid session.`,
  developerRoleRequired: `This action requires a developer role.`,
  accountDeactivated: `This account has been deactivated. Please contact support.`,
  passwordRequiredToDelete: `Enter your password to delete your account.`,
  nameRequired: `Enter your name.`,
  // Contacts
  contactFormsNotFound: `Failed to find contact form(s).`,
  createContactFormFail: `Failed to create contact form.`,
  deleteContactFormFail: `Failed to delete contact forms.`,
  contactNotificationEmailFailed: `Failed to send contact form notification email.`,
  // Events
  eventNotFound: `Failed to find event(s).`,
  deleteEventFailed: `Failed to delete event(s).`,
  createEventFail: `Failed to create event.`,
  updateEventFailed: `Failed to update event.`,
  invalidEventStatus: `Event status must be OPEN, ACKNOWLEDGED, RESOLVED or IGNORED.`,
  // Users
  userNotFound: `Failed to find user(s).`,
  emailInUse: `Email already in use.`,
  usernameInUse: `Username already in use.`,
  emailNotFound: `Email not found in database.`,
  idNotFound: `User ID not found in database.`,
  createUserFail: `Failed to create new user.`,
  // Passwords
  deleteAllPasswordResetRequestsFailed: `Failed to delete all password reset requests.`,
  createPasswordResetRequestFailed: `Failed to create password reset request.`,
  passwordMatchError: `Password match error for reset. New passwords do not match.`,
  resetPasswordRequestSuccessful: `Password reset email has been sent successfully.`,
  passwordResetError: `Account record doesn't exist or has been reset already.`,
  passwordResetEmailError: `Failed to send password reset email.`,
  updateUserError: `Failed to update user.`,
  updateUserRoleError: `Failed to update user role.`,
  deleteUserError: `Failed to delete user.`,
  deactivateUserError: `Failed to deactivate user.`,
  reactivateUserError: `Failed to reactivate user.`,
  invalidRole: `Role must be USER, ADMIN or DEVELOPER.`,
  cannotActOnSelf: `You can't change your own role or status, or delete yourself, from the admin panel.`,
  cannotActOnDeveloper: `Only a developer can manage developer accounts.`,
  developerRoleRestricted: `Only a developer can grant or remove the developer role.`,
  avatarInvalid: `Upload an avatar image first, then save it.`,
  // Places
  countryNotFound: `That country isn't on the map.`,
  landmarkNotFound: `That landmark doesn't exist.`,
  // Maps
  mapNotFound: `That map doesn't exist, or it hasn't been shared with you.`,
  defaultMapDelete: `Your first map can't be deleted. You can rename it instead.`,
  invalidGroupType: `Who the map is for must be SOLO, COUPLE or FAMILY.`,
  invalidName: `Give it a name of 1 to 80 characters.`,
  travellerNotFound: `That traveller isn't on this map.`,
  lastTraveller: `A map needs at least one traveller.`,
  tooManyTravellers: `A map can have up to 20 travellers.`,
  invalidVisitStatus: `Status must be VISITED, LIVED or WANT_TO_GO.`,
  invalidDate: `Dates must be real dates written as YYYY-MM-DD.`,
  visitNotFound: `That country isn't marked on this map.`,
  invalidMapSettings: `Map settings must be an object: style is animated, old-map, jupiter or galaxy; the switches are true or false.`,
  // Trips
  tripNotFound: `That trip doesn't exist, or it hasn't been shared with you.`,
  invalidTripStatus: `Status must be PLANNED, ACTIVE or COMPLETED.`,
  invalidTitle: `Give the trip a title of 1 to 120 characters.`,
  datesOutOfOrder: `The end date can't be before the start date.`,
  travellersNotOnMap: `Every traveller must be one of this map's travellers.`,
  stopNotFound: `That stop isn't on this trip.`,
  invalidStopOrder: `Send every stop of the trip exactly once.`,
  coverPhotoInvalid: `The cover must be a photo from this trip.`,
  tripDeleteNeedsMap: `Only the map's owner and its editors can delete a trip.`,
  // Photos
  photoNotFound: `That photo doesn't exist, or it hasn't been shared with you.`,
  photoUploadInvalid: `The upload doesn't match what was requested. Please try again.`,
  photoSizesRequired: `A photo needs a thumbnail and a display copy.`,
  photoTypeInvalid: `That file type isn't supported for this photo size.`,
  photoTooLarge: `That file is too large.`,
  photoPositionInvalid: `The photo's position must be a real latitude and longitude.`,
  photoAlreadySaved: `That photo has already been saved.`,
  photoUploadExpired: `This upload took too long to finish. Please try again.`,
  // Sharing
  invalidShareRole: `Role must be VIEWER or EDITOR.`,
  invalidLinkAccess: `General access must be RESTRICTED or ANYONE_WITH_LINK.`,
  invalidEmail: `Enter a valid email address.`,
  cannotShareWithOwner: `The owner already has access.`,
  memberNotFound: `That person doesn't have access.`,
  inviteNotFound: `That invite doesn't exist.`,
  inviteInvalid: `This invite link is invalid, has been used or has expired.`,
  inviteWrongEmail: `This invite was sent to a different email address. Sign in with that address, and verify it, to accept.`,
  shareCodeNotFound: `That share link doesn't exist or has been turned off.`,
  shareEmailFailed: `Failed to send the sharing email.`,
  shareNeedsVerifiedEmail: `Verify your email address before adding people. Use the link we emailed you, or send a new one from your account page.`,
  contentNeedsVerifiedEmail: `Verify your email address to add to your map or share it. Use the link we emailed you, or send a new one from your account page.`,
  // Verification
  verificationTag: `Verification database.`,
  verificationNotFound: `Failed to find verification.`,
  createVerificationFailed: `Failed to create verification.`,
  verificationUpdateFailed: `Failed to update verification.`,
  verificationEmailFailed: `Failed to send verification email.`,
  verificationNotFoundReturn: `Account record doesn't exist or has been verified already. Please sign up or log in.`,
  expiredLinkMessage: `Link has expired. Please sign up or log in and check your account.`,
  invalidVerification: `Invalid verification details passed. Check your inbox, or contact support.`,
};

// Error responses for eventEmitter/errors
export const RESPONSE_MESSAGES = {
  ConflictEvent: `Request conflicts with data on server.`,
  DeactivatedUserEvent: `The target user account has been deactivated.`,
  ServerErrorEvent: `Internal Server Error.`,
  NotFoundEvent: `Was not found.`,
  NoPermissionEvent: `You are not authorized to perform this action.`,
  NoValidationEvent: `Unable to verify user.`,
  BadRequestEvent: `Incorrect request syntax or malformed request.`,
};

// Data responses
export function sendDataResponse(res, statusCode, payload) {
  return res.status(statusCode).json({
    status: STATUS_MESSAGES[statusCode],
    data: payload,
  });
}

// Error responses
export function sendMessageResponse(res, statusCode, message) {
  return res.status(statusCode).json({
    status: STATUS_MESSAGES[statusCode],
    message,
  });
}

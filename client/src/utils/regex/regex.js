// Password policy:
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])(?!.*[\\/'"]).{8,}$/;
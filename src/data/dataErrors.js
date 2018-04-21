class UserNotFoundError extends Error {}
class NonUniqueUserError extends Error {}

module.exports = {
    NonUniqueUserError,
    UserNotFoundError
};

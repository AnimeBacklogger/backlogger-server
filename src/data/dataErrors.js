class UserNotFoundError extends Error {}
class NonUniqueUserError extends Error {}
class ShowNotFoundError extends Error {}

module.exports = {
    NonUniqueUserError,
    UserNotFoundError,
    ShowNotFoundError
};

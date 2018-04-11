class UserNotFoundError extends Error {}
class NonUniqueUser extends Error {}

module.exports = {
    NonUniqueUser,
    UserNotFoundError
};

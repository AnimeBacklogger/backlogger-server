'use strict';

/* eslint-disable require-jsdoc */ // because these are pretty obvious
// User data errors
class UserNotFoundError extends Error {}
class NonUniqueUserError extends Error {}
class UserPasswordNotSetError extends Error {}

// Show data errors
class ShowNotFoundError extends Error {}

module.exports = {
    NonUniqueUserError,
    ShowNotFoundError,
    UserNotFoundError,
    UserPasswordNotSetError
};

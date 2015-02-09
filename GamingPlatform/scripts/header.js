﻿var headerBar = (function () {
    "use strict";

    function publicInit() {
        view.init();
        controller.init();
    }

    function publicIsUserLoggedIn() {
        return model.loggedIn;
    }

    function publicGetLoggedInUserData() {
        return model.userData;
    }

    var model = {
        loggedIn: false,
        userData: {}
    };

    var controller = {
        init: function () {
            if (sessionStorage.id) {
                this.requestUserData(sessionStorage.id);
            }
            else {
                view.$guestTools.fadeIn('slow');
            }

            $("#log-in-button").click(function () {
                controller.attemptLogin();
            });

            $("#log-out-button").click(function () {
                delete sessionStorage.id;
                location.reload(true);
            });

            $("#sign-up-button").click(function () {
                view.validateSignUpInput();
            });

            $("#go-to-profile-button").click(function () {
                window.location.replace("user.html?username=" + model.userData.username);
            });
        },

        attemptLogin: function () {
            var loginData = view.getLoginData();
            this.requestSessionId(loginData);
        },

        requestSessionId: function (loginData) {
            $.ajax({
                async: false,
                type: "GET",
                url: "Service.svc/GetUserSessionToken",
                data: loginData,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    controller.onSessionIdSuccess(receivedData);
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });
        },

        onSessionIdSuccess: function (receivedData) {
            if (receivedData === "guest") {
                $("#log-in-alert").show('fast');
            }
            else {
                // else we got the encrypted sessionId, store it
                sessionStorage.id = receivedData;

                $("#log-in-modal").modal('hide');

                this.requestUserData(receivedData);
            }
        },

        requestUserData: function (session) {
            $.ajax({
                async: false,
                type: "GET",
                url: "Service.svc/GetLoggedInUserData",
                data: { sessionId: session },
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    controller.onUserDataSuccess(receivedData);
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });
        },

        onUserDataSuccess: function (userData) {
            if (userData === "guest") {
                alert("Authentication failed. Please try again.");
            }
            else {
                model.userData = JSON.parse(userData);
                model.loggedIn = true;

                view.setupLoggedInNavbar();
            }
        },

        requestSignUp: function (signUpData) {
            $.ajax({
                async: false,
                type: "POST",
                url: "Service.svc/AddNewUser",
                data: JSON.stringify(signUpData),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    controller.onSignUpSuccess(receivedData);
                },
                error: function (result) {
                    console.log("Error performing POST ajax " + result);
                }
            });
        },

        onSignUpSuccess: function (receivedData) {
            if (receivedData === "failed")
                alert("Sign up form contains the following errors: \n - Username already taken");
            else {
                $("#sign-up-alert").show('fast');

                model.userData = JSON.parse(receivedData);
                view.setupLoggedInNavbar();
                sessionStorage.id = model.userData.sessionId;
                model.loggedIn = true;

                setTimeout(function () {
                    $('#sign-up-modal').modal('hide');
                }, 3000);
            }
        }
    };

    var view = {
        $userTools: null,
        $guestTools: null,

        init: function () {
            this.$userTools = $(".user-tools");
            this.$guestTools = $(".guest-tools");

            $(".user-tools").hide();
            $(".guest-tools").hide();
            $("#log-in-alert").hide();
            $("#sign-up-alert").hide();
        },

        getLoginData: function () {
            return {
                username: $("#inputUsername").val(),
                password: $("#inputPassword").val()
            };
        },

        setupLoggedInNavbar: function () {
            this.$guestTools.hide();
            this.$userTools.show();
            $("#welcome-span").html("Welcome, " + model.userData.username + "!");
        },

        validateSignUpInput: function () {
            var errorMessage = "";

            var signUpData = {};
            var repeatedPassword = $("#repeatPassInput").val();
            signUpData.username = $("#usernameInput").val();
            signUpData.password = $("#passwordInput").val();
            signUpData.email = $("#emailInput").val();
            signUpData.firstName = $("#firstNameInput").val();
            signUpData.lastName = $("#lastNameInput").val();
            signUpData.location = $("#locationInput").val();
            signUpData.gender = $("#gender-group input:radio:checked").val();

            if (!this.validateAlphanumeric(signUpData.username))
                errorMessage += "\n - Username must contain alphanumeric characters only";
            if (signUpData.username.length > 20 || signUpData.username.length < 8)
                errorMessage += "\n - Username must be 8-20 characters long";
            if (signUpData.password.length < 3)
                errorMessage += "\n - Password must be at least 3 characters long";
            if (this.hasWhiteSpace(signUpData.password))
                errorMessage += "\n - White space is not allowed in passwords";
            if (repeatedPassword !== signUpData.password)
                errorMessage += "\n - Passwords do not match";

            var year = parseInt($("#yearInput").val());
            var month = parseInt($("#monthInput").val());
            var day = parseInt($("#dayInput").val());
            var date = new Date();
            this.dateValidator.init();

            if (isNaN(year) || year < 0)
                errorMessage += "\n - Year should be a positive number";
            if (isNaN(month) || month < 1 || month > 12)
                errorMessage += "\n - Invalid value for month";
            else if (isNaN(day) || day < 1 || day > this.dateValidator.monthDays[month - 1])
                errorMessage += "\n - Invalid value for day";

            if (errorMessage === "") {
                alert("Success!");
                date.setYear(year);
                date.setMonth(month);
                date.setDate(day);

                signUpData.birthDate = JSON.stringify(date);

                controller.requestSignUp(signUpData);
            }
            else {
                alert("Sign up form contains the following errors: " + errorMessage);
            }
        },

        validateAlphanumeric: function (string) {
            if (/[^a-zA-Z0-9]/.test(string)) {
                return false;
            }
            return true;
        },

        hasWhiteSpace: function (string) {
            return /\s/g.test(string);
        },

        dateValidator: {
            monthDays: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
            init: function () {
                var date = new Date();
                var year = date.getYear();
                if (year % 4 === 0 || year % 100 === 0)
                    this.monthDays[1] = 29;
                else
                    this.monthDays[1] = 28;
            }
        }
    };

    return {
        init: publicInit,
        isLoggedIn: publicIsUserLoggedIn,
        getLoggedInUserData: publicGetLoggedInUserData
    };
}());
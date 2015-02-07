
(function () {
    'use strict';
    var userLoggedIn = "Guest";

    var user = {};

    var documentInit = function () {
        $(".user-tools").hide();
        $(".guest-tools").hide();
        $("#log-in-alert").hide();
        $("#sign-up-alert").hide();

        var x = getQueryVariable("id");
        if (x)
            alert(x);

        console.log(sessionStorage.userName);

        if (sessionStorage.id) {
            $.ajax({
                type: "GET",
                url: "Service.svc/GetLoggedInUserData",
                data: { sessionId: sessionStorage.id },
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    onLoginSuccess(receivedData);
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });
        }
        else
        {
            $(".guest-tools").show('slow');
        }

        $("#redirect-button").click(function () {
            window.location.href = "index.html?id=333";
        });

        $("#log-in-button").click(function () {
            attemptLogin();
        });

        $("#log-out-button").click(function () {
            delete sessionStorage.id;
            location.reload(true);
        });

        $("#sign-up-button").click(function () {
            validateSignUpInput();
        });
    };

    function attemptLogin() {
        var username = $("#inputUsername").val();
        var password = $("#inputPassword").val();

        $.ajax({
            type: "GET",
            url: "Service.svc/GetUserSessionToken",
            data: { username: username, password: password },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            processData: true,
            success: function (receivedData) {
                onLoginAttemptSuccess(receivedData);
            },
            error: function (result) {
                console.log("Error performing ajax " + result);
            }
        });
    }

    function onLoginAttemptSuccess(receivedData) {
        if (receivedData === "guest")
        {
            $("#log-in-alert").show('fast');
        }
        else {
            sessionStorage.id = receivedData;
            userLoggedIn = true;

            $("#log-in-modal").modal('hide');

            $.ajax({
                type: "GET",
                url: "Service.svc/GetLoggedInUserData",
                data: { sessionId: receivedData },
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    onLoginSuccess(receivedData);
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });
        }
    }

    function onLoginSuccess(receivedData) {
        console.log(receivedData);
        if (receivedData === "guest")
        {
            alert("Authentication failed. Please try again.");
        }
        else
        {
            user = JSON.parse(receivedData);

            setupLoggedInNavbar();
        }
    }

    function setupLoggedInNavbar() {
        
        $(".guest-tools").hide();
        $(".user-tools").show('slow');
        $("#welcome-span").html("Welcome, " + user.username + "!");
    }

    function getQueryVariable(variable) {
        var query = window.location.search.substring(1),
            vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] === variable) { return pair[1]; }
        }
        return (false);
    }

    function validateSignUpInput() {
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

        if (!validateAlphanumeric(signUpData.username))
            errorMessage += "\n - Username must contain alphanumeric characters only";
        if (signUpData.username.length > 20 || signUpData.username.length < 8)
            errorMessage += "\n - Username must be 8-20 characters long";
        if (signUpData.password.length < 3)
            errorMessage += "\n - Password must be at least 3 characters long";
        if (hasWhiteSpace(signUpData.password))
            errorMessage += "\n - White space is not allowed in passwords";
        if (repeatedPassword !== signUpData.password)
            errorMessage += "\n - Passwords do not match";

        var year = parseInt($("#yearInput").val());
        var month = parseInt($("#monthInput").val());
        var day = parseInt($("#dayInput").val());
        var date = new Date();
        dateValidator.init();
        
        if (isNaN(year) || year < 0)
            errorMessage += "\n - Year should be a positive number";
        if (isNaN(month) || month < 1 || month > 12)
            errorMessage += "\n - Invalid value for month";
        else if (isNaN(day) || day < 1 || day > dateValidator.monthDays[month - 1])
            errorMessage += "\n - Invalid value for day";

        if (errorMessage === "") {
            alert("Success!");
            date.setYear(year);
            date.setMonth(month);
            date.setDate(day);

            signUpData.birthDate = JSON.stringify(date);

            $.ajax({
                type: "GET",
                url: "Service.svc/AddNewUser",
                data: signUpData,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    onSignUpSuccess(receivedData);
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });
        }
        else {
            alert("Sign up form contains the following errors: " + errorMessage);
        }
    }

    function onSignUpSuccess(receivedData) {
        if (receivedData === "failed")
            alert("Sign up form contains the following errors: \n - Username already taken");
        else {
            $("#sign-up-alert").show('slow');
            sessionStorage.id = receivedData;
            $.ajax({
                type: "GET",
                url: "Service.svc/GetLoggedInUserData",
                data: { sessionId: sessionStorage.id },
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    onLoginSuccess(receivedData);
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });

            setTimeout(function () {
                $('#sign-up-modal').modal('hide');
            }, 3000);
        }
    }

    function validateAlphanumeric(string) {
        if (/[^a-zA-Z0-9]/.test(string)) {
            return false;
        }
        return true;
    }

    function hasWhiteSpace(string) {
        return /\s/g.test(string);
    }

    var dateValidator = {
        monthDays: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
        init: function () {
            var date = new Date();
            var year = date.getYear();
            if (year % 4 === 0 || year % 100 === 0)
                this.monthDays[1] = 29;
            else
                this.monthDays[1] = 28;
        }
    };

    $(document).ready(documentInit);
})();
(function () {
    'use strict';

    // We'll keep this dataset in this scope, many modules will need it
    var openedUser = null;
    var activeUser = null;

    function getUrlVariable(variable) {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == variable) { return pair[1]; }
        }
        return (false);
    }

    function enableTabs() {
        $('#user-tabs a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        });
    }

    function documentInit() {
        $("#header-div").load("header.html", function () {
            headerBar.init();
        });

        enableTabs();

        initModel();
    }

    function initModel() {
        // Get the model from the session, it's the logged in user, or a guest
        if (sessionStorage.activeUser) {
            var activeUserString = sessionStorage.activeUser;
            activeUser = JSON.parse(activeUserString);
        }

        // Get the model from the url, if it cannot be loaded, it's a fatal error
        var urlUsername = getUrlVariable("username");
        if (!urlUsername)
            alert("Url parsing error!");
        else
            requestUserData(urlUsername);
    }

    function requestUserData(username) {
        $.ajax({
            type: "GET",
            url: "Service.svc/GetUserByUsername",
            data: { username: username },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            processData: true,
            success: function (receivedData) {
                onUserDataSuccess(receivedData);
            },
            error: function (result) {
                console.log("Error performing ajax " + result);
            }
        });
    }

    function onUserDataSuccess(receivedData) {
        openedUser = JSON.parse(receivedData);

        // At this point, model is initiated fully, so init the modules
        userPanel.init();

        if (activeUser !== null) {
            if (activeUser.username === openedUser.username || activeUser.status == "Admin") {
                userPanel.showEditButton();
            }

            if (activeUser.username !== openedUser.username) {
                userPanel.setupAddButton();
            }
        }
    }

    var userPanel = (function () {

        function publicInit() {
            view.init();
            controller.init();
        }

        function publicShowEditButton() {
            $("#open-edit-dlg-btn").toggleClass("hide");
        }

        function publicSetupAddButton() {
            $("#add-friend-button").click(function () {
                $(this).button('loading');
                controller.sendFriendRequest(activeUser.username, openedUser.username);
            });

            controller.requestResolveFriendship(activeUser.username, openedUser.username);
        }

        var model = {
            createDate: function (object, dateProp) {
                return new Date(parseInt(object[dateProp]));
            }
        };

        var controller = {
            init: function () {
                $("#open-edit-dlg-btn").click(function () {
                    view.setEditData(openedUser);
                });

                $("#confirm-edit-button").click(function () {
                    view.validateEditInput();
                });
            },

            requestResolveFriendship: function (loggedInUserName, openedUser) {
                console.log(loggedInUserName + openedUser);
                $.ajax({
                    type: "GET",
                    url: "Service.svc/ResolveFriendship",
                    data: { viewer: loggedInUserName, openedUser: openedUser },
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    processData: true,
                    success: function (receivedData) {
                        controller.onResolveFriendshipSuccess(receivedData);
                    },
                    error: function (result) {
                        console.log("Error performing ajax " + result);
                    }
                });
            },

            onResolveFriendshipSuccess: function (receivedData) {
                console.log(receivedData);
                if (receivedData === "friends") {
                    $("#is-friends-div").toggleClass("hide");
                }
                else if (receivedData === "requestSent") {
                    $("#add-friend-button").button('loading');
                    $("#add-friend-button").toggleClass("hide");
                }
                else {
                    $("#add-friend-button").toggleClass("hide");
                }
            },

            sendFriendRequest: function (source, target) {
                $.ajax({
                    type: "GET",
                    url: "Service.svc/CreateFriendRequest",
                    data: { sourceUser: source, targetUser: target },
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    processData: true,
                    success: function (receivedData) {
                        console.log(receivedData);
                    },
                    error: function (result) {
                        console.log("Error performing ajax " + result);
                    }
                });
            },

            requestUserEdit: function (editedUser) {
                $.ajax({
                    type: "POST",
                    url: "Service.svc/EditUser",
                    data: JSON.stringify(editedUser),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    processData: true,
                    success: function (receivedData) {
                        controller.onUserEditSuccess(receivedData);
                    },
                    error: function (result) {
                        console.log("Error performing ajax " + result);
                    }
                });
            },

            onUserEditSuccess: function(receivedData) {
                $("#edit-user-modal").modal('hide');
                location.reload(true);
            }
        };

        var view = {
            $editFirstName: null,
            $editLastName: null,
            $editPassword: null,
            $editRepeatPassword: null,
            $editEmail: null,
            $editYear: null,
            $editMonth: null,
            $editDay: null,
            $editLocation: null,
            $editAvatar: null,
            $addFriendButton: null,

            init: function () {
                this.$editFirstName = $("#editFirstName");
                this.$editLastName = $("#editLastName");
                this.$editPassword = $("#editPassword");
                this.$editRepeatPassword = $("#editRepeatPassword");
                this.$editEmail = $("#editEmail");
                this.$editYear = $("#editYear");
                this.$editMonth = $("#editMonth");
                this.$editDay = $("#editDay");
                this.$editLocation = $("#editLocation");
                this.$editAvatar = $("#editAvatar");

                this.setUserData(openedUser);
            },

            formatGender: function(gender) {
                if (gender === "M")
                    return "Male";
                else if (gender === "F")
                    return "Female";
                else
                    return "Other";
            },

            formatStatusLabel: function(userStatus) {
                if (userStatus === "Admin")
                    $("#status-label").attr("style", "color: red;");
                else if (userStatus === "Contributor")
                    $("#status-label").attr("style", "color: #FFFF66;");
            },

            setUserData: function(userData) {
                $("#avatar-img").attr("src", "img/avatars/" + userData.avatarImage);

                if (activeUser && activeUser.username === openedUser.username)
                    $("#profile-title").html("My profile");
                else
                    $("#profile-title").html(userData.username + "'s profile");
                $("#username-label").html(userData.username);
                $("#first-name-label").html(userData.firstName);
                $("#last-name-label").html(userData.lastName);

                var birthDate = model.createDate(userData, "birthDate");
                $("#birth-date-label").html(birthDate.toDateString().substring(4));
                $("#location-label").html(userData.location);
                $("#gender-label").html(this.formatGender(userData.gender));
                $("#status-label").html(userData.status);
                this.formatStatusLabel(userData.status);
                $("#email-label").html(userData.email);
            },

            setEditData: function (userData) {

                this.$editFirstName.val(userData.firstName);
                this.$editLastName.val(userData.lastName);

                var birthDate = model.createDate(userData, "birthDate");
                this.$editPassword.val(userData.password);
                this.$editRepeatPassword.val(userData.password);
                this.$editEmail.val(userData.email);
                this.$editYear.val(birthDate.getFullYear());
                this.$editMonth.val((birthDate.getMonth() + 1));
                this.$editDay.val(birthDate.getDate());
                this.$editLocation.val(userData.location);
                this.$editAvatar.val(userData.avatarImage);
                if (userData.gender === "M")
                    $("#rbMale").prop("checked", true);
                else if (userData.gender === "F")
                    $("#rbFemale").prop("checked", true);
                else
                    $("#rbOther").prop("checked", true);
            },

            validateEditInput: function () {
                var errorMessage = "";

                var editedUser = $.extend(true, {}, openedUser); //Hackish way to clone an object

                var repeatedPassword = this.$editRepeatPassword.val();
                editedUser.password = this.$editPassword.val();
                editedUser.email = this.$editEmail.val();
                editedUser.firstName = this.$editFirstName.val();
                editedUser.lastName = this.$editLastName.val();
                editedUser.location = this.$editLocation.val();
                editedUser.gender = $("#edit-gender-group input:radio:checked").val();
                editedUser.avatarImage = this.$editAvatar.val();

                if (editedUser.password.length < 3)
                    errorMessage += "\n - Password must be at least 3 characters long";
                if (this.hasWhiteSpace(editedUser.password))
                    errorMessage += "\n - White space is not allowed in passwords";
                if (repeatedPassword !== editedUser.password)
                    errorMessage += "\n - Passwords do not match";

                var year = parseInt(this.$editYear.val());
                var month = parseInt(this.$editMonth.val());
                var day = parseInt(this.$editDay.val());
                this.dateValidator.init();

                if (isNaN(year) || year < 0)
                    errorMessage += "\n - Year should be a positive number";
                if (isNaN(month) || month < 1 || month > 12)
                    errorMessage += "\n - Invalid value for month";
                else if (isNaN(day) || day < 1 || day > this.dateValidator.monthDays[month - 1])
                    errorMessage += "\n - Invalid value for day";

                if (errorMessage === "") {
                    var date = model.createDate(editedUser, "birthDate");
                    date.setFullYear(year);
                    date.setMonth(month - 1); // adjust for W3C (from 0 to 11)
                    date.setDate(day);

                    editedUser.birthDate = date.getTime().toString();

                    controller.requestUserEdit(editedUser);
                }
                else {
                    alert("Edit profile form contains the following errors: " + errorMessage);
                }
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
            showEditButton: publicShowEditButton,
            setupAddButton: publicSetupAddButton
        }
    }());

    $(document).ready(documentInit);
})();
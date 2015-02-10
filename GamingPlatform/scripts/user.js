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
        friendRequests.init();
        friendList.init();

        if (activeUser !== null) {
            if (activeUser.username === openedUser.username || activeUser.status == "Admin") {
                userPanel.showEditButton();
                $("#tab-wall").removeClass("hide");
                $("#tab-friend-requests").removeClass("hide");
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
                    $("#is-friends-div").removeClass("hide");
                    $("#tab-wall").removeClass("hide");
                }
                else if (receivedData === "requestSent") {
                    $("#add-friend-button").button('loading');
                    $("#add-friend-button").removeClass("hide");
                }
                else {
                    $("#add-friend-button").removeClass("hide");
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

    var friendRequests = (function () {

        function publicInit() {
            $.ajax({
                type: "GET",
                url: "Service.svc/GetFriendRequests",
                data: { username: openedUser.username },
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    onFriendRequestSuccess(receivedData);
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });
        }

        function onFriendRequestSuccess(receivedData) {
            var $fReqs = $("#friend-requests");
            
            if (receivedData.length > 0)
            {
                $("#tab-friend-requests").attr("value", receivedData.length);
                $("#tab-friend-requests").html("Friend Requests (" + receivedData.length + ")");
                $("#tab-friend-requests").addClass("glow-style");

                $fReqs.empty();
            }
            

            for (var i = 0; i < receivedData.length; i++)
            {
                try {
                    var item = JSON.parse(receivedData[i]);
                }
                catch (exception) {
                    console.log("Error parsing JSON!");
                    continue;
                }

                var fReqView = buildFriendRequestView(item);

                $fReqs.append(fReqView);
            }
            console.log(receivedData);
        }

        function buildFriendRequestView(friend) {
            var rowContainer = document.createElement("div");
            $(rowContainer).attr("value", friend.username);
            $(rowContainer).attr("class", "row");

            var positioner = document.createElement("div");
            $(positioner).attr("class", "col-xs-offset-1 col-xs-8 col-xs-offset-3");

            var well = document.createElement("div");
            $(well).attr("class", "row well custom-well");

            var rightPart = document.createElement("div");
            var $rightPart = $(rightPart);
            $rightPart.attr("class", "col-xs-9");
            $rightPart.html("<h4 class='theme-color'>Pending Friend Request - " + friend.username + "</h4>");
            $rightPart.append("<h5><a href='/user.html?username=" + friend.username + "'>" + friend.firstName
                + " " + friend.lastName + "</a> would like to be friends with you.</h5>");
            
            var pullRightDiv = document.createElement("div");
            $(pullRightDiv).attr("class", "pull-right");

            var acceptButton = document.createElement("button");
            var $acceptButton = $(acceptButton);
            $acceptButton.attr("class", "btn btn-success");
            $acceptButton.html("Accept");
            $acceptButton.attr("type", "button");
            $acceptButton.attr("value", friend.username);
            $acceptButton.click(function () {
                createFriendship(openedUser.username, $(this).val());

                $(rowContainer).slideUp('fast', function () {
                    $(rowContainer).remove();
                });
            });

            var rejectButton = document.createElement("button");
            var $rejectButton = $(rejectButton);
            $rejectButton.attr("class", "btn btn-danger");
            $rejectButton.html("Reject");
            $rejectButton.attr("type", "button");
            $rejectButton.attr("value", friend.username);
            $rejectButton.click(function () {
                removeFriendRequest(openedUser.username, $(this).val());
                
                $(rowContainer).slideUp('fast', function () {
                    $(rowContainer).remove();
                });
            });

            $(pullRightDiv).append(acceptButton);
            $(pullRightDiv).append(rejectButton);
            $rightPart.append(pullRightDiv);

            var leftPart = document.createElement("div");
            $(leftPart).attr("class", "col-xs-3");
            
            var image = document.createElement("img");
            $(image).attr("src", "img/avatars/" + friend.avatarImage);
            $(image).attr("class", "img-responsive");
            $(image).attr("alt", "Profile picture");
            $(image).error(function () {
                $(this).attr('src', "http://placehold.it/300x300");
            });

            $(leftPart).append(image);

            $(well).html(leftPart);
            $(well).append(rightPart);

            $(positioner).append(well);
            $(rowContainer).append(positioner);

            return rowContainer;
        }

        function createFriendship(username1, username2) {
            $.ajax({
                type: "GET",
                url: "Service.svc/CreateFriendship",
                data: { username1: username1, username2: username2 },
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    onCreateFriendshipSuccess(receivedData);
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });

            adjustTabGlow();
        }

        function removeFriendRequest(username1, username2) {
            $.ajax({
                type: "GET",
                url: "Service.svc/RemoveFriendRequest",
                data: { username1: username1, username2: username2 },
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    console.log("Successfully removed request");
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });

            adjustTabGlow();
        }

        function onCreateFriendshipSuccess(receivedData) {
            console.log("ON CREATE SUCCESS: " + receivedData);
            try {
                var friend = JSON.parse(receivedData);
                friendList.addFriend(friend);
            }
            catch(exception) {
                console.log("Could not add friend after friendship creation!");
            }
        }

        function adjustTabGlow() {
            var value = $("#tab-friend-requests").attr("value");
            console.log(value);
            value--;

            if (value > 0)
            {
                $("#tab-friend-requests").attr("value", value);
                $("#tab-friend-requests").html("Friend Requests (" + value + ")");
            }
            else
            {
                $("#tab-friend-requests").html("Friend Requests");
                $("#tab-friend-requests").removeClass("glow-style");
                $("#friend-requests").html("<h3 class='italic'>No pending friend requests to display.</h3>");
            }
        }

        return {
            init: publicInit
        }
    }());

    var friendList = (function () {

        var numberOfFriends = 0;

        function publicInit() {
            $.ajax({
                type: "GET",
                url: "Service.svc/GetFriends",
                data: { username: openedUser.username },
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    onFriendsSuccess(receivedData);
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });
        }

        function publicAddFriend(friend) {
            numberOfFriends++;

            $("#tab-friends").attr("value", numberOfFriends);
            $("#tab-friends").html("Friends (" + numberOfFriends + ")");

            if (numberOfFriends - 1 === 0) {
                var friendRow = document.createElement("div");
                $(friendRow).attr("class", "row");
                $(friendRow).attr("id", "friend-row");

                var friendView = buildFriendView(friend);
                $(friendRow).append(friendView);

                $("#friends").empty();
                $("#friends").html(friendRow);
            }
            else {
                $("#friend-row").append(buildFriendView(friend));
            }
        }

        function onFriendsSuccess(receivedData) {
            var $friends = $("#friends");

            if (receivedData.length > 0)
            {
                $("#tab-friends").attr("value", receivedData.length);
                $("#tab-friends").html("Friends (" + receivedData.length + ")");
                $friends.empty();
                var friendRow = document.createElement("div");
                $(friendRow).attr("class", "row");
                $(friendRow).attr("id", "friend-row");
                $friends.html(friendRow);

                numberOfFriends = receivedData.length;
            }

            var friendRow = null;
            for (var i = 0; i < receivedData.length; i++) {
                try {
                    var item = JSON.parse(receivedData[i]);
                }
                catch (exception) {
                    console.log("Error parsing JSON!");
                    continue;
                }

                var friendView = buildFriendView(item);

                $("#friend-row").append(friendView);
            }

            if (!activeUser || !(activeUser.username === openedUser.username || activeUser.status == "Admin"))
                $(".remove-friend-button").remove();
            console.log(receivedData);
        }

        function buildFriendView(friend) {
            var positioner = document.createElement("div");
            $(positioner).attr("class", "col-xs-4");
            $(positioner).attr("style", "padding: 0 20px;");

            var well = document.createElement("div");
            $(well).attr("class", "row well custom-well");
            $(well).attr("style", "height: 150px;");

            var leftPart = document.createElement("div");
            $(leftPart).attr("class", "col-xs-5");

            var image = document.createElement("img");
            $(image).attr("src", "img/avatars/" + friend.avatarImage);
            $(image).attr("class", "img-responsive");
            $(image).attr("alt", "Profile picture");
            $(image).error(function () {
                $(this).attr('src', "http://placehold.it/300x300");
            });

            var removeButton = document.createElement("button");
            var $removeButton = $(removeButton);
            $removeButton.attr("class", "btn btn-xs btn-danger remove-friend-button margin-top-15");
            $removeButton.html("Remove");
            $removeButton.attr("type", "button");
            $removeButton.attr("value", friend.username);
            $removeButton.click(function () {
                removeFriend(openedUser.username, $(this).val());

                $(positioner).hide('fast', function () {
                    $(positioner).remove();
                });
            });

            $(leftPart).append(image);
            $(leftPart).append(removeButton);

            var rightPart = document.createElement("div");
            var $rightPart = $(rightPart);
            $rightPart.attr("class", "col-xs-7");
            $rightPart.html("<h4><a class='theme-color' href='/user.html?username=" + friend.username + "'>" + friend.username + "</a></h4>");
            $rightPart.append("<h5>" + friend.firstName + " " + friend.lastName + "</h5>");

            $(well).html(leftPart);
            $(well).append(rightPart);

            $(positioner).append(well);

            return positioner;
        }

        function removeFriend(username1, username2) {
            $.ajax({
                type: "GET",
                url: "Service.svc/RemoveFriendship",
                data: { username1: username1, username2: username2 },
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    onRemoveFriendSuccess(receivedData);
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });
        }

        function onRemoveFriendSuccess(receivedData) {
            numberOfFriends--;
            $("#tab-friends").attr("value", numberOfFriends);
            
            if (numberOfFriends === 0)
            {
                $("#tab-friends").html("Friends");
                $("#friends").html("<h3 class='italic'>You haven't made any friends yet.</h3>");
            }
            else
            {
                $("#tab-friends").html("Friends (" + numberOfFriends + ")");
            }
        }

        return {
            init: publicInit,
            addFriend: publicAddFriend
        }
    }());




    $(document).ready(documentInit);
})();
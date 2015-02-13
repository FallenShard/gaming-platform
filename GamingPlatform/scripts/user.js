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
            if (pair[0] == variable) { return pair[1].replace(/%20/g, " ");; }
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
        wall.init();
        games.init();

        if (activeUser !== null) {
            if (activeUser.username === openedUser.username || activeUser.status == "Admin") {
                userPanel.showEditButton();
                $("#tab-wall").removeClass("hide");
                $("#tab-friend-requests").removeClass("hide");
            }

            if (activeUser.username !== openedUser.username) {
                userPanel.setupRelationStatus();
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

        function publicSetupRelationStatus() {
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
                var data = receivedData.split("|");

                if (data[0] === "friends") {
                    $("#is-friends-div").removeClass("hide");
                    $("#tab-wall").removeClass("hide");
                }
                else if (data[0] === "requestSent") {
                    $("#add-friend-button").button('loading');
                    $("#add-friend-button").removeClass("hide");
                }
                else {
                    $("#add-friend-button").removeClass("hide");
                }

                $("#mutual-friends-div").removeClass("hide");
                $("#mutual-friends-span").html(data[1]);
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

                var memberSinceDate = model.createDate(userData, "memberSinceDate");
                $("#member-since-label").html(memberSinceDate.toDateString().substring(4));
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
            setupRelationStatus: publicSetupRelationStatus
        }
    })();

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
    })();

    var friendList = (function () {

        var numberOfFriends = 0;

        function publicInit() {
            if (activeUser) {
                if (activeUser.username === openedUser.username) {
                    $.ajax({
                        type: "GET",
                        url: "Service.svc/GetFriendsWithMutual",
                        data: { username: openedUser.username },
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        processData: true,
                        success: function (receivedData) {
                            onFriendsAndMutualSuccess(receivedData);
                        },
                        error: function (result) {
                            console.log("Error performing ajax " + result);
                        }
                    });
                }
                else {
                    $.ajax({
                        type: "GET",
                        url: "Service.svc/GetFriendsWithMutualNotSelf",
                        data: { openedUser: openedUser.username, activeUser: activeUser.username },
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        processData: true,
                        success: function (receivedData) {
                            onFriendsAndMutualSuccess(receivedData);
                        },
                        error: function (result) {
                            console.log("Error performing ajax " + result);
                        }
                    });
                }
            }
            else {
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

            if (!activeUser || !(activeUser.username === openedUser.username || activeUser.status == "Admin"))
                $(".remove-friend-button").remove();
            console.log(receivedData);
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

            for (var i = 0; i < receivedData.length; i++) {
                try {
                    var item = JSON.parse(receivedData[i]);
                    
                }
                catch (exception) {
                    console.log("Error parsing JSON!");
                    continue;
                }

                var friendView = buildFriendView(item, null);

                $("#friend-row").append(friendView);
            }

            if (!activeUser || !(activeUser.username === openedUser.username || activeUser.status == "Admin"))
                $(".remove-friend-button").remove();
        }

        function onFriendsAndMutualSuccess(receivedData) {
            var $friends = $("#friends");

            if (receivedData.length > 0) {
                $("#tab-friends").attr("value", receivedData.length);
                $("#tab-friends").html("Friends (" + receivedData.length + ")");
                $friends.empty();
                var friendRow = document.createElement("div");
                $(friendRow).attr("class", "row");
                $(friendRow).attr("id", "friend-row");
                $friends.html(friendRow);

                numberOfFriends = receivedData.length;
            }

            var recData = [];
            for (var k = 0; k < receivedData.length; k++) {
                recData.push(JSON.parse(receivedData[k]));
            }

            recData.sort(function (a, b) { return a.mutual.length < b.mutual.length; });

            for (var i = 0; i < receivedData.length; i++) {
                try {
                    var item = recData[i];
                }
                catch (exception) {
                    console.log("Error parsing JSON!");
                    continue;
                }

                var friendView = buildFriendView(item.friend, item.mutual);

                $("#friend-row").append(friendView);
            }

            if (!activeUser || !(activeUser.username === openedUser.username || activeUser.status == "Admin"))
                $(".remove-friend-button").remove();
        }

        function buildFriendView(friend, mutuals) {
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

            if (mutuals && mutuals.length > 0)
            {
                var h6 = document.createElement("h6");
                var a = document.createElement("a");
                $(a).attr("type", "button");
                $(a).attr("style", "cursor: pointer;");
                $(a).attr("data-toggle", "modal");
                $(a).attr("data-target", "mutual-modal");
                $(a).html(mutuals.length + " mutual friends");

                $(h6).append(a);
                $rightPart.append(h6);

                var str = "";
                for (var i = 0; i < mutuals.length; i++) {
                    str += "<h4><a href='user.html?username=" + mutuals[i].Data.username + "'>" + mutuals[i].Data.username + "</a></h4><br>";
                }
                str.slice(0, -4);
                
                $(a).click(function () {
                    $("#mutual-modal-body").html(str);
                    $('#mutual-modal').modal('show');
                })

                console.log(str);
            }

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
    })();

    var games = (function () {

        var noOfGames = 0;

        function publicInit() {
            $.ajax({
                type: "GET",
                url: "Service.svc/GetUserGames",
                data: { username: openedUser.username },
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    onGamesSuccess(receivedData);
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });
        }

        function onGamesSuccess(receivedData) {
            var $games = $("#games");

            if (receivedData.length > 0) {
                noOfGames = receivedData.length;
                $("#tab-games").attr("value", noOfGames);
                $("#tab-games").html("Games (" + noOfGames + ")");
                $games.empty();

                var gamesRow = document.createElement("div");
                $(gamesRow).attr("class", "row");
                $(gamesRow).attr("id", "games-row");
                $games.html(gamesRow);
            }

            for (var i = 0; i < receivedData.length; i++) {
                try {
                    var item = JSON.parse(receivedData[i]);
                }
                catch (exception) {
                    console.log("Error parsing JSON!");
                    continue;
                }

                var date = new Date(parseInt(item.date.since));
                var totalHrs = item.date.totalHours;
                var gameView = buildGameView(item.game, date, totalHrs);

                $("#games-row").append(gameView);
            }

            if (!activeUser || !(activeUser.username === openedUser.username || activeUser.status == "Admin"))
                $(".remove-friend-button").remove();
        }

        function buildGameView(game, dateSince, totalHrs) {
            var positioner = document.createElement("div");
            $(positioner).attr("class", "col-xs-6");
            $(positioner).attr("style", "padding: 0 20px;");

            var well = document.createElement("div");
            $(well).attr("class", "row well custom-well");
            $(well).attr("style", "height: 200px;");

            var leftPart = document.createElement("div");
            $(leftPart).attr("class", "col-xs-4 text-center");

            var image = document.createElement("img");
            $(image).attr("src", "img/thumbnails/" + game.thumbnail);
            $(image).attr("class", "img-responsive");
            $(image).attr("alt", "Profile picture");
            $(image).error(function () {
                $(this).attr('src', "http://placehold.it/300x300");
            });
            $(leftPart).append(image);

            if (hasRemovalPrivileges()) {
                var removeButton = document.createElement("button");
                var $removeButton = $(removeButton);
                $removeButton.attr("class", "btn btn-xs btn-danger remove-friend-button margin-top-15");
                $removeButton.html("Remove");
                $removeButton.attr("type", "button");
                $removeButton.attr("value", game.title);
                
                $removeButton.click(function () {
                    removeGame(openedUser.username, game.title);

                    $(positioner).hide('fast', function () {
                        $(positioner).remove();
                    });

                    noOfGames--;
                    if (noOfGames > 0)
                        $("#tab-games").html("Games (" + noOfGames + ")");
                    else {
                        $("#tab-games").html("Games");
                        $("#games").append(noWallPostsHtml);
                    }
                });
                $(leftPart).append(removeButton);
            }

            var rightPart = document.createElement("div");
            var $rightPart = $(rightPart);
            $rightPart.attr("class", "col-xs-7");
            $rightPart.html("<h4 style='height:40px;'><a class='theme-color' href='/game.html?title=" + game.title + "'>" + game.title + "</a></h4>");
            $rightPart.append("<h5 style='height:20px;'>" + game.genre + "</h5>");

            var helperRow = document.createElement("div");
            $(helperRow).attr("class", "row");
            
            var leftCol = document.createElement("div");
            $(leftCol).attr("class", "col-xs-7");

            $(leftCol).append("<h6>" + game.mode + "</h6>");
            $(leftCol).append("<h6>Added: " + dateSince.toLocaleDateString() + "</h6>");
            $(leftCol).append("<h6><span id='" + game.title.replace(/ /g, '') + "hours'>" + totalHrs + "</span> hours on track</h6>");
            $(helperRow).append(leftCol);

            if (activeUser && activeUser.username == openedUser.username)
            {
                var rightCol = document.createElement("div");
                $(rightCol).attr("class", "col-xs-5");

                var playBtn = document.createElement("div");
                $(playBtn).attr("class", "btn btn-block btn-success pull-right game-item-button-fix");
                $(playBtn).html("Play");
                $(playBtn).click(function () {
                    
                    var el = $("#" + game.title.replace(/ /g, '') + "hours");
                    var num = parseInt(el.html());
                    console.log(el);
                    num++;
                    el.html(num);
                    setPlayTime(activeUser.username, game.title, num);
                });
                $(rightCol).append(playBtn);

                $(helperRow).append(rightCol);
            }

            $(rightPart).append(helperRow);

            $(well).html(leftPart);
            $(well).append(rightPart);

            $(positioner).append(well);

            return positioner;
        }

        function setPlayTime(username, gameTitle, num) {
            console.log(num);
            $.ajax({
                type: "GET",
                url: "Service.svc/SetPlayTime",
                data: { username: username, title: gameTitle, hours: num },
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    console.log("Added time successfully!");
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });
        }

        function hasRemovalPrivileges() {
            var hasPrivileges = false;
            if (activeUser) {
                if (activeUser.username === openedUser.username)
                    hasPrivileges = true;

                if (activeUser.status === "Admin")
                    hasPrivileges = true;
            }

            return hasPrivileges;
        }

        function removeGame(username, game) {
            $.ajax({
                type: "GET",
                url: "Service.svc/RemoveUserPlaysGame",
                data: { username: username, title: game },
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    console.log("Removed game successfully!");
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });
        }

        return {
            init: publicInit
        }
    })();

    var wall = (function () {
        var noOfwallPosts = 0;
        var noWallPostsHtml = "<h3 id='no-message-h3' class='italic'>No messages have been posted yet.</h3>";

        function publicInit() {

            $("#submit-wall-post-btn").click(function () {
                var content = $("#wall-post-input").val();
                content.trim();

                if (content.length === 0)
                    return;

                content = content.replace(/(?:\n\r|\r|\n)/g, '<br>');

                var now = new Date();

                var postData = {};
                postData.content = content;
                postData.timestamp = now.getTime();
                postData.writer = activeUser.username;
                postData.recipient = openedUser.username;

                createWallPost(postData);
                
                var post = buildPostView(postData, activeUser);
                $(post).hide();
                $(post).insertAfter("#input-wall-post-div");
                $(post).show('slow');

                if (noOfwallPosts === 0)
                {
                    $("#no-message-h3").remove();
                }

                noOfwallPosts++;
                $("#tab-wall").html("Wall Posts (" + noOfwallPosts + ")");

                $("#wall-post-input").val("");
            });

            requestWallPosts();
            requestFriendNames(); // For writing-on-wall permissions
        }

        function createWallPost(post) {
            $.ajax({
                type: "POST",
                url: "Service.svc/CreateWallPost",
                data: JSON.stringify(post),
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
        }

        function requestWallPosts() {
            $.ajax({
                type: "GET",
                url: "Service.svc/GetWallPosts",
                data: { username: openedUser.username },
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    onWallPostsSuccess(receivedData);
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });
        }

        function onWallPostsSuccess(receivedData) {
            var $wall = $("#wall");
            var input = $("#input-wall-post-div").detach();

            
            if (receivedData.length > 0) {
                noOfwallPosts = receivedData.length;
                $("#tab-wall").html("Wall Posts (" + noOfwallPosts + ")");
                $wall.empty();

                receivedData.sort(function (a, b) { return parseInt(a.timestamp) - parseInt(b.timestamp) });
            }



            var documentFragment = $(document.createDocumentFragment());

            for (var i = 0; i < receivedData.length; i++) {
                try {
                    var item = JSON.parse(receivedData[i]);
                }
                catch (exception) {
                    console.log("Error parsing JSON!");
                    continue;
                }

                var postView = buildPostView(item.wallPost, item.writer);

                documentFragment.append(postView);
            }

            input.appendTo($wall);

            if (noOfwallPosts > 0) {
                $wall.append(documentFragment);
            }
            else {
                $wall.append(noWallPostsHtml);
            }
        }

        function requestFriendNames() {
            $.ajax({
                type: "GET",
                url: "Service.svc/GetFriendNames",
                data: { username: openedUser.username },
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    onFriendNamesSuccess(receivedData);
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });
        }

        function onFriendNamesSuccess(receivedData) {
            var hasInput = false;

            if (activeUser)
            {
                if (activeUser.username === openedUser.username)
                    hasInput = true;

                if (receivedData.indexOf(activeUser.username) !== -1)
                    hasInput = true;

                if (activeUser.status === "Admin")
                    hasInput = true;
            }

            if (!hasInput)
                $("#input-wall-post-div").remove();
        }

        function buildPostView(post, user) {
            var rowDiv = document.createElement("div");
            $(rowDiv).attr("class", "row");

            var colDiv = document.createElement("div");
            $(colDiv).attr("class", "col-xs-offset-1 col-xs-8 col-xs-offset-3");
            
            var wellDiv = document.createElement("div");
            $(wellDiv).attr("class", "row well custom-well");

            var imgDiv = document.createElement("div");
            $(imgDiv).attr("class", "col-xs-2 text-center");
            
            var img = document.createElement("img");
            $(img).attr("src", "img/avatars/" + user.avatarImage);
            $(img).attr("class", "img-responsive img-center");

            if (user.status === "Admin")
            {
                $(img).attr("style", "border: red 1px solid;");
                $(wellDiv).attr("style", "border: red 1px solid;");
            }

            $(imgDiv).html(img);


            var userDiv = document.createElement("div");
            $(userDiv).attr("class", "col-xs-10");

            if (activeUser)
            {
                if (activeUser.username === user.username)
                {
                    if (activeUser.username === openedUser.username)
                        $(userDiv).html("<h5>You have posted on your wall." + "</h5>");
                    else
                        $(userDiv).html("<h5>You have posted on " + openedUser.username +  "'s wall." + "</h5>");
                }
                else {
                    if (activeUser.username === openedUser.username)
                        $(userDiv).html("<h5><a href='user.html?username=" + user.username + "'>" + user.username + "</a>" + " has posted on your wall." + "</h5>");
                    else
                        $(userDiv).html("<h5><a href='user.html?username=" + user.username + "'>" + user.username + "</a>" + " has posted on " + openedUser.username + "'s wall." + "</h5>");
                }
            }
            else
                $(userDiv).html("<h5>" + user.username + " has posted on " + openedUser.username + "'s wall." + "</h5>");

            var messageDiv = document.createElement("div");
            $(messageDiv).attr("class", "col-xs-12");
            $(messageDiv).html("<p class=top-margin-15>" + post.content + "</p>");


            var removeBtnDiv = document.createElement("div");
            $(removeBtnDiv).attr("class", "col-xs-2");

            if (hasRemovalPrivileges(user.username))
            {
                var removeButton = document.createElement("button");
                var $removeButton = $(removeButton);
                $removeButton.attr("class", "btn btn-xs btn-danger");
                $removeButton.html("Remove");
                $removeButton.attr("type", "button");
                $removeButton.click(function () {
                    removeWallPost(user.username, post.timestamp);

                    $(rowDiv).hide('fast', function () {
                        $(rowDiv).remove();
                    });

                    noOfwallPosts--;
                    if (noOfwallPosts > 0)
                        $("#tab-wall").html("Wall Posts (" + noOfwallPosts + ")");
                    else
                    {
                        $("#tab-wall").html("Wall Posts");
                        $("#wall").append(noWallPostsHtml);
                    }
                        

                });
                $(removeBtnDiv).append(removeButton);
            }

            var timestampDiv = document.createElement("div");
            $(timestampDiv).attr("class", "col-xs-10");
            var date = new Date(parseInt(post.timestamp));
            $(timestampDiv).html("<span class='pull-right italic'>Posted on " + date.toLocaleString() + "</span");

            $(wellDiv).append(imgDiv);
            $(wellDiv).append(userDiv);
            $(wellDiv).append(messageDiv);
            $(wellDiv).append(removeBtnDiv);
            $(wellDiv).append(timestampDiv);

            $(colDiv).html(wellDiv);
            
            $(rowDiv).html(colDiv);

            return rowDiv;
        }

        function hasRemovalPrivileges(writerUsername) {
            var hasPrivileges = false;
            if (activeUser) {
                if (activeUser.username === openedUser.username)
                    hasPrivileges = true;

                if (activeUser.status === "Admin")
                    hasPrivileges = true;

                if (activeUser.username === writerUsername)
                    hasPrivileges = true;
            }

            return hasPrivileges;
        }

        function removeWallPost(writer, timestamp) {
            $.ajax({
                type: "GET",
                url: "Service.svc/RemoveWallPost",
                data: { writer: writer, timestamp: timestamp, recipient: openedUser.username },
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    console.log("Successfully deleted post!");
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });
        }

        return {
            init: publicInit
        };
    })();

    $(document).ready(documentInit);
})();
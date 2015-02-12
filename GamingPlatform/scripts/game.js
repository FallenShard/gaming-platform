(function () {
    'use strict';

    // Global variables
    var activeUser = null;
    var openedGame = null;

    // Url parsing for given variable
    function getUrlVariable(variable) {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == variable) { return pair[1].replace(/%20/g, " "); }
        }
        return (false);
    }

    // Page initiation
    function documentInit() {
        $("#header-div").load("header.html", function () {
            headerBar.init();
        });

        initModel();
    }

    // Model initiation
    function initModel() {
        // Getting user
        if (sessionStorage.activeUser) {
            var activeUserString = sessionStorage.activeUser;
            activeUser = JSON.parse(activeUserString);
        }

        // Getting game
        var urlTitle = getUrlVariable("title");
        if (!urlTitle)
            alert("Url parsing error!");
        else {
            requestGameData(urlTitle);
        }
    }

    // Getting game
    function requestGameData(title) {
        $.ajax({
            type: "GET",
            url: "Service.svc/GetGameByTitle",
            data: { title: title },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            processData: true,
            success: function (receivedData) {
                onGameDataSuccess(receivedData);
            },
            error: function (result) {
                console.log("Error performing ajax " + result);
            }
        });
    }

    // Upon getting game
    function onGameDataSuccess(receivedData) {
        openedGame = JSON.parse(receivedData);

        // At this point, model is initiated fully, so init the modules
        gamePanelBasic.init();
        gameDevelopment.init();
        //TODO
        // Other information(developer, rating system, has/doesn't have game
        ratingSystem.init();
        reviews.init();

        if (activeUser !== null) {
            //gamePanelBasic.showAddReviewButton();
        }
    }

    // Game panel basic(without developer, rating system etc.)
    var gamePanelBasic = (function () {

        function publicInit() {
            view.init();
        }

        // Hiding "Add review" button
        function publicShowAddReviewButton() {
            $("#add-review-button").toggleClass("hide");
        }

        var model = {
            // Creating date
            createDate: function (object, dateProp) {
                return new Date(parseInt(object[dateProp]));
            }
        };

        var controller = {
                // Nothing for now
        };

        var view = {
            init: function () {
                this.setGameData(openedGame);
            },

            formatPlatforms: function (platforms) {
                var retVal = "";
                for (var i = 0; i < platforms.length; i++) {
                    retVal += platforms[i] + ", ";
                }

                return retVal.slice(0, -2);
            },

            setGameData: function (gameData) {
                $("#game-title").html(gameData.title);

                $("#game-description").html(gameData.description);

                $("#game-genre").html(gameData.genre);
                $("#game-mode").html(gameData.mode);
                var releaseDate = model.createDate(gameData, "releaseDate");
                $("#game-release-date").html(releaseDate.toDateString().substring(4));
                $("#game-platforms").html(this.formatPlatforms(gameData.platforms));
                $("#game-publisher").html(gameData.publisher);

                $("#game-thumbnail").attr("src", "img/thumbnails/" + gameData.thumbnail);

                var $carInd = $("#carousel-indicator");
                var $carData = $("#carousel-data");
                $carInd.empty();
                $carData.empty();

                for (var i = 0; i < gameData.images.length; i++)
                {
                    var index = i + 1;
                    var carItem = this.buildCarouselItem(gameData.images[i], index);

                    $carInd.append(carItem.liItem);
                    $carData.append(carItem.carDiv);
                }
            },

            buildCarouselItem: function (image, index) {
                var carDiv = document.createElement("div");
                $(carDiv).attr("class", "item");

                if (index === 1)
                    $(carDiv).addClass("active");

                var img = document.createElement("img");
                $(img).attr("class", "img-responsive");
                $(img).attr("src", "img/screenshots/" + image);
                $(img).error(function () {
                    $(this).attr("src", "http://placehold.it/640x360");
                });

                $(carDiv).html(img);

                var liItem = document.createElement("li");
                $(liItem).attr("data-target", "#game-carousel");
                $(liItem).attr("data-slide-to", (index - 1).toString());

                if (index === 1)
                    $(liItem).attr("class", "active");


                return {
                    carDiv: carDiv,
                    liItem: liItem
                }
            }
        };

        return {
            init: publicInit
        }
    })();

    var gameDevelopment = (function () {
        var gameDeveloper = null;

        function publicInit() {
            controller.init();
        }

        var model = {
            // Nothing for now
        };

        var controller = {
            init: function () {
                this.requestGameDeveloper(openedGame.title);
            },

            requestGameDeveloper: function (title) {
                $.ajax({
                    type: "GET",
                    url: "Service.svc/GetGameDeveloper",
                    data: { title: title },
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    processData: true,
                    success: function (receivedData) {
                        controller.onGameDeveloperSuccess(receivedData);
                    },
                    error: function (result) {
                        console.log("Error performing ajax " + result);
                    }
                });
            },

            onGameDeveloperSuccess: function (receivedData) {
                gameDeveloper = JSON.parse(receivedData);
                view.setDeveloperData(gameDeveloper);
            }
        };

        var view = {
            setDeveloperData: function (gameData) {
                $("#game-developed-by").html("<a href='developer.html?name=" + gameDeveloper.name + "'>" + gameDeveloper.name + "</a>");
            },
        };

        return {
            init: publicInit
        }
    }());

    var ratingSystem = (function () {

        var activeUserRating = null;
        var $rating = null;
        var $ratingDesc = null;
        var $userRatingDesc = null;
        var $globalRatingDesc = null;
        var ratingSum = 0;
        var ratingCount = 0;

        function publicInit() {
            $rating = $("#rating");
            $ratingDesc = $("#rating-desc");
            $userRatingDesc = $("#user-rating-desc");
            $globalRatingDesc = $("#global-rating-desc");
            $("#remove-rating-btn").hide();
            $("#remove-rating-btn").click(function () {
                requestRemoveRating();
            });

            requestGameRating();
            

            if (activeUser)
            {
                setupClickable();
            }
            else
            {
                setupUnclickable();
            }
            
        }

        function setupUnclickable() {
        }


        function setupClickable() {
            $rating.rateit('readonly', false);
            $rating.rateit('resetable', false);

            $rating.bind('rated', function (event, value) {
                var value = $rating.rateit('value');
                activeUserRating = value;
                $rating.rateit('readonly', true);
                console.log(value);
                createRating(value);
            });

            requestUserGameRating();
        }

        function createRating(value) {
            $.ajax({
                type: "GET",
                url: "Service.svc/CreateUserRating",
                data: { rating: value, title: openedGame.title, username: activeUser.username },
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    ratingSum += value;
                    ratingCount++;
                    onCreateRatingSuccess(receivedData);
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });
        }

        function onCreateRatingSuccess(receivedData) {
            console.log(receivedData);

            updateGlobalRatingView();
            updateUserRatingView(false);
        }

        function requestGameRating() {
            $.ajax({
                type: "GET",
                url: "Service.svc/GetGameRating",
                data: { title: openedGame.title },
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    onGameRatingSuccess(receivedData);
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });
        }

        function onGameRatingSuccess(receivedData) {
            console.log(receivedData);
            var obj = JSON.parse(receivedData);
            ratingCount = obj.count;
            ratingSum = obj.sum;
            updateGlobalRatingView();
        }

        function requestUserGameRating() {
            $.ajax({
                type: "GET",
                url: "Service.svc/GetGameRatingByUser",
                data: { title: openedGame.title, username: activeUser.username },
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    onUserGameRatingSuccess(receivedData);
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });
        }

        function onUserGameRatingSuccess(receivedData) {
            console.log(receivedData);
            if (receivedData === "nothing") {
                $userRatingDesc.html("You did not rate this item yet.");
                $("#remove-rating-btn").hide();
            }
            else {
                activeUserRating = parseFloat(receivedData);
                $rating.rateit('readonly', true);
                $userRatingDesc.html("You rated this item with " + activeUserRating + " stars.");
                $("#remove-rating-btn").show();
            }
        }

        function requestRemoveRating() {
            $.ajax({
                type: "GET",
                url: "Service.svc/RemoveUserRating",
                data: { title: openedGame.title, username: activeUser.username },
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    ratingSum -= activeUserRating;
                    ratingCount--;
                    onRemoveRatingSuccess(receivedData);
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });
        }

        function onRemoveRatingSuccess(receivedData) {
            console.log(receivedData);
            updateGlobalRatingView();
            updateUserRatingView(true);
            $("#remove-rating-btn").hide();
        }

        function updateGlobalRatingView() {
            if (ratingCount === 0) {
                ratingSum = 0;
                $rating.rateit('value', 0);
                $ratingDesc.html("No ratings yet for this game.");
                $globalRatingDesc.html("");
            }
            else {
                var rating = ratingSum / ratingCount;
                $rating.rateit('value', rating);
                $ratingDesc.html("Based on " + ratingCount + " ratings.");
                $globalRatingDesc.html("(" + rating.toFixed(2) + " out of " + "5)");
            }
        }

        function updateUserRatingView(hasDeleted) {
            if (hasDeleted === true) {
                $rating.rateit('readonly', false);
                $userRatingDesc.html("You did not rate this item yet.");
                $("#remove-rating-btn").hide();
            }
            else {
                $rating.rateit('readonly', true);
                $userRatingDesc.html("You rated this item with " + activeUserRating + " stars.");
                $("#remove-rating-btn").show();
            }
        }

        return {
            init: publicInit
        }
    })();

    var reviews = (function () {
        var noOfReviews = 0;
        var $reviewInputDiv = null;

        function publicInit() {
            $reviewInputDiv = $("#review-input-div");
            
            $.ajax({
                type: "GET",
                url: "Service.svc/GetUserReview",
                data: { username: activeUser.username, title: openedGame.title },
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    onUserReviewSuccess(receivedData);
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });

            $.ajax({
                type: "GET",
                url: "Service.svc/GetGameReviews",
                data: { gameTitle: openedGame.title },
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    onGameReviewsSuccess(receivedData);
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });

            $reviewInputDiv.hide();
        }

        function onUserReviewSuccess(receivedData) {
            if (receivedData === "nothing") {
                $reviewInputDiv.show();
                $("#submit-review-btn").click(function () {
                    var content = $("#review-input").val();
                    content.trim();

                    if (content.length === 0)
                        return;

                    content = content.replace(/(?:\n\r|\r|\n)/g, '<br>');

                    var now = new Date();

                    var reviewData = {};
                    reviewData.content = content;
                    reviewData.timestamp = now.getTime();
                    reviewData.writer = activeUser.username;
                    reviewData.game = openedGame.title;

                    createReview(reviewData);

                    var review = buildReviewView(reviewData, activeUser);
                    $(review).hide();
                    $(review).prependTo("#user-reviews-div");
                    $(review).show('slow');

                    noOfReviews++;
                    $("#reviews-count").html("Reviews (" + noOfReviews + ")");
                    $("#review-input").val("");

                    
                });
            }
            else {
                // user has already posted.
            }
        }

        function onGameReviewsSuccess(receivedData) {
            var $revDiv = $("#user-reviews-div");
            noOfReviews = receivedData.length;

            if (noOfReviews > 0) {
                $("#reviews-count").html("Reviews (" + noOfReviews + ")");
                $revDiv.empty();
            }

            for (var i = 0; i < noOfReviews; i++) {
                try {
                    var item = JSON.parse(receivedData[i]);
                }
                catch (exception) {
                    console.log("Error parsing review json");
                    continue;
                }

                var view = buildReviewView(item.review, item.writer);
                $revDiv.append(view);
            }
        }

        function buildReviewView(review, writer) {
            var rowDiv = document.createElement("div");
            $(rowDiv).attr("class", "row");

            var colDiv = document.createElement("div");
            $(colDiv).attr("class", "col-xs-12");

            var wellDiv = document.createElement("div");
            $(wellDiv).attr("class", "row well");
            $(wellDiv).attr("style", "padding: 15px");

            var upperDiv = document.createElement("div");
            $(upperDiv).attr("class", "row");

            var imgDiv = document.createElement("div");
            $(imgDiv).attr("class", "col-xs-2 text-center");

            var img = document.createElement("img");
            $(img).attr("src", "img/avatars/" + writer.avatarImage);
            $(img).attr("class", "img-responsive img-center");
            $(imgDiv).html(img);

            if (writer.status === "Admin") {
                $(img).attr("style", "border: red 1px solid;");
                $(wellDiv).attr("style", "border: red 1px solid;");
            }

            $(upperDiv).append(imgDiv);

            var contentDiv = document.createElement("div");
            $(contentDiv).attr("class", "col-xs-10");
            $(upperDiv).append(contentDiv);

            if (activeUser && activeUser.username === writer.username) {
                $(wellDiv).attr("style", "border: #FFFF66 1px solid;");
                $(contentDiv).html("<div class='row'><div class='col-xs-12'><h5>You have posted a review." + "</h5></div></div>");
            }
            else
                $(contentDiv).html("<div class='row'><div class='col-xs-12'><h5><a href='user.html?username=" + writer.username + "'>" + writer.username + "</a>" + " has posted a review." + "</h5></div></div>");

            var messageDiv = document.createElement("div");
            $(messageDiv).attr("class", "row");
            $(messageDiv).html("<div class='col-xs-12'><p class=top-margin-15>" + review.content + "</p></div>");

            $(contentDiv).append(messageDiv);


            var footerDiv = document.createElement("div");
            $(footerDiv).attr("class", "row");
            $(footerDiv).attr("style", "padding-top: 15px");

            var removeBtnDiv = document.createElement("div");
            $(removeBtnDiv).attr("class", "col-xs-2");

            if (hasRemovalPrivileges(writer.username)) {
                var removeButton = document.createElement("button");
                var $removeButton = $(removeButton);
                $removeButton.attr("class", "btn btn-xs btn-danger");
                $removeButton.html("Remove");
                $removeButton.attr("type", "button");
                $removeButton.click(function () {
                    removeReview(writer.username, openedGame.title);

                    noOfReviews--;
                    if (noOfReviews > 0)
                        $("#reviews-count").html("Reviews (" + noOfReviews + ")");
                    else {
                        $("#reviews-count").html("No reviews for this item yet.");
                    }

                    $(rowDiv).hide('fast', function () {
                        $(rowDiv).remove();
                    });
                });
                $(removeBtnDiv).append(removeButton);
            }

            var timestampDiv = document.createElement("div");
            $(timestampDiv).attr("class", "col-xs-10");
            var date = new Date(parseInt(review.timestamp));
            $(timestampDiv).html("<span class='pull-right italic'>Posted on " + date.toLocaleString() + "</span");

            $(footerDiv).append(removeBtnDiv);
            $(footerDiv).append(timestampDiv);


            $(wellDiv).append(upperDiv);
            $(wellDiv).append(footerDiv);

            $(colDiv).html(wellDiv);

            $(rowDiv).html(colDiv);

            return rowDiv;
        }

        function hasRemovalPrivileges(writerUsername) {
            var hasPrivileges = false;
            if (activeUser) {
                if (activeUser.username === writerUsername)
                    hasPrivileges = true;

                if (activeUser.status === "Admin")
                    hasPrivileges = true;
            }

            return hasPrivileges;
        }

        function createReview(review) {
            $.ajax({
                type: "POST",
                url: "Service.svc/CreateReview",
                data: JSON.stringify(review),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    console.log(receivedData);
                    $("#review-input-div").hide('slow');
                },
                error: function (result) {
                    console.log("Error performing ajax " + result);
                }
            });
        }

        function removeReview(username, game) {
            $.ajax({
                type: "GET",
                url: "Service.svc/RemoveReview",
                data: { username: username, title: game },
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                processData: true,
                success: function (receivedData) {
                    console.log(receivedData);
                    $("#review-input-div").show('slow');
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

    var addToCollection = (function () {

        function publicInit() {

        }


        return {
            init: publicInit
        }
    })();

    $(document).ready(documentInit);
})();
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
            if (pair[0] == variable) { return pair[1]; }
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
                return retVal;
            },

            setGameData: function (gameData) {
                $("#game-title").html(gameData.title);

                $("#game-description").html(gameData.description);

                $("#game-genre").html(gameData.genre);
                $("#game-mode").html(gameData.mode);
                var releaseDate = model.createDate(userData, "releaseDate");
                $("#game-release-date").html(releaseDatetoDateString().substring(4)); game - platforms
                $("#game-platforms").html(this.formatPlatforms(gameData.platforms));
                $("#game-publisher").html(gameData.publisher);

                $("#game-thumbnail").attr("src", "img/thumbnail/" + gameData.thumbnail);

                $("#game-carousel-image-1").attr("src", "img/images/" + gameData.images[0]);
                $("#game-carousel-image-2").attr("src", "img/images/" + gameData.images[1]);
                $("#game-carousel-image-3").attr("src", "img/images/" + gameData.images[2]);
            },
        };

        return {
            init: publicInit
        }
    }());

    var gameDevelopment = (function () {
        var gameDeveloper = null;

        function publicInit() {
            controller.init();
            view.init();
        }

        var model = {
            // Nothing for now
        };

        var controller = {
            init: function () {
                requestGameDeveloper(openedGame.title)
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
                        onGameDeveloperSuccess(receivedData);
                    },
                    error: function (result) {
                        console.log("Error performing ajax " + result);
                    }
                });
            },

            onGameDeveloperSuccess: function (receivedData) {
                gameDeveloper = JSON.parse(receivedData);
            }
        };

        var view = {
            init: function () {
                this.setDeveloperData(openedGame);
            },

            setDeveloperData: function (gameData) {
                $("#game-developed-by").html(gameDeveloper.name);
            },
        };

        return {
            init: publicInit
        }
    }());

    $(document).ready(documentInit);
})();
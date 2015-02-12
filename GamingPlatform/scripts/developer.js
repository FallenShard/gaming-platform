(function () {
    'use strict';

    // Global variables
    var activeUser = null;
    var openedDeveloper = null;

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

        // Getting developer
        var urlName = getUrlVariable("name");
        if (!urlName)
            alert("Url parsing error!");
        else {
            requestDeveloperData(urlName);
        }
    }

    // Getting developer
    function requestDeveloperData(name) {
        $.ajax({
            type: "GET",
            url: "Service.svc/GetDeveloperByName",
            data: { name: name },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            processData: true,
            success: function (receivedData) {
                onDeveloperDataSuccess(receivedData);
            },
            error: function (result) {
                console.log("Error performing ajax " + result);
            }
        });
    }

    // Upon getting game
    function onDeveloperDataSuccess(receivedData) {
        openedDeveloper = JSON.parse(receivedData);

        // At this point, model is initiated fully, so init the modules
        developerPanel.init();
        devGames.init();
    }

    var developerPanel = (function () {

        function publicInit() {
            view.init();
        }

        var model = {
            // Nothing
        };

        var controller = {
            // Nothing for now
        };

        var view = {
            init: function () {
                this.setDeveloperData(openedDeveloper);
            },

            setDeveloperData: function (developerData) {
                $("#developer-name").html(developerData.name);

                $("#developer-location").html(developerData.location);
                $("#developer-owner").html(developerData.owner);
                $("#developer-website").html("<a href='http://" + developerData.website + "'>" + developerData.website + "</a>");

                $("#developer-logo").attr("src", developerData.logo);

                $("#developer-logo").error(function () {
                    $(this).attr("src", "http://placehold.it/256x256");
                })
            },
        };

        return {
            init: publicInit
        }
    }());

    var devGames = (function () {
        function publicInit() {
            $.ajax({
                type: "GET",
                url: "Service.svc/GetDeveloperGames",
                data: { name: openedDeveloper.name },
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
            var $gameCon = $("#games-container");
            $gameCon.empty();

            if (receivedData.length === 0) {
                $gameCon.html("<h3 class='italic'>No games to display at the moment</h3>");
            }

            for (var i = 0; i < receivedData.length; i++) {
                var item = JSON.parse(receivedData[i]);

                var view = buildGameView(item);
                $gameCon.append(view);
            }
        }

        function buildGameView(game) {

            var positioner = document.createElement("div");
            $(positioner).attr("class", "col-xs-12");

            var well = document.createElement("div");
            $(well).attr("class", "row well custom-well");

            var leftPart = document.createElement("div");
            $(leftPart).attr("class", "col-xs-3");

            var image = document.createElement("img");
            $(image).attr("src", "img/thumbnails/" + game.thumbnail);
            $(image).attr("class", "img-responsive");
            $(image).attr("alt", "Thumbnail");
            $(image).error(function () {
                $(this).attr('src', "http://placehold.it/256x256");
            });

            $(leftPart).append(image);

            var rightPart = document.createElement("div");
            $(rightPart).attr("class", "col-xs-9");

            var gameLink = document.createElement("h4");
            $(gameLink).html("<a class='theme-color' href='game.html?title=" + game.title + "'>" + game.title + "</a>");

            var gameGenre = document.createElement("h6");
            $(gameGenre).html(game.genre);

            $(rightPart).append(gameLink);
            $(rightPart).append(gameGenre);
            $(rightPart).append("<h6>" + game.mode + "</h6>");
            $(rightPart).append("<h6>" + game.publisher + "</h6>");
            var publishers = "";
            for (var i = 0; i < game.platforms.length; i++) publishers += game.platforms[i] + ", ";
            publishers = publishers.slice(0, -2);
            $(rightPart).append("<h6>" + publishers + "</h6>");

            $(well).html(leftPart);
            $(well).append(rightPart);

            $(positioner).append(well);

            return positioner;
        }

        return {
            init: publicInit
        }
    })();

    $(document).ready(documentInit);
})();
(function () {
    'use strict';

    var htmlSep = "<div class='col-xs-12 thin-separator-meta'></div>";

    function documentInit() {
        $("#header-div").load("header.html", function () {
            headerBar.init();
        });

        getMostFriendsUser();
        getMostGamesUser();
        getBestRatedGame();
        getBestRatedDev();
    }

    function getMostFriendsUser() {
        $.ajax({
            type: "GET",
            url: "Service.svc/GetMostFriendsUser",
            data: null,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            processData: true,
            success: function (receivedData) {
                onGetMostFriendsUserSuccess(receivedData);
            },
            error: function (result) {
                console.log("Error performing ajax " + result);
            }
        });
    }

    function onGetMostFriendsUserSuccess(receivedData) {
        if (receivedData !== "none")
        {
            var item = JSON.parse(receivedData);

            var div = document.createElement("div");
            $(div).attr("class", "col-xs-12");

            var h3 = document.createElement("h3");
            $(h3).html("Our most social user is <a href='user.html?username=" + item.user.username + "'>" + item.user.firstName + " " + item.user.lastName
                + "</a> with a staggering amount of " + item.count + " friends!");

            $(div).append(h3);

            $("#trivia-div").append(div);
            $("#trivia-div").append(htmlSep);
        }
        
    }

    function getMostGamesUser() {
        $.ajax({
            type: "GET",
            url: "Service.svc/GetMostGamesUser",
            data: null,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            processData: true,
            success: function (receivedData) {
                onGetMostGamesUser(receivedData);
            },
            error: function (result) {
                console.log("Error performing ajax " + result);
            }
        });
    }

    function onGetMostGamesUser(receivedData) {
        if (receivedData !== "none") {
            var item = JSON.parse(receivedData);

            var div = document.createElement("div");
            $(div).attr("class", "col-xs-12");

            var h3 = document.createElement("h3");
            $(h3).html("Our most hardcore gamer is <a href='user.html?username=" + item.user.username + "'>" + item.user.firstName + " " + item.user.lastName
                + "</a> with a formidable collection of " + item.count + " games!");

            $(div).append(h3);

            $("#trivia-div").append(div);
            $("#trivia-div").append(htmlSep);
        }

    }

    function getBestRatedGame() {
        $.ajax({
            type: "GET",
            url: "Service.svc/GetBestRatedGame",
            data: null,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            processData: true,
            success: function (receivedData) {
                onGetBestRatedGame(receivedData);
            },
            error: function (result) {
                console.log("Error performing ajax " + result);
            }
        });
    }

    function onGetBestRatedGame(receivedData) {
        if (receivedData !== "none") {
            var item = JSON.parse(receivedData);

            var div = document.createElement("div");
            $(div).attr("class", "col-xs-12");

            var h3 = document.createElement("h3");
            $(h3).html("Our best user-rated game is <a href='game.html?title=" + item.game.title + "'>" + item.game.title
                + "</a> with a rating of " + (item.totalRates / item.rates).toFixed(2) + " out of 5.00" + " (" + item.rates + " votes)");

            $(div).append(h3);

            $("#trivia-div").append(div);
            $("#trivia-div").append(htmlSep);
        }

    }

    function getBestRatedDev() {
        $.ajax({
            type: "GET",
            url: "Service.svc/GetBestDeveloper",
            data: null,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            processData: true,
            success: function (receivedData) {
                onGetBestDevSuccess(receivedData);
            },
            error: function (result) {
                console.log("Error performing ajax " + result);
            }
        });
    }

    function onGetBestDevSuccess(receivedData) {
        if (receivedData !== "none") {
            var item = JSON.parse(receivedData);

            var div = document.createElement("div");
            $(div).attr("class", "col-xs-12");

            var h3 = document.createElement("h3");
            $(h3).html("The best game developer is <a href='developer.html?name=" + item.dev.name + "'>" + item.dev.name
                + "</a> with an average rating of " + (item.totalRates / item.rates).toFixed(2) + " out of 5.00" + " across " + item.gameCount + " games");

            $(div).append(h3);

            $("#trivia-div").append(div);
            $("#trivia-div").append(htmlSep);
        }

    }

    $(document).ready(documentInit);
})();
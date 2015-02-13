(function () {
    'use strict';

    var games = [];
    var devs = [];

    var selGame = null;
    var selDev = null;

    var selGameEl = null;
    var selDevEl = null;

    var selConGame = null;
    var selConDev = null;
    var selConGameEl = null;
    var selConDevEl = null;


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

        // Some protection against intruders, uncomment later
        //if (sessionStorage.activeUser) {
        //    var activeUserString = sessionStorage.activeUser;
        //    var activeUser = JSON.parse(activeUserString);
        //    if (activeUser.status !== "Admin")
        //        window.location.replace("index.html");
        //}
        //else
        //    window.location.replace("index.html");

        $("#connect-button").click(function () {
            if (selConGame && selConDev) {
                $.ajax({
                    type: "GET",
                    url: "Service.svc/ConnectGameAndDev",
                    data: { title: selConGame.title, name: selConDev.name },
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    processData: true,
                    success: function (receivedData) {
                        alert("Connected " + selConGame.title + " and " + selConDev.name);
                        initDevs();
                        initGames();
                    },
                    error: function (result) {
                        console.log("Error performing POST ajax " + result);
                    }
                });
            }
        });

        $("#disconnect-button").click(function () {
            if (selConGame && selConDev) {
                $.ajax({
                    type: "GET",
                    url: "Service.svc/DisconnectGameAndDev",
                    data: { title: selConGame.title, name: selConDev.name },
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    processData: true,
                    success: function (receivedData) {
                        alert("Disconnected " + selConGame.title + " and " + selConDev.name);
                        initDevs();
                        initGames();
                    },
                    error: function (result) {
                        console.log("Error performing POST ajax " + result);
                    }
                });
            }
        });

        enableTabs();

        initGames();
        initDevs();

        // Removes last element from string
        //x.slice(0, -1);

        $("#add-game-alert").hide();
        $("#add-developer-alert").hide();
        $("#edit-game-alert").hide();
        $("#edit-developer-alert").hide();


        //FOR GAMES//////////////////////////////////////////////////////////////////////////////////
        //Adding game
        $("#add-game-modal-button").click(function () {
            validateAddGameInput();
        })

        //Editing game
        $("#edit-game-button").click(function () {
            if (selGame === null) {
                alert("First select a game");
                $("#edit-game-button").attr("href", "");
                return;
            }
            else {
                $("#edit-game-button").attr("href", "#edit-game-modal");
                fillEditGame();
            }
        });

        $("#edit-game-modal-button").click(function () {
            validateEditGameInput();
        });

        //Removing game
        $("#remove-game-button").click(function () {
            if (selGame === null) {
                alert("First select a game");
            }
            else {
                removeGame(selGame);
            }
        });

        //FOR DEVELOPERS/////////////////////////////////////////////////////////////////////////////
        //Adding developer
        $("#add-developer-modal-button").click(function () {
            validateAddDeveloperInput();
        })

        //Editing game
        $("#edit-devs-button").click(function () {
            if (selDev === null) {
                alert("First select a developer");
                $("#edit-devs-button").attr("href", "");
                return;
            }
            else {
                $("#edit-devs-button").attr("href", "#edit-developer-modal");
                fillEditDeveloper();
            }
        });

        $("#edit-developer-modal-button").click(function () {
            validateEditDeveloperInput();
        });

        //Removing developer
        $("#remove-devs-button").click(function () {
            if (selDev === null) {
                alert("First select a developer");
            }
            else {
                removeDeveloper(selDev);
            }
        });
    }

    function initGames() {
        $.ajax({
            type: "GET",
            url: "Service.svc/GetAllGames",
            data: null,
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
        var $gameList = $("#game-list");
        var $gameConList = $("#game-con-list");
        $gameList.empty();
        $gameConList.empty();
        games = [];
        selGame = null;
        selGameEl = null;
        selConGame = null;
        selConGameEl = null;

        for (var i = 0; i < receivedData.length; i++) {
            try {
                var item = JSON.parse(receivedData[i]);
            }
            catch (exception) {
                console.log("error parsing json");
                continue;
            }

            games.push(item);

            var listElement = document.createElement("a");
            $(listElement).attr("class", "list-group-item");
            $(listElement).attr("value", i);
            $(listElement).html(item.title);
            $(listElement).click(function () {
                var ind = parseInt($(this).attr("value"));

                if (selGameEl)
                    selGameEl.removeClass("active");

                selGameEl = $(this);
                selGameEl.addClass("active");
                selGame = games[ind];
                fillEditGame();

                console.log(selGame);
            });

            $gameList.append(listElement);

            // for connecting
            var leftListElement = document.createElement("a");
            $(leftListElement).attr("class", "list-group-item");
            $(leftListElement).attr("value", i);
            $(leftListElement).html(item.title);
            $(leftListElement).click(function () {
                var ind = parseInt($(this).attr("value"));

                if (selConGameEl)
                    selConGameEl.removeClass("active");

                selConGameEl = $(this);
                selConGameEl.addClass("active");
                selConGame = games[ind];

                console.log(selConGame);
            });

            $gameConList.append(leftListElement);
        }
    }

    function initDevs() {
        $.ajax({
            type: "GET",
            url: "Service.svc/GetAllDevelopers",
            data: null,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            processData: true,
            success: function (receivedData) {
                onDevsSuccess(receivedData);
            },
            error: function (result) {
                console.log("Error performing ajax " + result);
            }
        });
    }

    function onDevsSuccess(receivedData) {
        var $devList = $("#dev-list");
        var $devConList = $("#dev-con-list");
        $devList.empty();
        $devConList.empty();
        devs = [];
        selDev = null;
        selDevEl = null;
        selConDev = null;
        selConDevEl = null;

        for (var i = 0; i < receivedData.length; i++) {
            try {
                var item = JSON.parse(receivedData[i]);
            }
            catch (exception) {
                console.log("error parsing json");
                continue;
            }

            devs.push(item);

            var listElement = document.createElement("a");
            $(listElement).attr("class", "list-group-item");
            $(listElement).attr("value", i);
            $(listElement).html(item.name);
            $(listElement).click(function () {
                var ind = parseInt($(this).attr("value"));

                if (selDevEl)
                    selDevEl.removeClass("active");

                selDevEl = $(this);
                selDevEl.addClass("active");
                selDev = devs[ind];
                fillEditDeveloper();

                console.log(selDev);
            });

            $devList.append(listElement);

            // for connecting
            var rightListElement = document.createElement("a");
            $(rightListElement).attr("class", "list-group-item");
            $(rightListElement).attr("value", i);
            $(rightListElement).html(item.name);
            $(rightListElement).click(function () {
                var ind = parseInt($(this).attr("value"));

                if (selConDevEl)
                    selConDevEl.removeClass("active");

                selConDevEl = $(this);
                selConDevEl.addClass("active");
                selConDev = devs[ind];

                console.log(selConDev);
            });

            $devConList.append(rightListElement);
        }
    }

    function fillEditGame() {
        if (selGame) {
            $(editTitleInput).val(selGame.title);
            $(editDescriptionInput).val(selGame.description);
            $(editGenreInput).val(selGame.genre);
            $(editModeInput).val(selGame.mode);
            $(editPublisherInput).val(selGame.publisher);
            $(editPlatformsInput).val(stringArrayToString(selGame.platforms));
            $(editThumbnailInput).val(selGame.thumbnail);
            $(editImagesInput).val(stringArrayToString(selGame.images));

            var releaseDate = model.createDate(selGame, "releaseDate");
            $(editGameYearInput).val(releaseDate.getFullYear());
            $(editGameMonthInput).val(releaseDate.getMonth() + 1);
            $(editGameDayInput).val(releaseDate.getDate());
        }
    }

    function fillEditDeveloper() {
        if (selDev) {
            $(editNameInput).val(selDev.name);
            $(editDeveloperLocationInput).val(selDev.location);
            $(editOwnerInput).val(selDev.owner);
            $(editWebsiteInput).val(selDev.website);
            $(editDeveloperLogoInput).val(selDev.logo);
        }
    }

    //Validating functions and variables and helping functions
    function validateAlphanumeric(string) {
        if (/^[a-z0-9]+$/i.test(string)) {
            return false;
        }
        return true;
    }

    function validateLetters(string) {
        if (/^[A-Za-z]+$/.test(string)) {
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
    }

    function createDate(object, dateProp) {
        return new Date(parseInt(object[dateProp]));
    }

    function stringArrayToString(stringArray) {
        var retVal = "";
        for (var i = 0; i < stringArray.length; i++) {
            retVal += stringArray[i] + ", ";
        }
        retVal = retVal.slice(0, -2);
        return retVal;
    }

    //FOR GAMES//////////////////////////////////////////////////////////////////////////////////////

    //ADDING GAME

    //Validating new game input
    function validateAddGameInput() {
        var errorMessage = "";

        var newGameData = {};

        newGameData.title = $("#titleInput").val();
        newGameData.description = $("#descriptionInput").val();
        newGameData.genre = $("#genreInput").val();
        newGameData.mode = $("#modeInput").val();
        newGameData.publisher = $("#publisherInput").val();
        newGameData.platforms = $("#platformsInput").val().split(",");
        newGameData.thumbnail = $("#thumbnailInput").val();
        newGameData.images = $("#imagesInput").val().split(",");

        if (newGameData.title.length > 30 || newGameData.title.length < 8)
            errorMessage += "\n - Title must be 8-30 characters long";
        if (newGameData.description.length < 50)
            errorMessage += "\n - Description must be at least 50 characters long";

        var year = parseInt($("#gameYearInput").val());
        var month = parseInt($("#gameMonthInput").val());
        var day = parseInt($("#gameDayInput").val());
        var date = new Date();
        date.setHours(0, 0, 0, 0);
        dateValidator.init();

        if (isNaN(year) || year < 0)
            errorMessage += "\n - Year should be a positive number";
        if (isNaN(month) || month < 1 || month > 12)
            errorMessage += "\n - Invalid value for month";
        else if (isNaN(day) || day < 1 || day > dateValidator.monthDays[month - 1])
            errorMessage += "\n - Invalid value for day";

        if (errorMessage === "") {
            console.log("Success!");
            date.setFullYear(year, month - 1, day);
            newGameData.releaseDate = date.getTime();

            requestAddGame(newGameData);
        }
        else {
            alert("Add new game form contains the following errors: " + errorMessage);
        }
    }

    //Adding new game as object
    function requestAddGame(newGameData) {
        $.ajax({
            type: "POST",
            url: "Service.svc/AddNewGame",
            data: JSON.stringify(newGameData),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            processData: true,
            success: function (receivedData) {
                onAddGameSuccess(receivedData);
                initGames();
            },
            error: function (result) {
                console.log("Error performing POST ajax " + result);
            }
        });
    }

    //When the game is aded
    function onAddGameSuccess(receivedData) {
        if (receivedData === "failed")
            alert("Add new game form contains the following errors: \n - Game with that title already exists");
        else {
            clearAddGameModal();
            $("#add-game-modal").modal('hide');
            alert("Game added");
        }
    }

    //EDITING GAME

    //Validating edited game input
    function validateEditGameInput() {
        var errorMessage = "";

        var gameData = {};

        gameData.title = $("#editTitleInput").val();
        gameData.description = $("#editDescriptionInput").val();
        gameData.genre = $("#editGenreInput").val();
        gameData.mode = $("#editModeInput").val();
        gameData.publisher = $("#editPublisherInput").val();
        gameData.platforms = $("#editPlatformsInput").val().split(",");
        gameData.thumbnail = $("#editThumbnailInput").val();
        gameData.images = $("#editImagesInput").val().split(",");

        if (gameData.description.length < 50)
            errorMessage += "\n - Description must be at least 50 characters long";

        var year = parseInt($("#editGameYearInput").val());
        var month = parseInt($("#editGameMonthInput").val());
        var day = parseInt($("#editGameDayInput").val());
        var date = new Date();
        date.setHours(0, 0, 0, 0);
        dateValidator.init();

        if (isNaN(year) || year < 0)
            errorMessage += "\n - Year should be a positive number";
        if (isNaN(month) || month < 1 || month > 12)
            errorMessage += "\n - Invalid value for month";
        else if (isNaN(day) || day < 1 || day > this.dateValidator.monthDays[month - 1])
            errorMessage += "\n - Invalid value for day";

        if (errorMessage === "") {
            console.log("Success!");
            date.setFullYear(year, month - 1, day);
            gameData.releaseDate = date.getTime();

            requestEditGame(gameData);
        }
        else {
            alert("Edit game form contains the following errors: " + errorMessage);
        }
    }

    function requestEditGame(gameData) {
        $.ajax({
            type: "POST",
            url: "Service.svc/EditGame",
            data: JSON.stringify(gameData),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            processData: true,
            success: function (receivedData) {
                //alert("Edited game");
                onEditGameSuccess(receivedData);
                
            },
            error: function (result) {
                console.log("Error performing POST ajax " + result);
            }
        });
    }

    function requestEditDeveloper(developerData) {
        $.ajax({
            type: "POST",
            url: "Service.svc/EditDeveloper",
            data: JSON.stringify(developerData),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            processData: true,
            success: function (receivedData) {
                onEditDeveloperSuccess(receivedData);
            },
            error: function (result) {
                console.log("Error performing POST ajax " + result);
            }
        });
    }

    function onEditGameSuccess(receivedData) {
        $("#edit-game-modal").modal('hide');
        alert("Game edited");
        initGames();
    }

    //REMOVING GAME

    function removeGame(gameData) {
        $.ajax({
            type: "GET",
            url: "Service.svc/RemoveGame",
            data: { title: selGame.title },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            processData: true,
            success: function (receivedData) {
                alert("Game removed");
                initGames();
            },
            error: function (result) {
                console.log("Error performing POST ajax " + result);
            }
        });
    }

    function clearAddGameModal() {
        $(titleInput).val("");
        $(descriptionInput).val("");
        $(genreInput).val("");
        $(modeInput).val("");
        $(publisherInput).val("");
        $(platformsInput).val("");
        $(thumbnailInput).val("");
        $(imagesInput).val("");

        $(gameYearInput).val("");
        $(gameMonthInput).val("");
        $(gameDayInput).val("");
    }

    function clearAddDeveloperModal() {
        $(nameInput).val("");
        $(developerLocationInput).val("");
        $(ownerInput).val("");
        $(websiteInput).val("");
        $(developerLogoInput).val("");
    }

    //FOR DEVELOPERS/////////////////////////////////////////////////////////////////////////////////

    //ADDING DEVELOPER

    //Validating new game input
    function validateAddDeveloperInput() {
        var errorMessage = "";

        var newDeveloperData = {};

        newDeveloperData.name = $("#nameInput").val();
        newDeveloperData.location = $("#developerLocationInput").val();
        newDeveloperData.owner = $("#ownerInput").val();
        newDeveloperData.website = $("#websiteInput").val();
        newDeveloperData.logo = $("#developerLogoInput").val();

        if (newDeveloperData.name.length > 25 || newDeveloperData.name.length < 8)
            errorMessage += "\n - Name must be 8-25 characters long";

        if (errorMessage === "") {
            console.log("Success!");

            requestAddDeveloper(newDeveloperData);
        }
        else {
            alert("Add new developer form contains the following errors: " + errorMessage);
        }
    }

    //Adding new developer as object
    function requestAddDeveloper(newDeveloperData) {
        $.ajax({
            type: "POST",
            url: "Service.svc/AddNewDeveloper",
            data: JSON.stringify(newDeveloperData),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            processData: true,
            success: function (receivedData) {
                onAddDeveloperSuccess(receivedData);
                initDevs();
            },
            error: function (result) {
                console.log("Error performing POST ajax " + result);
            }
        });
    }

    //When the developer is aded
    function onAddDeveloperSuccess(receivedData) {
        if (receivedData === "failed")
            alert("Add new game form contains the following errors: \n - Game with that title already exists");
        else {
            clearAddDeveloperModal();
            $("#add-developer-modal").modal('hide');
            alert("Developer added");
        }
    }

    //EDITING DEVELOPER

    function validateEditDeveloperInput () {
        var errorMessage = "";

        var developerData = {};

        developerData.name = $("#editNameInput").val();
        developerData.location = $("#editDeveloperLocationInput").val();
        developerData.owner = $("#editOwnerInput").val();
        developerData.website = $("#editWebsiteInput").val();
        developerData.logo = $("#editDeveloperLogoInput").val();

        if (errorMessage === "") {
            console.log("Success!");

            requestEditDeveloper(developerData);
        }
        else {
            alert("Edit developer form contains the following errors: " + errorMessage);
        }
    }

    function requestEditDeveloper(developerData) {
        $.ajax({
            type: "POST",
            url: "Service.svc/EditDeveloper",
            data: JSON.stringify(developerData),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            processData: true,
            success: function (receivedData) {
                onEditDeveloperSuccess(receivedData);
            },
            error: function (result) {
                console.log("Error performing POST ajax " + result);
            }
        });
    }

    function onEditDeveloperSuccess(receivedData) {
        $("#edit-developer-modal").modal('hide');
        alert("Developer edited");
                
        initDevs();
    }

    //REMOVING DEVELOPER

    function removeDeveloper(developerData) {
        $.ajax({
            type: "GET",
            url: "Service.svc/RemoveDeveloper",
            data: { name: selDev.name },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            processData: true,
            success: function (receivedData) {
                alert("Developer removed");
                initDevs();
            },
            error: function (result) {
                console.log("Error performing POST ajax " + result);
            }
        });
    }


    $(document).ready(documentInit);
})();
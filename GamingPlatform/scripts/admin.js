(function () {
    'use strict';

    var games = [];
    var devs = [];

    var selGame = null;
    var selDev = null;

    var selGameEl = null;
    var selDevEl = null;


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

        enableTabs();

        initGames();
        initDevs();

        // Removes last element from string
        //x.slice(0, -1);

        $("#add-game-alert").hide();
        $("#add-developer-alert").hide();
        $("#edit-game-alert").hide();
        $("#edit-developer-alert").hide();

        $("#remove-game-button").click(function () {
            // remove selected game
        });

        $("#remove-devs-button").click(function () {
            // remove selected developer
        });

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
                initEditGameModal(selGame);
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
                initEditDeveloperModal(selGame);
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
        $gameList.empty();
        games = [];
        selGame = null;
        selGameEl = null;

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
        $devList.empty();
        devs = [];
        selDev = null;
        selDevEl = null;

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
        }
    }

    function fillEditGame() {
        if (selGame) {
            $(editTitleInput).val(selGame.title);
            $(editDescriptionInput).val(selGame.description);
            $(editGenreInput).val(selGame.genre);
        }
    }

    function fillEditDeveloper() {
        if (selGame) {
            $(editTitleInput).val(selGame.title);
            $(editDescriptionInput).val(selGame.description);
            $(editGenreInput).val(selGame.genre);
        }
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////
    //MY PART////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////

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

        if (validateAlphanumeric(newGameData.title))
            errorMessage += "\n - Title must contain alphanumeric characters only";
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
            $("#add-game-alert").show('fast');
                
            setTimeout(function () {
                $('#add-game-alert').modal('hide');
            }, 500);
            setTimeout(function () {
                //location.reload(true);
                //window.location.replace("index.html");
            }, 1000);
        }
    }

    //EDITING GAME

    //Filling the modal
    function initEditGameModal(gameData) {
        //TO DO
    }

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

        if (validateAlphanumeric(gameData.title))
            errorMessage += "\n - Title must contain alphanumeric characters only";
        if (gameData.title.length > 30 || gameData.title.length < 8)
            errorMessage += "\n - Title must be 8-30 characters long";
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
                onEditGameSuccess(receivedData);
            },
            error: function (result) {
                console.log("Error performing POST ajax " + result);
            }
        });
    }

    function onEditGameSuccess(receivedData) {
        $("#edit-game-alert").show('fast');

        setTimeout(function () {
            $('#edit-game-alert').modal('hide');
        }, 500);
        setTimeout(function () {
            //location.reload(true);
            //window.location.replace("index.html");
        }, 1000);
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

        if (validateAlphanumeric(newDeveloperData.name))
            errorMessage += "\n - Name must contain alphanumeric characters only";
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
            $("#add-developer-alert").show('fast');

            setTimeout(function () {
                $('#add-developer-alert').modal('hide');
            }, 500);
            setTimeout(function () {
                //location.reload(true);
                //window.location.replace("index.html");
            }, 1000);
        }
    }

    //EDITING DEVELOPER

    //Filling the modal
    function initEditDeveloperModal() {
        //TODO
    }

    function validateEditDeveloperInput () {
        var errorMessage = "";

        var developerData = {};

        developerData.name = $("#editNameInput").val();
        developerData.location = $("#editDeveloperLocationInput").val();
        developerData.owner = $("#editOwnerInput").val();
        developerData.website = $("#editWebsiteInput").val();
        developerData.logo = $("#editDeveloperLogoInput").val();

        if (validateAlphanumeric(developerData.name))
            errorMessage += "\n - Name must contain alphanumeric characters only";
        if (developerData.name.length > 25 || developerData.name.length < 8)
            errorMessage += "\n - Name must be 8-25 characters long";

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
        $("#edit-developer-alert").show('fast');

        setTimeout(function () {
            $('#edit-developer-alert').modal('hide');
        }, 500);
        setTimeout(function () {
            //location.reload(true);
            //window.location.replace("index.html");
        }, 1000);
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

    /////////////////////////////////////////////////////////////////////////////////////////////////
    //MY PART END////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////

    $(document).ready(documentInit);
})();
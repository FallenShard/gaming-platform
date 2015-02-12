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
                $("#developer-website").html(developerData.website);

                $("#developer-logo").attr("src", developerData.logo);
            },
        };

        return {
            init: publicInit
        }
    }());

    $(document).ready(documentInit);
})();
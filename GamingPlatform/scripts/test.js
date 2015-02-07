
(function () {
    'use strict';
    //var userLoggedIn = "Guest";

    var documentInit = function () {

        // $("#rateYo").rateYo({
        //    rating: 3.6
        //});

        $.ajax({
            type: "GET",
            url: "Service.svc/GetUserSessionToken",
            data: { username: "admin", password: "admin" },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            processData: true,
            success: function (receivedData) {
                console.log("Received: " + receivedData);
            },
            error: function (result) {
                console.log("Error performing ajax " + result);
            }
        });

        var x = getQueryVariable("id");
        if (x)
            alert(x);

        console.log(sessionStorage.userName);

        if (sessionStorage.userName) {
            $("#log-in-title").html("Logged in as " + sessionStorage.userName + " from session");

            $("#log-in-style").attr("style", "color: #FF0000");
        }
        else {
            sessionStorage.userName = "Bob";
            $("#log-in-title").html("Logged in as Bob fresh");

            $("#log-in-style").attr("style", "color: #FF0000");
        }

        $("#redirect-button").click(function () {
            window.location.href = "index.html?id=333";

        });
    };

    function getQueryVariable(variable) {
        var query = window.location.search.substring(1),
            vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] === variable) { return pair[1]; }
        }
        return (false);
        
    }

    $(document).ready(documentInit);
})();
"use strict";
(function () {

    var userLoggedIn = "Guest";

    var documentInit = function () {

       // $("#rateYo").rateYo({
        //    rating: 3.6
        //});


        var x = getQueryVariable("id");
        if (x)
            alert(x);

        console.log(sessionStorage.userName);

        if (sessionStorage.userName)
        {
            $("#log-in-title").html("Logged in as " + sessionStorage.userName + " from session");

            $("#log-in-style").attr("style", "color: #FF0000");
        }
        else
        {
            sessionStorage.userName = "Bob";
            $("#log-in-title").html("Logged in as Bob fresh");

            $("#log-in-style").attr("style", "color: #FF0000");
        }

        $("#redirect-button").click(function () {
            window.location.href = "index.html?id=333";
            
        });
    }

    function getQueryVariable(variable) {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == variable) { return pair[1]; }
        }
        return (false);
    }

    $(document).ready(documentInit);
})();
(function () {
    'use strict';

    function loadContent() {
        headerBar.init();

        console.log("Loading content!");

        if (headerBar.isLoggedIn())
            console.log("User is logged in!");
        else
            console.log("User is not logged in!");
    }




    $(document).ready(function () {
        $("#header-div").load("header.html", loadContent);
    });
})();
(function () {

    var currLabel = null;
    var activeUser = null;
    var currFilter = null;
    var resultCount = 0;

    function getUrlVariable(variable) {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == variable) { return pair[1]; }
        }
        return (false);
    }

    function documentInit() {
        $("#header-div").load("header.html", function () {
            headerBar.init();
        });

        currLabel = getUrlVariable("label");
        loadActiveUser();

        pagination.init();

        $("#search-button").click(function () {
            var input = $("#search-input").val();
            currFilter = input.trim();

            requestNodes();
        });

        $("#search-input").keyup(function (event) {
            if (event.keyCode == 13) {
                $("#search-button").click();
            }
        });

        requestNodes();
    }

    function loadActiveUser() {
        if (sessionStorage.activeUser) {
            var activeUserString = sessionStorage.activeUser;
            activeUser = JSON.parse(activeUserString);
        }
    }

    function requestNodes() {
        $.ajax({
            type: "GET",
            url: "Service.svc/Get" + currLabel + "sPagin",
            data: { filter: currFilter, page: pagination.getCurrentPage() },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            processData: true,
            success: function (receivedData) {
                onNodesSuccess(receivedData);
            },
            error: function (result) {
                console.log("Error performing ajax " + result);
            }
        });
    }

    function onNodesSuccess(receivedData) {
        var $content = $("#item-content-div");
        $content.empty();

        var tempLength = parseInt(receivedData.pop());
        if (resultCount !== tempLength)
        {
            resultCount = tempLength;
            pagination.setDataCount(resultCount);
        }

        for (var i = 0; i < receivedData.length; i++) {
            try {
                var item = JSON.parse(receivedData[i]);
            }
            catch (exception) {
                console.log("Error parsing JSON!");
                continue;
            }

            var userView = createViewFactory(currLabel, item);

            $content.append(userView);
        }
    }

    function createViewFactory(label, item) {
        if (label === "User") {
            return buildUserView(item);
        }
        else if (label === "Developer") {
            return buildDeveloperView(item);
        }
        else if (label === "Game") {
            return buildGameView(item);
        }
    }

    function buildUserView(user) {
        var rowContainer = document.createElement("div");
        $(rowContainer).attr("value", user.username);
        $(rowContainer).attr("class", "row");

        var positioner = document.createElement("div");
        $(positioner).attr("class", "col-xs-offset-1 col-xs-8 col-xs-offset-3");

        var well = document.createElement("div");
        $(well).attr("class", "row well custom-well");

        var leftPart = document.createElement("div");
        $(leftPart).attr("class", "col-xs-3");

        var image = document.createElement("img");
        $(image).attr("src", "img/avatars/" + user.avatarImage);
        $(image).attr("class", "img-responsive");
        $(image).attr("alt", "Profile picture");
        $(image).error(function () {
            $(this).attr('src', "http://placehold.it/300x300");
        });

        $(leftPart).append(image);

        var rightPart = document.createElement("div");
        $(rightPart).attr("class", "col-xs-9");
        
        var userLink = document.createElement("h4");
        $(userLink).html("<a class='theme-color' href='user.html?username=" + user.username + "'>" + user.firstName + " \"" + user.username + "\" " + user.lastName + "</a>");

        var userStatus = document.createElement("h6");
        $(userStatus).html(user.status);
        if (user.status === "Admin")
            $(userStatus).addClass("admin-color");

        $(rightPart).append(userLink);
        $(rightPart).append(userStatus);

        $(well).html(leftPart);
        $(well).append(rightPart);

        $(positioner).append(well);
        $(rowContainer).append(positioner);

        return rowContainer;
    }

    function buildGameView(game) {
        var rowContainer = document.createElement("div");
        $(rowContainer).attr("value", game.title);
        $(rowContainer).attr("class", "row");

        var positioner = document.createElement("div");
        $(positioner).attr("class", "col-xs-offset-1 col-xs-8 col-xs-offset-3");

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

        var userLink = document.createElement("h4");
        $(userLink).html("<a class='theme-color' href='game.html?title=" + game.title + "'>" + game.title + "</a>");

        var gameGenre = document.createElement("h6");
        $(gameGenre).html(game.genre);

        $(rightPart).append(userLink);
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
        $(rowContainer).append(positioner);

        return rowContainer;
    }

    var pagination = (function () {

        // This is public API that will be exposed from pagination
        function publicInit() {
            view.init();
            controller.init();
        }

        function publicSetDataCount(count) {
            controller.setDataCount(count);
        }

        function publicGetCurrentPage() {
            return model.currentPage;
        }

        var model = {
            itemsPerPage: 8,
            dataCount: 0,
            totalPages: 0,
            currentPage: 1,

            setDataCount: function (count) {
                this.dataCount = count;
                this.totalPages = Math.ceil(this.dataCount / this.itemsPerPage);
                this.currentPage = 1;
            }
        };

        var controller = {
            init: function () {
                // Pages
                for (var i = 0; i < 3; i++) {
                    view.$pages[i].click(function (target) {
                        return function () {
                            controller.onPageClicked(target);
                        };
                    }(view.$pages[i]));
                }

                view.$prevArrow.click(this.onPrevClicked);
                view.$nextArrow.click(this.onNextClicked);
            },

            setDataCount: function (dataCount) {
                model.setDataCount(dataCount);
                view.activePageIndex = 0;

                this.reset();
                this.updateHeader();
            },

            updateHeader: function () {
                

                if (model.dataCount === 0) {
                    view.$dataCounterHeader.empty().append("No items match the selected filters.");
                    view.$pageCounterHeader.empty().append("No pages to display.");
                }
                else {
                    view.$pageCounterHeader.empty().append("Current page: " + model.currentPage + " of " + model.totalPages);
                    view.$dataCounterHeader.empty().append("Displaying results: " + ((model.currentPage - 1) * model.itemsPerPage + 1) +
                    "-" + Math.min(model.currentPage * model.itemsPerPage, model.dataCount) + " of " + model.dataCount);
                }
            },

            reset: function () {
                view.reset();
                this.addConstraints();
            },

            addConstraints: function () {
                for (var i = 0; i < 3; i++) {
                    var parent = view.$pages[i].parent();
                    $(parent).removeClass("disabled");

                    if ((i + 1) > model.totalPages) {
                        $(parent).addClass("disabled");
                    }
                }
            },

            // Event handlers - can't refer with 'this' in here
            onPageClicked: function (target) {
                var parent = target.parent();
                if (parent.hasClass("disabled")) return;

                var targetId = target.attr("id");
                var targetPos = targetId[targetId.length - 1];
                var targetPage = target.text();

                model.currentPage = targetPage;
                requestNodes();

                if (targetPos == 1) {
                    var pagesToLeft = targetPage - 1;
                    if (pagesToLeft > 0) {
                        view.decrement();
                    }
                }
                else if (targetPos == 3) {
                    var pagesToRight = model.totalPages - targetPage;
                    if (pagesToRight > 0) {
                        view.increment();
                    }
                }

                for (var i = 0; i < 3; i++) {
                    var newTargetPage = view.$pages[i].text();
                    view.$pages[i].attr("style", "");
                    if (newTargetPage == model.currentPage) {
                        view.activePageIndex = i;
                        view.$pages[i].attr("style", view.pressedStyle);
                    }
                }

                controller.updateHeader();
            },

            onPrevClicked: function () {
                if (model.currentPage <= 1)
                    return;

                view.$pages[view.activePageIndex].attr("style", "");

                model.currentPage--;
                if (view.activePageIndex > 0) {
                    view.activePageIndex--;
                    view.$pages[view.activePageIndex].attr("style", view.pressedStyle);
                }
                else {
                    view.decrement();
                    view.$pages[view.activePageIndex].attr("style", view.pressedStyle);
                }

                requestNodes();
                controller.updateHeader();
            },

            onNextClicked: function () {
                if (model.currentPage >= model.totalPages)
                    return;

                view.$pages[view.activePageIndex].attr("style", "");

                model.currentPage++;
                if (view.activePageIndex < 2) {
                    view.activePageIndex++;
                    view.$pages[view.activePageIndex].attr("style", view.pressedStyle);
                }
                else {
                    view.increment();
                    view.$pages[view.activePageIndex].attr("style", view.pressedStyle);
                }

                requestNodes();
                controller.updateHeader();
            }
        };

        var view = {
            $prevArrow: null,
            $pages: [],
            $nextArrow: null,
            $dataCounterHeader: null,
            $pageCounterHeader: null,
            activePageIndex: 0,
            paginationArray: [1, 2, 3],
            pressedStyle: "background:#272B30;color:white;",

            init: function () {
                this.$dataCounterHeader = $("#data-counter");
                this.$pageCounterHeader = $("#page-counter");
                this.$prevArrow = $("#prev-page");
                this.$nextArrow = $("#next-page");

                for (var i = 1; i < 4; i++) {
                    this.$pages.push($("#page-" + i));
                }
            },

            increment: function () {
                for (var i = 0; i < 3; i++) {
                    this.paginationArray[i]++;
                    this.$pages[i].empty().append(view.paginationArray[i]);
                }
            },

            decrement: function () {
                for (var i = 0; i < 3; i++) {
                    this.paginationArray[i]--;
                    this.$pages[i].empty().append(view.paginationArray[i]);
                }
            },

            reset: function () {
                for (var i = 0; i < 3; i++) {
                    this.paginationArray[i] = i + 1;
                    this.$pages[i].empty().append(this.paginationArray[i]);
                    this.$pages[i].attr("style", "");
                }

                this.$pages[0].attr("style", this.pressedStyle);
            }
        };

        return {
            init: publicInit,
            setDataCount: publicSetDataCount,
            getCurrentPage: publicGetCurrentPage
        };
    })();

    $(document).ready(documentInit);
})();
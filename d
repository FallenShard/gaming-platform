[33mcommit 6c636e345946ab91162c53294db007dc0953001c[m
Author: FallenShard <nemanjabartolovic@yahoo.com>
Date:   Sun Feb 8 00:10:43 2015 +0100

    Add login system

[1mdiff --git a/GamingPlatform/App_Code/IService.cs b/GamingPlatform/App_Code/IService.cs[m
[1mindex 2ee138c..e7821f4 100644[m
[1m--- a/GamingPlatform/App_Code/IService.cs[m
[1m+++ b/GamingPlatform/App_Code/IService.cs[m
[36m@@ -14,4 +14,14 @@[m [mpublic interface IService[m
     [WebInvoke (Method = "GET",[m
                 ResponseFormat = WebMessageFormat.Json)][m
     string GetUserSessionToken(string username, string password);[m
[32m+[m
[32m+[m[32m    [OperationContract][m
[32m+[m[32m    [WebInvoke(Method = "GET",[m
[32m+[m[32m                ResponseFormat = WebMessageFormat.Json)][m
[32m+[m[32m    string GetLoggedInUserData(string sessionId);[m
[32m+[m
[32m+[m[32m    [OperationContract][m
[32m+[m[32m    [WebInvoke(Method = "GET",[m
[32m+[m[32m                ResponseFormat = WebMessageFormat.Json)][m
[32m+[m[32m    string AddNewUser(string username, string password, string email, string firstName, string lastName, string location, string birthDate, string gender);[m
 }[m
[1mdiff --git a/GamingPlatform/App_Code/Service.cs b/GamingPlatform/App_Code/Service.cs[m
[1mindex 443208f..8752ed4 100644[m
[1m--- a/GamingPlatform/App_Code/Service.cs[m
[1m+++ b/GamingPlatform/App_Code/Service.cs[m
[36m@@ -10,6 +10,7 @@[m [musing Neo4jClient;[m
 using Neo4jClient.Cypher;[m
 using System.ServiceModel.Activation;[m
 using System.Security.Cryptography;[m
[32m+[m[32musing Newtonsoft.Json;[m
 [m
 // NOTE: You can use the "Rename" command on the "Refactor" menu to change the class name "Service" in code, svc and config file together.[m
 [AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Allowed)][m
[36m@@ -22,27 +23,92 @@[m [mpublic class Service : IService[m
         GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));[m
         client.Connect();[m
 [m
[31m-        var results = client.Cypher.[m
[31m-            Match("(user:User)").[m
[31m-            Where((User user) => user.username == username).[m
[31m-            AndWhere((User user) => user.password == password).[m
[31m-            Return(user => user.As<User>()).Results;[m
[32m+[m[32m        var results = client.Cypher[m
[32m+[m[32m            .Match("(user:User)")[m
[32m+[m[32m            .Where((User user) => user.username == username)[m
[32m+[m[32m            .AndWhere((User user) => user.password == password)[m
[32m+[m[32m            .Return(user => user.As<User>()).Results;[m
 [m
         if (results.Count() > 0)[m
         {[m
             User result = results.First();[m
[31m-            token = result.username + result.password;[m
[32m+[m[32m            token = CreateSHAHash(result.username + result.password);[m
[32m+[m[32m            client.Cypher[m
[32m+[m[32m                .Match("(user:User)")[m
[32m+[m[32m                .Where((User user) => user.username == username)[m
[32m+[m[32m                .AndWhere((User user) => user.password == password)[m
[32m+[m[32m                .Set("user.sessionId = {sessionId}")[m
[32m+[m[32m                .WithParam("sessionId", token)[m
[32m+[m[32m                .ExecuteWithoutResults();[m
         }[m
 [m
[31m-        return CreateSHAHash(token);[m
[32m+[m[32m        return token;[m
     }[m
 [m
[31m-    public static string CreateSHAHash(string Phrase)[m
[32m+[m[32m    public string GetLoggedInUserData(string sessionId)[m
[32m+[m[32m    {[m
[32m+[m[32m        string data = "guest";[m
[32m+[m
[32m+[m[32m        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));[m
[32m+[m[32m        client.Connect();[m
[32m+[m
[32m+[m[32m        var results = client.Cypher[m
[32m+[m[32m            .Match("(user:User)")[m
[32m+[m[32m            .Where((User user) => user.sessionId == sessionId)[m
[32m+[m[32m            .Return(user => user.As<User>()).Results;[m
[32m+[m
[32m+[m[32m        if (results.Count() > 0)[m
[32m+[m[32m            data = JsonConvert.SerializeObject(results.First());[m
[32m+[m
[32m+[m[32m        return data;[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    private static string CreateSHAHash(string plaintext)[m
     {[m
         SHA256Managed HashTool = new SHA256Managed();[m
[31m-        Byte[] PhraseAsByte = System.Text.Encoding.UTF8.GetBytes(string.Concat(Phrase));[m
[32m+[m[32m        Byte[] PhraseAsByte = System.Text.Encoding.UTF8.GetBytes(string.Concat(plaintext));[m
         Byte[] EncryptedBytes = HashTool.ComputeHash(PhraseAsByte);[m
         HashTool.Clear();[m
         return Convert.ToBase64String(EncryptedBytes);[m
     }[m
[32m+[m
[32m+[m[32m    public string AddNewUser(string username, string password, string email, string firstName, string lastName, string location, string birthDate, string gender)[m
[32m+[m[32m    {[m
[32m+[m[32m        string retVal = "failed";[m
[32m+[m
[32m+[m[32m        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));[m
[32m+[m[32m        client.Connect();[m
[32m+[m
[32m+[m[32m        var results = client.Cypher[m
[32m+[m[32m            .Match("(user:User)")[m
[32m+[m[32m            .Where((User user) => user.username == username)[m
[32m+[m[32m            .Return(user => user.As<User>()).Results;[m
[32m+[m
[32m+[m[32m        // There's already a user with that username[m
[32m+[m[32m        if (results.Count() > 0)[m
[32m+[m[32m            return retVal;[m
[32m+[m
[32m+[m[32m        Random rnd = new Random();[m
[32m+[m[32m        int avatarId = rnd.Next(1, 20);[m
[32m+[m
[32m+[m[32m        User newUser = new User();[m
[32m+[m[32m        newUser.username = username;[m
[32m+[m[32m        newUser.password = password;[m
[32m+[m[32m        newUser.email = email;[m
[32m+[m[32m        newUser.firstName = firstName;[m
[32m+[m[32m        newUser.lastName = lastName;[m
[32m+[m[32m        newUser.birthDate = birthDate;[m
[32m+[m[32m        newUser.location = location;[m
[32m+[m[32m        newUser.gender = gender;[m
[32m+[m[32m        newUser.avatarImage = "avatar" + avatarId + ".jpg";[m
[32m+[m[32m        newUser.status = "User";[m
[32m+[m[32m        newUser.sessionId = CreateSHAHash(newUser.username + newUser.password); ;[m
[32m+[m
[32m+[m[32m        client.Cypher[m
[32m+[m[32m            .Create("(user:User {newUser})")[m
[32m+[m[32m            .WithParam("newUser", newUser)[m
[32m+[m[32m            .ExecuteWithoutResults();[m
[32m+[m
[32m+[m[32m        return newUser.sessionId;[m
[32m+[m[32m    }[m
 }[m
[1mdiff --git a/GamingPlatform/App_Code/User.cs b/GamingPlatform/App_Code/User.cs[m
[1mindex 6cbaa31..be0e40f 100644[m
[1m--- a/GamingPlatform/App_Code/User.cs[m
[1m+++ b/GamingPlatform/App_Code/User.cs[m
[36m@@ -10,4 +10,13 @@[m [mpublic class User[m
 {[m
     public string username { get; set; }[m
     public string password { get; set; }[m
[32m+[m[32m    public string email { get; set; }[m
[32m+[m[32m    public string firstName { get; set; }[m
[32m+[m[32m    public string lastName { get; set; }[m
[32m+[m[32m    public string birthDate { get; set; }[m
[32m+[m[32m    public string location { get; set; }[m
[32m+[m[32m    public string gender { get; set; }[m
[32m+[m[32m    public string avatarImage { get; set; }[m
[32m+[m[32m    public string status { get; set; }[m
[32m+[m[32m    public string sessionId { get; set; }[m
 }[m
\ No newline at end of file[m
[1mdiff --git a/GamingPlatform/css/custom.css b/GamingPlatform/css/custom.css[m
[1mindex e8b5a9e..3315e4b 100644[m
[1m--- a/GamingPlatform/css/custom.css[m
[1m+++ b/GamingPlatform/css/custom.css[m
[36m@@ -18,7 +18,9 @@[m
     margin: 0 auto;[m
 }[m
 [m
[31m-.padding-5[m
[32m+[m[32m.thin-separator[m
 {[m
[31m-    padding: 5px;[m
[32m+[m[32m    margin: 10px auto;[m
[32m+[m[32m    height: 1px;[m
[32m+[m[32m    background-color: #FDFDFD;[m
 }[m
\ No newline at end of file[m
[1mdiff --git a/GamingPlatform/img/carousel1.png b/GamingPlatform/img/carousel1.png[m
[1mindex d20e4f6..1ca5650 100644[m
Binary files a/GamingPlatform/img/carousel1.png and b/GamingPlatform/img/carousel1.png differ
[1mdiff --git a/GamingPlatform/img/carousel2.png b/GamingPlatform/img/carousel2.png[m
[1mnew file mode 100644[m
[1mindex 0000000..3dece95[m
Binary files /dev/null and b/GamingPlatform/img/carousel2.png differ
[1mdiff --git a/GamingPlatform/index.html b/GamingPlatform/index.html[m
[1mindex d83ca2c..65bfc96 100644[m
[1m--- a/GamingPlatform/index.html[m
[1m+++ b/GamingPlatform/index.html[m
[36m@@ -13,50 +13,39 @@[m
 [m
     <script src="scripts/jquery-2.1.3.min.js"></script>[m
     <script src="scripts/bootstrap.min.js"></script>[m
[31m-    <script src="scripts/test.js"></script>[m
[32m+[m[32m    <script src="scripts/index.js"></script>[m
 </head>[m
 <body>[m
     <nav class="navbar navbar-default navbar-fixed-top">[m
         <div class="container">[m
             <div class="navbar-header">[m
[31m-                <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">[m
[31m-                    <span class="sr-only">Toggle navigation</span>[m
[31m-                    <span class="icon-bar"></span>[m
[31m-                    <span class="icon-bar"></span>[m
[31m-                    <span class="icon-bar"></span>[m
[31m-                </button>[m
                 <a class="navbar-brand logo-style" href="#">GRID</a>[m
             </div>[m
             <div id="navbar" class="navbar-collapse collapse">[m
[31m-                <form class="navbar-form navbar-right">[m
[31m-                    <div class="form-group">[m
[31m-                        <input type="text" placeholder="Email" class="form-control">[m
[31m-                    </div>[m
[31m-                    <div class="form-group">[m
[31m-                        <input type="password" placeholder="Password" class="form-control">[m
[31m-                    </div>[m
[31m-                    <button type="submit" class="btn btn-success">Sign in</button>[m
[31m-                    <button type="submit" class="btn btn-success">Sign Up</button>[m
[31m-                </form>[m
[31m-                [m
[31m-            </div><!--/.navbar-collapse -->[m
[32m+[m[32m                <div class="navbar-right" style="padding-right: 15px;">[m
[32m+[m[32m                    <button type="button" data-toggle="modal" href="#log-in-modal" class="guest-tools btn btn-primary navbar-btn">Log in</button>[m
[32m+[m[32m                    <button type="button" data-toggle="modal" href="#sign-up-modal" class="guest-tools btn btn-success navbar-btn">Sign Up</button>[m
[32m+[m[32m                    <span id="welcome-span" class="user-tools">Welcome, User</span>[m
[32m+[m[32m                    <button id="go-to-profile-button" type="button" class="user-tools btn btn-primary navbar-btn">Go to Profile</button>[m
[32m+[m[32m                    <button id="log-out-button" type="button" class="user-tools btn btn-primary navbar-btn">Log out</button>[m
[32m+[m[32m                </div>[m
[32m+[m[32m            </div>[m
         </div>[m
     </nav>[m
 [m
     <div class="container text-center well-sm">[m
         <div class="row">[m
             <div class="col-xs-4">[m
[31m-                <button type="button" class="btn btn-primary btn-block">Games</button>[m
[32m+[m[32m                <button type="button" class="btn btn-default btn-block">Games</button>[m
             </div>[m
             <div class="col-xs-4">[m
[31m-                <button type="button" class="btn btn-primary btn-block">Developers</button>[m
[32m+[m[32m                <button type="button" class="btn btn-default btn-block">Developers</button>[m
             </div>[m
             <div class="col-xs-4">[m
[31m-                <button type="button" class="btn btn-primary btn-block">Stores</button>[m
[32m+[m[32m                <button type="button" class="btn btn-default btn-block">Stores</button>[m
             </div>[m
         </div>[m
     </div>[m
[31m-    [m
 [m
     <div id="overview-carousel" class="carousel slide" data-ride="carousel">[m
         <!-- Indicators -->[m
[36m@@ -71,13 +60,13 @@[m
                 <div class="container">[m
                     <div class="carousel-caption">[m
                         <h1>Explore the games database</h1> [m
[31m-                        <p>Browse our game library and find all the latest tidbits, reviews and developer updates</p>[m
[32m+[m[32m                        <p>Browse our game library and find all the latest tidbits, reviews and developer updates.</p>[m
                         <p><a class="btn btn-lg btn-primary" href="#" role="button">Take me there!</a></p>[m
                     </div>[m
                 </div>[m
             </div>[m
             <div class="item">[m
[31m-                <img src="http://placehold.it/1903x700" alt="Second slide">[m
[32m+[m[32m                <img src="img/carousel2.png" alt="Second slide">[m
                 <div class="container">[m
                     <div class="carousel-caption">[m
                         <h1>The <span class="logo-style">GRID</span> Network</h1>[m
[36m@@ -87,7 +76,7 @@[m
                 </div>[m
             </div>[m
             <div class="item">[m
[31m-                <img src="http://placehold.it/1903x700" alt="Third slide">[m
[32m+[m[32m                <img src="http://placehold.it/1920x700" alt="Third slide">[m
                 <div class="container">[m
                     <div class="carousel-caption">[m
                         <h1>Visit us at the stores!</h1>[m
[36m@@ -107,71 +96,125 @@[m
         </a>[m
     </div><!-- /.carousel -->[m
 [m
[31m-[m
[31m-    [m
[31m-    <!-- Main jumbotron for a primary marketing message or call to action -->[m
[31m-    <div class="jumbotron">[m
[31m-        <div class="container">[m
[31m-            <h1>Hello, world!</h1>[m
[31m-            <p>This is a template for a simple marketing or informational website. It includes a large callout called a jumbotron and three supporting pieces of content. Use it as a starting point to create something more unique.</p>[m
[31m-            <p><a id="redirect-button" class="btn btn-primary btn-lg" href="#" role="button">Learn more &raquo;</a></p>[m
[31m-            <div class="rateit bigstars" data-rateit-starwidth="32" data-rateit-starheight="32" data-rateit-resetable="false">[m
[32m+[m[32m    <div class="modal fade" id="log-in-modal">[m
[32m+[m[32m        <div class="modal-dialog bs-example-modal-sm">[m
[32m+[m[32m            <div class="modal-content">[m
[32m+[m[32m                <div class="modal-header">[m
[32m+[m[32m                    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>[m
[32m+[m[32m                    <h4 class="modal-title">Log in</h4>[m
[32m+[m[32m                </div>[m
[32m+[m[32m                <div class="modal-body container-fluid">[m
[32m+[m[32m                    <form>[m
[32m+[m[32m                        <label for="inputUsername">Username</label>[m
[32m+[m[32m                        <input type="text" id="inputUsername" class="form-control" placeholder="Username" required autofocus>[m
[32m+[m[32m                        <label for="inputPassword">Password</label>[m
[32m+[m[32m                        <input type="password" id="inputPassword" class="form-control" placeholder="Password" required>[m
[32m+[m[32m                        <!--<div class="checkbox">[m
[32m+[m[32m                            <label>[m
[32m+[m[32m                                <input type="checkbox" value="remember-me"> Remember me[m
[32m+[m[32m                            </label>[m
[32m+[m[32m                        </div>-->[m
[32m+[m[32m                    </form>[m
[32m+[m[32m                    <div id="log-in-alert" class="alert alert-danger alert-dismissible" role="alert">Username and/or password are not correct.</div>[m
[32m+[m[32m                </div>[m
[32m+[m[32m                <div class="modal-footer">[m
[32m+[m[32m                    <a href="#" data-dismiss="modal" class="btn btn-default">Close</a>[m
[32m+[m[32m                    <a href="#" id="log-in-button" class="btn btn-primary">Log in</a>[m
[32m+[m[32m                </div>[m
             </div>[m
         </div>[m
     </div>[m
 [m
[31m-    <div class="container">[m
[31m-        <!-- Example row of columns -->[m
[31m-        <div class="row">[m
[31m-            <div class="col-md-4">[m
[31m-                <h2>Heading</h2>[m
[31m-                <p>Donec id elit non mi porta gravida at eget metus. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Etiam porta sem malesuada magna mollis euismod. Donec sed odio dui. </p>[m
[31m-                <p><a class="btn btn-default" href="#" role="button">View details &raquo;</a></p>[m
[31m-            </div>[m
[31m-            <div class="col-md-4">[m
[31m-                <h2>Heading</h2>[m
[31m-                <p>Donec id elit non mi porta gravida at eget metus. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Etiam porta sem malesuada magna mollis euismod. Donec sed odio dui. </p>[m
[31m-                <p><a class="btn btn-default" href="#" role="button">View details &raquo;</a></p>[m
[31m-            </div>[m
[31m-            <div class="col-md-4">[m
[31m-                <h2>Heading</h2>[m
[31m-                <p>Donec sed odio dui. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Vestibulum id ligula porta felis euismod semper. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus.</p>[m
[31m-                <p><a class="btn btn-default" href="#" role="button">View details &raquo;</a></p>[m
[31m-            </div>[m
[31m-        </div>[m
[31m-[m
[31m-        <hr>[m
[31m-[m
[31m-        <footer>[m
[31m-            <p>&copy; Company 2014</p>[m
[31m-        </footer>[m
[31m-    </div> <!-- /container -->[m
[31m-[m
[31m-    <div class="container">[m
[31m-        <div class="jumbotron">[m
[31m-            <h1>My First Bootstrap Page</h1>[m
[31m-            <p>Resize this responsive page to see the effect!</p>[m
[31m-        </div>[m
[31m-        <div class="row">[m
[31m-            <div class="col-sm-4">[m
[31m-                <h3 id="log-in-title">Click me to log in!</h3>[m
[31m-                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit...</p>[m
[31m-                <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris...</p>[m
[31m-            </div>[m
[31m-            <div class="col-sm-4">[m
[31m-                <h3 id="log-in-style">Column 2</h3>[m
[31m-                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit...</p>[m
[31m-                <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris...</p>[m
[31m-            </div>[m
[31m-            <div class="col-sm-4">[m
[31m-                <h3>Column 3</h3>[m
[31m-                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit...</p>[m
[31m-                <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris...</p>[m
[32m+[m[32m    <div id="sign-up-modal" class="modal fade">[m
[32m+[m[32m        <div class="modal-dialog">[m
[32m+[m[32m            <div class="modal-content">[m
[32m+[m[32m                <div class="modal-header">[m
[32m+[m[32m                    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>[m
[32m+[m[32m                    <h4 class="modal-title title-font">Sign Up</h4>[m
[32m+[m[32m                </div>[m
[32m+[m[32m                <div id="modal-add-body" class="modal-body container-fluid">[m
[32m+[m[32m                    <form class="form-horizontal">[m
[32m+[m[32m                        <div class="form-group">[m
[32m+[m[32m                            <label for="usernameInput" class="col-sm-2 control-label">Username</label>[m
[32m+[m[32m                            <div class="col-sm-10">[m
[32m+[m[32m                                <input type="text" class="form-control" id="usernameInput" placeholder="Unique, alphanumeric and between 8-20 characters" />[m
[32m+[m[32m                            </div>[m
[32m+[m[32m                        </div>[m
[32m+[m[32m                        <div class="form-group">[m
[32m+[m[32m                            <label for="passwordInput" class="col-sm-2 control-label">Password</label>[m
[32m+[m[32m                            <div class="col-sm-10">[m
[32m+[m[32m                                <input type="password" class="form-control" id="passwordInput" placeholder="Consists of alphanumeric and special characters" />[m
[32m+[m[32m                            </div>[m
[32m+[m[32m                        </div>[m
[32m+[m[32m                        <div class="form-group">[m
[32m+[m[32m                            <label for="repeatPassInput" class="col-sm-2 control-label">Repeat Password</label>[m
[32m+[m[32m                            <div class="col-sm-10">[m
[32m+[m[32m                                <input type="password" class="form-control" id="repeatPassInput" placeholder="Repeat password here" />[m
[32m+[m[32m                            </div>[m
[32m+[m[32m                        </div>[m
[32m+[m[32m                        <div class="thin-separator"></div>[m
[32m+[m[32m                        <div class="form-group">[m
[32m+[m[32m                            <label for="emailInput" class="col-sm-2 control-label">Email</label>[m
[32m+[m[32m                            <div class="col-sm-10">[m
[32m+[m[32m                                <input type="text" class="form-control" id="emailInput" placeholder="Your email goes here" />[m
[32m+[m[32m                            </div>[m
[32m+[m[32m                        </div>[m
[32m+[m[32m                        <div class="form-group">[m
[32m+[m[32m                            <label for="firstNameInput" class="col-sm-2 control-label">First Name</label>[m
[32m+[m[32m                            <div class="col-sm-10">[m
[32m+[m[32m                                <input type="text" class="form-control" id="firstNameInput" placeholder="Your first name" />[m
[32m+[m[32m                            </div>[m
[32m+[m[32m                        </div>[m
[32m+[m[32m                        <div class="form-group">[m
[32m+[m[32m                            <label for="lastNameInput" class="col-sm-2 control-label">Last Name</label>[m
[32m+[m[32m                            <div class="col-sm-10">[m
[32m+[m[32m                                <input type="text" class="form-control" id="lastNameInput" placeholder="Your last name" />[m
[32m+[m[32m                            </div>[m
[32m+[m[32m                        </div>[m
[32m+[m[32m                        <div class="thin-separator"></div>[m
[32m+[m[32m                        <div class="form-group">[m
[32m+[m[32m                            <label for="lastNameInput" class="col-sm-2 control-label">Birth Date</label>[m
[32m+[m[32m                            <div class="col-sm-3">[m
[32m+[m[32m                                <input type="text" class="form-control" id="yearInput" placeholder="Year" />[m
[32m+[m[32m                            </div>[m
[32m+[m[32m                            <div class="col-sm-3">[m
[32m+[m[32m                                <input type="text" class="form-control" id="monthInput" placeholder="Month" />[m
[32m+[m[32m                            </div>[m
[32m+[m[32m                            <div class="col-sm-3">[m
[32m+[m[32m                                <input type="text" class="form-control" id="dayInput" placeholder="Day" />[m
[32m+[m[32m                            </div>[m
[32m+[m[32m                        </div>[m
[32m+[m[32m                        <div id="gender-group" class="form-group">[m
[32m+[m[32m                            <label class="col-sm-2 control-label">Gender</label>[m
[32m+[m[32m                            <div class="col-sm-9">[m
[32m+[m[32m                                <label class="radio-inline">[m
[32m+[m[32m                                    <input type="radio" name="optradio" value="M">Male[m
[32m+[m[32m                                </label>[m
[32m+[m[32m                                <label class="radio-inline">[m
[32m+[m[32m                                    <input type="radio" name="optradio" value="F">Female[m
[32m+[m[32m                                </label>[m
[32m+[m[32m                                <label class="radio-inline">[m
[32m+[m[32m                                    <input type="radio" name="optradio" value="O">Other[m
[32m+[m[32m                                </label>[m
[32m+[m[32m                            </div>[m
[32m+[m[32m                        </div>[m
[32m+[m[32m                        <div class="form-group">[m
[32m+[m[32m                            <label for="locationInput" class="col-sm-2 control-label">Location</label>[m
[32m+[m[32m                            <div class="col-sm-10">[m
[32m+[m[32m                                <input type="text" class="form-control" id="locationInput" placeholder="It can be anything, even a place from fiction" />[m
[32m+[m[32m                            </div>[m
[32m+[m[32m                        </div>[m
[32m+[m[32m                    </form>[m
[32m+[m[32m                    <div id="sign-up-alert" class="alert alert-success alert-dismissible" role="alert">Registration successful! You can now log in.</div>[m
[32m+[m[32m                </div>[m
[32m+[m[32m                <div class="modal-footer">[m
[32m+[m[32m                    <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>[m
[32m+[m[32m                    <button id="sign-up-button" type="button" class="btn btn-success">Confirm</button>[m
[32m+[m[32m                </div>[m
             </div>[m
         </div>[m
     </div>[m
 [m
[31m-[m
     <script src="scripts/jquery.rateit.min.js"></script>[m
 </body>[m
 </html>[m
[1mdiff --git a/GamingPlatform/scripts/index.js b/GamingPlatform/scripts/index.js[m
[1mnew file mode 100644[m
[1mindex 0000000..89bc0ca[m
[1m--- /dev/null[m
[1m+++ b/GamingPlatform/scripts/index.js[m
[36m@@ -0,0 +1,254 @@[m
[32m+[m[32m﻿[m
[32m+[m[32m(function () {[m
[32m+[m[32m    'use strict';[m
[32m+[m[32m    var userLoggedIn = "Guest";[m
[32m+[m
[32m+[m[32m    var user = {};[m
[32m+[m
[32m+[m[32m    var documentInit = function () {[m
[32m+[m[32m        $(".user-tools").hide();[m
[32m+[m[32m        $(".guest-tools").hide();[m
[32m+[m[32m        $("#log-in-alert").hide();[m
[32m+[m[32m        $("#sign-up-alert").hide();[m
[32m+[m
[32m+[m[32m        var x = getQueryVariable("id");[m
[32m+[m[32m        if (x)[m
[32m+[m[32m            alert(x);[m
[32m+[m
[32m+[m[32m        console.log(sessionStorage.userName);[m
[32m+[m
[32m+[m[32m        if (sessionStorage.id) {[m
[32m+[m[32m            $.ajax({[m
[32m+[m[32m                type: "GET",[m
[32m+[m[32m                url: "Service.svc/GetLoggedInUserData",[m
[32m+[m[32m                data: { sessionId: sessionStorage.id },[m
[32m+[m[32m                contentType: "application/json; charset=utf-8",[m
[32m+[m[32m                dataType: "json",[m
[32m+[m[32m                processData: true,[m
[32m+[m[32m                success: function (receivedData) {[m
[32m+[m[32m                    onLoginSuccess(receivedData);[m
[32m+[m[32m                },[m
[32m+[m[32m                error: function (result) {[m
[32m+[m[32m                    console.log("Error performing ajax " + result);[m
[32m+[m[32m                }[m
[32m+[m[32m            });[m
[32m+[m[32m        }[m
[32m+[m[32m        else[m
[32m+[m[32m        {[m
[32m+[m[32m            $(".guest-tools").show('slow');[m
[32m+[m[32m        }[m
[32m+[m
[32m+[m[32m        $("#redirect-button").click(function () {[m
[32m+[m[32m            window.location.href = "index.html?id=333";[m
[32m+[m[32m        });[m
[32m+[m
[32m+[m[32m        $("#log-in-button").click(function () {[m
[32m+[m[32m            attemptLogin();[m
[32m+[m[32m        });[m
[32m+[m
[32m+[m[32m        $("#log-out-button").click(function () {[m
[32m+[m[32m            delete sessionStorage.id;[m
[32m+[m[32m            location.reload(true);[m
[32m+[m[32m        });[m
[32m+[m
[32m+[m[32m        $("#sign-up-button").click(function () {[m
[32m+[m[32m            validateSignUpInput();[m
[32m+[m[32m        });[m
[32m+[m[32m    };[m
[32m+[m
[32m+[m[32m    function attemptLogin() {[m
[32m+[m[32m        var username = $("#inputUsername").val();[m
[32m+[m[32m        var password = $("#inputPassword").val();[m
[32m+[m
[32m+[m[32m        $.ajax({[m
[32m+[m[32m            type: "GET",[m
[32m+[m[32m            url: "Service.svc/GetUserSessionToken",[m
[32m+[m[32m            data: { username: username, password: password },[m
[32m+[m[32m            contentType: "application/json; charset=utf-8",[m
[32m+[m[32m            dataType: "json",[m
[32m+[m[32m            processData: true,[m
[32m+[m[32m            success: function (receivedData) {[m
[32m+[m[32m                onLoginAttemptSuccess(receivedData);[m
[32m+[m[32m            },[m
[32m+[m[32m            error: function (result) {[m
[32m+[m[32m                console.log("Error performing ajax " + result);[m
[32m+[m[32m            }[m
[32m+[m[32m        });[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    function onLoginAttemptSuccess(receivedData) {[m
[32m+[m[32m        if (receivedData === "guest")[m
[32m+[m[32m        {[m
[32m+[m[32m            $("#log-in-alert").show('fast');[m
[32m+[m[32m        }[m
[32m+[m[32m        else {[m
[32m+[m[32m            sessionStorage.id = receivedData;[m
[32m+[m[32m            userLoggedIn = true;[m
[32m+[m
[32m+[m[32m            $("#log-in-modal").modal('hide');[m
[32m+[m
[32m+[m[32m            $.ajax({[m
[32m+[m[32m                type: "GET",[m
[32m+[m[32m                url: "Service.svc/GetLoggedInUserData",[m
[32m+[m[32m                data: { sessionId: receivedData },[m
[32m+[m[32m                contentType: "application/json; charset=utf-8",[m
[32m+[m[32m                dataType: "json",[m
[32m+[m[32m                processData: true,[m
[32m+[m[32m                success: function (receivedData) {[m
[32m+[m[32m                    onLoginSuccess(receivedData);[m
[32m+[m[32m                },[m
[32m+[m[32m                error: function (result) {[m
[32m+[m[32m                    console.log("Error performing ajax " + result);[m
[32m+[m[32m                }[m
[32m+[m[32m            });[m
[32m+[m[32m        }[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    function onLoginSuccess(receivedData) {[m
[32m+[m[32m        console.log(receivedData);[m
[32m+[m[32m        if (receivedData === "guest")[m
[32m+[m[32m        {[m
[32m+[m[32m            alert("Authentication failed. Please try again.");[m
[32m+[m[32m        }[m
[32m+[m[32m        else[m
[32m+[m[32m        {[m
[32m+[m[32m            user = JSON.parse(receivedData);[m
[32m+[m
[32m+[m[32m            setupLoggedInNavbar();[m
[32m+[m[32m        }[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    function setupLoggedInNavbar() {[m
[32m+[m[41m        [m
[32m+[m[32m        $(".guest-tools").hide();[m
[32m+[m[32m        $(".user-tools").show('slow');[m
[32m+[m[32m        $("#welcome-span").html("Welcome, " + user.username + "!");[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    function getQueryVariable(variable) {[m
[32m+[m[32m        var query = window.location.search.substring(1),[m
[32m+[m[32m            vars = query.split("&");[m
[32m+[m[32m        for (var i = 0; i < vars.length; i++) {[m
[32m+[m[32m            var pair = vars[i].split("=");[m
[32m+[m[32m            if (pair[0] === variable) { return pair[1]; }[m
[32m+[m[32m        }[m
[32m+[m[32m        return (false);[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    function validateSignUpInput() {[m
[32m+[m[32m        var errorMessage = "";[m
[32m+[m
[32m+[m[32m        var signUpData = {};[m
[32m+[m[32m        var repeatedPassword = $("#repeatPassInput").val();[m
[32m+[m[32m        signUpData.username = $("#usernameInput").val();[m
[32m+[m[32m        signUpData.password = $("#passwordInput").val();[m
[32m+[m[32m        signUpData.email = $("#emailInput").val();[m
[32m+[m[32m        signUpData.firstName = $("#firstNameInput").val();[m
[32m+[m[32m        signUpData.lastName = $("#lastNameInput").val();[m
[32m+[m[32m        signUpData.location = $("#locationInput").val();[m
[32m+[m[32m        signUpData.gender = $("#gender-group input:radio:checked").val();[m
[32m+[m
[32m+[m[32m        if (!validateAlphanumeric(signUpData.username))[m
[32m+[m[32m            errorMessage += "\n - Username must contain alphanumeric characters only";[m
[32m+[m[32m        if (signUpData.username.length > 20 || signUpData.username.length < 8)[m
[32m+[m[32m            errorMessage += "\n - Username must be 8-20 characters long";[m
[32m+[m[32m        if (signUpData.password.length < 3)[m
[32m+[m[32m            errorMessage += "\n - Password must be at least 3 characters long";[m
[32m+[m[32m        if (hasWhiteSpace(signUpData.password))[m
[32m+[m[32m            errorMessage += "\n - White space is not allowed in passwords";[m
[32m+[m[32m        if (repeatedPassword !== signUpData.password)[m
[32m+[m[32m            errorMessage += "\n - Passwords do not match";[m
[32m+[m
[32m+[m[32m        var year = parseInt($("#yearInput").val());[m
[32m+[m[32m        var month = parseInt($("#monthInput").val());[m
[32m+[m[32m        var day = parseInt($("#dayInput").val());[m
[32m+[m[32m        var date = new Date();[m
[32m+[m[32m        dateValidator.init();[m
[32m+[m[41m        [m
[32m+[m[32m        if (isNaN(year) || year < 0)[m
[32m+[m[32m            errorMessage += "\n - Year should be a positive number";[m
[32m+[m[32m        if (isNaN(month) || month < 1 || month > 12)[m
[32m+[m[32m            errorMessage += "\n - Invalid value for month";[m
[32m+[m[32m        else if (isNaN(day) || day < 1 || day > dateValidator.monthDays[month - 1])[m
[32m+[m[32m            errorMessage += "\n - Invalid value for day";[m
[32m+[m
[32m+[m[32m        if (errorMessage === "") {[m
[32m+[m[32m            alert("Success!");[m
[32m+[m[32m            date.setYear(year);[m
[32m+[m[32m            date.setMonth(month);[m
[32m+[m[32m            date.setDate(day);[m
[32m+[m
[32m+[m[32m            signUpData.birthDate = JSON.stringify(date);[m
[32m+[m
[32m+[m[32m            $.ajax({[m
[32m+[m[32m                type: "GET",[m
[32m+[m[32m                url: "Service.svc/AddNewUser",[m
[32m+[m[32m                data: signUpData,[m
[32m+[m[32m                contentType: "application/json; charset=utf-8",[m
[32m+[m[32m                dataType: "json",[m
[32m+[m[32m                processData: true,[m
[32m+[m[32m                success: function (receivedData) {[m
[32m+[m[32m                    onSignUpSuccess(receivedData);[m
[32m+[m[32m                },[m
[32m+[m[32m                error: function (result) {[m
[32m+[m[32m                    console.log("Error performing ajax " + result);[m
[32m+[m[32m                }[m
[32m+[m[32m            });[m
[32m+[m[32m        }[m
[32m+[m[32m        else {[m
[32m+[m[32m            alert("Sign up form contains the following errors: " + errorMessage);[m
[32m+[m[32m        }[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    function onSignUpSuccess(receivedData) {[m
[32m+[m[32m        if (receivedData === "failed")[m
[32m+[m[32m            alert("Sign up form contains the following errors: \n - Username already taken");[m
[32m+[m[32m        else {[m
[32m+[m[32m            $("#sign-up-alert").show('slow');[m
[32m+[m[32m            sessionStorage.id = receivedData;[m
[32m+[m[32m            $.ajax({[m
[32m+[m[32m                type: "GET",[m
[32m+[m[32m                url: "Service.svc/GetLoggedInUserData",[m
[32m+[m[32m                data: { sessionId: sessionStorage.id },[m
[32m+[m[32m                contentType: "application/json; charset=utf-8",[m
[32m+[m[32m                dataType: "json",[m
[32m+[m[32m                processData: true,[m
[32m+[m[32m                success: function (receivedData) {[m
[32m+[m[32m                    onLoginSuccess(receivedData);[m
[32m+[m[32m                },[m
[32m+[m[32m                error: function (result) {[m
[32m+[m[32m                    console.log("Error performing ajax " + result);[m
[32m+[m[32m                }[m
[32m+[m[32m            });[m
[32m+[m
[32m+[m[32m            setTimeout(function () {[m
[32m+[m[32m                $('#sign-up-modal').modal('hide');[m
[32m+[m[32m            }, 3000);[m
[32m+[m[32m        }[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    function validateAlphanumeric(string) {[m
[32m+[m[32m        if (/[^a-zA-Z0-9]/.test(string)) {[m
[32m+[m[32m            return false;[m
[32m+[m[32m        }[m
[32m+[m[32m        return true;[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    function hasWhiteSpace(string) {[m
[32m+[m[32m        return /\s/g.test(string);[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    var dateValidator = {[m
[32m+[m[32m        monthDays: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],[m
[32m+[m[32m        init: function () {[m
[32m+[m[32m            var date = new Date();[m
[32m+[m[32m            var year = date.getYear();[m
[32m+[m[32m            if (year % 4 === 0 || year % 100 === 0)[m
[32m+[m[32m                this.monthDays[1] = 29;[m
[32m+[m[32m            else[m
[32m+[m[32m                this.monthDays[1] = 28;[m
[32m+[m[32m        }[m
[32m+[m[32m    };[m
[32m+[m
[32m+[m[32m    $(document).ready(documentInit);[m
[32m+[m[32m})();[m
\ No newline at end of file[m
[1mdiff --git a/GamingPlatform/scripts/test.js b/GamingPlatform/scripts/test.js[m
[1mdeleted file mode 100644[m
[1mindex c6a3894..0000000[m
[1m--- a/GamingPlatform/scripts/test.js[m
[1m+++ /dev/null[m
[36m@@ -1,63 +0,0 @@[m
[31m-﻿[m
[31m-(function () {[m
[31m-    'use strict';[m
[31m-    //var userLoggedIn = "Guest";[m
[31m-[m
[31m-    var documentInit = function () {[m
[31m-[m
[31m-        // $("#rateYo").rateYo({[m
[31m-        //    rating: 3.6[m
[31m-        //});[m
[31m-[m
[31m-        $.ajax({[m
[31m-            type: "GET",[m
[31m-            url: "Service.svc/GetUserSessionToken",[m
[31m-            data: { username: "admin", password: "admin" },[m
[31m-            contentType: "application/json; charset=utf-8",[m
[31m-            dataType: "json",[m
[31m-            processData: true,[m
[31m-            success: function (receivedData) {[m
[31m-                console.log("Received: " + receivedData);[m
[31m-            },[m
[31m-            error: function (result) {[m
[31m-                console.log("Error performing ajax " + result);[m
[31m-            }[m
[31m-        });[m
[31m-[m
[31m-        var x = getQueryVariable("id");[m
[31m-        if (x)[m
[31m-            alert(x);[m
[31m-[m
[31m-        console.log(sessionStorage.userName);[m
[31m-[m
[31m-        if (sessionStorage.userName) {[m
[31m-            $("#log-in-title").html("Logged in as " + sessionStorage.userName + " from session");[m
[31m-[m
[31m-            $("#log-in-style").attr("style", "color: #FF0000");[m
[31m-        }[m
[31m-        else {[m
[31m-            sessionStorage.userName = "Bob";[m
[31m-            $("#log-in-title").html("Logged in as Bob fresh");[m
[31m-[m
[31m-            $("#log-in-style").attr("style", "color: #FF0000");[m
[31m-        }[m
[31m-[m
[31m-        $("#redirect-button").click(function () {[m
[31m-            window.location.href = "index.html?id=333";[m
[31m-[m
[31m-        });[m
[31m-    };[m
[31m-[m
[31m-    function getQueryVariable(variable) {[m
[31m-        var query = window.location.search.substring(1),[m
[31m-            vars = query.split("&");[m
[31m-        for (var i = 0; i < vars.length; i++) {[m
[31m-            var pair = vars[i].split("=");[m
[31m-            if (pair[0] === variable) { return pair[1]; }[m
[31m-        }[m
[31m-        return (false);[m
[31m-        [m
[31m-    }[m
[31m-[m
[31m-    $(document).ready(documentInit);[m
[31m-})();[m
\ No newline at end of file[m
[1mdiff --git a/neo4jdata.txt b/neo4jdata.txt[m
[1mnew file mode 100644[m
[1mindex 0000000..c6bb686[m
[1m--- /dev/null[m
[1m+++ b/neo4jdata.txt[m
[36m@@ -0,0 +1,14 @@[m
[32m+[m[32m// Users[m
[32m+[m[32mCREATE (n:User[m[41m [m
[32m+[m[32m        { username: "FallenShard",[m
[32m+[m[32m          password: "FallenShard",[m
[32m+[m[32m          email: "nemanjabartolovic@yahoo.com",[m
[32m+[m[32m          firstName: "Nemanja",[m
[32m+[m[32m          lastName: "Bartolovic",[m
[32m+[m[32m          birthDate: "1992-01-12T03:40:00.000Z",[m
[32m+[m[32m          location: "Serbia",[m
[32m+[m[32m          gender: "M",[m
[32m+[m[32m          avatarImage: "fallenshard1.jpg",[m
[32m+[m[32m          status: "user",[m
[32m+[m[32m          sessionId: ""[m
[32m+[m[32m        })[m

[33mcommit 43494eb5515dc081936be1a2a791594515749673[m
Author: StefanStojanovic <stefko.stojanovic@gmail.com>
Date:   Sun Feb 8 02:41:25 2015 +0100

    Added nodes domain model and inserting services

[1mdiff --git a/GamingPlatform/App_Code/Developer.cs b/GamingPlatform/App_Code/Developer.cs[m
[1mnew file mode 100644[m
[1mindex 0000000..151f4e6[m
[1m--- /dev/null[m
[1m+++ b/GamingPlatform/App_Code/Developer.cs[m
[36m@@ -0,0 +1,15 @@[m
[32m+[m[32m﻿using System;[m
[32m+[m[32musing System.Collections.Generic;[m
[32m+[m[32musing System.Linq;[m
[32m+[m[32musing System.Web;[m
[32m+[m
[32m+[m[32m/// <summary>[m
[32m+[m[32m/// Summary description for Developer[m
[32m+[m[32m/// </summary>[m
[32m+[m[32mpublic class Developer[m
[32m+[m[32m{[m
[32m+[m[32m    public String name { get; set; }[m
[32m+[m[32m    public String location { get; set; }[m
[32m+[m[32m    public String owner { get; set; }[m
[32m+[m[32m    public String website { get; set; }[m
[32m+[m[32m}[m
\ No newline at end of file[m
[1mdiff --git a/GamingPlatform/App_Code/Game.cs b/GamingPlatform/App_Code/Game.cs[m
[1mnew file mode 100644[m
[1mindex 0000000..e87b748[m
[1m--- /dev/null[m
[1m+++ b/GamingPlatform/App_Code/Game.cs[m
[36m@@ -0,0 +1,24 @@[m
[32m+[m[32m﻿using System;[m
[32m+[m[32musing System.Collections.Generic;[m
[32m+[m[32musing System.Linq;[m
[32m+[m[32musing System.Web;[m
[32m+[m
[32m+[m[32m/// <summary>[m
[32m+[m[32m/// Summary description for Game[m
[32m+[m[32m/// </summary>[m
[32m+[m[32mpublic class Game[m
[32m+[m[32m{[m
[32m+[m[32m    public String title { get; set; }[m
[32m+[m[32m    public String description { get; set; }[m
[32m+[m[32m    public String genre { get; set; }[m
[32m+[m[32m    public String mode { get; set; }[m
[32m+[m[32m    public String publisher { get; set; }[m
[32m+[m[32m    public String[] platforms { get; set; }[m
[32m+[m[32m    public String releaseDate { get; set; }[m
[32m+[m[32m    public String thumbnail { get; set; }[m
[32m+[m[32m    public String logo { get; set; }[m
[32m+[m[32m    public String[] images { get; set; }[m
[32m+[m[32m    public String review { get; set; }[m
[32m+[m[32m    public String website { get; set; }[m
[32m+[m[32m    public String additionalInfo { get; set; }[m
[32m+[m[32m}[m
\ No newline at end of file[m
[1mdiff --git a/GamingPlatform/App_Code/IService.cs b/GamingPlatform/App_Code/IService.cs[m
[1mindex e7821f4..a614a17 100644[m
[1m--- a/GamingPlatform/App_Code/IService.cs[m
[1m+++ b/GamingPlatform/App_Code/IService.cs[m
[36m@@ -10,6 +10,8 @@[m [musing System.Text;[m
 [ServiceContract][m
 public interface IService[m
 {[m
[32m+[m[32m    #region User authentication[m
[32m+[m
     [OperationContract][m
     [WebInvoke (Method = "GET",[m
                 ResponseFormat = WebMessageFormat.Json)][m
[36m@@ -20,8 +22,34 @@[m [mpublic interface IService[m
                 ResponseFormat = WebMessageFormat.Json)][m
     string GetLoggedInUserData(string sessionId);[m
 [m
[32m+[m[32m    #endregion[m
[32m+[m
[32m+[m[32m    #region Data adding[m
[32m+[m
     [OperationContract][m
     [WebInvoke(Method = "GET",[m
                 ResponseFormat = WebMessageFormat.Json)][m
     string AddNewUser(string username, string password, string email, string firstName, string lastName, string location, string birthDate, string gender);[m
[32m+[m
[32m+[m[32m    [OperationContract][m
[32m+[m[32m    [WebInvoke(Method = "GET",[m
[32m+[m[32m                ResponseFormat = WebMessageFormat.Json)][m
[32m+[m[32m    string AddNewDeveloper(string name, string location, string owner, string website);[m
[32m+[m
[32m+[m[32m    [OperationContract][m
[32m+[m[32m    [WebInvoke(Method = "GET",[m
[32m+[m[32m                ResponseFormat = WebMessageFormat.Json)][m
[32m+[m[32m    string addNewGame(string title, string description, string genre, string mode, string publisher, string[] platforms, string releaseDate, string thumbnail, string logo, string[] images, string review, string website, string additionalInfo);[m
[32m+[m
[32m+[m[32m    [OperationContract][m
[32m+[m[32m    [WebInvoke(Method = "GET",[m
[32m+[m[32m                ResponseFormat = WebMessageFormat.Json)][m
[32m+[m[32m    string addNewWallPost(string content, string timestamp);[m
[32m+[m
[32m+[m[32m    [OperationContract][m
[32m+[m[32m    [WebInvoke(Method = "GET",[m
[32m+[m[32m                ResponseFormat = WebMessageFormat.Json)][m
[32m+[m[32m    string addNewStore(string location, string address, string dateOpened);[m
[32m+[m
[32m+[m[32m    #endregion[m
 }[m
[1mdiff --git a/GamingPlatform/App_Code/Service.cs b/GamingPlatform/App_Code/Service.cs[m
[1mindex 8752ed4..0894c1c 100644[m
[1m--- a/GamingPlatform/App_Code/Service.cs[m
[1m+++ b/GamingPlatform/App_Code/Service.cs[m
[36m@@ -16,6 +16,8 @@[m [musing Newtonsoft.Json;[m
 [AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Allowed)][m
 public class Service : IService[m
 {[m
[32m+[m[32m    #region User authentication[m
[32m+[m
     public string GetUserSessionToken(string username, string password)[m
     {[m
         string token = "guest";[m
[36m@@ -72,6 +74,15 @@[m [mpublic class Service : IService[m
         return Convert.ToBase64String(EncryptedBytes);[m
     }[m
 [m
[32m+[m[32m    #endregion[m
[32m+[m
[32m+[m[32m    private string toJson(object obj)[m
[32m+[m[32m    {[m
[32m+[m[32m        return JsonConvert.SerializeObject(obj);[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    #region Data adding[m
[32m+[m
     public string AddNewUser(string username, string password, string email, string firstName, string lastName, string location, string birthDate, string gender)[m
     {[m
         string retVal = "failed";[m
[36m@@ -111,4 +122,123 @@[m [mpublic class Service : IService[m
 [m
         return newUser.sessionId;[m
     }[m
[32m+[m
[32m+[m[32m    public string AddNewDeveloper(string name, string location, string owner, string website)[m
[32m+[m[32m    {[m
[32m+[m[32m        string retVal = "failed";[m
[32m+[m
[32m+[m[32m        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));[m
[32m+[m[32m        client.Connect();[m
[32m+[m
[32m+[m[32m        var results = client.Cypher[m
[32m+[m[32m            .Match("(developer:Developer)")[m
[32m+[m[32m            .Where((Developer developer) => developer.name == name)[m
[32m+[m[32m            .Return(developer => developer.As<Developer>()).Results;[m
[32m+[m
[32m+[m[32m        // There's already a develoepr with that name[m
[32m+[m[32m        if (results.Count() > 0)[m
[32m+[m[32m            return retVal;[m
[32m+[m
[32m+[m[32m        Developer newDeveloper = new Developer();[m
[32m+[m[32m        newDeveloper.name = name;[m
[32m+[m[32m        newDeveloper.location = location;[m
[32m+[m[32m        newDeveloper.owner = owner;[m
[32m+[m[32m        newDeveloper.website = website;[m
[32m+[m
[32m+[m[32m        client.Cypher[m
[32m+[m[32m            .Create("(developer:Developer {newDeveloper})")[m
[32m+[m[32m            .WithParam("newDeveloper", newDeveloper)[m
[32m+[m[32m            .ExecuteWithoutResults();[m
[32m+[m
[32m+[m[32m        return toJson(newDeveloper);[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    public string addNewGame(string title, string description, string genre, string mode, string publisher, string[] platforms, string releaseDate, string thumbnail, string logo, string[] images, string review, string website, string additionalInfo)[m
[32m+[m[32m    {[m
[32m+[m[32m        string retVal = "failed";[m
[32m+[m
[32m+[m[32m        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));[m
[32m+[m[32m        client.Connect();[m
[32m+[m
[32m+[m[32m        var results = client.Cypher[m
[32m+[m[32m            .Match("(game:Game)")[m
[32m+[m[32m            .Where((Game game) => game.title == title)[m
[32m+[m[32m            .Return(game => game.As<Game>()).Results;[m
[32m+[m
[32m+[m[32m        // There's already a game with that title[m
[32m+[m[32m        if (results.Count() > 0)[m
[32m+[m[32m            return retVal;[m
[32m+[m
[32m+[m[32m        Game newGame = new Game();[m
[32m+[m[32m        newGame.title = title;[m
[32m+[m[32m        newGame.description = description;[m
[32m+[m[32m        newGame.genre = genre;[m
[32m+[m[32m        newGame.mode = mode;[m
[32m+[m[32m        newGame.publisher = publisher;[m
[32m+[m[32m        newGame.platforms = platforms;[m
[32m+[m[32m        newGame.releaseDate = releaseDate;[m
[32m+[m[32m        newGame.thumbnail = thumbnail;[m
[32m+[m[32m        newGame.logo = logo;[m
[32m+[m[32m        newGame.images = images;[m
[32m+[m[32m        newGame.review = review;[m
[32m+[m[32m        newGame.website = website;[m
[32m+[m[32m        newGame.additionalInfo = additionalInfo;[m
[32m+[m
[32m+[m[32m        client.Cypher[m
[32m+[m[32m            .Create("(game:Game {newGame})")[m
[32m+[m[32m            .WithParam("newGame", newGame)[m
[32m+[m[32m            .ExecuteWithoutResults();[m
[32m+[m
[32m+[m[32m        return toJson(newGame);[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    public string addNewWallPost(string content, string timestamp)[m
[32m+[m[32m    {[m
[32m+[m[32m        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));[m
[32m+[m[32m        client.Connect();[m
[32m+[m
[32m+[m[32m        // No checks needed[m
[32m+[m
[32m+[m[32m        WallPost newWallPost = new WallPost();[m
[32m+[m[32m        newWallPost.content = content;[m
[32m+[m[32m        newWallPost.timestamp = timestamp;[m
[32m+[m
[32m+[m[32m        client.Cypher[m
[32m+[m[32m            .Create("(wallPost:WallPost {newWallPost})")[m
[32m+[m[32m            .WithParam("newWallPost", newWallPost)[m
[32m+[m[32m            .ExecuteWithoutResults();[m
[32m+[m
[32m+[m[32m        return toJson(newWallPost);[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    public string addNewStore(string location, string address, string dateOpened)[m
[32m+[m[32m    {[m
[32m+[m[32m        string retVal = "failed";[m
[32m+[m
[32m+[m[32m        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));[m
[32m+[m[32m        client.Connect();[m
[32m+[m
[32m+[m[32m        var results = client.Cypher[m
[32m+[m[32m            .Match("(store:Store)")[m
[32m+[m[32m            .Where((Store store) => store.address == address)[m
[32m+[m[32m            .Return(store => store.As<Store>()).Results;[m
[32m+[m
[32m+[m[32m        // There's already a store with that address[m
[32m+[m[32m        if (results.Count() > 0)[m
[32m+[m[32m            return retVal;[m
[32m+[m
[32m+[m[32m        Store newStore = new Store();[m
[32m+[m[32m        newStore.location = location;[m
[32m+[m[32m        newStore.address = address;[m
[32m+[m[32m        newStore.dateOpened = dateOpened;[m
[32m+[m
[32m+[m[32m        client.Cypher[m
[32m+[m[32m            .Create("(store:Store {newStore})")[m
[32m+[m[32m            .WithParam("newStore", newStore)[m
[32m+[m[32m            .ExecuteWithoutResults();[m
[32m+[m
[32m+[m[32m        return toJson(newStore);[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    #endregion[m
 }[m
[1mdiff --git a/GamingPlatform/App_Code/Store.cs b/GamingPlatform/App_Code/Store.cs[m
[1mnew file mode 100644[m
[1mindex 0000000..8f19d69[m
[1m--- /dev/null[m
[1m+++ b/GamingPlatform/App_Code/Store.cs[m
[36m@@ -0,0 +1,14 @@[m
[32m+[m[32m﻿using System;[m
[32m+[m[32musing System.Collections.Generic;[m
[32m+[m[32musing System.Linq;[m
[32m+[m[32musing System.Web;[m
[32m+[m
[32m+[m[32m/// <summary>[m
[32m+[m[32m/// Summary description for Store[m
[32m+[m[32m/// </summary>[m
[32m+[m[32mpublic class Store[m
[32m+[m[32m{[m
[32m+[m[32m    public String location { get; set; }[m
[32m+[m[32m    public String address { get; set; }[m
[32m+[m[32m    public String dateOpened { get; set; }[m
[32m+[m[32m}[m
\ No newline at end of file[m
[1mdiff --git a/GamingPlatform/App_Code/WallPost.cs b/GamingPlatform/App_Code/WallPost.cs[m
[1mnew file mode 100644[m
[1mindex 0000000..f67d836[m
[1m--- /dev/null[m
[1m+++ b/GamingPlatform/App_Code/WallPost.cs[m
[36m@@ -0,0 +1,13 @@[m
[32m+[m[32m﻿using System;[m
[32m+[m[32musing System.Collections.Generic;[m
[32m+[m[32musing System.Linq;[m
[32m+[m[32musing System.Web;[m
[32m+[m
[32m+[m[32m/// <summary>[m
[32m+[m[32m/// Summary description for WallPost[m
[32m+[m[32m/// </summary>[m
[32m+[m[32mpublic class WallPost[m
[32m+[m[32m{[m
[32m+[m[32m    public String content { get; set; }[m
[32m+[m[32m    public String timestamp { get; set; }[m
[32m+[m[32m}[m
\ No newline at end of file[m

[33mcommit 298482418c529ff1bf5b2a2ab19231a132001470[m
Author: StefanStojanovic <stefko.stojanovic@gmail.com>
Date:   Sat Feb 7 18:31:17 2015 +0100

    Basic game page design

[1mdiff --git a/GamingPlatform/App_Code/Service.cs b/GamingPlatform/App_Code/Service.cs[m
[1mindex b88906b..0b0d851 100644[m
[1m--- a/GamingPlatform/App_Code/Service.cs[m
[1m+++ b/GamingPlatform/App_Code/Service.cs[m
[36m@@ -6,8 +6,8 @@[m [musing System.ServiceModel;[m
 using System.ServiceModel.Web;[m
 using System.Text;[m
 [m
[31m-using Neo4jClient;[m
[31m-using Neo4jClient.Cypher;[m
[32m+[m[32m//using Neo4jClient;[m
[32m+[m[32m//using Neo4jClient.Cypher;[m
 [m
 // NOTE: You can use the "Rename" command on the "Refactor" menu to change the class name "Service" in code, svc and config file together.[m
 public class Service : IService[m
[36m@@ -32,7 +32,7 @@[m [mpublic class Service : IService[m
 [m
 	public string GetData(int value)[m
 	{[m
[31m-        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));[m
[32m+[m[32m        /*GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));[m
         client.Connect();[m
 [m
         string actorName = ".*" + "Tom" + ".*";[m
[36m@@ -52,7 +52,9 @@[m [mpublic class Service : IService[m
             string s = a.name;[m
         }[m
 [m
[31m-		return string.Format("You entered: {0}", value);[m
[32m+[m		[32mreturn string.Format("You entered: {0}", value);*/[m
[32m+[m
[32m+[m[32m        return string.Empty;[m
 	}[m
 [m
 	public CompositeType GetDataUsingDataContract(CompositeType composite)[m
[1mdiff --git a/GamingPlatform/css/custom.css b/GamingPlatform/css/custom.css[m
[1mindex 26dfe20..172a319 100644[m
[1m--- a/GamingPlatform/css/custom.css[m
[1m+++ b/GamingPlatform/css/custom.css[m
[36m@@ -1,4 +1,4 @@[m
 ﻿body[m
 {[m
     font-family: 'Roboto', sans-serif;[m
[31m-}[m
[32m+[m[32m}[m
\ No newline at end of file[m
[1mdiff --git a/GamingPlatform/css/game-style.css b/GamingPlatform/css/game-style.css[m
[1mnew file mode 100644[m
[1mindex 0000000..ab676cb[m
[1m--- /dev/null[m
[1m+++ b/GamingPlatform/css/game-style.css[m
[36m@@ -0,0 +1,112 @@[m
[32m+[m[32m﻿#header-div {[m
[32m+[m[32m    height: 75px;[m
[32m+[m[32m    background-color: #7F7F7F;[m
[32m+[m[32m    margin-bottom: 10px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m#name-div {[m
[32m+[m[32m    height: 75px;[m
[32m+[m[32m    background-color: #7F7F7F;[m
[32m+[m[32m    margin-bottom: 10px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m#game-name {[m
[32m+[m[32m    color: yellow;[m
[32m+[m[32m    font-size: 50px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m#discription-div {[m
[32m+[m[32m    background-color: #3F3F3F;[m
[32m+[m[32m    margin-bottom: 10px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m#game-discription {[m
[32m+[m[32m    color: white;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m#rating-div {[m
[32m+[m[32m    background-color: #7F7F7F;[m
[32m+[m[32m    margin-bottom: 10px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m#text-div {[m
[32m+[m[32m    background-color: #3F3F3F;[m
[32m+[m[32m    color: white;[m
[32m+[m[32m    margin-bottom: 10px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m#info-div {[m
[32m+[m[32m    background-color: #3F3F3F;[m
[32m+[m[32m    color: yellow;[m
[32m+[m[32m    margin-bottom: 10px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m#logo-div {[m
[32m+[m[32m    height: 200px;[m
[32m+[m[32m    background-color: #FFFFFF;[m
[32m+[m[32m    margin-bottom: 10px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m#image-div {[m
[32m+[m[32m    height: 300px;[m
[32m+[m[32m    background-color: #000000;[m
[32m+[m[32m    margin-bottom: 10px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.drops-shadow {[m
[32m+[m[32m    box-shadow: 0 8px 5px -6px black;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.drops-shadow {[m
[32m+[m[32m    box-shadow: 0 8px 5px -6px black;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.center-vert {[m
[32m+[m[32m    position: relative;[m
[32m+[m[32m    top: 50%;[m
[32m+[m[32m    transform: translateY(-50%);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m/*Button styles*/[m
[32m+[m[32m.btn-skin {[m
[32m+[m[32m    background: #3F3F3F;[m
[32m+[m[32m    border: 2px solid #000000;[m
[32m+[m[32m    font-family: 'Open Sans', sans-serif;[m
[32m+[m[32m    text-transform: uppercase;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.btn-skin:focus {[m[41m [m
[32m+[m[32m    outline: none;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.btn-skin:hover {[m
[32m+[m[32m    background: #7F7F7F;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.btn-skin:active {[m
[32m+[m[32m    background: #BFBFBF;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.small-border {[m
[32m+[m[32m    border: 1px solid #000000;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.btn-skin-important {[m
[32m+[m[32m    background: #7F3F3F;[m
[32m+[m[32m    border: 2px solid #000000;[m
[32m+[m[32m    font-family: 'Open Sans', sans-serif;[m
[32m+[m[32m    text-transform: uppercase;[m
[32m+[m[32m    color: white;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.btn-skin-important:focus {[m[41m [m
[32m+[m[32m    outline: none;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.btn-skin-important:hover {[m
[32m+[m[32m    background: #FF8080;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.btn-skin-important:active {[m
[32m+[m[32m    background: #800000;[m
[32m+[m[32m}[m
\ No newline at end of file[m
[1mdiff --git a/GamingPlatform/game.html b/GamingPlatform/game.html[m
[1mnew file mode 100644[m
[1mindex 0000000..13e2a04[m
[1m--- /dev/null[m
[1m+++ b/GamingPlatform/game.html[m
[36m@@ -0,0 +1,191 @@[m
[32m+[m[32m﻿<!DOCTYPE html>[m
[32m+[m[32m<html lang="en">[m
[32m+[m[32m<head>[m
[32m+[m[32m    <title>Game page</title>[m
[32m+[m[32m    <meta charset="utf-8">[m
[32m+[m[32m    <meta name="viewport" content="width=device-width, initial-scale=1">[m
[32m+[m
[32m+[m[32m    <link rel="stylesheet" href="css/bootstrap-slated.min.css">[m
[32m+[m[32m    <link rel="stylesheet" href="css/rateit.css">[m
[32m+[m[32m    <link href='http://fonts.googleapis.com/css?family=Roboto:700,400' rel='stylesheet' type='text/css'>[m
[32m+[m[32m    <link rel="stylesheet" href="css/custom.css">[m
[32m+[m
[32m+[m[32m    <!-- Specified style for game.html elements -->[m
[32m+[m[32m    <link rel="stylesheet" href="css/game-style.css">[m
[32m+[m
[32m+[m[32m    <script src="scripts/jquery-2.1.3.min.js"></script>[m
[32m+[m[32m    <script src="scripts/bootstrap.min.js"></script>[m
[32m+[m[32m    <script src="scripts/test.js"></script>[m
[32m+[m[32m</head>[m
[32m+[m[32m<body>[m
[32m+[m[32m    <div class="container">[m
[32m+[m
[32m+[m[32m        <!-- The header of the page, containing login and register buttons -->[m
[32m+[m[32m        <div id="header-div" class="row drops-shadow">[m
[32m+[m
[32m+[m[32m            <div class="col-xs-offset-8 col-xs-2 center-vert">[m
[32m+[m[32m                <button id="login-button"[m
[32m+[m[32m                        class="btn btn-block btn-skin drops-shadow"[m
[32m+[m[32m                        data-toggle="modal"[m
[32m+[m[32m                        href="#loginModal">[m
[32m+[m[32m                    LOGIN[m
[32m+[m[32m                </button>[m
[32m+[m[32m            </div>[m
[32m+[m
[32m+[m[32m            <div class="col-xs-2 center-vert">[m
[32m+[m[32m                <button id="register-button"[m
[32m+[m[32m                        class="btn btn-block btn-skin"[m
[32m+[m[32m                        data-toggle="modal"[m
[32m+[m[32m                        href="#registerModal">[m
[32m+[m[32m                    REGISTER[m
[32m+[m[32m                </button>[m
[32m+[m[32m            </div>[m
[32m+[m
[32m+[m[32m        </div>[m
[32m+[m[41m        [m
[32m+[m[32m        <!-- The part of the page, containing game information -->[m
[32m+[m[32m        <div id="game-div">[m
[32m+[m
[32m+[m[32m            <div class="col-xs-8">[m
[32m+[m
[32m+[m[32m                <div id="name-div" class="row">[m
[32m+[m[32m                    <h id="game-name">Game_name</h>[m
[32m+[m[32m                </div>[m
[32m+[m
[32m+[m[32m                <div id="discription-div" class="`row">[m
[32m+[m[32m                    <p id="game-discription">Game_Description</p>[m
[32m+[m[32m                </div>[m
[32m+[m
[32m+[m[32m                <div id="rating-div" class="row">[m
[32m+[m[32m                    <!-- TODO: add satrs, they won't show... -->[m
[32m+[m[32m                    <div class="rateit bigstars"[m
[32m+[m[32m                         data-rateit-starwidth="32"[m
[32m+[m[32m                         data-rateit-starheight="32"[m
[32m+[m[32m                         data-rateit-resetable="false">[m
[32m+[m[32m                    </div>[m
[32m+[m[32m                </div>[m
[32m+[m
[32m+[m[32m                <div id="information-div" class="row">[m
[32m+[m
[32m+[m[32m                    <div id="text-div" class="col-xs-3">[m
[32m+[m[32m                        <p>Developed by</p>[m
[32m+[m[32m                        <p>Genre</p>[m
[32m+[m[32m                        <p>Mode</p>[m
[32m+[m[32m                        <p>Release date</p>[m
[32m+[m[32m                        <p>Platforms</p>[m
[32m+[m[32m                        <p>Publishers</p>[m
[32m+[m[32m                    </div>[m
[32m+[m
[32m+[m[32m                    <div id="info-div" class="col-xs-9">[m
[32m+[m[32m                        <p id="developed-div">Developer</p>[m
[32m+[m[32m                        <p id="developed-div">Genre</p>[m
[32m+[m[32m                        <p id="developed-div">Mode</p>[m
[32m+[m[32m                        <p id="developed-div">Release_date</p>[m
[32m+[m[32m                        <p id="developed-div">Platforms</p>[m
[32m+[m[32m                        <p id="developed-div">Publishers</p>[m
[32m+[m[32m                    </div>[m
[32m+[m
[32m+[m[32m                </div>[m
[32m+[m
[32m+[m[32m            </div>[m
[32m+[m
[32m+[m[32m            <div class="col-xs-4">[m
[32m+[m[41m                [m
[32m+[m[32m                <div id="logo-div">[m
[32m+[m[32m                    <img />[m
[32m+[m[32m                </div>[m
[32m+[m
[32m+[m[32m                <div id="image-div" class="carousel slide" data-ride="carousel">[m
[32m+[m[32m                    <!-- Indicators -->[m
[32m+[m[32m                    <ol class="carousel-indicators">[m
[32m+[m[32m                        <li data-target="#image-div" data-slide-to="0" class="active"></li>[m
[32m+[m[32m                        <li data-target="#image-div" data-slide-to="1"></li>[m
[32m+[m[32m                        <li data-target="#image-div" data-slide-to="2"></li>[m
[32m+[m[32m                        <li data-target="#image-div" data-slide-to="3"></li>[m
[32m+[m[32m                    </ol>[m
[32m+[m
[32m+[m[32m                    <!-- Wrapper for slides -->[m
[32m+[m[32m                    <div class="carousel-inner" role="listbox">[m
[32m+[m[32m                        <div class="item active">[m
[32m+[m[32m                            <img src="img_chania.jpg" alt="Chania">[m
[32m+[m[32m                        </div>[m
[32m+[m
[32m+[m[32m                        <div class="item">[m
[32m+[m[32m                            <img src="img_chania2.jpg" alt="Chania">[m
[32m+[m[32m                        </div>[m
[32m+[m
[32m+[m[32m                        <div class="item">[m
[32m+[m[32m                            <img src="img_flower.jpg" alt="Flower">[m
[32m+[m[32m                        </div>[m
[32m+[m
[32m+[m[32m                        <div class="item">[m
[32m+[m[32m                            <img src="img_flower2.jpg" alt="Flower">[m
[32m+[m[32m                        </div>[m
[32m+[m[32m                    </div>[m
[32m+[m
[32m+[m[32m                    <!-- Left and right controls -->[m
[32m+[m[32m                    <a class="left carousel-control" href="#image-div" role="button" data-slide="prev">[m
[32m+[m[32m                        <span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>[m
[32m+[m[32m                        <span class="sr-only">Previous</span>[m
[32m+[m[32m                    </a>[m
[32m+[m[32m                    <a class="right carousel-control" href="#image-div" role="button" data-slide="next">[m
[32m+[m[32m                        <span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>[m
[32m+[m[32m                        <span class="sr-only">Next</span>[m
[32m+[m[32m                    </a>[m
[32m+[m[32m                </div>[m
[32m+[m
[32m+[m[32m            </div>[m
[32m+[m
[32m+[m[32m        </div>[m
[32m+[m
[32m+[m[32m    </div>[m
[32m+[m
[32m+[m[32m    <!-- Modal for log in -->[m
[32m+[m[32m    <div id="loginModal" class="modal fade">[m
[32m+[m[32m        <div class="modal-dialog">[m
[32m+[m[32m            <div class="modal-content">[m
[32m+[m
[32m+[m[32m                <div class="modal-header">[m
[32m+[m[32m                    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>[m
[32m+[m[32m                    <h4 class="modal-title title-font">Log in</h4>[m
[32m+[m[32m                </div>[m
[32m+[m
[32m+[m[32m                <div id="modal-login-body" class="modal-body container-fluid">[m
[32m+[m
[32m+[m[32m                    <div id="modal-cart-total-price" class="row modal-footer-adj">[m
[32m+[m
[32m+[m[32m                        <div class="row">[m
[32m+[m[32m                            <div class="col-xs-offset-4 col-xs-2">[m
[32m+[m[32m                                <dib>Username</dib>[m
[32m+[m[32m                            </div>[m
[32m+[m[32m                            <div class="col-xs-3">[m
[32m+[m[32m                                <input type="text" name="username">[m
[32m+[m[32m                            </div>[m
[32m+[m[32m                        </div>[m
[32m+[m
[32m+[m[32m                        <br />[m
[32m+[m
[32m+[m[32m                        <div class="row">[m
[32m+[m[32m                            <div class="col-xs-offset-4 col-xs-2">[m
[32m+[m[32m                                <dib>Password</dib>[m
[32m+[m[32m                            </div>[m
[32m+[m[32m                            <div class="col-xs-3">[m
[32m+[m[32m                                <input type="text" name="password">[m
[32m+[m[32m                            </div>[m
[32m+[m[32m                        </div>[m
[32m+[m
[32m+[m[32m                    </div>[m
[32m+[m[32m                </div>[m
[32m+[m
[32m+[m[32m                <div class="modal-footer">[m
[32m+[m[32m                    <button id="close-login-button" type="button" class="btn btn-skin" data-dismiss="modal">Close</button>[m
[32m+[m[32m                    <button id="login-button" type="button" class="btn btn-skin-important">Login</button>[m
[32m+[m[32m                </div>[m
[32m+[m
[32m+[m[32m            </div>[m
[32m+[m[32m        </div>[m
[32m+[m[32m    </div>[m
[32m+[m
[32m+[m[32m    <!-- Modal for register -->[m
[32m+[m[32m</body>[m
[32m+[m[32m</html>[m
[1mdiff --git a/GamingPlatform/index.html b/GamingPlatform/index.html[m
[1mindex 690122c..e60c458 100644[m
[1m--- a/GamingPlatform/index.html[m
[1m+++ b/GamingPlatform/index.html[m
[36m@@ -12,7 +12,6 @@[m
 [m
     <script src="scripts/jquery-2.1.3.min.js"></script>[m
     <script src="scripts/bootstrap.min.js"></script>[m
[31m-    <script src="scripts/test.js"></script>[m
 </head>[m
 <body>[m
     <nav class="navbar navbar-default navbar-fixed-top">[m
[1mdiff --git a/GamingPlatform/scripts/game.js b/GamingPlatform/scripts/game.js[m
[1mnew file mode 100644[m
[1mindex 0000000..5f28270[m
[1m--- /dev/null[m
[1m+++ b/GamingPlatform/scripts/game.js[m
[36m@@ -0,0 +1 @@[m
[32m+[m[32m﻿[m
\ No newline at end of file[m

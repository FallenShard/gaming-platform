using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.ServiceModel;
using System.ServiceModel.Web;
using System.Text;

using Neo4jClient;
using Neo4jClient.Cypher;
using System.ServiceModel.Activation;
using System.Security.Cryptography;
using Newtonsoft.Json;

// NOTE: You can use the "Rename" command on the "Refactor" menu to change the class name "Service" in code, svc and config file together.
[AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Allowed)]
public class Service : IService
{
    #region User authentication

    public string GetUserSessionToken(string username, string password)
    {
        string token = "guest";

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var results = client.Cypher
            .Match("(user:User)")
            .Where((User user) => user.username == username)
            .AndWhere((User user) => user.password == password)
            .Return(user => user.As<User>()).Results;

        if (results.Count() > 0)
        {
            User result = results.First();
            token = CreateSHAHash(result.username + result.password);
            client.Cypher
                .Match("(user:User)")
                .Where((User user) => user.username == username)
                .AndWhere((User user) => user.password == password)
                .Set("user.sessionId = {sessionId}")
                .WithParam("sessionId", token)
                .ExecuteWithoutResults();
        }

        return token;
    }

    public string GetLoggedInUserData(string sessionId)
    {
        string data = "guest";

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var results = client.Cypher
            .Match("(user:User)")
            .Where((User user) => user.sessionId == sessionId)
            .Return(user => user.As<User>()).Results;

        if (results.Count() > 0)
            data = JsonConvert.SerializeObject(results.First());

        return data;
    }

    private static string CreateSHAHash(string plaintext)
    {
        SHA256Managed HashTool = new SHA256Managed();
        Byte[] PhraseAsByte = System.Text.Encoding.UTF8.GetBytes(string.Concat(plaintext));
        Byte[] EncryptedBytes = HashTool.ComputeHash(PhraseAsByte);
        HashTool.Clear();
        return Convert.ToBase64String(EncryptedBytes);
    }

    #endregion

    private string toJson(object obj)
    {
        return JsonConvert.SerializeObject(obj);
    }

    #region Data adding

    public string AddNewUser(string username, string password, string email, string firstName, string lastName, string location, string birthDate, string gender)
    {
        string retVal = "failed";

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var results = client.Cypher
            .Match("(user:User)")
            .Where((User user) => user.username == username)
            .Return(user => user.As<User>()).Results;

        // There's already a user with that username
        if (results.Count() > 0)
            return retVal;

        Random rnd = new Random();
        int avatarId = rnd.Next(1, 20);

        User newUser = new User();
        newUser.username = username;
        newUser.password = password;
        newUser.email = email;
        newUser.firstName = firstName;
        newUser.lastName = lastName;
        newUser.birthDate = birthDate;
        newUser.location = location;
        newUser.gender = gender;
        newUser.avatarImage = "avatar" + avatarId + ".jpg";
        newUser.status = "User";
        newUser.sessionId = CreateSHAHash(newUser.username + newUser.password); ;

        client.Cypher
            .Create("(user:User {newUser})")
            .WithParam("newUser", newUser)
            .ExecuteWithoutResults();

        return newUser.sessionId;
    }

    public string AddNewDeveloper(string name, string location, string owner, string website)
    {
        string retVal = "failed";

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var results = client.Cypher
            .Match("(developer:Developer)")
            .Where((Developer developer) => developer.name == name)
            .Return(developer => developer.As<Developer>()).Results;

        // There's already a develoepr with that name
        if (results.Count() > 0)
            return retVal;

        Developer newDeveloper = new Developer();
        newDeveloper.name = name;
        newDeveloper.location = location;
        newDeveloper.owner = owner;
        newDeveloper.website = website;

        client.Cypher
            .Create("(developer:Developer {newDeveloper})")
            .WithParam("newDeveloper", newDeveloper)
            .ExecuteWithoutResults();

        return toJson(newDeveloper);
    }

    public string addNewGame(string title, string description, string genre, string mode, string publisher, string[] platforms, string releaseDate, string thumbnail, string logo, string[] images, string review, string website, string additionalInfo)
    {
        string retVal = "failed";

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var results = client.Cypher
            .Match("(game:Game)")
            .Where((Game game) => game.title == title)
            .Return(game => game.As<Game>()).Results;

        // There's already a game with that title
        if (results.Count() > 0)
            return retVal;

        Game newGame = new Game();
        newGame.title = title;
        newGame.description = description;
        newGame.genre = genre;
        newGame.mode = mode;
        newGame.publisher = publisher;
        newGame.platforms = platforms;
        newGame.releaseDate = releaseDate;
        newGame.thumbnail = thumbnail;
        newGame.logo = logo;
        newGame.images = images;
        newGame.review = review;
        newGame.website = website;
        newGame.additionalInfo = additionalInfo;

        client.Cypher
            .Create("(game:Game {newGame})")
            .WithParam("newGame", newGame)
            .ExecuteWithoutResults();

        return toJson(newGame);
    }

    public string addNewWallPost(string content, string timestamp)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        // No checks needed

        WallPost newWallPost = new WallPost();
        newWallPost.content = content;
        newWallPost.timestamp = timestamp;

        client.Cypher
            .Create("(wallPost:WallPost {newWallPost})")
            .WithParam("newWallPost", newWallPost)
            .ExecuteWithoutResults();

        return toJson(newWallPost);
    }

    public string addNewStore(string location, string address, string dateOpened)
    {
        string retVal = "failed";

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var results = client.Cypher
            .Match("(store:Store)")
            .Where((Store store) => store.address == address)
            .Return(store => store.As<Store>()).Results;

        // There's already a store with that address
        if (results.Count() > 0)
            return retVal;

        Store newStore = new Store();
        newStore.location = location;
        newStore.address = address;
        newStore.dateOpened = dateOpened;

        client.Cypher
            .Create("(store:Store {newStore})")
            .WithParam("newStore", newStore)
            .ExecuteWithoutResults();

        return toJson(newStore);
    }

    #endregion

    #region Link adding

    public string addNewSells(string storeAddress, string gameTitle, string price, string discount, string quantity)
    {
        return string.Empty;
    }

    public string addNewDevelops(string developerName, string gameTitle)
    {
        return string.Empty;
    }

    public string addNewRates(string username, string gameTitle, string rating)
    {
        return string.Empty;
    }

    public string addNewReviews(string username, string gameTitle, string content, string date)
    {
        return string.Empty;
    }

    public string addNewPlays(string username, string gameTitle, string hoursTotal, string dateSince)
    {
        return string.Empty;
    }

    public string addNewIsFriendsWith(string username1, string username2, string dateSince)
    {
        return string.Empty;
    }

    public string addNewPosts(string username, string content, string timestamp)
    {
        return string.Empty;
    }

    public string addNewHas(string username, string content, string timestamp)
    {
        return string.Empty;
    }

    #endregion
}

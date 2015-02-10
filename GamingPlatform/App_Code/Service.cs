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

using Nodes;
using Relationships;

// NOTE: You can use the "Rename" command on the "Refactor" menu to change the class name "Service" in code, svc and config file together.
[AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Allowed)]
public class Service : IService
{
    private string toJson(object obj)
    {
        return JsonConvert.SerializeObject(obj);
    }

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
            token = CreateSHAHash(result.username + result.password + DateTime.Now.ToString("MM\\/dd\\/yyyy h\\:mm tt"));
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

    public string GetUserBySessionId(string sessionId)
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

    public string GetUserByUsername(string username)
    {
        string data = "failed";

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var results = client.Cypher
            .Match("(user:User)")
            .Where((User user) => user.username == username)
            .Return(user => user.As<User>()).Results;

        if (results.Count() == 1)
            data = toJson(results.First());

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

    #region Friendship

    public string ResolveFriendship(string viewer, string openedUser)
    {
        string data = "nothing";

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var isFriends = client.Cypher
            .Match("(user:User)-[r:IS_FRIENDS_WITH]-(friend:User)")
            .Where((User user) => user.username == viewer)
            .AndWhere((User friend) => friend.username == openedUser)
            .Return(() => Return.As<int>("count(r)"))
            .Results.Single();

        if (isFriends > 0)
            data = "friends";

        var reqSent = client.Cypher
            .Match("(user:User)-[r:REQUEST_FRIEND]->(friend:User)")
            .Where((User user) => user.username == viewer)
            .AndWhere((User friend) => friend.username == openedUser)
            .Return(() => Return.As<int>("count(r)"))
            .Results.Single();

        if (reqSent > 0)
            data = "requestSent";

        return data;
    }

    public string CreateFriendRequest(string sourceUser, string targetUser)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        client.Cypher
            .Match("(user1:User)", "(user2:User)")
            .Where((User user1) => user1.username == sourceUser)
            .AndWhere((User user2) => user2.username == targetUser)
            .CreateUnique("user1-[:REQUEST_FRIEND]->user2")
            .ExecuteWithoutResults();

        return "Friend request sent";
    }

    public string RemoveFriendRequest(string username1, string username2)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        client.Cypher
            .Match("(user1:User)<-[r:REQUEST_FRIEND]-(user2:User)")
            .Where((User user1) => user1.username == username1)
            .AndWhere((User user2) => user2.username == username2)
            .Delete("r")
            .ExecuteWithoutResults();

        return "success";
    }

    public string[] GetFriendRequests(string username)
    {
       IList<string> friendRequests = new List<string>();

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var senders = client.Cypher
            .Match("(user:User)<-[r:REQUEST_FRIEND]-(friend:User)")
            .Where((User user) => user.username == username)
            .Return(friend => friend.As<User>())
            .Results;

        if (senders.Count() > 0)
        {
            foreach (User user in senders)
            {
                friendRequests.Add(toJson(user));
            }
        }

        return friendRequests.ToArray();
    }

    public string CreateFriendship(string username1, string username2)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var newFriend = client.Cypher
            .Match("(user1:User)", "(user2:User)")
            .Where((User user1) => user1.username == username1)
            .AndWhere((User user2) => user2.username == username2)
            .CreateUnique("user1-[:IS_FRIENDS_WITH]-user2")
            .Return(user2 => user2.As<User>())
            .Results.First();

        client.Cypher
            .Match("(user1:User)-[r:REQUEST_FRIEND]-(user2:User)")
            .Where((User user1) => user1.username == username1)
            .AndWhere((User user2) => user2.username == username2)
            .Delete("r")
            .ExecuteWithoutResults();

        return toJson(newFriend);
    }

    public string RemoveFriendship(string username1, string username2)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        client.Cypher
            .Match("(user1:User)-[r:IS_FRIENDS_WITH]-(user2:User)")
            .Where((User user1) => user1.username == username1)
            .AndWhere((User user2) => user2.username == username2)
            .Delete("r")
            .ExecuteWithoutResults();

        return "success";
    }

    public string[] GetFriends(string username)
    {
        IList<string> friends = new List<string>();

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var friendNodes = client.Cypher
            .Match("(user:User)-[r:IS_FRIENDS_WITH]-(friend:User)")
            .Where((User user) => user.username == username)
            .Return(friend => friend.As<User>())
            .Results;

        foreach (User user in friendNodes)
        {
            friends.Add(toJson(user));
        }

        return friends.ToArray();
    }

    #endregion

    #region WallPosts

    public string CreateWallPost(WallPost wallpost, string creator, string wallOwner)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        //var newFriend = client.Cypher
        //    .Match("(user1:User)", "(user2:User)")
        //    .Where((User user1) => user1.username == username1)
        //    .AndWhere((User user2) => user2.username == username2)
        //    .CreateUnique("user1-[:IS_FRIENDS_WITH]-user2")
        //    .Return(user2 => user2.As<User>())
        //    .Results.First();

        //client.Cypher
        //    .Match("(user1:User)-[r:REQUEST_FRIEND]-(user2:User)")
        //    .Where((User user1) => user1.username == username1)
        //    .AndWhere((User user2) => user2.username == username2)
        //    .Delete("r")
        //    .ExecuteWithoutResults();

        return "stub";
    }

    public string RemoveWallPost(WallPost wallPost, string creator, string recipient)
    {
        return "stub";
    }

    public string[] GetWallPosts(string username)
    {
        IList<string> wallPosts = new List<string>();

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var wallPostNodes = client.Cypher
            .OptionalMatch("(writer:User)-[:WRITES]->(wallPost:WallPost)")
            .Match("(user:User)-[:HAS]->(wallPost:WallPost)")
            .Where((User user) => user.username == username)
            .Return((wallPost, writer) => new
            {
                wallPost = wallPost.As<WallPost>(),
                writer = writer.As<User>()
            })
            .Results;

        foreach (var wallPost in wallPostNodes)
        {
            wallPosts.Add(toJson(wallPost));
        }

        return wallPosts.ToArray();
    }

    #endregion

    #region User Operations

    public string AddNewUser(User newUser)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var results = client.Cypher
            .Match("(user:User)")
            .Where((User user) => user.username == newUser.username)
            .Return(user => user.As<User>()).Results;

        // There's already a user with that username
        if (results.Count() > 0)
            return "failed";

        Random rnd = new Random();
        int avatarId = rnd.Next(1, 10);

        newUser.avatarImage = "avatar" + avatarId + ".jpg";
        newUser.status = "Member";
        newUser.sessionId = CreateSHAHash(newUser.username + newUser.password + DateTime.Now.ToString("MM\\/dd\\/yyyy h\\:mm tt"));

        client.Cypher
            .Create("(user:User {newUser})")
            .WithParam("newUser", newUser)
            .ExecuteWithoutResults();

        return toJson(newUser);
    }

    public string EditUser(User editedUser)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        client.Cypher
            .Match("(user:User)")
            .Where((User user) => user.username == editedUser.username)
            .Set("user = {editedUser}")
            .WithParam("editedUser", editedUser)
            .ExecuteWithoutResults();

        return toJson(editedUser);
    }

    #endregion


    #region Data adding

    

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

    public string addNewGame(string title, string description, string genre, string mode, string publisher, string platforms, string releaseDate, string thumbnail, string logo, string images, string review, string website, string additionalInfo)
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
        //newGame.platforms = platforms.to;
        newGame.releaseDate = releaseDate;
        newGame.thumbnail = thumbnail;
        newGame.logo = logo;
        //newGame.images = images;
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

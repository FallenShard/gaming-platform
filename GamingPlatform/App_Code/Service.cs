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

    public string[] GetFriendNames(string username)
    {
        IList<string> friendNames = new List<string>();

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var friendNodes = client.Cypher
            .Match("(user:User)-[r:IS_FRIENDS_WITH]-(friend:User)")
            .Where((User user) => user.username == username)
            .Return(friend => friend.As<User>())
            .Results;

        foreach (User user in friendNodes)
        {
            friendNames.Add(user.username);
        }

        return friendNames.ToArray();
    }

    #endregion

    #region WallPosts

    public string CreateWallPost(WallPost wallpost)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        IDictionary<string, object> qParams = new Dictionary<string, object>();
        qParams.Add("wrname", wallpost.writer);
        qParams.Add("recname", wallpost.recipient);
        qParams.Add("ts", wallpost.timestamp);
        qParams.Add("con", wallpost.content);

        var query = new CypherQuery("MATCH (writer:User), (rec:User)" +
            "WHERE (writer.username = {wrname}) AND (rec.username = {recname})" +
            "CREATE (wp:WallPost {timestamp: {ts}, content: {con}}), (writer)-[:POSTED]->(wp), (rec)-[:HAS]->(wp)", qParams, CypherResultMode.Projection);
        ((IRawGraphClient)client).ExecuteCypher(query);

        // CURRENT VERSION OF C# CLIENT DOES NOT SUPPORT CHAIN CREATION!!!!!!!!!!!!!! --Bart
        //client.Cypher
        //    .Match("(writer:User)", "(recipient:User)")
        //    .Where((User writer) => writer.username == wallpost.writer)
        //    .AndWhere((User recipient) => recipient.username == wallpost.recipient)
        //    .Create("(wp:WallPost {timestamp:" + wallpost.timestamp + ", content:" + wallpost.content + "})," +
        //"(writer)-[:POSTED]->(wp), (recipient)-[:HAS]->(wp)")
        //    .ExecuteWithoutResults();

        return "success";
    }

    public string RemoveWallPost(string writer, string timestamp, string recipient)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        client.Cypher
            .Match("(writ:User)-[r1:POSTED]->(wp:WallPost)", "(rec:User)-[r2:HAS]->(wp:WallPost)")
            .Where("wp.timestamp = {param}")
            .WithParam("param", timestamp)
            .AndWhere("writ.username = {wruser}")
            .WithParam("wruser", writer)
            .AndWhere("rec.username = {recuser}")
            .WithParam("recuser", recipient)
            .Delete("r1, r2, wp")
            .ExecuteWithoutResults();

        return "success";
    }

    public string[] GetWallPosts(string username)
    {
        IList<string> wallPosts = new List<string>();

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var wallPostNodes = client.Cypher
            .Match("(user:User)-[:HAS]->(wallPost:WallPost)", "(writer:User)-[:POSTED]-(wallPost:WallPost)")
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

    #region Game Operations

    public string GetGameByTitle(string title)
    {
        string data = "failed";

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var results = client.Cypher
            .Match("(game:Game)")
            .Where((Game game) => game.title == title)
            .Return(game => game.As<Game>()).Results;

        if (results.Count() == 1)
            data = toJson(results.First());

        return data;
    }

    public string GetGameDeveloper(string title)
    {
        string data = "none";

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var results = client.Cypher
            .Match("(game:Game)-[r:Develops]-(developer:Developer)")
            .Where((Game game) => game.title == title)
            .Return(developer => developer.As<Developer>()).Results;

        if (results.Count() == 1)
            data = toJson(results.First());

        return data;
    }

    public string AddNewGame(Game newGame)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var results = client.Cypher
            .Match("(game:Game)")
            .Where((Game game) => game.title == newGame.title)
            .Return(game => game.As<Game>()).Results;

        // There's already a game with that title
        if (results.Count() > 0)
            return "failed";

        client.Cypher
            .Create("(game:Game {newGame})")
            .WithParam("newGame", newGame)
            .ExecuteWithoutResults();

        return toJson(newGame);
    }

    public string EditGame(Game editedGame)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        client.Cypher
            .Match("(game:Game)")
            .Where((Game game) => game.title == editedGame.title)
            .Set("game = {editedGame}")
            .WithParam("editedGame", editedGame)
            .ExecuteWithoutResults();

        return toJson(editedGame);
    }

    #endregion

    #region Developer Operations

    public string AddNewDeveloper(Developer newDeveloper)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var results = client.Cypher
            .Match("(developer:Developer)")
            .Where((Developer developer) => developer.name == newDeveloper.name)
            .Return(developer => developer.As<Developer>()).Results;

        // There's already a developer with that name
        if (results.Count() > 0)
            return "failed";

        client.Cypher
            .Create("(developer:Developer {newDeveloper})")
            .WithParam("newDeveloper", newDeveloper)
            .ExecuteWithoutResults();

        return toJson(newDeveloper);
    }

    public string EditDeveloper(Developer editedDeveloper)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        client.Cypher
            .Match("(developer:Developer)")
            .Where((Developer developer) => developer.name == editedDeveloper.name)
            .Set("developer = {editedDeveloper}")
            .WithParam("editedDeveloper", editedDeveloper)
            .ExecuteWithoutResults();

        return toJson(editedDeveloper);
    }

    #endregion

    #region Data adding

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

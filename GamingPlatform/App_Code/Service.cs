﻿using System;
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
    private static int paginationAmount = 8;

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

        var mutualFriends = client.Cypher
            .Match("(user:User)-[:IS_FRIENDS_WITH*2..2]-(friend:User)")
            .Where((User user) => user.username == viewer)
            .AndWhere((User friend) => friend.username == openedUser)
            .Return(() => Return.As<int>("count(*)"))
            .Results.Single();

        data += "|" + mutualFriends.ToString();

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


    public string[] GetFriendsWithMutual(string username)
    {
        IList<string> friends = new List<string>();

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var friendNodes = client.Cypher
            .Match("(me:User {username: {myname}})-[:IS_FRIENDS_WITH]-(friend:User)")
            .OptionalMatch("(friend:User)-[:IS_FRIENDS_WITH]-(fof:User)")
            .WithParam("myname", username)
            .Where("(me)-[:IS_FRIENDS_WITH]-(fof)")
            .Return((friend, fof) => new
            {
                friend = friend.As<User>(),
                mutual = fof.CollectAs<User>()
            })
            .Results;

        foreach (var entry in friendNodes)
        {
            friends.Add(toJson(entry));
        }

        return friends.ToArray();
    }

    public string[] GetFriendsWithMutualNotSelf(string openedUser, string activeUser)
    {
        IList<string> friends = new List<string>();

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var friendNodes = client.Cypher
            .Match("(me:User {username: {myname}})", "(opened:User {username: {openedUser}})-[:IS_FRIENDS_WITH]-(friend:User)")
            .OptionalMatch("(friend)-[IS_FRIENDS_WITH]-(fofof:User)")
            .WithParam("myname", activeUser)
            .WithParam("openedUser", openedUser)
            .Where("(me)-[:IS_FRIENDS_WITH]-(fofof)")
            .AndWhere("me.username <> friend.username")
            .Return((friend, fofof) => new
            {
                friend = friend.As<User>(),
                mutual = fofof.CollectAs<User>()
            })
            .Results;

        foreach (var entry in friendNodes)
        {
            friends.Add(toJson(entry));
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

        // I'm sorry I have to use this abomination
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

        wallPostNodes = wallPostNodes.OrderByDescending(x => x.wallPost.timestamp);

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

        TimeSpan t = DateTime.UtcNow - new DateTime(1970, 1, 1);
        int secondsSinceEpoch = (int)t.TotalSeconds;
        newUser.memberSinceDate = secondsSinceEpoch.ToString();

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


    #region Data search

    public string[] GetUsersPagin(string filter, int page, int activeUser)
    {
        List<string> result = new List<string>();

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var queryBuilder = client.Cypher
            .Match("(n:User)")
            .Where("n.username =~ {filter}")
            .OrWhere("n.firstName =~ {filter}")
            .OrWhere("n.lastName =~ {filter}")
            .OrWhere("n.status =~ {filter}")
            .WithParam("filter", ".*(?i)" + filter + ".*");

        var userNodes = queryBuilder
            .Return<User>("n")
            .OrderBy("tolower(n.username)")
            .Skip((page - 1) * paginationAmount)
            .Limit(paginationAmount)
            .Results;

        foreach (var user in userNodes)
        {
            result.Add(toJson(user));
        }

        var userCount = queryBuilder
            .Return(() => Return.As<int>("count(n)"))
            .Results.Single();

        result.Add(userCount.ToString());

        return result.ToArray();
    }

    public string[] GetGamesPagin(string filter, int page, int activeUser)
    {
        List<string> result = new List<string>();

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var queryBuilder = client.Cypher
            .Match("(n:Game)")
            .Where("n.title =~ {filter}")
            .OrWhere("n.genre =~ {filter}")
            .OrWhere("n.mode =~ {filter}")
            .OrWhere("n.publisher =~ {filter}")
            .OrWhere("str(n.platforms) =~ {filter}")
            .WithParam("filter", ".*(?i)" + filter + ".*");

        var gameNodes = queryBuilder
            .Return<Game>("n")
            .OrderBy("tolower(n.title)")
            .Skip((page - 1) * paginationAmount)
            .Limit(paginationAmount)
            .Results;

        foreach (var game in gameNodes)
        {
            result.Add(toJson(game));
        }

        var gameCount = queryBuilder
            .Return(() => Return.As<int>("count(n)"))
            .Results.Single();

        result.Add(gameCount.ToString());

        return result.ToArray();
    }

    public string[] GetDevelopersPagin(string filter, int page, int activeUser)
    {
        List<string> result = new List<string>();

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var queryBuilder = client.Cypher
            .Match("(n:Developer)")
            .Where("n.name =~ {filter}")
            .OrWhere("n.location =~ {filter}")
            .OrWhere("n.owner =~ {filter}")
            .WithParam("filter", ".*(?i)" + filter + ".*");

        var devNodes = queryBuilder
            .Return<Developer>("n")
            .OrderBy("tolower(n.title)")
            .Skip((page - 1) * paginationAmount)
            .Limit(paginationAmount)
            .Results;

        foreach (var dev in devNodes)
        {
            result.Add(toJson(dev));
        }

        var gameCount = queryBuilder
            .Return(() => Return.As<int>("count(n)"))
            .Results.Single();

        result.Add(gameCount.ToString());

        return result.ToArray();
    }

    #endregion

    #region Game Operations

    

    public string AddNewGame(Game newGame)
    {
        string retVal = "failed";

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var results = client.Cypher
            .Match("(game:Game)")
            .Where((Game game) => game.title == newGame.title)
            .Return(game => game.As<Game>()).Results;

        // There's already a game with that title
        if (results.Count() > 0)
            return retVal;

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
            .WithParam("editedUser", editedGame)
            .ExecuteWithoutResults();

        return toJson(editedGame);
    }

    public string RemoveGame(string title)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        try
        {
            client.Cypher
            .OptionalMatch("(g:Game)")
            .Where((Game g) => g.title == title)
            .Delete("g")
            .ExecuteWithoutResults();
        }
        catch (Exception)
        {
            //
        }

        try
        {
            client.Cypher
            .Match("(g:Game)-[r]-()")
            .Where((Game g) => g.title == title)
            .Delete("g, r")
            .ExecuteWithoutResults();
        }
        catch (Exception)
        {

        }

        return "Success";
    }

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

    public string CreateUserRating(double rating, string title, string username)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        client.Cypher
            .Match("(game:Game)", "(user:User)")
            .Where((Game game) => game.title == title)
            .AndWhere((User user) => user.username == username)
            .CreateUnique("user-[:RATES {rating: {rat}}]->game")
            .WithParam("rat", rating)
            .ExecuteWithoutResults();

        return "success at adding rating";
    }

    public string RemoveUserRating(string title, string username)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        client.Cypher
            .Match("(game:Game)<-[r:RATES]-(user:User)")
            .Where((Game game) => game.title == title)
            .AndWhere((User user) => user.username == username)
            .Delete("r")
            .ExecuteWithoutResults();

        return "success at adding rating";
    }

    public string GetGameRating(string title)
    {
        string retVal = "nothing";

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var results = client.Cypher
            .Match("(game:Game)<-[r:RATES]-()")
            .Where((Game game) => game.title == title)
            .Return(() => new
            {
                count = Return.As<int>("count(r)"),
                sum = Return.As<double>("sum(r.rating)")
            }).Results;

        if (results.Count() > 0)
        {
            var result = results.First();
            retVal = toJson(result);
        }

        return retVal;
    }

    public string GetGameRatingByUser(string title, string username)
    {
        string retVal = "nothing";

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var results = client.Cypher
            .Match("(game:Game)<-[r:RATES]-(u:User)")
            .Where((Game game) => game.title == title)
            .AndWhere((User u) => u.username == username)
            .Return(() => Return.As<double>("r.rating")).Results;

        if (results.Count() > 0)
        {
            var result = results.First();
            retVal = result.ToString();
        }

        return retVal;
    }

    public string GetGameDeveloper(string title)
    {
        string data = "none";

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var results = client.Cypher
            .Match("(developer:Developer)-[:DEVELOPS]->(game:Game)")
            .Where((Game game) => game.title == title)
            .Return(developer => developer.As<Developer>()).Results;

        if (results.Count() == 1)
            data = toJson(results.First());

        return data;
    }

    public string CreateReview(Review review)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        client.Cypher
            .Match("(game:Game)", "(user:User)")
            .Where((Game game) => game.title == review.game)
            .AndWhere((User user) => user.username == review.writer)
            .CreateUnique("user-[:REVIEWS {content: {con}, timestamp: {ts}}]->game")
            .WithParam("con", review.content)
            .WithParam("ts", review.timestamp)
            .ExecuteWithoutResults();

        return "success";
    }

    public string RemoveReview(string username, string title)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        client.Cypher
            .Match("(game:Game)<-[r:REVIEWS]-(user:User)")
            .Where((Game game) => game.title == title)
            .AndWhere((User user) => user.username == username)
            .Delete("r")
            .ExecuteWithoutResults();

        return "success";
    }

    public string GetUserReview(string username, string title)
    {
        string retVal = "nothing";

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var res = client.Cypher
            .Match("(game:Game)<-[r:REVIEWS]-(user:User)")
            .Where((Game game) => game.title == title)
            .AndWhere((User user) => user.username == username)
            .Return((user, r) => new
            {
                review = r.As<Review>(),
                writer = user.As<User>()
            }).Results;

        if (res.Count() > 0)
            retVal = toJson(res.First());

        return retVal;
    }

    public string[] GetGameReviews(string gameTitle)
    {
        IList<string> results = new List<string>();

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var res = client.Cypher
            .Match("(game:Game)<-[r:REVIEWS]-(user:User)")
            .Where((Game game) => game.title == gameTitle)
            .Return((user, r) => new
            {
                review = r.As<Review>(),
                writer = user.As<User>()
            }).Results;

        res = res.OrderByDescending(x => x.review.timestamp);

        foreach (var result in res)
            results.Add(toJson(result));

        return results.ToArray();
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

    #endregion

    
    public string AddNewDeveloper(Developer newDeveloper)
    {
        string retVal = "failed";

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var results = client.Cypher
            .Match("(developer:Developer)")
            .Where((Developer developer) => developer.name == newDeveloper.name)
            .Return(developer => developer.As<Developer>()).Results;

        // There's already a game with that title
        if (results.Count() > 0)
            return retVal;

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

    public string RemoveDeveloper(string name)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        try
        {
            client.Cypher
            .OptionalMatch("(dev:Developer)")
            .Where((Developer dev) => dev.name == name)
            .Delete("dev")
            .ExecuteWithoutResults();
        }
        catch (Exception)
        {
            //
        }

        try
        {
            client.Cypher
            .Match("(dev:Developer)-[r]-()")
            .Where((Developer dev) => dev.name == name)
            .Delete("dev, r")
            .ExecuteWithoutResults();
        }
        catch (Exception)
        {

        }

        return "Success";
    }

    public string GetDeveloperByName(string name)
    {
        string data = "failed";

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var results = client.Cypher
            .Match("(developer:Developer)")
            .Where((Developer developer) => developer.name == name)
            .Return(developer => developer.As<Developer>()).Results;

        if (results.Count() == 1)
            data = toJson(results.First());

        return data;
    }

    #region Game Ownership operations

    public string CreateUserPlaysGame(string username, string title, string time)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        client.Cypher
            .Match("(game:Game)", "(user:User)")
            .Where((Game game) => game.title == title)
            .AndWhere((User user) => user.username == username)
            .CreateUnique("user-[:PLAYS {since: {time}, totalHours: {totalHours}}]->game")
            .WithParam("time", time)
            .WithParam("totalHours", 0)
            .ExecuteWithoutResults();

        return "success";
    }

    public string RemoveUserPlaysGame(string username, string title)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        client.Cypher
            .Match("(user:User)-[r:PLAYS]-(game:Game)")
            .Where((User user) => user.username == username)
            .AndWhere((Game game) => game.title == title)
            .Delete("r")
            .ExecuteWithoutResults();

        return "success";
    }

    public string GetUserPlaysGame(string username, string title)
    {
        string data = "nothing";

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var res = client.Cypher
            .Match("(game:Game)<-[r:PLAYS]-(user:User)")
            .Where((Game game) => game.title == title)
            .AndWhere((User user) => user.username == username)
            .Return(() => Return.As<int>("count(r)"))
            .Results.Single();

        if (res > 0)
            data = "owns";

        return data;
    }

    public string[] GetUserGames(string username)
    {
        IList<string> games = new List<string>();

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var gameNodes = client.Cypher
            .Match("(user:User)-[r:PLAYS]->(game:Game)")
            .Where((User user) => user.username == username)
            .Return((game, r) => new
            {
                game = game.As<Game>(),
                date = r.As<Owns>()
            })
            .Results;

        gameNodes = gameNodes.OrderBy(x => x.game.title);

        foreach (var game in gameNodes)
        {
            games.Add(toJson(game));
        }

        return games.ToArray();
    }

    public string SetPlayTime(string username, string title, int hours)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        client.Cypher
            .Match("(user:User)-[r:PLAYS]->(game:Game)")
            .Where((User user) => user.username == username)
            .AndWhere((Game game) => game.title == title)
            .Set("r.totalHours = {hrs}")
            .WithParam("hrs", hours)
            .ExecuteWithoutResults();

        return "success";
    }

    public string[] GetDeveloperGames(string name)
    {
        IList<string> games = new List<string>();

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var gameNodes = client.Cypher
            .Match("(dev:Developer)-[r:DEVELOPS]->(game:Game)")
            .Where((Developer dev) => dev.name == name)
            .Return(game => game.As<Game>())
            .Results;

        gameNodes = gameNodes.OrderBy(x => x.title);

        foreach (var game in gameNodes)
        {
            games.Add(toJson(game));
        }

        return games.ToArray();
    }

    #endregion

    #region Admin list calls

    public string[] GetAllUsers()
    {
        IList<string> users = new List<string>();

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var userNodes = client.Cypher
            .Match("(user:User)")
            .Return(() => Return.As<User>("user"))
            .Results;

        foreach (var user in userNodes)
        {
            users.Add(toJson(user));
        }

        return users.ToArray();
    }

    public string[] GetAllGames()
    {
        IList<string> games = new List<string>();

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var gameNodes = client.Cypher
            .Match("(game:Game)")
            .Return(() => Return.As<Game>("game"))
            .Results;

        foreach (var game in gameNodes)
        {
            games.Add(toJson(game));
        }

        return games.ToArray();
    }

    public string[] GetAllDevelopers()
    {
        IList<string> devs = new List<string>();

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var devNodes = client.Cypher
            .Match("(dev:Developer)")
            .Return(() => Return.As<Developer>("dev"))
            .Results;

        foreach (var dev in devNodes)
        {
            devs.Add(toJson(dev));
        }

        return devs.ToArray();
    }

    #endregion



    #region TRIVIA

    public string GetMostFriendsUser()
    {
        string res = "none";

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var result = client.Cypher
            .OptionalMatch("(best:User)-[IS_FRIENDS_WITH]-(friend:User)")
            .Return((best, friend) => new
            {
                user = best.As<User>(),
                count = friend.Count()
            }).Results;

        result = result.OrderByDescending(x => x.count);

        if (result.Count() > 0)
            res = toJson(result.First());

        return res;
    }


    public string GetBestRatedGame()
    {
        string res = "none";

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var result = client.Cypher
            .Match("(best:Game)<-[r:RATES]-(user:User)")
            .Return((best, r) => new
            {
                game = best.As<Game>(),
                rates = Return.As<int>("count(r)"),
                totalRates = Return.As<int>("sum(r.rating)")//r.CollectAs<Rates>()
            }).Results;

        result = result.OrderByDescending(x => x.totalRates / x.rates).ThenByDescending(x => x.rates);

        if (result.Count() > 0)
        {
            res = toJson(result.First());
        }
            

        return res;
    }


    public string GetBestDeveloper()
    {
        string res = "none";

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var result = client.Cypher
            .Match("(best:Developer)-[DEVELOPS]->(game:Game)", "(game:Game)<-[r:RATES]-(u:User)")
            .Return((best, r, game) => new
            {
                dev = best.As<Developer>(),
                rates = Return.As<int>("count(r)"),
                totalRates = Return.As<int>("sum(r.rating)"),
                gameCount = Return.As<int>("count(game)")
            }).Results;

        result = result.OrderByDescending(x => x.totalRates / x.rates).ThenByDescending(x => x.gameCount).ThenByDescending(x => x.rates);

        if (result.Count() > 0)
        {
            res = toJson(result.First());
        }


        return res;
    }


    public string GetMostGamesUser()
    {
        string res = "none";

        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        var result = client.Cypher
            .OptionalMatch("(best:User)-[OWNS]-(game:Game)")
            .Return((best, game) => new
            {
                user = best.As<User>(),
                count = game.Count()
            }).Results;

        result = result.OrderByDescending(x => x.count);

        if (result.Count() > 0)
            res = toJson(result.First());

        return res;
    }



    #endregion


    public string ConnectGameAndDev(string title, string name)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        client.Cypher
            .Match("(game:Game)", "(dev:Developer)")
            .Where((Game game) => game.title == title)
            .AndWhere((Developer dev) => dev.name == name)
            .CreateUnique("(dev)-[:DEVELOPS]->(game)")
            .ExecuteWithoutResults();

        return "success";
    }

    public string DisconnectGameAndDev(string title, string name)
    {
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        client.Cypher
            .Match("(game:Game)<-[r:DEVELOPS]-(dev:Developer)")
            .Where((Game game) => game.title == title)
            .AndWhere((Developer dev) => dev.name == name)
            .Delete("r")
            .ExecuteWithoutResults();

        return "success";
    }
}

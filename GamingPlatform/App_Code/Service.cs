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
}

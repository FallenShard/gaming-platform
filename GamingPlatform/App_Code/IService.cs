using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.ServiceModel;
using System.ServiceModel.Web;
using System.Text;

using Nodes;
using Relationships;

// NOTE: You can use the "Rename" command on the "Refactor" menu to change the interface name "IService" in both code and config file together.
[ServiceContract]
public interface IService
{
    #region User authentication

    [OperationContract]
    [WebInvoke (Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string GetUserSessionToken(string username, string password);

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string GetUserBySessionId(string sessionId);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string GetUserByUsername(string username);

    #endregion

    #region Friendship

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string ResolveFriendship(string viewer, string openedUser);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string CreateFriendRequest(string sourceUser, string targetUser);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string RemoveFriendRequest(string username1, string username2);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string[] GetFriendRequests(string username);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string CreateFriendship(string username1, string username2);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string RemoveFriendship(string username1, string username2);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string[] GetFriends(string username);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string[] GetFriendNames(string username);

    #endregion

    #region WallPosts

    [OperationContract]
    [WebInvoke(Method = "POST",
               ResponseFormat = WebMessageFormat.Json,
               RequestFormat = WebMessageFormat.Json,
               BodyStyle = WebMessageBodyStyle.Bare)]
    string CreateWallPost(WallPost wallPost);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string RemoveWallPost(string writer, string timestamp, string recipient);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string[] GetWallPosts(string username);

    #endregion

    #region User Operations

    [OperationContract]
    [WebInvoke(Method = "POST",
               ResponseFormat = WebMessageFormat.Json,
               RequestFormat = WebMessageFormat.Json,
               BodyStyle = WebMessageBodyStyle.Bare)]
    string AddNewUser(User newUser);

    [OperationContract]
    [WebInvoke(Method = "POST",
               ResponseFormat = WebMessageFormat.Json,
               RequestFormat = WebMessageFormat.Json,
               BodyStyle = WebMessageBodyStyle.Bare)]
    string EditUser(User editedUser);

    #endregion

    #region Data Search

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string[] GetUsersPagin(string filter, int page, int activeUser);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string[] GetGamesPagin(string filter, int page, int activeUser);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string[] GetDevelopersPagin(string filter, int page, int activeUser);

    #endregion

    #region Game Operations

    [OperationContract]
    [WebInvoke(Method = "POST",
               ResponseFormat = WebMessageFormat.Json,
               RequestFormat = WebMessageFormat.Json,
               BodyStyle = WebMessageBodyStyle.Bare)]
    string AddNewGame(Game newGame);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string GetGameByTitle(string title);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string CreateUserRating(double rating, string title, string username);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string RemoveUserRating(string title, string username);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string GetGameRating(string title);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string GetGameRatingByUser(string title, string username);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string GetGameDeveloper(string title);

    #endregion

    #region Data adding

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string AddNewDeveloper(string name, string location, string owner, string website);

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string addNewStore(string location, string address, string dateOpened);

    #endregion

    #region Link adding

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string addNewSells(string storeAddress, string gameTitle, string price, string discount, string quantity);

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string addNewDevelops(string developerName, string gameTitle);

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string addNewRates(string username, string gameTitle, string rating);

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string addNewReviews(string username, string gameTitle, string content, string date);

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string addNewPlays(string username, string gameTitle, string hoursTotal, string dateSince);

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string addNewIsFriendsWith(string username1, string username2, string dateSince);

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string addNewPosts(string username, string content, string timestamp);

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string addNewHas(string username, string content, string timestamp);

    #endregion
}

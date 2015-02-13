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
    string[] GetFriendsWithMutual(string username);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string[] GetFriendsWithMutualNotSelf(string openedUser, string activeUser);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string[] GetFriendNames(string username);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string[] GetDeveloperGames(string name);

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
    [WebInvoke(Method = "POST",
               ResponseFormat = WebMessageFormat.Json,
               RequestFormat = WebMessageFormat.Json,
               BodyStyle = WebMessageBodyStyle.Bare)]
    string EditGame(Game editedGame);

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string RemoveGame(string title);

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

    [OperationContract]
    [WebInvoke(Method = "POST",
               ResponseFormat = WebMessageFormat.Json,
               RequestFormat = WebMessageFormat.Json,
               BodyStyle = WebMessageBodyStyle.Bare)]
    string CreateReview(Review review);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string RemoveReview(string username, string title);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string GetUserReview(string username, string title);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string[] GetGameReviews(string gameTitle);

    #endregion

    #region Game Ownership operations

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string CreateUserPlaysGame(string username, string title, string time);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string RemoveUserPlaysGame(string username, string title);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string GetUserPlaysGame(string username, string title);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string[] GetUserGames(string username);

    [OperationContract]
    [WebInvoke(Method = "GET",
               ResponseFormat = WebMessageFormat.Json)]
    string SetPlayTime(string username, string title, int hours);

    #endregion

    #region Developer Operations

    [WebInvoke(Method = "POST",
               ResponseFormat = WebMessageFormat.Json,
               RequestFormat = WebMessageFormat.Json,
               BodyStyle = WebMessageBodyStyle.Bare)]
    string AddNewDeveloper(Developer newDeveloper);
    
    [OperationContract]
    [WebInvoke(Method = "POST",
               ResponseFormat = WebMessageFormat.Json,
               RequestFormat = WebMessageFormat.Json,
               BodyStyle = WebMessageBodyStyle.Bare)]
    string EditDeveloper(Developer editedDeveloper);

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string RemoveDeveloper(string name);

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string GetDeveloperByName(string name);

    #endregion

    #region TRIVIA

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string GetMostFriendsUser();

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string GetBestRatedGame();

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string GetBestDeveloper();

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string GetMostGamesUser();

    #endregion

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string ConnectGameAndDev(string title, string name);

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string DisconnectGameAndDev(string title, string name);



    #region Admin list calls

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string[] GetAllUsers();

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string[] GetAllGames();

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string[] GetAllDevelopers();

    #endregion
}

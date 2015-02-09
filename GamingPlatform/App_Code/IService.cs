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
    string GetLoggedInUserData(string sessionId);

    #endregion

    #region Data adding

    [OperationContract]
    [WebInvoke(Method = "POST",
               ResponseFormat = WebMessageFormat.Json,
               RequestFormat = WebMessageFormat.Json,
               BodyStyle = WebMessageBodyStyle.Bare)]
    string AddNewUser(User newUser);

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string AddNewDeveloper(string name, string location, string owner, string website);

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string addNewGame(string title, string description, string genre, string mode, string publisher, string platforms, string releaseDate, string thumbnail, string logo, string images, string review, string website, string additionalInfo);

    [OperationContract]
    [WebInvoke(Method = "GET",
                ResponseFormat = WebMessageFormat.Json)]
    string addNewWallPost(string content, string timestamp);

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

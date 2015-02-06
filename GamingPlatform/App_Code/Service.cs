using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.ServiceModel;
using System.ServiceModel.Web;
using System.Text;

using Neo4jClient;
using Neo4jClient.Cypher;

// NOTE: You can use the "Rename" command on the "Refactor" menu to change the class name "Service" in code, svc and config file together.
public class Service : IService
{
    public class Actor
    {
        public String id { get; set; }
        public String name { get; set; }
        public String birthplace { get; set; }
        public String birthday { get; set; }
        public String biography { get; set; }

        public DateTime getBirthday()
        {
            if (this.birthday == null) return new DateTime();

            long timestamp = Int64.Parse(this.birthday);
            DateTime startDateTime = new DateTime(1970, 1, 1, 0, 0, 0, 0);
            return startDateTime.AddMilliseconds(timestamp).ToLocalTime();
        }
    }

	public string GetData(int value)
	{
        GraphClient client = new GraphClient(new Uri("http://localhost:7474/db/data"));
        client.Connect();

        string actorName = ".*" + "Tom" + ".*";

        Dictionary<string, object> queryDict = new Dictionary<string, object>();
        queryDict.Add("actorName", actorName);

        var query = new Neo4jClient.Cypher.CypherQuery("start n=node(*) match (n:Person) where has(n.name) and n.name =~ {actorName} return n",
                                                        queryDict, CypherResultMode.Set);

        List<Actor> actors = ((IRawGraphClient)client).ExecuteGetCypherResults<Actor>(query).ToList();

        foreach (Actor a in actors)
        {
            //DateTime bday = a.getBirthday();
            //MessageBox.Show(a.name);
            string s = a.name;
        }

		return string.Format("You entered: {0}", value);
	}

	public CompositeType GetDataUsingDataContract(CompositeType composite)
	{
		if (composite == null)
		{
			throw new ArgumentNullException("composite");
		}
		if (composite.BoolValue)
		{
			composite.StringValue += "Suffix";
		}
		return composite;
	}
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Nodes
{
    /// <summary>
    /// Summary description for Game
    /// </summary>
    public class Game
    {
        public string title { get; set; }
        public string description { get; set; }
        public string genre { get; set; }
        public string mode { get; set; }
        public string publisher { get; set; }
        public string[] platforms { get; set; }
        public string releaseDate { get; set; }
        public string thumbnail { get; set; }
        public string[] images { get; set; }
    } 
}
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Nodes
{
    /// <summary>
    /// Summary description for WallPost
    /// </summary>
    public class WallPost
    {
        public string content { get; set; }
        public string timestamp { get; set; }
        public string writer { get; set; }
        public string recipient { get; set; }
    } 
}
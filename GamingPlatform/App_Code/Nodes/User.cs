﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Nodes
{
    public class User
    {
        public string username { get; set; }
        public string password { get; set; }
        public string email { get; set; }
        public string firstName { get; set; }
        public string lastName { get; set; }
        public string birthDate { get; set; }
        public string location { get; set; }
        public string gender { get; set; }
        public string avatarImage { get; set; }
        public string status { get; set; }
        public string memberSinceDate { get; set; }
        public string sessionId { get; set; }
    }
}
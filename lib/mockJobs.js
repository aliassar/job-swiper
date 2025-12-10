export const mockJobs = [
  {
    id: 1,
    company: "Google",
    position: "Senior Software Engineer",
    location: "Mountain View, CA",
    skills: ["React", "Node.js", "Python", "Kubernetes"],
    description: "Join our team to build next-generation cloud infrastructure. We're looking for experienced engineers who are passionate about scalable systems and clean code.",
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: 2,
    company: "Microsoft",
    position: "Frontend Developer",
    location: "Seattle, WA",
    skills: ["React", "TypeScript", "Azure", "CSS"],
    description: "Build amazing user experiences for millions of users worldwide. Work with cutting-edge technologies and a talented team of designers and developers.",
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    id: 3,
    company: "Amazon",
    position: "Full Stack Developer",
    location: "Austin, TX",
    skills: ["Java", "AWS", "React", "DynamoDB"],
    description: "Help us revolutionize e-commerce with innovative solutions. We need talented developers who can work across the full stack.",
    postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
  {
    id: 4,
    company: "Meta",
    position: "Backend Engineer",
    location: "Menlo Park, CA",
    skills: ["Python", "GraphQL", "PostgreSQL", "Redis"],
    description: "Build scalable backend systems that power social connections for billions of people. Join our infrastructure team and make an impact.",
    postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
  {
    id: 5,
    company: "Apple",
    position: "iOS Developer",
    location: "Cupertino, CA",
    skills: ["Swift", "SwiftUI", "Xcode", "iOS"],
    description: "Create incredible apps for millions of iOS users. Work on products that define the mobile experience for the next generation.",
    postedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
  },
  {
    id: 6,
    company: "Netflix",
    position: "DevOps Engineer",
    location: "Los Gatos, CA",
    skills: ["Docker", "Kubernetes", "AWS", "Python"],
    description: "Help us deliver entertainment to 200+ million subscribers worldwide. Build and maintain our cloud infrastructure.",
    postedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
  },
  {
    id: 7,
    company: "Stripe",
    position: "Product Engineer",
    location: "San Francisco, CA",
    skills: ["Ruby", "React", "JavaScript", "SQL"],
    description: "Build payment infrastructure for the internet. Work on products that process billions of dollars in transactions.",
    postedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  },
  {
    id: 8,
    company: "Airbnb",
    position: "Mobile Engineer",
    location: "San Francisco, CA",
    skills: ["React Native", "iOS", "Android", "JavaScript"],
    description: "Help millions of people find and book unique accommodations around the world. Build delightful mobile experiences.",
    postedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
  },
  {
    id: 9,
    company: "Salesforce",
    position: "Software Engineer",
    location: "San Francisco, CA",
    skills: ["Java", "Salesforce", "Lightning", "Apex"],
    description: "Transform how businesses connect with customers. Build enterprise-grade CRM solutions that power thousands of companies.",
    postedDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days ago
  },
  {
    id: 10,
    company: "Tesla",
    position: "Embedded Systems Engineer",
    location: "Palo Alto, CA",
    skills: ["C++", "Embedded Systems", "Python", "Linux"],
    description: "Build software for the future of transportation. Work on autonomous driving systems and vehicle software.",
    postedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
  },
  {
    id: 11,
    company: "Uber",
    position: "Backend Engineer",
    location: "San Francisco, CA",
    skills: ["Go", "Microservices", "Kafka", "Redis"],
    description: "Help us move people and things in the physical world. Build scalable systems that serve millions of trips daily.",
    postedDate: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(), // 11 days ago
  },
  {
    id: 12,
    company: "LinkedIn",
    position: "Data Engineer",
    location: "Sunnyvale, CA",
    skills: ["Spark", "Hadoop", "Python", "SQL"],
    description: "Build data infrastructure that powers insights for millions of professionals. Work with petabytes of data.",
    postedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
  },
  {
    id: 13,
    company: "Spotify",
    position: "Frontend Engineer",
    location: "New York, NY",
    skills: ["React", "TypeScript", "GraphQL", "CSS"],
    description: "Create the music streaming experience for millions of users. Build features that connect artists with fans.",
    postedDate: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(), // 13 days ago
  },
  {
    id: 14,
    company: "Square",
    position: "Full Stack Engineer",
    location: "San Francisco, CA",
    skills: ["Ruby", "Java", "React", "MySQL"],
    description: "Empower small businesses with financial tools. Build products that help entrepreneurs succeed.",
    postedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
  },
  {
    id: 15,
    company: "Twitter",
    position: "Machine Learning Engineer",
    location: "San Francisco, CA",
    skills: ["Python", "TensorFlow", "PyTorch", "Scala"],
    description: "Build ML systems that power the real-time conversation platform. Work on recommendation systems and content moderation.",
    postedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
  },
  {
    id: 16,
    company: "Dropbox",
    position: "Security Engineer",
    location: "San Francisco, CA",
    skills: ["Python", "Security", "Cryptography", "Cloud"],
    description: "Protect user data and build secure systems. Work on infrastructure security and threat detection.",
    postedDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(), // 16 days ago
  },
  {
    id: 17,
    company: "Shopify",
    position: "Ruby Developer",
    location: "Ottawa, Canada",
    skills: ["Ruby on Rails", "JavaScript", "MySQL", "Redis"],
    description: "Help merchants build their online stores. Work on e-commerce infrastructure that powers millions of businesses.",
    postedDate: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(), // 17 days ago
  },
  {
    id: 18,
    company: "Zoom",
    position: "Video Engineer",
    location: "San Jose, CA",
    skills: ["C++", "WebRTC", "Video Codecs", "Networking"],
    description: "Build the future of video communications. Work on real-time video processing and streaming infrastructure.",
    postedDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), // 18 days ago
  },
  {
    id: 19,
    company: "Adobe",
    position: "Creative Cloud Engineer",
    location: "San Jose, CA",
    skills: ["JavaScript", "React", "Node.js", "AWS"],
    description: "Build creative tools used by millions of designers and artists. Work on cloud-based creative applications.",
    postedDate: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(), // 19 days ago
  },
  {
    id: 20,
    company: "GitHub",
    position: "Platform Engineer",
    location: "Remote",
    skills: ["Ruby", "Go", "MySQL", "Git"],
    description: "Build the platform that hosts the world's code. Work on version control and collaboration tools for developers.",
    postedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
  },
];

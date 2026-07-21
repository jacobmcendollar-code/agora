import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const communities = [
  // Technology & Science
  { name: "programming", title: "Programming", description: "Discussion about programming languages, tools, and software development." },
  { name: "artificial-intelligence", title: "Artificial Intelligence", description: "AI research, tools, ethics, and the future of machine intelligence." },
  { name: "science", title: "Science", description: "Scientific discoveries, research, and discussion across disciplines." },
  { name: "space", title: "Space", description: "Space exploration, astronomy, and the cosmos." },
  { name: "gadgets", title: "Gadgets", description: "Consumer technology, devices, and reviews." },
  { name: "privacy-security", title: "Privacy & Security", description: "Digital privacy, security practices, and surveillance." },

  // Ideas & Philosophy
  { name: "philosophy", title: "Philosophy", description: "Philosophical ideas, questions, and discussion." },
  { name: "free-speech", title: "Free Speech", description: "Discussion about free expression, censorship, and open discourse." },
  { name: "critical-thinking", title: "Critical Thinking", description: "Reasoning, logic, cognitive biases, and clear thinking." },
  { name: "history", title: "History", description: "Historical events, figures, and analysis." },
  { name: "futurism", title: "Futurism", description: "The future of technology, society, and humanity." },
  { name: "psychology", title: "Psychology", description: "Human behavior, the mind, and psychological research." },

  // Society & Culture
  { name: "culture", title: "Culture", description: "Cultural trends, norms, and observations." },
  { name: "media", title: "Media", description: "News media, journalism, and information." },
  { name: "education", title: "Education", description: "Learning, teaching, schools, and educational ideas." },
  { name: "work-careers", title: "Work & Careers", description: "Jobs, workplaces, and professional life." },
  { name: "personal-finance", title: "Personal Finance", description: "Money management, saving, and financial independence." },
  { name: "law", title: "Law", description: "Legal systems, court cases, and discussion of the law." },

  // Arts & Entertainment
  { name: "movies", title: "Movies", description: "Films, filmmakers, and cinema discussion." },
  { name: "television", title: "Television", description: "TV shows, streaming series, and television culture." },
  { name: "music", title: "Music", description: "Music of all genres, artists, and discussion." },
  { name: "books", title: "Books", description: "Books, reading, and literature." },
  { name: "gaming", title: "Gaming", description: "Video games, gaming culture, and discussion." },
  { name: "art", title: "Art", description: "Visual art, artists, and creative work." },
  { name: "photography", title: "Photography", description: "Photography techniques, gear, and images." },

  // Lifestyle
  { name: "health", title: "Health", description: "Physical and mental health discussion." },
  { name: "fitness", title: "Fitness", description: "Exercise, training, and physical fitness." },
  { name: "food", title: "Food", description: "Cooking, restaurants, and food culture." },
  { name: "travel", title: "Travel", description: "Travel experiences, destinations, and advice." },
  { name: "relationships", title: "Relationships", description: "Dating, marriage, friendship, and human connection." },
  { name: "parenting", title: "Parenting", description: "Raising children and family life." },
  { name: "fashion", title: "Fashion", description: "Style, clothing, and fashion discussion." },

  // Hobbies & Interests
  { name: "sports", title: "Sports", description: "All sports and athletic competition." },
  { name: "outdoors", title: "Outdoors", description: "Hiking, camping, nature, and outdoor activities." },
  { name: "cars", title: "Cars", description: "Automobiles, driving, and car culture." },
  { name: "diy-home", title: "DIY & Home", description: "Home improvement, repairs, and DIY projects." },
  { name: "gardening", title: "Gardening", description: "Plants, gardens, and growing things." },
  { name: "pets", title: "Pets", description: "Dogs, cats, and other companion animals." },

  // Places & Local
  { name: "united-states", title: "United States", description: "Discussion related to the United States." },
  { name: "world-news", title: "World News", description: "Global news and international affairs." },
  { name: "cities", title: "Cities", description: "Urban life, city planning, and local discussion." },

  // Lighter / Casual
  { name: "humor", title: "Humor", description: "Jokes, funny observations, and lighthearted content." },
  { name: "interesting", title: "Interesting", description: "Things that are fascinating or unusual." },
  { name: "recommendations", title: "Recommendations", description: "Ask for and share recommendations." },
  { name: "stories", title: "Stories", description: "Personal stories and narratives." },

  // Practical
  { name: "entrepreneurship", title: "Entrepreneurship", description: "Starting and running businesses." },
  { name: "investing", title: "Investing", description: "Stocks, markets, and investment discussion." },
  { name: "learning", title: "Learning", description: "Self-education, skills, and lifelong learning." },
];

async function main() {
  // Use the first user in the database as the creator
  const user = await prisma.user.findFirst();

  if (!user) {
    console.error("No users found. Create at least one account first.");
    process.exit(1);
  }

  console.log(`Using user "${user.username}" as creator...`);

  for (const community of communities) {
    const existing = await prisma.community.findUnique({
      where: { name: community.name },
    });

    if (existing) {
      console.log(`Skipping ${community.name} (already exists)`);
      continue;
    }

    await prisma.community.create({
      data: {
        name: community.name,
        title: community.title,
        description: community.description,
        creatorId: user.id,
      },
    });

    console.log(`Created: ${community.title}`);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
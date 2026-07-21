import { PrismaClient } from "@prisma/client";
import { fetchThumbnail } from "../src/lib/thumbnail";

const prisma = new PrismaClient();

function cuid() {
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

const samplePosts = [
  {
    community: "documentaries",
    title: "Crumb (1994) Trailer",
    body: null,
    url: "https://www.youtube.com/watch?v=5cKJv1Q_8xE",
  },
  {
    community: "movies",
    title: "Blade Runner 2049 – Official Trailer",
    body: null,
    url: "https://www.youtube.com/watch?v=gCcx85zbxz4",
  },
  {
    community: "space",
    title: "NASA’s Artemis program overview",
    body: "Useful high-level summary of the current plan.",
    url: "https://www.nasa.gov/artemis/",
  },
  {
    community: "technology",
    title: "The quiet revolution in battery chemistry",
    body: "Solid-state batteries are finally moving from lab demos to real production timelines.",
    url: null,
  },
  {
    community: "programming",
    title: "Readable code vs clever code",
    body: "When do you deliberately choose the less clever solution?",
    url: null,
  },
  {
    community: "philosophy",
    title: "Is free will a useful fiction?",
    body: "Even if the metaphysics are muddy, does the concept still do important work?",
    url: null,
  },
  {
    community: "agora",
    title: "What would make this place more useful to you?",
    body: "Feature ideas, norms, anything.",
    url: null,
  },
];

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No users found.");
    process.exit(1);
  }

  console.log(`Posting as ${user.username}...`);
  let created = 0;

  for (const item of samplePosts) {
    const community = await prisma.community.findUnique({
      where: { name: item.community },
    });

    if (!community) {
      console.log(`Skipping missing community: ${item.community}`);
      continue;
    }

    let thumbnail: string | null = null;
    if (item.url) {
      thumbnail = await fetchThumbnail(item.url);
    }

    const now = new Date();

    await prisma.post.create({
      data: {
        id: cuid(),
        title: item.title,
        body: item.body,
        url: item.url,
        thumbnail,
        communityId: community.id,
        authorId: user.id,
        moderationStatus: "approved",
        score: Math.floor(Math.random() * 30),
        commentCount: 0,
        createdAt: now,
        updatedAt: now,
      },
    });

    created++;
    console.log(`Created: ${item.title}`);
  }

  console.log(`\nDone. Created ${created} posts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
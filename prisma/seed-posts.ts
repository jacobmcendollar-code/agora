import { PrismaClient } from "@prisma/client";
import { fetchThumbnail } from "../src/lib/thumbnail";

const prisma = new PrismaClient();

const samplePosts = [
  // Link posts (should get thumbnails)
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
    title: "The state of solid-state batteries",
    body: "A clear overview of where the technology actually stands.",
    url: "https://www.nature.com/articles/s41560-023-01423-4",
  },
  {
    community: "music",
    title: "A performance worth watching all the way through",
    body: null,
    url: "https://www.youtube.com/watch?v=5anLPw0Efmo",
  },
  {
    community: "science",
    title: "JWST deep field images",
    body: "Still hard to look at these without feeling something.",
    url: "https://www.nasa.gov/image-detail/stsci-01ga76rm1h85q9b9y6j9g7j7k7/",
  },
  {
    community: "baseball",
    title: "Interesting defensive metrics explainer",
    body: null,
    url: "https://www.youtube.com/watch?v=8bYp8y0x0x0",
  },
  {
    community: "funny",
    title: "This still holds up",
    body: null,
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },

  // Text posts
  { community: "technology", title: "The quiet revolution in battery chemistry", body: "Solid-state batteries are finally moving from lab demos to real production timelines. What are you most optimistic about?", url: null },
  { community: "technology", title: "Why local-first software is having a moment", body: "After years of pure cloud dependence, more tools are keeping your data on your device by default.", url: null },
  { community: "programming", title: "What’s your least favorite language feature that you still use daily?", body: "We all have one.", url: null },
  { community: "programming", title: "Readable code vs clever code", body: "When do you deliberately choose the less clever solution?", url: null },
  { community: "artificial-intelligence", title: "AI coding tools: productivity gain or attention tax?", body: "Honest experiences only.", url: null },
  { community: "science", title: "Most underrated scientific paper of the last decade?", body: "Share one that changed how you think.", url: null },
  { community: "space", title: "Starship flight cadence in 2026", body: "What would count as a successful year for orbital flights?", url: null },
  { community: "privacy-security", title: "Password managers vs passkeys in real life", body: "Which are you actually using day to day?", url: null },
  { community: "philosophy", title: "Is free will a useful fiction?", body: "Even if the metaphysics are muddy, does the concept still do important work?", url: null },
  { community: "free-speech", title: "When does moderation stop being about safety and start being about taste?", body: "Looking for clear examples, not slogans.", url: null },
  { community: "critical-thinking", title: "A bias you caught yourself in recently", body: "Concrete examples welcome.", url: null },
  { community: "history", title: "A historical parallel that is overused", body: "Which comparison do you wish people would stop making?", url: null },
  { community: "futurism", title: "What should we stop worrying about by 2035?", body: "And what should we start worrying about instead?", url: null },
  { community: "psychology", title: "The gap between what people say they value and what they actually optimize for", body: "Examples from work or daily life.", url: null },
  { community: "culture", title: "Cultural trends that aged poorly faster than expected", body: "Things that felt inevitable five years ago and now feel dated.", url: null },
  { community: "media", title: "Trust in media is low. What would actually rebuild it?", body: "Not 'be more trustworthy' — concrete mechanisms.", url: null },
  { community: "education", title: "What should schools stop teaching and start teaching?", body: "One of each.", url: null },
  { community: "work-careers", title: "The best career advice you ignored and later regretted", body: null, url: null },
  { community: "personal-finance", title: "Simple money rules that actually stuck", body: "Not the ones that sound good — the ones you still follow.", url: null },
  { community: "movies", title: "A film that improved on every rewatch", body: "What changed for you the second or third time?", url: null },
  { community: "television", title: "Shows that knew when to end", body: "Rarity worth celebrating.", url: null },
  { community: "books", title: "A book that changed a practical decision you made", body: "Not just 'made me think differently' — an actual decision.", url: null },
  { community: "gaming", title: "Games that respect your time", body: "What does that mean to you in practice?", url: null },
  { community: "health", title: "Small health habits with outsized returns", body: "Things that took almost no willpower but mattered.", url: null },
  { community: "fitness", title: "Training consistency over optimization", body: "How do you keep showing up when motivation is low?", url: null },
  { community: "food", title: "Weeknight meals that still feel like real cooking", body: "Under 30–40 minutes.", url: null },
  { community: "travel", title: "Places that were better than the hype", body: "And places that weren't.", url: null },
  { community: "relationships", title: "A relationship skill you learned later than you should have", body: null, url: null },
  { community: "parenting", title: "What you wish someone had told you before kids", body: "Practical, not sentimental.", url: null },
  { community: "sports", title: "The most interesting tactical shift in your sport right now", body: null, url: null },
  { community: "outdoors", title: "Gear you stopped bringing and never missed", body: "Overpacking lessons.", url: null },
  { community: "cars", title: "Cars that aged better than expected", body: "Design, reliability, or both.", url: null },
  { community: "diy-home", title: "The home project that paid for itself fastest", body: null, url: null },
  { community: "gardening", title: "What failed in your garden this year and what you learned", body: null, url: null },
  { community: "pets", title: "Training advice that actually worked with your dog or cat", body: null, url: null },
  { community: "entrepreneurship", title: "The unsexy part of starting something that surprised you", body: null, url: null },
  { community: "investing", title: "A financial assumption you changed after real experience", body: null, url: null },
  { community: "learning", title: "How you actually learn hard things now", body: "Process, not motivation talk.", url: null },
  { community: "humor", title: "The most mid joke that somehow still lands", body: null, url: null },
  { community: "interesting", title: "A fact you recently learned that you keep thinking about", body: null, url: null },
  { community: "recommendations", title: "Something excellent that almost nobody talks about", body: "Tools, places, media, anything.", url: null },
  { community: "stories", title: "A small decision that quietly changed your trajectory", body: null, url: null },
  { community: "agora", title: "What would make this place more useful to you?", body: "Feature ideas, norms, anything.", url: null },
  { community: "baseball", title: "Most underrated skill in baseball", body: "What doesn’t show up in highlight reels?", url: null },
];

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No users found. Create an account first.");
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
      console.log(`  Fetching thumbnail for: ${item.title}`);
      thumbnail = await fetchThumbnail(item.url);
    }

    await prisma.post.create({
      data: {
        title: item.title,
        body: item.body,
        url: item.url,
        thumbnail,
        communityId: community.id,
        authorId: user.id,
        moderationStatus: "approved",
        score: Math.floor(Math.random() * 45) - 5,
        commentCount: 0,
      },
    });

    created++;
    console.log(`Created: ${item.title}${thumbnail ? " (with thumbnail)" : ""}`);
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
export interface Note {
  date: string;
  text: string;
}

export interface Contact {
  id: string;
  name: string;
  lastContactedDaysAgo: number;
  summary: string;
  folder: string;
  avatarSeed: string;
  notes: Note[];
  tags: string[];
  topicClusters: string[];
  suggestedOutreach: string[];
  socials: {
    instagram?: string;
    linkedin?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
  };
}

const firstNames = [
  "Priya", "Raj", "Anjali", "Marcus", "Sofia", "Liam", "Yuki", "Omar",
  "Elena", "James", "Nisha", "Carlos", "Mei", "David", "Fatima", "Aiden",
  "Zara", "Noah", "Isla", "Arjun", "Clara", "Leo", "Amara", "Ethan",
  "Sana", "Felix", "Luna", "Hassan", "Mila", "Kai", "Ava", "Ravi",
  "Chloe", "Theo", "Leila", "Oscar", "Nina", "Samir", "Eva", "Max",
  "Rhea", "Ben", "Aisha", "Jack", "Tara", "Hugo", "Iris", "Vikram",
  "Ruby", "Axel", "Diya", "Sam", "Layla", "Finn", "Nia", "Alex",
  "Maya", "Tom", "Kira", "Dan", "Sara", "Jay", "Lina", "Cole",
  "Hana", "Luke", "Vera", "Nico", "Alba", "Ryan", "Freya", "Ash",
  "Jade", "Will", "Sia", "Ian", "Zoe", "Kit", "Ada", "Gus",
  "Mira", "Ed", "Liv", "Jude", "Remi", "Ace", "Sky", "Neo",
  "Ivy", "Eli", "Noor", "Cal", "Uma", "Rex", "Bea", "Rio",
  "Wren", "Pip", "Opal", "Jax",
];

const lastNames = [
  "Sharma", "Patel", "Williams", "Chen", "Garcia", "Kim", "Tanaka", "Ahmed",
  "Mueller", "Johnson", "Singh", "Rodriguez", "Liu", "Brown", "Ali", "O'Brien",
  "Costa", "Taylor", "Nakamura", "Hassan", "Dubois", "Anderson", "Fernandez", "Park",
  "Martin", "Kumar", "Wilson", "Santos", "Lee", "Clark", "Khan", "Davis",
  "Thompson", "Lopez", "Wright", "Hill", "Scott", "Green", "Adams", "Baker",
  "Nelson", "Carter", "Mitchell", "Perez", "Roberts", "Turner", "Phillips", "Campbell",
  "Parker", "Evans",
];

const summaries = [
  "Works in AI research at DeepMind",
  "Consultant at McKinsey, thinking about Dubai",
  "Launching a climate tech startup",
  "Recently moved to London from NYC",
  "Product lead at Stripe",
  "Doing an MBA at LBS",
  "Angel investor, interested in fintech",
  "Works in healthcare AI",
  "Just had a baby, on parental leave",
  "Running a VC fund focused on Africa",
  "Software engineer at Google",
  "Freelance designer, into padel",
  "Policy advisor at UK government",
  "Chef turned food-tech founder",
  "PhD in neuroscience at UCL",
  "Marketing director at Unilever",
  "Crypto trader, lives in Lisbon",
  "Journalist covering Middle East",
  "Real estate developer in Dubai",
  "Teaching at Imperial College",
  "Building a D2C fashion brand",
  "Ex-Goldman, now at a hedge fund",
  "Non-profit work in education",
  "Runs a podcast about leadership",
  "Data scientist at Spotify",
  "Architect, designing co-living spaces",
  "Just finished a round of fundraising",
  "Training for an ironman",
  "Moving to Singapore next month",
  "Writing a book on mindfulness",
  "Early employee at a unicorn startup",
  "Working on autonomous vehicles",
  "Recently got engaged",
  "Just returned from sabbatical in Japan",
  "Exploring a career switch to teaching",
  "Passionate about sustainable fashion",
  "Running a community kitchen project",
  "Looking for co-founders",
  "Into rock climbing and photography",
  "Works in renewable energy policy",
];

const noteTemplates = [
  (name: string) => `Met ${name} for coffee today. We talked about career goals and where we both see ourselves in five years. They mentioned wanting to explore opportunities in the Middle East.`,
  (name: string) => `Bumped into ${name} at the LBS mixer. We had a great chat about the startup scene in London. They recommended a few podcasts on venture capital I should check out.`,
  (name: string) => `Had lunch with ${name}. They're going through a career transition and seemed a bit stressed. I offered to connect them with a recruiter I know.`,
  (name: string) => `${name} and I caught up over drinks. They just got back from a trip to Tokyo and couldn't stop talking about the food scene there. We should plan a dinner soon.`,
  (name: string) => `Quick call with ${name} about the side project idea. They're really keen to collaborate on the AI tool concept. We agreed to sketch out an MVP this weekend.`,
  (name: string) => `Ran into ${name} at the gym. They mentioned they've been getting into padel and invited me to play next week. Also talked about their new apartment search.`,
  (name: string) => `${name} reached out about a job opening at their company. Sounds like a solid role in product management. I said I'd think about it and get back to them.`,
  (name: string) => `Had a deep conversation with ${name} about work-life balance. They've been feeling burnt out and are considering taking a sabbatical. I shared some resources on mindfulness.`,
  (name: string) => `${name} invited me to their birthday dinner next month. They're keeping it small, just close friends. Need to figure out a gift — they mentioned loving Japanese whisky.`,
  (name: string) => `Grabbed breakfast with ${name} before class. We brainstormed ideas for the hackathon. They have a strong background in NLP which could be super useful for our project.`,
  (name: string) => `${name} called to catch up. They just closed a funding round and sounded really excited. We talked about what it takes to scale a team from 5 to 20 people.`,
  (name: string) => `Went for a walk with ${name} in Regent's Park. They opened up about feeling disconnected from old friends since moving to London. We made a plan to do monthly catch-ups.`,
  (name: string) => `${name} sent me an article about climate tech trends. We had a back-and-forth over text about it. They're really passionate about sustainability and circular economy.`,
  (name: string) => `Met ${name} at a networking event. They work in healthcare AI and had fascinating insights about patient data privacy. Exchanged numbers and agreed to grab coffee soon.`,
  (name: string) => `${name} and I played chess at the park. They're surprisingly good — beat me twice. We also talked about their recent trip to Barcelona and the architecture there.`,
  (name: string) => `Video call with ${name} to discuss the book club pick. They had a completely different take on the ending. Great conversation about storytelling and narrative structure.`,
  (name: string) => `${name} asked for advice on their MBA application essay. Spent about an hour going through it together. Their story about pivoting from finance to social impact is compelling.`,
  (name: string) => `Caught up with ${name} after not talking for a while. They've been heads down building their startup. They demoed their product and it's actually really impressive.`,
  (name: string) => `${name} recommended a restaurant in Soho — we should try it. They also mentioned they're training for a marathon and looking for a running buddy on weekends.`,
  (name: string) => `Had ${name} over for dinner. We cooked pasta together and talked about travel plans for the summer. They're thinking Portugal or Greece. Might plan a group trip.`,
  (name: string) => `${name} introduced me to their colleague who works in renewable energy. Great connection — we exchanged ideas about how AI could optimize energy grids.`,
  (name: string) => `Met ${name} at a co-working space. They're freelancing now and seem to love the flexibility. We discussed the pros and cons of remote vs. office work.`,
  (name: string) => `${name} shared some exciting news — they're expecting! Really happy for them. We talked about how parenthood changes priorities and time management.`,
  (name: string) => `Attended ${name}'s talk at the conference. They presented on the future of personal finance tools. Super polished delivery. Congrats-ed them after and chatted briefly.`,
  (name: string) => `${name} and I went to a cocktail-making class. So much fun. They're naturally creative and came up with a drink that was actually better than the instructor's recipe.`,
];

const tagPool = [
  "AI", "entrepreneurship", "padel", "cocktails", "chess", "running", "travel",
  "fintech", "sustainability", "MBA", "investing", "food", "photography",
  "music", "yoga", "crypto", "healthcare", "design", "writing", "mentorship",
  "climate tech", "real estate", "marketing", "leadership", "fashion",
  "podcasts", "fitness", "mindfulness", "art", "gaming",
];

const topicPool = [
  "Career Growth", "Startup Ideas", "Investment Strategy", "Travel & Culture",
  "Health & Wellness", "Tech Trends", "Personal Development", "Food & Dining",
  "Creative Projects", "Sports & Fitness", "MBA Life", "Work-Life Balance",
  "Networking", "Social Impact", "Future of Work", "Relationships & Family",
  "Books & Learning", "City Living", "Side Projects", "Industry Trends",
];

const outreachPool = [
  "Ask for a coffee chat",
  "Suggest watching a movie together",
  "Invite to a padel session",
  "Share an article they'd find interesting",
  "Recommend a podcast episode",
  "Invite to a dinner party",
  "Suggest a weekend hike",
  "Ask about their recent project",
  "Invite to a networking event",
  "Send a birthday message",
  "Offer to intro them to someone",
  "Suggest a book swap",
  "Plan a co-working day",
  "Invite to a cocktail night",
  "Ask to grab lunch this week",
  "Share a job posting they'd like",
  "Suggest a chess match",
  "Invite to a group workout",
  "Recommend a restaurant to try together",
  "Ask how their big project is going",
];

const folders = ["All", "Inner Circle", "LBS Cohort", "Professional", "Family", "Startup Network"];

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pickN<T>(arr: T[], count: number, seed: number): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

function generateNotes(name: string, seed: number): Note[] {
  const firstName = name.split(" ")[0];
  const count = Math.floor(seededRandom(seed * 3) * 6) + 1; // 1-6 notes
  const picked = pickN(noteTemplates, count, seed * 17);
  return picked.map((template, i) => {
    const daysAgo = Math.floor(seededRandom(seed * 11 + i) * 120) + 1;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return {
      date: date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      text: template(firstName),
    };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const contacts: Contact[] = firstNames.map((firstName, i) => {
  const lastName = lastNames[i % lastNames.length];
  const seed = i + 1;
  const fullName = `${firstName} ${lastName}`;
  return {
    id: `contact-${i + 1}`,
    name: fullName,
    lastContactedDaysAgo: Math.floor(seededRandom(seed * 7) * 90) + 1,
    summary: summaries[i % summaries.length],
    folder: i === 0 ? "All" : folders[Math.floor(seededRandom(seed * 13) * folders.length)],
    avatarSeed: `${firstName}-${lastName}-${i}`,
    notes: generateNotes(fullName, seed),
    tags: pickN(tagPool, Math.floor(seededRandom(seed * 19) * 5) + 2, seed * 23),
    topicClusters: pickN(topicPool, Math.floor(seededRandom(seed * 29) * 4) + 2, seed * 31),
    suggestedOutreach: pickN(outreachPool, 3, seed * 37),
    socials: {
      instagram: `@${firstName.toLowerCase()}${lastName.toLowerCase()}`,
      linkedin: `${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
      phone: `+44 7${Math.floor(seededRandom(seed * 53) * 900000000 + 100000000)}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      whatsapp: `+44 7${Math.floor(seededRandom(seed * 67) * 900000000 + 100000000)}`,
    },
  };
});

export function getContactById(id: string): Contact | undefined {
  return contacts.find((c) => c.id === id);
}

export const folderStructure = folders.map((folder) => ({
  name: folder,
  count: folder === "All" ? contacts.length : contacts.filter((c) => c.folder === folder).length,
}));

import type { StorySeed } from '@katha/shared';

export const STORY_SEEDS: StorySeed[] = [
  // ─── Bedtime ─────────────────────────────────────────────

  {
    id: 'bedtime-moon-rabbit',
    mode: 'bedtime',
    title: 'The Moon Rabbit',
    titleLocalized: {
      hi: 'चाँद का खरगोश',
      ta: 'நிலா முயல்',
      te: 'చంద్ర కుందేలు',
      bn: 'চাঁদের খরগোশ',
    },
    description: 'A little rabbit living on the moon decides to visit Earth for the first time.',
    openingPrompt:
      'Tell a gentle bedtime story about a small rabbit who lives on the moon. One night, the rabbit sees the Earth glowing below and decides to slide down a moonbeam to explore. The story should be warm, dreamy, and end peacefully.',
    suggestedTones: ['calm'],
    tags: ['animals', 'space', 'adventure', 'peaceful'],
    minAge: 3,
  },
  {
    id: 'bedtime-sleepy-river',
    mode: 'bedtime',
    title: 'The Sleepy River',
    titleLocalized: {
      hi: 'सुस्ता हुई नदी',
      ta: 'தூக்கமான நதி',
      bn: 'ঘুমন্ত নদী',
    },
    description: 'A river that carries dreams to every village it passes through.',
    openingPrompt:
      'Tell a dreamy bedtime story about a magical river in India that flows through villages at night, carrying beautiful dreams to every child sleeping on its banks. A little girl discovers she can talk to the river.',
    suggestedTones: ['calm'],
    tags: ['nature', 'magic', 'dreams', 'village'],
    minAge: 4,
  },

  // ─── Warrior / Success ───────────────────────────────────

  {
    id: 'warrior-young-archer',
    mode: 'warrior_success',
    title: 'The Young Archer',
    titleLocalized: {
      hi: 'युवा तीरंदाज',
      ta: 'இளம் வில்லாளி',
      te: 'యువ విలుకాడు',
      mr: 'तरुण धनुर्धर',
    },
    description: 'A village girl trains to become the greatest archer in the kingdom.',
    openingPrompt:
      'Tell an exciting story about a young girl from a small Indian village who discovers she has extraordinary talent with a bow and arrow. She must overcome doubt from her village, train in secret, and ultimately compete in the royal archery tournament.',
    suggestedTones: ['energetic', 'calm'],
    tags: ['archery', 'training', 'competition', 'girl-power'],
    minAge: 6,
  },
  {
    id: 'warrior-cricket-dream',
    mode: 'warrior_success',
    title: 'Gully Cricket to Glory',
    titleLocalized: {
      hi: 'गली क्रिकेट से शिखर तक',
      ta: 'தெரு கிரிக்கெட் முதல் வெற்றி வரை',
      bn: 'গলি ক্রিকেট থেকে গৌরব',
    },
    description: 'A boy from the streets dreams of playing cricket for India.',
    openingPrompt:
      'Tell a rousing story about a boy who plays cricket with a taped tennis ball in the narrow gullies of Mumbai. A retired coach spots his raw talent. The boy must balance studies, family expectations, and gruelling practice to chase his dream of wearing the blue jersey.',
    suggestedTones: ['energetic', 'funny'],
    tags: ['cricket', 'sports', 'mumbai', 'dreams'],
    minAge: 7,
  },

  // ─── Mythology ───────────────────────────────────────────

  {
    id: 'myth-hanuman-mountain',
    mode: 'mythology',
    title: "Hanuman's Great Leap",
    titleLocalized: {
      hi: 'हनुमान की महान छलांग',
      ta: 'அனுமனின் பெரும் பாய்ச்சல்',
      te: 'హనుమంతుని గొప్ప లంఘనం',
      kn: 'ಹನುಮಂತನ ಮಹಾ ಜಿಗಿತ',
    },
    description: 'Hanuman leaps across the ocean to find Sita in Lanka.',
    openingPrompt:
      'Retell the story of Hanuman preparing to leap across the vast ocean to Lanka. Include the moment the other vanaras doubt it can be done, Jambavan reminding Hanuman of his true power, and the epic leap itself. Make it vivid, heroic, and full of devotion.',
    suggestedTones: ['energetic', 'calm'],
    tags: ['ramayana', 'hanuman', 'devotion', 'courage'],
    minAge: 5,
  },
  {
    id: 'myth-ganesha-moon',
    mode: 'mythology',
    title: 'Ganesha and the Laughing Moon',
    titleLocalized: {
      hi: 'गणेश और हँसता चाँद',
      ta: 'கணேஷும் சிரிக்கும் நிலவும்',
      mr: 'गणेश आणि हसणारा चंद्र',
    },
    description: 'Why we don\'t look at the moon on Ganesh Chaturthi.',
    openingPrompt:
      'Tell the Panchatantra-style story of Lord Ganesha riding his mouse after eating too many laddoos. When the mouse stumbles and Ganesha falls, the moon laughs at him. Ganesha curses the moon never to be looked at on Chaturthi. Make it humorous yet respectful.',
    suggestedTones: ['funny', 'calm'],
    tags: ['ganesha', 'moon', 'chaturthi', 'humour'],
    minAge: 4,
  },
  {
    id: 'myth-panchatantra-monkey',
    mode: 'mythology',
    title: 'The Clever Monkey and the Crocodile',
    titleLocalized: {
      hi: 'चालाक बंदर और मगरमच्छ',
      ta: 'புத்திசாலி குரங்கும் முதலையும்',
      te: 'తెలివైన కోతి మరియు మొసలి',
    },
    description: 'A classic Panchatantra tale of wit over brute strength.',
    openingPrompt:
      'Retell the Panchatantra fable of the monkey who lives in a rose-apple tree by the river and befriends a crocodile. The crocodile\'s wife wants to eat the monkey\'s heart. The monkey must use his wits to escape. Emphasise the moral about true friendship and cleverness.',
    suggestedTones: ['funny', 'calm'],
    tags: ['panchatantra', 'animals', 'friendship', 'wit'],
    minAge: 4,
  },

  // ─── Motivation ──────────────────────────────────────────

  {
    id: 'motivation-rocket-girl',
    mode: 'motivation',
    title: 'Rocket Girl of Sriharikota',
    titleLocalized: {
      hi: 'श्रीहरिकोटा की रॉकेट लड़की',
      ta: 'ஸ்ரீஹரிகோட்டாவின் ராக்கெட் பெண்',
      te: 'శ్రీహరికోట రాకెట్ అమ్మాయి',
    },
    description: 'A girl from a fishing village dreams of working at ISRO.',
    openingPrompt:
      'Tell an inspiring story about a 12-year-old girl from a fishing village near Sriharikota who watches rockets launch from her rooftop. She dreams of becoming a rocket scientist at ISRO. Show her journey through obstacles: poverty, lack of resources, doubt from others — and how determination, a kind teacher, and her own brilliance get her there.',
    suggestedTones: ['energetic', 'calm'],
    tags: ['ISRO', 'science', 'girl-power', 'village', 'space'],
    minAge: 8,
  },
  {
    id: 'motivation-chai-entrepreneur',
    mode: 'motivation',
    title: 'The Chai Startup',
    titleLocalized: {
      hi: 'चाय का स्टार्टअप',
      ta: 'டீ ஸ்டார்ட்அப்',
      bn: 'চায়ের স্টার্টআপ',
    },
    description: 'A college student turns a humble chai stall into a nationwide brand.',
    openingPrompt:
      'Tell a motivating story about a college dropout who starts making chai with his grandmother\'s secret masala recipe on a bicycle-cart in Ahmedabad. Through failures, a viral social media moment, and sheer grit, the chai stall grows into a beloved national brand. Show the ups and downs with heart.',
    suggestedTones: ['funny', 'energetic'],
    tags: ['entrepreneur', 'chai', 'startup', 'business'],
    minAge: 10,
  },
];

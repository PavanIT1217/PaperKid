// Search-engine copy for every page. Used both by the build-time prerender (static HTML,
// titles, meta tags, structured data, sitemap) and in the app (title + "About" section).

export const SITE = {
  name: 'PaperKid',
  url: 'https://paperkid.webappslab.com',
  tagline: 'Free printable worksheets for kids',
  description:
    'Free printable worksheets for Pre-K, Kindergarten and Grades 1–3: letter and number tracing with stroke-order arrows, name tracing, sight words, cursive, math, clocks, money, mazes, dot-to-dots and coloring pages. Make a PDF in seconds.',
  image: 'https://paperkid.webappslab.com/og-image.png',
};

export interface Faq {
  q: string;
  a: string;
}

export interface PageCopy {
  /** worksheet id in the app */
  id: string;
  /** URL path segment, e.g. "letter-tracing-worksheets" */
  slug: string;
  /** <title>, ~60 chars */
  title: string;
  /** meta description, ~150 chars */
  description: string;
  h1: string;
  intro: string;
  bullets: string[];
  faq: Faq[];
  /** schema.org educationalLevel */
  levels: string[];
  keywords: string[];
}

const PDF_FAQ: Faq = {
  q: 'Are these worksheets free?',
  a: 'Yes. Every PaperKid worksheet is free to make, download as a PDF and print at home or school. No sign-up is needed; signing in with Google only adds syncing of saved worksheets and progress.',
};

const PAPER_FAQ: Faq = {
  q: 'Which paper size do the worksheets use?',
  a: 'Worksheets are made for A4 by default and can be switched to US Letter in one click. Pages are vector-sharp at 200 dpi, so they print crisply on any home printer.',
};

export const PAGES: PageCopy[] = [
  {
    id: 'letters',
    slug: 'letter-tracing-worksheets',
    title: 'Free Letter Tracing Worksheets A–Z (Printable PDF)',
    description:
      'Printable alphabet tracing worksheets with stroke-order arrows, dotted letters, picture words and fading practice. Upper and lower case A–Z for Pre-K and Kindergarten.',
    h1: 'Letter tracing worksheets A–Z',
    intro:
      'Teach handwriting the way teachers do: a big model letter shows where to start and which way to go, then children trace dotted letters on proper handwriting lines and finish by writing on their own. Pick any letters, upper case, lower case or both, and download one page per letter.',
    bullets: [
      'Numbered start dots and arrows show the correct stroke order',
      'Dotted letters on handwriting lines (top, dashed middle, baseline)',
      'Picture word for every letter – “A is for Apple”',
      'Optional fading practice: dark dots → light dots → start dots only',
      'Three writing sizes for Pre-K, Kindergarten and Grades 1–3',
    ],
    faq: [
      {
        q: 'What age are letter tracing worksheets for?',
        a: 'Most children start tracing letters between 3 and 5 years old (Pre-K and Kindergarten). The large size suits beginners; medium and small sizes suit Grades 1–3.',
      },
      {
        q: 'Should children learn capital or lowercase letters first?',
        a: 'Many teachers start with capitals because they are made of simple straight lines and curves, then add lowercase letters. PaperKid lets you print capitals, lowercase or both on the same page.',
      },
      PDF_FAQ,
    ],
    levels: ['Pre-K', 'Kindergarten', 'Grade 1'],
    keywords: ['letter tracing worksheets', 'alphabet tracing', 'ABC tracing printable', 'handwriting practice'],
  },
  {
    id: 'words',
    slug: 'name-tracing-sight-word-worksheets',
    title: 'Name Tracing & Sight Word Worksheets – Free Printable',
    description:
      "Make free name tracing worksheets with your child's name, custom spelling words or Dolch sight words from Pre-K to Grade 3. Dotted words on handwriting lines.",
    h1: 'Name tracing and sight word worksheets',
    intro:
      'Type your child’s name, this week’s spelling words or a short sentence and get dotted tracing rows instantly. Or choose a grade-level Dolch sight-word list and print a page for every word.',
    bullets: [
      "Personalised name tracing – type any name",
      'Dolch sight-word lists for Pre-K, Kindergarten, Grade 1, 2 and 3',
      'Short sentences such as “I can read!” trace just as easily',
      'Choose rows per word and writing size',
      'Optional stroke-order arrows and fading practice',
    ],
    faq: [
      {
        q: 'How do I make a name tracing worksheet?',
        a: 'Choose “My own words / name”, type the name on its own line, pick a writing size and download the PDF. Each word gets a model row and dotted rows to trace.',
      },
      {
        q: 'What are Dolch sight words?',
        a: 'Dolch sight words are the most common words in children’s books, grouped by grade. Recognising them by sight helps children read fluently.',
      },
      PDF_FAQ,
    ],
    levels: ['Pre-K', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3'],
    keywords: ['name tracing worksheet', 'sight word worksheets', 'dolch sight words printable', 'spelling practice'],
  },
  {
    id: 'cursive',
    slug: 'cursive-writing-worksheets',
    title: 'Free Cursive Writing Worksheets – Letters & Words PDF',
    description:
      'Printable cursive handwriting worksheets for Grades 2–3: trace each joined-up letter, then whole words and sentences. Upper and lower case.',
    h1: 'Cursive writing worksheets',
    intro:
      'Ready for joined-up writing? Children trace each cursive letter in grey, upper and lower case, then move on to whole words and sentences of your choice.',
    bullets: [
      'Every cursive letter a–z, upper and lower case',
      'Custom words and sentences in cursive',
      'Grey letters to trace, then empty lines to practise',
      'Medium and small sizes for Grades 2 and 3',
    ],
    faq: [
      { q: 'When do children learn cursive?', a: 'Cursive is usually introduced in Grade 2 or Grade 3, once print handwriting is confident.' },
      PDF_FAQ,
    ],
    levels: ['Grade 2', 'Grade 3'],
    keywords: ['cursive worksheets', 'cursive handwriting practice', 'cursive letters printable'],
  },
  {
    id: 'scripts',
    slug: 'alphabet-tracing-other-languages',
    title: 'Hindi & Telugu Alphabet Tracing Worksheets – Free PDF',
    description:
      'Trace the vowels and consonants of other writing systems, currently Hindi (Devanagari) and Telugu. One big letter per page or six letters per page.',
    h1: 'Alphabet tracing in other languages',
    intro:
      'Practise the letters of another writing system with grey letters to trace and space to write. Choose vowels, consonants or the full set, one big letter per page or six per page.',
    bullets: ['Hindi (Devanagari) vowels and consonants', 'Telugu vowels and consonants', 'One big letter per page or six letters per page'],
    faq: [PDF_FAQ],
    levels: ['Pre-K', 'Kindergarten', 'Grade 1', 'Grade 2'],
    keywords: ['hindi alphabet tracing', 'telugu letters worksheet', 'varnamala worksheet'],
  },
  {
    id: 'lines',
    slug: 'pre-writing-tracing-lines',
    title: 'Pre-Writing Tracing Lines Worksheets for Toddlers – Free',
    description:
      'Free pre-writing worksheets: trace straight lines, zigzags, waves, loops and curves from one picture to another. Builds pencil control for toddlers and Pre-K.',
    h1: 'Pre-writing tracing lines',
    intro:
      'Before letters come lines. Children trace dotted paths – help the bee reach the flower, the dog find its bone – building the pencil control they need for handwriting.',
    bullets: [
      '10 patterns: straight, standing, slanted, zigzag, mountains, waves, rainbows, cups, castles and loops',
      'Green start dot on every path',
      'Fun picture at each end of the path',
    ],
    faq: [
      { q: 'What are pre-writing skills?', a: 'Pre-writing skills are the strokes – lines, curves and circles – that make up letters. Practising them builds the hand control needed for writing.' },
      PDF_FAQ,
    ],
    levels: ['Toddler', 'Pre-K', 'Kindergarten'],
    keywords: ['pre writing worksheets', 'tracing lines worksheets', 'fine motor worksheets', 'toddler tracing'],
  },
  {
    id: 'reading',
    slug: 'sight-word-sentences-reading-worksheets',
    title: 'Sight Word Sentence Worksheets – Read, Trace & Color',
    description:
      'Beginner reading worksheets: read a short sight-word sentence, color the picture, then trace and write the sentence. Free printable for Kindergarten and Grade 1.',
    h1: 'I Can Read! sentence worksheets',
    intro:
      'Each sentence uses simple sight words and comes with a picture to color, so children read for meaning, then trace and write the sentence themselves.',
    bullets: ['13 picture sentences such as “The cat can jump.”', 'Color instructions that check understanding', 'Trace row and write row for every sentence'],
    faq: [PDF_FAQ],
    levels: ['Kindergarten', 'Grade 1'],
    keywords: ['sight word sentences', 'beginning reading worksheets', 'read and color worksheets'],
  },
  {
    id: 'phonics',
    slug: 'phonics-alphabet-worksheets',
    title: 'Beginning Sounds & Alphabet Worksheets – Free Phonics PDF',
    description:
      'Free phonics worksheets: circle the beginning sound, fill in missing letters and match upper and lower case letters. With answer keys, for Pre-K to Grade 1.',
    h1: 'Phonics and alphabet games',
    intro: 'Three activities that build letter knowledge: beginning sounds with pictures, missing letters in the alphabet and matching big and little letters.',
    bullets: ['Beginning sounds: say the picture, circle the letter', 'Missing letters: A _ C D _ F', 'Match upper case to lower case', 'Answer key pages'],
    faq: [PDF_FAQ],
    levels: ['Pre-K', 'Kindergarten', 'Grade 1'],
    keywords: ['beginning sounds worksheets', 'missing letters worksheet', 'upper and lowercase matching', 'phonics worksheets'],
  },
  {
    id: 'numbers',
    slug: 'number-tracing-worksheets',
    title: 'Number Tracing Worksheets 0–20 – Free Printable PDF',
    description:
      'Printable number tracing worksheets 0–20 with stroke-order arrows, ten frames, counting pictures and number words. For Pre-K, Kindergarten and Grade 1.',
    h1: 'Number tracing worksheets 0–20',
    intro: 'One page per number: a big model with arrows, a ten frame to count or color, the number word to trace and rows of dotted numbers.',
    bullets: ['Numbers 0 to 20', 'Ten frames: count pictures or color boxes', 'Trace the number word (one, two, three…)', 'Stroke-order arrows and fading practice'],
    faq: [
      { q: 'How do ten frames help children count?', a: 'A ten frame shows a number as filled boxes in two rows of five, helping children see amounts without counting one by one.' },
      PDF_FAQ,
    ],
    levels: ['Pre-K', 'Kindergarten', 'Grade 1'],
    keywords: ['number tracing worksheets', 'tracing numbers 1-20', 'ten frame worksheets', 'counting worksheets'],
  },
  {
    id: 'math',
    slug: 'math-worksheets',
    title: 'Free Math Worksheets – Addition, Subtraction & Times Tables',
    description:
      'Printable math worksheets with fresh problems every time: picture addition, sums within 10 and 20, 2- and 3-digit, times tables and division, with answer keys.',
    h1: 'Math practice worksheets',
    intro:
      'Generate unlimited math practice at the right level – from counting pictures to times tables. Every click of “New problems” makes a fresh page, with an answer key if you need one.',
    bullets: ['Picture math for little ones', 'Addition and subtraction within 5, 10, 20, 2-digit and 3-digit', 'Times tables and division up to 12 × 12', 'Column or in-line layout', 'Answer key pages'],
    faq: [
      { q: 'Can I make a new worksheet each day?', a: 'Yes – press “New problems” for a fresh set, or use the Daily Practice page which changes automatically every day.' },
      PDF_FAQ,
    ],
    levels: ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3'],
    keywords: ['math worksheets', 'addition worksheets', 'subtraction worksheets', 'times tables worksheets', 'multiplication worksheets'],
  },
  {
    id: 'numbersense',
    slug: 'number-sense-worksheets',
    title: 'Number Bonds, 100 Chart & Skip Counting Worksheets – Free',
    description:
      'Number sense worksheets: number bonds, fill-in 100 chart, odd and even, skip counting, before/after/between and greater than/less than, with answer keys.',
    h1: 'Number sense worksheets',
    intro: 'Six activities that build a deep feel for numbers, each with fresh numbers on every print and an answer key.',
    bullets: ['Number bonds within 10 or 20', '100 chart – full, some missing or mostly empty', 'Odd and even coloring', 'Skip counting by 2s, 3s, 5s and 10s', 'Before, after and between', 'Greater than, less than, equal'],
    faq: [PDF_FAQ],
    levels: ['Kindergarten', 'Grade 1', 'Grade 2'],
    keywords: ['number bonds worksheet', '100 chart printable', 'skip counting worksheets', 'greater than less than worksheet'],
  },
  {
    id: 'clocks',
    slug: 'telling-time-worksheets',
    title: 'Telling Time Worksheets – Read & Draw Clocks (Free PDF)',
    description:
      "Printable telling time worksheets: read the clock and write the time, or draw the hands. O'clock, half past, quarter hours, 5 minutes or any minute.",
    h1: 'Telling time worksheets',
    intro: 'Clear analogue clocks with every minute marked. Children either read the time and write it, or draw the hour and minute hands.',
    bullets: ["O'clock and half past for beginners", 'Quarter hours, 5-minute and 1-minute practice', 'Write the time or draw the hands', 'Answer key page'],
    faq: [PDF_FAQ],
    levels: ['Grade 1', 'Grade 2', 'Grade 3'],
    keywords: ['telling time worksheets', 'clock worksheets', 'draw the hands on the clock'],
  },
  {
    id: 'money',
    slug: 'counting-money-worksheets',
    title: 'Counting Money Worksheets – Coins & Notes (Free PDF)',
    description:
      'Count the coins and notes and write the total. Uses your country’s money: US, Canadian and Australian dollars, pounds, euros or rupees. With answer keys.',
    h1: 'Counting money worksheets',
    intro: 'Coins and notes drawn to scale with their values, biggest first, so children practise adding up real money.',
    bullets: ['Follows your country setting', 'Small, medium and big amounts', 'Coins only or coins and notes', 'Answer key pages'],
    faq: [PDF_FAQ],
    levels: ['Grade 1', 'Grade 2', 'Grade 3'],
    keywords: ['counting money worksheets', 'coin worksheets', 'money math printable'],
  },
  {
    id: 'mazes',
    slug: 'printable-mazes-for-kids',
    title: 'Printable Mazes for Kids – Easy to Hard (Free PDF)',
    description: 'Free printable mazes for kids, new every time: easy, medium, hard and expert, one or two per page, with answer pages.',
    h1: 'Printable mazes for kids',
    intro: 'Help the mouse find the cheese! Every maze is generated fresh, so you never run out – from big easy mazes for preschoolers to expert mazes for older kids.',
    bullets: ['Four difficulty levels', 'One big maze or two per page', 'Answer pages with the path in red'],
    faq: [PDF_FAQ],
    levels: ['Pre-K', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3'],
    keywords: ['mazes for kids', 'printable mazes', 'easy mazes', 'maze worksheets'],
  },
  {
    id: 'dots',
    slug: 'dot-to-dot-worksheets',
    title: 'Dot-to-Dot Printables for Kids – Numbers & Skip Counting',
    description: 'Free dot-to-dot (connect the dots) worksheets: join dots by numbers, letters or counting by 2s, 5s and 10s, then color the picture.',
    h1: 'Dot-to-dot worksheets',
    intro: 'Connect the dots in order to reveal a star, heart, rocket and more – then color it in. Great for number order and skip counting.',
    bullets: ['10, 20, 30 or 40 dots', 'Numbers, letters, or count by 2s, 5s and 10s', 'Word to trace under every picture'],
    faq: [PDF_FAQ],
    levels: ['Pre-K', 'Kindergarten', 'Grade 1', 'Grade 2'],
    keywords: ['dot to dot printables', 'connect the dots worksheets', 'skip counting dot to dot'],
  },
  {
    id: 'patterns',
    slug: 'pattern-worksheets',
    title: 'What Comes Next? Pattern Worksheets for Kids – Free',
    description: 'Free picture pattern worksheets: AB, AAB, ABB, ABC, AABB and ABCD patterns. Draw or circle what comes next. For Pre-K to Grade 1.',
    h1: 'What comes next? Pattern worksheets',
    intro: 'Spotting patterns is an early maths skill. Children look at each row of pictures and draw – or circle – what comes next.',
    bullets: ['Six pattern types', 'Fruit, animals, shapes, colors and more', 'Answers to circle for younger children'],
    faq: [PDF_FAQ],
    levels: ['Pre-K', 'Kindergarten', 'Grade 1'],
    keywords: ['pattern worksheets', 'what comes next worksheet', 'AB patterns'],
  },
  {
    id: 'shapes',
    slug: 'shape-tracing-worksheets',
    title: 'Shape Tracing Worksheets – Circle, Square, Star & More',
    description: 'Free shape tracing worksheets: trace and color circles, squares, triangles, stars, hearts, hexagons and more. For toddlers, Pre-K and Kindergarten.',
    h1: 'Shape tracing worksheets',
    intro: 'Twelve shapes to trace in rows or one big shape at a time to trace and color, with the shape name to trace.',
    bullets: ['12 shapes from circle to octagon', 'Trace rows or big trace-and-color pages', 'Shape name to trace'],
    faq: [PDF_FAQ],
    levels: ['Toddler', 'Pre-K', 'Kindergarten'],
    keywords: ['shape tracing worksheets', 'shapes for preschool', 'trace shapes printable'],
  },
  {
    id: 'coloring',
    slug: 'coloring-pages-for-kids',
    title: 'Simple Coloring Pages for Kids – Free Printable PDF',
    description: 'Free printable coloring pages with big, bold outlines that are easy to color: apple, sun, house, fish, rocket, butterfly and more, with a word to trace.',
    h1: 'Coloring pages for kids',
    intro: 'Bold, simple outlines that little hands can color inside, each with its name to trace underneath.',
    bullets: ['13 pictures', 'Thick lines that are easy to color', 'Word to trace under each picture'],
    faq: [PDF_FAQ],
    levels: ['Toddler', 'Pre-K', 'Kindergarten', 'Grade 1'],
    keywords: ['coloring pages for kids', 'easy coloring pages', 'printable coloring sheets'],
  },
  {
    id: 'packs',
    slug: 'workbook-packs',
    title: 'Free Printable Workbooks for Kids – Pre-K to Grade 3 PDF',
    description:
      'Download whole printable workbooks in one PDF: alphabet A–Z, numbers 0–20, Pre-K starter, Kindergarten week, Grade 1, Grade 2–3 and summer fun – with a certificate.',
    h1: 'Printable workbook packs',
    intro:
      'One click, one PDF: a cover page with contents, a full set of activities and a certificate at the end. Track progress in “My workbooks” and print the certificate when every part is done.',
    bullets: ['Seven ready-made packs', 'Cover page and contents', 'Certificate at the end', 'Progress checklist in My workbooks (synced when signed in)'],
    faq: [PDF_FAQ, PAPER_FAQ],
    levels: ['Pre-K', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3'],
    keywords: ['printable workbook', 'kindergarten workbook pdf', 'preschool activity book', 'summer workbook'],
  },
  {
    id: 'daily',
    slug: 'daily-practice-worksheet',
    title: "Today's Daily Practice Worksheet for Kids – Free",
    description:
      'A fresh printable practice page every day: letter of the day, quick math, word of the day or pencil path, and a picture to color. Print a day or a whole week.',
    h1: 'Daily practice worksheet',
    intro:
      'Ten minutes a day, one page: a letter to trace, six quick sums, a word or pencil path and a picture to color. Letters go A → Z and PaperKid remembers where you stopped.',
    bullets: ['Letter of the day in A → Z order', 'Math at your child’s level', 'Print 1–7 days with a weekly star chart', 'Math answer page'],
    faq: [PDF_FAQ],
    levels: ['Pre-K', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3'],
    keywords: ['daily practice worksheet', 'kindergarten daily worksheet', 'morning work printable'],
  },
  {
    id: 'rewards',
    slug: 'certificates-reward-charts',
    title: 'Printable Certificates & Reward Charts for Kids – Free',
    description: 'Free printable award certificates, weekly star charts and sticker charts for kids. Add your child’s name and your own award or tasks.',
    h1: 'Certificates and reward charts',
    intro: 'Celebrate progress with a certificate, or build good habits with a weekly star chart or sticker chart.',
    bullets: ['Award certificates – preset or your own wording', 'Weekly star chart with your own tasks', 'Sticker charts from 5 to 60 stickers'],
    faq: [PDF_FAQ],
    levels: ['Pre-K', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3'],
    keywords: ['printable certificates for kids', 'reward chart printable', 'sticker chart', 'star chart'],
  },
];

export const pageById = (id: string) => PAGES.find((p) => p.id === id);
export const pageBySlug = (slug: string) => PAGES.find((p) => p.slug === slug);

/** Copy for variant pages (/letter-tracing-worksheets/a/, /number-tracing-worksheets/5/, /workbook-packs/x/). */
export function variantCopy(base: PageCopy, variant: string, extra: { packTitle?: string; packBlurb?: string; word?: string } = {}): Partial<PageCopy> {
  if (base.id === 'letters') {
    const L = variant.toUpperCase();
    const l = variant.toLowerCase();
    return {
      title: `Letter ${L} Tracing Worksheet – Free Printable ${L}${l}`,
      description: `Free letter ${L} tracing worksheet: trace upper case ${L} and lower case ${l} with stroke-order arrows, dotted letters and a picture word${extra.word ? ` (${L} is for ${extra.word})` : ''}. Printable PDF.`,
      h1: `Letter ${L} tracing worksheet`,
      intro: `Practise writing the letter ${L} ${l}: follow the numbered arrows on the big model letter, trace the dotted ${L} and ${l} on handwriting lines, then write it on your own.${extra.word ? ` ${L} is for ${extra.word}!` : ''}`,
    };
  }
  if (base.id === 'numbers') {
    return {
      title: `Number ${variant} Tracing Worksheet – Free Printable PDF`,
      description: `Free number ${variant} tracing worksheet with stroke-order arrows, a ten frame to count, the number word to trace and rows of dotted ${variant}s.`,
      h1: `Number ${variant} tracing worksheet`,
      intro: `Learn to write the number ${variant}: trace it with the arrows, count ${variant} on the ten frame and trace the number word.`,
    };
  }
  if (base.id === 'packs') {
    return {
      title: `${extra.packTitle} Workbook – Free Printable PDF | PaperKid`,
      description: `${extra.packBlurb} Download the whole ${extra.packTitle} workbook as one free PDF with a cover page and certificate.`,
      h1: `${extra.packTitle} workbook`,
      intro: `${extra.packBlurb} Everything prints as one PDF with a cover, contents and a certificate at the end.`,
    };
  }
  return {};
}

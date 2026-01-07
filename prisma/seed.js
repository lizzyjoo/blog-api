import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcrypt";

async function main() {
  // Clear existing data
  await prisma.comment.deleteMany();
  await prisma.savedPost.deleteMany();
  await prisma.postView.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const hashedPassword = await bcrypt.hash("password123", 10);

  const lizzy = await prisma.user.create({
    data: {
      username: "lizzy",
      email: "lizzy@example.com",
      password: hashedPassword,
      first_name: "Lizzy",
      last_name: "Joo",
      registeredDate: new Date(),
    },
  });

  const john = await prisma.user.create({
    data: {
      username: "johndoe",
      email: "johndoe@example.com",
      password: hashedPassword,
      first_name: "John",
      last_name: "Doe",
      registeredDate: new Date(),
    },
  });

  const reviewer = await prisma.user.create({
    data: {
      username: "bostoncritic",
      email: "critic@example.com",
      password: hashedPassword,
      first_name: "Mark",
      last_name: "Smith",
      registeredDate: new Date(),
    },
  });

  // Create posts
  await prisma.post.create({
    data: {
      title: "Program Notes: Mozart K. 454 and Brahms Op. 100",
      content: `
<h2>W.A. Mozart: Violin Sonata in B-flat Major, K. 454</h2>

<p><em>"We now have here the famous Strinasacchi from Mantua…I am this moment composing a sonata which we are going to play together on Thursday at her concert in the theater."</em><br>— Mozart writing to his father, 24 April 1784.</p>

<p>Famously, Mozart wrote only the violin part and played the piano from memory before Emperor Joseph II, with a blank sheet on the stand. Whether this was showmanship or necessity is unclear. The sonata belongs to a corpus of thirty-six works tracing Mozart's development of the genre. His early sonatas were often two-movement pieces with the violin largely ad libitum, but over time he added fast finales and gave the violin equal voice. That balance comes fully into view here, where the two instruments continuously exchange themes in playful dialogue.</p>

<p>The grand chords of the opening Largo signal that something out of the ordinary is underway, and from there the sonata takes on an operatic quality. The Allegro is filled with brilliance and humor, the two voices trading ideas, playfully echoing and outdoing one another. The second movement opens with a tender, songlike melody, almost an aria, but without words. The harmonies wander into unexpected places, dreamlike and touched with fleeting shadows of dissonance. The final Rondo brings the work to a joyful close. True to form, the movement ventures away from its recurring theme into surprising detours, before an exuberant burst of energy carries us to the end.</p>

<h2>J. Brahms: Violin Sonata No. 2 in A Major, Op. 100</h2>

<p>In the summer of 1886, Brahms enjoyed a productive and joyful period in Thun, Switzerland, where he composed the sonata. He gave the work the formal title <em>Sonata for Piano and Violin</em>, emphasizing the balanced and intimate partnership between the instruments. This quality was perhaps inspired by the serene yet invigorating surroundings of Thun, which he described as "so full of melodies that one has to be careful not to step on any."</p>

<p>The second sonata is traditionally regarded as the most lyrical out of his three violin sonatas. In the work, Brahms includes fragments of songs that he wrote for his close friend and young German contralto Hermine Spies, such as <em>Komm bald!</em> ("Come Soon"), <em>Wie Melodien zieht es</em> ("It Goes Like Melodies"), <em>Auf dem Kirchhofe</em> ("In the Churchyard"), <em>Meine Lieder</em> ("My Songs"), and <em>Meine Liebe ist grün</em> ("My Love Is Green").</p>

<p>The opening movement is in sonata form, and the piano initiates the first and second themes. From opening piano chords, the melody flows continuously between the instruments in easy conversation. The second movement combines the roles of a slow movement and scherzo in alternating sections, with violin and piano often playing in the same register—doubling, crossing, and intertwining. The finale is a rondo built on a simple rising third (A–C) on the violin, heard each time with a slightly different rhythm, as if searching for its proper metric position. These subtle metric ambiguities give the movement its sense of unhurried grace and forward momentum.</p>

<p>Brahms's friend Elisabeth von Herzogenberg described the sonata as "one caress," capturing the warm and introspective nature of the work, which never strays far from its radiant and openly affectionate center.</p>
      `.trim(),
      published: true,
      hidden: false,
      authorId: lizzy.id,
      created_at: new Date("2025-12-10"),
      updated_at: new Date("2025-12-10"),
    },
  });

  await prisma.post.create({
    data: {
      title: "Review: Lizzy Joo & Eric Guan Duo Recital at Killian Hall",
      content: `
<p><strong>Killian Hall, MIT — December 12th, 2025, 7:30pm</strong></p>

<p>Last Thursday evening, a modest crowd of approximately 30 people (100% of whom were related to the performers) gathered in Killian Hall for a violin and piano recital. Violinist Lizzy Joo and pianist Eric Guan presented an evening of Mozart and Brahms that left the audience wondering: "Is the food outside gonna be cold by the time the concert is over?"</p>

<h3>The Program</h3>

<p>The concert opened with Mozart's Violin Sonata in B-flat Major, K. 454—a piece famously performed by Mozart himself with only a blank sheet of paper on his music stand. Ms. Joo, who did not attempt this flex, kept her eyes glued to the music like a student who didn't start studying until the night before. Mr. Guan, meanwhile, was hella chilling. </p>

<p>The Andante was going well until an audience member's phone buzzed audibly during the most tender passage. The violinist's left eye twitched almost imperceptibly. The pianist, a consummate professional, pretended not to notice.</p>

<h3>Brahms: One Long Caress (Their Words, Not Mine)</h3>

<p>After intermission (during which the reviewer consumed three sesame cookies from the reception table), the duo returned for Brahms's Second Violin Sonata in A Major. Elisabeth von Herzogenberg once described this sonata as "one caress," which is a weird thing to say about a piece of music but okay.</p>

<p>The piece is lyrical, beautiful, and sensitive, demonstrating why Brahms titled the work "Sonata for Piano and Violin" rather than the other way around. They did their best to try to do the piece justice. I think. </p>


<h3>Final Thoughts</h3>

<p>Despite this reviewer's gentle roasting, the recital was genuinely enjoyable. The duo has good chemistry, in the sense that they looked at each other occasionally and didn't seem to hate it. They've announced plans to perform together again in May 2026, presumably after the violinist has done more practice.</p>

<p>This reviewer gives the performance three out of five rosin cakes. One deducted for the seat not being friendly for the butt, one for the lack of encore.</p>

<p><em>The reviewer would like to clarify that they are, in fact, the violinist, and this entire review is a cry for help.</em></p>
      `.trim(),
      published: true,
      hidden: false,
      authorId: reviewer.id,
      created_at: new Date("2025-12-13"),
      updated_at: new Date("2025-12-13"),
    },
  });

  await prisma.post.create({
    data: {
      title: "Why I Still Practice Scales (A Confession)",
      content: `
<p>It's 7am. I'm standing in my apartment with a violin under my chin, playing the same G major scale I learned when I was seven years old. My neighbor, who I have never formally met but who surely knows my practice schedule by now, is probably wondering if I've learned anything new in the past twenty years.</p>

<p>The answer is: not really. And that's the point.</p>

<h3>The Tyranny of Fundamentals</h3>

<p>There's a reason every musician, from conservatory students to seasoned professionals, returns to scales and études. It's the same reason writers read Strunk & White, athletes stretch before games, and programmers occasionally remember that <code>console.log</code> exists. Fundamentals are fundamentals because they never stop being fundamental.</p>

<p>When I was younger, I thought scales were the vegetables of music—something to endure before getting to the dessert of "real" repertoire. Now I understand they're more like coffee: bitter at first, but eventually essential to functioning.</p>

<h3>What Scales Actually Teach</h3>

<p>A scale is not just a sequence of notes. It's a diagnostic tool. In three octaves of G major, I can tell you:</p>

<ul>
  <li>Whether I slept well (intonation in the upper positions)</li>
  <li>Whether I'm stressed (bow pressure, usually too much)</li>
  <li>Whether I've been practicing regularly (shift accuracy)</li>
  <li>Whether I remembered to trim my fingernails (pain)</li>
</ul>

<p>The scale doesn't lie. The scale doesn't care about your feelings. The scale simply reveals what is. I want sushi.</p>

<h3>A Morning Ritual</h3>

<p>My current routine: three-octave scales in whatever key I'm working on, followed by arpeggios, then some double-stops if I'm feeling ambitious (I'm usually not). The whole thing takes maybe fifteen minutes, which is approximately how long it takes my brain to fully wake up anyway.</p>

<p>By the time I'm done, my fingers are warm, my ears are calibrated, and I've already accomplished something before most people have finished their first cup of coffee. This is the closest I get to being a morning person.</p>

<h3>The Long Game</h3>

<p>Music is a long game. The things I practice today won't pay off for weeks, months, sometimes years. Scales are a daily reminder of that timeline—a small investment in future competence, compounding imperceptibly over time.</p>

<p>So yes, I still practice scales. And tomorrow morning, I'll do it again. My neighbor will hear G major ascending and descending, and they'll know: she's still at it.</p>

<p>Some things never change. That's the whole point.</p>
      `.trim(),
      published: true,
      hidden: false,
      authorId: lizzy.id,
      created_at: new Date("2025-12-20"),
      updated_at: new Date("2025-12-20"),
    },
  });

  await prisma.post.create({
    data: {
      title:
        "On Memorization: Or, How I Learned to Stop Worrying and Trust My Hands",
      content: `
<p>The first time I performed from memory, I forgot everything in measure 47. Not a gradual fog, not a momentary hesitation—a complete and total blank, as if someone had taken an eraser to my brain. My hands, bless them, kept going anyway. They played something. Whether it was what Beethoven intended, I'll never know.</p>

<p>This experience taught me two things: first, that muscle memory is real and occasionally terrifying; second, that memorization is less about the brain than we think.</p>

<h3>The Three Types of Memory</h3>

<p>Musicians talk about three kinds of memory:</p>

<p><strong>Muscle memory</strong> — Your fingers know where to go even when your brain has left the building. This is both your safety net and your worst enemy, because muscles don't distinguish between correct notes and wrong notes practiced repeatedly.</p>

<p><strong>Aural memory</strong> — You know what it should sound like. When something sounds wrong, you notice. This is helpful unless you're performing on an out-of-tune piano, in which case everything sounds wrong and you spiral.</p>

<p><strong>Analytical memory</strong> — You understand the structure: this is the exposition, here's the development, that's a secondary dominant. This is supposed to be your backup system, but in my experience, trying to think analytically mid-performance is like trying to explain grammar while speaking.</p>

<h3>My Memorization Process</h3>

<p>I wish I had a sophisticated system. Here's what I actually do:</p>

<ol>
  <li>Learn the notes while looking at the music</li>
  <li>Practice until I realize I haven't looked at the music in ten minutes</li>
  <li>Panic about whether I actually know it</li>
  <li>Test myself by starting from random spots (this is humbling)</li>
  <li>Perform it wrong in a low-stakes setting</li>
  <li>Repeat steps 3-5 until the concert</li>
</ol>

<p>Nowhere in this process do I feel "ready." Readiness, I've learned, is not a feeling. It's a decision.</p>

<h3>The Performance Paradox</h3>

<p>Here's the strange thing: the pieces I know best are often the most dangerous to perform. Familiarity breeds a kind of mental wandering. You start thinking about dinner, or that email you forgot to send, or whether the audience member in row three is enjoying themselves—and suddenly you're in measure 47 with no idea how you got there.</p>

<p>The solution, counterintuitively, is to stay curious. To listen as if hearing the piece for the first time. To notice details you've played a thousand times but never really heard.</p>

<p>Easier said than done, of course. But then again, so is everything worth doing.</p>
      `.trim(),
      published: true,
      authorId: lizzy.id,
      hidden: false,
      created_at: new Date("2025-12-28"),
      updated_at: new Date("2025-12-28"),
    },
  });

  // Add some comments
  const posts = await prisma.post.findMany();

  await prisma.comment.create({
    data: {
      content: "Beautiful program notes! The Brahms is such a gorgeous piece.",
      postId: posts[0].id,
      authorId: john.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "I was at this recital! The cookies really were excellent.",
      postId: posts[1].id,
      authorId: lizzy.id,
    },
  });

  await prisma.comment.create({
    data: {
      content:
        "The part about muscle memory being 'occasionally terrifying' is so real. Been there.",
      postId: posts[3].id,
      authorId: john.id,
    },
  });

  console.log("Seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

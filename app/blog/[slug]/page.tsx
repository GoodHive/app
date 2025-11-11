import Image from "next/image";
import { PortableText } from "@portabletext/react";
import { Metadata } from "next";
import { Post } from "../page";
import { getPostBySlug } from "@/lib/blog";
import moment from "moment";
import { CustomPortableTextComponents } from "@/app/components/CustomPortableText/CustomPortableText";

type Props = {
  params: { slug: string };
};
const staticPost = {
  slug: {
    current: "what-is-goodhive-3",
    _type: "slug",
  },
  author: {
    name: "Benoit Kulesza",
    image: {
      asset: {
        _id: "image-dbbb20bafdec56e268ca5e6a628baa15ea4553f4-1255x1144-jpg",
        url: "https://cdn.sanity.io/images/bk6p174g/production/dbbb20bafdec56e268ca5e6a628baa15ea4553f4-1255x1144.jpg",
      },
    },
    bio: [
      {
        style: "normal",
        _key: "8f07310f5577",
        markDefs: [],
        children: [
          {
            _type: "span",
            marks: [],
            text: "Founder ",
            _key: "b61bbe227344",
          },
          {
            _type: "span",
            marks: ["strong"],
            text: "GoodHive ",
            _key: "ffe187fe4733",
          },
          {
            _type: "span",
            marks: [],
            text: "& ",
            _key: "90d28d3e06dd",
          },
          {
            text: "Web3TalentFair",
            _key: "1bbbc1b70962",
            _type: "span",
            marks: ["strong"],
          },
          {
            _key: "0a7f058f04a0",
            _type: "span",
            marks: [],
            text: ".\nConnecting Talent & Builder.",
          },
        ],
        _type: "block",
      },
    ],
  },
  mainImage: {
    asset: {
      _id: "image-29f1e34f1e7ff9667ff4d35ad9e8c9f9dc4c5e99-1918x1078-png",
      url: "https://cdn.sanity.io/images/bk6p174g/production/29f1e34f1e7ff9667ff4d35ad9e8c9f9dc4c5e99-1918x1078.png",
    },
  },
  previewText:
    "GoodHive rewards collaboration with real value! 💸 Discover how our DAO’s multiple revenue streams and Good Honey tokens can benefit you. Curious? Check out the DAO's treasure! 🐝",
  categories: null,
  publishedAt: "2024-10-17T17:56:38.221Z",
  body: [
    {
      style: "normal",
      _key: "2915d0b04425",
      markDefs: [],
      children: [
        {
          _type: "span",
          marks: ["strong"],
          text: "Discover the DAO Treasure That Rewards You for Excellence",
          _key: "fbb7cb7e59d30",
        },
        {
          _type: "span",
          marks: [],
          text: "🌟🐝",
          _key: "fbb7cb7e59d31",
        },
      ],
      _type: "block",
    },
    {
      style: "normal",
      _key: "a68e14c68527",
      markDefs: [],
      children: [
        {
          _key: "0a68ca20b4490",
          _type: "span",
          marks: [],
          text: "GoodHive isn't your average community—it’s a buzzing hive of doers, game changers, and innovators where excellence and collaboration are at the heart of everything we do. Our community? It’s the treasure chest of this entire system, gleaming like the sun on a perfect day. But hold on, there's more to the story! 🌟",
        },
      ],
      _type: "block",
    },
    {
      children: [
        {
          _type: "span",
          marks: [],
          text: "Sure, being a good person is great and all, but in the real world, it helps to have a little (okay, a lot) of financial motivation. That’s where GoodHive steps in, armed with a compelling incentive system that rewards our community with something we call... drumroll please... ",
          _key: "300463b86cbd0",
        },
        {
          _type: "span",
          marks: ["strong"],
          text: "Good Honey",
          _key: "300463b86cbd1",
        },
        {
          _type: "span",
          marks: [],
          text: "! 🍯",
          _key: "300463b86cbd2",
        },
      ],
      _type: "block",
      style: "normal",
      _key: "408c328255bb",
      markDefs: [],
    },
    {
      children: [
        {
          _type: "span",
          marks: [],
          text: "So how does all of this work? 🤔 Well, let’s break it down: The GoodHive platform is powered by a DAO (Decentralized Autonomous Organization) with a treasury that’s constantly being topped up. This adds value to our beloved Good Honey token. Want to know all the juicy details of our tokenomics? Stay tuned for a dedicated article where I'll geek out on the mechanics behind our token bonding curve and buy-back reserve. But here’s the gist: all revenue deposited by clients to pay for platform fees either comes directly in Good Honey or gets converted to mint new Good Honey as tasks are completed. Cool, right? 😎",
          _key: "1d6ba34dbcb80",
        },
      ],
      _type: "block",
      style: "normal",
      _key: "62bd3260164d",
      markDefs: [],
    },
    {
      style: "normal",
      _key: "4860cf903076",
      markDefs: [],
      children: [
        {
          _type: "span",
          marks: [],
          text: "Now, where does all that money go? Straight into the DAO treasury, of course! This is used to fund protocol updates, back the buy-back reserve, and—here’s the kicker—support community-driven investments that align with our higher purpose (another article for another time 😉).",
          _key: "6ec01a93767c0",
        },
      ],
      _type: "block",
    },
    {
      markDefs: [],
      children: [
        {
          _type: "span",
          marks: ["strong"],
          text: "But wait, where does GoodHive’s income actually come from?",
          _key: "6768dcf65ab70",
        },
        {
          text: " Let me break it down for you:",
          _key: "6768dcf65ab71",
          _type: "span",
          marks: [],
        },
      ],
      _type: "block",
      style: "normal",
      _key: "361e231c94bd",
    },
    {
      _key: "0f7b55019b38",
      listItem: "bullet",
      markDefs: [],
      children: [
        {
          _key: "7ad500f6193d0",
          _type: "span",
          marks: ["strong"],
          text: "Client Fees",
        },
        {
          _type: "span",
          marks: [],
          text: ": When clients hire a member through the platform, they pay a base fee of 10% of the member’s daily rate. Need a recruiter? That’s another 8%. Want a mentor too? Add 12%. Easy peasy.",
          _key: "7ad500f6193d1",
        },
      ],
      level: 1,
      _type: "block",
      style: "normal",
    },
    {
      listItem: "bullet",
      markDefs: [],
      children: [
        {
          _key: "aeda79b4f2db0",
          _type: "span",
          marks: ["strong"],
          text: "More to Come",
        },
        {
          _type: "span",
          marks: [],
          text: ": As the community grows, so will our income streams! We’ll offer clients the option to prioritize their job postings for a fee, and software companies can promote their products, host workshops, and connect with our community. Oh, and did I mention advertising and affiliate programs? They’re coming too. 📈",
          _key: "aeda79b4f2db1",
        },
      ],
      level: 1,
      _type: "block",
      style: "normal",
      _key: "8dbe0124f868",
    },
    {
      style: "normal",
      _key: "038e38b245f3",
      listItem: "bullet",
      markDefs: [],
      children: [
        {
          _type: "span",
          marks: ["strong"],
          text: "Corporate Loyalty Programs",
          _key: "b976f9a76fbc0",
        },
        {
          _type: "span",
          marks: [],
          text: ": Keeping tech talent happy is crucial for big companies these days. With our white-label solution, companies can offer a loyalty program to their tech talent pool, which could be a game-changer. 🏆",
          _key: "b976f9a76fbc1",
        },
      ],
      level: 1,
      _type: "block",
    },
    {
      _key: "e104aee5e9e4",
      listItem: "bullet",
      markDefs: [],
      children: [
        {
          _type: "span",
          marks: ["strong"],
          text: "Education & Market Insights",
          _key: "9f0246bd9d9e0",
        },
        {
          text: ": In the future, we’ll add education and market insights to the mix, generating even more income for our community. 🎓",
          _key: "9f0246bd9d9e1",
          _type: "span",
          marks: [],
        },
      ],
      level: 1,
      _type: "block",
      style: "normal",
    },
    {
      _type: "block",
      style: "normal",
      _key: "d3b230521848",
      markDefs: [],
      children: [
        {
          marks: ["strong"],
          text: "And here's the best part",
          _key: "18bb8c69ac170",
          _type: "span",
        },
        {
          _key: "18bb8c69ac171",
          _type: "span",
          marks: [],
          text: "—all these services will be paid for in Good Honey, creating a constant demand for the token. Whether you want to sell or hold, the opportunities are endless, and the DAO's treasury will keep growing, fueling even bigger community goals.",
        },
      ],
    },
    {
      style: "normal",
      _key: "11fd5589808a",
      markDefs: [],
      children: [
        {
          marks: [],
          text: "Want to be part of this? Trust me, the earlier you join, the better! 🚀 First comers stand to benefit the most as more activity on the platform means more value for Good Honey. The longer you hold onto those tokens, the more valuable they become.",
          _key: "d0b1cb9724060",
          _type: "span",
        },
      ],
      _type: "block",
    },
    {
      _type: "block",
      style: "normal",
      _key: "4c6611cb3902",
      markDefs: [],
      children: [
        {
          _type: "span",
          marks: [],
          text: "So, what are you waiting for? Get in early, create your profile, and let’s build something amazing together. 💼💡🐝",
          _key: "8b544f791a3d0",
        },
      ],
    },
    {
      children: [
        {
          marks: [],
          text: "#Decentralization #TechTalent #Web3Jobs #CollaborativeEconomy #Blockchain",
          _key: "7a5b664f8c430",
          _type: "span",
        },
      ],
      _type: "block",
      style: "normal",
      _key: "0524b92f6215",
      markDefs: [],
    },
  ],
  title: "🚀 What is GoodHive 3? 🚀",
  _id: "45000764-5ae9-4647-aee8-abe0e79f6dbc",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let post = null;
  const fetchedPost: Post = await getPostBySlug(params.slug);

  if (params.slug === "what-is-goodhive-3") {
    post = staticPost;
  } else {
    post = fetchedPost;
  }

  return {
    title: `${post.title} | GoodHive Blog`,
    description: post.previewText,
    openGraph: {
      title: post.title,
      description: post.previewText,
      images: [
        {
          url: post.mainImage.asset.url,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      type: "article",
      url: `https://goodhive.io/blog/${post.slug.current}`,
      siteName: "My Blog",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.previewText,
      images: [post.mainImage.asset.url],
    },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  let post = null;
  const fetchedPost: Post = await getPostBySlug(params.slug);

  if (params.slug === "what-is-goodhive-3") {
    post = staticPost;
  } else {
    post = fetchedPost;
  }

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-8">
      {/* Post Title */}
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

      {/* Post Author Info */}
      <div className="flex items-center mb-6 gap-4">
        <Image
          src={post.author.image.asset.url}
          alt={post.author.name}
          width={40}
          height={40}
          className="rounded-full mr-3"
        />
        <div>
          <p className="font-semibold">{post.author.name}</p>
          <p className="text-gray-500 text-sm">
            {moment(post.publishedAt).format("MMMM Do YYYY, h:mm a")}
          </p>
        </div>
      </div>

      {/* Main Image */}
      <div className="mb-8">
        <Image
          src={post.mainImage.asset.url}
          alt={post.title}
          width={800}
          height={400}
          className="rounded-lg"
        />
        <p className="text-sm text-gray-500 mt-2">{post.title}</p>
      </div>

      {/* Blog Content */}
      <div className="prose prose-lg max-w-none">
        <PortableText
          value={post.body}
          components={CustomPortableTextComponents}
        />
      </div>
    </article>
  );
}

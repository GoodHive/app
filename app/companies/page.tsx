import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Companies Pages | GoodHive",
  description: "The Decentralized Freelancing Plateforme",
};

export default function Companies() {
  return (
    <main className="mx-5">
      <h1 className="my-5 text-2xl">Company Page</h1>
    </main>
  );
}
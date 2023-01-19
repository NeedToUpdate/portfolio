import Head from "next/head";
import Image from "next/image";
import { Inter } from "@next/font/google";

export default function Home() {
  return (
    <>
      <Head>
        <title>Artem Nikitin</title>
        <meta name="description" content="The work of Artem" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="w-full h-full">
        <div className="flex justify-center items-center w-full h-full">
          <p className="text-2xl text-blue-500">testing</p>
        </div>
      </main>
    </>
  );
}

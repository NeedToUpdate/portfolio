import Head from "next/head";
import Image from "next/image";
import DynamicBackground from "../components/dynamicBackground";

export default function Home() {
  return (
    <div className="h-full w-full relative">
      <Head>
        <title>Artem Nikitin</title>
        <meta name="description" content="The work of Artem" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <link rel="icon" href="/favicon.ico" />
      </Head>
      <DynamicBackground></DynamicBackground>
      <div className="relative w-full h-full z-10">
        <main className="flex  items-center w-full h-full gap-2 flex-col ">
          <header className="flex flex-col mt-20">
            <p className="text-star-100 font-montserrat font-extralight tracking-tighter text-4xl">Hi. my name is Art.</p>
          </header>
          <div className="spacer flex-1 max-h-40"></div>
          <div className="flex flex-1 flex-col gap-20">
            <p className="text-plasma-100 font-montserrat font-thin text-4xl text-shadow-none hover:text-shadow cursor-pointer shadow-plasma-500 duration-700">Projects</p>
            <p className="text-plasma-100 font-montserrat font-thin text-4xl text-shadow-none hover:text-shadow cursor-pointer shadow-plasma-500 duration-700">Skills</p>
            <p className="text-plasma-100 font-montserrat font-thin text-4xl text-shadow-none hover:text-shadow cursor-pointer shadow-plasma-500 duration-700">About Me</p>
          </div>
          <div className="spacer flex-1"></div>
        </main>
      </div>
    </div>
  );
}

import Head from "next/head";
import Image from "next/image";
import DynamicBackground from "../components/dynamicBackground";
import TypedText from "../components/typedText";

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
          <header className="flex flex-col mt-20 items-start w-full pl-10">
            <TypedText time={2000} className="text-star-100 font-montserrat font-extralight text-left tracking-tighter text-4xl">
              Hi. My name is Art.
            </TypedText>
          </header>
          <div className="spacer flex-1 max-h-40"></div>
          <div className="flex flex-1 flex-col gap-20 w-full pl-40">
            <TypedText time={400} delayStart={2000} className="text-plasma-100 font-montserrat font-thin text-4xl text-shadow-none hover:text-shadow cursor-pointer shadow-plasma-500 duration-700 pl-10">
              Projects
            </TypedText>
            <TypedText time={400} delayStart={2500} className="text-plasma-100 font-montserrat font-thin text-4xl text-shadow-none hover:text-shadow cursor-pointer shadow-plasma-500 duration-700 pl-10">
              Skills
            </TypedText>
            <TypedText time={400} delayStart={3000} className="text-plasma-100 font-montserrat font-thin text-4xl text-shadow-none hover:text-shadow cursor-pointer shadow-plasma-500 duration-700 pl-10">
              About Me
            </TypedText>
          </div>
          <div className="spacer flex-1"></div>
        </main>
      </div>
    </div>
  );
}

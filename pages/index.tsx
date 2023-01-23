import Head from "next/head";
import Image from "next/image";
import DynamicBackground from "../components/dynamicBackground";
import GradientBackground from "../components/gradientBackground";
import AnimatedArrow from "../components/icons/animatedArrow";
import ArrowIcon from "../components/icons/arrowIcon";
import ParticleBackground from "../components/particleBackground";
import ProjectBlurb from "../components/projectBlurb";
import TypedText from "../components/typedText";
import { useHover } from "../components/utils/onHoverHook";
import { useScroll } from "../components/utils/onScrollHook";
import { IProject } from "../components/utils/types";

export async function getStaticProps() {
  let projects: IProject[] = [
    {
      title: "icandoathing.com",
      description: "A project based social media site.",
      thumbnail: "https://fra1.digitaloceanspaces.com/icandoathing/media/images/i-created-a-saa_artem_7_.webp?AWSAccessKeyId=UBEKVWNS3L7D5LT4GA3D&Signature=LJo4787WG1rZgRPX43NIUtERglo%3D&Expires=1674485176",
      brightImage: true,
      techs: ["django", "vuejs", "sass"],
    },
    {
      title: "icandoathing.com",
      description: "A project based social media site.",
      thumbnail: "https://fra1.digitaloceanspaces.com/icandoathing/media/images/i-created-a-saa_artem_7_.webp?AWSAccessKeyId=UBEKVWNS3L7D5LT4GA3D&Signature=LJo4787WG1rZgRPX43NIUtERglo%3D&Expires=1674485176",
      brightImage: true,
      techs: ["django", "vuejs", "sass"],
    },
    {
      title: "icandoathing.com",
      description: "A project based social media site.",
      thumbnail: "https://fra1.digitaloceanspaces.com/icandoathing/media/images/i-created-a-saa_artem_7_.webp?AWSAccessKeyId=UBEKVWNS3L7D5LT4GA3D&Signature=LJo4787WG1rZgRPX43NIUtERglo%3D&Expires=1674485176",
      brightImage: true,
      techs: ["django", "vuejs", "sass"],
    },
    {
      title: "icandoathing.com",
      description: "A project based social media site.",
      thumbnail: "https://fra1.digitaloceanspaces.com/icandoathing/media/images/i-created-a-saa_artem_7_.webp?AWSAccessKeyId=UBEKVWNS3L7D5LT4GA3D&Signature=LJo4787WG1rZgRPX43NIUtERglo%3D&Expires=1674485176",
      brightImage: true,
      techs: ["django", "vuejs", "sass"],
    },
    {
      title: "icandoathing.com",
      description: "A project based social media site.",
      thumbnail: "https://fra1.digitaloceanspaces.com/icandoathing/media/images/i-created-a-saa_artem_7_.webp?AWSAccessKeyId=UBEKVWNS3L7D5LT4GA3D&Signature=LJo4787WG1rZgRPX43NIUtERglo%3D&Expires=1674485176",
      brightImage: true,
      techs: ["django", "vuejs", "sass"],
    },
    {
      title: "icandoathing.com",
      description: "A project based social media site.",
      thumbnail: "https://fra1.digitaloceanspaces.com/icandoathing/media/images/i-created-a-saa_artem_7_.webp?AWSAccessKeyId=UBEKVWNS3L7D5LT4GA3D&Signature=LJo4787WG1rZgRPX43NIUtERglo%3D&Expires=1674485176",
      brightImage: true,
      techs: ["django", "vuejs", "sass"],
    },
    {
      title: "icandoathing.com",
      description: "A project based social media site.",
      thumbnail: "https://fra1.digitaloceanspaces.com/icandoathing/media/images/i-created-a-saa_artem_7_.webp?AWSAccessKeyId=UBEKVWNS3L7D5LT4GA3D&Signature=LJo4787WG1rZgRPX43NIUtERglo%3D&Expires=1674485176",
      brightImage: true,
      techs: ["django", "vuejs", "sass"],
    },
    {
      title: "icandoathing.com",
      description: "A project based social media site.",
      thumbnail: "https://fra1.digitaloceanspaces.com/icandoathing/media/images/i-created-a-saa_artem_7_.webp?AWSAccessKeyId=UBEKVWNS3L7D5LT4GA3D&Signature=LJo4787WG1rZgRPX43NIUtERglo%3D&Expires=1674485176",
      brightImage: true,
      techs: ["django", "vuejs", "sass"],
    },
    {
      title: "icandoathing.com",
      description: "A project based social media site.",
      thumbnail: "https://fra1.digitaloceanspaces.com/icandoathing/media/images/i-created-a-saa_artem_7_.webp?AWSAccessKeyId=UBEKVWNS3L7D5LT4GA3D&Signature=LJo4787WG1rZgRPX43NIUtERglo%3D&Expires=1674485176",
      brightImage: true,
      techs: ["django", "vuejs", "sass"],
    },
    {
      title: "icandoathing.com",
      description: "A project based social media site.",
      thumbnail: "https://fra1.digitaloceanspaces.com/icandoathing/media/images/i-created-a-saa_artem_7_.webp?AWSAccessKeyId=UBEKVWNS3L7D5LT4GA3D&Signature=LJo4787WG1rZgRPX43NIUtERglo%3D&Expires=1674485176",
      brightImage: true,
      techs: ["django", "vuejs", "sass"],
    },
  ];
  return {
    props: {
      projects: projects,
    }, // will be passed to the page component as props
  };
}

interface props {
  projects: IProject[];
}

export default function Home(props: props) {
  const { projects } = props;
  const [fullyScrolled, fullyScrolledProps] = useScroll(90, "horiz");
  return (
    <div className="w-full h-full relative">
      <Head>
        <title>Artem Nikitin</title>
        <meta name="description" content="The work of Artem" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <link rel="icon" href="/favicon.ico" />
      </Head>
      <DynamicBackground></DynamicBackground>
      <ParticleBackground numOfParticles={100}></ParticleBackground>
      <main className="relative w-full  z-10 pointer-events-none">
        <div className="flex  items-center w-full h-screen gap-2 flex-col ">
          <header className="flex flex-col mt-20 items-start w-full pl-10">
            <TypedText time={2000} className="text-star-100 font-montserrat font-extralight text-left tracking-tighter text-4xl">
              Hi. My name is Art.
            </TypedText>
          </header>
          <div className="spacer flex-1 max-h-40"></div>
          <div className="flex flex-1 flex-col gap-20 w-full pl-40 pointer-events-none">
            <TypedText time={400} delayStart={2000} className="text-plasma-100 select-none w-fit pointer-events-auto font-montserrat font-thin text-4xl text-shadow-none hover:text-shadow cursor-pointer shadow-plasma-500 duration-700 pl-10">
              Projects
            </TypedText>
            <TypedText time={400} delayStart={2500} className="text-plasma-100 select-none w-fit pointer-events-auto font-montserrat font-thin text-4xl text-shadow-none hover:text-shadow cursor-pointer shadow-plasma-500 duration-700 pl-10">
              Skills
            </TypedText>
            <TypedText time={400} delayStart={3000} className="text-plasma-100 select-none w-fit pointer-events-auto font-montserrat font-thin text-4xl text-shadow-none hover:text-shadow cursor-pointer shadow-plasma-500 duration-700 pl-10">
              About Me
            </TypedText>
          </div>
          <div className="spacer flex-1"></div>
        </div>
        <section className="relative w-full h-screen p-8 flex flex-col gap-5 pointer-events-auto">
          <GradientBackground></GradientBackground>
          <h4 className="text-4xl select-none text-nebula-100 font-montserrat font-thin ">Projects</h4>
          <div className="flex flex-col flex-wrap max-h-[70%] overflow-x-scroll gap-5" {...fullyScrolledProps}>
            {projects &&
              projects.map((project, i) => {
                return <ProjectBlurb key={i} title={project.title} description={project.description} techs={project.techs} image={project.thumbnail} bright={project.brightImage}></ProjectBlurb>;
              })}
          </div>
          <div className="flex justify-end items-center gap-2">
            {fullyScrolled ? (
              <TypedText time={100} className="text-lg font-thin text-nebula-100">
                More coming soon!
              </TypedText>
            ) : (
              <>
                <TypedText time={100} className="text-lg font-thin text-nebula-100">
                  Theres More
                </TypedText>
              </>
            )}

            <AnimatedArrow state={fullyScrolled ? 1 : 0} className={`w-6 h-6 duration-1000 ${fullyScrolled ? "rotate-0" : "rotate-[360deg]"}`}></AnimatedArrow>
          </div>
        </section>
      </main>
    </div>
  );
}

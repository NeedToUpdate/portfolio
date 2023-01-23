import Head from "next/head";
import React, { useRef } from "react";
import DynamicBackground from "../components/dynamicBackground";
import GradientBackground from "../components/gradientBackground";
import AnimatedArrow from "../components/icons/animatedArrow";
import ParticleBackground from "../components/particleBackground";
import ProjectBlurb from "../components/projectBlurb";
import TypedText from "../components/typedText";
import { useScroll } from "../components/utils/onScrollHook";
import { IProject, ISkill } from "../components/utils/types";
import Image from "next/image";
import SkillIcon from "../components/skillIcon";
export async function getStaticProps() {
  let projects: IProject[] = [
    {
      title: "icandoathing.com",
      description: "A project based social media site.",
      thumbnail: "https://media.licdn.com/dms/image/C562DAQHSplQ40LYf1Q/profile-treasury-image-shrink_800_800/0/1662108048029?e=1675105200&v=beta&t=GFLqqQEtFSF11aD17dTZi2vFEp7Fe5CQgeKZTR0EM_8",
      brightImage: true,
      techs: ["django", "vuejs", "sass"],
      url: "https://icandoathing.com",
    },
    {
      title: "whatstheword.io",
      description: "A SaaS game site.",
      thumbnail: "https://icandoathing.fra1.cdn.digitaloceanspaces.com/media/images/thumbs/i-created-a-saa_artem_4__thumb.webp",
      brightImage: true,
      techs: ["react", "django", "tailwind"],
      url: "https://whatstheword.io",
    },
    {
      title: "Invoice Creator",
      description: "A pdf generator.",
      thumbnail: "https://icandoathing.fra1.cdn.digitaloceanspaces.com/media/images/thumbs/i-made-a-web-ap_artem_thumb.webp",
      techs: ["nextjs", "tailwind", "mongodb"],
      url: "https://invoice.artemnikitin.dev",
    },
    {
      title: "Neural Network Library",
      description: "A toy NN library with lots of features.",
      thumbnail: "https://icandoathing.fra1.cdn.digitaloceanspaces.com/media/images/thumbs/i-made-a-neural_artem_5__thumb.webp",
      brightImage: true,
      techs: ["javascript"],
      url: "https://www.icandoathing.com/thing/QRkgsb",
    },
    {
      title: "AI Image Tool",
      description: "Resize, compress, and use AI.",
      thumbnail: "https://icandoathing.fra1.cdn.digitaloceanspaces.com/media/images/thumbs/i-made-a-tool-t_artem_thumb.webp",
      techs: ["html", "python", "pytorch"],
      url: "https://www.icandoathing.com/thing/sQotUe",
    },
    {
      title: "IoT Devices",
      description: "An automated apartment using ESP32s.",
      thumbnail: "https://icandoathing.fra1.cdn.digitaloceanspaces.com/media/images/thumbs/i-automated-my-_artem_3cIhCbR_thumb.webp",
      techs: ["arduino", "vuejs", "python"],
      url: "https://www.icandoathing.com/thing/pG7w9I",
    },
    {
      title: "Classroom Game",
      description: "A tool for a fun classroom.",
      thumbnail: "https://icandoathing.fra1.cdn.digitaloceanspaces.com/media/images/thumbs/i-made-a-motiva_artem_thumb.webp",
      techs: ["angular", "typescript", "mongodb"],
      url: "https://learninggame.artemnikitin.dev",
    },
    {
      title: "Breadboard CPU",
      description: "A full 8-bit CPU made with wires and logic gates.",
      thumbnail: "https://icandoathing.fra1.cdn.digitaloceanspaces.com/media/images/thumbs/i-made-an-8-bit_artem_2__thumb.webp",
      techs: ["wires"],
      url: "https://www.icandoathing.com/thing/OPJQJ6",
    },
  ];
  const skills: ISkill[] = [
    {
      tech: "react",
      prettyName: "ReactJS",
      years: 2,
    },
    {
      tech: "typescript",
      prettyName: "TypeScript",
      years: 5,
    },
    {
      tech: "python",
      prettyName: "Python",
      years: 4,
    },
    {
      tech: "html",
      prettyName: "HTML5",
      years: 5,
    },
    {
      tech: "sass",
      prettyName: "CSS/SCSS",
      years: 5,
    },
    {
      tech: "django",
      prettyName: "Django",
      years: 3,
    },
    {
      tech: "nodejs",
      prettyName: "Node.js",
      years: 3,
    },
    {
      tech: "vuejs",
      prettyName: "VueJS",
      years: 3,
    },
    {
      tech: "postgresql",
      prettyName: "PostgreSQL",
      years: 3,
    },
    {
      tech: "mongodb",
      prettyName: "MongoDB",
      years: 3,
    },
    {
      tech: "nextjs",
      prettyName: "NextJS",
      years: 1,
    },
    {
      tech: "numpy",
      prettyName: "NumPy",
      years: 1,
    },
  ];
  return {
    props: {
      projects: projects,
      skills: skills,
    }, // will be passed to the page component as props
  };
}

interface props {
  projects: IProject[];
  skills: ISkill[];
}

export default function Home(props: props) {
  const { projects, skills } = props;
  const [fullyScrolled, fullyScrolledProps] = useScroll(90, "horiz");

  const mainMenuRef = useRef<null | HTMLDivElement>(null);
  const scrollToTop = () => {
    if (mainMenuRef.current) mainMenuRef.current.scrollIntoView({ behavior: "smooth" });
  };
  const projectsRef = useRef<null | HTMLDivElement>(null);
  const scrollToProjects = () => {
    if (projectsRef.current) projectsRef.current.scrollIntoView({ behavior: "smooth" });
  };
  const skillsRef = useRef<null | HTMLDivElement>(null);
  const scrollToSkills = () => {
    if (skillsRef.current) skillsRef.current.scrollIntoView({ behavior: "smooth" });
  };
  const aboutMeRef = useRef<null | HTMLDivElement>(null);
  const scrollToAboutMe = () => {
    if (aboutMeRef.current) aboutMeRef.current.scrollIntoView({ behavior: "smooth" });
  };

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
      <main ref={mainMenuRef} className="relative w-full  z-10 pointer-events-none">
        <div className="flex  items-center w-full h-screen gap-2 flex-col ">
          <header className="flex flex-col mt-[7.5rem] items-start w-full pl-10">
            <TypedText time={2000} className="text-star-100  bg-clip-text font-montserrat font-extralight text-left tracking-tighter text-4xl">
              Hi. My name is Art.
            </TypedText>
          </header>
          <div className="spacer flex-1"></div>
          <div className="flex flex-1 flex-col gap-20 w-full pl-40 pointer-events-none">
            <TypedText
              onClick={() => scrollToProjects()}
              time={400}
              delayStart={2000}
              className="text-plasma-100 select-none w-fit pointer-events-auto font-montserrat font-thin text-4xl text-shadow-none hover:text-shadow cursor-pointer shadow-plasma-500 duration-700 pl-10"
            >
              Projects
            </TypedText>
            <TypedText
              onClick={() => scrollToSkills()}
              time={400}
              delayStart={2500}
              className="text-plasma-100 select-none w-fit pointer-events-auto font-montserrat font-thin text-4xl text-shadow-none hover:text-shadow cursor-pointer shadow-plasma-500 duration-700 pl-10"
            >
              Skills
            </TypedText>
            <TypedText
              onClick={() => scrollToAboutMe()}
              time={400}
              delayStart={3000}
              className="text-plasma-100 select-none w-fit pointer-events-auto font-montserrat font-thin text-4xl text-shadow-none hover:text-shadow cursor-pointer shadow-plasma-500 duration-700 pl-10"
            >
              About Me
            </TypedText>
          </div>
          <div className="spacer flex-1"></div>
        </div>
        <section ref={projectsRef} className="relative w-full h-screen p-8 flex flex-col gap-5 pointer-events-auto">
          <GradientBackground></GradientBackground>
          <h4 className="text-4xl select-none text-nebula-100 font-montserrat font-thin mb-10">Projects</h4>
          <div className="flex flex-col flex-wrap max-h-[70%] overflow-x-scroll gap-5" {...fullyScrolledProps}>
            {projects &&
              projects.map((project, i) => {
                return <ProjectBlurb key={i} url={project.url} title={project.title} description={project.description} techs={project.techs} image={project.thumbnail} bright={project.brightImage}></ProjectBlurb>;
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
                  Scroll for more
                </TypedText>
              </>
            )}

            <AnimatedArrow state={fullyScrolled ? 1 : 0} className={`w-6 h-6 duration-1000 ${fullyScrolled ? "rotate-0" : "rotate-[360deg]"}`}></AnimatedArrow>
          </div>
        </section>
        <section ref={skillsRef} className="relative w-full h-screen p-8 flex flex-col gap-5 pointer-events-auto">
          <h4 className="text-4xl select-none text-nebula-100 font-montserrat font-thin ">Skills</h4>
          <div className="flex-1"></div>
          <div className="flex gap-5 p-2 flex-wrap items-center justify-evenly">
            {skills &&
              skills
                .sort((a, b) => b.years - a.years)
                .map((skill, i) => {
                  return <SkillIcon key={i} background={(i % 3) as 0 | 1 | 2} className=" " {...skill}></SkillIcon>;
                })}
          </div>
          <p className="font-lato font-thin text-nebula-100 text-center">There are a few dozen more that wont fit on here. Email me for inquiries!</p>
          <div className="flex-1"></div>
        </section>
        <section ref={aboutMeRef} className="relative w-full h-screen p-8 flex flex-col gap-5 pointer-events-auto font-lato text-star-100">
          <h4 className="text-4xl select-none text-nebula-100 font-montserrat font-thin ">About Me</h4>
          <div className="flex-1"></div>
          <p className="">Hi!</p>
          <p className="">I am a programmer based in Toronto, Canada. I love a good challenge and refuse to give up.</p>
          <p> Currently open to new work.</p>
          <p className="">
            Email me at:
            <a className=" bg-gradient-to-br from-plasma-500 to-star-500 bg-clip-text text-transparent hover:bg-gradient-to-b" href="mailto:hello@artemnikitin.dev">
              {" "}
              hello@artemnikitin.dev
            </a>
          </p>
          <div className="flex-1"></div>
          <div className="flex-1"></div>
          <div className="max-w-[60%] absolute bottom-0 right-0">
            <Image src={"/images/me.webp"} alt={"A picture of Artem"} width={761} height={1000}></Image>
          </div>
        </section>
      </main>
    </div>
  );
}

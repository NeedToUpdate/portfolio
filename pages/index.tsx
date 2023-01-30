import Head from "next/head";
import React, { useRef, useState } from "react";
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
import SocialIcon from "../components/socialIcon";
import PictureLoader from "../components/pictureLoader";
import fs from "fs";
import matter from "gray-matter";
interface ProjectLink {
  slug: string;
  details: IProject;
}
export async function getStaticProps() {
  const files = fs.readdirSync("_projects");
  const projects: ProjectLink[] = files.map((fileName) => {
    const slug = fileName.replace(".md", "");

    const readFile = fs.readFileSync(`_projects/${fileName}`, "utf-8");

    const { data: details } = matter(readFile);

    return {
      slug,
      details,
    } as ProjectLink;
  });
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
  projects: ProjectLink[];
  skills: ISkill[];
}

export default function Home(props: props) {
  const { projects, skills } = props;
  const [fullyScrolled, fullyScrolledProps] = useScroll(90, "horiz");

  const [imageLoaded, setImageLoaded] = useState(false);

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
        <meta name="title" content="Artem Nikitin" />
        <meta name="description" content="A self-starter self-taught full stack dev. " />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="tech, javascript, portfolio, python" />
        <meta name="robots" content="index, follow" />
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="language" content="English" />
        <meta name="author" content="Artem Nikitin" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://artemnikitin.dev/" />
        <meta property="og:title" content="Artem Nikitin" />
        <meta property="og:description" content="A self-starter self-taught full stack dev. " />
        <meta property="og:image" content="/images/index.jpg" />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://artemnikitin.dev/" />
        <meta property="twitter:title" content="Artem Nikitin" />
        <meta property="twitter:description" content="A self-starter self-taught full stack dev. " />
        <meta property="twitter:image" content="/images/index.jpg" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <DynamicBackground></DynamicBackground>
      <ParticleBackground numOfParticles={100}></ParticleBackground>
      <main ref={mainMenuRef} className="relative w-full  z-10 pointer-events-none">
        <div className="flex  items-center w-full min-h-screen gap-2 flex-col ">
          <header role={"heading"} aria-level={1} className="flex flex-col mt-[7.5rem] md:mt-10 lg:mt-[7.5rem] lg:ml-[7.5rem]  items-start w-full pl-10">
            <TypedText time={2000} className="text-star-100  bg-clip-text font-montserrat font-extralight text-left tracking-tighter text-4xl lg:text-6xl">
              Hi. My name is Art.
            </TypedText>
          </header>
          <div className="spacer flex-1"></div>
          <div role={"contentinfo"} className=" lg:self-end w-fit min-w-[26rem] md:min-w-[40rem] min-h-[6ch] flex flex-1 flex-col gap-20  pl-40 md:px-40 pointer-events-none text-4xl lg:text-5xl">
            <TypedText
              aria-label={"Projects"}
              onClick={() => scrollToProjects()}
              time={400}
              delayStart={2000}
              className="text-plasma-100 select-none w-fit pointer-events-auto font-montserrat font-thin  text-shadow-none hover:text-shadow cursor-pointer shadow-plasma-500 duration-700 pl-10"
            >
              Projects
            </TypedText>
            <TypedText
              aria-label={"Skills"}
              onClick={() => scrollToSkills()}
              time={400}
              delayStart={2500}
              className="text-plasma-100 select-none w-fit pointer-events-auto font-montserrat font-thin text-shadow-none hover:text-shadow cursor-pointer shadow-plasma-500 duration-700 pl-10"
            >
              Skills
            </TypedText>
            <TypedText
              aria-label={"About Me"}
              onClick={() => scrollToAboutMe()}
              time={400}
              delayStart={3000}
              className="text-plasma-100 select-none w-fit pointer-events-auto font-montserrat font-thin text-shadow-none hover:text-shadow cursor-pointer shadow-plasma-500 duration-700 pl-10"
            >
              About Me
            </TypedText>
          </div>
          <div className="spacer flex-1"></div>
        </div>
        <div className="relative">
          <GradientBackground></GradientBackground>
          <section ref={projectsRef} aria-labelledby="projects-header" className="relative w-full min-h-screen p-8 flex flex-col gap-5 pointer-events-auto">
            <h4 title="Projects" id="projects-header" role={"heading"} aria-level={2} className="text-4xl select-none text-nebula-100 font-montserrat font-thin mb-10">
              Projects
            </h4>
            <div role={"article"} className="xl:mx-auto max-h-[75%] md:max-h-screen xl:max-h-fit h-fit overflow-x-scroll  xl:overflow-x-auto  " {...fullyScrolledProps}>
              <div className=" flex flex-row flex-wrap gap-5 w-[44rem] md:w-[64rem] lg:w-[84rem] min-w-[90vw] h-fit justify-center ">
                {projects &&
                  projects.map((project, i) => {
                    return <ProjectBlurb key={i} {...project.details}></ProjectBlurb>;
                  })}
              </div>
            </div>
            <div className="flex justify-end items-center gap-2 xl:hidden">
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
          <section aria-labelledby="skills-header" ref={skillsRef} className="relative w-full  overflow-hidden h-screen p-8 flex flex-col gap-2 sm:gap-5 pointer-events-auto">
            <h4 title="Skills" id="skills-header" role={"heading"} aria-level={2} className="text-4xl select-none text-nebula-100 font-montserrat font-thin leading-3 sm:leading-normal">
              Skills
            </h4>
            <div className="flex-1 h-0 sm:h-auto"></div>
            <div role={"article"} className="flex gap-5 p-2 flex-wrap items-center justify-evenly">
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
          <section ref={aboutMeRef} aria-labelledby={"about-me-header"} className="relative w-full h-screen p-8 flex flex-col gap-5 pointer-events-auto">
            <h4 title="About Me" id="about-me-header" role={"heading"} aria-level={2} className="text-4xl select-none text-nebula-100 font-montserrat font-thin ">
              About Me
            </h4>
            <div className="flex-1"></div>
            <div role={"article"} className="flex flex-col gap-5 pointer-events-auto font-lato text-star-100 md:text-lg lg:text-xl lg:pl-40">
              <p className="">Hi!</p>
              <p className="">I am a programmer based in Toronto, Canada. I love a good challenge and learning new skills.</p>
              <p> Currently open to new opportunities.</p>
              <p className="">
                Email me at:
                <a className=" bg-gradient-to-br from-plasma-500 to-star-500 bg-clip-text text-transparent hover:bg-gradient-to-b" href="mailto:hello@artemnikitin.dev">
                  {" "}
                  hello@artemnikitin.dev
                </a>
              </p>
              <p>Or find me on my socials:</p>
              <div className="flex justify-start items-center gap-4">
                <SocialIcon type="github" url="https://github.com/NeedToUpdate"></SocialIcon>
                <SocialIcon type="linkedin" url="https://linkedin.com/in/artem-nikitin-dev"></SocialIcon>
              </div>
            </div>
            <div className="flex-1"></div>
            <div className="flex-1"></div>
            <div className="w-full md:h-[40vh] sm:h-[50vh] h-[40vh] absolute bottom-0 right-0  object-contain pointer-events-none">
              {!imageLoaded && <PictureLoader></PictureLoader>}
              <Image onLoad={() => setImageLoaded(true)} className="absolute bottom-0 right-0 md:h-[40vh] sm:h-[50vh] h-[40vh] w-auto" src={"/images/me.webp"} alt={"A picture of Artem"} width={761} height={1000}></Image>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

import fs from "fs";
import matter from "gray-matter";
import React, { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useInView } from "react-intersection-observer";
import { useScroll } from "../components/utils/onScrollHook";
import { ISkill, ProjectLink } from "../components/utils/types";
import DynamicBackground from "../components/dynamicBackground";
import GradientBackground from "../components/gradientBackground";
import AnimatedArrow from "../components/icons/animatedArrow";
import ParticleBackground from "../components/particleBackground";
import ProjectBlurb from "../components/projectBlurb";
import TypedText from "../components/typedText";
import SkillIcon from "../components/skillIcon";
import SocialIcon from "../components/socialIcon";
import PictureLoader from "../components/pictureLoader";
import CustomHead from "../components/customHead";

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
    //TODO move this to a file
    {
      tech: "react",
      prettyName: "ReactJS",
      years: 4,
    },
    {
      tech: "typescript",
      prettyName: "TypeScript",
      years: 6,
    },
    {
      tech: "python",
      prettyName: "Python",
      years: 6,
    },
    {
      tech: "html",
      prettyName: "HTML5",
      years: 6,
    },
    {
      tech: "sass",
      prettyName: "CSS/SCSS",
      years: 6,
    },
    {
      tech: "django",
      prettyName: "Django",
      years: 3,
    },
    {
      tech: "nodejs",
      prettyName: "Node.js",
      years: 4,
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
      years: 2,
    },
    {
      tech: "aws",
      prettyName: "AWS",
      years: 2,
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

  const [skillsVisibilityRef, skillsInView] = useInView({
    triggerOnce: true,
    rootMargin: "0px 0px",
  });

  if (typeof window !== "undefined" && !window.IntersectionObserver) {
    //if this page is loaded with jest, the intersection observer is undefined
    return (
      <>
        <CustomHead></CustomHead>
      </>
    );
  }
  return (
    <div className="w-full h-full relative">
      <CustomHead></CustomHead>
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
          <div role={"contentinfo"} className=" lg:self-end w-fit min-w-[26rem] md:min-w-[40rem] min-h-[28rem] lg:min-h-[32rem] flex flex-1 flex-col gap-20  pl-40 md:px-40 pointer-events-none text-4xl lg:text-5xl">
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
            <div role={"article"} className="xl:mx-auto max-h-[75%] md:max-h-screen xl:max-h-fit h-fit overflow-x-auto  xl:overflow-x-auto  " {...fullyScrolledProps}>
              <div className="grid grid-rows-2 grid-flow-col lg:grid-flow-row grid-cols-none lg:grid-rows-none lg:grid-cols-3 xl:grid-cols-4 gap-5 w-full h-fit justify-items-center ">
                {projects &&
                  projects
                    .sort((a, b) => b.details.priority - a.details.priority)
                    .map((project, i) => {
                      return <ProjectBlurb key={i} {...project.details}></ProjectBlurb>;
                    })}
              </div>
            </div>
            <div className="flex justify-end items-center gap-2 lg:hidden">
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
          <section
            aria-labelledby="skills-header"
            ref={(el: HTMLDivElement) => {
              skillsRef.current = el;
              skillsVisibilityRef(el);
            }}
            className="relative w-full  overflow-hidden h-screen p-8 flex flex-col gap-2 sm:gap-5 pointer-events-auto"
          >
            <h4 title="Skills" id="skills-header" role={"heading"} aria-level={2} className="text-4xl select-none text-nebula-100 font-montserrat font-thin leading-3 sm:leading-normal">
              Skills
            </h4>
            <div className="flex-1 h-0 sm:h-auto"></div>
            <div role={"article"} className="flex gap-5 p-2 flex-wrap items-center justify-evenly">
              {skills &&
                skills
                  .sort((a, b) => b.years - a.years)
                  .map((skill, i) => {
                    return <SkillIcon key={i} background={(i % 3) as 0 | 1 | 2} className={`${skillsInView ? "animate-fade-in" : ""} animation-delay-[${i * 125}ms]`} {...skill}></SkillIcon>;
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
              <div className="flex gap-1 w-full justify-between">
                <div className="flex flex-col gap-2">
                  <p>
                    {" "}
                    Senior Engineer & Lead at{" "}
                    <a className="bg-gradient-to-br from-white to-plasma-500 bg-clip-text text-transparent hover:bg-gradient-to-b" href="https://www.the4d.ca">
                      The Fourth Dimension
                    </a>
                    .
                  </p>
                  <p className="pt-5">
                    Got inquiries? Email me at:
                    <a className=" bg-gradient-to-br from-plasma-500 to-star-500 bg-clip-text text-transparent hover:bg-gradient-to-b" href="mailto:hello@artemnikitin.dev">
                      {" "}
                      hello@artemnikitin.dev
                    </a>
                  </p>
                </div>
                <Link className="group  md:mr-[30%]" href="https://www.credly.com/badges/aa792a78-2c50-4375-aa8a-41dbb065beea">
                  <Image
                    title="AWS Certified Solutions Architect - Click to Verify!"
                    className=" group-hover:translate-y-[-1px] duration-300  md:w-[10rem] md:h-[10rem]"
                    src="/images/aws_saa_cert.png"
                    alt="AWS Certified Solutions Architect"
                    width="100"
                    height="100"
                  ></Image>
                </Link>{" "}
              </div>
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
              <Image onLoad={() => setImageLoaded(true)} className="absolute bottom-0 right-0 md:h-[40vh] sm:h-[50vh] h-[40vh] w-auto" src={"/images/me.webp"} alt={"A picture of Art"} width={761} height={1000}></Image>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

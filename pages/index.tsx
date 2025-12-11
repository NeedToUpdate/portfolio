import fs from "fs";
import matter from "gray-matter";
import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useInView } from "react-intersection-observer";
import { useScroll } from "../components/utils/onScrollHook";
import {
  ISkill,
  ISystemLink,
  IProjectLink,
  ISystemBlurb,
} from "../components/utils/types";
import DynamicBackground from "../components/dynamicBackground";
import GradientBackground from "../components/gradientBackground";
import AnimatedArrow from "../components/icons/animatedArrow";
import ParticleBackground from "../components/particleBackground";
import ProjectBlurb from "../components/projectBlurb";
import TypedText from "../components/typedText";
import SkillIcon from "../components/skillIcon";
import SocialIcon from "../components/socialIcon";
import CustomHead from "../components/customHead";
import { skills } from "../components/utils/skills";
import SubHeading from "../components/basic/subheading";
import SystemSectionMain from "../components/systemSectionMain";

export async function getStaticProps() {
  const files = fs.readdirSync("_projects");
  const projects: IProjectLink[] = files.map((fileName) => {
    const slug = fileName.replace(".md", "");

    const readFile = fs.readFileSync(`_projects/${fileName}`, "utf-8");

    const { data: details } = matter(readFile);

    return {
      slug,
      details,
    } as IProjectLink;
  });

  const systems_files = fs.readdirSync("_systems");
  const systems: ISystemLink[] = systems_files.map((fileName) => {
    const slug = fileName.replace(".md", "");

    const readFile = fs.readFileSync(`_systems/${fileName}`, "utf-8");

    const { data: details, content: body } = matter(readFile);

    return {
      slug,
      details,
      body,
    } as ISystemLink;
  });

  const markdown = fs.readFileSync(`_content/systems.md`).toString();
  const systemBlurbData = matter(markdown);

  const systemBlurb = {
    title: systemBlurbData.data.title,
    sencence: systemBlurbData.data.sentence,
    body: systemBlurbData.content,
  };

  return {
    props: {
      projects: projects,
      skills: skills,
      systems: systems,
      systemBlurb: systemBlurb,
    }, // will be passed to the page component as props
  };
}

interface props {
  projects: IProjectLink[];
  skills: ISkill[];
  systems: ISystemLink[];
  systemBlurb: ISystemBlurb;
}

export default function Home(props: props) {
  const { projects, skills, systems, systemBlurb } = props;
  const [fullyScrolled, fullyScrolledProps] = useScroll(90, "horiz");

  const mainMenuRef = useRef<null | HTMLDivElement>(null);
  const scrollToTop = () => {
    if (mainMenuRef.current)
      mainMenuRef.current.scrollIntoView({ behavior: "smooth" });
  };
  const systemsRef = useRef<null | HTMLDivElement>(null);
  const scrollToSystems = () => {
    if (systemsRef.current)
      systemsRef.current.scrollIntoView({ behavior: "smooth" });
  };
  const projectsRef = useRef<null | HTMLDivElement>(null);
  const scrollToProjects = () => {
    if (projectsRef.current)
      projectsRef.current.scrollIntoView({ behavior: "smooth" });
  };
  const skillsRef = useRef<null | HTMLDivElement>(null);
  const scrollToSkills = () => {
    if (skillsRef.current)
      skillsRef.current.scrollIntoView({ behavior: "smooth" });
  };
  const aboutMeRef = useRef<null | HTMLDivElement>(null);
  const scrollToAboutMe = () => {
    if (aboutMeRef.current)
      aboutMeRef.current.scrollIntoView({ behavior: "smooth" });
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
      <main
        ref={mainMenuRef}
        className="relative w-full  z-10 pointer-events-none"
      >
        <div className="flex  items-center w-full min-h-screen gap-2 flex-col ">
          <header
            role={"heading"}
            aria-level={1}
            className="flex flex-col mt-[7.5rem] md:mt-10 lg:mt-[7.5rem] lg:ml-[7.5rem]  items-start w-full pl-10 mb-[15vh]"
          >
            <TypedText
              time={2000}
              className="text-star-100  bg-clip-text font-montserrat font-extralight text-left tracking-tighter text-4xl lg:text-6xl"
            >
              Hi. My name is Art.
            </TypedText>
          </header>
          <div
            role={"contentinfo"}
            className=" lg:self-end justify-start w-fit min-w-[26rem] md:min-w-[40rem] min-h-[30rem] lg:min-h-[34rem] flex flex-1 flex-col gap-20  pl-40 md:px-40 pointer-events-none text-4xl lg:text-5xl"
          >
            <TypedText
              aria-label={"Systems"}
              onClick={() => scrollToSystems()}
              time={400}
              delayStart={2000}
              className="text-plasma-100 select-none w-fit pointer-events-auto font-montserrat font-thin text-shadow-none hover:text-shadow cursor-pointer shadow-plasma-500 duration-700 pl-10"
            >
              Systems
            </TypedText>
            <TypedText
              aria-label={"Projects"}
              onClick={() => scrollToProjects()}
              time={400}
              delayStart={2500}
              className="text-plasma-100 select-none w-fit pointer-events-auto font-montserrat font-thin  text-shadow-none hover:text-shadow cursor-pointer shadow-plasma-500 duration-700 pl-10"
            >
              Projects
            </TypedText>
            <TypedText
              aria-label={"Skills"}
              onClick={() => scrollToSkills()}
              time={400}
              delayStart={3000}
              className="text-plasma-100 select-none w-fit pointer-events-auto font-montserrat font-thin text-shadow-none hover:text-shadow cursor-pointer shadow-plasma-500 duration-700 pl-10"
            >
              Skills
            </TypedText>
            <TypedText
              aria-label={"About Me"}
              onClick={() => scrollToAboutMe()}
              time={400}
              delayStart={3500}
              className="text-plasma-100 select-none w-fit pointer-events-auto font-montserrat font-thin text-shadow-none hover:text-shadow cursor-pointer shadow-plasma-500 duration-700 pl-10"
            >
              About Me
            </TypedText>
          </div>
          <div className="spacer flex-1"></div>
        </div>
        <div className="relative">
          <GradientBackground></GradientBackground>
          <section
            ref={systemsRef}
            aria-labelledby="systems-header"
            className="relative w-full min-h-screen p-8 flex flex-col gap-5 pointer-events-auto "
          >
            <SubHeading title="Systems" id="systems-header" />
            <div className="min-h-[80vh] w-full flex flex-col pt-[2vh] md:pt-[10vh] items-center">
              <SystemSectionMain systems={systems} blurb={systemBlurb} />
            </div>
          </section>
          <section
            ref={projectsRef}
            aria-labelledby="projects-header"
            className="relative w-full min-h-screen p-8 flex flex-col gap-5 pointer-events-auto "
          >
            <SubHeading title="Projects" id="projects-header" />
            <div
              role={"article"}
              className="xl:mx-auto max-h-[75%] md:max-h-screen xl:max-h-fit h-fit overflow-x-auto  xl:overflow-x-auto  mt-10 "
              {...fullyScrolledProps}
            >
              <div className="grid grid-rows-2 grid-flow-col lg:grid-flow-row grid-cols-none lg:grid-rows-none lg:grid-cols-3 xl:grid-cols-4 gap-5 w-full h-fit justify-items-center ">
                {projects &&
                  projects
                    .sort((a, b) => b.details.priority - a.details.priority)
                    .map((project, i) => {
                      return (
                        <ProjectBlurb
                          key={i}
                          {...project.details}
                        ></ProjectBlurb>
                      );
                    })}
              </div>
            </div>
            <div className="flex justify-end items-center gap-2 lg:hidden">
              {fullyScrolled ? (
                <TypedText
                  time={100}
                  className="text-lg font-thin text-nebula-100"
                >
                  More coming soon!
                </TypedText>
              ) : (
                <>
                  <TypedText
                    time={100}
                    className="text-lg font-thin text-nebula-100"
                  >
                    Scroll for more
                  </TypedText>
                </>
              )}
              <AnimatedArrow
                state={fullyScrolled ? 1 : 0}
                className={`w-6 h-6 duration-1000 ${
                  fullyScrolled ? "rotate-0" : "rotate-[360deg]"
                }`}
              ></AnimatedArrow>
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
            <SubHeading title="Skills" id="skills-header" />
            <div className="flex-1 h-0 sm:h-auto"></div>
            <div
              role={"article"}
              className="flex gap-5 lg:gap-10 p-2 flex-wrap items-center justify-center max-w-7xl mx-auto"
            >
              {skills &&
                skills
                  .sort((a, b) => b.years - a.years)
                  .map((skill, i) => {
                    return (
                      <SkillIcon
                        key={i}
                        background={(i % 3) as 0 | 1 | 2}
                        className={`${
                          skillsInView ? "animate-fade-in" : ""
                        } animation-delay-[${i * 125}ms]`}
                        {...skill}
                      ></SkillIcon>
                    );
                  })}
            </div>
            <p className="font-lato font-thin text-nebula-100 text-center">
              There are a few dozen more that wont fit on here. Email me for
              inquiries!
            </p>
            <div className="flex-1"></div>
          </section>
          <section
            ref={aboutMeRef}
            aria-labelledby={"about-me-header"}
            className="relative w-full h-screen p-8 flex flex-col gap-5 pointer-events-auto"
          >
            <SubHeading title="About Me" id="about-me-header" />
            <div className="flex-1"></div>
            <div
              role={"article"}
              className="flex flex-col gap-5 pointer-events-auto font-lato text-star-100 md:text-lg lg:text-xl lg:pl-40"
            >
              <p className="">Hi!</p>
              <p className="">
                I am a solutions architect based in Toronto, Canada. I love a
                good challenge and learning new skills.
              </p>
              <div className="flex gap-1 w-full justify-between">
                <div className="flex flex-col gap-2">
                  <p>
                    {" "}
                    Architect & Lead at{" "}
                    <a
                      className="bg-gradient-to-br from-white to-plasma-500 bg-clip-text text-transparent hover:bg-gradient-to-b"
                      href="https://www.the4d.ca"
                    >
                      The Fourth Dimension
                    </a>
                    .
                  </p>
                  <p className="pt-5">
                    Got inquiries? Email me at:
                    <a
                      className=" bg-gradient-to-br from-plasma-500 to-star-500 bg-clip-text text-transparent hover:bg-gradient-to-b"
                      href="mailto:hello@artnikitin.dev"
                    >
                      {" "}
                      hello@artnikitin.dev
                    </a>
                  </p>
                </div>
                <Link
                  className="group  md:mr-[30%]"
                  href="https://www.credly.com/badges/aa792a78-2c50-4375-aa8a-41dbb065beea"
                >
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
                <SocialIcon
                  type="github"
                  url="https://github.com/NeedToUpdate"
                ></SocialIcon>
                <SocialIcon
                  type="linkedin"
                  url="https://linkedin.com/in/art-nikitin-dev"
                ></SocialIcon>
              </div>
            </div>
            <div className="flex-1"></div>
            <div className="flex-1"></div>
          </section>
        </div>
      </main>
    </div>
  );
}

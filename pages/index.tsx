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
      url: "https://www.icandoathing.com/thing/TV8vmq",
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
        <meta name="description" content="The work of Artem" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <link rel="icon" href="/favicon.ico" />
      </Head>
      <DynamicBackground></DynamicBackground>
      <ParticleBackground numOfParticles={100}></ParticleBackground>
      <main ref={mainMenuRef} className="relative w-full  z-10 pointer-events-none">
        <div className="flex  items-center w-full h-screen gap-2 flex-col ">
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
        <section ref={projectsRef} aria-labelledby="projects-header" className="relative w-full h-screen p-8 flex flex-col gap-5 pointer-events-auto">
          <GradientBackground></GradientBackground>
          <h4 title="Projects" id="projects-header" role={"heading"} aria-level={2} className="text-4xl select-none text-nebula-100 font-montserrat font-thin mb-10">
            Projects
          </h4>
          <div role={"article"} className="flex max-h-[75%] md:max-h-screen lg:max-h-fit h-fit overflow-x-scroll overflow-y-visible lg:overflow-x-auto  lg:justify-center pointer-events-auto" {...fullyScrolledProps}>
            <div className=" flex flex-row flex-wrap gap-5 w-[44rem] md:w-[64rem] lg:w-[84rem] min-w-[90vw] h-fit justify-center pointer-events-auto">
              {projects &&
                projects.map((project, i) => {
                  return <ProjectBlurb key={i} url={project.url} title={project.title} description={project.description} techs={project.techs} image={project.thumbnail} bright={project.brightImage}></ProjectBlurb>;
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
            <p> Currently open to new work.</p>
            <p className="">
              Email me at:
              <a className=" bg-gradient-to-br from-plasma-500 to-star-500 bg-clip-text text-transparent hover:bg-gradient-to-b" href="mailto:hello@artemnikitin.dev">
                {" "}
                hello@artemnikitin.dev
              </a>
            </p>
          </div>
          <div className="flex-1"></div>
          <div className="flex-1"></div>
          <div className="w-full md:h-[40vh] sm:h-[50vh] h-[40vh] absolute bottom-0 right-0  object-contain">
            {!imageLoaded && (
              <svg id="artem-loader" data-name="artem-loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 532.72 719.1" className="bottom-0  right-0 absolute  md:h-[40vh] sm:h-[50vh] h-[40vh] w-auto">
                <defs>
                  <linearGradient id="fillAnim" gradientTransform="rotate(70)">
                    <stop offset="0%" stopColor="#0f0f0f" />
                    <stop offset="33%" stopColor="#0f0f0f" />
                    <stop offset="50%" stopColor="#1e1e1e" />
                    <stop offset="67%" stopColor="#0f0f0f" />
                    <stop offset="100%" stopColor="#0f0f0f" />
                    <animateTransform attributeName="gradientTransform" type="translate" from="-1 0" to="1 0" begin="0s" dur="1.5s" repeatCount="indefinite" />
                  </linearGradient>
                </defs>
                <path
                  fill="url(#fillAnim)"
                  d="M499.61,718.6c20.72-58.89,26-124.37,30.08-187.76C530.84,475,540.24,417,513.51,367.57c-8-14.67-9.05-13.5-23.12-18.85-22.33-7.7-43.73-24.08-63.35-38.08-17.68-8-29.46-28.27-49.47-31.69-25.93-20.53-15.85-57.89-11.76-85.77,7.67-5.17,15.17-11.59,17.6-21.06,14.5-58.35-10.32-30-15.5-71.62,3.64-47.58-44.83-116.63-96.33-96.37-1.68.73-3.3,1.32-4.54-.71-1.28-.48-1,1.64-1.32,2.55-3.14.24-5.49,2.27-8.85,1.68-7.28-2.78-6.32,8.79-21.22,8l2,2.38c-13.13-1.54-37.16,31.38-46.48,42.18-6.17,15.59,7.84,30.51,5.55,46.34-1.53,15.81,2.88,31.46-1.43,46.69.71,9.17,11.88,13.27,11.41,23,0,33.6,14,63.89,34,90-1.29,12.87-40.85,8.43-51.67,7.26-7.61-1.44-13.31,1-17.79,6.78-14.23,5.43-23.53,20.75-33,31.49-10.09,10-11,25.73-22.2,35.33-5,4.88-2.54,12.91-7,18.28C79.13,417.25,27.37,460,15.76,520.59,7,544.52-12.18,585.49,13,603.79c.77,2.12,2.83.84,4.2,1.35,2.66,3.13,7.46-.58,9.87,2.71,5.86,1.26,8,8.68,13.62,10.87a305.86,305.86,0,0,1,34.44,24.86C94.31,653,111,661,133.36,659.77c10.17-.92,6.45,14.43,3.75,19.54-.44,3.94.07,8.22-1.63,11.72.12,9.81-2.81,18.1-4,27.57Z"
                />
              </svg>
            )}
            <Image onLoad={() => setImageLoaded(true)} className="absolute bottom-0 right-0 md:h-[40vh] sm:h-[50vh] h-[40vh] w-auto" src={"/images/me.webp"} alt={"A picture of Artem"} width={761} height={1000}></Image>
          </div>
        </section>
      </main>
    </div>
  );
}

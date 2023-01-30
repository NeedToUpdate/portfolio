import React from "react";
import TechIcon, { TechType } from "./techIcon";
import Image from "next/image";
import MoreIcon from "./icons/moreIcon";
import Link from "next/link";
interface props {
  title: string;
  description: string;
  techs: TechType[];
  thumbnail: string;
  brightImage?: boolean;
  url?: string;
}

export default function ProjectBlurb(props: props) {
  const { title, description, techs, thumbnail, url } = props;
  return (
    <div className="flex flex-col gap-2 md:gap-3 min-h-[45%] w-40 md:w-[15rem]  lg:w-[20rem] ">
      <div className="overflow-hidden rounded-md relative">
        <Image style={{ objectFit: "cover" }} className="h-[12rem] md:h-[15rem] w-40 md:w-[18rem]  lg:w-[20rem] object-cover" alt={title} width={200} height={200} src={thumbnail}></Image>
        <div className={`absolute bottom-0 right-0 max-w-[50%] w-fit max-h-[26px] px-1 flex gap-1 ${props.brightImage ? "bg-slate-800/90" : "bg-white/80"} rounded-tl-md`}>
          {techs.map((tech, i) => {
            return <TechIcon size={24} key={i} tech={tech}></TechIcon>;
          })}
        </div>
        <div className={`absolute top-0 right-0 p-1 ${props.brightImage ? "text-slate-600 hover:text-plasma-700" : "text-white hover:text-plasma-100"} duration-300 cursor-pointer hover:rotate-[360deg] hover:translate-y-[-2px]`}>
          <Link role={"link"} href={url || "/"}>
            <MoreIcon className="w-8 h-8  drop-shadow-sm "></MoreIcon>
          </Link>
        </div>
      </div>
      <div className="flex w-full h-fit flex-row overflow-hidden select-none">
        <div className="w-[1px] bg-plasma-500 h-full border-plasma-500 border-[1px] mr-2 side-glow shadow-plasma-500"></div>
        <div className="flex flex-1 gap-2 flex-col leading-4 py-2">
          <h2 role={"heading"} aria-level={3} className="font-laco text-xs leading-tight sm:leading-normal sm:text-md text-plasma-100/80  md:text-center">
            {title}
          </h2>
          <p role={"note"} className="font-laco text-xs leading-tight sm:leading-normal sm:text-md font-thin text-plasma-100/60 md:text-center">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

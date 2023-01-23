import React from "react";
import TechIcon, { TechType } from "./techIcon";
import Image from "next/image";
import MoreIcon from "./icons/moreIcon";
interface props {
  title: string;
  description: string;
  techs: TechType[];
  image: string;
  bright?: boolean;
}

export default function ProjectBlurb(props: props) {
  const { title, description, techs, image } = props;
  return (
    <div className="flex flex-col gap-2 w-40 h-fit">
      <div className="w-40 h-[12rem] overflow-hidden rounded-md relative">
        <Image style={{ objectFit: "cover" }} className="h-[12rem] w-40 object-cover" alt={title} width={200} height={200} src={image}></Image>
        <div className={`absolute bottom-0 right-0 w-[50%] pl-1 flex gap-1 ${props.bright ? "bg-slate-200/60" : "bg-white/80"} rounded-tl-md`}>
          {techs.map((tech, i) => {
            return <TechIcon size={24} key={i} tech={tech}></TechIcon>;
          })}
        </div>
        <div className={`absolute top-0 right-0 p-1 ${props.bright ? "text-slate-600 hover:text-plasma-700" : "text-white hover:text-plasma-100"} duration-300 cursor-pointer hover:rotate-[360deg] hover:translate-y-[-2px]`}>
          <MoreIcon className="w-8 h-8  drop-shadow-sm "></MoreIcon>
        </div>
      </div>
      <div className="flex w-full h-fit flex-row overflow-hidden select-none">
        <div className="w-[1px] bg-plasma-500 h-full border-plasma-500 border-[1px] mr-2 side-glow shadow-plasma-500"></div>
        <div className="flex gap-2 flex-col leading-4 py-2">
          <h2 className="font-laco text-md text-plasma-100/80 ">{title}</h2>
          <p className="font-laco text-md font-thin text-plasma-100/60">{description}</p>
        </div>
      </div>
    </div>
  );
}

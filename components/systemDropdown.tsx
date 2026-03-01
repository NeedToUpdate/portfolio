import { ISystemLink } from "./utils/types";
import { ChevronDownIcon } from "./icons/chevronDown";
import React, { useRef, useState } from "react";
import { useOutsideClick } from "./utils/useOutsideClick";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SkillPill from "./skillPill";

export interface ISystemDropdownProps {
  system: ISystemLink;
}

export default function SystemDropdown(props: ISystemDropdownProps) {
  const { system } = props;

  const [isOpen, setIsOpen] = useState(false);

  const descriptionRef = useRef<HTMLDivElement>(null);

  useOutsideClick(descriptionRef, () => setIsOpen(false));

  return (
    <div
      className={`w-full flex relative flex-col border-[1px] border-white rounded-md p-1 md:p-2 lg:p-4 min-h-12 md:min-h-24 overflow-hidden  transition-[max-height] ease-in-out 
        shadow-md shadow-nebula-500/30
        will-change-max-height duration-300
        ${isOpen ? "max-h-[1000px]" : "max-h-16 md:max-h-24"}`}
      onClick={() => setIsOpen(!isOpen)}
      ref={descriptionRef}
    >
      <div className="flex flex-col h-16 justify-between hover:cursor-pointer ">
        <div className="flex flex-row justify-between items-center text-white">
          <h4 className="text-plasma-500 text-md sm:text-lg lg:text-2xl font-bold select-none">
            {system.details.title}
          </h4>
          <ChevronDownIcon
            className={`w-6 h-6 duration-150 ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </div>
        <p className=" invisible text-xs sm:visible md:text-sm text-plasma-100 select-none">
          {system.details.impact}
        </p>
      </div>
      <div
        className={`flex flex-col text-white h-full bg-slate-800/80 my-2 p-1 md:p-2 rounded-md duration-100 max-h-[60vh] overflow-y-auto
             ${isOpen ? "" : "opacity-0"}`}
      >
        <div className="flex flex-col gap-2 ">
          <p className="visible text-xs sm:hidden md:text-sm text-plasma-100 select-none">
            {system.details.impact}
          </p>
          <div className="flex flex-wrap gap-2 py-1 md:py-2">
            {system.details.techs.map((skill) => (
              <SkillPill key={skill} skill={skill} />
            ))}
          </div>
          <div className="prose prose-sm prose-white whitespace-pre-wrap text-sm md:text-md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {system.body}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}

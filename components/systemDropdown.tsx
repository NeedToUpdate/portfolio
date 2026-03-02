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
      className={`w-full flex relative flex-col border border-white/10 border-l-2 border-l-plasma-500 rounded-lg p-3 md:p-5 lg:p-6 min-h-28 md:min-h-28 overflow-hidden transition-[max-height] ease-in-out
        hover:bg-white/[0.03] hover:border-white/20
        shadow-md shadow-nebula-500/30
        will-change-max-height duration-300
        ${isOpen ? "max-h-[1000px]" : "max-h-28"}`}
      onClick={() => setIsOpen(!isOpen)}
      ref={descriptionRef}
    >
      <div className="flex flex-col min-h-16 justify-between hover:cursor-pointer">
        <div className="flex flex-row justify-between items-center text-white">
          <h4 className="text-plasma-500 text-sm sm:text-xl lg:text-2xl font-semibold select-none leading-tight truncate sm:whitespace-normal">
            {system.details.title}
          </h4>
          <ChevronDownIcon
            className={`w-5 h-5 text-white/40 duration-200 flex-shrink-0 ml-4 ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </div>
        <p className="text-sm text-white/50 select-none mt-2">
          {system.details.impact}
        </p>
      </div>
      <div
        className={`flex flex-col text-white h-full bg-white/[0.04] mt-4 p-3 md:p-4 rounded-md duration-150 max-h-[60vh] overflow-y-auto
             ${isOpen ? "" : "opacity-0"}`}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
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

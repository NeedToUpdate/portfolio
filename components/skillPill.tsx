import * as React from "react";
import { TechType } from "./techIcon";
import { skills } from "./utils/skills";

export interface ISkillPillProps {
  skill: TechType;
}

export default function SkillPill(props: ISkillPillProps) {
  const { skill } = props;
  const prettyName = skills.find((s) => s.tech === skill)?.prettyName;
  return (
    <div className="flex gap-1 items-center bg-gradient-to-tr from-nebula-700 to-plasma-700 px-2 rounded-full select-none text-star-100 font-thin">
      <p>{prettyName}</p>
    </div>
  );
}

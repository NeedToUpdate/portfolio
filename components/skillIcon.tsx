import React from "react";
import { TechType } from "./techIcon";
import Image from "next/image";

interface props {
  tech: TechType;
  prettyName: string;
  className?: string;
  background: 0 | 1 | 2;
  years: number;
}

const pluralRules = new Intl.PluralRules("en-US");

function pluralize(count: number) {
  const grammaticalNumber = pluralRules.select(count);
  switch (grammaticalNumber) {
    case "one":
      return count + " " + "year";
    case "other":
      return count + " " + "years";
  }
}

function getBg(index: 0 | 1 | 2) {
  switch (index) {
    case 0:
      return "bg-gradient-to-br from-star-500 to-plasma-500";
    case 1:
      return "bg-gradient-to-br from-nebula-500 to-plasma-500";
    case 2:
      return "bg-gradient-to-br from-star-500 to-nebula-500";
  }
}
function getTextColor(years: number) {
  if (years >= 4) {
    return "to-star-500/60 ";
  } else if (years >= 2) {
    return "to-plasma-500/60 ";
  } else {
    return "to-nebula-500/70 ";
  }
}

export default function SkillIcon(props: props) {
  const { tech, background, className, prettyName, years } = props;
  return (
    <div className="flex flex-col gap-1 items-center select-none">
      <div className={`${className} ${getBg(background)} relative rounded-full w-[4rem] h-[4rem] sm:w-20 sm:h-20 ease-in flex justify-center items-center`}>
        <Image className="" width={50} height={50} src={`/hq_icons/${tech}-icon.png`} alt={prettyName} title={`${pluralize(years)} of experience with ${prettyName}`}></Image>
        <div className="absolute rounded-full w-[4rem] h-[4rem] sm:w-20 sm:h-20 ease-in shine shadow-plasma-100/70 hover:shine-flipped duration-100"></div>
      </div>
      <h2 className="font-montserrat font-extralight text-nebula-100 text-xs sm:text-md">{prettyName}</h2>
      <p className={`font-montserrat text-transparent font-bold bg-gradient-to-bl from-nebula-100 ${getTextColor(years)} bg-clip-text text-xs sm:text-md`}>{pluralize(years)}</p>
    </div>
  );
}

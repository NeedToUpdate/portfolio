import { TechType } from "../techIcon";

export interface IProject {
  title: string;
  description: string;
  thumbnail: string;
  moreImages?: string[];
  techs: TechType[];
  brightImage?: boolean;
  url: string;
}

export interface ISkill {
  tech: TechType;
  prettyName: string;
  years: number;
}
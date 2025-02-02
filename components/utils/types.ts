import { TechType } from "../techIcon";

export interface IProject {
  title: string;
  description: string;
  thumbnail: string;
  moreImages?: string[];
  techs: TechType[];
  brightImage?: boolean;
  url: string;
  priority: number;
}

export interface ISkill {
  tech: TechType;
  prettyName: string;
  years: number;
}

export interface ISystem {
  title: string;
  description: string;
  techs: TechType[];
  impact: string;
  body: string;
  category: "reporting" | "infrastructure" | "data" | "payments";
}

export interface IProjectLink {
  slug: string;
  details: IProject;
}

export interface ISystemLink {
  slug: string;
  details: ISystem;
  body: string;
}

export interface ISystemBlurb {
  title: string;
  sencence: string;
  body: string;
}

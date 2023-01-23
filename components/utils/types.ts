import { TechType } from "../techIcon";

export interface IProject {
  title: string;
  description: string;
  thumbnail: string;
  moreImages?: string[];
  techs: TechType[];
  brightImage?: boolean;
}

import React from "react";
import Image from "next/image";

export type TechType =
  | "react"
  | "tailwind"
  | "numpy"
  | "postgresql"
  | "django"
  | "sass"
  | "nextjs"
  | "vuejs"
  | "html"
  | "mongodb"
  | "nodejs"
  | "python"
  | "typescript"
  | "javascript"
  | "pytorch"
  | "arduino"
  | "angular"
  | "wires"
  | "aws"
  | "serverless"
  | "splunk"
  | "redshift";

interface props {
  tech: TechType;
  size?: number;
}

export default function TechIcon(props: props) {
  const { size, tech } = props;
  return (
    <div className="object-fit flex justify-center items-center h-fit p-[2px] rounded-sm">
      <Image
        className="object-contain"
        title={`Made with ${tech[0].toLocaleUpperCase() + tech.slice(1)}.`}
        alt={tech}
        width={size || 12}
        height={size || 12}
        src={"/icons/" + tech + "-icon.png"}
      ></Image>
    </div>
  );
}

import "@testing-library/jest-dom";
import { render, waitFor } from "@testing-library/react";
import Home from "../pages";
import { IProject, ISkill } from "../components/utils/types";
jest.mock("next/head", () => {
  return {
    __esModule: true,
    default: ({ children }: { children: Array<React.ReactElement> }) => {
      return <>{children}</>;
    },
  };
});
describe("<html/>", () => {
  it("Has my name as title", async () => {
    render(<Home projects={[] as IProject[]} skills={[] as ISkill[]} />);
    await waitFor(() => {
      expect(document.title).toEqual("Artem Nikitin");
    });
  });
});

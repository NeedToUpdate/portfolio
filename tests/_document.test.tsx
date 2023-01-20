import Document from "../pages/_document";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Home from "../pages";
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
    render(<Home />, { container: document.head });
    await waitFor(() => {
      expect(document.title).toEqual("Artem Nikitin");
    });
  });
});

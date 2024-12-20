import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

// Mock all required components
jest.mock("@/components/audio-player", () => ({
  AudioPlayer: () => <div data-testid="audio-player">Audio Player Mock</div>,
}));

jest.mock("@/components/playlist", () => ({
  Playlist: () => <div data-testid="playlist">Playlist Mock</div>,
}));

jest.mock("@/components/settings-dialog", () => ({
  SettingsDialog: () => <div data-testid="settings">Settings Mock</div>,
}));

jest.mock("@/components/prelisten-audio-player", () => ({
  PrelistenAudioPlayer: () => <div data-testid="prelisten">Prelisten Mock</div>,
}));

jest.mock("@/components/ui/input", () => ({
  Input: ({ ...props }) => <input {...props} data-testid="search-input" />,
}));

jest.mock("@/components/folder-scanner", () => ({
  FolderScanner: () => (
    <div data-testid="folder-scanner">Folder Scanner Mock</div>
  ),
}));

describe("Home Page", () => {
  it("renders the header text correctly", () => {
    render(<Home />);
    expect(screen.getByText("Next DJ")).toBeInTheDocument();
  });

  it("renders the main components", () => {
    render(<Home />);
    // TODO: not test mock-data... :
    expect(screen.getByTestId("audio-player")).toBeInTheDocument();
    expect(screen.getByTestId("playlist")).toBeInTheDocument();
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });
});

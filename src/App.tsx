import { useState } from "react";
import "leaflet/dist/leaflet.css";
import Sidebar, { type SidebarTab } from "./components/Sidebar";
import PekaumanVillageMap from "./components/PekaumanVillageMap";

function App() {
  const [navTab, setNavTab] = useState<SidebarTab>("map");

  return (
    <div className="flex flex-row h-screen w-screen overflow-hidden bg-[#F5F5F5] text-[#171717] font-sans antialiased">
      <Sidebar
        activeTab={navTab}
        onSelectTab={(tab) => setNavTab(tab)}
      />
      <main className="flex-1 h-full relative overflow-hidden flex flex-col">
        <PekaumanVillageMap />
      </main>
    </div>
  );
}

export default App;

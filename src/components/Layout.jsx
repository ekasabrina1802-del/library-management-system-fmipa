import Header from "./Header";
import Footer from "./Footer";
import Sidebar from "./Sidebar";

export default function Layout({ children, showSidebar = true }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {showSidebar && <Sidebar />}

      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        marginLeft: showSidebar ? "240px" : "0",
        minWidth: 0,
      }}>
        <Header />

        <main style={{ flex: 1, padding: "24px" }}>
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}
import Header from "./components/Header";
import Hero from "./components/Hero";
import CtaCarte from "./components/CtaCarte";
import LeLieu from "./components/sections/LeLieu";
import Carte from "./components/sections/Carte";
import Galerie from "./components/sections/Galerie";
import Infos from "./components/sections/Infos";
import InstagramFeed from "./components/sections/InstagramFeed";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <CtaCarte />
        <LeLieu />
        <Carte />
        <Galerie />
        <Infos>
          <InstagramFeed />
        </Infos>
      </main>
      <Footer />
    </>
  );
}

import Header from "./components/Header";
import Hero from "./components/Hero";
import CtaCarte from "./components/CtaCarte";
import LeLieu from "./components/sections/LeLieu";
import Carte from "./components/sections/Carte";
import Galerie from "./components/sections/Galerie";
import Infos from "./components/sections/Infos";
import InstagramFeed from "./components/sections/InstagramFeed";
import Footer from "./components/Footer";
import ArdoiseBanner from "./components/ArdoiseBanner";
import { getActiveMenu, getParcoursCocktails } from "./lib/carte-repo";

export default function Home() {
  // Carte servie depuis la base (version publiée) : le menu complet + les
  // cocktails du parcours. Lecture synchrone, objets 100% sérialisables passés
  // en props au composant client. La publication côté admin revalide « / ».
  const menu = getActiveMenu();
  const cocktails = getParcoursCocktails();

  return (
    <>
      <ArdoiseBanner />
      <Header />
      <main>
        <Hero />
        <CtaCarte />
        <LeLieu />
        <Carte menu={menu} cocktails={cocktails} />
        <Galerie />
        <Infos>
          <InstagramFeed />
        </Infos>
      </main>
      <Footer />
    </>
  );
}

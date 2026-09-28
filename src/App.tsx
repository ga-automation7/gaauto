import { AmbientCosmos } from '@/components/layout/AmbientCosmos';
import { Footer } from '@/components/layout/Footer';
import { Grain } from '@/components/layout/Grain';
import { SmoothScroll } from '@/components/layout/SmoothScroll';
import { Header } from '@/components/navigation/Header';
import { CosmicBand } from '@/components/sections/bands/CosmicBand';
import { WhatWeBuild } from '@/components/sections/build/WhatWeBuild';
import { Aura } from '@/components/sections/aura/Aura';
import { OrbitBand } from '@/components/sections/bands/OrbitBand';
import { CinematicStage } from '@/components/sections/cinematic/CinematicStage';
import { CosmicScene } from '@/components/sections/cinematic/scenes/CosmicScene';
import { EyeScene } from '@/components/sections/cinematic/scenes/EyeScene';
import { FilmScene } from '@/components/sections/cinematic/scenes/FilmScene';
import { LightBridge } from '@/components/sections/cinematic/scenes/LightBridge';
import { Journal } from '@/components/sections/journal/Journal';
import { Manifesto } from '@/components/sections/manifesto/Manifesto';
import { BlackHoleSpace } from '@/components/sections/space/BlackHoleSpace';
import { Technology } from '@/components/sections/technology/Technology';
import { Transformation } from '@/components/sections/transformation/Transformation';
import { UseCases } from '@/components/sections/usecases/UseCases';

/**
 * The page's rhythm: the film (full-width cinematic) → an editorial statement →
 * an asymmetric card composition → a large cosmic visual → the technical system
 * → cards → a full-width cinematic transition → capabilities → developments →
 * the interactive space → the final call. One ambient atmosphere runs behind
 * all of it so sections melt into each other.
 */
export function App() {
  return (
    <SmoothScroll>
      <a className="skip-link" href="#about">
        Skip the film
      </a>
      <AmbientCosmos />
      <Header />
      <main id="main">
        {/* 01–03: one continuous film. Back → front: each scene sits beneath the one that hands off to it;
            the light bridge blends over both film and entity. */}
        <CinematicStage>
          <CosmicScene />
          <FilmScene />
          <LightBridge />
          <EyeScene />
        </CinematicStage>
        <Manifesto />
        <Journal />
        <CosmicBand />
        <Transformation />
        <Technology />
        <UseCases />
        <OrbitBand />
        <WhatWeBuild />
        <Aura />
        <BlackHoleSpace />
      </main>
      <Footer />
      <Grain />
    </SmoothScroll>
  );
}

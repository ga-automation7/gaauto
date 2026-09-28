/**
 * GSAP is registered exactly once, here. Import gsap and its plugins from this
 * module (never directly from 'gsap/…') so registration can't be forgotten.
 */
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin, CustomEase);

/**
 * Motion language: heavy, precise, cinematic. No overshoot, no bounce.
 *  - cinema   : slow departure, long confident arrival (camera moves)
 *  - reveal   : fast start, very long settle (text + UI reveals)
 *  - dive     : accelerating fall (entering the iris)
 *  - surface  : decelerating emergence (leaving the iris into the city)
 */
CustomEase.create('cinema', '0.7, 0, 0.18, 1');
CustomEase.create('reveal', '0.16, 1, 0.3, 1');
CustomEase.create('dive', '0.55, 0, 0.9, 0.35');
CustomEase.create('surface', '0.1, 0.65, 0.25, 1');

gsap.defaults({ ease: 'reveal', duration: 1 });

ScrollTrigger.config({
  // Mobile URL-bar show/hide must not trigger a full refresh mid-scroll.
  ignoreMobileResize: true,
});

export { CustomEase, DrawSVGPlugin, gsap, MotionPathPlugin, ScrollTrigger, SplitText, useGSAP };

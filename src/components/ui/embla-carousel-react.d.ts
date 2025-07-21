declare module "embla-carousel-react" {
  import type { EmblaOptionsType } from "embla-carousel";

  export type UseEmblaCarouselType = [
    (emblaRoot: HTMLElement | null) => void,
    (
      | {
          canScrollNext: () => boolean;
          canScrollPrev: () => boolean;
          scrollNext: () => void;
          scrollPrev: () => void;
          on: (event: string, callback: () => void) => void;
          off: (event: string, callback: () => void) => void;
        }
      | undefined
    )
  ];

  export default function useEmblaCarousel(
    options?: EmblaOptionsType,
    plugins?: any[]
  ): UseEmblaCarouselType;
}

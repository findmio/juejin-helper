import type { JuejinNuxtState } from './share/types';

declare global {
    interface Window {
        __NUXT__?: JuejinNuxtState;
    }
}
